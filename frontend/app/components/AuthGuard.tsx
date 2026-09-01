'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/verify-email-notice',
  '/forgot-password',
  '/reset-password',
  '/auth/verify-email'
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    if (isPublicRoute) {
      setAuthorized(true);
      return;
    }

    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!savedRole && !token) {
      setAuthorized(false);
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, isPublicRoute, router]);

  if (!authorized && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-white text-[#171717] flex flex-col items-center justify-center space-y-3 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-[#3ecf8e] animate-spin" />
        <div>Authenticating Official Credentials...</div>
      </div>
    );
  }

  return <>{children}</>;
}
