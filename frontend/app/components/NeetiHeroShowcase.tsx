'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare } from 'lucide-react';

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
        
        {/* Top Split Layout: Headline Left + Direct Indian Artwork Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8 md:mb-12">
          
          {/* Top Left: Headline & Description */}
          <div className="lg:col-span-7 space-y-4">
            
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
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link href="/debate" className="btn-secondary-outline px-6 py-3 text-sm">
                <MessageSquare className="w-4 h-4 text-[#171717]" />
                <span>See a Live Debate</span>
              </Link>
            </div>

          </div>

          {/* Top Right: Direct Artwork Graphic (No card container, no background box, no cursor pills/icons) */}
          <div className="lg:col-span-5 flex items-center justify-center mt-4 lg:mt-0">
            <img
              src="/assets/india_art.jpg"
              alt="India Official Statistical System Artwork"
              className="w-full max-w-[500px] h-auto object-contain mix-blend-multiply"
            />
          </div>

        </div>

        {/* Bottom Giant Display Typography (Matching Flim Display Banner) */}
        <div className="w-full text-center overflow-hidden pt-4 pb-2 border-t border-[#dfdfdf]/60">
          <h2 className="text-[14vw] sm:text-[13vw] lg:text-[140px] font-extrabold tracking-[-0.05em] text-[#171717] leading-[0.82] uppercase select-none font-sans">
            Neeti Saarthi
          </h2>
        </div>

      </div>

    </section>
  );
}
