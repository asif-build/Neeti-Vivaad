from django.urls import path
from .views import (
    BuddyChatView,
    BuddyContextView,
    BuddyTourStatusView,
    BuddyVoiceSettingsView,
    BuddyTTSView,
    BuddySTTView
)

urlpatterns = [
    path('chat/', BuddyChatView.as_view(), name='buddy-chat'),
    path('context/', BuddyContextView.as_view(), name='buddy-context'),
    path('tour-status/', BuddyTourStatusView.as_view(), name='buddy-tour-status'),
    path('voice-settings/', BuddyVoiceSettingsView.as_view(), name='buddy-voice-settings'),
    path('text-to-speech/', BuddyTTSView.as_view(), name='buddy-tts'),
    path('speech-to-text/', BuddySTTView.as_view(), name='buddy-stt'),
]
