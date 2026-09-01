'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VivaadTreeLogo } from '../components/Logo';
import { Lock, Mail, Building, User, ArrowRight, Phone, Briefcase, GraduationCap } from 'lucide-react';
import { authFetch, setTokens, setSavedUser } from '../utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [organisation, setOrganisation] = useState('Government of India');
  const [experience, setExperience] = useState('3');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          skills: skillsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' ') : 'Registration failed.';
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
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        <Link href="/" aria-label="Home">
          <VivaadTreeLogo className="w-14 h-14 hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="max-w-[540px] mx-auto w-full">
        <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
          
          <div className="border-b border-[#ededed] pb-4">
            <h1 className="text-xl font-semibold text-[#171717]">Register Official Account</h1>
            <p className="text-xs text-[#707070] mt-1">
              Create your dynamic profile. Zero predefined accounts; your competencies, skill gaps, and CTQ are generated from your actual assessments.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Mobile Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Designation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Statistical Officer"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Department</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#707070] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Field Operations Division"
                    className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-green py-2.5 text-sm font-medium shadow-xs mt-3 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Official Account...' : 'Register Official Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#ededed]">
            <span className="text-xs text-[#707070]">Already have an account? </span>
            <Link href="/login" className="text-xs font-medium text-[#171717] hover:text-[#3ecf8e] underline underline-offset-2">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
