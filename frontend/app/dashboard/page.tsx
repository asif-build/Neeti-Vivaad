'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { 
  Award, AlertTriangle, BookOpen, MessageSquare, 
  Sparkles, ArrowUpRight, TrendingUp, CheckCircle2, UserCheck
} from 'lucide-react';

export default function LearnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/learner/')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({
          user: {
            first_name: 'Rajesh',
            last_name: 'Kumar',
            designation: 'Senior Statistical Officer',
            department: 'NSO Field Operations Division',
            ctq_score: 82.5,
            experience_years: 7,
            education: 'M.Sc. Mathematical Statistics'
          },
          domain_scores: [
            { domain_name: 'Statistical Methodology', average_score: 58.3 },
            { domain_name: 'Technical & Tools', average_score: 60.0 },
            { domain_name: 'Digital Governance', average_score: 46.0 },
            { domain_name: 'Behavioural & Decision', average_score: 73.5 }
          ],
          top_gaps: [
            { subskill_name: 'Digital k-Anonymity & Privacy', domain_name: 'Digital Governance', current_score: 42, target_score: 85, gap: 43, priority: 'HIGH' },
            { subskill_name: 'High-Frequency Survey Design', domain_name: 'Statistical Methodology', current_score: 45, target_score: 80, gap: 35, priority: 'HIGH' },
            { subskill_name: 'NDSAP Compliance & Data Sharing', domain_name: 'Digital Governance', current_score: 50, target_score: 90, gap: 40, priority: 'HIGH' },
            { subskill_name: 'SQL Data Analysis & Wrangling', domain_name: 'Technical Tools', current_score: 52, target_score: 85, gap: 33, priority: 'HIGH' }
          ],
          recommended_courses: [
            { id: 1, title: 'Digital Data Privacy, NDSAP Guidelines & k-Anonymity Standards', provider: 'iGOT Karmayogi / MeitY', match_percentage: 97.5, duration_hours: 4.5, difficulty: 'Intermediate' },
            { id: 2, title: 'Advanced Sampling Design & Multi-Stage Estimation', provider: 'iGOT Karmayogi / NSO Academy', match_percentage: 94.0, duration_hours: 6.0, difficulty: 'Advanced' }
          ]
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[#171717] font-mono text-xs">
        Loading Official Competency Profile...
      </div>
    );
  }

  const radarData = data.domain_scores.map((d: any) => ({
    domain: d.domain_name.replace(' & Decision Making', '').replace(' Methodology', ''),
    score: d.average_score,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Official Profile Banner */}
      <div className="card-supa-light flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[8px] bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-medium text-xl">
            {data.user.first_name[0]}{data.user.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium text-[#171717] tracking-tight">
                {data.user.first_name} {data.user.last_name}
              </h1>
              <span className="pill-tag-emerald">
                <CheckCircle2 className="w-3.5 h-3.5" /> Official Profile Verified
              </span>
            </div>
            <p className="text-xs font-mono text-[#707070] mt-1">
              {data.user.designation} · {data.user.department}
            </p>
            <p className="text-xs text-[#707070] mt-0.5">
              Exp: {data.user.experience_years} Years · Edu: {data.user.education}
            </p>
          </div>
        </div>

        {/* CTQ Score Badge */}
        <div className="p-4 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] flex items-center gap-4 min-w-[240px]">
          <div className="p-2.5 rounded-[6px] bg-[#171717] text-[#3ecf8e]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-[#707070] block font-normal">
              Critical Thinking Quotient
            </span>
            <div className="text-2xl font-medium text-[#171717] flex items-baseline gap-1">
              {data.user.ctq_score} <span className="text-xs text-[#707070] font-normal">/ 100</span>
            </div>
            <span className="text-[11px] text-[#24b47e] font-mono flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +5 pts from Fallacy Spotting
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Competency Radar + Top Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Radar Chart */}
        <div className="lg:col-span-6 card-supa-light space-y-4">
          <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
            <h2 className="text-xs font-mono uppercase text-[#707070] font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3ecf8e]" /> COMPETENCY DOMAIN LEVELS
            </h2>
            <span className="text-[11px] font-mono text-[#9a9a9a]">TARGET: 80+</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#dfdfdf" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: '#707070', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#dfdfdf" />
                <Radar name="Rajesh Kumar" dataKey="score" stroke="#3ecf8e" fill="#3ecf8e" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Skill Gaps List */}
        <div className="lg:col-span-6 card-supa-light space-y-4">
          <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
            <h2 className="text-xs font-mono uppercase text-[#171717] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> TOP IDENTIFIED SKILL GAPS
            </h2>
            <span className="text-[11px] font-mono text-[#9a9a9a]">FAISS AUTO-ENGINE</span>
          </div>

          <div className="space-y-3">
            {data.top_gaps.map((gap: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] hover:border-[#c7c7c7] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#707070]">{gap.domain_name}</span>
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase bg-rose-50 border border-rose-200 text-rose-600 font-medium">
                    Gap: -{gap.gap} pts
                  </span>
                </div>
                <h4 className="font-medium text-[#171717] text-sm">{gap.subskill_name}</h4>
                
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1 bg-[#dfdfdf] h-1.5 rounded-full overflow-hidden relative">
                    <div 
                      className="bg-[#3ecf8e] h-full rounded-full" 
                      style={{ width: `${gap.current_score}%` }} 
                    />
                  </div>
                  <span className="text-xs font-mono text-[#707070]">
                    {gap.current_score} / {gap.target_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recommended iGOT Courses */}
      <div className="card-supa-light space-y-6">
        <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
          <div>
            <h2 className="text-xs font-mono uppercase text-[#707070] font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3ecf8e]" /> RECOMMENDED iGOT KARMAYOGI COURSES
            </h2>
            <h3 className="text-[22px] font-medium text-[#171717] tracking-tight mt-1">
              Semantically Matched to Identified Skill Gaps via FAISS
            </h3>
          </div>
          <Link href="/courses" className="text-xs font-mono text-[#171717] hover:text-[#3ecf8e] flex items-center gap-1 font-medium">
            View All Courses <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommended_courses.map((c: any) => (
            <div key={c.id} className="p-5 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] hover:border-[#c7c7c7] transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="pill-tag-emerald">
                  {c.match_percentage}% FAISS Match
                </span>
                <span className="text-[11px] font-mono text-[#707070]">{c.duration_hours} Hrs · {c.difficulty}</span>
              </div>
              <h3 className="font-medium text-[#171717] text-base leading-snug">{c.title}</h3>
              <p className="text-xs font-mono text-[#707070]">{c.provider}</p>
              <div className="pt-2 border-t border-[#ededed] flex items-center justify-between">
                <a 
                  href="https://igotkarmayogi.gov.in/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-mono text-[#171717] hover:text-[#3ecf8e] flex items-center gap-1 font-medium"
                >
                  Start on iGOT Portal <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
