from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import User, CompetencyDomain, SubSkill, OfficialSkillProficiency
from core.views import SkillGapAnalysisView, ProfileView
from courses.views import RecommendedCoursesView
from assessment.models import QuizAttempt, BaselineAssessmentAttempt
from debate.models import DebateSession

class LearnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        profile_view = ProfileView()
        prof_res = profile_view.get(request)

        gap_view = SkillGapAnalysisView()
        gap_res = gap_view.get(request)

        rec_view = RecommendedCoursesView()
        rec_res = rec_view.get(request)

        quiz_attempts = QuizAttempt.objects.filter(user=user).order_by('-attempted_at')[:5]
        attempts_data = []
        for q in quiz_attempts:
            attempts_data.append({
                'id': q.id,
                'quiz_title': q.quiz.title,
                'score_percentage': q.score_percentage,
                'attempted_at': q.attempted_at.strftime('%Y-%m-%d %H:%M')
            })

        debates = DebateSession.objects.filter(user=user).order_by('-created_at')[:5]
        debates_data = []
        for d in debates:
            debates_data.append({
                'id': d.id,
                'scenario_title': d.scenario.title,
                'category': d.scenario.category,
                'status': d.status,
                'created_at': d.created_at.strftime('%Y-%m-%d %H:%M')
            })

        return Response({
            'user': prof_res.data['user'],
            'profile_complete': user.profile_complete,
            'baseline_completed': user.baseline_completed,
            'domain_scores': prof_res.data['domain_scores'],
            'top_gaps': gap_res.data.get('top_gaps', []),
            'recommended_courses': rec_res.data.get('recommendations', [])[:4],
            'recent_quizzes': attempts_data,
            'recent_debates': debates_data
        })

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN' and not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Forbidden. Admin access is restricted to verified administrators.'},
                status=status.HTTP_403_FORBIDDEN
            )

        departments = [
            'NSO Field Operations Division',
            'Survey Design & Research Division',
            'Economic Statistics Division',
            'National Accounts Division',
            'Data Informatics and Innovation Division'
        ]

        heatmap_data = []
        for dept in departments:
            dept_users = User.objects.filter(department__icontains=dept)
            dept_users_count = dept_users.count()
            if dept_users_count > 0:
                profs = OfficialSkillProficiency.objects.filter(user__in=dept_users)
                stat_profs = profs.filter(subskill__domain__domain_type='STATISTICAL')
                tech_profs = profs.filter(subskill__domain__domain_type='TECHNICAL')
                dig_profs = profs.filter(subskill__domain__domain_type='DIGITAL_GOVERNANCE')
                beh_profs = profs.filter(subskill__domain__domain_type='BEHAVIOURAL')

                stat_avg = round(sum(p.score for p in stat_profs) / max(1, stat_profs.count()), 1) if stat_profs.exists() else 0.0
                tech_avg = round(sum(p.score for p in tech_profs) / max(1, tech_profs.count()), 1) if tech_profs.exists() else 0.0
                dig_avg = round(sum(p.score for p in dig_profs) / max(1, dig_profs.count()), 1) if dig_profs.exists() else 0.0
                beh_avg = round(sum(p.score for p in beh_profs) / max(1, beh_profs.count()), 1) if beh_profs.exists() else 0.0
                ctq_avg = round(sum(u.ctq_score for u in dept_users) / dept_users_count, 1)
            else:
                stat_avg = 0.0
                tech_avg = 0.0
                dig_avg = 0.0
                beh_avg = 0.0
                ctq_avg = 0.0

            heatmap_data.append({
                'department': dept,
                'total_officials': dept_users_count,
                'statistical_score': stat_avg,
                'technical_score': tech_avg,
                'digital_gov_score': dig_avg,
                'behavioural_score': beh_avg,
                'average_ctq': ctq_avg
            })

        total_officials = User.objects.filter(role='OFFICIAL').count()
        completed_debates = DebateSession.objects.filter(status='CONCLUDED').count()
        total_quizzes = QuizAttempt.objects.count()
        baseline_assessments = BaselineAssessmentAttempt.objects.count()

        active_users_ctq = [d['average_ctq'] for d in heatmap_data if d['total_officials'] > 0]
        avg_org_ctq = round(sum(active_users_ctq) / len(active_users_ctq), 1) if active_users_ctq else 0.0

        return Response({
            'summary': {
                'total_officials': total_officials,
                'org_average_ctq': avg_org_ctq,
                'completed_debates_count': completed_debates,
                'total_quizzes_taken': total_quizzes,
                'baseline_assessments_taken': baseline_assessments
            },
            'department_heatmap': heatmap_data
        })
