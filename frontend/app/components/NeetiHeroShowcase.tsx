'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Navigation } from 'lucide-react';

export function NeetiHeroShowcase() {
  return (
    <section className="relative w-full bg-white border-b border-[#ededed] overflow-hidden py-12 md:py-20 selection:bg-[#3ecf8e] selection:text-[#171717]">
      
      {/* Background Graph Paper Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Split Layout: Headline Left + Indian Artwork Showcase Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8 md:mb-12">
          
          {/* Top Left: Headline & Description */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#dfdfdf] text-xs font-mono text-[#171717] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
              <span>Built for MoSPI · Aligned with iGOT Karmayogi · Grounded in NSC Standards</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#171717] leading-[1.1]">
              Made for Statistical Officers.<br />
              <span className="text-[#707070]">Built for Policy Decision Makers.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#707070] max-w-2xl font-normal leading-relaxed">
              A skill intelligence platform for India's Official Statistical System — mapping competency gaps, generating instant assessments, and training real judgment through AI-moderated policy debates.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="btn-primary-green px-6 py-3 text-sm shadow-xs">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link href="/debate" className="btn-secondary-outline px-6 py-3 text-sm">
                <MessageSquare className="w-4 h-4 text-[#171717]" />
                <span>See a Live Debate</span>
              </Link>
            </div>

          </div>

          {/* Top Right: Clean Non-Watermarked Indian Artwork Graphic & Floating Agent Badges */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            
            {/* Sparkle Accent Icon */}
            <div className="absolute -top-6 -right-2 text-[#3ecf8e] animate-pulse pointer-events-none z-20">
              <svg viewBox="0 0 100 100" className="w-12 h-12 fill-current">
                <path d="M50 0 C50 30 70 50 100 50 C70 50 50 70 50 100 C50 70 30 50 0 50 C30 50 50 30 50 0 Z" />
              </svg>
            </div>

            {/* Floating Cursor Pill 1: Rajesh (Orange/Amber) */}
            <div className="absolute -top-4 left-4 z-20 flex items-center gap-1 bg-[#ff9500] text-white text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full shadow-md animate-bounce" style={{ animationDuration: '3s' }}>
              <Navigation className="w-3 h-3 fill-current rotate-45" />
              <span>Rajesh (SSO)</span>
            </div>

            {/* Floating Cursor Pill 2: Dr. Sharma (Yellow) */}
            <div className="absolute top-1/2 -right-4 z-20 flex items-center gap-1 bg-[#ffcc00] text-black text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full shadow-md">
              <Navigation className="w-3 h-3 fill-current rotate-45" />
              <span>Dr. Sharma</span>
            </div>

            {/* Floating Cursor Pill 3: Data Officer (Emerald Green) */}
            <div className="absolute -bottom-4 right-12 z-20 flex items-center gap-1 bg-[#3ecf8e] text-[#171717] text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full shadow-md">
              <Navigation className="w-3 h-3 fill-current rotate-45" />
              <span>Data Officer</span>
            </div>

            {/* Clean Non-Watermarked Indian Artwork Container */}
            <div className="rounded-2xl bg-white border border-[#dfdfdf] shadow-2xl p-2.5 relative overflow-hidden group">
              <img
                src="/assets/india_art.jpg"
                alt="India Official Statistical System Artwork"
                className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>

          </div>

        </div>

        {/* Bottom Giant Display Typography (Matching Flim Display Banner) */}
        <div className="w-full text-center overflow-hidden pt-4 pb-2 border-t border-[#dfdfdf]/60">
          <h2 className="text-[15vw] sm:text-[14vw] lg:text-[160px] font-extrabold tracking-[-0.05em] text-[#171717] leading-[0.82] uppercase select-none font-sans">
            Neeti Vivaad
          </h2>
        </div>

      </div>

    </section>
  );
}
