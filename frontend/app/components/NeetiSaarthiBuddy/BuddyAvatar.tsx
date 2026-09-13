'use client';

import React from 'react';
import Image from 'next/image';
import { MascotState } from './types';

interface BuddyAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state?: MascotState;
  className?: string;
  showBadge?: boolean;
}

export const BuddyAvatar: React.FC<BuddyAvatarProps> = ({
  size = 'md',
  state = 'idle',
  className = '',
  showBadge = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-[22px]',
    xl: 'w-24 h-24 rounded-[30px]',
  };

  const imageSizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  // State aura & rings
  const stateBorderClasses: Record<MascotState, string> = {
    idle: 'border-2 border-[#111111] shadow-brutal-sm',
    greeting: 'border-2 border-[#111111] ring-4 ring-[#F2A900]/40 shadow-brutal-sm animate-bounce-subtle',
    thinking: 'border-2 border-[#111111] ring-4 ring-[#0F766E]/40 shadow-brutal animate-pulse',
    listening: 'border-2 border-[#0F766E] ring-4 ring-[#0F766E]/50 shadow-brutal animate-pulse',
    speaking: 'border-2 border-[#059669] ring-4 ring-[#059669]/60 shadow-brutal',
    success: 'border-2 border-[#F2A900] ring-4 ring-[#F2A900]/60 shadow-brutal-lg',
    error: 'border-2 border-rose-600 ring-4 ring-rose-300 shadow-brutal',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Mascot Card Container */}
      <div
        className={`relative overflow-hidden bg-black flex items-center justify-center transition-all duration-300 ${sizeClasses[size]} ${stateBorderClasses[state]}`}
        style={{
          boxShadow: state === 'speaking' ? '0 0 16px rgba(16, 185, 129, 0.45)' : undefined
        }}
      >
        <Image
          src="/images/buddy.png"
          alt="Neeti Saarthi Buddy"
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300"
          priority
          unoptimized
        />

        {/* State Indicators overlay */}
        {state === 'listening' && (
          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-ping" />
        )}
        {state === 'speaking' && (
          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
        )}
      </div>

      {/* Unread / Notification Sparkle Badge */}
      {showBadge && (
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F2A900] border-2 border-[#111111] rounded-full flex items-center justify-center text-[8px] font-bold text-[#111111] shadow-brutal-sm"
          title="New suggestion"
        >
          ★
        </span>
      )}
    </div>
  );
};
