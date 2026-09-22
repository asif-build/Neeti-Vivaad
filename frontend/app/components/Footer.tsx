'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  // Render footer ONLY on the home or landing page ('/')
  if (pathname !== '/') return null;

  return (
    <footer className="border-t-2 border-[#111111] bg-[#0B1F3A] text-white py-14 px-4 sm:px-8 font-sans select-none">
      <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
        
        {/* Brand & Mission */}
        <div className="md:col-span-6 space-y-4">
          <Logo variant="footer" isDark={true} />
          <p className="text-xs text-zinc-300 leading-relaxed font-normal max-w-md">
            Empowering public servants with skill building, curated courses, and real-world policy decision practice.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="badge-starburst badge-starburst-emerald text-[10px]">
              ★ DECISION PRACTICE
            </span>
            <span className="badge-starburst badge-starburst-saffron text-[10px]">
              ★ CIVIL SERVICE CAPABILITY
            </span>
          </div>
          <div className="pt-2 text-xs font-mono text-zinc-300">
            <span className="text-[#F2A900] font-bold block mb-1">Official Contact:</span>
            <a 
              href="mailto:neetisaarthi@gmail.com" 
              className="text-zinc-200 hover:text-white underline underline-offset-4 flex items-center gap-1.5 transition-colors"
            >
              <span>neetisaarthi@gmail.com</span>
              <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
            </a>
          </div>
        </div>

        {/* Platform Links */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-display font-bold uppercase text-xs tracking-wider text-[#F2A900]">
            Platform
          </h4>
          <ul className="space-y-2 text-xs font-mono">
            <li>
              <Link href="/about" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>About Neeti Saarthi</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
            <li>
              <Link href="/courses" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Learn</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
            <li>
              <Link href="/quiz" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Knowledge Check</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
            <li>
              <Link href="/debate" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Neeti Vivaad</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>My Profile</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Trust */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-display font-bold uppercase text-xs tracking-wider text-[#F2A900]">
            Trust &amp; Legal
          </h4>
          <ul className="space-y-2 text-xs font-mono text-zinc-300">
            <li>
              <Link href="/privacy-policy" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Privacy Policy</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Terms of Use</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
            <li>
              <Link href="/support" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Support &amp; Help</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright Strip */}
      <div className="max-w-[1360px] mx-auto mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-300 font-medium gap-3">
        <p>&copy; 2026 NEETI SAARTHI. All rights reserved.</p>
        <p className="text-zinc-200 font-bold">Empowering Evidence-Based Public Governance &amp; Policy Deliberation</p>
      </div>
    </footer>
  );
}

export default Footer;
