'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, ShieldCheck, Cpu, BookOpen, 
  MessageSquare, BarChart3, Terminal, CheckCircle2, Play,
  Users, Award, Sparkles, Target, Zap, Layers, Briefcase, FileCheck, HelpCircle
} from 'lucide-react';
import { Logo } from './Logo';
import { CrowdCanvas } from './ui/skiper39';
import { NeetiHeroShowcase } from './NeetiHeroShowcase';

export function LandingShowcase() {

  const features = [
    {
      title: 'FAISS Semantic Competency Mapping',
      icon: Cpu,
      badge: 'SKILL GAP ENGINE',
      description: 'Continuous diagnostic benchmarking across Statistical Methodology, Technical Tools, Digital Governance, and Behavioural domains with automatic course matching.'
    },
    {
      title: 'Grounded AI Assessment Studio',
      icon: BookOpen,
      badge: 'VERIFIED RAG',
      description: 'Upload statistical survey manuals or ministry circulars. Generate instant, syllabus-grounded MCQs with zero hallucination and page-level citations.'
    },
    {
      title: 'Multi-Agent Policy Debate Arena',
      icon: MessageSquare,
      badge: 'DECISION SIMULATOR',
      description: 'Engage with 4 distinct AI stakeholder personas debating complex policy trade-offs. Spot logical fallacies and inject dynamic real-world constraints.'
    },
    {
      title: 'Critical Thinking Quotient (CTQ)',
      icon: Award,
      badge: 'COGNITIVE METRIC',
      description: 'Quantify officer analytical depth, fallacy detection accuracy, and decision consistency through structured judgment evaluation trees.'
    },
    {
      title: 'Department-Wide Heatmap Analytics',
      icon: BarChart3,
      badge: 'LEADERSHIP INTELLIGENCE',
      description: 'Provides Director Generals with macro visibility into division strengths, capability deficits, and training compliance across all field directorates.'
    },
    {
      title: 'Smart e-Recruitment & Allocation',
      icon: Briefcase,
      badge: 'TALENT PLACEMENT',
      description: 'Automatically matches tested officer proficiencies and CTQ ratings with high-priority vacancies for objective, merit-based deployment.'
    }
  ];

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
      title: 'Neeti Saarthi Debate',
      icon: MessageSquare,
      badge: 'MULTI-AGENT POLICY SIMULATOR',
      description: "Watch four AI stakeholders argue a real policy dilemma. Catch the fallacies. Sharpen your judgment.",
      link: '/debate',
      linkText: 'Enter Debate Arena'
    },
    {
      title: 'Admin Heatmap & e-Recruitment',
      icon: BarChart3,
      badge: 'DEPARTMENT INTELLIGENCE',
      description: "See competency, vacancy matching, and decision-making strength across your entire department.",
      link: '/admin-dashboard',
      linkText: 'Inspect Admin Metrics'
    }
  ];

  return (
    <div className="bg-white text-[#171717] min-h-screen font-sans selection:bg-[#3ecf8e] selection:text-[#171717]">
      
      {/* HERO SECTION */}
      <NeetiHeroShowcase />

      {/* 1) ABOUT SECTION (#about) */}
      <section id="about" className="py-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#ededed]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fafafa] border border-[#dfdfdf] text-xs font-mono text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
              <span>About Neeti Saarthi · MoSPI SIH26101</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171717] leading-tight">
              An AI-Driven Skill &amp; Decision Intelligence Platform for Indian Statistics
            </h2>

            <p className="text-base text-[#707070] leading-relaxed font-normal">
              <strong>Neeti Saarthi</strong> is developed to transform statistical capacity building and strategic workforce deployment across India's Official Statistical System. Aligned directly with <strong>Mission Karmayogi (iGOT)</strong> and National Statistical Commission (NSC) quality guidelines, the platform bridges the critical gap between knowledge assessment, analytical thinking, and real-world policy governance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] space-y-1.5">
                <div className="text-xs font-mono font-semibold uppercase text-[#171717] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#24b47e]" />
                  <span>Mission</span>
                </div>
                <p className="text-xs text-[#707070] leading-relaxed">
                  Eliminate capability deficits and foster evidence-based statistical leadership across field and administrative units.
                </p>
              </div>

              <div className="p-4 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] space-y-1.5">
                <div className="text-xs font-mono font-semibold uppercase text-[#171717] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#644fc1]" />
                  <span>Zero Hallucination</span>
                </div>
                <p className="text-xs text-[#707070] leading-relaxed">
                  Strictly RAG-grounded in official MoSPI survey methodology, IDQF standards, and NDSAP data privacy mandates.
                </p>
              </div>
            </div>
          </div>

          {/* About Right Visual Cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="card-supa-light p-6 space-y-4 border border-[#dfdfdf] shadow-sm">
              <span className="text-xs font-mono uppercase text-[#707070] tracking-wider block">Three Core Strategic Pillars</span>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed]">
                  <div className="w-8 h-8 rounded-full bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                    01
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#171717] text-sm">Automated Competency Mapping</h4>
                    <p className="text-xs text-[#707070] mt-0.5">FAISS vector engine diagnoses individual and departmental skill gaps against defined role targets.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed]">
                  <div className="w-8 h-8 rounded-full bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                    02
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#171717] text-sm">Policy Debate &amp; Fallacy Hunter</h4>
                    <p className="text-xs text-[#707070] mt-0.5">Multi-agent AI policy simulations sharpen officials' critical thinking, fallacy detection, and decision judgment.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed]">
                  <div className="w-8 h-8 rounded-full bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                    03
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#171717] text-sm">Smart e-Recruitment &amp; Placement</h4>
                    <p className="text-xs text-[#707070] mt-0.5">Matches audited officer proficiencies with ministry vacancies for fast, transparent, merit-based allocations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2) FEATURES SECTION (#features) */}
      <section id="features" className="py-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#ededed]">
        <div className="mb-14 text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#707070] font-medium">
            PLATFORM CAPABILITIES
          </h2>
          <h3 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171717] leading-tight">
            Designed for Comprehensive Statistical &amp; Policy Excellence
          </h3>
          <p className="text-base text-[#707070] leading-relaxed">
            From automated syllabus parsing to multi-agent debate simulation and leadership talent management.
          </p>
        </div>

        {/* Features 6-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const IconC = feat.icon;
            return (
              <div
                key={idx}
                className="card-supa-light p-6 space-y-4 hover:border-[#c7c7c7] transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-[8px] bg-[#171717] text-[#3ecf8e]">
                      <IconC className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#fafafa] border border-[#dfdfdf] text-[#707070]">
                      {feat.badge}
                    </span>
                  </div>

                  <h4 className="text-lg font-medium text-[#171717] tracking-tight">{feat.title}</h4>
                  <p className="text-xs text-[#707070] leading-relaxed">{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>



      {/* CROWD CANVAS SECTION */}
      <section className="relative py-16 border-t border-[#ededed] bg-[#fafafa] overflow-hidden min-h-[360px] flex items-center justify-center">
        <CrowdCanvas
          src="/images/peeps/all-peeps.png"
          rows={15}
          cols={7}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-100"
        />
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

            <Link href="/login" className="btn-primary-green px-5 py-2.5 text-sm whitespace-nowrap">
              <Play className="w-4 h-4" />
              <span>Get started with Neeti Saarthi</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
