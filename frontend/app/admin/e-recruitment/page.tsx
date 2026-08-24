'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, CheckCircle2, Search, Filter, Sparkles, 
  Award, Shield, Users, ArrowUpRight, ArrowRight, Download, RefreshCw
} from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  designation: string;
  department: string;
  experience: number;
  ctq_score: number;
  match_score: number;
  strengths: string[];
  gap_subskills: string[];
  status: 'Ready for Deployment' | 'Upskilling Required' | 'Shortlisted' | 'Allocated';
}

interface Vacancy {
  id: string;
  role_title: string;
  department: string;
  required_ctq: number;
  open_positions: number;
  key_competency: string;
  target_domains: string[];
}

export default function ERecruitmentPage() {
  const [selectedVacancy, setSelectedVacancy] = useState<string>('VAC-01');
  const [candidateFilter, setCandidateFilter] = useState<string>('ALL');
  const [allocatedCandidates, setAllocatedCandidates] = useState<Record<number, boolean>>({});

  const vacancies: Vacancy[] = [
    {
      id: 'VAC-01',
      role_title: 'Senior Statistical Analyst (National Surveys)',
      department: 'NSO Field Operations Division',
      required_ctq: 80,
      open_positions: 2,
      key_competency: 'Multi-Stage Sampling & CAPI Verification',
      target_domains: ['Statistical Methodology', 'Technical & Tools']
    },
    {
      id: 'VAC-02',
      role_title: 'Digital Data Governance & Privacy Lead',
      department: 'Survey Design & Research Division',
      required_ctq: 85,
      open_positions: 1,
      key_competency: 'NDSAP Compliance & Microdata k-Anonymity',
      target_domains: ['Digital Governance', 'Behavioural']
    },
    {
      id: 'VAC-03',
      role_title: 'Econometric Modeling & Anomaly Specialist',
      department: 'Economic Statistics Division',
      required_ctq: 82,
      open_positions: 3,
      key_competency: 'Python/R Modeling & SQL Data Wrangling',
      target_domains: ['Technical & Tools', 'Statistical Methodology']
    }
  ];

  const candidatesPool: Candidate[] = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      designation: 'Senior Statistical Officer',
      department: 'NSO Field Operations Division',
      experience: 7,
      ctq_score: 82.5,
      match_score: 91.2,
      strengths: ['Field Leadership', 'CAPI Survey Protocols', 'Policy Fallacy Detection'],
      gap_subskills: ['Digital k-Anonymity (-43 pts)'],
      status: 'Ready for Deployment'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      designation: 'Assistant Director (Statistics)',
      department: 'Survey Design & Research Division',
      experience: 9,
      ctq_score: 89.0,
      match_score: 94.8,
      strengths: ['Multi-Stage Sampling', 'IDQF 2024 Standards', 'Critical Policy Synthesis'],
      gap_subskills: ['SQL Analytical Window Functions (-12 pts)'],
      status: 'Shortlisted'
    },
    {
      id: 3,
      name: 'Ananya Sen',
      designation: 'Junior Statistical Officer',
      department: 'Economic Statistics Division',
      experience: 4,
      ctq_score: 79.0,
      match_score: 84.5,
      strengths: ['Python Statistical Modeling', 'High-Frequency Survey Execution'],
      gap_subskills: ['NDSAP Microdata Privacy Rules (-28 pts)'],
      status: 'Ready for Deployment'
    },
    {
      id: 4,
      name: 'Vikramaditya Singh',
      designation: 'Statistical Investigator (Gr. I)',
      department: 'National Accounts Division',
      experience: 6,
      ctq_score: 84.0,
      match_score: 88.0,
      strengths: ['National Accounts Estimation', 'Microdata Anomaly Detection'],
      gap_subskills: ['Digital Survey CAPI Entry (-18 pts)'],
      status: 'Shortlisted'
    },
    {
      id: 5,
      name: 'Amit Verma',
      designation: 'Field Supervisor',
      department: 'NSO Field Operations Division',
      experience: 8,
      ctq_score: 77.5,
      match_score: 72.0,
      strengths: ['Block Verification', 'Enumerator Training'],
      gap_subskills: ['Python/R Modeling (-35 pts)', 'NDSAP Sharing (-30 pts)'],
      status: 'Upskilling Required'
    },
    {
      id: 6,
      name: 'Sunita Rao',
      designation: 'Senior Statistical Officer',
      department: 'Survey Design & Research Division',
      experience: 11,
      ctq_score: 91.0,
      match_score: 96.0,
      strengths: ['Survey Sampling Design', 'Policy Debate Champion', 'Data Quality Framework'],
      gap_subskills: [],
      status: 'Ready for Deployment'
    }
  ];

  const handleAllocate = (candId: number) => {
    setAllocatedCandidates(prev => ({
      ...prev,
      [candId]: !prev[candId]
    }));
  };

  const activeVacancyObj = vacancies.find(v => v.id === selectedVacancy) || vacancies[0];
  const filteredCandidates = candidatesPool.filter(c => {
    if (candidateFilter === 'ALL') return true;
    if (candidateFilter === 'READY') return c.status === 'Ready for Deployment' || c.status === 'Shortlisted';
    if (candidateFilter === 'UPSKILLING') return c.status === 'Upskilling Required';
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ededed] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AI-Driven Workforce Allocation Engine</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#171717]">e-Recruitment &amp; Placement</h1>
          <p className="text-sm text-[#707070] mt-1 font-normal">
            Automated candidate-to-vacancy matching based on verified competency benchmarks, CTQ scores, and debate judgments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/workforce-insights"
            className="px-3.5 py-2 rounded-[6px] border border-[#dfdfdf] hover:bg-[#fafafa] text-xs font-medium text-[#171717] transition-colors"
          >
            Workforce Insights
          </Link>
          <Link
            href="/admin-dashboard"
            className="btn-primary-green text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <span>Admin Heatmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Vacancy Selector */}
      <div className="card-supa-light space-y-6 shadow-sm p-6">
        <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[#171717]">Strategic Ministry Vacancies</h2>
            <p className="text-xs text-[#707070]">Select a high-priority vacancy to inspect AI candidate suitability rankings</p>
          </div>
          <span className="text-xs font-mono text-[#707070]">3 Active Postings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vacancies.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVacancy(v.id)}
              className={`p-4 rounded-[8px] text-left transition-all border ${
                selectedVacancy === v.id
                  ? 'border-[#3ecf8e] bg-emerald-50/40 ring-2 ring-[#3ecf8e]/20 shadow-xs'
                  : 'border-[#ededed] bg-[#fafafa] hover:border-[#dfdfdf]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-[#dfdfdf] text-[#707070]">
                  {v.id}
                </span>
                <span className="text-xs font-mono font-medium text-emerald-700">
                  {v.open_positions} Open Seats
                </span>
              </div>
              <h4 className="font-semibold text-sm text-[#171717] leading-snug">{v.role_title}</h4>
              <p className="text-[11px] text-[#707070] mt-1">{v.department}</p>
              <div className="mt-3 pt-2 border-t border-[#ededed] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#707070]">Req. CTQ: <strong>{v.required_ctq}+</strong></span>
                <span className="text-[#24b47e] font-semibold">{v.key_competency.split('&')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Pool Roster */}
      <div className="card-supa-light space-y-6 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ededed] pb-4">
          <div>
            <span className="text-xs font-mono uppercase text-[#707070] block">Target Role Candidate Match</span>
            <h3 className="text-lg font-semibold text-[#171717]">{activeVacancyObj.role_title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCandidateFilter('ALL')}
              className={`px-3 py-1 rounded-[6px] text-xs font-mono transition-colors ${
                candidateFilter === 'ALL' ? 'bg-[#171717] text-white' : 'bg-[#fafafa] border border-[#dfdfdf] text-[#707070]'
              }`}
            >
              All Officials ({candidatesPool.length})
            </button>
            <button
              onClick={() => setCandidateFilter('READY')}
              className={`px-3 py-1 rounded-[6px] text-xs font-mono transition-colors ${
                candidateFilter === 'READY' ? 'bg-emerald-600 text-white' : 'bg-[#fafafa] border border-[#dfdfdf] text-[#707070]'
              }`}
            >
              Ready / Shortlisted
            </button>
            <button
              onClick={() => setCandidateFilter('UPSKILLING')}
              className={`px-3 py-1 rounded-[6px] text-xs font-mono transition-colors ${
                candidateFilter === 'UPSKILLING' ? 'bg-amber-600 text-white' : 'bg-[#fafafa] border border-[#dfdfdf] text-[#707070]'
              }`}
            >
              Upskilling Needed
            </button>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCandidates.map((c) => {
            const isAllocated = allocatedCandidates[c.id];
            return (
              <div
                key={c.id}
                className={`p-5 rounded-[8px] border transition-all space-y-4 ${
                  isAllocated
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-[#ededed] bg-[#fafafa] hover:border-[#dfdfdf]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-bold text-sm">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#171717]">{c.name}</h4>
                      <p className="text-[11px] text-[#707070]">{c.designation} · {c.experience} yrs exp</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#24b47e]">
                      {c.match_score}% Match
                    </div>
                    <span className="text-[10px] font-mono text-[#707070]">
                      CTQ: {c.ctq_score}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-[#707070] text-[11px]">
                    Department: <strong className="text-[#171717]">{c.department}</strong>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.strengths.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white border border-[#dfdfdf] text-[10px] text-emerald-800 font-medium">
                        ✓ {s}
                      </span>
                    ))}
                  </div>

                  {c.gap_subskills.length > 0 && (
                    <div className="pt-1 text-[11px] text-rose-700 font-mono">
                      Gap: {c.gap_subskills.join(', ')}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#ededed] flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-semibold ${
                    c.status === 'Ready for Deployment' ? 'text-emerald-700' :
                    c.status === 'Shortlisted' ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {isAllocated ? '✅ Role Allocated' : c.status}
                  </span>

                  <button
                    onClick={() => handleAllocate(c.id)}
                    className={`px-3 py-1 rounded-[4px] text-xs font-mono font-medium transition-all ${
                      isAllocated
                        ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                        : 'bg-[#171717] text-white hover:bg-[#3ecf8e] hover:text-[#171717]'
                    }`}
                  >
                    {isAllocated ? 'Revoke Allocation' : 'Allocate to Role'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
