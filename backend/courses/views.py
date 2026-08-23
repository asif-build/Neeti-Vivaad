from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import User, OfficialSkillProficiency, RoleCompetencyRequirement
from core.views import SkillGapAnalysisView
from .models import Course
from .recommendation import CourseRecommendationEngine

class CourseListView(APIView):
    def get(self, request):
        courses = Course.objects.all()
        data = []
        for c in courses:
            data.append({
                'id': c.id,
                'igot_course_id': c.igot_course_id,
                'title': c.title,
                'provider': c.provider,
                'domain_name': c.domain.name if c.domain else 'General',
                'description': c.description,
                'duration_hours': c.duration_hours,
                'difficulty': c.difficulty,
                'url': c.url,
                'rating': c.rating,
                'target_subskills': [s.name for s in c.target_subskills.all()]
            })
        return Response({'courses': data})

class RecommendedCoursesView(APIView):
    def get(self, request):
        user = request.user if request.user.is_authenticated else User.objects.filter(role='OFFICIAL').first()
        if not user:
            user = User.objects.first()

        # Fetch gaps using core gap calculation
        gap_view = SkillGapAnalysisView()
        gap_response = gap_view.get(request)
        gap_data = gap_response.data.get('all_gaps', [])

        courses = Course.objects.prefetch_related('target_subskills', 'domain').all()
        engine = CourseRecommendationEngine(courses)
        recommendations = engine.recommend_for_gaps(gap_data, top_k=6)

        recs_data = []
        for course, match_pct in recommendations:
            matched_gaps = [g['subskill_name'] for g in gap_data if g['subskill_id'] in [s.id for s in course.target_subskills.all()]]
            recs_data.append({
                'id': course.id,
                'igot_course_id': course.igot_course_id,
                'title': course.title,
                'provider': course.provider,
                'domain_name': course.domain.name if course.domain else 'General',
                'description': course.description,
                'duration_hours': course.duration_hours,
                'difficulty': course.difficulty,
                'url': course.url,
                'rating': course.rating,
                'match_percentage': match_pct,
                'target_subskills': [s.name for s in course.target_subskills.all()],
                'addressed_gaps': matched_gaps
            })

        return Response({
            'official': user.get_full_name() or user.username,
            'recommendations': recs_data
        })
