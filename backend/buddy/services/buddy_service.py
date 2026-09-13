import os
import re
import json
from urllib import request, error
from django.conf import settings
from .context_service import BuddyContextService

BUDDY_SYSTEM_PROMPT = """You are Neeti Saarthi Buddy, the friendly guide inside the Neeti Saarthi platform.
Your purpose is to help government and public-service professionals learn and use Neeti Saarthi.

CRITICAL RULES:
1. Speak naturally, simply, and warmly in concise Indian English.
2. Keep answers short and direct: 2 to 4 sentences maximum.
3. Explain things as a caring human guide would, never like a technical system.
4. Strictly ground answers in the REAL USER DATA provided below.
5. NEVER invent courses, skills, quiz scores, or progress that do not exist in the data.
6. If information is not available (e.g. profile not filled yet), say so clearly and guide the user to the appropriate step.
7. NEVER use technical jargon: DO NOT mention RAG, FAISS, vector search, embeddings, LLM, prompt, hallucination, or API.
8. Refer to the platform sections using friendly names: "Your Profile", "My Skills", "Skills to Improve", "Recommended for You", "Quick Knowledge Check", "Practice Real Decisions" (Neeti Vivaad), and "Your Growth".
"""

class BuddyService:
    @classmethod
    def answer_question(cls, user, message: str, current_route: str = '') -> dict:
        """
        Processes a user question, retrieves grounded application state,
        and generates a safe, encouraging response with actionable navigation button.
        """
        user_context = BuddyContextService.get_user_context(user, current_route)
        clean_msg = message.strip()

        # Determine actionable navigation button
        action_button = cls._determine_action_button(clean_msg, user_context)

        # 1. Try generating through Gemini if API key is present
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if api_key:
            try:
                ai_reply = cls._call_gemini_buddy(clean_msg, user_context, api_key)
                if ai_reply:
                    return {
                        'message': ai_reply,
                        'should_speak': True,
                        'suggested_actions': cls._get_followup_suggestions(user_context),
                        'action_button': action_button,
                        'context': user_context['page_intent']
                    }
            except Exception as e:
                print(f"[BuddyService] Gemini API call fallback: {e}")

        # 2. Grounded Deterministic Fallback Engine
        fallback_reply = cls._generate_grounded_fallback(clean_msg, user_context)
        return {
            'message': fallback_reply,
            'should_speak': True,
            'suggested_actions': cls._get_followup_suggestions(user_context),
            'action_button': action_button,
            'context': user_context['page_intent']
        }

    @classmethod
    def _determine_action_button(cls, message: str, context: dict) -> dict | None:
        """Determines actionable direct navigation button for user prompt."""
        msg = message.lower()
        user = context.get('user', {})

        # If user is a guest, prompt to sign in for personalized features
        if user.get('username') == 'guest':
            if any(w in msg for w in ['next', 'what should i do', 'start', 'resume', 'upload', 'profile', 'skill', 'course', 'recommend']):
                return {'label': 'Sign In →', 'route': '/login'}

        # What should I do next / start
        if any(w in msg for w in ['next', 'what should i do', 'start', 'begin', 'first']):
            if not user.get('profile_complete', False):
                return {'label': 'Upload Resume →', 'route': '/candidate/onboarding'}
            elif context.get('recommended_courses'):
                return {'label': 'View Courses →', 'route': '/courses'}
            else:
                return {'label': 'View My Skills →', 'route': '/dashboard'}

        # Resume / Profile
        if any(w in msg for w in ['resume', 'upload', 'cv']):
            return {'label': 'Open Your Profile →', 'route': '/candidate/onboarding'}

        # Profile / Who am I
        if any(w in msg for w in ['profile', 'who am i', 'my profile']):
            return {'label': 'View My Profile →', 'route': '/dashboard'}

        # Courses / Learn
        if any(w in msg for w in ['course', 'learn', 'recommend', 'study', 'lesson']):
            return {'label': 'View Courses →', 'route': '/courses'}

        # Skills
        if any(w in msg for w in ['skill', 'gap', 'improve', 'strengthen', 'weak']):
            return {'label': 'View My Skills →', 'route': '/dashboard'}

        # Knowledge Check / Quiz
        if any(w in msg for w in ['quiz', 'knowledge check', 'test', 'question']):
            return {'label': 'Take Knowledge Check →', 'route': '/quiz'}

        # Neeti Vivaad / Decisions
        if any(w in msg for w in ['vivaad', 'debate', 'decision', 'scenario', 'perspective']):
            return {'label': 'Practice Decisions →', 'route': '/debate'}

        # Growth / Progress
        if any(w in msg for w in ['growth', 'progress', 'completed']):
            return {'label': 'View Your Growth →', 'route': '/dashboard'}

        return None

    @classmethod
    def _call_gemini_buddy(cls, message: str, context: dict, api_key: str) -> str:
        """Calls Google Gemini REST API with strict grounding and system prompt."""
        prompt = f"""{BUDDY_SYSTEM_PROMPT}

REAL USER CONTEXT:
- Name: {context['user']['full_name']}
- Designation: {context['user']['designation']}
- Department: {context['user']['department']}
- Profile Completed: {context['user']['profile_complete']}
- Baseline Completed: {context['user']['baseline_completed']}
- Decision-Making (CTQ) Score: {context['user']['ctq_score']}
- Confirmed Skills: {', '.join(context['confirmed_skills']) if context['confirmed_skills'] else 'None added yet'}
- Skills to Improve (Gaps): {', '.join([g['subskill_name'] for g in context['top_gaps']]) if context['top_gaps'] else 'No identified gaps yet'}
- Recommended Courses: {', '.join([c['title'] for c in context['recommended_courses']]) if context['recommended_courses'] else 'None generated yet'}
- Recent Quizzes: {len(context['recent_quizzes'])} attempts
- Recent Policy Decisions: {len(context['recent_debates'])} scenarios
- Current Page: {context['current_route']} ({context['page_intent']})

USER QUESTION:
"{message}"

Respond directly as Neeti Saarthi Buddy. Keep it under 3-4 sentences.
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = json.dumps({
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 350
            }
        }).encode('utf-8')

        req = request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
        with request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
            # Remove any accidental markdown headers
            text = re.sub(r'^#+\s*', '', text)
            return text

    @classmethod
    def _generate_grounded_fallback(cls, message: str, context: dict) -> str:
        """High quality deterministic answers grounded entirely in live user context."""
        msg = message.lower()
        user = context['user']
        top_gaps = context['top_gaps']
        recs = context['recommended_courses']
        skills = context['confirmed_skills']
        quizzes = context.get('recent_quizzes', [])

        # 1. What is Neeti Saarthi
        if any(w in msg for w in ['what is neeti saarthi', 'about neeti saarthi', 'platform']):
            return "Neeti Saarthi is India's dedicated learning and decision platform for public-sector officials. It helps you assess your skills, discover targeted courses on iGOT Karmayogi, and practice real-world policy decisions in Neeti Vivaad."

        # 2. What should I do next / first step
        if any(w in msg for w in ['what should i do', 'next', 'first', 'start', 'begin']):
            if not user['profile_complete']:
                return "Your best next step is to upload your resume so I can help build your profile from your experience, education, and skills."
            elif recs:
                top_c = recs[0]['title']
                return f"Your profile is ready. Your recommended courses are waiting on iGOT Karmayogi, starting with '{top_c}'."
            elif top_gaps:
                return "Your profile is ready. Take a look at My Skills next to see the areas you can strengthen."
            return "Your profile is set up! You can explore recommended courses, take a Knowledge Check, or practice policy decisions in Neeti Vivaad."

        # 3. Resume / Profile upload
        if any(w in msg for w in ['resume', 'upload', 'cv']):
            if user['profile_complete']:
                return "Your resume is already uploaded and your profile is complete! You can review or edit your information in Your Profile anytime."
            return "Go to Your Profile and choose Upload Resume. I’ll use it to help create your profile from your experience, education, and skills."

        # 4. What is my profile / Who am I
        if any(w in msg for w in ['my profile', 'who am i', 'profile']):
            skills_text = f"You have {len(skills)} confirmed skills on record." if skills else "No skills extracted yet."
            return f"You are signed in as {user['full_name']}, serving as {user['designation']} in {user['department']}. {skills_text}"

        # 5. Course recommendations / What should I learn next
        if any(w in msg for w in ['learn', 'course', 'recommend', 'study', 'class']):
            if recs:
                top_course = recs[0]['title']
                if len(recs) > 1:
                    return f"Based on your profile, I recommend starting with '{top_course}'. You also have '{recs[1]['title']}' waiting in your Recommended for You section on iGOT Karmayogi."
                return f"Based on your current skill profile, I recommend starting with '{top_course}'. You can find it in your Recommended for You section."
            elif not user['profile_complete']:
                return "To get personalized course recommendations, complete your profile by uploading your resume first. I'll then match you with targeted lessons on iGOT Karmayogi."
            return "Explore the Learn section to browse available courses across Statistical Methodology, Technical Tools, and Governance."

        # 6. Skills to improve / Gaps
        if any(w in msg for w in ['skill', 'improve', 'gap', 'strengthen', 'weak']):
            if top_gaps:
                gap_names = [g['subskill_name'] for g in top_gaps[:2]]
                return f"Right now, focusing on {', and '.join(gap_names)} will help you grow the fastest. You can find recommended courses for these right on your dashboard."
            elif skills:
                return f"You have {len(skills)} confirmed skills on record, including {skills[0]}. Keep practicing in Knowledge Checks to raise your proficiency scores."
            return "Upload your resume in Your Profile to identify your current skill strengths and the areas where targeted learning will help you most."

        # 7. How many courses completed / Progress
        if any(w in msg for w in ['how many courses', 'completed', 'progress', 'growth']):
            quiz_count = len(quizzes)
            if quiz_count > 0:
                return f"You have completed {quiz_count} Knowledge Checks. Every lesson and scenario you finish updates your learning progress in Your Growth."
            return "You haven't completed any assessments yet. Take a quick Knowledge Check after learning to see your progress recorded in Your Growth."

        # 8. Knowledge Check / Quizzes
        if any(w in msg for w in ['quiz', 'test', 'knowledge', 'check', 'assessment']):
            return "Quick Knowledge Checks test what you remember after each lesson. They take just a few minutes, provide instant explanations, and update your skill progress."

        # 9. Neeti Vivaad / Policy Decisions
        if any(w in msg for w in ['vivaad', 'debate', 'decision', 'scenario', 'perspective']):
            return "Neeti Vivaad lets you practice real-world policy decisions. You'll hear four different perspectives—from field enumerators to privacy officers—spot logical fallacies, and submit your recommendation."

        # 10. Default welcoming guidance
        return f"Hi {user['full_name']}! I'm here to help you get the most out of Neeti Saarthi. You can ask me about recommended courses, your skills, Knowledge Checks, or how to practice policy decisions in Neeti Vivaad."

    @classmethod
    def _get_followup_suggestions(cls, context: dict) -> list:
        page = context.get('page_intent', 'dashboard')
        if page == 'learn':
            return ["Why was this course recommended?", "What should I learn first?", "Show me my recommended courses"]
        elif page == 'profile':
            return ["How do I upload my resume?", "What information comes from my resume?", "Can I edit my profile?"]
        elif page == 'quiz':
            return ["How does the Knowledge Check work?", "Explain this question", "What happens after I submit?"]
        elif page == 'debate':
            return ["How does Neeti Vivaad work?", "What are these perspectives?", "How is my decision evaluated?"]
        else:
            return ["What should I learn next?", "How do I upload my resume?", "How does Neeti Vivaad work?", "What is Neeti Saarthi?"]
