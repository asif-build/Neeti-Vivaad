'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BuddyAvatar } from './BuddyAvatar';
import { MascotState, BuddyMessage } from './types';
import { voiceService } from './VoiceService';
import { authFetch } from '../../utils/api';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Square, X, 
  ArrowRight, Loader2, AlertCircle, Sparkles 
} from 'lucide-react';

interface BuddyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceEnabled: boolean;
  onToggleVoice: (enabled: boolean) => void;
  currentRoute: string;
  initialGreeting?: string;
  initialSuggestions?: string[];
}

export const BuddyPanel: React.FC<BuddyPanelProps> = ({
  isOpen,
  onClose,
  voiceEnabled,
  onToggleVoice,
  currentRoute,
  initialGreeting,
  initialSuggestions = [],
}) => {
  const router = useRouter();
  const [messages, setMessages] = useState<BuddyMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize first greeting when opened in a session
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingText = initialGreeting || "Hi! I'm your Neeti Saarthi Buddy. 👋\nHow can I help you with your learning today?";
      const defaultSuggestions = [
        "What should I learn next?",
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
        voiceService.speak(
          greetingText,
          () => {
            setIsSpeaking(true);
            setMascotState('speaking');
          },
          () => {
            setIsSpeaking(false);
            setMascotState('idle');
          }
        );
      }
    }
  }, [isOpen, initialGreeting, initialSuggestions, voiceEnabled, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isListening]);

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
    setIsSpeaking(false);
    setIsListening(false);
    setMascotState('idle');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    // Halt previous speech and mic immediately
    voiceService.stop();
    voiceService.stopListening();
    setIsSpeaking(false);
    setIsListening(false);

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
          page: currentRoute
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          const loginMsg: BuddyMessage = {
            id: `buddy-${Date.now()}`,
            sender: 'buddy',
            text: "Please sign in to access your personalized learning profile and recommendations.",
            timestamp: new Date(),
            actions: ["What is Neeti Saarthi?", "How does Neeti Vivaad work?"],
            action_button: { label: "Sign In →", route: "/login" }
          };
          setMessages(prev => [...prev, loginMsg]);
          setIsLoading(false);
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
      setMascotState('idle');

      // Speak response if voice enabled
      if (voiceEnabled && data.should_speak !== false) {
        voiceService.speak(
          buddyReply,
          () => {
            setIsSpeaking(true);
            setMascotState('speaking');
          },
          () => {
            setIsSpeaking(false);
            setMascotState('idle');
          },
          (err) => {
            console.warn('[Buddy TTS notice]:', err);
            setIsSpeaking(false);
            setMascotState('idle');
          }
        );
      }
    } catch (err) {
      console.warn('[Buddy notice]:', err);
      setIsLoading(false);
      setMascotState('error');

      const errorMsg: BuddyMessage = {
        id: `err-${Date.now()}`,
        sender: 'buddy',
        text: "I'm having trouble reaching Neeti Saarthi right now. Please try again in a moment.",
        timestamp: new Date(),
        actions: ["Try again", "What should I do first?"],
        action_button: { label: "Open Your Profile →", route: "/candidate/onboarding" }
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // Start / Stop Microphone Voice Input
  const handleToggleMic = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      setMascotState('idle');
      setVoiceNotice(null);
      return;
    }

    // Stop speaking before listening
    voiceService.stop();
    setIsSpeaking(false);
    setIsListening(true);
    setMascotState('listening');
    setVoiceNotice("Listening…");

    voiceService.startListening(
      (transcript) => {
        setIsListening(false);
        setMascotState('idle');
        setVoiceNotice(null);
        if (transcript) {
          handleSendMessage(transcript);
        }
      },
      (errorMessage) => {
        setIsListening(false);
        setMascotState('idle');
        setVoiceNotice(errorMessage);
        setTimeout(() => setVoiceNotice(null), 4000);
      },
      () => {
        setIsListening(false);
        setMascotState('idle');
      }
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
      className="fixed bottom-0 right-0 sm:bottom-24 sm:right-6 z-50 w-full sm:w-[420px] max-h-[90vh] sm:max-h-[640px] flex flex-col bg-white border-2 border-[#111111] rounded-t-3xl sm:rounded-[28px] shadow-brutal-lg overflow-hidden animate-slide-up select-none"
    >
      {/* 1. Header: [Buddy mascot] NEETI SAARTHI BUDDY - Your learning & decision guide - [🔊] [×] */}
      <div className="bg-[#0B1F3A] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#111111] shrink-0">
        <div className="flex items-center gap-3">
          <BuddyAvatar size="md" state={mascotState} />
          <div>
            <h3 className="font-display font-black text-sm uppercase tracking-wide text-white">
              NEETI SAARTHI BUDDY
            </h3>
            <p className="text-[11px] font-mono text-zinc-300">
              Your learning & decision guide
            </p>
          </div>
        </div>

        {/* Right Header Controls: [Stop if speaking] [🔊] [×] */}
        <div className="flex items-center gap-1.5">
          {isSpeaking && (
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

      {/* Voice Status Alert / Notice */}
      {voiceNotice && (
        <div className="bg-[#FEF3C7] text-amber-950 px-4 py-2 border-b-2 border-[#111111] text-xs font-mono font-bold flex items-center gap-2 animate-fade-in">
          {isListening ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Listening…</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-800" />
              <span>{voiceNotice}</span>
            </>
          )}
        </div>
      )}

      {/* Speaking Indicator Bar */}
      {isSpeaking && (
        <div className="bg-[#ECFDF5] text-[#065F46] px-4 py-1.5 border-b-2 border-[#111111] text-[11px] font-mono font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#059669]" />
            <span>Speaking…</span>
          </div>
          <button
            onClick={handleStopAll}
            className="text-[10px] uppercase underline text-rose-700 hover:text-rose-900 font-bold"
          >
            Stop
          </button>
        </div>
      )}

      {/* 2. Message Thread Body */}
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
            <span>Thinking…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Footer Input: [🎙️] [Type your question for Buddy...] [→] */}
      <div className="p-3 sm:p-4 bg-white border-t-2 border-[#111111] space-y-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Speech-to-Text Microphone Button: [🎙️] */}
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border-2 border-[#111111] transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0F766E] ${
              isListening
                ? 'bg-rose-500 text-white shadow-brutal-sm animate-pulse'
                : 'bg-[#F8F7F2] hover:bg-[#F2A900] text-[#111111] shadow-brutal-sm'
            }`}
            title={isListening ? "Listening… Click to stop" : "Ask with voice (Microphone)"}
            aria-label={isListening ? "Stop listening" : "Talk to Buddy"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening…" : "Type your question for Buddy..."}
            disabled={isLoading || isListening}
            className="flex-1 bg-[#F8F7F2] border-2 border-[#111111] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-sans text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F2A900] transition-colors"
          />

          {/* Send Button: [→] */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isListening}
            className="p-2.5 rounded-xl bg-[#111111] text-white hover:bg-[#0F766E] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 border-2 border-[#111111] transition-all shrink-0 shadow-brutal-sm"
            aria-label="Send message to Buddy"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#4B5563] px-1 pt-0.5">
          <span>Grounded in your real profile & iGOT data</span>
          <span className="text-[#0F766E] font-bold">Neeti Saarthi Companion</span>
        </div>
      </div>
    </aside>
  );
};
