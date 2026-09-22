'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, MessageSquare, Send, CheckCircle2, AlertCircle, 
  HelpCircle, ArrowRight, ShieldCheck, Sparkles, ExternalLink 
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { executeRecaptcha } from '../utils/recaptcha';

const CATEGORIES = [
  'Account & Login',
  'Email Verification',
  'Profile & Resume',
  'Courses',
  'Knowledge Check',
  'Neeti Vivaad',
  'Technical Issue',
  'Feedback'
];

export default function SupportClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Account & Login');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Obtain Google reCAPTCHA v3 token
      const captchaToken = await executeRecaptcha('contact_support');

      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/support/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(captchaToken ? { 'X-Recaptcha-Token': captchaToken } : {})
        },
        body: JSON.stringify({
          name,
          email,
          category,
          subject,
          message,
          recaptcha_token: captchaToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit support inquiry. Please try again.');
      }

      setSuccess(data.message || 'Thank you! Your message has been dispatched to our support team at neetisaarthi@gmail.com.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while dispatching your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F8F7F2] text-[#111111] py-10 sm:py-16 px-4 sm:px-8 font-sans">
      <div className="max-w-[1100px] mx-auto space-y-12">
        
        {/* Header Hero */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#FEF3C7] border border-[#111111] shadow-brutal-sm">
            <HelpCircle className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>NEED HELP? WE&apos;RE HERE TO HELP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight uppercase leading-tight">
            Support &amp; Assistance
          </h1>
          <p className="text-base text-[#4B5563] font-normal leading-relaxed">
            For questions, technical issues, feedback or suggestions, we&apos;re always happy to assist you.
          </p>
        </div>

        {/* Direct Email Action Banner */}
        <div className="card-brutal bg-white p-6 sm:p-8 border-2 border-[#111111] rounded-2xl shadow-brutal flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-mono font-bold uppercase text-[#0F766E] flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="w-4 h-4" /> Direct Official Contact
            </span>
            <h3 className="text-xl font-display font-extrabold text-[#111111]">
              neetisaarthi@gmail.com
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-md font-normal">
              Click below to compose an email directly in your email client, or fill in the secure form below.
            </p>
          </div>

          <a
            href="mailto:neetisaarthi@gmail.com"
            className="btn-brutal-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-display font-extrabold uppercase shrink-0"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>

        {/* Grid: Support Form + Helpful Knowledge Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Online Support Form */}
          <div className="lg:col-span-7 card-brutal bg-white p-6 sm:p-8 border-2 border-[#111111] rounded-2xl shadow-brutal-lg space-y-6">
            <div className="border-b-2 border-[#111111] pb-3">
              <h2 className="text-lg sm:text-xl font-display font-black uppercase text-[#111111]">
                Send Us a Message
              </h2>
              <p className="text-xs font-mono text-[#4B5563] mt-1">
                Your message goes directly to our official support team.
              </p>
            </div>

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-[#0F766E] text-[#0F766E] text-xs font-mono flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#0F766E]" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Message Dispatched</p>
                  <p>{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs font-mono flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Notice</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#111111]">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Statistical Officer"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono text-[#111111] focus:bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#111111]">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono text-[#111111] focus:bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono text-[#111111] font-bold focus:bg-white focus:outline-none shadow-brutal-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief summary of your question or issue"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono text-[#111111] focus:bg-white focus:outline-none shadow-brutal-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue, feedback, or suggestion in detail..."
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono text-[#111111] focus:bg-white focus:outline-none shadow-brutal-sm leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-brutal-primary w-full !py-3 !text-xs sm:!text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Dispatching Message...' : 'Submit Support Request'}</span>
              </button>
            </form>
          </div>

          {/* Quick Help & Common Topics */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="card-brutal bg-white p-6 border-2 border-[#111111] rounded-2xl shadow-brutal space-y-4">
              <h3 className="text-sm font-display font-black uppercase text-[#111111] tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F2A900]" />
                Common Inquiries
              </h3>

              <div className="space-y-3 text-xs font-sans">
                <div className="p-3 rounded-xl bg-[#F8F7F2] border border-zinc-200 space-y-1">
                  <p className="font-bold text-[#111111]">Haven&apos;t received verification email?</p>
                  <p className="text-[#4B5563]">
                    Check your spam/junk folder. You can also request a fresh link directly via the{' '}
                    <Link href="/login" className="underline font-bold text-[#0F766E]">Sign In</Link> page.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7F2] border border-zinc-200 space-y-1">
                  <p className="font-bold text-[#111111]">Supported document formats?</p>
                  <p className="text-[#4B5563]">
                    We support PDF, DOCX, and TXT files up to 10MB for resumes and up to 15MB for knowledge check materials.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7F2] border border-zinc-200 space-y-1">
                  <p className="font-bold text-[#111111]">Need account or data deletion?</p>
                  <p className="text-[#4B5563]">
                    To request account removal or data deletion, email us directly at{' '}
                    <a href="mailto:neetisaarthi@gmail.com" className="underline font-bold text-[#0F766E]">neetisaarthi@gmail.com</a>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B1F3A] text-white border-2 border-[#111111] shadow-brutal space-y-2 text-xs font-mono">
              <span className="text-[#2DD4BF] font-bold block uppercase text-[11px]">
                Support Response Window
              </span>
              <p className="text-zinc-300 font-normal leading-relaxed">
                Inquiries are typically reviewed and addressed within 1–2 working days. Thank you for your patience and for helping us improve Neeti Saarthi!
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
