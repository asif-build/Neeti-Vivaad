'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { ShieldCheck, Sparkles, Award, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  // Render footer only on relevant main application routes (exclude auth, onboarding, and 404/not-found)
  const allowedExactRoutes = ['/', '/dashboard', '/courses', '/quiz', '/debate', '/admin-dashboard'];
  const isAllowed = allowedExactRoutes.includes(pathname) || (pathname && pathname.startsWith('/admin/'));

  if (!isAllowed) return null;

  return (
    <footer className="border-t-2 border-[#111111] bg-[#0B1F3A] text-white py-14 px-4 sm:px-8 font-sans select-none">
      <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
        
        {/* Brand & Mission */}
        <div className="md:col-span-4 space-y-4">
          <Logo variant="footer" isDark={true} />
          <p className="text-xs text-zinc-300 leading-relaxed font-normal max-w-sm">
            Empowering public servants with skill building, curated courses, and real-world policy decision practice.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="badge-starburst badge-starburst-saffron text-[10px]">
              ★ MoSPI SIH26101
            </span>
            <span className="badge-starburst badge-starburst-emerald text-[10px]">
              ★ MISSION KARMAYOGI
            </span>
          </div>
        </div>

        {/* Platform Links */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-display font-bold uppercase text-xs tracking-wider text-[#F2A900]">
            Platform
          </h4>
          <ul className="space-y-2 text-xs font-mono">
            <li>
              <Link href="/dashboard" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>My Profile</span>
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
              <Link href="/admin-dashboard" className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors">
                <span>Admin Overview</span>
                <ArrowUpRight className="w-3 h-3 text-[#F2A900]" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Grounding Standards */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-display font-bold uppercase text-xs tracking-wider text-[#F2A900]">
            Trusted Sources
          </h4>
          <ul className="space-y-2 text-xs font-mono text-zinc-300">
            <li>&bull; MoSPI Official Statistical Reports</li>
            <li>&bull; National Statistical Commission (NSC)</li>
            <li>&bull; India Data Quality Framework (IDQF)</li>
            <li>&bull; Official Government Guidelines</li>
            <li>&bull; iGOT Karmayogi Curriculums</li>
          </ul>
        </div>

        {/* SIH Hackathon & Verification */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="font-display font-bold uppercase text-xs tracking-wider text-[#F2A900]">
            Accreditation
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
            Smart India Hackathon 2026 Problem Statement SIH26101.
          </p>
          <div className="p-3 rounded-xl bg-[#061120] border border-zinc-700 space-y-1">
            <span className="text-[10px] font-mono text-[#14B8A6] font-bold block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Trusted Learning Material
            </span>
            <span className="text-[9px] font-mono text-zinc-200 font-medium block">
              Official Government Sources
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Strip */}
      <div className="max-w-[1360px] mx-auto mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-200 font-medium gap-3">
        <p>&copy; 2026 NEETI SAARTHI &bull; Smart India Hackathon 2026</p>
        <p className="text-zinc-100 font-bold">Built for Ministry of Statistics and Programme Implementation</p>
      </div>
    </footer>
  );
}

export default Footer;
