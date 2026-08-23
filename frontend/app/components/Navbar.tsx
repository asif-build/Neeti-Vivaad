'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { UserCheck, Shield, ChevronDown } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'OFFICIAL' | 'ADMIN'>('OFFICIAL');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user_role') as 'OFFICIAL' | 'ADMIN';
    if (saved) setRole(saved);
  }, []);

  const toggleRole = () => {
    const next = role === 'OFFICIAL' ? 'ADMIN' : 'OFFICIAL';
    setRole(next);
    localStorage.setItem('user_role', next);
    window.dispatchEvent(new Event('roleChange'));
  };

  const navLinks = [
    { href: '/', label: 'Showcase' },
    { href: '/dashboard', label: 'Learner Profile' },
    { href: '/courses', label: 'iGOT Courses' },
    { href: '/quiz', label: 'AI Quiz Studio' },
    { href: '/debate', label: 'Neeti Vivaad Studio' },
    { href: '/admin-dashboard', label: 'Admin Heatmap' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#ededed]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link href="/">
          <Logo size="md" />
        </Link>

        {/* Center: Primary Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-[4px] text-sm font-normal transition-colors ${
                  isActive
                    ? 'text-[#171717] font-medium bg-[#fafafa]'
                    : 'text-[#707070] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Sign in link + Primary Green CTA + Role Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRole}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-mono font-normal border border-[#dfdfdf] bg-[#fafafa] text-[#171717] hover:border-[#c7c7c7] transition-all"
            title="Click to toggle Official vs Admin role"
          >
            {role === 'OFFICIAL' ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#24b47e]" />
                <span>Rajesh Kumar (SSO)</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-[#644fc1]" />
                <span>Dr. Sharma (DG MoSPI)</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-[#707070]" />
          </button>

          <Link href="/debate" className="btn-primary-green text-xs shadow-xs">
            Start Debate
          </Link>

          {/* Mobile hamburger trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-[6px] border border-[#dfdfdf] text-[#171717] hover:bg-[#fafafa]"
            aria-label="Toggle Navigation"
          >
            <div className="w-4 h-3.5 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-current rounded-full" />
              <span className="w-full h-0.5 bg-current rounded-full" />
              <span className="w-full h-0.5 bg-current rounded-full" />
            </div>
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[#ededed] bg-white p-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-[6px] text-sm ${
                  isActive
                    ? 'text-[#171717] bg-[#fafafa] font-medium'
                    : 'text-[#707070] hover:bg-[#fafafa]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
