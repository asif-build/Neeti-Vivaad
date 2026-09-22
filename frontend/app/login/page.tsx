'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '../components/Logo';
import { Lock, Mail, Building, User, ArrowRight, Briefcase, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { setTokens, setSavedUser, getApiBaseUrl } from '../utils/api';
import { getRecaptchaToken } from '../utils/recaptcha';
import { PasswordStrengthMeter, calculatePasswordStrength } from '../components/PasswordStrengthMeter';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dept, setDept] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);

    if (mode === 'signup') {
      if (password.length < 12) {
        setError("Password must be at least 12 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter your password.");
        return;
      }
      const strength = calculatePasswordStrength(password, { firstName, lastName, email });
      if (strength.isCommon) {
        setError("This password is too common or easily guessable. Please choose a stronger phrase.");
        return;
      }
      if (strength.isSimilarToPersonalInfo) {
        setError(`Password contains your ${strength.similarItems.join(' or ')}. Please avoid using personal information.`);
        return;
      }
    }

    setLoading(true);

    try {
      const base = getApiBaseUrl();
      if (mode === 'signin') {
        const recaptcha_token = await getRecaptchaToken('login');
        const res = await fetch(`${base}/api/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, recaptcha_token })
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

        // Route based on returnUrl or profile completion
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
          router.push(returnUrl);
        } else if (!data.user?.profile_complete || !data.user?.baseline_completed) {
          router.push('/candidate/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Sign up
        const recaptcha_token = await getRecaptchaToken('register');
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        const res = await fetch(`${base}/api/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            department: dept,
            designation: designation,
            phone_number: mobileNumber,
            recaptcha_token
          })
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.email_exists || (data.error && data.error.toLowerCase().includes('already exists'))) {
            setError("An account already exists with this email address. Please log in with your account.");
            setLoading(false);
            return;
          }
          throw new Error(data.error || 'Registration failed. Please check your details.');
        }

        // Redirect to email notice
        router.push(`/verify-email-notice?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link href="/">
            <Logo variant="auth" isDark={false} className="h-11 sm:h-12" />
          </Link>
          <span className="badge-starburst badge-starburst-saffron text-[10px]">
            ★ OFFICIAL ACCESS PORTAL
          </span>
        </div>

        {/* Card Form */}
        <div className="card-brutal bg-white p-7 sm:p-8 space-y-6 shadow-brutal-lg">
          
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`font-display font-extrabold uppercase text-sm tracking-wider transition-colors pb-1 ${
                  mode === 'signin' ? 'text-[#111111] border-b-2 border-[#F2A900]' : 'text-[#4B5563]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`font-display font-extrabold uppercase text-sm tracking-wider transition-colors pb-1 ${
                  mode === 'signup' ? 'text-[#111111] border-b-2 border-[#F2A900]' : 'text-[#4B5563]'
                }`}
              >
                Register
              </button>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#4B5563]">Official Account</span>
          </div>

          {resetSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password reset successfully. Sign in with your new password.</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-[#111111] shadow-brutal-sm text-[#111111] text-xs font-mono space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#111111]">{error}</p>
                  {error.toLowerCase().includes('already exists') && (
                    <p className="text-zinc-600 text-[11px]">
                      Your credentials or verified account is already registered in Neeti Saarthi.
                    </p>
                  )}
                </div>
              </div>
              {error.toLowerCase().includes('already exists') && (
                <div className="pt-2 border-t border-amber-200 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F2A900] text-[#111111] font-bold text-xs border border-[#111111] shadow-xs hover:bg-[#d97706] hover:text-white transition-colors"
                  >
                    <span>Login with your account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-mono text-[#0F766E] font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-bold uppercase text-[#111111]">First Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                        placeholder="First Name"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-bold uppercase text-[#111111]">Last Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        placeholder="Last Name"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-[#111111]">Department / Division</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      placeholder="e.g. NSO Field Operations Division"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-[#111111]">Designation</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Statistical Officer"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#111111]">Official Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your.name@gov.in"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Password *</label>
                {mode === 'signin' ? (
                  <Link href="/forgot-password" className="text-[11px] font-mono text-[#0F766E] font-bold hover:underline">
                    Forgot password?
                  </Link>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500 font-medium">Min 12 characters</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={mode === 'signup' ? 12 : undefined}
                  placeholder={mode === 'signup' ? 'At least 12 characters' : '••••••••••••'}
                  className="w-full pl-9 pr-10 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-600 hover:text-[#111111] p-0.5 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter in signup mode */}
              {mode === 'signup' && (
                <PasswordStrengthMeter password={password} personalInfo={{ firstName, lastName, email }} />
              )}
            </div>

            {/* Confirm password field in signup mode */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-[#111111]">Confirm Password *</label>
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
                  <Lock className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                    placeholder="Re-enter your password"
                    className={`w-full pl-9 pr-10 py-2 rounded-xl border-2 text-xs font-mono font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm ${
                      confirmPassword && password !== confirmPassword ? 'border-rose-500' : 'border-[#111111]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-zinc-600 hover:text-[#111111] p-0.5 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal-primary w-full !py-3 !text-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Processing...' : (mode === 'signin' ? 'Sign In to Neeti Saarthi' : 'Create Official Account')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] font-mono text-[#4B5563] text-center pt-2">
              By continuing, you acknowledge our{' '}
              <Link href="/terms" className="underline text-[#111111] hover:text-[#0F766E] font-bold">Terms</Link> and{' '}
              <Link href="/privacy-policy" className="underline text-[#111111] hover:text-[#0F766E] font-bold">Privacy Policy</Link>.
            </p>

          </form>

        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-mono text-[#4B5563] hover:text-[#111111] font-bold underline">
            &larr; Return to Platform Showcase
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center text-xs font-mono text-[#4B5563]">
        Loading sign in...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
