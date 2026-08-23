'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '../components/Logo';
import { UserCheck, Shield, Lock, Mail, Building, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email.includes('sharma') || email.includes('admin') || email.includes('dg')) {
      localStorage.setItem('user_role', 'ADMIN');
    } else {
      localStorage.setItem('user_role', 'OFFICIAL');
    }
    router.push('/dashboard');
  };

  const selectPreset = (role: 'OFFICIAL' | 'ADMIN') => {
    if (role === 'OFFICIAL') {
      setEmail('rajesh.kumar@mospi.gov.in');
      setPassword('••••••••••••');
      setName('Rajesh Kumar');
      setDept('NSO Field Operations Division');
      localStorage.setItem('user_role', 'OFFICIAL');
    } else {
      setEmail('dr.sharma@mospi.gov.in');
      setPassword('••••••••••••');
      setName('Dr. A. Sharma');
      setDept('Ministry of Statistics & Programme Implementation');
      localStorage.setItem('user_role', 'ADMIN');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col justify-between py-10 px-4">
      
      {/* Top Header */}
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
        <Link href="/">
          <Logo size="md" />
        </Link>
      </div>

      {/* Main Container: Centered Clean Form Card */}
      <div className="max-w-[480px] mx-auto w-full my-8">
        
        <div className="card-supa-light space-y-6 shadow-xl">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('signin')}
                className={`text-lg font-medium transition-colors ${
                  mode === 'signin' ? 'text-[#171717] border-b-2 border-[#3ecf8e] pb-1' : 'text-[#707070]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`text-lg font-medium transition-colors ml-4 ${
                  mode === 'signup' ? 'text-[#171717] border-b-2 border-[#3ecf8e] pb-1' : 'text-[#707070]'
                }`}
              >
                Register Official
              </button>
            </div>
            <span className="text-xs font-mono text-[#9a9a9a]">MOSPI-SSO v2.6</span>
          </div>

          {/* Preset Officer Quick-Login Buttons */}
          <div className="p-3 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] space-y-2">
            <span className="text-[11px] font-mono text-[#707070] uppercase font-medium block">
              Quick Test Credentials:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectPreset('OFFICIAL')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono bg-white border border-[#dfdfdf] text-[#171717] hover:border-[#3ecf8e] transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#24b47e]" />
                <span>Rajesh Kumar (SSO)</span>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('ADMIN')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono bg-white border border-[#dfdfdf] text-[#171717] hover:border-[#644fc1] transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-[#644fc1]" />
                <span>Dr. Sharma (DG MoSPI)</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#707070] uppercase font-medium">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                    />
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
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#707070] uppercase font-medium">Govt Email / Official ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rajesh.kumar@mospi.gov.in"
                  className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#707070] uppercase font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary-green py-2.5 text-sm font-medium shadow-xs mt-2"
            >
              <span>{mode === 'signin' ? 'Sign In to Neeti Vivaad' : 'Create Official Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-[11px] font-mono text-[#9a9a9a]">
        Grounded MoSPI SSO Authentication · Problem Statement SIH26101
      </div>

    </div>
  );
}
