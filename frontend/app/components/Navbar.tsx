'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { UserCheck, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';
import { getAccessToken, getSavedUser, clearTokens, authFetch } from '../utils/api';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Hide navbar on /login and /register pages
  if (pathname === '/login' || pathname === '/register') return null;

  const navLinks = [
    { href: '/', label: 'Showcase' },
    { href: '/dashboard', label: 'Learner Profile' },
    { href: '/courses', label: 'iGOT Courses' },
    { href: '/quiz', label: 'AI Quiz Studio' },
    { href: '/debate', label: 'Neeti Vivaad Studio' },
  ];

  if (user && user.role === 'ADMIN') {
    navLinks.push({ href: '/admin-dashboard', label: 'Admin Heatmap' });
  }

  const userName = user ? (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username) : '';

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1100px] px-4 font-sans select-none">
      <div className="bg-black/90 backdrop-blur-xl border border-zinc-800 rounded-full px-5 py-2.5 shadow-2xl flex items-center justify-between text-white">
        
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center">
          <Logo size="md" isDark={true} />
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white font-semibold bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Action Button */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                {user.role === 'ADMIN' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-[#644fc1]" />
                    <span className="font-semibold text-purple-300">Admin: {userName}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#3ecf8e]" />
                    <span>{userName}</span>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 font-semibold text-xs hover:text-white transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-1.5 rounded-full bg-zinc-900 text-zinc-300 hover:text-white"
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
        <div className="lg:hidden mt-2 border border-zinc-800 bg-black/95 backdrop-blur-xl rounded-2xl p-4 space-y-2 text-white">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'text-white bg-zinc-800 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-900'
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
