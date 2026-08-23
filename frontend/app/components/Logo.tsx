import React from 'react';
import Image from 'next/image';

export function VivaadTreeLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-sm ${className}`}>
      <img
        src="/assets/app_logo.png"
        alt="Neeti Vivaad Logo"
        className="w-full h-full object-cover rounded-xl"
      />
    </div>
  );
}

export const PlainviewSunLogo = VivaadTreeLogo;
export const SupabazeEmeraldLogo = VivaadTreeLogo;

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };

  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <VivaadTreeLogo className={iconSizes[size]} />
      <div className="flex flex-col">
        <span className={`font-semibold tracking-tight text-[#171717] font-sans ${textSizes[size]} flex items-center gap-1.5 leading-none`}>
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
