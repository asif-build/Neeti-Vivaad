'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BuddyAvatar } from './BuddyAvatar';
import { MascotState, BuddyMessage, VoiceModeState } from './types';
import { voiceService } from './VoiceService';
import { authFetch } from '../../utils/api';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Square, X, 
  ArrowRight, Loader2, AlertCircle, RotateCcw, Globe
} from 'lucide-react';

interface BuddyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceEnabled: boolean;
  onToggleVoice: (enabled: boolean) => void;
  currentRoute: string;
  initialGreeting?: string;
  initialSuggestions?: string[];
  subtitle?: string;
}

export const BuddyPanel: React.FC<BuddyPanelProps> = ({
  isOpen,
  onClose,
  voiceEnabled,
  onToggleVoice,
  currentRoute,
  initialGreeting,
  initialSuggestions = [],
  subtitle: customSubtitle,
}) => {
  const router = useRouter();
  const { language, setLanguage, currentLanguageOption, speechCode } = useLanguage();

  const [messages, setMessages] = useState<BuddyMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceModeState>('IDLE');
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute contextual subtitle based on current route
  const getContextualSubtitle = (): string => {
    if (customSubtitle) return customSubtitle;
    const r = (currentRoute || '').toLowerCase();
    if (r.includes('debate') || r.includes('vivaad')) {
      return "Your decision companion";
    }
    if (r.includes('quiz') || r.includes('courses') || r.includes('learn') || r.includes('assessment')) {
      return "Your learning companion";
    }
    return "Your civil service companion";
  };

  const currentSubtitle = getContextualSubtitle();

  // Initialize first greeting when opened in a session
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingText = initialGreeting || (
        language === 'hi'
          ? "नमस्ते! मैं नीति सारथी बडी हूँ।\nआज मैं आपके सीखने और निर्णयों में कैसे मदद कर सकता हूँ?"
          : "Hi! I'm your Neeti Saarthi Buddy. 👋\nHow can I help you with your learning or policy decisions today?"
      );

      const defaultSuggestions = language === 'hi'
        ? [
            "मेरा अगला कदम क्या होना चाहिए?",
            "बायोडाटा कैसे अपलोड करें?",
            "नीति विवाद कैसे काम करता है?",
            "नीति सारथी क्या है?"
          ]
        : [
            "What should I do next?",
            "How do I upload my resume?",
            "How does Neeti Vivaad work?",
            "What is Neeti Saarthi?"
          ];

      const welcomeMsg: BuddyMessage = {
        id: 'welcome',
        sender: 'buddy',
        text: greetingText,
        timestamp: new Date(),
        actions: initialSuggestions.length > 0 ? initialSuggestions : defaultSuggestions
      };
      setMessages([welcomeMsg]);
      setMascotState('greeting');
      setTimeout(() => setMascotState('idle'), 1500);

      // Speak welcome if voice enabled and not muted
      if (voiceEnabled) {
        setVoiceState('SPEAKING');
        voiceService.speak(
          greetingText,
          () => {
            setVoiceState('SPEAKING');
            setMascotState('speaking');
          },
          () => {
            setVoiceState('IDLE');
            setMascotState('idle');
          },
          () => {
            setVoiceState('IDLE');
            setMascotState('idle');
          },
          speechCode
        );
      }
    }
  }, [isOpen, initialGreeting, initialSuggestions, voiceEnabled, messages.length, language, speechCode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, voiceState]);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleStopAll();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Stop audio and listening on unmount or close
  const handleStopAll = () => {
    voiceService.stop();
    voiceService.stopListening();
    setVoiceState('IDLE');
    setMascotState('idle');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    // Immediately halt any previous voice activity
    voiceService.stop();
    voiceService.stopListening();
    setVoiceState('PROCESSING');

    const userMsg: BuddyMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setMascotState('thinking');
    setVoiceNotice(null);

    try {
      const res = await authFetch('/api/buddy/chat/', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          page: currentRoute,
          language: language
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          const loginMsg: BuddyMessage = {
            id: `buddy-${Date.now()}`,
            sender: 'buddy',
            text: language === 'hi' 
              ? "कृपया अपनी व्यक्तिगत प्रोफ़ाइल और अनुशंसित पाठ्यक्रमों तक पहुँचने के लिए साइन इन करें।"
              : "Please sign in to access your personalized learning profile and recommendations.",
            timestamp: new Date(),
            actions: ["What is Neeti Saarthi?", "How does Neeti Vivaad work?"],
            action_button: { label: "Sign In →", route: "/login" }
          };
          setMessages(prev => [...prev, loginMsg]);
          setIsLoading(false);
          setVoiceState('IDLE');
          setMascotState('idle');
          return;
        }
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      const buddyReply = data.message || "I'm here to help. What else would you like to know?";

      const buddyMsg: BuddyMessage = {
        id: `buddy-${Date.now()}`,
        sender: 'buddy',
        text: buddyReply,
        timestamp: new Date(),
        actions: data.suggested_actions || [],
        action_button: data.action_button
      };

      setMessages(prev => [...prev, buddyMsg]);
      setIsLoading(false);

      // Speak response if voice enabled
      if (voiceEnabled && data.should_speak !== false) {
        setVoiceState('SPEAKING');
        setMascotState('speaking');
        voiceService.speak(
          buddyReply,
          () => {
            setVoiceState('SPEAKING');
            setMascotState('speaking');
          },
          () => {
            setVoiceState('IDLE');
            setMascotState('idle');
          },
          (err) => {
            console.warn('[Buddy TTS notice]:', err);
            setVoiceState('IDLE');
            setMascotState('idle');
          },
          speechCode
        );
      } else {
        setVoiceState('IDLE');
        setMascotState('idle');
      }
    } catch (err) {
      console.warn('[Buddy notice]:', err);
      setIsLoading(false);
      setVoiceState('IDLE');
      setMascotState('error');

      const errorMsg: BuddyMessage = {
        id: `err-${Date.now()}`,
        sender: 'buddy',
        text: "I'm having trouble reaching Neeti Saarthi right now. Please try again in a moment.",
        timestamp: new Date(),
        actions: ["Try again", "What should I do first?"],
        action_button: { label: "Open Your Profile →", route: "/profile/setup" }
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // Start / Stop Microphone Voice Input (Explicit user click only)
  const handleToggleMic = () => {
    if (voiceState === 'LISTENING') {
      voiceService.stopListening();
      setVoiceState('IDLE');
      setMascotState('idle');
      setVoiceNotice(null);
      return;
    }

    // Stop speaking before listening
    voiceService.stop();
    setVoiceState('LISTENING');
    setMascotState('listening');
    setVoiceNotice("Listening...");

    voiceService.startListening(
      (transcript) => {
        setVoiceState('PROCESSING');
        setMascotState('thinking');
        setVoiceNotice(null);
        if (transcript) {
          handleSendMessage(transcript);
        } else {
          setVoiceState('IDLE');
          setMascotState('idle');
        }
      },
      (errorMessage) => {
        setVoiceState('IDLE');
        setMascotState('idle');
        setVoiceNotice(errorMessage);
        setTimeout(() => setVoiceNotice(null), 5000);
      },
      () => {
        setVoiceState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
        setMascotState((prev) => (prev === 'listening' ? 'idle' : prev));
      },
      speechCode
    );
  };

  const handleNavigate = (route: string) => {
    handleStopAll();
    router.push(route);
  };

  if (!isOpen) return null;

  return (
    <aside 
      aria-label="Neeti Saarthi Buddy Guidance Window"
      className="fixed bottom-0 right-0 sm:bottom-24 sm:right-6 z-50 w-full sm:w-[430px] max-h-[92vh] sm:max-h-[660px] flex flex-col bg-white border-2 border-[#111111] rounded-t-3xl sm:rounded-[28px] shadow-brutal-lg overflow-hidden animate-slide-up select-none"
    >
      {/* 1. Header: [Buddy mascot] NEETI SAARTHI BUDDY - [Contextual Subtitle] - [Lang] [🔊] [×] */}
      <div className="bg-[#0B1F3A] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#111111] shrink-0">
        <div className="flex items-center gap-3">
          <BuddyAvatar size="md" state={mascotState} />
          <div>
            <h3 className="font-display font-black text-sm uppercase tracking-wide text-white">
              NEETI SAARTHI BUDDY
            </h3>
            <p className="text-[11px] font-mono text-zinc-300">
              {currentSubtitle}
            </p>
          </div>
        </div>

        {/* Right Header Controls: [Stop if speaking] [Lang Selector] [🔊] [×] */}
        <div className="flex items-center gap-1.5">
          {voiceState === 'SPEAKING' && (
            <button
              onClick={handleStopAll}
              className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 animate-pulse"
              title="Stop speaking"
              aria-label="Stop speaking"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Language Selector Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1 text-[11px] font-mono"
              title="Change speech and response language"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-[#F2A900]" />
              <span className="font-bold uppercase">{language}</span>
            </button>

            {showLangPicker && (
              <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-[#111111] shadow-brutal rounded-xl py-1 z-50 text-xs font-sans text-[#111111] max-h-56 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#F2A900]/20 flex items-center justify-between ${
                      language === l.code ? 'font-bold bg-[#F2A900]/10 text-[#0F766E]' : ''
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{l.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Output Toggle */}
          <button
            onClick={() => onToggleVoice(!voiceEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              voiceEnabled ? 'bg-[#ECFDF5] text-[#059669] border-[#059669]' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title={voiceEnabled ? "Voice output enabled (Click to mute)" : "Voice muted (Click to enable)"}
            aria-label={voiceEnabled ? "Mute Buddy voice" : "Enable Buddy voice"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Close Window */}
          <button
            onClick={() => {
              handleStopAll();
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
            aria-label="Close Buddy panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Dedicated Voice Mode Banner (IDLE / LISTENING / PROCESSING / SPEAKING) */}
      <div className="border-b-2 border-[#111111]">
        {voiceState === 'LISTENING' && (
          <div className="bg-[#FEF3C7] text-amber-950 px-4 py-2 text-xs font-mono font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Listening... ({currentLanguageOption.name})</span>
            </div>
            <button
              onClick={handleToggleMic}
              className="text-[10px] underline text-rose-700 hover:text-rose-900 font-bold"
            >
              Cancel
            </button>
          </div>
        )}

        {voiceState === 'PROCESSING' && (
          <div className="bg-sky-50 text-sky-900 px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
            <span>Understanding...</span>
          </div>
        )}

        {voiceState === 'SPEAKING' && (
          <div className="bg-[#ECFDF5] text-[#065F46] px-4 py-2 text-xs font-mono font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 animate-bounce text-[#059669]" />
              <span>Neeti Saarthi is speaking</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleVoice(!voiceEnabled)}
                className="text-[10px] underline text-zinc-600 hover:text-zinc-900"
              >
                Mute
              </button>
              <button
                onClick={handleStopAll}
                className="text-[10px] uppercase font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md hover:bg-rose-700"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {voiceNotice && voiceState === 'IDLE' && (
          <div className="bg-amber-100 text-amber-900 px-4 py-1.5 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span className="truncate">{voiceNotice}</span>
            </div>
            <button
              onClick={handleToggleMic}
              className="flex items-center gap-1 text-[10px] font-bold text-amber-900 underline ml-2 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Message Thread Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F8F7F2] text-[#111111] text-xs font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl border-2 border-[#111111] shadow-brutal-sm ${
                msg.sender === 'user'
                  ? 'bg-[#111111] text-white rounded-br-none'
                  : 'bg-white text-[#111111] rounded-bl-none'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-line font-medium text-xs sm:text-sm">
                {msg.text}
              </p>
            </div>

            {/* Direct Actionable Navigation Button */}
            {msg.sender === 'buddy' && msg.action_button && (
              <div className="pt-1 pl-1">
                <button
                  onClick={() => handleNavigate(msg.action_button!.route)}
                  className="btn-brutal-primary !text-xs !py-2 !px-4 flex items-center gap-2 shadow-brutal-sm font-bold"
                >
                  <span>{msg.action_button.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Action Suggestion Pills */}
            {msg.sender === 'buddy' && msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 pl-1 max-w-[95%]">
                {msg.actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(act)}
                    className="bg-white hover:bg-[#F2A900] text-[#111111] border border-[#111111] rounded-full px-3 py-1 text-[11px] font-mono font-bold transition-colors shadow-brutal-sm text-left"
                  >
                    {act}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Thinking State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs py-2 px-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F766E]" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Bottom Footer Input: [🎙️ Talk to Buddy] [Type your question...] [→] */}
      <div className="p-3 sm:p-4 bg-white border-t-2 border-[#111111] space-y-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Explicit Click Microphone Voice Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border-2 border-[#111111] transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0F766E] flex items-center gap-1.5 ${
              voiceState === 'LISTENING'
                ? 'bg-rose-500 text-white shadow-brutal-sm animate-pulse'
                : 'bg-[#F8F7F2] hover:bg-[#F2A900] text-[#111111] shadow-brutal-sm'
            }`}
            title={voiceState === 'LISTENING' ? "Listening... Click to stop" : `Talk to Buddy in ${currentLanguageOption.name}`}
            aria-label={voiceState === 'LISTENING' ? "Stop listening" : "Talk to Buddy"}
          >
            {voiceState === 'LISTENING' ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-mono font-bold">Talk</span>
              </>
            )}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              voiceState === 'LISTENING'
                ? "Listening..."
                : language === 'hi'
                ? "नीति सारथी बडी से प्रश्न पूछें..."
                : "Type your question for Buddy..."
            }
            disabled={isLoading || voiceState === 'LISTENING'}
            className="flex-1 bg-[#F8F7F2] border-2 border-[#111111] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-sans text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F2A900] transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || voiceState === 'LISTENING'}
            className="p-2.5 rounded-xl bg-[#111111] text-white hover:bg-[#0F766E] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 border-2 border-[#111111] transition-all shrink-0 shadow-brutal-sm"
            aria-label="Send message to Buddy"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info: Zero AI jargon */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#4B5563] px-1 pt-0.5">
          <span>Grounded in your official profile & authentic materials</span>
          <span className="text-[#0F766E] font-bold">Neeti Saarthi Companion</span>
        </div>
      </div>
    </aside>
  );
};
