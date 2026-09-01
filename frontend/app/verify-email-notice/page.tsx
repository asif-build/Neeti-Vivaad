'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { VivaadTreeLogo } from '../components/Logo';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

function VerifyEmailNoticeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setResendStatus(null);

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/resend-verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend verification email.');

      setResendStatus({ type: 'success', message: data.message || 'A fresh verification link has been dispatched to your email.' });
      setCooldown(60); // 60s cooldown
    } catch (err: any) {
      setResendStatus({ type: 'error', message: err.message || 'Error resending email.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        <Link href="/" aria-label="Home">
          <VivaadTreeLogo className="w-14 h-14 hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="max-w-[500px] mx-auto w-full">
        <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl text-center">
          
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-[#171717]">Verify Your Official Email</h1>
            <p className="text-xs text-[#707070] leading-relaxed">
              We have dispatched an activation link to:
            </p>
            <p className="text-sm font-mono font-bold text-[#171717] bg-[#f4f4f5] py-2 px-3 rounded-lg border border-[#e4e4e7] inline-block">
              {email || 'your registered official email'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-left text-xs text-emerald-900 space-y-1.5 leading-relaxed">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Status: PENDING_VERIFICATION
            </div>
            <p className="text-[11px] text-emerald-700">
              Please click the link inside the email to activate your account, complete your professional profile onboarding, and calibrate your baseline Critical Thinking Quotient (CTQ).
            </p>
          </div>

          {resendStatus && (
            <div className={`p-3.5 rounded-[6px] text-xs font-medium text-left flex items-start gap-2 ${
              resendStatus.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {resendStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{resendStatus.message}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#ededed] space-y-3">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
              className="w-full py-2.5 px-4 rounded-[6px] border border-[#dfdfdf] hover:border-[#171717] text-xs font-medium text-[#171717] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0 
                  ? `Resend available in ${cooldown}s` 
                  : (resending ? 'Dispatching email...' : 'Resend Verification Email')}
              </span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#707070] pt-2">
              <Link href="/register" className="hover:text-[#171717] underline underline-offset-2">
                Use different email
              </Link>
              <Link href="/login" className="hover:text-[#171717] underline underline-offset-2 font-medium">
                Return to Sign In
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailNoticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-mono text-[#707070]">
        Loading verification details...
      </div>
    }>
      <VerifyEmailNoticeContent />
    </Suspense>
  );
}
