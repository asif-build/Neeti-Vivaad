'use client';

import React, { useState } from 'react';
import { BuddyAvatar } from './BuddyAvatar';
import { MascotState } from './types';
import { Sparkles, MessageSquare, X } from 'lucide-react';

interface BuddyButtonProps {
  isOpen: boolean;
  onClick: () => void;
  mascotState?: MascotState;
  hasUnread?: boolean;
}

export const BuddyButton: React.FC<BuddyButtonProps> = ({
  isOpen,
  onClick,
  mascotState = 'idle',
  hasUnread = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3">
      {/* Tooltip on Hover */}
      <div
        className={`hidden sm:flex items-center gap-1.5 bg-white border-2 border-[#111111] shadow-brutal-sm px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#111111] pointer-events-none transition-all duration-200 transform ${
          isHovered && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
        <span>Need help? Ask Buddy</span>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={isOpen ? "Close Neeti Saarthi Buddy" : "Open Neeti Saarthi Buddy"}
        className={`group relative flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900] ${
          isOpen ? 'scale-95' : 'hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-[#111111] text-white border-2 border-[#111111] shadow-brutal flex items-center justify-center transition-transform group-hover:rotate-90">
            <X className="w-6 h-6 text-white" />
          </div>
        ) : (
          <BuddyAvatar
            size="lg"
            state={mascotState}
            showBadge={hasUnread}
            className="cursor-pointer"
          />
        )}
      </button>
    </div>
  );
};
