'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin-dashboard',
  '/candidate/baseline',
  '/debate',
  '/courses',
  '/reports',
  '/profile'
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Route requires authentication only if it matches protected prefixes
  const isProtected = pathname ? PROTECTED_PREFIXES.some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  ) : false;

  useEffect(() => {
    if (!isProtected) return;

    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!savedRole && !token) {
      router.push('/login');
    }
  }, [pathname, isProtected, router]);

  // For protected routes, show redirect spinner if unauthenticated
  if (isProtected && typeof window !== 'undefined') {
    const savedRole = localStorage.getItem('user_role');
    const token = localStorage.getItem('access_token');
    if (!savedRole && !token) {
      return (
        <div className="min-h-screen bg-white text-[#171717] flex flex-col items-center justify-center space-y-3 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-[#3ecf8e] animate-spin" />
          <div>Redirecting to Sign In...</div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
