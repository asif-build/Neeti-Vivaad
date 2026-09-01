'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';

export function Footer() {
  const pathname = usePathname();

  // Hide site-wide footer on auth/registration/onboarding pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/candidate/onboarding') return null;

  return (
    <footer className="border-t border-[#ededed] bg-white py-16 text-[#707070] text-xs font-sans">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="space-y-3">
          <Logo size="sm" isDark={false} />
          <p className="text-xs text-[#707070] leading-[1.45]">
            AI-Powered Skill Intelligence &amp; Policy Debate Platform for India's Official Statistical System.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-[#171717] mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/dashboard" className="hover:text-[#171717] transition-colors">Learner Profile</Link></li>
            <li><Link href="/courses" className="hover:text-[#171717] transition-colors">iGOT Courses</Link></li>
            <li><Link href="/quiz" className="hover:text-[#171717] transition-colors">AI Quiz Studio</Link></li>
            <li><Link href="/debate" className="hover:text-[#171717] transition-colors">Neeti Vivaad Studio</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-[#171717] mb-3">Grounding Sources</h4>
          <ul className="space-y-2 text-xs text-[#707070]">
            <li>MoSPI Annual Reports 2024-25</li>
            <li>National Statistical Commission</li>
            <li>India Data Quality Framework</li>
            <li>NDSAP Data Privacy Rules</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-[#171717] mb-3">Government Hackathon</h4>
          <p className="text-xs text-[#707070] leading-[1.45] mb-2">
            Problem Statement SIH26101 · Ministry of Statistics and Programme Implementation.
          </p>
          <span className="pill-tag-emerald">
            Verified RAG Active
          </span>
        </div>

      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-[#ededed] flex flex-col sm:flex-row items-center justify-between text-xs text-[#9a9a9a]">
        <p>© 2026 Neeti Vivaad · Smart India Hackathon 2026</p>
        <p>Built for Ministry of Statistics and Programme Implementation</p>
      </div>
    </footer>
  );
}
