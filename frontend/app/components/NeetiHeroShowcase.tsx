'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function NeetiHeroShowcase() {
  return (
    <section className="relative w-full bg-white text-[#111111] overflow-hidden border-b-2 border-[#111111] pt-10 sm:pt-14 pb-0 px-4 sm:px-8 select-none flex flex-col items-center text-center">
      
      {/* Top Floating Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white border-2 border-[#111111] text-xs font-mono text-[#111111] shadow-brutal-sm font-bold"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
        <span>LEARN &bull; GROW &bull; SERVE &bull; A STRONGER INDIA</span>
      </motion.div>

      {/* Main Headline */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        className="space-y-3 max-w-4xl mx-auto mt-4"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] font-sans font-black tracking-[-0.03em] text-[#111111] leading-[1.08]">
          India&apos;s public servants,<br />
          stronger together.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-[#374151] font-serif font-normal max-w-2xl mx-auto leading-relaxed mt-3">
          Neeti Saarthi helps public officials understand their strengths, discover the right courses, build new skills, and practise real-world policy decisions.
        </p>
      </motion.div>

      {/* Action CTA Button */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="mt-5 flex flex-col items-center z-10"
      >
        <Link 
          href="/register" 
          className="btn-brutal-emerald !bg-[#2DD4BF] !text-[#111111] !text-base !font-bold !py-3.5 !px-8 shadow-brutal rounded-full border-2 border-[#111111] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Sub-tags */}
        <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#4B5563] uppercase mt-5">
          SKILLS &bull; COURSES &bull; KNOWLEDGE CHECKS &bull; POLICY DECISIONS
        </div>
      </motion.div>

      {/* Vector Sharp Floating Sticker (Different Beliefs, Same Purpose, A Better India) */}
      <motion.div 
        animate={{ y: [0, -6, 0], rotate: [6, 4, 6] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="hidden md:flex flex-col items-end absolute right-6 lg:right-16 top-[40%] lg:top-[42%] z-20 select-none pointer-events-none text-right"
      >
        <div className="font-['Caveat',cursive] text-2xl lg:text-[1.85rem] font-bold leading-[1.1] text-[#111111] tracking-wide">
          <div>Different</div>
          <div>Beliefs</div>
          <div className="mt-0.5">Same Purpose</div>
          <div>A Better India</div>
        </div>
        
        {/* Tricolor Brush Stroke Underlines */}
        <div className="mt-1 flex flex-col items-end gap-0.5 w-full">
          <div className="h-1.5 w-24 bg-[#FF9933] rounded-full shadow-xs" />
          <div className="h-1.5 w-20 bg-[#138808] rounded-full shadow-xs" />
        </div>
      </motion.div>

      {/* Bottom Public Servants Crowd Artwork (Crisp High-Res Vector-Quality Rendering) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
        className="w-full max-w-[1320px] mx-auto mt-4 sm:mt-6 flex items-end justify-center"
      >
        <img 
          src="/images/india_officers_sharp.png"
          srcSet="/images/india_officers_native.png 1024w, /images/india_officers_2x.png 2048w, /images/india_officers_sharp.png 4096w"
          sizes="(max-width: 768px) 100vw, (max-width: 1440px) 1320px, 1440px"
          alt="India's Public Servants Stronger Together"
          width={4096}
          height={800}
          loading="eager"
          decoding="async"
          className="w-full h-auto max-w-full block object-contain select-none pointer-events-none"
          style={{ imageRendering: 'auto' }}
        />
      </motion.div>
    </section>
  );
}

export default NeetiHeroShowcase;




