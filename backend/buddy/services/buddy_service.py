import os
import re
import json
from urllib import request, error
from django.conf import settings
from .context_service import UserContextService

BUDDY_SYSTEM_PROMPT = """You are NEETI SAARTHI BUDDY, the civil service guide inside the Neeti Saarthi platform.
Your purpose is to help government and public-service professionals learn, improve competencies, and practice evidence-backed policy decisions.

CRITICAL RULES:
1. Speak naturally, simply, and warmly in concise Indian English (or clear Hindi / Hinglish if the user asks in Hindi or their language is Hindi).
2. Keep answers short and direct: 2 to 4 sentences maximum.
3. Explain things as a caring human mentor, never like a software algorithm or technical system.
4. Strictly ground answers in the REAL USER DATA provided below.
5. NEVER invent courses, skills, quiz scores, or progress that do not exist in the data.
6. If information is not available (e.g. profile not filled yet, or question asks for data not in context), say clearly: "There's not enough reliable information to give a specific answer yet." and guide the user to the appropriate step.
7. NEVER use technical AI jargon: DO NOT mention RAG, FAISS, vector search, embeddings, LLM, model, prompt, hallucination, latency, or API.
8. Refer to the platform sections using friendly names: "Your Profile", "My Skills", "Skills to Improve", "Recommended for You", "Quick Knowledge Check", "Practice Real Decisions" (Neeti Vivaad), and "Your Growth".
"""

class BuddyService:
    @classmethod
    def answer_question(
        cls,
        user,
        message: str,
        current_route: str = '',
        active_object_type: str = None,
        active_object_id: str = None,
        language: str = 'en'
    ) -> dict:
        """
        Processes a user question, retrieves grounded application state,
        and generates a safe, encouraging response with actionable navigation button.
        """
        user_context = UserContextService.get_buddy_context(
            user, current_route, active_object_type, active_object_id
        )
        clean_msg = message.strip()
        is_hindi = bool(
            re.search(r'[\u0900-\u097F]', clean_msg) or
            language.startswith('hi') or
            any(w in clean_msg.lower() for w in ['kya hai', 'kaise', 'bataiye', 'namaste', 'shukriya'])
        )

        # Determine actionable navigation button
        action_button = cls._determine_action_button(clean_msg, user_context)

        # 1. Try generating through AI (OpenRouter / NVIDIA / Gemini) if API key is present
        ai_key = getattr(settings, 'OPENROUTER_API_KEY', '') or getattr(settings, 'NVIDIA_API_KEY', '') or getattr(settings, 'GEMINI_API_KEY', '')
        if ai_key:
            try:
                ai_reply = cls._call_ai_buddy(clean_msg, user_context, is_hindi)
                if ai_reply:
                    return {
                        'message': ai_reply,
                        'should_speak': True,
                        'suggested_actions': cls._get_followup_suggestions(user_context, is_hindi),
                        'action_button': action_button,
                        'context': user_context['page_intent'],
                        'subtitle': user_context.get('subtitle', 'Your civil service companion')
                    }
            except Exception as e:
                print(f"[BuddyService] AI API call fallback: {e}")

        # 2. Grounded Deterministic Fallback Engine
        fallback_reply = cls._generate_grounded_fallback(clean_msg, user_context, is_hindi)
        return {
            'message': fallback_reply,
            'should_speak': True,
            'suggested_actions': cls._get_followup_suggestions(user_context, is_hindi),
            'action_button': action_button,
            'context': user_context['page_intent'],
            'subtitle': user_context.get('subtitle', 'Your civil service companion')
        }

    @classmethod
    def _determine_action_button(cls, message: str, context: dict) -> dict | None:
        """Determines actionable direct navigation button for user prompt."""
        msg = message.lower()
        user = context.get('user', {})

        # If user is a guest, prompt to sign in for personalized features
        if user.get('username') == 'guest':
            if any(w in msg for w in ['next', 'what should i do', 'start', 'resume', 'upload', 'profile', 'skill', 'course', 'recommend', 'agla', 'shuru']):
                return {'label': 'Sign In →', 'route': '/login'}

        # What should I do next / start
        if any(w in msg for w in ['next', 'what should i do', 'start', 'begin', 'first', 'kya karu', 'agla']):
            if not user.get('profile_complete', False):
                return {'label': 'Upload Resume →', 'route': '/profile/setup'}
            elif context.get('recommended_courses'):
                return {'label': 'View Courses →', 'route': '/courses'}
            else:
                return {'label': 'View My Skills →', 'route': '/dashboard'}

        # Resume / Profile
        if any(w in msg for w in ['resume', 'upload', 'cv', 'biodata', 'profile upload']):
            return {'label': 'Open Your Profile →', 'route': '/profile/setup'}

        # Profile / Who am I
        if any(w in msg for w in ['profile', 'who am i', 'my profile', 'meri profile']):
            return {'label': 'View My Profile →', 'route': '/dashboard'}

        # Courses / Learn
        if any(w in msg for w in ['course', 'learn', 'recommend', 'study', 'lesson', 'kram', 'padhna']):
            return {'label': 'View Courses →', 'route': '/courses'}

        # Skills
        if any(w in msg for w in ['skill', 'gap', 'improve', 'strengthen', 'weak', 'kshamta']):
            return {'label': 'View My Skills →', 'route': '/dashboard'}

        # Knowledge Check / Quiz
        if any(w in msg for w in ['quiz', 'knowledge check', 'test', 'question', 'prashna']):
            return {'label': 'Take Knowledge Check →', 'route': '/quiz'}

        # Neeti Vivaad / Decisions
        if any(w in msg for w in ['vivaad', 'debate', 'decision', 'scenario', 'perspective', 'faisla', 'niti']):
            return {'label': 'Practice Decisions →', 'route': '/debate'}

        # Growth / Progress
        if any(w in msg for w in ['growth', 'progress', 'completed', 'pragati']):
            return {'label': 'View Your Growth →', 'route': '/dashboard'}

        return None

    @classmethod
    def _call_gemini_buddy(cls, message: str, context: dict, api_key: str, is_hindi: bool = False) -> str:
        """Calls Google Gemini REST API with strict grounding and system prompt."""
        lang_instruction = "Respond in natural, simple Hindi (or Hinglish if appropriate)." if is_hindi else "Respond in warm, clear Indian English."
        
        user_info = context.get('user', {})
        active_obj = context.get('active_object', {})
        active_str = f"Active Screen Context: {active_obj.get('type')}: {active_obj.get('title')}" if active_obj else "Active Screen Context: None"

        prompt = f"""{BUDDY_SYSTEM_PROMPT}

LANGUAGE REQUIREMENT:
{lang_instruction}

REAL USER CONTEXT:
- Name: {user_info.get('full_name')}
- Designation: {user_info.get('designation')}
- Department: {user_info.get('department')}
- Profile Completed: {user_info.get('profile_complete')}
- Confirmed Skills: {', '.join(context.get('confirmed_skills', [])) if context.get('confirmed_skills') else 'None added yet'}
- Skills to Improve (Gaps): {', '.join([g['subskill_name'] for g in context.get('top_gaps', [])]) if context.get('top_gaps') else 'No identified gaps yet'}
- Recommended Courses: {', '.join([c['title'] for c in context.get('recommended_courses', [])]) if context.get('recommended_courses') else 'None generated yet'}
- Recent Quizzes: {len(context.get('recent_quizzes', []))} attempts
- Recent Policy Decisions: {len(context.get('recent_debates', []))} scenarios
- Current Page: {context.get('current_route')} ({context.get('page_intent')})
- {active_str}

USER QUESTION:
"{message}"

CRITICAL: If the answer cannot be determined from the user's data or known platform sections, reply: "There's not enough reliable information to give a specific answer yet." and suggest what they can do next. Keep it under 3-4 sentences without any AI jargon.
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = json.dumps({
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 350
            }
        }).encode('utf-8')

        req = request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
        with request.urlopen(req, timeout=12) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
            text = re.sub(r'^#+\s*', '', text)
            return text

    @classmethod
    def _generate_grounded_fallback(cls, message: str, context: dict, is_hindi: bool = False) -> str:
        """High quality deterministic answers grounded entirely in live user context."""
        msg = message.lower()
        user = context.get('user', {})
        top_gaps = context.get('top_gaps', [])
        recs = context.get('recommended_courses', [])
        skills = context.get('confirmed_skills', [])
        quizzes = context.get('recent_quizzes', [])
        debates = context.get('recent_debates', [])

        if is_hindi:
            if any(w in msg for w in ['kya hai', 'neeti saarthi', 'platform', 'parichay']):
                return "नीति सारथी भारत के लोक सेवा अधिकारियों के लिए एक शिक्षण और निर्णय मंच है। यह आपकी दक्षताओं का आकलन करने, iGOT कर्मयोगी पर लक्षित पाठ्यक्रम सुझाने और नीति विवाद में वास्तविक नीतिगत निर्णयों का अभ्यास करने में मदद करता है।"
            if any(w in msg for w in ['agla', 'kya karu', 'first', 'shuru', 'next']):
                if not user.get('profile_complete'):
                    return "सबसे पहले अपनी प्रोफ़ाइल में जाकर अपना बायोडाटा (Resume) अपलोड करें, ताकि हम आपकी दक्षताओं और अनुभव के आधार पर सही पाठ्यक्रम सुझा सकें।"
                elif recs:
                    return f"आपकी प्रोफ़ाइल तैयार है! iGOT कर्मयोगी पर आपके लिए '{recs[0]['title']}' पाठ्यक्रम तैयार है।"
                return "आपकी प्रोफ़ाइल तैयार है! आप अनुशंसित पाठ्यक्रम देख सकते हैं, नॉलेज चेक दे सकते हैं, या नीति विवाद में निर्णय अभ्यास कर सकते हैं।"
            if any(w in msg for w in ['resume', 'upload', 'cv', 'biodata']):
                return "अपनी प्रोफ़ाइल (Your Profile) में जाएं और 'Upload Resume' चुनें। आपके अनुभव और शिक्षा के आधार पर आपकी दक्षताओं का विवरण तैयार हो जाएगा।"
            if any(w in msg for w in ['vivaad', 'debate', 'decision', 'faisla', 'niti']):
                return "नीति विवाद में आप वास्तविक नीतिगत मामलों का अध्ययन करते हैं, विभिन्न दृष्टिकोणों की तुलना करते हैं और साक्ष्यों पर आधारित अपना निर्णय प्रस्तुत करते हैं।"
            if any(w in msg for w in ['quiz', 'test', 'pariksha', 'prashna']):
                return "त्वरित नॉलेज चेक आपके सीखे गए विषयों की समझ का परीक्षण करता है और आपकी दक्षताओं के स्तर को अपडेट करता है।"
            return f"नमस्ते {user.get('full_name', 'अधिकारी')}, मैं नीति सारथी बडी हूँ। आप मुझसे अनुशंसित पाठ्यक्रमों, दक्षताओं, या नीति विवाद के बारे में पूछ सकते हैं।"

        # 1. What is Neeti Saarthi
        if any(w in msg for w in ['what is neeti saarthi', 'about neeti saarthi', 'platform', 'what can you do']):
            return "Neeti Saarthi is India's dedicated learning and decision platform for public-sector officials. It helps you assess your skills, discover targeted courses on iGOT Karmayogi, and practice real-world policy decisions in Neeti Vivaad."

        # 2. What should I do next / first step
        if any(w in msg for w in ['what should i do', 'next', 'first', 'start', 'begin', 'where do i begin']):
            if not user.get('profile_complete'):
                return "Your best next step is to upload your resume in Your Profile so we can identify your experience, education, and current competencies."
            elif recs:
                top_c = recs[0]['title']
                return f"Your profile is ready. Your recommended courses are waiting on iGOT Karmayogi, starting with '{top_c}'."
            elif top_gaps:
                return "Your profile is ready. Take a look at My Skills next to review the areas you can strengthen."
            return "Your profile is set up! You can explore recommended courses, take a Knowledge Check, or practice policy decisions in Neeti Vivaad."

        # 3. Resume / Profile upload
        if any(w in msg for w in ['resume', 'upload', 'cv', 'biodata']):
            if user.get('profile_complete'):
                return "Your resume is already uploaded and your profile is complete. You can review or edit your information in Your Profile anytime."
            return "Go to Your Profile and select Upload Resume. We'll use it to help create your official profile and extract your competencies."

        # 4. What is my profile / Who am I
        if any(w in msg for w in ['my profile', 'who am i', 'profile status']):
            skills_text = f"You have {len(skills)} confirmed skills on record." if skills else "No skills extracted yet."
            return f"You are signed in as {user.get('full_name')}, serving as {user.get('designation')} in {user.get('department')}. {skills_text}"

        # 5. Course recommendations / What should I learn next
        if any(w in msg for w in ['learn', 'course', 'recommend', 'study', 'class', 'training']):
            if recs:
                top_course = recs[0]['title']
                if len(recs) > 1:
                    return f"Based on your profile, I recommend starting with '{top_course}'. You also have '{recs[1]['title']}' waiting in your Recommended for You section on iGOT Karmayogi."
                return f"Based on your current skill profile, I recommend starting with '{top_course}'. You can find it in your Recommended for You section."
            elif not user.get('profile_complete'):
                return "To get personalized course recommendations, complete your profile by uploading your resume first. I'll then match you with targeted lessons on iGOT Karmayogi."
            return "Explore the Learn section to browse available courses across Statistical Methodology, Technical Tools, and Governance."

        # 6. Skills to improve / Gaps
        if any(w in msg for w in ['skill', 'improve', 'gap', 'strengthen', 'weak', 'competency']):
            if top_gaps:
                gap_names = [g['subskill_name'] for g in top_gaps[:2]]
                return f"Right now, focusing on {', and '.join(gap_names)} will help you grow the fastest. You can find recommended courses for these right on your dashboard."
            elif skills:
                return f"You have {len(skills)} confirmed skills on record, including {skills[0]}. Keep practicing in Knowledge Checks to raise your proficiency scores."
            return "Upload your resume in Your Profile to identify your current skill strengths and the areas where targeted learning will help you most."

        # 7. Progress / Completed
        if any(w in msg for w in ['how many courses', 'completed', 'progress', 'growth', 'score']):
            quiz_count = len(quizzes)
            debate_count = len(debates)
            if quiz_count > 0 or debate_count > 0:
                return f"You have completed {quiz_count} Knowledge Checks and {debate_count} Neeti Vivaad decisions. Every completed scenario updates your learning progress in Your Growth."
            return "You haven't completed any assessments yet. Take a quick Knowledge Check after learning to see your progress recorded in Your Growth."

        # 8. Knowledge Check / Quizzes
        if any(w in msg for w in ['quiz', 'test', 'knowledge check', 'assessment', 'question']):
            return "Quick Knowledge Checks test what you remember after each lesson using verified source materials. They take just a few minutes, provide diagnostic feedback, and update your skill progress."

        # 9. Neeti Vivaad / Policy Decisions
        if any(w in msg for w in ['vivaad', 'debate', 'decision', 'scenario', 'perspective', 'policy']):
            if debates and any(v.get('score') is not None for v in debates):
                last_v = next(v for v in debates if v.get('score') is not None)
                return f"In your recent Neeti Vivaad simulation '{last_v['scenario_title']}', you scored {last_v['score']}% on policy reasoning. Practicing more scenarios helps hone your evidence-backed decision making."
            return "Neeti Vivaad lets you practice real-world policy decisions. You'll examine authentic situations, hear multiple stakeholder perspectives, consider source evidence, submit your reasoned decision, and receive structured multi-criteria feedback."

        # 10. Default graceful fallback
        return f"There's not enough reliable information to give a specific answer yet. You can ask me about your recommended courses, confirmed skills, Knowledge Checks, or how to practice policy decisions in Neeti Vivaad."

    @classmethod
    def _get_followup_suggestions(cls, context: dict, is_hindi: bool = False) -> list:
        if is_hindi:
            return ["मेरा अगला कदम क्या होना चाहिए?", "बायोडाटा कैसे अपलोड करें?", "नीति विवाद कैसे काम करता है?"]

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

    @classmethod
    def _call_ai_buddy(cls, message: str, context: dict, is_hindi: bool = False) -> str | None:
        """Call AI provider to generate personalized official companion reply."""
        from neeti_vivaad.ai import generate_text
        user = context.get('user', {})
        role = user.get('designation', 'Civil Servant')
        dept = user.get('department', 'Government of India')
        system_instruction = (
            "You are Neeti Saarthi Buddy, an intelligent and encouraging AI learning companion for Indian civil servants and statistical officers. "
            "Respond concisely in 2 to 3 sentences. Be practical, official, and constructive. "
            f"The officer is a {role} in {dept}. "
            f"{'Answer in polite, clear Hindi.' if is_hindi else 'Answer in professional English.'}"
        )
        prompt = f"{system_instruction}\n\nOfficer: {message}\nNeeti Saarthi Buddy:"
        reply = generate_text(prompt, temperature=0.3, max_tokens=600)
        return reply.strip()

