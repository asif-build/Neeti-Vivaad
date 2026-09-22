'use client';

import React, { useMemo } from 'react';
import { Check, X, AlertTriangle, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
}

interface PasswordStrengthMeterProps {
  password: string;
  personalInfo?: PersonalInfo;
  className?: string;
}

// Top common password fragments/phrases to guard against locally
const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'password1234', '123456789012', '1234567890123',
  'admin', 'administrator', 'admin123456', 'qwerty123456', 'letmein12345',
  'iloveyou1234', 'welcome12345', 'changeme1234', 'neetisaarthi', 'neetisaarthi123',
  'government123', 'governance123', 'statistical12'
]);

export function calculatePasswordStrength(password: string, personalInfo?: PersonalInfo) {
  const pwd = password || '';
  const lower = pwd.toLowerCase();

  const hasLength = pwd.length >= 12;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  // Common password check
  const isCommon = COMMON_PASSWORDS.has(lower) || 
    /^(\w+)\1+$/.test(pwd) || // repeating patterns
    /^(0123456789|1234567890|abcdefghijkl)/i.test(pwd);

  // Personal info similarity check
  const similarItems: string[] = [];
  if (personalInfo) {
    const checks = [
      { label: 'first name', val: personalInfo.firstName },
      { label: 'last name', val: personalInfo.lastName },
      { label: 'username', val: personalInfo.username },
      { label: 'email', val: personalInfo.email?.split('@')[0] },
    ];

    for (const item of checks) {
      if (item.val && item.val.trim().length >= 3) {
        const needle = item.val.trim().toLowerCase();
        if (lower.includes(needle)) {
          similarItems.push(item.label);
        }
      }
    }
  }
  const isSimilarToPersonalInfo = similarItems.length > 0;

  // Strength score: 0 to 4
  let score = 0;
  if (hasLength) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  if (isCommon || isSimilarToPersonalInfo) {
    score = Math.min(score, 1);
  }

  let label = 'Very Weak';
  let color = 'bg-rose-500';
  let textClass = 'text-rose-700';

  if (score === 1) {
    label = 'Weak';
    color = 'bg-amber-500';
    textClass = 'text-amber-700';
  } else if (score === 2) {
    label = 'Fair';
    color = 'bg-yellow-500';
    textClass = 'text-yellow-700';
  } else if (score === 3) {
    label = 'Good';
    color = 'bg-teal-600';
    textClass = 'text-teal-700';
  } else if (score === 4) {
    label = 'Strong';
    color = 'bg-emerald-600';
    textClass = 'text-emerald-700';
  }

  const meetsAllRequirements = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && !isCommon && !isSimilarToPersonalInfo;

  return {
    score,
    label,
    color,
    textClass,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isCommon,
    isSimilarToPersonalInfo,
    similarItems,
    meetsAllRequirements
  };
}

export function PasswordStrengthMeter({ password, personalInfo, className = '' }: PasswordStrengthMeterProps) {
  if (!password) {
    return (
      <div className={`text-[11px] font-mono text-[#4B5563] pt-1 ${className}`}>
        Requirement: Minimum 12 characters combining uppercase, lowercase, numbers, and symbols.
      </div>
    );
  }

  const analysis = useMemo(() => calculatePasswordStrength(password, personalInfo), [password, personalInfo]);

  return (
    <div className={`space-y-2.5 pt-2 font-mono ${className}`}>
      {/* Strength Bar & Label */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
            Password Strength:
          </span>
          <span className={`font-extrabold uppercase text-[11px] ${analysis.textClass} flex items-center gap-1`}>
            {analysis.score >= 3 ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            {analysis.label}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${analysis.score >= 1 ? analysis.color : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${analysis.score >= 2 ? analysis.color : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${analysis.score >= 3 ? analysis.color : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${analysis.score >= 4 ? analysis.color : 'bg-transparent'}`} />
        </div>
      </div>

      {/* Warnings */}
      {analysis.isCommon && (
        <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span><strong>Common Password Warning:</strong> This password is too easy to guess. Choose a less predictable phrase.</span>
        </div>
      )}

      {analysis.isSimilarToPersonalInfo && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Personal Information Warning:</strong> Password contains your {analysis.similarItems.join(' and ')}. Please avoid using personal details.
          </span>
        </div>
      )}

      {/* Checklist of rules */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pt-1">
        <div className={`flex items-center gap-1 ${analysis.hasLength ? 'text-emerald-700 font-bold' : 'text-zinc-500'}`}>
          {analysis.hasLength ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-zinc-400" />}
          <span>At least 12 characters</span>
        </div>
        <div className={`flex items-center gap-1 ${analysis.hasUpper && analysis.hasLower ? 'text-emerald-700 font-bold' : 'text-zinc-500'}`}>
          {analysis.hasUpper && analysis.hasLower ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-zinc-400" />}
          <span>Upper & lowercase</span>
        </div>
        <div className={`flex items-center gap-1 ${analysis.hasNumber ? 'text-emerald-700 font-bold' : 'text-zinc-500'}`}>
          {analysis.hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-zinc-400" />}
          <span>At least one number</span>
        </div>
        <div className={`flex items-center gap-1 ${analysis.hasSpecial ? 'text-emerald-700 font-bold' : 'text-zinc-500'}`}>
          {analysis.hasSpecial ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-zinc-400" />}
          <span>At least one symbol</span>
        </div>
      </div>
    </div>
  );
}
