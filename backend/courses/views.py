from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from core.models import User, OfficialSkillProficiency, RoleCompetencyRequirement
from core.views import SkillGapAnalysisView
from .models import Course, IGOTCourseEnrollment
from .provider import IGOTCourseProvider
from .recommendation import CourseRecommendationEngine


class CourseListView(APIView):
    """
    Public paginated, searchable, and filterable endpoint for the real iGOT course catalogue.
    Supports query parameters:
      - page: int (default 1)
      - page_size: int (default 12, max 100)
      - search: str (text search across title, description, provider, competencies, tags)
      - category: str (DIGITAL, DATA, GOVERNANCE, MANAGEMENT, BEHAVIOURAL, TECHNICAL)
      - filter / domain: str (backwards compatibility aliases for category)
      - provider: str (filter by course provider / organization)
      - language: str (filter by language)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        provider = IGOTCourseProvider()
        search = request.query_params.get('search', '').strip()
        filter_tag = request.query_params.get('filter', '').strip() or request.query_params.get('domain', '').strip()
        category = request.query_params.get('category', '').strip()
        provider_name = request.query_params.get('provider', '').strip()
        language = request.query_params.get('language', '').strip()

        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1

        try:
            page_size = int(request.query_params.get('page_size', 12))
        except ValueError:
            page_size = 12

        catalog = provider.get_courses(
            search=search,
            filter_tag=filter_tag,
            category=category,
            provider=provider_name,
            language=language,
            page=page,
            page_size=page_size
        )
        return Response(catalog)


class CourseDetailView(APIView):
    """
    Retrieves full details for a single real iGOT course by ID or canonical igot_course_id.
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        provider = IGOTCourseProvider()
        course = provider.get_course(course_id)
        if not course:
            return Response({'error': 'Course not found in official iGOT catalog.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'course': course})


class CatalogSyncView(APIView):
    """
    Production-safe administrative course catalogue sync endpoint.
    Restricted to authenticated staff/admin users.
    Supports optional body/query params:
      - limit: int (max records to sync)
      - source: str ('all', 'sunbird', 'content_list')
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        provider = IGOTCourseProvider()
        raw_limit = request.data.get('limit') or request.query_params.get('limit')
        limit = None
        if raw_limit:
            try:
                limit = int(raw_limit)
            except ValueError:
                limit = None

        source = request.data.get('source') or request.query_params.get('source') or 'all'
        batch_size = int(request.data.get('batch_size') or request.query_params.get('batch_size') or 200)

        report = provider.sync_courses(limit=limit, source=source, batch_size=batch_size)
        return Response({
            'status': 'success',
            'message': 'Course catalog synchronized successfully from official iGOT sources.',
            'report': report
        })


class RecommendedCoursesView(APIView):
    """
    Returns personalized course recommendations based on user skill gap analysis.
    Works against the full real synchronized iGOT catalogue with candidate pre-filtering.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Fetch gaps using core gap calculation for request.user
        gap_view = SkillGapAnalysisView()
        gap_response = gap_view.get(request)
        gap_data = gap_response.data.get('all_gaps', [])
        gap_id_set = {g['subskill_id'] for g in gap_data if g.get('gap', 0) > 0}

        # Select candidates efficiently from the full catalogue
        candidate_qs = Course.objects.filter(status='active')
        if not candidate_qs.exists():
            provider = IGOTCourseProvider()
            provider.sync_courses(limit=500)
            candidate_qs = Course.objects.filter(status='active')

        if gap_id_set:
            matched_courses = list(candidate_qs.filter(target_subskills__id__in=gap_id_set).distinct().prefetch_related('target_subskills', 'domain')[:50])
            matched_ids = {c.id for c in matched_courses}
            general_courses = list(candidate_qs.exclude(id__in=matched_ids).prefetch_related('target_subskills', 'domain')[:30])
            courses = matched_courses + general_courses
        else:
            courses = list(candidate_qs.prefetch_related('target_subskills', 'domain')[:60])

        # Fetch courses already completed by this user
        completed_ids = list(IGOTCourseEnrollment.objects.filter(
            user=user,
            status=IGOTCourseEnrollment.Status.COMPLETED
        ).values_list('course_id', flat=True))

        engine = CourseRecommendationEngine(courses)
        recommendations = engine.recommend_for_gaps(gap_data, completed_course_ids=completed_ids, top_k=6)

        recs_data = []
        for course, match_pct in recommendations:
            matched_gaps = [g['subskill_name'] for g in gap_data if g['subskill_id'] in [s.id for s in course.target_subskills.all()]]

            # Formulate authentic recommendation reason
            if matched_gaps:
                why_reason = f"Recommended because it helps strengthen your skills in {', '.join(matched_gaps[:2])}."
            elif user.designation:
                why_reason = f"Recommended for {user.designation} officials to enhance core operational competencies."
            else:
                why_reason = "Recommended to strengthen foundational public administration competencies."

            # Authentic recommendation badge
            badge = "RECOMMENDED FOR YOU" if match_pct >= 80.0 else "GOOD MATCH"

            fallback_category = "General"
            cat_lower = (course.category or "").lower()
            if "digital" in cat_lower or "security" in cat_lower:
                fallback_category = "Digital"
            elif "statist" in cat_lower or "data" in cat_lower:
                fallback_category = "Statistics"
            elif "tech" in cat_lower or "tool" in cat_lower:
                fallback_category = "Technical"
            elif "behav" in cat_lower or "decision" in cat_lower or "govern" in cat_lower:
                fallback_category = "Leadership"

            recs_data.append({
                'id': course.id,
                'igot_course_id': course.igot_course_id,
                'title': course.title,
                'provider': course.provider,
                'domain_name': course.domain.name if course.domain else course.category,
                'category': course.category,
                'description': course.description,
                'duration': course.duration,
                'duration_hours': course.duration_hours,
                'difficulty': course.difficulty,
                'url': course.igot_course_url or course.url,
                'igot_course_url': course.igot_course_url or course.url,
                'provider_name': course.provider,
                'thumbnail_url': course.thumbnail_url,
                'fallback_category': fallback_category,
                'rating': course.rating,
                'match_percentage': match_pct,
                'badge': badge,
                'why_this_course': why_reason,
                'target_subskills': [s.name for s in course.target_subskills.all()],
                'competencies': course.competencies or [s.name for s in course.target_subskills.all()[:3]],
                'topics': course.topics or [],
                'tags': course.tags or [],
                'addressed_gaps': matched_gaps,
                'last_synced_at': course.last_synced_at.strftime("%B %d, %Y") if course.last_synced_at else "Recently"
            })

        return Response({
            'official': user.get_full_name() or user.username,
            'designation': user.designation,
            'baseline_completed': user.baseline_completed,
            'recommendations': recs_data
        })
