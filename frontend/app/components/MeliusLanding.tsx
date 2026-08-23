'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, ShieldCheck, Database, CheckCircle2, 
  HelpCircle, ChevronDown, Play, Scale, Cpu, Users, Eye, AlertTriangle
} from 'lucide-react';
import { PlainviewSunLogo } from './Logo';

const CATEGORIES = [
  { id: 'data-policy', label: 'Data Policy', scenario: 'DBT Survey Redesign: Continuous Microdata Capture' },
  { id: 'digital-gov', label: 'Digital Governance', scenario: 'Mandatory Facial & GPS Verification in Rural Sampling' },
  { id: 'field-ops', label: 'Field Operations', scenario: 'CAPI Mobile Tools in Low-Connectivity Hilly Terrain' },
  { id: 'ethics-privacy', label: 'Ethics & Privacy', scenario: 'Public Microdata Release under NDSAP k-Anonymity' }
];

const SHOWCASE_NODES = {
  'data-policy': [
    {
      agent: 'State Statistical Officer',
      role: 'Operations & Efficiency',
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
      source: 'MOSPI-IDQF-2024',
      text: 'Transitioning to digital surveys accelerates data processing from 18 months to 24 hours. Administrative efficiency must take priority to reduce national budget expenditure.'
    },
    {
      agent: 'Data Privacy Officer',
      role: 'Compliance & Privacy',
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
      source: 'NDSAP-PRIVACY-2023',
      text: 'Continuous microdata collection without tablet-level k-anonymity (k>=5) violates Clause 12 privacy rules. Real-time pings expose household PII.'
    },
    {
      agent: 'Field Enumerator',
      role: 'Ground Feasibility',
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
      source: 'NSO-FOD-SOP-2024',
      text: 'LWE blocks face zero 4G connectivity. Requiring 24-hour uploads causes app freezes and enumerator attrition. Offline-first local sync is mandatory.'
    },
    {
      agent: 'Judge Agent (Synthesis)',
      role: 'Decision Report & Tree',
      color: 'border-amber-400/80 bg-amber-950/30 text-amber-300 ring-1 ring-amber-400/50',
      source: 'NSC-REC-2023-08',
      text: 'RECOMMENDATION: Deploy a Hybrid Model. Enforce zero-trust client-side encryption on field tablets with 72-hour offline sync windows and quarterly NSC sampling audits.',
      isJudge: true
    }
  ],
  'digital-gov': [
    {
      agent: 'State Statistical Officer',
      role: 'Operations & Speed',
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
      source: 'MOSPI-IDQF-2024',
      text: 'GPS geotagging prevents enumerator ghost-surveys and guarantees 100% field visit authentication.'
    },
    {
      agent: 'Data Privacy Officer',
      role: 'Compliance & Biometrics',
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
      source: 'NDSAP-PRIVACY-2023',
      text: 'Facial biometric capture on rural respondents requires explicit informed consent forms and hash-encryption.'
    },
    {
      agent: 'Field Enumerator',
      role: 'Ground Reality',
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
      source: 'NSO-FOD-SOP-2024',
      text: 'Biometric scanners fail in harsh sun or high humidity, doubling survey duration per household.'
    },
    {
      agent: 'Judge Agent (Synthesis)',
      role: 'Decision Report',
      color: 'border-amber-400/80 bg-amber-950/30 text-amber-300 ring-1 ring-amber-400/50',
      source: 'MOSPI-POLICY-2025',
      text: 'RECOMMENDATION: Replace biometric scans with geo-fenced GPS radius check-ins to protect respondent trust while eliminating ghost surveys.',
      isJudge: true
    }
  ],
  'field-ops': [
    {
      agent: 'State Statistical Officer',
      role: 'Operations',
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
      source: 'MOSPI-IDQF-2024',
      text: 'CAPI mobile tools reduce data entry errors by 82% compared to paper schedules.'
    },
    {
      agent: 'Data Privacy Officer',
      role: 'Security',
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
      source: 'NDSAP-PRIVACY-2023',
      text: 'Offline database caches stored on mobile SD cards must use AES-256 bit hardware-level encryption.'
    },
    {
      agent: 'Field Enumerator',
      role: 'Feasibility',
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
      source: 'NSO-FOD-SOP-2024',
      text: 'Enumerators need solar power banks in remote blocks to prevent battery drain during 10-hour shifts.'
    },
    {
      agent: 'Judge Agent (Synthesis)',
      role: 'Decision Report',
      color: 'border-amber-400/80 bg-amber-950/30 text-amber-300 ring-1 ring-amber-400/50',
      source: 'NSC-REC-2023-08',
      text: 'RECOMMENDATION: Issue AES-encrypted CAPI tablets bundled with ruggedized solar backup kits for all hill-district field teams.',
      isJudge: true
    }
  ],
  'ethics-privacy': [
    {
      agent: 'State Statistical Officer',
      role: 'Transparency',
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
      source: 'MOSPI-IDQF-2024',
      text: 'Public researchers urgently require granular microdata for economic policy formulation.'
    },
    {
      agent: 'Data Privacy Officer',
      role: 'Compliance',
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
      source: 'NDSAP-PRIVACY-2023',
      text: 'Re-identification attacks can link anonymized census files with voter lists. Differential privacy noise is required.'
    },
    {
      agent: 'Field Enumerator',
      role: 'Respondent Trust',
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
      source: 'NSO-FOD-SOP-2024',
      text: 'If citizens suspect their survey responses are public, field refusal rates will skyrocket.'
    },
    {
      agent: 'Judge Agent (Synthesis)',
      role: 'Decision Report',
      color: 'border-amber-400/80 bg-amber-950/30 text-amber-300 ring-1 ring-amber-400/50',
      source: 'MOSPI-POLICY-2025',
      text: 'RECOMMENDATION: Release synthetic microdata datasets for general research while locking raw microdata inside secure MoSPI Enclaves.',
      isJudge: true
    }
  ]
};

const PERSONAS = [
  {
    code: 'SSO',
    name: 'State Statistical Officer',
    role: 'Operational Efficiency & Execution',
    tags: ['Speed', 'Cost Efficiency', 'Resource Throughput'],
    color: 'from-blue-500 to-indigo-600',
    blurb: 'Prioritizes rapid field execution, administrative simplicity, cost optimization, and high survey completion rates.'
  },
  {
    code: 'DPO',
    name: 'Data Privacy Officer',
    role: 'Compliance & Regulatory Protection',
    tags: ['NDSAP Guidelines', 'k-Anonymity', 'Differential Privacy'],
    color: 'from-purple-500 to-pink-600',
    blurb: 'Guards respondent privacy, mandates PII anonymization, and enforces national data sharing compliance.'
  },
  {
    code: 'FE',
    name: 'Field Enumerator',
    role: 'Ground Reality & Local Access',
    tags: ['Offline CAPI', 'Battery & Sync', 'Respondent Trust'],
    color: 'from-emerald-500 to-teal-600',
    blurb: 'Represents the enumerator on the ground in rural/remote blocks, addressing connectivity, survey fatigue, and CAPI usability.'
  },
  {
    code: 'PA',
    name: 'Policy Analyst',
    role: 'Strategic Alignment & Integrity',
    tags: ['95% CI Standards', 'Statistical Continuity', 'Policy Precedent'],
    color: 'from-amber-500 to-orange-600',
    blurb: 'Ensures multi-year statistical comparability, rigorous confidence intervals, and alignment with NSC benchmark guidelines.'
  }
];

const FAQS = [
  {
    q: 'What is Neeti Vivaad?',
    a: 'Neeti Vivaad is an AI-powered Skill Intelligence & Policy Debate platform built for officials in India\'s Official Statistical System (MoSPI). It combines competency gap identification with a unique multi-agent debate simulator that trains judgment and decision-making.'
  },
  {
    q: 'How do you prevent AI hallucination in debate arguments?',
    a: 'Every single claim and argument generated by the 4 debate agents is strictly grounded in real, retrieved MoSPI publications, National Statistical Commission guidelines, and India Data Quality Framework documents via FAISS RAG vector search. If a claim cannot cite an indexed document, it is not generated.'
  },
  {
    q: 'Is this meant to replace iGOT Karmayogi training courses?',
    a: 'No. Neeti Vivaad acts as the intelligence layer for iGOT Karmayogi. It identifies an official\'s specific skill gaps and semantically matches them to the exact iGOT courses needed, closing the loop with grounded AI assessments.'
  },
  {
    q: 'What is the Critical Thinking Quotient (CTQ)?',
    a: 'CTQ is a decision-making metric calculated by evaluating an official\'s ability to detect logical fallacies (e.g. False Dilemma, Strawman, Hasty Generalization) during Neeti Vivaad debate sessions. It feeds directly into their Behavioural/Managerial competency score.'
  }
];

export function MeliusLanding() {
  const [activeTab, setActiveTab] = useState('data-policy');
  const [activePersonaIdx, setActivePersonaIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Fallacy hunter inline teaser state
  const [teaserSelected, setTeaserSelected] = useState<number | null>(null);

  // Pinned persona scroll handler
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!personaRef.current) return;
      const rect = personaRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)));
        const idx = Math.min(PERSONAS.length - 1, Math.floor(progress * PERSONAS.length));
        setActivePersonaIdx(idx);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen font-sans selection:bg-cyan-500 selection:text-zinc-950 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-cyan-400 mb-8 shadow-inner"
        >
          <PlainviewSunLogo className="w-4 h-4 text-cyan-400" />
          <span>MoSPI SIH2026 · Problem Statement SIH26101</span>
        </motion.div>

        {/* Big Bold Hero Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]"
        >
          Every decision has four sides.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            See all of them.
          </span>
        </motion.h1>

        {/* Supporting sentence */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Neeti Vivaad is an AI-moderated multi-agent policy debate simulator for India's Official Statistical System — strictly grounded in real MoSPI guidelines and data quality frameworks.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/debate"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 text-zinc-950 font-semibold text-base shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Start a Debate Arena</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 font-medium text-base transition-all flex items-center justify-center gap-2"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Learner Competencies</span>
          </Link>
        </motion.div>
      </section>

      {/* 2. MOSPI GROUNDING TRUST STRIP */}
      <section className="border-y border-zinc-900 bg-zinc-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-zinc-400 mb-6">
            Strictly Grounded in Real Government Reference Publications
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-80">
            <div className="flex items-center gap-2 text-zinc-300 font-mono text-sm font-semibold">
              <Database className="w-4 h-4 text-cyan-400" /> MoSPI Reports 2024-25
            </div>
            <div className="flex items-center gap-2 text-zinc-300 font-mono text-sm font-semibold">
              <Scale className="w-4 h-4 text-purple-400" /> National Statistical Commission
            </div>
            <div className="flex items-center gap-2 text-zinc-300 font-mono text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> India Data Quality Framework
            </div>
            <div className="flex items-center gap-2 text-zinc-300 font-mono text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> iGOT Karmayogi Framework
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY SWITCHER & FLOATING NODE-CARD SHOWCASE */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">Live Canvas Showcase</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Watch a Policy Debate Assemble in Real Time
          </h3>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-12 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-mono transition-all whitespace-nowrap border ${
                activeTab === cat.id
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Floating Node Cards Grid (Staggered animation) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {SHOWCASE_NODES[activeTab as keyof typeof SHOWCASE_NODES].map((node, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.4 }}
                className={`p-6 rounded-2xl border bg-zinc-900/90 backdrop-blur-sm shadow-xl relative overflow-hidden transition-all hover:scale-[1.02] ${node.color}`}
              >
                {/* Source Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    {node.agent}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-400">
                    grounded in: {node.source}
                  </span>
                </div>

                <p className="text-sm text-zinc-200 leading-relaxed font-sans mb-4">
                  "{node.text}"
                </p>

                {node.isJudge && (
                  <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Expandable Judgment Tree Available
                    </span>
                    <Link href="/debate" className="underline hover:text-amber-300">View Tree →</Link>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* 4. PINNED PERSONA SCROLL-SCRUBBED SECTION */}
      <section ref={personaRef} className="py-24 border-t border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">4 Persona Engine</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Balanced Multi-Perspective Debate Architecture
            </h3>
            <p className="text-sm text-zinc-400 mt-3">
              Scroll down to explore how each agent defends its specific priority within MoSPI statistical governance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Persona Selector List */}
            <div className="lg:col-span-5 space-y-4">
              {PERSONAS.map((p, idx) => {
                const isActive = activePersonaIdx === idx;
                return (
                  <div
                    key={p.code}
                    onClick={() => setActivePersonaIdx(idx)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-zinc-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-900/40 border-zinc-800/80 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${p.color}`} />
                      <h4 className="font-bold text-white text-base">{p.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">{p.role}</p>
                  </div>
                );
              })}
            </div>

            {/* Persona Detail Display Card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {PERSONAS[activePersonaIdx] && (
                  <motion.div
                    key={PERSONAS[activePersonaIdx].code}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${PERSONAS[activePersonaIdx].color} opacity-10 blur-2xl rounded-full`} />
                    
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                        Persona #{activePersonaIdx + 1}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-950 border border-zinc-800 text-cyan-400">
                        Code: {PERSONAS[activePersonaIdx].code}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                      {PERSONAS[activePersonaIdx].name}
                    </h3>
                    <p className="text-sm text-cyan-400 font-mono mb-6">
                      {PERSONAS[activePersonaIdx].role}
                    </p>

                    <p className="text-base text-zinc-300 leading-relaxed mb-6 font-sans">
                      {PERSONAS[activePersonaIdx].blurb}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {PERSONAS[activePersonaIdx].tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-lg text-xs font-mono bg-zinc-950 border border-zinc-800 text-zinc-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FALLACY HUNTER TEASER */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-12 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-4">
              <AlertTriangle className="w-3.5 h-3.5" /> Interactive Fallacy Hunter Teaser
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Test Your Critical Thinking & Decision Quotient Inline
            </h3>
            
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              Read the AI agent argument below and identify which logical fallacy is embedded inside it:
            </p>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm italic font-sans mb-6">
              "State Statistical Officer: If we don't switch 100% of field surveys to real-time digital app capture by next month, our entire national statistical system will completely collapse."
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { label: 'False Dilemma (Black-or-White Fallacy)', isCorrect: true },
                { label: 'Ad Hominem Attack', isCorrect: false },
                { label: 'Circular Reasoning', isCorrect: false },
                { label: 'Red Herring', isCorrect: false }
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setTeaserSelected(idx)}
                  className={`p-4 rounded-xl text-xs font-mono text-left transition-all border ${
                    teaserSelected === idx
                      ? opt.isCorrect
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {teaserSelected !== null && (
              <div className={`p-4 rounded-xl text-xs font-mono ${
                teaserSelected === 0 ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
              }`}>
                {teaserSelected === 0 ? (
                  <span>✓ CORRECT! False Dilemma forces an artificial binary choice (instant 100% digital vs total collapse), ignoring realistic phased implementations. (+10 CTQ points)</span>
                ) : (
                  <span>✕ INCORRECT. Try again! Hint: Look for extreme binary choices.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. ACCORDION FAQ SECTION */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">FAQ</h2>
          <h3 className="text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-semibold text-white text-base hover:text-cyan-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed font-sans border-t border-zinc-800/40 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
