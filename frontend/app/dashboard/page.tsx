'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { 
  Award, AlertTriangle, BookOpen, Sparkles, 
  ArrowUpRight, TrendingUp, CheckCircle2, ArrowRight, UserCheck,
  Shield, MessageSquare, Play, RefreshCcw, ExternalLink
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8F7F2] text-[#111111] font-mono text-xs space-y-3">
        <span className="badge-starburst badge-starburst-saffron animate-pulse">
          ★ LOADING YOUR LEARNING PROFILE
        </span>
        <p className="text-[#4B5563]">Finding your skills and recommended courses...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8F7F2] text-[#111111] p-6 space-y-4">
        <div className="card-brutal bg-white p-6 max-w-md text-center space-y-3">
          <span className="badge-starburst badge-starburst-saffron text-xs">
            ★ PROFILE NOTICE
          </span>
          <p className="text-sm font-display font-bold text-rose-600">
            We couldn't load your dashboard right now. Please try again.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => window.location.reload()} className="btn-brutal-secondary !text-xs !py-2 !px-4">
              Try Again
            </button>
            <Link href="/login" className="btn-brutal-primary !text-xs !py-2 !px-4">
              Sign In Again
            </Link>
          </div>
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
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-10 font-sans">
      
      {/* Onboarding / Baseline Required Alert if Incomplete */}
      {(!profile_complete || !baseline_completed) && (
        <div className="card-brutal bg-[#FEF3C7] border-2 border-[#111111] shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-950 font-display font-extrabold text-base uppercase">
              <Sparkles className="w-5 h-5 text-[#F2A900]" />
              <span>Complete Your Profile Setup</span>
            </div>
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              Complete your initial profile setup to view your skills, explore personalized iGOT course recommendations, and practice policy decision scenarios.
            </p>
          </div>
          <Link
            href="/candidate/onboarding"
            className="btn-brutal-primary shrink-0 !text-xs !py-2.5 !px-5"
          >
            <span>Set Up Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Official Officer Header */}
      <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-brutal-lg">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#F2A900] text-[#111111] border-2 border-[#111111] shadow-brutal-sm flex items-center justify-center font-display font-black text-2xl shrink-0">
            {userInitials}
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F2A900] block">
              Good day, {user.first_name || userFullName} &bull; Here&apos;s where you stand
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-white tracking-tight">
                {userFullName}
              </h1>
              {baseline_completed ? (
                <span className="badge-starburst badge-starburst-emerald text-[10px]">
                  ★ PROFILE READY
                </span>
              ) : (
                <span className="badge-starburst badge-starburst-saffron text-[10px]">
                  ★ SETUP PENDING
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-zinc-200 font-medium">
              {user.designation || 'Statistical Officer'} &bull; {user.department || 'Ministry of Statistics & Programme Implementation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/quiz" className="btn-brutal-primary !text-xs !py-2 !px-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Check</span>
          </Link>
          <Link href="/debate" className="btn-brutal-secondary !text-xs !py-2 !px-4">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Neeti Vivaad</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: YOUR SKILL SNAPSHOT (Radar & Domain Metrics) */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0F766E] block">
              OVERVIEW
            </span>
            <h2 className="display-subhead text-[#111111] uppercase">
              YOUR SKILLS
            </h2>
          </div>
          <span className="text-xs font-mono text-[#4B5563] hidden sm:inline-block">
            Skills from your profile and learning activity
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Radar Visualization Card */}
          <div className="lg:col-span-6 card-brutal bg-white p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
              <span className="badge-starburst badge-starburst-emerald text-xs">
                ★ YOUR SKILL PROFILE
              </span>
              <span className="text-xs font-mono text-[#4B5563]">
                Proficiency Level (0-100)
              </span>
            </div>

            <div className="w-full h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#111111" strokeWidth={1.5} strokeDasharray="4 4" />
                  <PolarAngleAxis 
                    dataKey="domain" 
                    tick={{ fill: '#111111', fontSize: 10, fontWeight: 800, fontFamily: 'Space Grotesk' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar 
                    name="Competency" 
                    dataKey="score" 
                    stroke="#0F766E" 
                    fill="#0F766E" 
                    fillOpacity={0.45} 
                    strokeWidth={2.5} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Domain Breakdown Panels */}
          <div className="lg:col-span-6 space-y-3.5">
            {(domain_scores || []).map((dom: any, idx: number) => {
              const score = dom.average_score || 0;
              const statusLabel = score >= 80 ? 'Strong' : (score >= 60 ? 'Growing' : 'Needs Practice');
              return (
                <div key={idx} className="card-brutal bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-display font-bold uppercase text-[#111111]">
                      {dom.domain_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#0F766E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {statusLabel}
                      </span>
                      <span className="text-base font-display font-black text-[#0F766E]">
                        {score}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-[#E5E4DE] rounded-full border border-[#111111] overflow-hidden">
                    <div 
                      className="h-full bg-[#0F766E] rounded-full transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: AREAS TO GROW (Skills to improve) */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C0392B] block">
              AREAS TO GROW
            </span>
            <h2 className="display-subhead text-[#111111] uppercase">
              SKILLS TO IMPROVE
            </h2>
          </div>
          <span className="text-xs font-mono text-[#4B5563] hidden sm:inline-block">
            Recommended focus areas for your role
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(top_gaps || []).length > 0 ? (
            top_gaps.map((gap: any, idx: number) => (
              <div 
                key={idx} 
                className="card-brutal bg-white p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="badge-starburst badge-starburst-saffron text-[10px]">
                      ★ FOCUS AREA
                    </span>
                    <span className="text-xs font-mono font-bold text-[#C0392B]">
                      Needs Practice
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold uppercase text-base text-[#111111]">
                    {gap.skill_name}
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    Building this skill will help you perform more effectively in your role and related policy assignments.
                  </p>
                </div>

                <Link 
                  href="/courses" 
                  className="btn-brutal-primary !text-xs !py-2 flex items-center justify-between"
                >
                  <span>Find Courses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full card-brutal bg-emerald-50 text-emerald-950 p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#0F766E] mx-auto" />
              <h4 className="font-display font-bold uppercase text-base">Your Skills Are in Great Shape</h4>
              <p className="text-xs text-emerald-800">You are meeting all core requirements for your current role. Keep exploring courses to stay ahead.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: RECOMMENDED COURSES */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0F766E] block">
              RECOMMENDED FOR YOU
            </span>
            <h2 className="display-subhead text-[#111111] uppercase">
              COURSES FOR YOU
            </h2>
          </div>
          <Link href="/courses" className="text-xs font-mono text-[#0F766E] font-bold flex items-center gap-1 hover:underline">
            <span>Browse All Courses</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(recommended_courses || []).slice(0, 3).map((course: any, idx: number) => {
            const rawScore = course.match_score || 94;
            const matchLabel = rawScore >= 85 ? 'Excellent Match' : 'Good Match';
            return (
              <div key={idx} className="card-brutal bg-white p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="badge-starburst badge-starburst-emerald text-[10px]">
                      ★ {matchLabel}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-[#111111] text-white px-2 py-0.5 rounded">
                      iGOT KARMAYOGI
                    </span>
                  </div>

                  <h4 className="font-display font-extrabold uppercase text-base text-[#111111] leading-tight">
                    {course.title}
                  </h4>

                  <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2">
                    {course.description || 'Verified course aligned with official government learning guidelines.'}
                  </p>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                    <strong className="block font-bold">Why this course?</strong>
                    <span>Builds key competencies needed for your department and role.</span>
                  </div>
                </div>

                <Link 
                  href="/courses" 
                  className="btn-brutal-emerald !text-xs !py-2.5 flex items-center justify-between"
                >
                  <span>View Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: DECISION PRACTICE (Neeti Vivaad) */}
      {/* ========================================================================= */}
      <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-8 sm:p-10 shadow-brutal-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-3">
          <span className="badge-starburst badge-starburst-saffron text-xs">
            ★ DECISION PRACTICE
          </span>
          <h3 className="display-subhead text-white uppercase">
            DECISION READINESS SCORE
          </h3>
          <div className="flex items-baseline gap-3 pt-1">
            <span className="display-hero text-[#F2A900] leading-none">
              82
            </span>
            <span className="text-lg font-mono text-zinc-300 font-bold">/ 100</span>
          </div>
          <p className="text-xs text-zinc-200 font-medium">
            Practice real policy situations from 4 different viewpoints to improve your decision-making and reasoning skills.
          </p>
          <div className="pt-2">
            <Link href="/debate" className="btn-brutal-primary !text-xs !py-2.5 !px-5">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Decision Making</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#111111]">
              <span>Evidence Evaluation</span>
              <span className="text-sm font-display font-black text-[#0F766E]">78%</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
              <div className="h-full bg-[#0F766E]" style={{ width: '78%' }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#111111]">
              <span>Spotting Reasoning Flaws</span>
              <span className="text-sm font-display font-black text-[#D97706]">91%</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
              <div className="h-full bg-[#F2A900]" style={{ width: '91%' }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#111111]">
              <span>Decision Consistency</span>
              <span className="text-sm font-display font-black text-[#0B1F3A]">84%</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
              <div className="h-full bg-[#0B1F3A]" style={{ width: '84%' }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-brutal-sm space-y-1">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#111111]">
              <span>Policy Understanding</span>
              <span className="text-sm font-display font-black text-[#C0392B]">76%</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full border border-[#111111] overflow-hidden">
              <div className="h-full bg-[#C0392B]" style={{ width: '76%' }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
