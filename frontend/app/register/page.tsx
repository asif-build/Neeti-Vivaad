'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '../components/Logo';
import { Lock, Mail, Building, User, ArrowRight, Phone, Briefcase, Sparkles, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { getRecaptchaToken } from '../utils/recaptcha';
import { PasswordStrengthMeter, calculatePasswordStrength } from '../components/PasswordStrengthMeter';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [organisation, setOrganisation] = useState('Government of India');
  const [experience, setExperience] = useState('3');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password validations
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

    setLoading(true);

    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      const captchaToken = await getRecaptchaToken('register');
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/register/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(captchaToken ? { 'X-Recaptcha-Token': captchaToken } : {})
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          mobile_number: mobileNumber || undefined,
          designation: designation || 'Statistical Officer',
          department: department || 'Field Operations',
          organisation: organisation || 'Government of India',
          experience_years: parseFloat(experience) || 0,
          education: education || '',
          skills: skillsArray,
          recaptcha_token: captchaToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.email_exists || (data.error && data.error.toLowerCase().includes('already exists'))) {
          setError("An account already exists with this email address. Please log in with your account.");
          return;
        }
        const errMsg = data.error || (typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' ') : 'Registration failed.');
        throw new Error(errMsg);
      }

      // Redirect to Email Verification Notice
      router.push(`/verify-email-notice?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden">
      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link href="/">
            <Logo variant="auth" isDark={false} className="h-11 sm:h-12" />
          </Link>
          <span className="badge-starburst badge-starburst-saffron text-[10px]">
            ★ CIVIL SERVICE REGISTRATION
          </span>
        </div>

        {/* Card Form */}
        <div className="card-brutal bg-white p-7 sm:p-8 space-y-6 shadow-brutal-lg">
          <div className="border-b-2 border-[#111111] pb-4">
            <h1 className="text-xl font-display font-black tracking-tight text-[#111111] uppercase">Register Official Account</h1>
            <p className="text-xs font-mono text-[#4B5563] mt-1">
              Create your dynamic competency profile. Zero predefined accounts; your skills and CTQ are generated dynamically.
            </p>
          </div>

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
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F2A900] text-[#111111] font-bold text-xs border border-[#111111] shadow-xs hover:bg-[#d97706] hover:text-white transition-colors"
                  >
                    <span>Login with your account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-xs font-mono font-bold uppercase text-[#111111]">Official Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@organisation.gov.in"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Password *</label>
                <span className="text-[10px] font-mono text-zinc-500 font-medium">Minimum 12 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={12}
                  placeholder="At least 12 characters"
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

              {/* Live Password Strength Recommender */}
              <PasswordStrengthMeter password={password} personalInfo={{ firstName, lastName, email }} />
            </div>

            {/* Confirm Password Field with Match Indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Confirm Password *</label>
                {confirmPassword && (
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                    password === confirmPassword ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {password === confirmPassword ? (
                      <><CheckCircle2 className="w-3 h-3" /> Passwords Match</>
                    ) : (
                      <><AlertCircle className="w-3 h-3" /> Passwords Do Not Match</>
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

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-[#111111]">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Designation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Statistical Officer"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Department</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#111111] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Field Operations"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal-primary w-full !py-3 !text-sm flex items-center justify-center gap-2 mt-3"
            >
              <span>{loading ? 'Creating Official Account...' : 'Register Official Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] font-mono text-center text-[#4B5563] pt-1">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline font-bold text-[#111111] hover:text-[#0F766E]">Terms of Use</Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="underline font-bold text-[#111111] hover:text-[#0F766E]">Privacy Policy</Link>.
            </p>
          </form>

          <div className="text-center pt-3 border-t-2 border-[#111111]">
            <span className="text-xs font-mono text-[#4B5563]">Already have an account? </span>
            <Link href="/login" className="text-xs font-mono font-bold text-[#111111] hover:text-[#0F766E] underline">
              Sign In
            </Link>
          </div>
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
