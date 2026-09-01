'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { 
  Award, AlertTriangle, BookOpen, Sparkles, 
  ArrowUpRight, TrendingUp, CheckCircle2, ArrowRight, UserCheck
} from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/api';

export default function LearnerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchDashboard = () => {
      setLoading(true);
      setError(null);
      authFetch('/api/dashboard/learner/')
        .then(async res => {
          if (res.status === 401 || res.status === 403) {
            router.push('/login');
            return;
          }
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData.error || errData.message || `Server responded with ${res.status}: ${res.statusText}`;
            console.error(`[Dashboard API Error] Status: ${res.status}, Endpoint: /api/dashboard/learner/, Message:`, msg);
            throw new Error(msg);
          }
          return res.json();
        })
        .then(d => {
          if (d) {
            setData(d);
          }
        })
        .catch(err => {
          console.error('[Dashboard Error]:', err);
          setError(err.message || 'Error loading dashboard.');
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[#171717] font-mono text-xs">
        Loading Official Competency Profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-[#171717] font-sans p-6 space-y-4">
        <div className="text-sm font-medium text-rose-600">{error || 'Unable to load profile data.'}</div>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="px-4 py-2 border border-[#dfdfdf] rounded text-xs hover:border-[#171717]">
            Retry
          </button>
          <Link href="/login" className="btn-primary-green px-4 py-2 text-xs">
            Sign In Again
          </Link>
        </div>
      </div>
    );
  }

  const { user, profile_complete, baseline_completed, domain_scores, top_gaps, recommended_courses } = data;
  const userFullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const userInitials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || user.username?.[0] || 'O'}`.toUpperCase();

  const radarData = (domain_scores || []).map((d: any) => ({
    domain: d.domain_name.replace(' & Decision Making', '').replace(' Methodology', '').replace(' & Data Science', ''),
    score: d.average_score,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Onboarding / Baseline Required Alert if Incomplete */}
      {(!profile_complete || !baseline_completed) && (
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Baseline Competency Assessment Pending</span>
            </div>
            <p className="text-xs text-amber-800">
              Complete your baseline assessment to evaluate your real proficiencies across Statistical, Technical, Digital Governance, and Behavioural domains, and unlock AI course recommendations.
            </p>
          </div>
          <Link
            href="/candidate/onboarding"
            className="btn-primary-green px-4 py-2 text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <span>Complete Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Official Profile Banner */}
      <div className="card-supa-light flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-xl border border-[#dfdfdf] bg-[#fafafa]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[8px] bg-[#171717] text-[#3ecf8e] flex items-center justify-center font-medium text-xl shadow-xs">
            {userInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium text-[#171717] tracking-tight">
                {userFullName}
              </h1>
              {baseline_completed ? (
                <span className="pill-tag-emerald">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Official Profile Verified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800 font-medium">
                  Baseline Pending
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#707070] mt-1">
              {user.designation || 'Government Official'} {user.department ? `· ${user.department}` : ''} {user.organisation ? `(${user.organisation})` : ''}
            </p>
            <p className="text-xs text-[#707070] mt-0.5">
              Exp: {user.experience_years || 0} Years {user.education ? `· Edu: ${user.education}` : ''}
            </p>
          </div>
        </div>

        {/* CTQ Score Badge */}
        <div className="p-4 rounded-[8px] bg-white border border-[#dfdfdf] flex items-center gap-4 min-w-[240px] shadow-xs">
          <div className="p-2.5 rounded-[6px] bg-[#171717] text-[#3ecf8e]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-[#707070] block font-normal">
              Critical Thinking Quotient
            </span>
            <div className="text-2xl font-medium text-[#171717] flex items-baseline gap-1">
              {user.ctq_score} <span className="text-xs text-[#707070] font-normal">/ 100</span>
            </div>
            <span className="text-[11px] text-[#24b47e] font-mono flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Dynamic CTQ Score
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Competency Radar + Top Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Radar Chart */}
        <div className="lg:col-span-6 card-supa-light space-y-4 p-6 rounded-xl border border-[#dfdfdf] bg-white">
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
                <Radar name={userFullName} dataKey="score" stroke="#3ecf8e" fill="#3ecf8e" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Skill Gaps List */}
        <div className="lg:col-span-6 card-supa-light space-y-4 p-6 rounded-xl border border-[#dfdfdf] bg-white">
          <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
            <h2 className="text-xs font-mono uppercase text-[#171717] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> IDENTIFIED SKILL GAPS
            </h2>
            <span className="text-[11px] font-mono text-[#9a9a9a]">ROLE COMPARISON</span>
          </div>

          {top_gaps && top_gaps.length > 0 ? (
            <div className="space-y-3">
              {top_gaps.map((gap: any, idx: number) => (
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
          ) : (
            <div className="p-8 text-center space-y-3 bg-[#fafafa] rounded-lg border border-dashed border-[#dfdfdf]">
              <p className="text-xs text-[#707070]">
                {baseline_completed
                  ? 'Excellent! No high-priority skill gaps identified for your current role targets.'
                  : 'Take the baseline assessment to identify your personalized skill gaps.'}
              </p>
              {!baseline_completed && (
                <Link href="/candidate/onboarding" className="inline-flex btn-primary-green px-4 py-2 text-xs">
                  Start Baseline Assessment
                </Link>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Recommended iGOT Courses */}
      <div className="card-supa-light space-y-6 p-6 rounded-xl border border-[#dfdfdf] bg-white">
        <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
          <div>
            <h2 className="text-xs font-mono uppercase text-[#707070] font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3ecf8e]" /> RECOMMENDED iGOT KARMAYOGI COURSES
            </h2>
            <h3 className="text-[22px] font-medium text-[#171717] tracking-tight mt-1">
              Personalized Recommendations for Your Skill Gaps
            </h3>
          </div>
          <Link href="/courses" className="text-xs font-mono text-[#171717] hover:text-[#3ecf8e] flex items-center gap-1 font-medium">
            View All Courses <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommended_courses && recommended_courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommended_courses.map((c: any) => (
              <div key={c.id} className="p-5 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf] hover:border-[#c7c7c7] transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="pill-tag-emerald">
                    {c.match_percentage}% Semantic Match
                  </span>
                  <span className="text-[11px] font-mono text-[#707070]">{c.duration_hours} Hrs · {c.difficulty}</span>
                </div>
                <h3 className="font-medium text-[#171717] text-base leading-snug">{c.title}</h3>
                <p className="text-xs font-mono text-[#707070]">{c.provider}</p>
                <div className="pt-2 border-t border-[#ededed] flex items-center justify-between">
                  <a 
                    href={c.url || "https://igotkarmayogi.gov.in/"} 
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
        ) : (
          <div className="text-center py-8 text-xs text-[#707070]">
            Complete your profile and baseline test to generate targeted iGOT course recommendations.
          </div>
        )}
      </div>

    </div>
  );
}
