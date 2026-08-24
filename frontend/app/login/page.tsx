'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '../components/Logo';
import { UserCheck, Shield, Lock, Mail, Building, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<'OFFICIAL' | 'ADMIN'>('OFFICIAL');

  // Form State
  const [email, setEmail] = useState('rajesh.kumar@mospi.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Rajesh Kumar');
  const [dept, setDept] = useState('NSO Field Operations Division');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const isAdmin = selectedRole === 'ADMIN' || email.includes('sharma') || email.includes('admin') || email.includes('dg');
    const assignedRole = isAdmin ? 'ADMIN' : 'OFFICIAL';
    
    localStorage.setItem('user_role', assignedRole);
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('user_name', name || (isAdmin ? 'Dr. A. Sharma' : 'Rajesh Kumar'));
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_dept', dept || (isAdmin ? 'Ministry Headquarters, New Delhi' : 'NSO Field Operations Division'));
    
    window.dispatchEvent(new Event('roleChange'));
    window.dispatchEvent(new Event('authChange'));

    if (assignedRole === 'ADMIN') {
      router.push('/admin-dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const selectPreset = (role: 'OFFICIAL' | 'ADMIN') => {
    setSelectedRole(role);
    if (role === 'OFFICIAL') {
      setEmail('rajesh.kumar@mospi.gov.in');
      setPassword('••••••••••••');
      setName('Rajesh Kumar');
      setDept('NSO Field Operations Division');
    } else {
      setEmail('dr.sharma@mospi.gov.in');
      setPassword('••••••••••••');
      setName('Dr. A. Sharma');
      setDept('Ministry Headquarters, New Delhi');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col justify-between py-10 px-4">
      
      {/* Top Header */}
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
        <Link href="/">
          <Logo size="md" />
        </Link>
        <Link href="/" className="text-xs font-mono text-[#707070] hover:text-[#171717]">
          ← Back to Homepage
        </Link>
      </div>

      {/* Main Container: Centered Clean Form Card */}
      <div className="max-w-[500px] mx-auto w-full my-8">
        
        <div className="card-supa-light space-y-6 shadow-xl border border-[#ededed]">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('signin')}
                className={`text-lg font-medium transition-colors ${
                  mode === 'signin' ? 'text-[#171717] border-b-2 border-[#3ecf8e] pb-1' : 'text-[#707070]'
                }`}
              >
                Get Started / Sign In
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
            <span className="text-xs font-mono text-[#9a9a9a]">NEETI SAARTHI</span>
          </div>

          {/* Role Choice Selector Tabs */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#707070] uppercase font-medium block">
              Select Profile Role:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectPreset('OFFICIAL')}
                className={`flex items-center justify-center gap-2 p-3 rounded-[8px] border text-xs font-medium transition-all ${
                  selectedRole === 'OFFICIAL'
                    ? 'border-[#24b47e] bg-emerald-50/70 text-emerald-950 ring-2 ring-[#24b47e]/20'
                    : 'border-[#dfdfdf] bg-white text-[#707070] hover:border-[#c7c7c7]'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#24b47e]" />
                <div className="text-left">
                  <div className="font-semibold text-[#171717]">Candidate / Official</div>
                  <div className="text-[10px] text-[#707070] font-mono">Rajesh Kumar (SSO)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('ADMIN')}
                className={`flex items-center justify-center gap-2 p-3 rounded-[8px] border text-xs font-medium transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'border-[#644fc1] bg-purple-50/70 text-purple-950 ring-2 ring-[#644fc1]/20'
                    : 'border-[#dfdfdf] bg-white text-[#707070] hover:border-[#c7c7c7]'
                }`}
              >
                <Shield className="w-4 h-4 text-[#644fc1]" />
                <div className="text-left">
                  <div className="font-semibold text-[#171717]">Ministry Admin</div>
                  <div className="text-[10px] text-[#707070] font-mono">Dr. Sharma (DG MoSPI)</div>
                </div>
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

            <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] text-xs text-[#707070] flex items-center justify-between">
              <span>Next Destination:</span>
              <span className="font-mono font-semibold text-[#171717]">
                {selectedRole === 'ADMIN' ? '🏛️ Admin Heatmap & e-Recruitment' : '👤 Candidate Competency Profile'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full btn-primary-green py-2.5 text-sm font-medium shadow-xs mt-2 flex items-center justify-center gap-2"
            >
              <span>Get started with Neeti Saarthi</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-[11px] font-mono text-[#9a9a9a]">
        Grounded MoSPI SSO Authentication · Problem Statement SIH26101 · Neeti Saarthi
      </div>

    </div>
  );
}
