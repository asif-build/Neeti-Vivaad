'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, CheckCircle2, Search, Filter, Sparkles, 
  Award, Shield, Users, ArrowUpRight, ArrowRight, Download, RefreshCw, UserCheck
} from 'lucide-react';
import { authFetch } from '../../utils/api';

interface Candidate {
  id: number;
  name: string;
  email?: string;
  designation: string;
  department: string;
  experience: number;
  ctq_score: number;
  match_score: number;
  strengths: string[];
  gap_subskills: string[];
  status: string;
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
  const [candidatesPool, setCandidatesPool] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchCandidates = () => {
    setLoading(true);
    authFetch('/api/admin/candidates/')
      .then(res => res.json())
      .then(data => {
        if (data.candidates && Array.isArray(data.candidates)) {
          setCandidatesPool(data.candidates);
        } else {
          setCandidatesPool([]);
        }
      })
      .catch(() => {
        setCandidatesPool([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleAllocate = (candId: number) => {
    setAllocatedCandidates(prev => ({
      ...prev,
      [candId]: !prev[candId]
    }));
  };

  const activeVacancyObj = vacancies.find(v => v.id === selectedVacancy) || vacancies[0];

  const filteredCandidates = candidatesPool.filter(c => {
    if (candidateFilter === 'ALL') return true;
    if (candidateFilter === 'READY') return c.status === 'Ready for Deployment';
    if (candidateFilter === 'SHORTLISTED') return c.status === 'Shortlisted';
    if (candidateFilter === 'UPSKILLING') return c.status === 'Upskilling Required' || c.status === 'Onboarding Pending';
    if (candidateFilter === 'ALLOCATED') return allocatedCandidates[c.id];
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans selection:bg-[#3ecf8e] selection:text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ededed] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Role &amp; Cadre Matching</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#171717]">
            Role &amp; Cadre Matching
          </h1>
          <p className="text-xs sm:text-sm text-[#374151] font-medium mt-1 max-w-2xl">
            Match verified skills and decision readiness scores with open positions across government departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchCandidates}
            className="btn-secondary-outline px-4 py-2.5 text-xs font-mono flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Roster</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Vacancies + Right Candidate Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Priority Directorate Vacancies */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase text-[#111111] font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#3ecf8e]" /> OPEN CADRE VACANCIES
            </h2>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {vacancies.reduce((a, b) => a + b.open_positions, 0)} Total Seats
            </span>
          </div>

          <div className="space-y-3">
            {vacancies.map(v => {
              const isSelected = selectedVacancy === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVacancy(v.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#3ecf8e] bg-[#fafafa] shadow-xs' 
                      : 'border-[#dfdfdf] bg-white hover:border-[#c7c7c7]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {v.id} &bull; {v.open_positions} Open Seats
                    </span>
                    <span className="text-[11px] font-mono text-[#374151] font-bold">Req CTQ: {v.required_ctq}+</span>
                  </div>

                  <h3 className="font-semibold text-sm text-[#171717]">{v.role_title}</h3>
                  <p className="text-xs font-mono text-[#374151] font-medium mt-0.5">{v.department}</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-[#ededed] flex items-center justify-between text-[11px] text-[#374151] font-medium">
                    <span className="truncate pr-2">Core: {v.key_competency}</span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#3ecf8e]' : 'text-zinc-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Candidate Pool & Allocation */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="card-supa-light p-5 rounded-xl border border-[#dfdfdf] bg-[#fafafa] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-[#111111] font-bold block">ACTIVE BENCHMARK TARGET</span>
              <h3 className="font-semibold text-base text-[#171717] mt-0.5">{activeVacancyObj.role_title}</h3>
              <p className="text-xs text-[#374151] font-medium mt-0.5">
                Target Competency: <strong className="text-[#171717]">{activeVacancyObj.key_competency}</strong>
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'ALL', label: 'All Candidates' },
                { key: 'READY', label: 'Deployment Ready' },
                { key: 'ALLOCATED', label: 'Allocated' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setCandidateFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    candidateFilter === f.key
                      ? 'bg-[#171717] text-white font-medium'
                      : 'bg-white border border-[#dfdfdf] text-[#111111] font-bold hover:text-[#000000]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Candidates List */}
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-[#374151] font-medium border border-dashed border-[#dfdfdf] rounded-xl">
              Loading verified official candidate pool from PostgreSQL...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-12 text-center space-y-3 border border-dashed border-[#dfdfdf] rounded-xl bg-[#fafafa]">
              <Users className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-semibold text-[#171717]">No Candidates Found in This Filter</h4>
              <p className="text-xs text-[#374151] font-medium max-w-md mx-auto">
                Candidates appear dynamically as official accounts register, verify credentials, and complete onboarding.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCandidates.map(cand => {
                const isAllocated = !!allocatedCandidates[cand.id];
                return (
                  <div
                    key={cand.id}
                    className={`card-supa-light p-5 rounded-xl border transition-all space-y-4 ${
                      isAllocated
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-[#dfdfdf] bg-white hover:border-[#c7c7c7]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-bold text-sm">
                          {cand.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base text-[#171717]">{cand.name}</h4>
                            {isAllocated ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold">
                                <UserCheck className="w-3 h-3" /> Allocated to Seat
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                cand.status === 'Ready for Deployment'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {cand.status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#374151] font-medium mt-0.5">
                            {cand.designation} &bull; {cand.department} &bull; {cand.experience} Yrs Exp
                          </p>
                        </div>
                      </div>

                      {/* CTQ & Match Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-mono uppercase text-[#374151] font-bold block">CTQ RATING</span>
                          <span className="font-mono font-bold text-sm text-[#171717]">{cand.ctq_score} / 100</span>
                        </div>
                        <div className="text-right pl-3 border-l border-[#ededed]">
                          <span className="text-[10px] font-mono uppercase text-[#374151] font-bold block">CADRE MATCH</span>
                          <span className="font-mono font-bold text-sm text-emerald-700">{cand.match_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#ededed] text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-[#374151] font-bold uppercase block mb-1">Demonstrated Strengths</span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.strengths.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-[#fafafa] border border-[#dfdfdf] text-[11px] text-[#171717]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-[#374151] font-bold uppercase block mb-1">Identified Focus Gaps</span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.gap_subskills.length > 0 ? (
                            cand.gap_subskills.map((g, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-mono">
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-mono">Zero Critical Gaps</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#ededed]">
                      <button
                        type="button"
                        onClick={() => handleAllocate(cand.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isAllocated
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'btn-primary-green'
                        }`}
                      >
                        {isAllocated ? (
                          <>
                            <span>Revoke Allocation</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Allocate to {activeVacancyObj.id}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
