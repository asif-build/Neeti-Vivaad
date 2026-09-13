'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useBuddy } from './useBuddy';
import { BuddyButton } from './BuddyButton';
import { BuddyPanel } from './BuddyPanel';

const EXCLUDED_ROUTES = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-email-notice',
  '/forgot-password',
  '/reset-password',
];

export const NeetiSaarthiBuddy: React.FC = () => {
  const pathname = usePathname();
  const {
    isPanelOpen,
    voiceEnabled,
    contextData,
    hasUnread,
    setIsPanelOpen,
    toggleVoice,
    currentRoute,
  } = useBuddy();

  // Do not render on authentication and verification pages
  if (pathname && EXCLUDED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  return (
    <>
      {/* 1. Expandable Buddy Guidance Panel */}
      <BuddyPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoice}
        currentRoute={currentRoute}
        initialGreeting={contextData?.greeting}
        initialSuggestions={contextData?.suggestions}
      />

      {/* 2. Persistent Floating Buddy Button */}
      <BuddyButton
        isOpen={isPanelOpen}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        hasUnread={hasUnread}
      />
    </>
  );
};

export { BuddyAvatar } from './BuddyAvatar';
export { VoiceService, voiceService } from './VoiceService';
export default NeetiSaarthiBuddy;
