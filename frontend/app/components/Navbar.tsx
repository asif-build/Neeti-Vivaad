'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { UserCheck, Shield, LogOut, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { getAccessToken, getSavedUser, clearTokens, authFetch } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const checkUser = () => {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }

      const saved = getSavedUser();
      if (saved) setUser(saved);

      // Verify with backend
      authFetch('/api/auth/me/')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Unauthenticated');
        })
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {
          setUser(null);
        });
    };

    checkUser();
    window.addEventListener('roleChange', checkUser);
    return () => window.removeEventListener('roleChange', checkUser);
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    window.dispatchEvent(new Event('roleChange'));
    router.push('/');
  };

  // Render navbar on main application routes including Neeti Vivaad and public info pages
  const allowedExactRoutes = ['/', '/dashboard', '/courses', '/quiz', '/admin-dashboard', '/debate', '/about', '/support', '/privacy-policy', '/terms'];
  const isAllowed = allowedExactRoutes.includes(pathname) || (pathname && pathname.startsWith('/admin/'));


  if (!isAllowed) return null;

  const navLinks = [
    { href: '/', label: t('nav.home', 'Home') },
    { href: '/dashboard', label: t('nav.profile', 'My Profile') },
    { href: '/courses', label: t('nav.learn', 'Learn') },
    { href: '/quiz', label: t('nav.quiz', 'Knowledge Check') },
    { href: '/debate', label: t('nav.vivaad', 'Neeti Vivaad') },
  ];

  if (user && user.role === 'ADMIN') {
    navLinks.push({ href: '/admin-dashboard', label: t('nav.admin', 'Admin Overview') });
  }

  const userName = user ? (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username) : '';

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 py-3 sm:py-4 bg-transparent select-none transition-all">
      {/* Floating White Capsule Navbar Container */}
      <div className="w-full max-w-[1360px] mx-auto bg-white rounded-full border-2 border-[#111111] shadow-brutal px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between">
        
        {/* Left: Brand Logo (Black tree emblem + NEETI SAARTHI) */}
        <Link href="/" className="flex items-center hover:opacity-95 transition-opacity shrink-0">
          <Logo variant="navbar" isDark={false} className="h-8 sm:h-9 md:h-10" />
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-display font-extrabold uppercase tracking-wider transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F2A900] text-[#111111] border-2 border-[#111111] shadow-brutal-sm'
                    : 'text-[#111111] hover:bg-zinc-100 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-zinc-100 border-2 border-[#111111] shadow-brutal-sm text-[#111111]">
                {user.role === 'ADMIN' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-[#D97706]" />
                    <span className="font-bold text-[#111111]">Admin: {userName}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span className="font-bold text-[#111111]">{userName}</span>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-display font-extrabold uppercase tracking-wider bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm hover:bg-zinc-100 active:scale-95 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.sign_out', 'Sign Out')}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/courses"
                className="hidden sm:inline-flex items-center px-4 sm:px-5 py-2 rounded-full text-xs font-display font-extrabold uppercase tracking-wider bg-[#2DD4BF] text-[#111111] border-2 border-[#111111] shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal active:translate-x-0 active:translate-y-0 transition-all"
              >
                <span>{t('nav.explore_courses', 'EXPLORE COURSES')}</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-1 px-4 sm:px-5 py-2 rounded-full text-xs font-display font-extrabold uppercase tracking-wider bg-[#F2A900] text-[#111111] border-2 border-[#111111] shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal active:translate-x-0 active:translate-y-0 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('nav.sign_in', 'SIGN IN')}</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-full bg-white border-2 border-[#111111] text-[#111111] shadow-brutal-sm hover:bg-zinc-100"
            aria-label="Toggle Navigation"
          >
            <div className="w-4 h-3.5 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-[#111111] rounded-full" />
              <span className="w-full h-0.5 bg-[#111111] rounded-full" />
              <span className="w-full h-0.5 bg-[#111111] rounded-full" />
            </div>
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden mt-2 mx-auto max-w-[1360px] rounded-2xl border-2 border-[#111111] bg-white shadow-brutal p-4 space-y-2 text-[#111111] animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-full text-xs font-display font-extrabold uppercase tracking-wider ${
                  isActive
                    ? 'bg-[#F2A900] text-[#111111] border-2 border-[#111111] shadow-brutal-sm'
                    : 'text-[#111111] hover:bg-zinc-100'
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

export default Navbar;

