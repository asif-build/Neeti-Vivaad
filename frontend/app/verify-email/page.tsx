'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { VivaadTreeLogo } from '../components/Logo';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { setTokens, setSavedUser } from '../utils/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage('Missing verification token in request link. Please check your verification email.');
      return;
    }

    const performVerification = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/auth/verify-email/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Email verification failed or token has expired.');
        }

        setSuccess(true);
        setUserData(data.user);

        // Store tokens if returned
        if (data.access && data.refresh) {
          setTokens(data.access, data.refresh);
        }
        if (data.user) {
          setSavedUser(data.user);
        }
        window.dispatchEvent(new Event('roleChange'));
      } catch (err: any) {
        setErrorMessage(err.message || 'Verification token invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        <Link href="/" aria-label="Home">
          <VivaadTreeLogo className="w-14 h-14 hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="max-w-[520px] mx-auto w-full">
        <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl text-center">
          
          {loading && (
            <div className="py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-[#3ecf8e] animate-spin mx-auto" />
              <h2 className="text-base font-semibold text-[#171717]">Verifying Official Email...</h2>
              <p className="text-xs text-[#707070] font-mono">
                Validating cryptographic token and activating your Neethi Sarthi account.
              </p>
            </div>
          )}

          {!loading && success && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Account Status: ACTIVE
                </span>
                <h1 className="text-xl font-bold text-[#171717]">Email Verified Successfully!</h1>
                <p className="text-xs text-[#707070] leading-relaxed">
                  Welcome aboard, <strong className="text-[#171717]">{userData?.first_name || 'Official'}</strong>. Your official credentials have been activated.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#ededed] text-left text-xs space-y-1.5 leading-relaxed text-[#707070]">
                <strong className="text-[#171717] block">Next Step:</strong>
                Complete your professional profile so our AI engine can calibrate your baseline competency profile and calculate your Critical Thinking Quotient (CTQ).
              </div>

              <Link
                href="/candidate/onboarding"
                className="w-full btn-primary-green py-3 text-sm font-semibold shadow-xs flex items-center justify-center gap-2"
              >
                <span>Complete Professional Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {!loading && !success && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                <XCircle className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold text-rose-950">Verification Link Invalid or Expired</h1>
                <p className="text-xs text-rose-700 font-mono">
                  {errorMessage}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
                <strong className="block font-semibold">What can you do?</strong>
                <p className="text-[11px] text-amber-800">
                  Verification tokens expire in 24 hours and can only be used once. You can request a fresh verification link or sign in if already verified.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/verify-email-notice"
                  className="flex-1 py-2.5 px-4 rounded-[6px] border border-[#dfdfdf] hover:border-[#171717] text-xs font-medium text-[#171717] transition-colors"
                >
                  Resend Verification Email
                </Link>
                <Link
                  href="/login"
                  className="flex-1 btn-primary-green py-2.5 text-xs font-semibold text-center"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-mono text-[#707070]">
        Loading verification...
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
