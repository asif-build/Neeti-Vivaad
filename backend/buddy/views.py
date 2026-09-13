import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .services.context_service import BuddyContextService
from .services.buddy_service import BuddyService

class BuddyChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        current_route = request.data.get('page', '') or request.data.get('current_route', '')

        if not message:
            return Response(
                {'error': 'Message is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = BuddyService.answer_question(request.user, message, current_route)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"[BuddyChatView Error]: {e}")
            return Response({
                'message': "I'm having trouble reaching Neeti Saarthi right now. Please try again in a moment.",
                'should_speak': False,
                'suggested_actions': ["Try again", "What should I do first?"],
                'context': 'general'
            }, status=status.HTTP_200_OK)

class BuddyContextView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        current_route = request.query_params.get('route', '')
        user_context = BuddyContextService.get_user_context(request.user, current_route)
        suggestions_data = BuddyContextService.get_route_suggestions(
            user_context['page_intent'],
            user_context
        )

        is_auth = bool(request.user and getattr(request.user, 'is_authenticated', False))
        tour_completed = request.user.onboarding_tour_completed if is_auth else True
        voice_enabled = request.user.buddy_voice_enabled if is_auth else True
        language = request.user.buddy_language if is_auth else 'en'

        return Response({
            'context': user_context,
            'greeting': suggestions_data['greeting'],
            'suggestions': suggestions_data['suggestions'],
            'onboarding_tour_completed': tour_completed,
            'buddy_voice_enabled': voice_enabled,
            'buddy_language': language
        }, status=status.HTTP_200_OK)

class BuddyTourStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        completed = request.data.get('completed', True)
        if isinstance(completed, str):
            completed = completed.lower() in ('true', '1', 'yes')

        user = request.user
        user.onboarding_tour_completed = bool(completed)
        user.save(update_fields=['onboarding_tour_completed'])

        return Response({
            'status': 'success',
            'onboarding_tour_completed': user.onboarding_tour_completed,
            'message': 'Tour status updated successfully.'
        }, status=status.HTTP_200_OK)

class BuddyVoiceSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        update_fields = []

        if 'voice_enabled' in request.data:
            voice_val = request.data.get('voice_enabled')
            if isinstance(voice_val, str):
                voice_val = voice_val.lower() in ('true', '1', 'yes')
            user.buddy_voice_enabled = bool(voice_val)
            update_fields.append('buddy_voice_enabled')

        if 'language' in request.data:
            lang = str(request.data.get('language', 'en')).strip()[:20]
            user.buddy_language = lang
            update_fields.append('buddy_language')

        if update_fields:
            user.save(update_fields=update_fields)

        return Response({
            'status': 'success',
            'buddy_voice_enabled': user.buddy_voice_enabled,
            'buddy_language': user.buddy_language,
            'message': 'Voice settings updated successfully.'
        }, status=status.HTTP_200_OK)

class BuddyTTSView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Text is required for speech synthesis.'}, status=status.HTTP_400_BAD_REQUEST)

        # Server-side TTS fallback payload for browser client
        return Response({
            'status': 'ready',
            'client_synthesis': True,
            'text': text,
            'language': request.user.buddy_language or 'en-IN'
        }, status=status.HTTP_200_OK)

class BuddySTTView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Graceful fallback endpoint if client sends pre-recorded audio snippet
        return Response({
            'status': 'ready',
            'message': 'Client Web Speech Recognition is active and preferred.'
        }, status=status.HTTP_200_OK)
