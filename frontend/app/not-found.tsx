import React from 'react';
import Link from 'next/link';
import { Home, Compass, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center font-sans relative overflow-hidden bg-white text-[#111111] selection:bg-[#F2A900] selection:text-[#111111]">
      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center space-y-6">
        {/* Centerpiece Illustration Card */}
        <div className="card-brutal bg-white p-6 sm:p-8 rounded-[28px] shadow-brutal-xl relative w-full max-w-[380px] flex flex-col items-center justify-center">
          
          {/* Rotated Starburst Badges */}
          <div className="absolute -top-3 -right-3 z-20 badge-starburst badge-starburst-saffron rotate-3 shadow-brutal-sm">
            ★ UNRESOLVED ROUTE
          </div>

          <div className="absolute -bottom-3 -left-3 z-20 badge-starburst badge-starburst-emerald -rotate-2 shadow-brutal-sm">
            ★ ERROR 404
          </div>

          {/* Illustration Frame */}
          <div className="w-full bg-[#FAF9F5] rounded-2xl border-2 border-[#111111] p-4 flex items-center justify-center overflow-hidden">
            <img 
              src="/images/not-found.jpg" 
              alt="Neeti Saarthi Resource Not Found Searching Illustration"
              className="w-full max-h-[220px] object-contain rounded-xl"
            />
          </div>

          {/* Big Space Grotesk 404 Label */}
          <div className="pt-3 flex items-center justify-center gap-2">
            <span className="text-4xl font-display font-black tracking-tight text-[#111111]">
              404
            </span>
            <span className="text-xs font-mono font-bold uppercase text-[#4B5563]">
              &bull; ROUTE AUDIT FAILED
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight text-[#111111]">
            Statistical Resource Not Found
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#4B5563] max-w-md mx-auto leading-relaxed">
            The requested statistical module, circular document, or debate arena pathway cannot be located. It may have been archived or re-indexed under new IDQF standards.
          </p>
        </div>

        {/* Primary & Secondary Action CTAs */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-brutal-primary !text-xs !py-3 !px-6 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Showcase</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard"
            className="btn-brutal-secondary !text-xs !py-3 !px-6 flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Learner Dossier</span>
          </Link>
        </div>

        {/* Quick Links Footer */}
        <div className="pt-6 border-t-2 border-[#111111] w-full max-w-md">
          <span className="text-[11px] font-mono font-bold text-[#4B5563] uppercase tracking-wider block mb-3">
            VERIFIED PLATFORM MODULES
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Link 
              href="/courses" 
              className="p-2.5 rounded-xl bg-white border-2 border-[#111111] text-[#111111] font-display font-bold uppercase shadow-brutal-sm hover:translate-y-[-2px] transition-transform flex flex-col items-center gap-1 text-[10px]"
            >
              <BookOpen className="w-4 h-4 text-[#0F766E]" />
              <span>iGOT Courses</span>
            </Link>

            <Link 
              href="/quiz" 
              className="p-2.5 rounded-xl bg-white border-2 border-[#111111] text-[#111111] font-display font-bold uppercase shadow-brutal-sm hover:translate-y-[-2px] transition-transform flex flex-col items-center gap-1 text-[10px]"
            >
              <Compass className="w-4 h-4 text-[#F2A900]" />
              <span>AI Quiz Studio</span>
            </Link>

            <Link 
              href="/debate" 
              className="p-2.5 rounded-xl bg-white border-2 border-[#111111] text-[#111111] font-display font-bold uppercase shadow-brutal-sm hover:translate-y-[-2px] transition-transform flex flex-col items-center gap-1 text-[10px]"
            >
              <MessageSquare className="w-4 h-4 text-[#0B1F3A]" />
              <span>Neeti Vivaad</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
