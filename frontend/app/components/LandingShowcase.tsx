'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, ShieldCheck, Cpu, BookOpen, 
  MessageSquare, BarChart3, CheckCircle2, Play,
  Award, Sparkles, Target, Zap, Layers, Briefcase, FileText,
  ChevronDown, ChevronUp, Check, AlertTriangle, HelpCircle, ExternalLink
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { NeetiHeroShowcase } from './NeetiHeroShowcase';

const competencyBreakdown = [
  { domain: 'Statistical & Data Science', score: 78, target: 85, color: '#0F766E' },
  { domain: 'Technical & Software', score: 64, target: 80, color: '#F2A900' },
  { domain: 'Digital Governance', score: 48, target: 80, color: '#C0392B' },
  { domain: 'Behavioural & Managerial', score: 61, target: 75, color: '#0B1F3A' },
];

const competencyRadarData = [
  { domain: 'Statistical & Data', score: 78, target: 85, fullMark: 100 },
  { domain: 'Technical Tools', score: 64, target: 80, fullMark: 100 },
  { domain: 'Digital Governance', score: 48, target: 80, fullMark: 100 },
  { domain: 'Policy Judgment', score: 82, target: 85, fullMark: 100 },
  { domain: 'Behavioural Leadership', score: 61, target: 75, fullMark: 100 },
];

const skillGapCards = [
  {
    id: 'gov-gap',
    title: 'Digital Data Governance & IDQF',
    priority: 'HIGH PRIORITY',
    priorityColor: 'bg-[#C0392B] text-white',
    current: 48,
    target: 80,
    gap: 32,
    domain: 'Digital Governance',
    description: 'Critical deficiency in National Data Sharing & Accessibility Policy (NDSAP) protocols and automated data validation pipelines.',
    recommendedCourse: 'Data Governance & IDQF Standards in Official Statistics',
  },
  {
    id: 'python-gap',
    title: 'Python & Statistical Modeling',
    priority: 'MEDIUM PRIORITY',
    priorityColor: 'bg-[#F2A900] text-[#111111]',
    current: 64,
    target: 85,
    gap: 21,
    domain: 'Statistical Methodology',
    description: 'Deficit in algorithmic survey data cleaning, automated outlier flagging, and sampling error computation with Python.',
    recommendedCourse: 'Python for Statistical Officers & Survey Analytics',
  },
  {
    id: 'privacy-gap',
    title: 'Differential Privacy & Anonymization',
    priority: 'HIGH PRIORITY',
    priorityColor: 'bg-[#C0392B] text-white',
    current: 40,
    target: 75,
    gap: 35,
    domain: 'Data Protection',
    description: 'Needs training in k-anonymity (k>=5) and microdata privacy noise addition before public dissemination.',
    recommendedCourse: 'Microdata Anonymization & Public Data Dissemination',
  },
  {
    id: 'survey-gap',
    title: 'Sample Survey Design & Stratification',
    priority: 'MEDIUM PRIORITY',
    priorityColor: 'bg-[#F2A900] text-[#111111]',
    current: 70,
    target: 90,
    gap: 20,
    domain: 'Survey Operations',
    description: 'Requires upskilling in multi-stage stratified cluster sampling methods for nationwide socioeconomic field surveys.',
    recommendedCourse: 'Advanced Survey Sampling & Sample Size Determination',
  },
];

const debateAgents = [
  {
    role: 'State Statistical Officer',
    persona: 'Efficiency & Cost',
    badge: 'DIRECTORATE REP',
    color: 'border-[#F2A900]',
    quote: 'Reducing survey sample size by 30% allows quarterly release within the allocated budget envelope without delaying key indicators.',
    stance: 'Advocates for synthetic imputation and stratified trimming to save state costs.',
  },
  {
    role: 'Data Privacy Officer',
    persona: 'Compliance & IDQF',
    badge: 'QUALITY REGULATOR',
    color: 'border-[#14B8A6]',
    quote: 'Any microdata release must adhere to k-anonymity thresholds. Cost cuts cannot compromise respondent confidentiality or NDSAP mandates.',
    stance: 'Enforces strict differential privacy noise addition regardless of budget constraints.',
  },
  {
    role: 'Field Enumerator Representative',
    persona: 'Field Feasibility',
    badge: 'GROUND OPERATIONS',
    color: 'border-[#C0392B]',
    quote: 'In remote and hilly districts, tablet-based offline sync fails without battery packs. Real-time GPS verification adds 20 minutes per household.',
    stance: 'Prioritizes enumerator workload, field safety, and realistic interview duration.',
  },
  {
    role: 'Macro Policy Analyst',
    persona: 'Long-term Impact',
    badge: 'PLANNING COMMISSION',
    color: 'border-[#0F766E]',
    quote: 'Underestimating unemployment in agrarian clusters due to sparse sample density leads to 1000+ crore misallocations in rural welfare schemes.',
    stance: 'Guards macro statistical validity and long-term socioeconomic policy alignment.',
  },
];

export function LandingShowcase() {
  const [expandedTreeItem, setExpandedTreeItem] = useState<string | null>('evidence-1');

  return (
    <div className="bg-[#F8F7F2] text-[#111111] min-h-screen font-sans selection:bg-[#F2A900] selection:text-[#111111]">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (DEEP NAVY) */}
      {/* ========================================================================= */}
      <NeetiHeroShowcase />

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL EDITORIAL TICKER (SAFFRON GOLD) */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#F2A900] border-b-2 border-[#111111] py-3 overflow-hidden select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 font-display font-black text-sm uppercase tracking-wider text-[#111111]">
          <span>★ SKILLS THAT MATTER</span>
          <span>&bull;</span>
          <span>BASED ON TRUSTED SOURCES</span>
          <span>&bull;</span>
          <span>ROLE-FOCUSED</span>
          <span>&bull;</span>
          <span>RECOMMENDED FOR YOU</span>
          <span>&bull;</span>
          <span>MISSION KARMAYOGI ALIGNED</span>
          <span>&bull;</span>
          <span>PRACTICE REAL DECISIONS</span>
          <span>&bull;</span>
          <span>CONTINUOUS LEARNING</span>
          <span>&bull;</span>
          <span>★ SKILLS THAT MATTER</span>
          <span>&bull;</span>
          <span>BASED ON TRUSTED SOURCES</span>
          <span>&bull;</span>
          <span>ROLE-FOCUSED</span>
          <span>&bull;</span>
          <span>RECOMMENDED FOR YOU</span>
          <span>&bull;</span>
          <span>MISSION KARMAYOGI ALIGNED</span>
          <span>&bull;</span>
          <span>PRACTICE REAL DECISIONS</span>
          <span>&bull;</span>
          <span>CONTINUOUS LEARNING</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: KNOW WHERE YOU STAND (WARM OFF-WHITE) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-[1360px] mx-auto border-b-2 border-[#111111]">
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-12 pb-4 border-b-2 border-[#111111]">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0F766E] block">
              STEP 01 &bull; YOUR SKILLS
            </span>
            <h2 className="display-section text-[#111111]">
              KNOW WHERE<br />
              YOU STAND.
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Neeti Saarthi builds your skill profile from your experience, your role, and your learning activity.
            </p>
          </div>
        </div>

        {/* Competency Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Large Radar Visualization Card */}
          <div className="lg:col-span-6 card-brutal bg-white p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#111111]">
              <div className="flex items-center gap-2">
                <span className="badge-starburst badge-starburst-emerald text-xs">
                  ★ SKILL OVERVIEW
                </span>
                <span className="text-xs font-display font-extrabold uppercase text-[#111111]">
                  Official Benchmark
                </span>
              </div>
              <span className="text-xs font-mono text-[#4B5563]">
                Current vs Goal
              </span>
            </div>

            <div className="w-full h-[320px] sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={competencyRadarData}>
                  <PolarGrid stroke="#111111" strokeWidth={1.5} strokeDasharray="4 4" />
                  <PolarAngleAxis 
                    dataKey="domain" 
                    tick={{ fill: '#111111', fontSize: 11, fontWeight: 800, fontFamily: 'Space Grotesk' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar 
                    name="Target Role Benchmark" 
                    dataKey="target" 
                    stroke="#F2A900" 
                    fill="#F2A900" 
                    fillOpacity={0.2} 
                    strokeWidth={2} 
                  />
                  <Radar 
                    name="Officer Score" 
                    dataKey="score" 
                    stroke="#0F766E" 
                    fill="#0F766E" 
                    fillOpacity={0.5} 
                    strokeWidth={3} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs font-display font-bold">
              <span className="flex items-center gap-2 text-[#0F766E]">
                <span className="w-3.5 h-3.5 rounded bg-[#0F766E] border border-[#111111]" />
                Current Level
              </span>
              <span className="flex items-center gap-2 text-[#D97706]">
                <span className="w-3.5 h-3.5 rounded bg-[#F2A900] border border-[#111111]" />
                Goal Level
              </span>
            </div>
          </div>

          {/* Right: Domain Score Panels */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B5563] block">
              YOUR SKILL BREAKDOWN
            </span>

            {competencyBreakdown.map((item, idx) => (
              <div 
                key={idx} 
                className="card-brutal bg-white p-5 space-y-3 hover:translate-x-1 transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-display font-extrabold uppercase text-[#111111]">
                    {item.domain}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-black text-[#111111]">
                      {item.score}
                    </span>
                    <span className="text-xs font-mono text-[#4B5563]">/ {item.target} Target</span>
                  </div>
                </div>

                {/* Progress Bar with 2px border */}
                <div className="w-full h-3 bg-[#E5E4DE] rounded-full border-2 border-[#111111] overflow-hidden relative">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.score}%`, 
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Link href="/dashboard" className="btn-brutal-primary w-full sm:w-auto">
                <span>View My Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: FIND THE GAP (EMERALD GREEN) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#0F766E] text-white border-b-2 border-[#111111]">
        <div className="max-w-[1360px] mx-auto space-y-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-white/20">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FCD34D] block">
                STEP 02 &bull; SKILLS TO IMPROVE
              </span>
              <h2 className="display-section text-white">
                SKILLS TO<br />
                IMPROVE.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-teal-100 max-w-md leading-relaxed">
              Discover the skills that will help you excel in your current role and prepare for future responsibilities.
            </p>
          </div>

          {/* Main Content Grid: Illustration Left + 4 Skill Gap Cards Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Illustration Showcase Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#F8F7F2] text-[#111111] rounded-[28px] border-2 border-[#111111] shadow-brutal-xl p-6 sm:p-7 relative flex flex-col justify-between space-y-5">
                
                {/* Floating Badges */}
                <div className="absolute -top-3 -right-2 z-20 badge-starburst badge-starburst-saffron text-[10px] rotate-2 shadow-brutal-sm">
                  ★ FOCUS AREAS
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F766E] block">
                    AREAS TO GROW
                  </span>
                  <h3 className="text-xl font-display font-black uppercase text-[#111111] leading-tight">
                    SKILLS TO BUILD
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    Clear guidance on key competencies aligned with your role and department standards.
                  </p>
                </div>

                {/* Illustration Frame */}
                <div className="w-full bg-white rounded-2xl border-2 border-[#111111] p-4 flex items-center justify-center overflow-hidden shadow-brutal-sm">
                  <img 
                    src="/images/find-gap.jpg" 
                    alt="Neeti Saarthi Officer Statistical Gap Analysis"
                    className="w-full max-h-[260px] object-contain rounded-xl"
                  />
                </div>

                {/* Telemetry Footer */}
                <div className="pt-3 border-t-2 border-[#111111] grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white border border-[#111111] shadow-brutal-sm">
                    <span className="text-[9px] text-[#4B5563] block uppercase font-bold">Skills to Improve</span>
                    <span className="text-sm font-display font-black text-[#C0392B]">4 Key Areas</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#111111] shadow-brutal-sm">
                    <span className="text-[9px] text-[#4B5563] block uppercase font-bold">Top Priority</span>
                    <span className="text-sm font-display font-black text-[#0F766E]">Data Governance</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: 4 Skill Gap Cards Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skillGapCards.map((card) => (
                <div 
                  key={card.id}
                  className="bg-[#F8F7F2] text-[#111111] rounded-[22px] border-2 border-[#111111] shadow-brutal p-5 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-display font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#111111] shadow-brutal-sm ${card.priorityColor}`}>
                        {card.priority}
                      </span>
                      <span className="text-xs font-mono text-[#C0392B] font-bold">
                        -{card.gap} pts
                      </span>
                    </div>

                    <h3 className="text-base font-display font-extrabold uppercase text-[#111111] leading-tight">
                      {card.title}
                    </h3>

                    <p className="text-[11px] text-[#4B5563] leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t-2 border-[#111111] space-y-2.5">
                    {/* Delta Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold">
                        <span>Current: {card.current}%</span>
                        <span>Target: {card.target}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#E5E4DE] rounded-full border-2 border-[#111111] overflow-hidden flex">
                        <div className="h-full bg-[#0F766E]" style={{ width: `${card.current}%` }} />
                        <div className="h-full bg-[#C0392B] opacity-60" style={{ width: `${card.gap}%` }} />
                      </div>
                    </div>

                    <Link 
                      href="/courses" 
                      className="btn-brutal-emerald w-full !text-[11px] !py-2 flex items-center justify-between"
                    >
                      <span>View Courses</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION: LEARN WHAT MATTERS (WARM OFF-WHITE) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-[1360px] mx-auto border-b-2 border-[#111111]">
        <div className="space-y-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-[#111111]">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0F766E] block">
                STEP 03 &bull; RECOMMENDED COURSES
              </span>
              <h2 className="display-section text-[#111111]">
                LEARN WHAT<br />
                MATTERS.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#4B5563] max-w-md leading-relaxed">
              Discover courses from iGOT Karmayogi selected for your skills, role, and learning goals.
            </p>
          </div>

          {/* Editorial Network Illustration & Course Matching Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Feature Highlights */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="badge-starburst badge-starburst-emerald text-xs">
                  ★ PERSONALIZED LEARNING
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-black uppercase text-[#111111] leading-tight">
                  LEARNING THAT FITS YOUR ROLE
                </h3>
                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  Neeti Saarthi connects your skills directly with official courses on iGOT Karmayogi, making learning straightforward and relevant.
                </p>
              </div>

              <div className="space-y-3">
                <div className="card-brutal bg-white p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#0F766E]">01 &bull; Tailored to You</span>
                    <span className="text-[11px] font-mono font-bold bg-[#0F766E] text-white px-2 py-0.5 rounded">Excellent Match</span>
                  </div>
                  <h4 className="font-display font-extrabold text-sm uppercase text-[#111111]">Courses Selected for Your Goals</h4>
                  <p className="text-xs text-[#4B5563]">
                    Courses are selected to help you build the exact skills you need for your position and career progression.
                  </p>
                </div>

                <div className="card-brutal bg-white p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#D97706]">02 &bull; Mission Karmayogi Aligned</span>
                    <span className="text-[11px] font-mono font-bold bg-[#F2A900] text-[#111111] px-2 py-0.5 rounded">Official iGOT</span>
                  </div>
                  <h4 className="font-display font-extrabold text-sm uppercase text-[#111111]">Verified Government Curriculums</h4>
                  <p className="text-xs text-[#4B5563]">
                    Direct integration with national capacity building frameworks, ensuring recognized credentials for career progression.
                  </p>
                </div>

                <div className="card-brutal bg-white p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#0B1F3A]">03 &bull; Learn with Public Servants</span>
                    <span className="text-[11px] font-mono font-bold bg-[#0B1F3A] text-white px-2 py-0.5 rounded">Nationwide</span>
                  </div>
                  <h4 className="font-display font-extrabold text-sm uppercase text-[#111111]">Shared Learning Across Cadres</h4>
                  <p className="text-xs text-[#4B5563]">
                    Popular and effective learning pathways recommended across central ministries, state directorates, and field operations.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link href="/courses" className="btn-brutal-primary !text-sm !py-3 !px-7">
                  <span>Browse Full iGOT Catalog</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link href="/dashboard" className="btn-brutal-secondary !text-sm !py-3 !px-6">
                  <span>View My Profile</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Illustration in Brutalist Stage Card */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              <div className="card-brutal bg-white p-6 sm:p-8 rounded-[28px] shadow-brutal-xl relative w-full max-w-[480px] flex flex-col items-center justify-center">
                
                {/* Floating Badges */}
                <div className="absolute -top-4 -right-3 z-20 badge-starburst badge-starburst-saffron rotate-3 shadow-brutal">
                  ★ CONNECTED CADRE
                </div>

                <div className="absolute -bottom-3 -left-3 z-20 badge-starburst badge-starburst-emerald -rotate-2 shadow-brutal">
                  ★ PEER LEARNING NETWORK
                </div>

                {/* Illustration Frame */}
                <div className="w-full bg-[#FAF9F5] rounded-2xl border-2 border-[#111111] p-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/network-people.jpg" 
                    alt="Neeti Saarthi Connected Peer Learning Network"
                    className="w-full max-h-[380px] object-contain rounded-xl"
                  />
                </div>

                {/* Subtitle Bar */}
                <div className="w-full pt-4 mt-3 border-t-2 border-[#111111] flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#111111]">Public Service Learning Network</span>
                  <span className="text-[#0F766E] font-extrabold">● Active Learners: 1,420+</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION: TEST WHAT YOU KNOW (SAFFRON GOLD) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#F2A900] text-[#111111] border-b-2 border-[#111111]">
        <div className="max-w-[1360px] mx-auto space-y-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-[#111111]">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0B1F3A] block">
                STEP 04 &bull; KNOWLEDGE CHECKS
              </span>
              <h2 className="display-section text-[#111111]">
                TEST WHAT<br />
                YOU KNOW.
              </h2>
            </div>
            <div className="space-y-2 max-w-md">
              <span className="badge-starburst badge-starburst-navy text-xs">
                ★ BASED ON TRUSTED MATERIAL
              </span>
              <p className="text-sm sm:text-base text-zinc-900 font-medium leading-relaxed">
                Answer quick questions based directly on official guidelines and training materials to check what you remember.
              </p>
            </div>
          </div>

          {/* Document to Assessment Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Flow Steps & Illustration */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Illustration Card */}
              <div className="card-brutal bg-white p-5 rounded-[24px] shadow-brutal relative flex flex-col items-center justify-center">
                <div className="absolute -top-3 -right-2 z-20 badge-starburst badge-starburst-navy text-[10px] rotate-2 shadow-brutal-sm">
                  ★ TRUSTED GUIDELINES
                </div>
                <div className="w-full bg-[#FAF9F5] rounded-xl border-2 border-[#111111] p-3 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/test-knowledge.jpg" 
                    alt="Neeti Saarthi Verified Knowledge Testing"
                    className="w-full max-h-[220px] object-contain rounded-lg"
                  />
                </div>
                <div className="w-full pt-3 mt-2 border-t-2 border-[#111111] flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-[#111111]">Knowledge Source</span>
                  <span className="text-[#0F766E] font-extrabold">Official Guidelines</span>
                </div>
              </div>

              {/* 3 Step Workflow */}
              <div className="space-y-2.5">
                <div className="card-brutal bg-white p-3.5 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center font-display font-extrabold text-[11px]">
                      01
                    </div>
                    <h4 className="font-display font-extrabold uppercase text-xs">Choose Learning Material</h4>
                  </div>
                  <p className="text-[11px] text-[#4B5563] pl-8">
                    Select or upload any official guideline, manual, or circular you want to review.
                  </p>
                </div>

                <div className="card-brutal bg-white p-3.5 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center font-display font-extrabold text-[11px]">
                      02
                    </div>
                    <h4 className="font-display font-extrabold uppercase text-xs">Quick Questions Prepared</h4>
                  </div>
                  <p className="text-[11px] text-[#4B5563] pl-8">
                    Key questions and concepts are prepared directly from the source material.
                  </p>
                </div>

                <div className="card-brutal bg-white p-3.5 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center font-display font-extrabold text-[11px]">
                      03
                    </div>
                    <h4 className="font-display font-extrabold uppercase text-xs">Check Your Understanding</h4>
                  </div>
                  <p className="text-[11px] text-[#4B5563] pl-8">
                    Answer the questions and see helpful explanations based on the course material.
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Live Assessment Sample Card */}
            <div className="lg:col-span-7 card-brutal bg-white p-6 sm:p-8 space-y-6 shadow-brutal-xl">
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#111111]">
                <span className="badge-starburst badge-starburst-emerald text-xs">
                  ★ QUESTION 04 OF 10
                </span>
                <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded bg-[#061120] text-white">
                  SOURCE: IDQF 2024 (PAGE 17)
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-base sm:text-lg font-display font-bold text-[#111111] leading-snug">
                  According to MoSPI IDQF Section 2, what is the mandatory minimum k-anonymity threshold for public microdata dissemination?
                </p>

                <div className="space-y-2.5 text-xs font-sans font-medium">
                  <div className="p-3.5 rounded-xl border-2 border-[#111111] bg-emerald-50 text-emerald-900 font-bold flex items-center justify-between shadow-brutal-sm">
                    <span>A) k &ge; 5 with differential privacy noise addition</span>
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-[#111111] bg-white text-[#111111] font-bold flex items-center justify-between">
                    <span>B) k &ge; 2 with direct Aadhaar masking</span>
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-[#111111] bg-white text-[#111111] font-bold flex items-center justify-between">
                    <span>C) k &ge; 10 for all urban clusters</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-[#111111] flex items-center justify-between">
                <span className="text-xs font-mono text-[#0F766E] font-bold">
                  ✓ From Course Material
                </span>
                <Link href="/quiz" className="btn-brutal-primary !text-xs !py-2.5 !px-5">
                  <span>Try a Knowledge Check</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION: DEFEND YOUR DECISION (DEEP NAVY) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#0B1F3A] text-white border-b-2 border-[#111111]">
        <div className="max-w-[1360px] mx-auto space-y-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-white/20">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F2A900] block">
                STEP 05 &bull; DECISION PRACTICE
              </span>
              <h2 className="display-section text-white">
                PRACTICE REAL<br />
                DECISIONS.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-zinc-300 max-w-md leading-relaxed">
              Step into real-world policy situations. Consider different perspectives, spot reasoning flaws, and make your recommendation with confidence.
            </p>
          </div>

          {/* Scenario Banner */}
          <div className="p-6 rounded-2xl bg-[#061120] border-2 border-[#111111] shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="badge-starburst badge-starburst-saffron text-[10px]">
                  FEATURED SITUATION
                </span>
                <span className="text-xs font-mono text-amber-300 font-bold">POLICY SCENARIO</span>
              </div>
              <h3 className="text-lg sm:text-xl font-display font-extrabold text-white">
                &ldquo;Annual Survey of Unincorporated Enterprises budget reduced by 40%.&rdquo;
              </h3>
            </div>
            <Link href="/debate" className="btn-brutal-primary shrink-0">
              <Play className="w-4 h-4 fill-current" />
              <span>Practice a Scenario</span>
            </Link>
          </div>

          {/* 4 Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {debateAgents.map((agent, idx) => (
              <div 
                key={idx} 
                className={`bg-[#F8F7F2] text-[#111111] rounded-[24px] border-2 border-[#111111] shadow-brutal p-5 space-y-3 flex flex-col justify-between`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#111111] text-white">
                      {agent.badge}
                    </span>
                    <span className="text-[10px] font-mono text-[#0F766E] font-bold">
                      {agent.persona}
                    </span>
                  </div>

                  <h4 className="font-display font-extrabold text-base uppercase text-[#111111] leading-tight">
                    {agent.role}
                  </h4>

                  <p className="text-xs text-[#4B5563] italic leading-relaxed border-l-2 border-[#111111] pl-2.5">
                    &ldquo;{agent.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t-2 border-[#111111] text-[11px] font-mono text-[#111111]">
                  <strong>Perspective:</strong> {agent.stance}
                </div>
              </div>
            ))}
          </div>

          {/* Based on Trusted Sources Card */}
          <div className="bg-[#F8F7F2] text-[#111111] rounded-[24px] border-2 border-[#111111] shadow-brutal-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
              <div className="flex items-center gap-2">
                <span className="badge-starburst badge-starburst-emerald text-xs">
                  ★ TRUSTED SOURCES
                </span>
                <span className="text-sm font-display font-extrabold uppercase text-[#111111]">
                  Official Reference Guidelines
                </span>
              </div>
              <span className="text-xs font-mono text-[#4B5563]">
                Verified Information
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-4 bg-white rounded-xl border-2 border-[#111111] space-y-2 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-[#0F766E] font-bold font-mono">
                  <FileText className="w-4 h-4" />
                  <span>National Statistical Commission Guideline</span>
                </div>
                <p className="text-[#111111] leading-relaxed font-medium">
                  Guidelines on multi-stage sampling, confidence intervals, and field verification protocols for nationwide surveys.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border-2 border-[#111111] space-y-2 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-[#D97706] font-bold font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>India Data Quality Framework (IDQF) Standards</span>
                </div>
                <p className="text-[#111111] leading-relaxed font-medium">
                  Official standards governing respondent data protection, anonymization thresholds, and public dissemination.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION: YOUR GROWTH, MEASURED (WARM OFF-WHITE) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-[1360px] mx-auto">
        <div className="space-y-12">
          
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-[#111111]">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0F766E] block">
                STEP 06 &bull; YOUR PROGRESS
              </span>
              <h2 className="display-section text-[#111111]">
                YOUR GROWTH,<br />
                MEASURED.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#4B5563] max-w-md leading-relaxed">
              Track how your practical decision-making and policy understanding improve as you learn.
            </p>
          </div>

          {/* Progress Scorecard & Growth Journey Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Growth Journey Illustration Card */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-[#F8F7F2] text-[#111111] rounded-[28px] border-2 border-[#111111] shadow-brutal-xl p-6 sm:p-7 relative flex-1 flex flex-col justify-between space-y-4">
                
                {/* Floating Badges */}
                <div className="absolute -top-3 -right-2 z-20 badge-starburst badge-starburst-emerald text-[10px] rotate-2 shadow-brutal-sm">
                  ★ CAREER PROGRESSION
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F766E] block">
                    CONTINUOUS ADVANCEMENT
                  </span>
                  <h3 className="text-xl font-display font-black uppercase text-[#111111] leading-tight">
                    FROM LEARNER TO LEADER
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    Building your skills through recommended iGOT courses and policy practice scenarios supports your career growth.
                  </p>
                </div>

                {/* Illustration Frame */}
                <div className="w-full bg-white rounded-2xl border-2 border-[#111111] p-4 flex items-center justify-center overflow-hidden shadow-brutal-sm my-auto">
                  <img 
                    src="/images/growth-measured.jpg" 
                    alt="Neeti Saarthi Officer Growth Journey"
                    className="w-full max-h-[250px] object-contain rounded-xl"
                  />
                </div>

                {/* Footer Telemetry */}
                <div className="pt-3 border-t-2 border-[#111111] flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#111111]">Learning Progress</span>
                  <span className="text-[#0F766E] font-extrabold">● Active Public Servant</span>
                </div>

              </div>
            </div>

            {/* Right Column: Progress Scorecard Deep Navy Card */}
            <div className="lg:col-span-7 card-brutal-navy !bg-[#0B1F3A] !text-white p-7 sm:p-9 shadow-brutal-xl flex flex-col justify-between space-y-6">
              
              {/* Header Badge & Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="badge-starburst badge-starburst-saffron text-xs">
                    ★ PROGRESS OVERVIEW
                  </span>
                  <span className="text-xs font-mono text-zinc-300 font-bold">Official Standard</span>
                </div>
                <h3 className="display-subhead text-white uppercase text-xl sm:text-2xl">
                  DECISION READINESS SCORE
                </h3>
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="display-hero text-[#F2A900] leading-none text-5xl sm:text-6xl">
                    82
                  </span>
                  <span className="text-xl font-mono text-zinc-300 font-bold">/ 100</span>
                </div>
                <p className="text-xs text-zinc-200 font-medium max-w-md">
                  Based on your completed decision scenarios and knowledge checks.
                </p>
              </div>

              {/* Sub-Metrics 4-Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-white/10">
                <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-[#111111]">
                    <span>Evidence Evaluation</span>
                    <span className="text-sm font-display font-black text-[#0F766E]">78%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
                    <div className="h-full bg-[#0F766E]" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-[#111111]">
                    <span>Spotting Reasoning Flaws</span>
                    <span className="text-sm font-display font-black text-[#D97706]">91%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
                    <div className="h-full bg-[#F2A900]" style={{ width: '91%' }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-[#111111]">
                    <span>Decision Consistency</span>
                    <span className="text-sm font-display font-black text-[#0B1F3A]">84%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
                    <div className="h-full bg-[#0B1F3A]" style={{ width: '84%' }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-[#111111]">
                    <span>Policy Understanding</span>
                    <span className="text-sm font-display font-black text-[#C0392B]">76%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
                    <div className="h-full bg-[#C0392B]" style={{ width: '76%' }} />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Final Call to Action Poster */}
          <div className="bg-[#F2A900] text-[#111111] rounded-[28px] border-2 border-[#111111] shadow-brutal-xl p-8 sm:p-14 text-center space-y-6">
            <span className="badge-starburst badge-starburst-navy text-xs">
              ★ READY TO GET STARTED?
            </span>
            <h3 className="display-section text-[#111111] max-w-2xl mx-auto">
              BUILD YOUR SKILLS FOR PUBLIC SERVICE TODAY.
            </h3>
            <p className="text-base sm:text-lg text-zinc-900 font-medium max-w-xl mx-auto">
              Join public servants across departments discovering courses, building skills, and practicing real-world decisions on Neeti Saarthi.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="btn-brutal-navy !text-base !py-4 !px-9">
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-brutal-secondary !text-base !py-4 !px-8">
                <span>View My Profile</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default LandingShowcase;
