from core.models import User, OfficialProfile, OfficialSkillProficiency, CompetencyDomain
from core.views import SkillGapAnalysisView, ProfileView
from courses.views import RecommendedCoursesView
from courses.models import Course
from courses.recommendation import CourseRecommendationEngine
from assessment.models import QuizAttempt
from debate.models import DebateSession

class BuddyContextService:
    @staticmethod
    def get_user_context(user: User, current_route: str = '') -> dict:
        """
        Extracts safe, authenticated user-specific context for Neeti Saarthi Buddy.
        Never includes tokens, passwords, raw resumes, or private secrets.
        """
        if not user or not getattr(user, 'is_authenticated', False):
            normalized_route = current_route.strip().lower()
            page_intent = 'home'
            if 'onboard' in normalized_route or 'profile' in normalized_route:
                page_intent = 'profile'
            elif 'course' in normalized_route or 'learn' in normalized_route:
                page_intent = 'learn'
            elif 'quiz' in normalized_route:
                page_intent = 'quiz'
            elif 'debate' in normalized_route or 'vivaad' in normalized_route:
                page_intent = 'debate'

            return {
                'user': {
                    'username': 'guest',
                    'full_name': 'Officer',
                    'designation': 'Public Servant',
                    'department': 'Public Sector',
                    'organisation': 'Government of India',
                    'profile_complete': False,
                    'baseline_completed': False,
                    'ctq_score': 0.0,
                    'onboarding_tour_completed': True,
                    'buddy_voice_enabled': True,
                    'buddy_language': 'en'
                },
                'confirmed_skills': [],
                'top_gaps': [],
                'recommended_courses': [],
                'recent_quizzes': [],
                'recent_debates': [],
                'page_intent': page_intent,
                'current_route': current_route
            }

        profile = getattr(user, 'official_profile', None)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

        # 1. Profile information
        user_info = {
            'username': user.username,
            'full_name': full_name,
            'designation': user.designation,
            'department': user.department or 'Statistical Department',
            'organisation': user.organisation,
            'experience_years': user.experience_years,
            'education': user.education,
            'profile_complete': user.profile_complete,
            'baseline_completed': user.baseline_completed,
            'ctq_score': round(user.ctq_score, 1),
            'onboarding_tour_completed': user.onboarding_tour_completed,
            'buddy_voice_enabled': user.buddy_voice_enabled,
            'buddy_language': user.buddy_language
        }

        # 2. Confirmed and extracted skills
        confirmed_skills = []
        if profile and profile.confirmed_skills:
            confirmed_skills = [
                s.get('skill', '') if isinstance(s, dict) else str(s)
                for s in profile.confirmed_skills
            ]
        elif profile and profile.skills:
            confirmed_skills = [
                s.get('skill', '') if isinstance(s, dict) else str(s)
                for s in profile.skills
            ]

        # 3. Proficiencies & Skill Gaps
        top_gaps = []
        try:
            from types import SimpleNamespace
            fake_req = SimpleNamespace(user=user)
            gap_view = SkillGapAnalysisView()
            gap_res = gap_view.get(fake_req)
            if hasattr(gap_res, 'data') and 'top_gaps' in gap_res.data:
                top_gaps = [
                    {
                        'subskill_name': g.get('subskill_name', ''),
                        'current_score': g.get('current_score', 0.0),
                        'target_score': g.get('target_score', 0.0),
                        'gap': g.get('gap', 0.0),
                        'domain_name': g.get('domain_name', '')
                    }
                    for g in gap_res.data['top_gaps'][:4]
                ]
        except Exception:
            top_gaps = []

        # 4. Recommended courses
        recommended_courses = []
        try:
            courses = Course.objects.filter(status='active').prefetch_related('target_subskills', 'domain').all()
            if courses.exists() and top_gaps:
                engine = CourseRecommendationEngine(courses)
                # Format gap data for engine
                all_gaps = gap_res.data.get('all_gaps', []) if 'gap_res' in locals() and hasattr(gap_res, 'data') else []
                recommendations = engine.recommend_for_gaps(all_gaps, top_k=3)
                for course, match_pct in recommendations:
                    recommended_courses.append({
                        'id': course.id,
                        'igot_course_id': course.igot_course_id,
                        'title': course.title,
                        'provider': course.provider,
                        'duration': course.duration,
                        'duration_hours': course.duration_hours,
                        'difficulty': course.difficulty,
                        'url': course.url,
                        'thumbnail_url': course.thumbnail_url
                    })
            elif courses.exists():
                # Fallback to authentic active courses
                for course in courses[:3]:
                    recommended_courses.append({
                        'id': course.id,
                        'igot_course_id': course.igot_course_id,
                        'title': course.title,
                        'provider': course.provider,
                        'duration': course.duration,
                        'duration_hours': course.duration_hours,
                        'difficulty': course.difficulty,
                        'url': course.url,
                        'thumbnail_url': course.thumbnail_url
                    })
        except Exception as e:
            print(f"[BuddyContextService] Course recommendation error: {e}")

        # 5. Recent learning activity
        recent_quizzes = []
        try:
            attempts = QuizAttempt.objects.filter(user=user).order_by('-attempted_at')[:3]
            for q in attempts:
                recent_quizzes.append({
                    'quiz_title': q.quiz.title,
                    'score_percentage': q.score_percentage,
                    'date': q.attempted_at.strftime('%d %b %Y')
                })
        except Exception:
            recent_quizzes = []

        recent_debates = []
        try:
            # First check Phase 2 VivaadSession
            from debate.models import VivaadSession
            vivaad_sessions = VivaadSession.objects.filter(user=user, status='EVALUATED').select_related('scenario', 'evaluation_record').order_by('-completed_at')[:3]
            for vs in vivaad_sessions:
                score = vs.evaluation_record.overall_score if hasattr(vs, 'evaluation_record') else None
                recent_debates.append({
                    'scenario_title': vs.scenario.title,
                    'status': vs.status,
                    'score': score,
                    'date': vs.completed_at.strftime('%d %b %Y') if vs.completed_at else vs.started_at.strftime('%d %b %Y')
                })
            
            # Fallback to legacy DebateSession if none
            if not recent_debates:
                debates = DebateSession.objects.filter(user=user).order_by('-created_at')[:3]
                for d in debates:
                    recent_debates.append({
                        'scenario_title': d.scenario.title,
                        'status': d.status,
                        'score': None,
                        'date': d.created_at.strftime('%d %b %Y')
                    })
        except Exception as e:
            recent_debates = []

        # 6. Page route intelligence
        normalized_route = current_route.strip().lower()
        page_intent = 'dashboard'
        if 'onboard' in normalized_route or 'profile' in normalized_route:
            page_intent = 'profile'
        elif 'course' in normalized_route or 'learn' in normalized_route:
            page_intent = 'learn'
        elif 'quiz' in normalized_route:
            page_intent = 'quiz'
        elif 'debate' in normalized_route or 'vivaad' in normalized_route:
            page_intent = 'debate'
        elif normalized_route in ['/', '']:
            page_intent = 'home'

        return {
            'user': user_info,
            'confirmed_skills': confirmed_skills[:10],
            'top_gaps': top_gaps,
            'recommended_courses': recommended_courses,
            'recent_quizzes': recent_quizzes,
            'recent_debates': recent_debates,
            'page_intent': page_intent,
            'current_route': current_route
        }

    @staticmethod
    def get_route_suggestions(route_intent: str, user_context: dict) -> dict:
        """Returns page-specific prompt greeting and 3-4 suggested questions."""
        has_profile = user_context.get('user', {}).get('profile_complete', False)
        skills_count = len(user_context.get('confirmed_skills', []))

        if route_intent == 'profile':
            return {
                'greeting': "Need help with your profile?",
                'suggestions': [
                    "How do I upload my resume?",
                    "What information comes from my resume?",
                    "Can I edit my profile?",
                    "What should I do next?"
                ]
            }
        elif route_intent == 'learn':
            return {
                'greeting': "Looking for something to learn?",
                'suggestions': [
                    "Why was this course recommended?",
                    "What should I learn first?",
                    "Show me my recommended courses",
                    "How does learning connect to my skills?"
                ]
            }
        elif route_intent == 'quiz':
            return {
                'greeting': "Need help with this Knowledge Check?",
                'suggestions': [
                    "How does the Knowledge Check work?",
                    "Explain this question",
                    "What happens after I submit?",
                    "Can I retry a quiz?"
                ]
            }
        elif route_intent == 'debate':
            return {
                'greeting': "Ready to practise a real decision?",
                'suggestions': [
                    "How does Neeti Vivaad work?",
                    "What are these perspectives?",
                    "How is my decision evaluated?",
                    "What is Fallacy Hunter?"
                ]
            }
        elif route_intent == 'home':
            return {
                'greeting': "Hi! I'm your Neeti Saarthi Buddy. 👋\nHow can I help you with your learning today?",
                'suggestions': [
                    "What should I learn next?",
                    "How do I upload my resume?",
                    "How does Neeti Vivaad work?",
                    "What is Neeti Saarthi?"
                ]
            }
        else: # dashboard / growth
            return {
                'greeting': "Want to see how you're improving?",
                'suggestions': [
                    "What skills should I improve?",
                    "What should I learn next?",
                    "How many courses have I completed?",
                    "What is my profile?"
                ]
            }
