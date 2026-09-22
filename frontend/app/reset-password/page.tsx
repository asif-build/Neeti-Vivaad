'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { VivaadTreeLogo } from '../components/Logo';
import { Lock, CheckCircle2, ArrowRight, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { PasswordStrengthMeter, calculatePasswordStrength } from '../components/PasswordStrengthMeter';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 12) {
      setError('Password must be at least 12 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    const strength = calculatePasswordStrength(password);
    if (strength.isCommon) {
      setError('This password is too common or easily guessable. Please choose a stronger phrase.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/password-reset/confirm/`, {
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
          <h2 className="text-base font-bold text-[#111111]">Missing Password Reset Token</h2>
          <p className="text-xs text-[#374151] font-medium">
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
    <div className="min-h-screen bg-[#fafafa] text-[#111111] font-sans selection:bg-[#3ecf8e] selection:text-[#111111] flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        <Link href="/" aria-label="Home">
          <VivaadTreeLogo className="w-14 h-14 hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="max-w-[460px] mx-auto w-full">
        <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
          
          <div className="border-b border-[#ededed] pb-4">
            <h1 className="text-xl font-bold text-[#111111] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" /> Set New Password
            </h1>
            <p className="text-xs text-[#374151] font-medium mt-1">
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
              {/* Password Field with Show/Hide Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#111111] uppercase font-bold">New Password *</label>
                  <span className="text-[10px] font-mono text-zinc-500 font-medium">Min 12 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4B5563] absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={12}
                    placeholder="At least 12 characters"
                    className="w-full pl-9 pr-10 py-2 rounded-[6px] border border-[#dfdfdf] text-sm text-[#111111] font-medium placeholder:text-[#4B5563] focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-800 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live Password Strength Meter */}
                <PasswordStrengthMeter password={password} />
              </div>

              {/* Confirm Password with Match Indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#111111] uppercase font-bold">Confirm New Password *</label>
                  {confirmPassword && (
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                      password === confirmPassword ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {password === confirmPassword ? (
                        <><CheckCircle2 className="w-3 h-3" /> Match</>
                      ) : (
                        <><AlertCircle className="w-3 h-3" /> Mismatch</>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4B5563] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                    placeholder="Confirm new password"
                    className={`w-full pl-9 pr-10 py-2 rounded-[6px] border text-sm text-[#111111] font-medium placeholder:text-[#4B5563] focus:outline-none bg-white ${
                      confirmPassword && password !== confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-[#dfdfdf] focus:border-[#3ecf8e]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-800 p-0.5"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary-green py-2.5 text-sm font-semibold shadow-xs mt-2 flex items-center justify-center gap-2"
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
                <h3 className="text-base font-bold text-[#111111]">Password Reset Successful!</h3>
                <p className="text-xs text-[#374151] font-medium">
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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-mono text-[#374151] font-medium">
        Loading password reset...
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
