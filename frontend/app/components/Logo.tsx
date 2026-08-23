import React from 'react';

export function SupabazeEmeraldLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full text-[#3ecf8e]">
        <path
          d="M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="16" fill="currentColor" />
      </svg>
    </div>
  );
}

export const PlainviewSunLogo = SupabazeEmeraldLogo;

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };

  return (
    <div className="flex items-center gap-2.5 group cursor-pointer">
      <div className="p-1 rounded-[6px] bg-[#171717] text-[#3ecf8e] shadow-sm">
        <SupabazeEmeraldLogo className={iconSizes[size]} />
      </div>
      <div className="flex flex-col">
        <span className={`font-medium tracking-tight text-[#171717] font-sans ${textSizes[size]} flex items-center gap-1.5 leading-none`}>
          Neeti Vivaad
          <span className="inline-block w-2 h-2 rounded-full bg-[#3ecf8e]" />
        </span>
        <span className="text-[10px] tracking-wider uppercase font-mono text-[#707070] font-normal mt-1">
          MOSPI SKILL INTELLIGENCE
        </span>
      </div>
    </div>
  );
}
