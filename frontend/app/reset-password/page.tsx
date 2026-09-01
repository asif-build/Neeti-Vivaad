'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { VivaadTreeLogo } from '../components/Logo';
import { Lock, CheckCircle2, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Error completing password reset.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="card-supa-light p-8 rounded-xl max-w-md w-full text-center space-y-4 shadow-xl border border-[#dfdfdf] bg-white">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-[#171717]">Missing Password Reset Token</h2>
          <p className="text-xs text-[#707070]">
            Please click the password reset link sent to your registered official email address.
          </p>
          <Link href="/forgot-password" className="btn-primary-green py-2 px-4 inline-block text-xs font-semibold">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        <Link href="/" aria-label="Home">
          <VivaadTreeLogo className="w-14 h-14 hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="max-w-[460px] mx-auto w-full">
        <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
          
          <div className="border-b border-[#ededed] pb-4">
            <h1 className="text-xl font-semibold text-[#171717] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" /> Set New Password
            </h1>
            <p className="text-xs text-[#707070] mt-1">
              Choose a strong password to secure your Neethi Sarthi official credentials.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary-green py-2.5 text-sm font-medium shadow-xs mt-2 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#171717]">Password Reset Successful!</h3>
                <p className="text-xs text-[#707070]">
                  Your credentials have been updated in PostgreSQL. Redirecting you to Sign In...
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-mono text-[#707070]">
        Loading password reset...
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
