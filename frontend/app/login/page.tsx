'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { VivaadTreeLogo } from '../components/Logo';
import { Lock, Mail, Building, User, ArrowRight, Briefcase, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { setTokens, setSavedUser, getApiBaseUrl } from '../utils/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dept, setDept] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);

    try {
      const base = getApiBaseUrl();
      if (mode === 'signin') {
        const res = await fetch(`${base}/api/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Invalid credentials. Please verify your email and password.');
        }

        // Store tokens
        setTokens(data.access, data.refresh);
        setSavedUser(data.user);
        window.dispatchEvent(new Event('roleChange'));

        // If email is still unverified, prompt verification notice
        if (data.user?.status === 'PENDING_VERIFICATION' || !data.user?.is_email_verified) {
          router.push(`/verify-email-notice?email=${encodeURIComponent(email)}`);
          return;
        }

        // Route based on profile and baseline completion
        if (!data.user.profile_complete || !data.user.baseline_completed) {
          router.push('/candidate/onboarding');
        } else if (data.user.role === 'ADMIN') {
          router.push('/admin-dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Sign Up / Register
        const res = await fetch(`${base}/api/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            department: dept,
            designation: designation || 'Statistical Officer',
            mobile_number: mobileNumber || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) {
          const errMsg = typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' ') : 'Registration failed.';
          throw new Error(errMsg);
        }

        // Redirect to Email Verification Notice
        router.push(`/verify-email-notice?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col items-center justify-center py-12 px-4">
      
      {/* Centered Logo Icon */}
      <div className="mb-6">
        <Link href="/" aria-label="Home">
          <VivaadTreeLogo className="w-14 h-14 hover:scale-105 transition-transform" />
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="max-w-[460px] mx-auto w-full">
        
        <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`text-base font-medium transition-colors ${
                  mode === 'signin' ? 'text-[#171717] border-b-2 border-[#3ecf8e] pb-1' : 'text-[#707070]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`text-base font-medium transition-colors ml-4 ${
                  mode === 'signup' ? 'text-[#171717] border-b-2 border-[#3ecf8e] pb-1' : 'text-[#707070]'
                }`}
              >
                Register Official
              </button>
            </div>
            <span className="text-xs font-mono text-[#9a9a9a]">Neethi Sarthi</span>
          </div>

          {resetSuccess && (
            <div className="p-3.5 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password reset successfully. Please sign in with your new password.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[#707070] uppercase font-medium">First Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                        placeholder="First Name"
                        className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[#707070] uppercase font-medium">Last Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        placeholder="Last Name"
                        className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#707070] uppercase font-medium">Department / Division</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      placeholder="e.g. NSO Field Operations Division"
                      className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#707070] uppercase font-medium">Designation</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Statistical Officer"
                      className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#707070] uppercase font-medium">Official Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your.name@gov.in"
                  className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Password *</label>
                {mode === 'signin' && (
                  <Link href="/forgot-password" className="text-[11px] text-[#707070] hover:text-[#3ecf8e] underline underline-offset-2">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-green py-2.5 text-sm font-medium shadow-xs mt-3 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : (mode === 'signin' ? 'Sign In to Neethi Sarthi' : 'Create Official Account')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-mono text-[#707070]">
        Loading sign in...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
