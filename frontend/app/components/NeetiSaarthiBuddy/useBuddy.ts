'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getAccessToken, authFetch } from '../../utils/api';
import { BuddyContextResponse } from './types';

export function useBuddy() {
  const pathname = usePathname();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buddy_voice_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [contextData, setContextData] = useState<BuddyContextResponse | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Fetch contextual prompts for the current page
  const fetchContext = useCallback(async (route: string) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await authFetch(`/api/buddy/context/?route=${encodeURIComponent(route)}`);
      if (res.ok) {
        const data: BuddyContextResponse = await res.json();
        setContextData(data);

        if (data.buddy_voice_enabled !== undefined) {
          setVoiceEnabled(data.buddy_voice_enabled);
          if (typeof window !== 'undefined') {
            localStorage.setItem('buddy_voice_enabled', String(data.buddy_voice_enabled));
          }
        }
      }
    } catch (err) {
      console.warn('[useBuddy] Context fetch notice:', err);
    }
  }, []);

  // Re-fetch when route changes
  useEffect(() => {
    if (pathname) {
      fetchContext(pathname);
    }
  }, [pathname, fetchContext]);

  // Toggle voice and persist
  const toggleVoice = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('buddy_voice_enabled', String(enabled));
    }
    const token = getAccessToken();
    if (token) {
      authFetch('/api/buddy/voice-settings/', {
        method: 'POST',
        body: JSON.stringify({ voice_enabled: enabled })
      }).catch(() => {});
    }
  };

  // Listen for proactive application events (resume upload, quiz submit, debate decision)
  useEffect(() => {
    const handleProactiveGuidance = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setHasUnread(true);
      }
    };

    window.addEventListener('buddy-guidance', handleProactiveGuidance);
    return () => window.removeEventListener('buddy-guidance', handleProactiveGuidance);
  }, []);

  const openPanel = () => {
    setIsPanelOpen(true);
    setHasUnread(false);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return {
    isPanelOpen,
    voiceEnabled,
    contextData,
    hasUnread,
    openPanel,
    closePanel,
    setIsPanelOpen,
    toggleVoice,
    currentRoute: pathname || '/'
  };
}
