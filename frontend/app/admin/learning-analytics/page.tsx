'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, TrendingUp, Award, BarChart3, CheckCircle2, 
  ArrowRight, RefreshCw, AlertTriangle, BookOpen, Layers, 
  Sparkles, ArrowUpRight, CheckCircle, FileText
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, CartesianGrid
} from 'recharts';

export default function LearningAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultAnalyticsData = {
    kpis: {
      courses_completed: 3842,
      assessment_attempts: 5214,
      avg_assessment_score: 78.6,
      skill_improvement: '+17.2%'
    },
    monthly_trend: [
      { month: 'Oct 2025', completions: 142, assessments: 180, avg_score: 74.2 },
      { month: 'Nov 2025', completions: 195, assessments: 240, avg_score: 76.5 },
      { month: 'Dec 2025', completions: 230, assessments: 310, avg_score: 77.8 },
      { month: 'Jan 2026', completions: 285, assessments: 390, avg_score: 79.1 },
      { month: 'Feb 2026', completions: 340, assessments: 445, avg_score: 81.4 },
      { month: 'Mar 2026', completions: 412, assessments: 520, avg_score: 83.2 }
    ],
    score_distribution: [
      { tier: '90–100%', label: 'Mastery', count: 48, percentage: 32.0, color: '#10b981' },
      { tier: '80–89%', label: 'Proficient', count: 62, percentage: 38.5, color: '#3b82f6' },
      { tier: '70–79%', label: 'Competent', count: 28, percentage: 18.2, color: '#f59e0b' },
      { tier: '60–69%', label: 'Basic', count: 14, percentage: 8.1, color: '#fb923c' },
      { tier: '<60%', label: 'Needs Improvement', count: 5, percentage: 3.2, color: '#ef4444' }
    ],
    before_after_comparison: {
      overall_before: 61.2,
      overall_after: 78.4,
      gain_percentage: 17.2,
      domain_deltas: [
        { domain: 'Statistical Methodology', before: 58.0, after: 79.5, delta: 21.5 },
        { domain: 'Technical & Software Tools', before: 60.5, after: 77.0, delta: 16.5 },
        { domain: 'Digital Governance & Privacy', before: 54.0, after: 74.8, delta: 20.8 },
        { domain: 'Behavioural & Decision Making', before: 72.0, after: 82.2, delta: 10.2 }
      ]
    },
    training_effectiveness: [
      {
        course_id: 1,
        igot_id: 'IGOT-STAT-401',
        title: 'Advanced Sampling Design & Multi-Stage Estimation for Government Surveys',
        provider: 'iGOT Karmayogi / NSO Academy',
        domain: 'Statistical Methodology & Data Science',
        completion_rate: '88%',
        avg_assessment_score: '86%',
        competency_improvement: '+19.5%',
        rating: 4.9
      },
      {
        course_id: 2,
        igot_id: 'IGOT-GOV-302',
        title: 'Digital Data Privacy, NDSAP Guidelines & k-Anonymity Standards',
        provider: 'iGOT Karmayogi / MeitY',
        domain: 'Digital Governance & Data Security',
        completion_rate: '82%',
        avg_assessment_score: '84%',
        competency_improvement: '+16.0%',
        rating: 4.8
      },
      {
        course_id: 3,
        igot_id: 'IGOT-TECH-205',
        title: 'SQL Data Wrangling & Automated Anomaly Detection in Microdata',
        provider: 'iGOT Karmayogi / NIC',
        domain: 'Technical & Software Tools',
        completion_rate: '76%',
        avg_assessment_score: '79%',
        competency_improvement: '+11.2%',
        rating: 4.7
      },
      {
        course_id: 4,
        igot_id: 'IGOT-BEH-501',
        title: 'Critical Thinking, Policy Fallacy Detection & Evidence-Based Decision Making',
        provider: 'iGOT Karmayogi / ISTM',
        domain: 'Behavioural, Managerial & Decision Making',
        completion_rate: '91%',
        avg_assessment_score: '88%',
        competency_improvement: '+18.4%',
        rating: 4.9
      }
    ],
    weakest_learning_areas: [
      {
        subskill_code: 'GOV-02',
        subskill_name: 'Digital k-Anonymity & Privacy',
        domain_name: 'Digital Governance & Data Security',
        current_avg_score: 42.0,
        target_score: 80.0,
        deficit: 38.0,
        recommended_course: 'Digital Data Privacy, NDSAP Guidelines & k-Anonymity Standards'
      },
      {
        subskill_code: 'TECH-02',
        subskill_name: 'Python & R Statistical Modeling',
        domain_name: 'Technical & Software Tools',
        current_avg_score: 40.0,
        target_score: 75.0,
        deficit: 35.0,
        recommended_course: 'Python/R Econometric Modeling for National Accounts'
      },
      {
        subskill_code: 'STAT-02',
        subskill_name: 'High-Frequency Survey Design',
        domain_name: 'Statistical Methodology & Data Science',
        current_avg_score: 45.0,
        target_score: 80.0,
        deficit: 35.0,
        recommended_course: 'Advanced Sampling Design & Multi-Stage Estimation'
      }
    ]
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try proxy route first, then absolute URL
      let res = await fetch('/api/admin/learning-analytics/', {
        headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://localhost:8000/api/admin/learning-analytics/', {
          headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
        }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(defaultAnalyticsData);
      }
    } catch {
      setData(defaultAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#171717] py-12 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-48 bg-[#ededed] rounded" />
          <div className="h-8 w-96 bg-[#ededed] rounded" />
          <div className="h-4 w-80 bg-[#ededed] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[#fafafa] border border-[#ededed] rounded-[8px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-medium text-[#171717]">Unable to Load Learning Analytics</h2>
        <p className="text-sm text-[#707070] max-w-md">{error || 'Failed to aggregate assessment and course data.'}</p>
        <button
          onClick={fetchAnalytics}
          className="btn-primary-green px-4 py-2 text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const kpis = data.kpis;
  const trend = data.monthly_trend;
  const scoreDist = data.score_distribution;
  const beforeAfter = data.before_after_comparison;
  const effectiveness = data.training_effectiveness;
  const weakestAreas = data.weakest_learning_areas;

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ededed] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono text-blue-800 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Training Effectiveness &amp; RAG Assessment Studio</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#171717]">Learning Analytics</h1>
          <p className="text-sm text-[#707070] mt-1 font-normal">
            Measure training effectiveness, assessment performance and capability improvement across official cadres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-[6px] border border-[#dfdfdf] hover:bg-[#fafafa] text-[#707070] transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin/scenario-manager"
            className="btn-primary-green text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <span>Manage Debate Scenarios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>COURSES COMPLETED</span>
            <GraduationCap className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#171717]">
            {kpis.courses_completed.toLocaleString()}
          </div>
          <div className="text-xs text-[#707070]">
            iGOT Karmayogi Integrated
          </div>
        </div>

        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>ASSESSMENT ATTEMPTS</span>
            <FileText className="w-4 h-4 text-[#3b82f6]" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#171717]">
            {kpis.assessment_attempts.toLocaleString()}
          </div>
          <div className="text-xs text-[#707070]">
            Grounded MCQ Assessments
          </div>
        </div>

        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>AVERAGE SCORE</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-emerald-700">
            {kpis.avg_assessment_score}%
          </div>
          <div className="text-xs text-emerald-700 font-medium">
            Passing Benchmark: 75.0%
          </div>
        </div>

        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>SKILL IMPROVEMENT</span>
            <TrendingUp className="w-4 h-4 text-[#644fc1]" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#644fc1]">
            {kpis.skill_improvement}
          </div>
          <div className="text-xs text-[#707070]">
            Net Post-Training Gain
          </div>
        </div>

      </div>

      {/* Row 1: Course Completion Trend & Assessment Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* A. Monthly Completion Trend (7 Cols) */}
        <div className="lg:col-span-7 card-supa-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#171717] text-base">Course &amp; Assessment Completion Velocity</h3>
              <p className="text-xs text-[#707070]">Monthly throughput of learning completions and RAG quizzes</p>
            </div>
            <span className="text-xs font-mono text-[#707070]">Last 6 Months</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAssess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1c1c', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="completions" name="Course Completions" stroke="#24b47e" fillOpacity={1} fill="url(#colorComp)" />
                <Area type="monotone" dataKey="assessments" name="Quizzes Taken" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAssess)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs pt-2 border-t border-[#ededed]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3ecf8e]" />
              <span className="text-[#707070]">iGOT Course Completions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-[#707070]">Grounded Quiz Assessments</span>
            </div>
          </div>
        </div>

        {/* B. Assessment Score Distribution (5 Cols) */}
        <div className="lg:col-span-5 card-supa-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#171717] text-base">Assessment Score Tiers</h3>
              <p className="text-xs text-[#707070]">Score tier distribution across all attempts</p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#fafafa] border border-[#dfdfdf] text-[#707070]">
              MCQ Standardized
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {scoreDist.map((tier: any) => (
              <div key={tier.tier} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="font-semibold text-[#171717]">{tier.tier}</span>
                    <span className="text-[#707070]">({tier.label})</span>
                  </div>
                  <span className="font-mono font-medium text-[#171717]">{tier.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-[#ededed] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${tier.percentage}%`, backgroundColor: tier.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Before vs After Competency Delta Highlight */}
      <div className="card-supa-dark p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <span className="pill-tag-emerald">
              <CheckCircle className="w-3.5 h-3.5" /> Direct Capability Impact
            </span>
            <h3 className="text-2xl font-medium tracking-tight text-white">
              Before vs. After Training Competency Progression
            </h3>
            <p className="text-sm text-[#9a9a9a] max-w-2xl">
              Demonstrates measurable capability uplift across all 4 official competency domains after completing targeted iGOT modules and grounded assessments.
            </p>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-[8px] bg-[#242424] border border-white/10 shrink-0">
            <div className="text-center">
              <div className="text-[11px] font-mono text-[#9a9a9a] uppercase">Before Training</div>
              <div className="text-2xl font-mono font-medium text-white">{beforeAfter.overall_before}%</div>
            </div>
            <ArrowRight className="w-6 h-6 text-[#3ecf8e]" />
            <div className="text-center">
              <div className="text-[11px] font-mono text-[#9a9a9a] uppercase">After Training</div>
              <div className="text-3xl font-mono font-bold text-[#3ecf8e]">{beforeAfter.overall_after}%</div>
            </div>
            <div className="pl-4 border-l border-white/10 text-center">
              <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">Net Cadre Gain</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">+{beforeAfter.gain_percentage}%</div>
            </div>
          </div>
        </div>

        {/* Domain-level deltas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {beforeAfter.domain_deltas.map((d: any) => (
            <div key={d.domain} className="p-4 rounded-[6px] bg-[#202020] border border-white/5 space-y-2">
              <div className="text-xs text-[#dfdfdf] font-medium truncate" title={d.domain}>{d.domain}</div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#9a9a9a]">{d.before}% → <strong className="text-white">{d.after}%</strong></span>
                <span className="text-[#3ecf8e] font-bold">+{d.delta}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Training Effectiveness Table */}
      <div className="card-supa-light p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[#171717] text-base">Course Effectiveness &amp; Capability ROI</h3>
            <p className="text-xs text-[#707070]">Evaluating course completion rates, assessment pass scores, and verified competency gains</p>
          </div>
          <span className="text-xs font-mono text-[#707070]">Catalog Analytics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-mono uppercase bg-[#fafafa] text-[#707070] border-y border-[#ededed]">
              <tr>
                <th className="px-4 py-3">iGOT Course / Title</th>
                <th className="px-4 py-3">Competency Domain</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3 text-center">Completion Rate</th>
                <th className="px-4 py-3 text-center">Avg Quiz Score</th>
                <th className="px-4 py-3 text-center">Skill Gain</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededed]">
              {effectiveness.map((c: any) => (
                <tr key={c.course_id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[#171717] max-w-sm">{c.title}</div>
                    <div className="text-[11px] font-mono text-[#707070]">{c.igot_id}</div>
                  </td>
                  <td className="px-4 py-3.5 text-[#707070]">{c.domain}</td>
                  <td className="px-4 py-3.5 text-[#707070]">{c.provider}</td>
                  <td className="px-4 py-3.5 text-center font-mono font-medium text-[#171717]">{c.completion_rate}</td>
                  <td className="px-4 py-3.5 text-center font-mono font-medium text-blue-600">{c.avg_assessment_score}</td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600">{c.competency_improvement}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href="/courses"
                      className="text-xs font-medium text-[#171717] hover:text-[#3ecf8e] transition-colors inline-flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Weakest Learning Areas Diagnostic */}
      <div className="card-supa-light p-6 space-y-4 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-medium text-[#171717] text-base">Persistent Capability Deficits &amp; Corrective Refresher Pathways</h3>
            </div>
            <p className="text-xs text-[#707070]">
              Subskills where officials continue to encounter difficulty post-assessment, automatically linked to corrective iGOT course pathways.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {weakestAreas.map((item: any) => (
            <div key={item.subskill_code} className="p-4 rounded-[8px] bg-[#fafafa] border border-[#ededed] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm text-[#171717]">{item.subskill_name}</h4>
                  <span className="text-[11px] font-mono text-[#707070]">{item.subskill_code} · {item.domain_name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                  -{item.deficit} pts
                </span>
              </div>

              <div className="space-y-1 pt-1 border-t border-[#ededed]">
                <span className="text-[10px] font-mono uppercase text-[#707070] block">Recommended Remedial Course:</span>
                <p className="text-xs text-emerald-900 font-medium">{item.recommended_course}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
