'use client';

import React, { useState } from 'react';
import { BarChart3, Shield, Cpu, Scale, BookOpen, Sparkles } from 'lucide-react';

interface CourseThumbnailProps {
  thumbnailUrl?: string | null;
  title: string;
  fallbackCategory?: string;
  category?: string;
  className?: string;
}

export const CourseThumbnail: React.FC<CourseThumbnailProps> = ({
  thumbnailUrl,
  title,
  fallbackCategory = 'General',
  category = 'General',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const catLower = (fallbackCategory || category || '').toLowerCase();

  // If valid image URL provided and no load error occurred
  if (thumbnailUrl && !imgError) {
    return (
      <div className={`relative w-full aspect-video overflow-hidden bg-[#0B1F3A] ${className}`}>
        <img
          src={thumbnailUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/20 text-[9px] font-mono text-zinc-200 uppercase tracking-wider">
          iGOT Content
        </div>
      </div>
    );
  }

  // Deterministic clean fallback based on course category
  let bgGradient = "from-[#0B1F3A] to-[#1E293B]";
  let iconColor = "text-[#F2A900]";
  let icon = <BarChart3 className="w-10 h-10 text-[#F2A900]" />;
  let categoryLabel = "Statistical Methodology";

  if (catLower.includes('digit') || catLower.includes('secur') || catLower.includes('privac')) {
    bgGradient = "from-[#064E3B] to-[#0B1F3A]";
    iconColor = "text-[#34D399]";
    icon = <Shield className="w-10 h-10 text-[#34D399]" />;
    categoryLabel = "Digital Governance";
  } else if (catLower.includes('tech') || catLower.includes('soft') || catLower.includes('tool')) {
    bgGradient = "from-[#1E293B] to-[#0F766E]";
    iconColor = "text-[#38BDF8]";
    icon = <Cpu className="w-10 h-10 text-[#38BDF8]" />;
    categoryLabel = "Technical & Tools";
  } else if (catLower.includes('behav') || catLower.includes('decision') || catLower.includes('manage') || catLower.includes('leader')) {
    bgGradient = "from-[#78350F] to-[#0B1F3A]";
    iconColor = "text-[#FCD34D]";
    icon = <Scale className="w-10 h-10 text-[#FCD34D]" />;
    categoryLabel = "Policy & Governance";
  } else if (catLower.includes('statist') || catLower.includes('data')) {
    bgGradient = "from-[#0B1F3A] to-[#1E3A8A]";
    iconColor = "text-[#F2A900]";
    icon = <BarChart3 className="w-10 h-10 text-[#F2A900]" />;
    categoryLabel = "Statistical Architecture";
  }

  return (
    <div className={`relative w-full aspect-video overflow-hidden bg-gradient-to-br ${bgGradient} flex flex-col justify-between p-4 text-white border-b-2 border-[#111111] select-none ${className}`}>
      {/* Background brutalist grid motif */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Top row: Ministry / Platform indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 border border-white/20 text-zinc-300">
          iGOT KARMAYOGI
        </span>
        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black">
          Official Module
        </span>
      </div>

      {/* Center: Category Vector Icon and Label */}
      <div className="relative z-10 my-auto flex items-center gap-3">
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 shadow-sm shrink-0">
          {icon}
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-zinc-300 block">
            {categoryLabel}
          </span>
          <h4 className="font-display font-extrabold uppercase text-sm sm:text-base text-white leading-tight line-clamp-2">
            {title}
          </h4>
        </div>
      </div>

      {/* Bottom row: Explicit Honest Fallback Notice */}
      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-mono text-zinc-400">
        <span>Capacity Building Commission</span>
        <span className="text-zinc-400 italic">
          Deterministic Category Illustration
        </span>
      </div>
    </div>
  );
};
