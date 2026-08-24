'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { UserCheck, Shield, ChevronDown, ArrowRight, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';

  const [role, setRole] = useState<'OFFICIAL' | 'ADMIN'>('OFFICIAL');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Rajesh Kumar');
  const [menuOpen, setMenuOpen] = useState(false);

  const syncAuth = () => {
    const savedRole = localStorage.getItem('user_role') as 'OFFICIAL' | 'ADMIN';
    if (savedRole) setRole(savedRole);
    
    const savedName = localStorage.getItem('user_name');
    if (savedName) setUserName(savedName);

    const authStatus = localStorage.getItem('is_authenticated');
    // On first load or if logged in
    setIsLoggedIn(authStatus === 'true');
  };

  useEffect(() => {
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('roleChange', syncAuth);
    window.addEventListener('authChange', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('roleChange', syncAuth);
      window.removeEventListener('authChange', syncAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('is_authenticated');
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
  };

  const toggleRole = () => {
    const next = role === 'OFFICIAL' ? 'ADMIN' : 'OFFICIAL';
    setRole(next);
    localStorage.setItem('user_role', next);
    localStorage.setItem('user_name', next === 'ADMIN' ? 'Dr. A. Sharma' : 'Rajesh Kumar');
    localStorage.setItem('is_authenticated', 'true');
    setIsLoggedIn(true);
    window.dispatchEvent(new Event('roleChange'));
    window.dispatchEvent(new Event('authChange'));
    if (next === 'ADMIN') {
      router.push('/admin-dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const candidateLinks = [
    { href: '/dashboard', label: 'Candidate Profile' },
    { href: '/courses', label: 'iGOT Courses' },
    { href: '/quiz', label: 'AI Quiz Studio' },
    { href: '/debate', label: 'Neeti Saarthi Debate' },
  ];

  const adminLinks = [
    { href: '/admin-dashboard', label: 'Admin Heatmap' },
    { href: '/admin/e-recruitment', label: 'e-Recruitment' },
    { href: '/admin/workforce-insights', label: 'Workforce Insights' },
    { href: '/admin/learning-analytics', label: 'Learning Analytics' },
    { href: '/admin/scenario-manager', label: 'Scenario Manager' },
  ];

  if (isLoginPage) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#ededed]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link href="/">
          <Logo size="md" />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* On Landing / Homepage or when NOT logged in: Show Home, About, Features */}
          {(isHomePage || !isLoggedIn) ? (
            <>
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-[4px] text-sm transition-colors ${
                  isHomePage && !pathname.includes('#')
                    ? 'text-[#171717] font-medium bg-[#fafafa]'
                    : 'text-[#707070] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                Home
              </Link>
              <Link
                href="/#about"
                className="px-3 py-1.5 rounded-[4px] text-sm text-[#707070] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
              >
                About
              </Link>
              <Link
                href="/#features"
                className="px-3 py-1.5 rounded-[4px] text-sm text-[#707070] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
              >
                Features
              </Link>
            </>
          ) : (
            /* Logged-in State: Show strictly Candidate or Admin links */
            <>
              <Link
                href="/"
                className="px-3 py-1.5 rounded-[4px] text-sm text-[#707070] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
              >
                Home
              </Link>
              {(role === 'ADMIN' ? adminLinks : candidateLinks).map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-[4px] text-sm transition-colors ${
                      isActive
                        ? 'text-[#171717] font-medium bg-[#fafafa]'
                        : 'text-[#707070] hover:text-[#171717] hover:bg-[#fafafa]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          
          {/* On Homepage or Not Logged In: Only show the "Get started" button */}
          {(isHomePage || !isLoggedIn) ? (
            <Link 
              href="/login" 
              className="btn-primary-green text-xs shadow-xs flex items-center gap-1.5 px-4 py-2"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            /* Inside Portal: Show Sign Out button */
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#dfdfdf] text-xs font-mono text-[#707070] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              title="Sign Out to Homepage"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

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
          {(!isLoggedIn || isHomePage) ? (
            <>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-[6px] text-sm text-[#171717] font-medium bg-[#fafafa]"
              >
                Home
              </Link>
              <Link
                href="/#about"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-[6px] text-sm text-[#707070] hover:bg-[#fafafa]"
              >
                About
              </Link>
              <Link
                href="/#features"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-[6px] text-sm text-[#707070] hover:bg-[#fafafa]"
              >
                Features
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-[6px] text-sm font-medium text-center text-[#171717] bg-[#3ecf8e]"
              >
                Get started
              </Link>
            </>
          ) : (
            <>
              <div className="text-[11px] font-mono uppercase text-[#707070] px-3 py-1">
                Active: {role === 'ADMIN' ? 'Ministry Admin Portal' : 'Candidate Portal'}
              </div>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-[6px] text-sm text-[#707070] hover:bg-[#fafafa]"
              >
                Home
              </Link>
              {(role === 'ADMIN' ? adminLinks : candidateLinks).map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href + link.label}
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
              <div className="pt-2 border-t border-[#ededed]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 text-center text-xs font-mono text-rose-600 hover:bg-rose-50 rounded-[6px]"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
