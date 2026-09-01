'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VivaadTreeLogo } from '../components/Logo';
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/password-reset/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

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
              <KeyRound className="w-5 h-5 text-amber-600" /> Reset Password
            </h1>
            <p className="text-xs text-[#707070] mt-1">
              Enter your official email address and we'll dispatch a secure, expiring password reset link.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Official Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@organisation.gov.in"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full btn-primary-green py-2.5 text-sm font-medium shadow-xs mt-2 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Dispatching Reset Link...' : 'Send Password Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#171717]">Reset Instructions Dispatched</h3>
                <p className="text-xs text-[#707070] leading-relaxed">
                  If an account exists with <strong className="text-[#171717]">{email}</strong>, a secure reset link valid for <strong>60 minutes</strong> has been sent.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#f4f4f5] border border-[#e4e4e7] text-[11px] text-[#707070] text-left">
                💡 Check your inbox (or Django development terminal if running locally) for the reset link.
              </div>
            </div>
          )}

          <div className="text-center pt-2 border-t border-[#ededed]">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#707070] hover:text-[#171717]">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
