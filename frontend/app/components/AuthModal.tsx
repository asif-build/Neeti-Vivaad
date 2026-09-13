'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, LogIn, UserPlus, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  returnUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  title = 'Sign in to Neeti Saarthi',
  message = 'Sign in to track your learning progress, build verified competencies, and access personalized public service features.',
  returnUrl = '',
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const returnParam = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
  const signupParam = returnUrl ? `?mode=signup&returnUrl=${encodeURIComponent(returnUrl)}` : '?mode=signup';

  const perks = [
    'Get learning recommendations tailored to your role',
    'Track your learning progress and earn verified badges',
    'Take Knowledge Checks on official guidelines & circulars',
    'Practise real decisions with 4 stakeholder viewpoints',
    'Build and demonstrate competencies for public administration'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0B1F3A]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-lg bg-white border-2 border-[#111111] rounded-2xl shadow-brutal-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Accent Header */}
        <div className="bg-[#F2A900] border-b-2 border-[#111111] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#0B1F3A] text-[#FCD34D] border border-[#111111]">
              <Sparkles className="w-4 h-4 text-[#F2A900]" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
              NEETI SAARTHI &bull; CIVIL SERVICE LEARNING
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border-2 border-[#111111] bg-white text-[#111111] hover:bg-[#F8F7F2] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="space-y-2">
            <h2 id="auth-modal-title" className="font-display font-extrabold uppercase text-xl sm:text-2xl text-[#111111] leading-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#374151] font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {/* Perks Checklist */}
          <div className="p-4 rounded-xl bg-[#F8F7F2] border-2 border-[#111111] space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase text-[#0F766E] tracking-wider block">
              What you unlock with an account:
            </span>
            <div className="space-y-2">
              {perks.map((perk, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111111] font-medium leading-snug">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href={`/login${returnParam}`}
                onClick={onClose}
                className="btn-brutal-primary !text-xs !py-3 flex items-center justify-center gap-2 shadow-brutal-sm font-bold text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href={`/login${signupParam}`}
                onClick={onClose}
                className="btn-brutal-emerald !text-xs !py-3 flex items-center justify-center gap-2 shadow-brutal-sm font-bold text-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border-2 border-transparent hover:border-[#111111] text-xs font-mono text-[#4B5563] hover:text-[#111111] hover:bg-[#F8F7F2] transition-all text-center font-bold"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
