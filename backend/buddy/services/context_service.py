import re
from typing import Any, Dict, List, Optional
from core.models import User, OfficialProfile, OfficialSkillProficiency, CompetencyDomain
from core.views import SkillGapAnalysisView
from courses.models import Course
from courses.recommendation import CourseRecommendationEngine
from assessment.models import Quiz, QuizAttempt, QuizAnswer
from debate.models import VivaadScenario, VivaadSession, DebateSession


class UserContextService:
    """
    Centralized, tenant-isolated context engine for Neeti Saarthi.
    Provides scoped, least-privilege context to features:
    - Profile: role + skills + experience + organisation
    - Recommendations: skills + gaps + completed courses + goals
    - Knowledge Check: course/subskill + source + past performance + prior mistakes
    - Vivaad: scenario + evidence + role + decision + reasoning
    - Buddy: current route + active object + user profile + conversation
    
    Guarantees strict isolation: always filters by the authenticated user.
    Never exposes passwords, raw tokens, or cross-tenant private data.
    """

    @classmethod
    def get_profile_context(cls, user: User) -> Dict[str, Any]:
        """Profile context: role + skills + experience."""
        if not user or not getattr(user, 'is_authenticated', False):
            return {
                'username': 'guest',
                'full_name': 'Officer',
                'role': 'Government Official',
                'designation': 'Public Servant',
                'department': 'Public Sector',
                'organisation': 'Government of India',
                'experience_years': 0.0,
                'education': '',
                'profile_complete': False,
                'confirmed_skills': []
            }

        profile = getattr(user, 'official_profile', None)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

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

        return {
            'username': user.username,
            'full_name': full_name,
            'role': getattr(user, 'role', 'OFFICIAL'),
            'designation': user.designation,
            'department': user.department or 'Statistical Department',
            'organisation': user.organisation,
            'experience_years': user.experience_years,
            'education': user.education,
            'profile_complete': user.profile_complete,
            'confirmed_skills': confirmed_skills[:15],
            'buddy_language': getattr(user, 'buddy_language', 'en')
        }

    @classmethod
    def get_recommendations_context(cls, user: User) -> Dict[str, Any]:
        """Recommendations context: skills + gaps + completed courses + goals."""
        profile_ctx = cls.get_profile_context(user)
        top_gaps = []

        if user and getattr(user, 'is_authenticated', False):
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

        # Authentic active courses
        recommended_courses = []
        try:
            courses = Course.objects.filter(status='active').prefetch_related('target_subskills', 'domain').all()
            if courses.exists() and top_gaps:
                engine = CourseRecommendationEngine(courses)
                all_gaps = gap_res.data.get('all_gaps', []) if 'gap_res' in locals() and hasattr(gap_res, 'data') else []
                recs = engine.recommend_for_gaps(all_gaps, top_k=3)
                for course, _ in recs:
                    recommended_courses.append({
                        'id': course.id,
                        'title': course.title,
                        'provider': course.provider,
                        'difficulty': course.difficulty,
                        'duration': course.duration
                    })
            elif courses.exists():
                for course in courses[:3]:
                    recommended_courses.append({
                        'id': course.id,
                        'title': course.title,
                        'provider': course.provider,
                        'difficulty': course.difficulty,
                        'duration': course.duration
                    })
        except Exception:
            pass

        return {
            'skills': profile_ctx['confirmed_skills'],
            'top_gaps': top_gaps,
            'recommended_courses': recommended_courses
        }

    @classmethod
    def get_knowledge_check_context(cls, user: User, quiz_id: Optional[int] = None) -> Dict[str, Any]:
        """Knowledge check context: course + source + skill + previous performance + mistakes."""
        context: Dict[str, Any] = {
            'target_quiz': None,
            'recent_attempts': [],
            'previous_mistakes': [],
            'subskill_name': 'General'
        }

        if quiz_id:
            try:
                q = Quiz.objects.select_related('document', 'subskill', 'subskill__domain').get(id=quiz_id)
                context['target_quiz'] = {
                    'id': q.id,
                    'title': q.title,
                    'difficulty': q.difficulty,
                    'version': q.version,
                    'subskill': q.subskill.name if q.subskill else 'General',
                    'document_title': q.document.title if q.document else 'Manual Source'
                }
                if q.subskill:
                    context['subskill_name'] = q.subskill.name
            except Quiz.DoesNotExist:
                pass

        if user and getattr(user, 'is_authenticated', False):
            # Prior performance scoped strictly to this user
            attempts = QuizAttempt.objects.filter(user=user).select_related('quiz').order_by('-attempted_at')[:4]
            for att in attempts:
                context['recent_attempts'].append({
                    'quiz_title': att.quiz.title,
                    'score_percentage': att.score_percentage,
                    'date': att.attempted_at.strftime('%d %b %Y')
                })

            # Retrieve past incorrect answers to inform adaptive questions and explanations
            past_errors = QuizAnswer.objects.filter(
                attempt__user=user,
                is_correct=False
            ).select_related('question').order_by('-id')[:5]
            for pe in past_errors:
                context['previous_mistakes'].append({
                    'question_snippet': pe.question.question_text[:80],
                    'explanation': pe.question.explanation[:120],
                    'source_page': pe.question.source_page
                })

        return context

    @classmethod
    def get_vivaad_context(
        cls,
        user: User,
        scenario_id: Optional[int] = None,
        selected_option_id: Optional[str] = None,
        reasoning: str = ''
    ) -> Dict[str, Any]:
        """Vivaad context: scenario + evidence + role + decision + reasoning."""
        profile_ctx = cls.get_profile_context(user)
        scenario_data = None
        evidence_snippets = []

        if scenario_id:
            try:
                s = VivaadScenario.objects.select_related('source').prefetch_related('options', 'perspectives').get(id=scenario_id)
                options_list = [{'id': o.id, 'label': o.label, 'summary': o.summary} for o in s.options.all()]
                perspectives_list = [
                    {
                        'name': p.name,
                        'role': p.role,
                        'primary_concern': p.primary_concern,
                        'position': p.position
                    }
                    for p in s.perspectives.all()
                ]

                if s.source and s.source.chunks:
                    evidence_snippets = [
                        {
                            'page': c.get('page_number', 1),
                            'section': c.get('section_title', ''),
                            'text': c.get('text', '')[:200]
                        }
                        for c in s.source.chunks[:4]
                    ]

                scenario_data = {
                    'id': s.id,
                    'title': s.title,
                    'situation': s.situation,
                    'decision_question': s.decision_question,
                    'objective': s.objective,
                    'constraints': s.constraints,
                    'options': options_list,
                    'perspectives': perspectives_list,
                    'evidence_snippets': evidence_snippets
                }
            except VivaadScenario.DoesNotExist:
                pass

        # Past evaluated sessions strictly for this user
        past_decisions = []
        if user and getattr(user, 'is_authenticated', False):
            sessions = VivaadSession.objects.filter(
                user=user,
                status='EVALUATED'
            ).select_related('scenario', 'evaluation_record').order_by('-completed_at')[:3]
            for sess in sessions:
                past_decisions.append({
                    'scenario_title': sess.scenario.title,
                    'decision_option': sess.selected_option_id,
                    'score': sess.evaluation_record.overall_score if hasattr(sess, 'evaluation_record') else None,
                    'date': sess.completed_at.strftime('%d %b %Y') if sess.completed_at else ''
                })

        return {
            'user_role': profile_ctx['designation'],
            'department': profile_ctx['department'],
            'scenario': scenario_data,
            'selected_option': selected_option_id,
            'user_reasoning': reasoning.strip(),
            'past_decisions': past_decisions
        }

    @classmethod
    def get_buddy_context(
        cls,
        user: User,
        current_route: str = '',
        active_object_type: Optional[str] = None,
        active_object_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Buddy context: current route + active object + user profile + suggestions."""
        profile_ctx = cls.get_profile_context(user)
        recs_ctx = cls.get_recommendations_context(user)
        route_norm = current_route.strip().lower()

        page_intent = 'dashboard'
        subtitle = "Your civil service companion"

        if 'debate' in route_norm or 'vivaad' in route_norm:
            page_intent = 'debate'
            subtitle = "Your decision companion"
        elif 'quiz' in route_norm:
            page_intent = 'quiz'
            subtitle = "Your learning companion"
        elif 'course' in route_norm or 'learn' in route_norm:
            page_intent = 'learn'
            subtitle = "Your learning companion"
        elif 'profile' in route_norm or 'onboard' in route_norm:
            page_intent = 'profile'
            subtitle = "Your civil service companion"
        elif route_norm in ['/', '']:
            page_intent = 'home'
            subtitle = "Your learning companion"

        active_object = None
        if active_object_type == 'scenario' and active_object_id:
            try:
                sc = VivaadScenario.objects.get(id=int(active_object_id))
                active_object = {'type': 'scenario', 'id': sc.id, 'title': sc.title, 'decision_question': sc.decision_question}
            except Exception:
                pass
        elif active_object_type == 'quiz' and active_object_id:
            try:
                qz = Quiz.objects.get(id=int(active_object_id))
                active_object = {'type': 'quiz', 'id': qz.id, 'title': qz.title, 'difficulty': qz.difficulty}
            except Exception:
                pass
        elif active_object_type == 'course' and active_object_id:
            try:
                co = Course.objects.get(id=int(active_object_id))
                active_object = {'type': 'course', 'id': co.id, 'title': co.title}
            except Exception:
                pass

        recent_quizzes = []
        recent_debates = []
        if user and getattr(user, 'is_authenticated', False):
            try:
                attempts = QuizAttempt.objects.filter(user=user).select_related('quiz').order_by('-attempted_at')[:3]
                for q in attempts:
                    recent_quizzes.append({
                        'quiz_title': q.quiz.title,
                        'score_percentage': q.score_percentage,
                        'date': q.attempted_at.strftime('%d %b %Y')
                    })
            except Exception:
                pass

            try:
                vivaad_sessions = VivaadSession.objects.filter(
                    user=user, status='EVALUATED'
                ).select_related('scenario', 'evaluation_record').order_by('-completed_at')[:3]
                for vs in vivaad_sessions:
                    score = vs.evaluation_record.overall_score if hasattr(vs, 'evaluation_record') else None
                    recent_debates.append({
                        'scenario_title': vs.scenario.title,
                        'status': vs.status,
                        'score': score,
                        'date': vs.completed_at.strftime('%d %b %Y') if vs.completed_at else ''
                    })
            except Exception:
                pass

        # Suggestions tailored to route
        suggestions_data = cls.get_route_suggestions(page_intent, profile_ctx)

        return {
            'user': profile_ctx,
            'page_intent': page_intent,
            'subtitle': subtitle,
            'current_route': current_route,
            'active_object': active_object,
            'confirmed_skills': profile_ctx['confirmed_skills'],
            'top_gaps': recs_ctx['top_gaps'],
            'recommended_courses': recs_ctx['recommended_courses'],
            'recent_quizzes': recent_quizzes,
            'recent_debates': recent_debates,
            'greeting': suggestions_data['greeting'],
            'suggestions': suggestions_data['suggestions']
        }

    @classmethod
    def get_route_suggestions(cls, route_intent: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Returns section-specific greeting and suggested starter questions."""
        if route_intent == 'profile':
            return {
                'greeting': "Need help updating your official profile?",
                'suggestions': [
                    "How do I upload my resume?",
                    "What information comes from my resume?",
                    "Can I edit my department details?",
                    "What should I do next?"
                ]
            }
        elif route_intent == 'learn':
            return {
                'greeting': "Looking for relevant courses for your role?",
                'suggestions': [
                    "Why was this course recommended for me?",
                    "What courses address my skill gaps?",
                    "Show me my recommended courses",
                    "How does learning connect to my competencies?"
                ]
            }
        elif route_intent == 'quiz':
            return {
                'greeting': "Need guidance on this Knowledge Check?",
                'suggestions': [
                    "How are these questions verified against the source document?",
                    "Can you explain the key concept behind this question?",
                    "What happens after I submit my answers?",
                    "How does this update my competency score?"
                ]
            }
        elif route_intent == 'debate':
            return {
                'greeting': "Practising a policy decision in Neeti Vivaad?",
                'suggestions': [
                    "How do I weigh the conflicting stakeholder views?",
                    "What evidence should I look at before deciding?",
                    "How is my policy reasoning evaluated?",
                    "What should I consider for frontline implementation?"
                ]
            }
        elif route_intent == 'home':
            return {
                'greeting': "Welcome to Neeti Saarthi. I'm your learning companion. 👋\nHow can I help you today?",
                'suggestions': [
                    "What should I explore first?",
                    "How do I upload my resume?",
                    "How does Neeti Vivaad work?",
                    "How do Knowledge Checks work?"
                ]
            }
        else:
            return {
                'greeting': "Want to see your competency growth?",
                'suggestions': [
                    "What skills should I focus on improving?",
                    "What should I learn next?",
                    "How is my critical thinking quotient measured?",
                    "Show my completed assessments"
                ]
            }

    @classmethod
    def get_user_context(cls, user: User, current_route: str = '') -> Dict[str, Any]:
        """Legacy compatibility method returning dict matching historical schema."""
        b_ctx = cls.get_buddy_context(user, current_route)
        recent_quizzes = []
        recent_debates = []

        if user and getattr(user, 'is_authenticated', False):
            try:
                attempts = QuizAttempt.objects.filter(user=user).order_by('-attempted_at')[:3]
                for q in attempts:
                    recent_quizzes.append({
                        'quiz_title': q.quiz.title,
                        'score_percentage': q.score_percentage,
                        'date': q.attempted_at.strftime('%d %b %Y')
                    })
            except Exception:
                pass

            try:
                vivaad_sessions = VivaadSession.objects.filter(
                    user=user, status='EVALUATED'
                ).select_related('scenario', 'evaluation_record').order_by('-completed_at')[:3]
                for vs in vivaad_sessions:
                    score = vs.evaluation_record.overall_score if hasattr(vs, 'evaluation_record') else None
                    recent_debates.append({
                        'scenario_title': vs.scenario.title,
                        'status': vs.status,
                        'score': score,
                        'date': vs.completed_at.strftime('%d %b %Y') if vs.completed_at else ''
                    })
            except Exception:
                pass

        return {
            'user': b_ctx['user'],
            'confirmed_skills': b_ctx['confirmed_skills'],
            'top_gaps': b_ctx['top_gaps'],
            'recommended_courses': b_ctx['recommended_courses'],
            'recent_quizzes': recent_quizzes,
            'recent_debates': recent_debates,
            'page_intent': b_ctx['page_intent'],
            'subtitle': b_ctx['subtitle'],
            'current_route': current_route
        }


# Legacy class alias for backward compatibility
BuddyContextService = UserContextService
