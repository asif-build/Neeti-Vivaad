'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Allow public access to Landing Page (/) and Login Page (/login)
    if (pathname === '/' || pathname === '/login') {
      setAuthorized(true);
      return;
    }

    const savedRole = localStorage.getItem('user_role');

    // Protect internal dashboard & studio routes
    if (!savedRole) {
      setAuthorized(false);
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  // Loading state for protected routes
  if (!authorized && pathname !== '/' && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-white text-[#171717] flex flex-col items-center justify-center space-y-3 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-[#3ecf8e] animate-spin" />
        <div>Authenticating Official Credentials...</div>
      </div>
    );
  }

  return <>{children}</>;
}
