'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, ShieldCheck, Cpu, BookOpen, 
  MessageSquare, BarChart3, Terminal, CheckCircle2, Play
} from 'lucide-react';
import { Logo } from './Logo';
import { CrowdCanvas } from './ui/skiper39';

export function LandingShowcase() {
  const [activeTab, setActiveTab] = useState<'SQL' | 'RAG' | 'DEBATE'>('DEBATE');

  const modules = [
    {
      title: 'Competency Mapping',
      icon: Cpu,
      badge: 'FAISS AUTOMATED GAP ENGINE',
      description: "Know exactly where your skills stand across Statistical, Technical, Digital Governance, and Behavioural domains.",
      link: '/dashboard',
      linkText: 'View Learner Profile'
    },
    {
      title: 'AI Quiz Studio',
      icon: BookOpen,
      badge: 'GROUNDED MCQ GENERATOR',
      description: "Upload any training material. Get an instant, accurate assessment generated from it — nothing invented, nothing generic.",
      link: '/quiz',
      linkText: 'Launch Quiz Studio'
    },
    {
      title: 'Neeti Vivaad Debate',
      icon: MessageSquare,
      badge: 'MULTI-AGENT POLICY SIMULATOR',
      description: "Watch four AI stakeholders argue a real policy dilemma. Catch the fallacies. Sharpen your judgment.",
      link: '/debate',
      linkText: 'Enter Debate Arena'
    },
    {
      title: 'Admin Heatmap',
      icon: BarChart3,
      badge: 'DEPARTMENT INTELLIGENCE',
      description: "See competency and decision-making strength across your entire department, not just one officer.",
      link: '/admin-dashboard',
      linkText: 'Inspect Admin Metrics'
    }
  ];

  return (
    <div className="bg-white text-[#171717] min-h-screen font-sans selection:bg-[#3ecf8e] selection:text-[#171717]">
      
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        
        {/* Soft Pill Tag */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fafafa] border border-[#dfdfdf] text-xs font-mono text-[#171717] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
          <span>Built for MoSPI · Aligned with iGOT Karmayogi · Grounded in NSC Standards</span>
        </div>

        {/* Hero Headline (Display-XXL: 64px, weight 500, letter-spacing -1.92px) */}
        <h1 className="relative z-10 text-4xl sm:text-6xl lg:text-[64px] font-medium tracking-[-1.92px] text-[#171717] max-w-5xl mx-auto leading-[1.1]">
          Intelligence Designed to Evolve
          <span className="inline-block w-3 h-3 rounded-full bg-[#3ecf8e] ml-2" />
        </h1>

        {/* Hero Subheadline */}
        <p className="relative z-10 mt-6 text-base sm:text-[18px] text-[#707070] max-w-3xl mx-auto leading-[1.55] font-normal">
          A skill intelligence platform for India's Official Statistical System — mapping competency gaps, generating instant assessments, and training real judgment through AI-moderated policy debates.
        </p>

        {/* Primary & Secondary Buttons */}
        <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary-green px-5 py-2.5 text-sm shadow-xs">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link href="/debate" className="btn-secondary-outline px-5 py-2.5 text-sm">
            <MessageSquare className="w-4 h-4 text-[#171717]" />
            <span>See a Live Debate</span>
          </Link>
        </div>
      </section>

      {/* COMPOSITED PRODUCT UI MOCKUP (The Brand's Argument) */}
      <section className="pb-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[12px] bg-[#1c1c1c] border border-white/10 text-white shadow-2xl overflow-hidden p-6 md:p-8">
          
          {/* Mockup Header Tabs */}
          <div className="flex items-center justify-between border-b border-[#202020] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-[#9a9a9a] ml-2">mospi-ai-agent-kernel // neeti-vivaad-v2.6</span>
            </div>

            <div className="flex items-center gap-2">
              {(['DEBATE', 'RAG', 'SQL'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-[4px] text-xs font-mono transition-colors ${
                    activeTab === tab
                      ? 'bg-[#3ecf8e] text-[#171717] font-medium'
                      : 'text-[#9a9a9a] hover:text-white bg-[#202020]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'DEBATE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-[6px] bg-[#202020] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#3ecf8e] font-medium">State Statistical Officer</span>
                  <span className="text-[10px] font-mono text-[#9a9a9a]">MOSPI-IDQF-2024</span>
                </div>
                <p className="text-xs text-[#dfdfdf] leading-relaxed">
                  "Transitioning to digital surveys accelerates data processing from 18 months to 24 hours while maintaining 95% confidence intervals."
                </p>
              </div>

              <div className="p-4 rounded-[6px] bg-[#202020] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#4ade80] font-medium">Data Privacy Officer</span>
                  <span className="text-[10px] font-mono text-[#9a9a9a]">NDSAP-PRIVACY-2023</span>
                </div>
                <p className="text-xs text-[#dfdfdf] leading-relaxed">
                  "Continuous microdata collection without tablet-level k-anonymity (k&gt;=5) violates Clause 12 privacy rules."
                </p>
              </div>
            </div>
          )}

          {activeTab === 'RAG' && (
            <div className="code-block-supa font-mono text-xs text-[#3ecf8e] space-y-1">
              <div>&gt; QUERY_VECTOR: "Sampling design &amp; k-anonymity compliance"</div>
              <div className="text-[#dfdfdf]">&gt; FAISS MATCH: MOSPI-IDQF-2024 (Similarity: 0.942)</div>
              <div className="text-[#9a9a9a]">&gt; CITATION: "Section 4.2 Data Integrity: minimum confidence interval of 95%."</div>
            </div>
          )}

          {activeTab === 'SQL' && (
            <div className="code-block-supa font-mono text-xs text-[#dfdfdf] space-y-1">
              <span className="text-[#3ecf8e]">SELECT</span> official_id, subskill_code, current_score, target_score<br/>
              <span className="text-[#3ecf8e]">FROM</span> official_skill_proficiency<br/>
              <span className="text-[#3ecf8e]">WHERE</span> (target_score - current_score) &gt; 25.0;<br/>
              <span className="text-[#9a9a9a]">-- 4 rows returned in 12ms</span>
            </div>
          )}

        </div>
      </section>

      {/* CROWD CANVAS SECTION (Skiper39 - Clean Crowd Animation without Text) */}
      <section className="relative py-16 border-t border-[#ededed] bg-[#fafafa] overflow-hidden min-h-[360px] flex items-center justify-center">
        {/* Skiper39 Crowd Canvas Component */}
        <CrowdCanvas
          src="/images/peeps/all-peeps.png"
          rows={15}
          cols={7}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-100"
        />
      </section>

      {/* CORE MODULES FEATURE GRID */}
      <section className="py-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#ededed]">
        <div className="mb-12">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#707070] font-normal mb-2">
            CORE PLATFORM MODULES
          </h2>
          <h3 className="text-[36px] font-medium tracking-[-0.72px] text-[#171717] leading-[1.15]">
            End-to-End Skill Intelligence &amp; Decision Training
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((mod, idx) => {
            const IconComp = mod.icon;
            return (
              <div
                key={idx}
                className="card-supa-light space-y-6 flex flex-col justify-between hover:border-[#c7c7c7] transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#fafafa] border border-[#dfdfdf] text-[#707070]">
                      {mod.badge}
                    </span>
                    <IconComp className="w-5 h-5 text-[#171717]" />
                  </div>

                  <h3 className="text-[22px] font-medium tracking-normal text-[#171717]">{mod.title}</h3>
                  <p className="text-[16px] text-[#707070] leading-[1.5] font-normal">{mod.description}</p>
                </div>

                <div className="pt-4 border-t border-[#ededed] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#9a9a9a]">Grounded &amp; Auditable</span>
                  <Link
                    href={mod.link}
                    className="text-sm font-medium text-[#171717] hover:text-[#3ecf8e] transition-colors flex items-center gap-1"
                  >
                    <span>{mod.linkText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INVERTED DARK FEATURED CARD FOR DEBATE ARENA */}
      <section className="py-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-supa-dark space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="pill-tag-emerald">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero AI Hallucination Guarantee
              </span>
              <h3 className="text-[28px] font-medium tracking-[-0.42px] text-white">
                RAG Grounding &amp; Policy Decision Synthesis
              </h3>
              <p className="text-[16px] text-[#9a9a9a] max-w-2xl leading-[1.5]">
                Every quiz question comes only from uploaded documents. Debate agents argue strictly using retrieved facts from MoSPI publications, NSC guidelines, and India Data Quality Framework standards.
              </p>
            </div>

            <Link href="/debate" className="btn-primary-green px-5 py-2.5 text-sm whitespace-nowrap">
              <Play className="w-4 h-4" />
              <span>Launch Neeti Vivaad Debate</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SITE FOOTER */}
      <footer className="border-t border-[#ededed] bg-white py-16 text-[#707070] text-xs font-sans">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Logo size="sm" />
            <p className="text-xs text-[#707070] leading-[1.45]">
              AI-Powered Skill Intelligence &amp; Policy Debate Platform for India's Official Statistical System.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-[#171717] mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-[#171717]">Learner Profile</Link></li>
              <li><Link href="/courses" className="hover:text-[#171717]">iGOT Courses</Link></li>
              <li><Link href="/quiz" className="hover:text-[#171717]">AI Quiz Studio</Link></li>
              <li><Link href="/debate" className="hover:text-[#171717]">Neeti Vivaad Studio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#171717] mb-3">Grounding Sources</h4>
            <ul className="space-y-2 text-xs">
              <li>MoSPI Annual Reports 2024-25</li>
              <li>National Statistical Commission</li>
              <li>India Data Quality Framework</li>
              <li>NDSAP Data Privacy Rules</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-[#171717] mb-3">Government Hackathon</h4>
            <p className="text-xs text-[#707070] leading-[1.45] mb-2">
              Problem Statement SIH26101 · Ministry of Statistics and Programme Implementation.
            </p>
            <span className="pill-tag-emerald">Verified RAG Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
