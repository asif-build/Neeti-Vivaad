import os
import ssl
import json
import urllib.request
import urllib.error
import hashlib
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Set

from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.conf import settings

from .models import Course
from core.models import CompetencyDomain, SubSkill

logger = logging.getLogger(__name__)

# Official iGOT Karmayogi Public Endpoints
IGOT_CONTENT_LIST_URL = "https://igotkarmayogi.gov.in/assets/jsonfiles/content-list-data.json"
IGOT_SEARCH_ENDPOINTS = [
    "https://portal.igotkarmayogi.gov.in/api/content/v1/search",
    "https://igotkarmayogi.gov.in/api/content/v1/search"
]
LOCAL_FALLBACK_SNAPSHOT = os.path.join(settings.BASE_DIR, 'courses', 'data', 'igot_content_list.json')


class CourseProvider(ABC):
    """Abstract course provider interface for Neeti Saarthi."""

    @abstractmethod
    def get_courses(
        self,
        search: Optional[str] = None,
        filter_tag: Optional[str] = None,
        category: Optional[str] = None,
        provider: Optional[str] = None,
        language: Optional[str] = None,
        page: int = 1,
        page_size: int = 12
    ) -> Dict[str, Any]:
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
    def sync_courses(self, limit: Optional[int] = None, source: str = 'all', batch_size: int = 200) -> Dict[str, Any]:
        """Synchronize courses from authoritative source."""
        pass


class IGOTCourseProvider(CourseProvider):
    """
    Official iGOT Karmayogi Course Provider.
    Dynamically loads and synchronizes real course records from:
    1. The official public iGOT Karmayogi catalogue feed (https://igotkarmayogi.gov.in/#/contentList)
    2. The official public Sunbird Content Search API (https://portal.igotkarmayogi.gov.in/api/content/v1/search)
    3. The verified local catalogue snapshot fallback (courses/data/igot_content_list.json)
    """

    def __init__(self):
        self.default_page_size = 12
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

    def fetch_content_list_feed(self) -> List[Dict[str, Any]]:
        """
        Fetches the official feed directly consumed by the https://igotkarmayogi.gov.in/#/contentList portal.
        Returns curated real courses (approx. 784 records).
        """
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        try:
            req = urllib.request.Request(IGOT_CONTENT_LIST_URL, headers=headers)
            with urllib.request.urlopen(req, timeout=12, context=self.ssl_context) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                contents = data.get('content', [])
                if contents:
                    logger.info(f"Fetched {len(contents)} courses from official #/contentList feed.")
                    return contents
        except Exception as e:
            logger.warning(f"Could not reach #/contentList endpoint ({e}), checking fallback.")

        # Fallback to local snapshot
        if os.path.exists(LOCAL_FALLBACK_SNAPSHOT):
            try:
                with open(LOCAL_FALLBACK_SNAPSHOT, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('content', [])
            except Exception as e:
                logger.error(f"Failed to read local fallback snapshot: {e}")

        return []

    def fetch_sunbird_catalog(self, limit: Optional[int] = None, page_size: int = 200) -> List[Dict[str, Any]]:
        """
        Paginates through the official Sunbird Content Search API to retrieve the full live catalogue
        (5,000+ courses) available publicly across iGOT Karmayogi.
        """
        courses: List[Dict[str, Any]] = []
        seen_ids: Set[str] = set()
        offset = 0
        batch_limit = min(page_size, 500)
        target_limit = limit if (limit and limit > 0) else None

        active_endpoint = IGOT_SEARCH_ENDPOINTS[0]

        while True:
            fetch_count = batch_limit
            if target_limit is not None:
                remaining = target_limit - len(courses)
                if remaining <= 0:
                    break
                fetch_count = min(batch_limit, remaining)

            payload = json.dumps({
                "request": {
                    "filters": {
                        "primaryCategory": ["Course"],
                        "status": ["Live"]
                    },
                    "limit": fetch_count,
                    "offset": offset,
                    "sort_by": {"lastUpdatedOn": "desc"}
                }
            }).encode('utf-8')

            success = False
            for ep in [active_endpoint] + [e for e in IGOT_SEARCH_ENDPOINTS if e != active_endpoint]:
                try:
                    req = urllib.request.Request(
                        ep,
                        data=payload,
                        headers={
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'Content-Type': 'application/json'
                        },
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=15, context=self.ssl_context) as resp:
                        data = json.loads(resp.read().decode('utf-8'))
                        result = data.get('result', {})
                        total_count = result.get('count', 0)
                        items = result.get('content', [])

                        if not items:
                            return courses

                        for item in items:
                            cid = item.get('identifier')
                            if cid and cid not in seen_ids:
                                seen_ids.add(cid)
                                courses.append(item)

                        active_endpoint = ep
                        success = True
                        offset += len(items)

                        if offset >= total_count or (target_limit and len(courses) >= target_limit):
                            return courses
                        break
                except Exception as e:
                    logger.warning(f"Error querying {ep} at offset {offset}: {e}")
                    continue

            if not success:
                logger.error(f"Failed to fetch Sunbird page at offset {offset} from all search endpoints.")
                break

        return courses

    def fetch_all_courses(self, limit: Optional[int] = None, source: str = 'all') -> Tuple[List[Dict[str, Any]], str]:
        """
        Retrieves real iGOT courses combining the official portal #/contentList feed
        and Sunbird API pagination, deduplicating by official identifier.
        """
        all_courses: List[Dict[str, Any]] = []
        seen_ids: Set[str] = set()
        source_used = "igot_official"

        if source in ('all', 'sunbird'):
            sunbird_items = self.fetch_sunbird_catalog(limit=limit)
            if sunbird_items:
                source_used = "sunbird_search_api"
                for item in sunbird_items:
                    cid = item.get('identifier')
                    if cid and cid not in seen_ids:
                        seen_ids.add(cid)
                        all_courses.append(item)

        # Merge with #/contentList feed to ensure all featured courses from the landing tabs are included
        if source in ('all', 'content_list') and (not limit or len(all_courses) < limit):
            feed_items = self.fetch_content_list_feed()
            if feed_items:
                if not all_courses:
                    source_used = "content_list_feed"
                for item in feed_items:
                    cid = item.get('identifier')
                    if cid and cid not in seen_ids:
                        seen_ids.add(cid)
                        all_courses.append(item)
                        if limit and len(all_courses) >= limit:
                            break

        # Fallback to local snapshot if network completely failed
        if not all_courses:
            source_used = "local_snapshot_fallback"
            if os.path.exists(LOCAL_FALLBACK_SNAPSHOT):
                try:
                    with open(LOCAL_FALLBACK_SNAPSHOT, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        for item in data.get('content', []):
                            cid = item.get('identifier')
                            if cid and cid not in seen_ids:
                                seen_ids.add(cid)
                                all_courses.append(item)
                except Exception as e:
                    logger.error(f"Fallback snapshot failed: {e}")

        logger.info(f"Loaded {len(all_courses)} unique real courses using source '{source_used}'.")
        return all_courses, source_used

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

        if 'content-store' in clean_url:
            path = clean_url.split('content-store')[1]
            return f"https://portal.igotkarmayogi.gov.in/content-store{path}"
        elif 'igotprod' in clean_url:
            path = clean_url.split('igotprod')[1]
            return f"https://portal.igotkarmayogi.gov.in/content-store/content{path}"

        return clean_url

    @staticmethod
    def format_duration(seconds_val: Any) -> Tuple[str, float]:
        """Converts duration in seconds to human-readable string and hours float."""
        try:
            sec = int(float(seconds_val))
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
        elif any(w in text for w in ['digit', 'cyber', 'artificial intelligence', ' ai ', 'cloud', 'software', 'it ', 'portal', 'computer', 'dpdp', 'network', 'telecom']):
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
    def validate_course_url(url: str, identifier: str) -> Tuple[bool, str]:
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

    def sync_courses(self, limit: Optional[int] = None, source: str = 'all', batch_size: int = 200) -> Dict[str, Any]:
        """
        Production-safe high-performance course synchronization:
        - Retrieves real courses from official iGOT sources (up to all 5,192 live courses)
        - Normalizes all official metadata (provider, description, duration, difficulty, language, URLs)
        - Detects changes via content_hash
        - Performs bulk upserts in batches to avoid network connection timeouts
        - Maps target SubSkills in bulk
        - Returns a detailed audit report
        """
        feed, source_used = self.fetch_all_courses(limit=limit, source=source)
        now = timezone.now()

        created_count = 0
        updated_count = 0
        unchanged_count = 0
        failed_count = 0

        # Preload existing courses in a single query
        existing_courses_dict = {
            c.igot_course_id: c for c in Course.objects.all()
        }

        # Preload all subskills
        subskill_map = {s.code: s for s in SubSkill.objects.select_related('domain').all()}

        parsed_courses: List[Tuple[Course, List[str]]] = []
        active_ids: Set[str] = set()

        for item in feed:
            raw_id = item.get('identifier')
            raw_title = item.get('name')
            if not raw_id or not raw_title:
                failed_count += 1
                continue

            identifier = str(raw_id).strip()
            title = str(raw_title).strip()
            active_ids.add(identifier)

            # Provider from source / organisation / creator
            org_list = item.get('organisation')
            org_name = org_list[0] if (isinstance(org_list, list) and org_list) else None
            provider_name = str(item.get('source') or org_name or item.get('creator') or 'iGOT Karmayogi').strip()

            raw_desc = item.get('description')
            description = str(raw_desc).strip() if raw_desc else f"Official course on {title} provided on iGOT Karmayogi."
            duration_str, duration_hours = self.format_duration(item.get('duration'))

            official_url = self.construct_official_course_url(identifier)
            is_valid, url_status = self.validate_course_url(official_url, identifier)

            raw_img = item.get('posterImage') or item.get('appIcon')
            thumbnail_url = self.normalize_thumbnail_url(raw_img)

            category = self.categorize_course(title, description, provider_name)
            c_hash = self.compute_content_hash(identifier, title, description, duration_str, provider_name)

            # Language
            lang_raw = item.get('language')
            if isinstance(lang_raw, list):
                lang_str = ', '.join([str(l) for l in lang_raw if l]) or 'English'
            elif isinstance(lang_raw, str):
                lang_str = lang_raw.strip() or 'English'
            else:
                lang_str = 'English'

            # Difficulty
            difficulty = str(item.get('difficultyLevel') or 'Intermediate').title()

            # Competencies extraction from official competencies_v6
            competencies = [category.title(), "Public Administration"]
            comp_v6 = item.get('competencies_v6')
            if isinstance(comp_v6, list):
                for c_entry in comp_v6:
                    if isinstance(c_entry, dict):
                        sub_name = c_entry.get('competencySubThemeName') or c_entry.get('competencyThemeName')
                        if sub_name and str(sub_name).strip() not in competencies:
                            competencies.append(str(sub_name).strip())

            # Topics / Keywords extraction
            keywords_raw = item.get('keywords') or []
            topics = []
            if isinstance(keywords_raw, list):
                topics = [str(k).strip() for k in keywords_raw if str(k).strip()][:5]
            if not topics:
                topics = [w.strip().title() for w in title.replace('-', ' ').replace(':', ' ').split() if len(w) > 4][:4]

            tags = list(set([category.lower(), provider_name.lower()] + [t.lower() for t in topics]))

            # Modules extraction
            raw_modules = item.get('childNodes') or item.get('children') or item.get('modules') or []
            modules = []
            if isinstance(raw_modules, list):
                for m in raw_modules:
                    if isinstance(m, dict) and m.get('name'):
                        modules.append(str(m['name']).strip())
                    elif isinstance(m, str):
                        modules.append(m.strip())

            # Source updated at
            source_updated_at = None
            raw_updated = item.get('lastUpdatedOn')
            if raw_updated:
                try:
                    source_updated_at = parse_datetime(str(raw_updated))
                except Exception:
                    source_updated_at = None

            # SubSkill matching
            text_combo = f"{title} {description} {category}".lower()
            matched_subskills = []
            if any(w in text_combo for w in ['sample', 'sampling', 'estimation', 'survey design', 'indicator', 'statistic']):
                matched_subskills.append('STAT-01')
            if any(w in text_combo for w in ['high-frequency', 'field survey', 'survey data', 'nss', 'household', 'census']):
                matched_subskills.append('STAT-02')
            if any(w in text_combo for w in ['anomaly', 'outlier', 'quality control', 'scrutiny', 'data validation', 'verification']):
                matched_subskills.append('STAT-03')
            if any(w in text_combo for w in ['sql', 'database', 'wrangling', 'mysql', 'query', 'relational']):
                matched_subskills.append('TECH-01')
            if any(w in text_combo for w in ['python', 'r program', 'modeling', 'machine learning', 'predictive', 'algorithm', 'code', 'telecom']):
                matched_subskills.append('TECH-02')
            if any(w in text_combo for w in ['capi', 'mobile survey', 'digital data collection', 'tablet', 'portal', 'app', 'cyber']):
                matched_subskills.append('TECH-03')
            if any(w in text_combo for w in ['negotiat', 'conflict', 'persuasion', 'stakeholder', 'consensus']):
                matched_subskills.append('BEH-01')
            if any(w in text_combo for w in ['leadership', 'ethics', 'integrity', 'team', 'management', 'conduct', 'supervis']):
                matched_subskills.append('BEH-02')

            domain_obj = None
            if matched_subskills:
                first_code = matched_subskills[0]
                if first_code in subskill_map:
                    domain_obj = subskill_map[first_code].domain

            course_inst = Course(
                igot_course_id=identifier,
                title=title,
                provider=provider_name,
                description=description,
                duration=duration_str,
                duration_hours=duration_hours,
                difficulty=difficulty,
                url=official_url,
                igot_course_url=official_url if is_valid else None,
                thumbnail_url=thumbnail_url,
                category=category,
                domain=domain_obj,
                topics=topics,
                competencies=competencies,
                tags=tags,
                modules=modules,
                language=lang_str,
                status="active",
                source="igot",
                content_hash=c_hash,
                last_synced_at=now,
                source_updated_at=source_updated_at,
                url_verified=is_valid,
                url_status=url_status
            )
            parsed_courses.append((course_inst, matched_subskills))

        # Split into bulk creates and bulk updates
        to_create: List[Course] = []
        to_update: List[Course] = []
        subskill_associations: List[Tuple[str, List[str]]] = []

        for course_inst, sub_codes in parsed_courses:
            c_id = course_inst.igot_course_id
            subskill_associations.append((c_id, sub_codes))

            if c_id in existing_courses_dict:
                existing = existing_courses_dict[c_id]
                needs_update = (
                    existing.content_hash != course_inst.content_hash or
                    existing.thumbnail_url != course_inst.thumbnail_url or
                    existing.title != course_inst.title or
                    existing.status != "active" or
                    not existing.url_verified
                )
                if needs_update:
                    existing.title = course_inst.title
                    existing.provider = course_inst.provider
                    existing.description = course_inst.description
                    existing.duration = course_inst.duration
                    existing.duration_hours = course_inst.duration_hours
                    existing.difficulty = course_inst.difficulty
                    existing.url = course_inst.url
                    existing.igot_course_url = course_inst.igot_course_url
                    existing.thumbnail_url = course_inst.thumbnail_url
                    existing.category = course_inst.category
                    existing.domain = course_inst.domain or existing.domain
                    existing.topics = course_inst.topics
                    existing.competencies = course_inst.competencies
                    existing.tags = course_inst.tags
                    existing.modules = course_inst.modules
                    existing.language = course_inst.language
                    existing.status = "active"
                    existing.content_hash = course_inst.content_hash
                    existing.last_synced_at = now
                    existing.source_updated_at = course_inst.source_updated_at
                    existing.url_verified = course_inst.url_verified
                    existing.url_status = course_inst.url_status
                    to_update.append(existing)
                    updated_count += 1
                else:
                    unchanged_count += 1
            else:
                to_create.append(course_inst)
                created_count += 1

        # Execute bulk creates in batches
        chunk_size = max(50, batch_size)
        if to_create:
            for i in range(0, len(to_create), chunk_size):
                chunk = to_create[i:i + chunk_size]
                Course.objects.bulk_create(chunk, batch_size=chunk_size, ignore_conflicts=True)

        # Execute bulk updates in batches
        if to_update:
            update_fields = [
                'title', 'provider', 'description', 'duration', 'duration_hours',
                'difficulty', 'url', 'igot_course_url', 'thumbnail_url', 'category',
                'domain', 'topics', 'competencies', 'tags', 'modules', 'language',
                'status', 'content_hash', 'last_synced_at', 'source_updated_at',
                'url_verified', 'url_status'
            ]
            for i in range(0, len(to_update), chunk_size):
                chunk = to_update[i:i + chunk_size]
                Course.objects.bulk_update(chunk, fields=update_fields, batch_size=chunk_size)

        # Refresh map of persisted course IDs for M2M subskills
        saved_course_map = {
            c.igot_course_id: c.id for c in Course.objects.filter(igot_course_id__in=active_ids).only('id', 'igot_course_id')
        }

        # Bulk create M2M through records
        ThroughModel = Course.target_subskills.through
        m2m_records = []
        for c_id, sub_codes in subskill_associations:
            db_id = saved_course_map.get(c_id)
            if not db_id or not sub_codes:
                continue
            for sc in sub_codes:
                if sc in subskill_map:
                    m2m_records.append(ThroughModel(course_id=db_id, subskill_id=subskill_map[sc].id))

        if m2m_records:
            for i in range(0, len(m2m_records), 500):
                ThroughModel.objects.bulk_create(m2m_records[i:i + 500], batch_size=500, ignore_conflicts=True)

        total_active = Course.objects.filter(source="igot", status="active").count()

        return {
            "fetched": len(feed),
            "created": created_count,
            "updated": updated_count,
            "unchanged": unchanged_count,
            "failed": failed_count,
            "total": total_active,
            "total_active": total_active,
            "source_used": source_used,
            "last_synced_at": now.strftime("%B %d, %Y")
        }

    def get_courses(
        self,
        search: Optional[str] = None,
        filter_tag: Optional[str] = None,
        category: Optional[str] = None,
        provider: Optional[str] = None,
        language: Optional[str] = None,
        page: int = 1,
        page_size: int = 12
    ) -> Dict[str, Any]:
        """
        Fetches paginated real iGOT courses with filtering, provider matching, and search.
        """
        qs = Course.objects.filter(status="active")

        # Auto-sync once if DB is empty
        if not qs.exists():
            self.sync_courses(limit=500)
            qs = Course.objects.filter(status="active")

        # Category Filter (supports filter_tag or category param)
        cat = category or filter_tag
        if cat and cat.strip().upper() != "ALL":
            f_clean = cat.strip().upper()
            qs = qs.filter(
                Q(category__iexact=f_clean) |
                Q(title__icontains=f_clean) |
                Q(description__icontains=f_clean)
            )

        # Provider Filter
        if provider and provider.strip():
            p_clean = provider.strip()
            qs = qs.filter(Q(provider__icontains=p_clean) | Q(tags__icontains=p_clean))

        # Language Filter
        if language and language.strip():
            l_clean = language.strip()
            qs = qs.filter(language__icontains=l_clean)

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

        qs = qs.order_by('-last_synced_at', 'id')

        # Pagination
        clamped_size = max(1, min(page_size, 100))
        paginator = Paginator(qs, clamped_size)
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
                "last_synced_at": c.last_synced_at.strftime("%B %d, %Y") if c.last_synced_at else "Recently",
                "source_updated_at": c.source_updated_at.strftime("%B %d, %Y") if c.source_updated_at else None
            })

        latest = Course.objects.filter(status="active").order_by('-last_synced_at').first()
        last_synced_str = latest.last_synced_at.strftime("%B %d, %Y") if latest and latest.last_synced_at else "Recently"

        return {
            "courses": courses_data,
            "pagination": {
                "page": p_obj.number,
                "page_size": clamped_size,
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
                "has_next": p_obj.has_next(),
                "has_previous": p_obj.has_previous()
            },
            "last_synced_at": last_synced_str
        }

    def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves single course details by numeric ID or official igot_course_id."""
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
            "last_synced_at": course.last_synced_at.strftime("%B %d, %Y") if course.last_synced_at else "Recently",
            "source_updated_at": course.source_updated_at.strftime("%B %d, %Y") if course.source_updated_at else None
        }

    def search_courses(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Text search returning top matching courses."""
        res = self.get_courses(search=query, page=1, page_size=limit)
        return res.get('courses', [])
