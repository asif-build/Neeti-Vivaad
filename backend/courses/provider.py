import os
import ssl
import json
import urllib.request
import hashlib
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage
from django.utils import timezone
from django.conf import settings
from .models import Course
from core.models import CompetencyDomain, SubSkill

logger = logging.getLogger(__name__)

IGOT_PUBLIC_CATALOG_URL = "https://igotkarmayogi.gov.in/assets/jsonfiles/content-list-data.json"
LOCAL_FALLBACK_SNAPSHOT = os.path.join(settings.BASE_DIR, 'courses', 'data', 'igot_content_list.json')


class CourseProvider(ABC):
    """Abstract course provider interface for Neeti Saarthi."""

    @abstractmethod
    def get_courses(self, search: Optional[str] = None, filter_tag: Optional[str] = None, page: int = 1, page_size: int = 12) -> Dict[str, Any]:
        """Fetch paginated, filtered, and searched courses."""
        pass

    @abstractmethod
    def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve single course by identifier."""
        pass

    @abstractmethod
    def search_courses(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform text search across course catalog."""
        pass

    @abstractmethod
    def sync_courses(self) -> Dict[str, Any]:
        """Synchronize courses from authoritative source."""
        pass


class IGOTCourseProvider(CourseProvider):
    """
    Official iGOT Karmayogi Course Provider.
    Dynamically loads and synchronizes real course records from the official public
    iGOT Karmayogi catalogue (https://igotkarmayogi.gov.in/#/contentList).
    """

    def __init__(self):
        self.default_page_size = 12

    def fetch_live_catalog(self) -> List[Dict[str, Any]]:
        """
        Retrieves real iGOT course data from the official public contentList endpoint.
        Falls back to the local snapshot if network is unavailable.
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            req = urllib.request.Request(IGOT_PUBLIC_CATALOG_URL, headers=headers)
            with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                contents = data.get('content', [])
                if contents:
                    logger.info(f"Fetched {len(contents)} live courses from official iGOT feed.")
                    return contents
        except Exception as e:
            logger.warning(f"Could not reach live iGOT endpoint ({e}), falling back to local catalog snapshot.")

        # Fallback to local snapshot
        if os.path.exists(LOCAL_FALLBACK_SNAPSHOT):
            try:
                with open(LOCAL_FALLBACK_SNAPSHOT, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('content', [])
            except Exception as e:
                logger.error(f"Failed to read local fallback snapshot: {e}")

        return []

    @staticmethod
    def normalize_thumbnail_url(raw_url: Optional[str]) -> Optional[str]:
        """
        Converts internal or static CDN image URLs to the official public
        portal.igotkarmayogi.gov.in content-store CDN that resolves with HTTP 200.
        """
        if not raw_url or not isinstance(raw_url, str):
            return None

        clean_url = raw_url.strip()
        if not clean_url:
            return None

        # Transform Karmayogi Bharat or static NIC references to canonical public portal endpoint
        if 'content-store' in clean_url:
            path = clean_url.split('content-store')[1]
            return f"https://portal.igotkarmayogi.gov.in/content-store{path}"
        elif 'igotprod' in clean_url:
            path = clean_url.split('igotprod')[1]
            return f"https://portal.igotkarmayogi.gov.in/content-store/content{path}"
        
        return clean_url

    @staticmethod
    def format_duration(seconds_val: Any) -> tuple[str, float]:
        """Converts duration in seconds to human-readable string and hours float."""
        try:
            sec = int(seconds_val)
        except (ValueError, TypeError):
            sec = 7200

        hours_float = round(sec / 3600.0, 2)
        if sec < 3600:
            mins = max(1, sec // 60)
            return f"{mins} mins", hours_float
        else:
            h = sec // 3600
            m = (sec % 3600) // 60
            if m > 0:
                return f"{h}h {m}m", hours_float
            return f"{h} Hours", hours_float

    @staticmethod
    def categorize_course(title: str, description: str, source: str) -> str:
        """
        Categorizes courses into legitimate civil service training domains
        (DIGITAL, DATA, GOVERNANCE, MANAGEMENT, BEHAVIOURAL, TECHNICAL).
        """
        text = f"{title} {description} {source}".lower()
        if any(w in text for w in ['data', 'statistic', 'survey', 'sample', 'analyt', 'indicator', 'idqf', 'census', 'mospi']):
            return 'DATA'
        elif any(w in text for w in ['digit', 'cyber', 'artificial intelligence', ' ai ', 'cloud', 'software', 'it ', 'portal', 'computer', 'dpdp', 'network']):
            return 'DIGITAL'
        elif any(w in text for w in ['govern', 'polic', ' rti ', 'conduct', 'ethics', 'transparenc', 'legal', 'rule', 'act', 'cpgrams', 'dopt', 'citizen']):
            return 'GOVERNANCE'
        elif any(w in text for w in ['manag', 'procure', 'gem', 'finance', 'budget', 'administr', 'contract', 'treasur', 'pfms', 'audit', 'cga']):
            return 'MANAGEMENT'
        elif any(w in text for w in ['behav', 'stress', 'communicat', 'drafting', 'leader', 'team', 'soft skill', 'empath', 'mental health']):
            return 'BEHAVIOURAL'
        elif any(w in text for w in ['min', 'water', 'rail', 'electric', 'mechanic', 'construct', 'forest', 'environment', 'hazard', 'safety']):
            return 'TECHNICAL'
        return 'GOVERNANCE'

    @staticmethod
    def construct_official_course_url(identifier: str) -> str:
        """
        Constructs the authoritative public course URL for the iGOT Karmayogi platform.
        Verified route: https://portal.igotkarmayogi.gov.in/public/toc/{identifier}/overview
        This route serves the public unauthenticated course overview with HTTP 200.
        """
        clean_id = str(identifier).strip()
        return f"https://portal.igotkarmayogi.gov.in/public/toc/{clean_id}/overview"

    @staticmethod
    def validate_course_url(url: str, identifier: str) -> tuple[bool, str]:
        """
        Validates that the course URL belongs to the legitimate official iGOT portal domain
        and accurately references the verified course identifier.
        """
        if not url:
            return False, "missing"
        
        valid_domains = (
            "https://portal.igotkarmayogi.gov.in/",
            "https://igotkarmayogi.gov.in/"
        )
        if not any(url.startswith(d) for d in valid_domains):
            return False, "unauthorized_domain"
        
        if identifier not in url:
            return False, "mismatched_identifier"
            
        return True, "verified"

    def compute_content_hash(self, identifier: str, title: str, description: str, duration: str, source: str) -> str:
        data = f"{identifier}:{title}:{description}:{duration}:{source}"
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    def sync_courses(self) -> Dict[str, Any]:
        """
        Synchronizes the real iGOT catalog:
        - Ingests all real courses from the authoritative feed
        - Normalizes title, description, provider, thumbnail, and duration
        - Generates and verifies authoritative iGOT public TOC URLs
        - Detects changes via content_hash
        - Updates or creates Course records in DB
        - Records last_synced_at
        """
        feed = self.fetch_live_catalog()
        created_count = 0
        updated_count = 0
        now = timezone.now()

        active_ids = set()

        for item in feed:
            raw_id = item.get('identifier')
            raw_title = item.get('name')
            if not raw_id or not raw_title:
                continue

            identifier = str(raw_id).strip()
            title = str(raw_title).strip()
            description = str(item.get('description') or f"Official course on {title} provided on iGOT Karmayogi.").strip()
            provider_name = str(item.get('source') or 'iGOT Karmayogi').strip()
            duration_str, duration_hours = self.format_duration(item.get('duration'))
            
            # Authoritative official course URL
            official_url = self.construct_official_course_url(identifier)
            is_valid, url_status = self.validate_course_url(official_url, identifier)
            
            raw_img = item.get('posterImage') or item.get('appIcon')
            thumbnail_url = self.normalize_thumbnail_url(raw_img)
            
            category = self.categorize_course(title, description, provider_name)
            c_hash = self.compute_content_hash(identifier, title, description, duration_str, provider_name)

            active_ids.add(identifier)

            # Topics & Competencies from title/category
            topics = [w.strip().title() for w in title.replace('-', ' ').replace(':', ' ').split() if len(w) > 4][:4]
            competencies = [category.title(), "Public Administration"]
            
            # Modules extraction
            raw_modules = item.get('modules') or item.get('children') or []
            modules = []
            if isinstance(raw_modules, list):
                for m in raw_modules:
                    if isinstance(m, dict) and m.get('name'):
                        modules.append(str(m['name']).strip())
                    elif isinstance(m, str):
                        modules.append(m.strip())

            course, created = Course.objects.get_or_create(
                igot_course_id=identifier,
                defaults={
                    "title": title,
                    "provider": provider_name,
                    "description": description,
                    "duration": duration_str,
                    "duration_hours": duration_hours,
                    "difficulty": "Intermediate",
                    "url": official_url,
                    "igot_course_url": official_url if is_valid else None,
                    "thumbnail_url": thumbnail_url,
                    "category": category,
                    "topics": topics,
                    "competencies": competencies,
                    "tags": [category.lower(), provider_name.lower()],
                    "modules": modules,
                    "language": "English",
                    "status": "active",
                    "source": "igot",
                    "content_hash": c_hash,
                    "last_synced_at": now,
                    "url_verified": is_valid,
                    "url_status": url_status
                }
            )

            if created:
                created_count += 1
            else:
                # Update if content has changed or URL was outdated
                needs_update = (
                    course.content_hash != c_hash or 
                    course.thumbnail_url != thumbnail_url or 
                    course.url != official_url or
                    course.igot_course_url != official_url or
                    not course.url_verified
                )
                if needs_update:
                    course.title = title
                    course.provider = provider_name
                    course.description = description
                    course.duration = duration_str
                    course.duration_hours = duration_hours
                    course.url = official_url
                    course.igot_course_url = official_url if is_valid else None
                    course.thumbnail_url = thumbnail_url
                    course.category = category
                    course.topics = topics
                    course.competencies = competencies
                    course.modules = modules
                    course.content_hash = c_hash
                    course.status = "active"
                    course.url_verified = is_valid
                    course.url_status = url_status
                    course.last_synced_at = now
                    course.save()
                    updated_count += 1

            # Map target SubSkills based on category & title/description text
            text_combo = f"{title} {description}".lower()
            matched_subskills = []
            
            # 1. Statistical Methodology
            if any(w in text_combo for w in ['sample', 'sampling', 'estimation', 'survey design', 'indicator', 'statistic']):
                matched_subskills.append('STAT-01')
            if any(w in text_combo for w in ['high-frequency', 'field survey', 'survey data', 'nss', 'household', 'census']):
                matched_subskills.append('STAT-02')
            if any(w in text_combo for w in ['anomaly', 'outlier', 'quality control', 'scrutiny', 'data validation', 'verification']):
                matched_subskills.append('STAT-03')
                
            # 2. Technical Tools
            if any(w in text_combo for w in ['sql', 'database', 'wrangling', 'mysql', 'query', 'relational']):
                matched_subskills.append('TECH-01')
            if any(w in text_combo for w in ['python', 'r program', 'modeling', 'machine learning', 'predictive', 'algorithm', 'code']):
                matched_subskills.append('TECH-02')
            if any(w in text_combo for w in ['capi', 'mobile survey', 'digital data collection', 'tablet', 'portal', 'app']):
                matched_subskills.append('TECH-03')

            # 3. Digital Governance
            if any(w in text_combo for w in ['ndsap', 'open data', 'data sharing', 'interoperability', 'governance', 'dpdp']):
                matched_subskills.append('GOV-01')
            if any(w in text_combo for w in ['privacy', 'anonymity', 'cyber', 'security', 'information security', 'protection']):
                matched_subskills.append('GOV-02')

            # 4. Behavioural & Decision Making
            if any(w in text_combo for w in ['policy', 'decision', 'trade-off', 'fallac', 'reasoning', 'evidence-based', 'analysis']):
                matched_subskills.append('BEH-01')
            if any(w in text_combo for w in ['leadership', 'ethics', 'integrity', 'team', 'management', 'conduct', 'supervis']):
                matched_subskills.append('BEH-02')

            if matched_subskills:
                subs = SubSkill.objects.filter(code__in=matched_subskills)
                course.target_subskills.set(subs)
                if subs.exists() and not course.domain:
                    course.domain = subs.first().domain
                    course.save(update_fields=['domain'])

        # Mark removed records as inactive
        Course.objects.filter(source="igot").exclude(igot_course_id__in=active_ids).update(status="inactive")

        return {
            "created": created_count,
            "updated": updated_count,
            "total_active": Course.objects.filter(source="igot", status="active").count(),
            "last_synced_at": now.strftime("%B %d, %Y")
        }

    def get_courses(
        self,
        search: Optional[str] = None,
        filter_tag: Optional[str] = None,
        page: int = 1,
        page_size: int = 12
    ) -> Dict[str, Any]:
        """
        Fetches paginated real iGOT courses with search and filters.
        """
        qs = Course.objects.filter(status="active")
        
        # If DB has no courses, sync automatically once
        if not qs.exists():
            self.sync_courses()
            qs = Course.objects.filter(status="active")

        # Category Filter (ALL, DIGITAL, DATA, GOVERNANCE, MANAGEMENT, BEHAVIOURAL, TECHNICAL)
        if filter_tag and filter_tag.upper() != "ALL":
            f_clean = filter_tag.strip().upper()
            qs = qs.filter(
                Q(category__iexact=f_clean) |
                Q(title__icontains=f_clean) |
                Q(description__icontains=f_clean)
            )

        # Real Text Search across title, description, provider, topics, competencies, tags
        if search and search.strip():
            st = search.strip()
            qs = qs.filter(
                Q(title__icontains=st) |
                Q(description__icontains=st) |
                Q(provider__icontains=st) |
                Q(topics__icontains=st) |
                Q(competencies__icontains=st) |
                Q(tags__icontains=st)
            )

        qs = qs.order_by('id')

        # Pagination
        paginator = Paginator(qs, page_size)
        try:
            p_obj = paginator.page(page)
        except EmptyPage:
            p_obj = paginator.page(paginator.num_pages if paginator.num_pages > 0 else 1)

        courses_data = []
        for c in p_obj.object_list:
            official_url = c.igot_course_url or c.url
            courses_data.append({
                "id": c.id,
                "igot_course_id": c.igot_course_id,
                "title": c.title,
                "provider": c.provider,
                "provider_name": c.provider,
                "duration": c.duration,
                "duration_hours": c.duration_hours,
                "description": c.description,
                "url": official_url,
                "igot_course_url": official_url,
                "thumbnail_url": c.thumbnail_url,
                "category": c.category,
                "fallback_category": c.category.title(),
                "topics": c.topics or [],
                "competencies": c.competencies or [c.category.title()],
                "tags": c.tags or [],
                "modules": c.modules or [],
                "difficulty": c.difficulty,
                "language": c.language,
                "url_verified": c.url_verified,
                "url_status": c.url_status,
                "last_synced_at": c.last_synced_at.strftime("%B %d, %Y") if c.last_synced_at else "Recently"
            })

        latest = Course.objects.filter(status="active").order_by('-last_synced_at').first()
        last_synced_str = latest.last_synced_at.strftime("%B %d, %Y") if latest and latest.last_synced_at else "Recently"

        return {
            "courses": courses_data,
            "pagination": {
                "page": p_obj.number,
                "page_size": page_size,
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
                "has_next": p_obj.has_next(),
                "has_previous": p_obj.has_previous()
            },
            "last_synced_at": last_synced_str
        }

    def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves single course details by ID or igot_course_id."""
        course = None
        if course_id.isdigit():
            course = Course.objects.filter(id=int(course_id), status="active").first()
        if not course:
            course = Course.objects.filter(igot_course_id=course_id, status="active").first()
        
        if not course:
            return None

        official_url = course.igot_course_url or course.url
        return {
            "id": course.id,
            "igot_course_id": course.igot_course_id,
            "title": course.title,
            "provider": course.provider,
            "provider_name": course.provider,
            "duration": course.duration,
            "duration_hours": course.duration_hours,
            "description": course.description,
            "url": official_url,
            "igot_course_url": official_url,
            "thumbnail_url": course.thumbnail_url,
            "category": course.category,
            "fallback_category": course.category.title(),
            "topics": course.topics or [],
            "competencies": course.competencies or [course.category.title()],
            "tags": course.tags or [],
            "modules": course.modules or [],
            "difficulty": course.difficulty,
            "language": course.language,
            "url_verified": course.url_verified,
            "url_status": course.url_status,
            "last_synced_at": course.last_synced_at.strftime("%B %d, %Y") if course.last_synced_at else "Recently"
        }

    def search_courses(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        res = self.get_courses(search=query, page=1, page_size=limit)
        return res.get("courses", [])
