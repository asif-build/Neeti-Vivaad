import React from 'react';

export function VivaadTreeLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-lg overflow-hidden shadow-sm ${className}`}>
      <img
        src="/assets/app_logo.png"
        alt="Neeti Vivaad Logo"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  );
}

export const PlainviewSunLogo = VivaadTreeLogo;
export const SupabazeEmeraldLogo = VivaadTreeLogo;

export function Logo({ size = "md", isDark = true }: { size?: "sm" | "md" | "lg"; isDark?: boolean }) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className="flex items-center gap-2.5 group cursor-pointer">
      <VivaadTreeLogo className={iconSizes[size]} />
      <div className="flex flex-col">
        <span className={`font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#171717]'} font-sans ${textSizes[size]} flex items-center gap-1.5 leading-none`}>
          Neeti Vivaad
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
        </span>
        <span className={`text-[9px] tracking-widest uppercase font-mono ${isDark ? 'text-zinc-400' : 'text-[#707070]'} font-normal mt-0.5`}>
          MOSPI SKILL INTELLIGENCE
        </span>
      </div>
    </div>
  );
}
