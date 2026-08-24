'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, Users, TrendingUp, Award, Shield, AlertTriangle, 
  ArrowRight, CheckCircle2, ChevronRight, Filter, Search, X, 
  BookOpen, Building, Sparkles, RefreshCw, Info, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, AreaChart, Area, PieChart, Pie 
} from 'recharts';

interface DomainDrilldown {
  domain_id: number;
  domain_type: string;
  name: string;
  average_score: number;
  target_score: number;
  subskills_count: number;
  subskills: {
    id: number;
    code: string;
    name: string;
    avg_score: number;
    affected_officials: number;
  }[];
  recommended_courses: {
    id: number;
    title: string;
    igot_course_id: string;
    provider: string;
    difficulty: string;
  }[];
}

interface DeptDrilldown {
  department: string;
  officials_count: number;
  average_competency: number;
  average_ctq: number;
  top_gap: string;
  training_completion_rate: number;
}

interface SkillGapDrilldown {
  subskill_id: number;
  subskill_name: string;
  subskill_code: string;
  domain_name: string;
  avg_gap: number;
  avg_proficiency: number;
  affected_officials: number;
  priority: string;
  recommended_courses: {
    id: number;
    title: string;
    igot_course_id: string;
    provider: string;
  }[];
}

export default function WorkforceInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('ADMIN');

  // Interactive Modal Drilldowns
  const [selectedDomain, setSelectedDomain] = useState<DomainDrilldown | null>(null);
  const [selectedDept, setSelectedDept] = useState<DeptDrilldown | null>(null);
  const [selectedGap, setSelectedGap] = useState<SkillGapDrilldown | null>(null);

  const defaultWorkforceData = {
    kpis: {
      total_officials: 1248,
      average_competency: 76.4,
      critical_skill_gaps: 87,
      average_ctq: 78.4,
      ctq_trend: {
        current_ctq: 78.4,
        previous_period: 74.6,
        improvement_percentage: 5.1
      }
    },
    competency_distribution: [
      { tier: 'Excellent', range: '80-100%', count: 485, percentage: 38.8, color: '#10b981' },
      { tier: 'Good', range: '65-79%', count: 512, percentage: 41.0, color: '#3b82f6' },
      { tier: 'Developing', range: '50-64%', count: 184, percentage: 14.7, color: '#f59e0b' },
      { tier: 'Critical', range: '<50%', count: 67, percentage: 5.5, color: '#ef4444' }
    ],
    domain_breakdown: [
      {
        domain_id: 1,
        domain_type: 'STATISTICAL',
        name: 'Statistical Methodology & Data Science',
        average_score: 78.5,
        target_score: 82.0,
        subskills_count: 3,
        subskills: [
          { id: 1, code: 'STAT-01', name: 'Sampling Design & Estimation', avg_score: 81.0, affected_officials: 14 },
          { id: 2, code: 'STAT-02', name: 'High-Frequency Survey Design', avg_score: 72.5, affected_officials: 28 },
          { id: 3, code: 'STAT-03', name: 'Statistical Anomaly Detection', avg_score: 82.0, affected_officials: 11 }
        ],
        recommended_courses: [
          { id: 1, title: 'Advanced Sampling Design & Multi-Stage Estimation', igot_course_id: 'IGOT-STAT-401', provider: 'iGOT Karmayogi', difficulty: 'Advanced' }
        ]
      },
      {
        domain_id: 2,
        domain_type: 'TECHNICAL',
        name: 'Technical & Software Tools',
        average_score: 74.2,
        target_score: 82.0,
        subskills_count: 3,
        subskills: [
          { id: 4, code: 'TECH-01', name: 'SQL Data Analysis & Wrangling', avg_score: 79.0, affected_officials: 19 },
          { id: 5, code: 'TECH-02', name: 'Python & R Statistical Modeling', avg_score: 65.5, affected_officials: 42 },
          { id: 6, code: 'TECH-03', name: 'CAPI Mobile Survey Platforms', avg_score: 78.0, affected_officials: 15 }
        ],
        recommended_courses: [
          { id: 3, title: 'SQL Data Wrangling & Automated Anomaly Detection', igot_course_id: 'IGOT-TECH-205', provider: 'NIC', difficulty: 'Intermediate' }
        ]
      },
      {
        domain_id: 3,
        domain_type: 'DIGITAL_GOVERNANCE',
        name: 'Digital Governance & Data Security',
        average_score: 71.8,
        target_score: 82.0,
        subskills_count: 2,
        subskills: [
          { id: 7, code: 'GOV-01', name: 'NDSAP Compliance & Data Sharing', avg_score: 76.0, affected_officials: 22 },
          { id: 8, code: 'GOV-02', name: 'Digital k-Anonymity & Privacy', avg_score: 67.5, affected_officials: 39 }
        ],
        recommended_courses: [
          { id: 2, title: 'Digital Data Privacy & k-Anonymity Standards', igot_course_id: 'IGOT-GOV-302', provider: 'MeitY', difficulty: 'Intermediate' }
        ]
      },
      {
        domain_id: 4,
        domain_type: 'BEHAVIOURAL',
        name: 'Behavioural, Managerial & Decision Making',
        average_score: 81.0,
        target_score: 82.0,
        subskills_count: 2,
        subskills: [
          { id: 9, code: 'BEH-01', name: 'Policy Trade-off Analysis & Fallacies', avg_score: 82.0, affected_officials: 12 },
          { id: 10, code: 'BEH-02', name: 'Field Team Leadership & Ethics', avg_score: 80.0, affected_officials: 16 }
        ],
        recommended_courses: [
          { id: 4, title: 'Critical Thinking & Evidence-Based Decision Making', igot_course_id: 'IGOT-BEH-501', provider: 'ISTM', difficulty: 'Advanced' }
        ]
      }
    ],
    top_skill_gaps: [
      {
        subskill_id: 8,
        subskill_name: 'Digital k-Anonymity & Privacy',
        subskill_code: 'GOV-02',
        domain_name: 'Digital Governance & Data Security',
        avg_gap: 34.0,
        avg_proficiency: 46.0,
        affected_officials: 39,
        priority: 'HIGH',
        recommended_courses: [{ id: 2, title: 'Digital Data Privacy & k-Anonymity Standards', igot_course_id: 'IGOT-GOV-302', provider: 'MeitY' }]
      },
      {
        subskill_id: 5,
        subskill_name: 'Python & R Statistical Modeling',
        subskill_code: 'TECH-02',
        domain_name: 'Technical & Software Tools',
        avg_gap: 28.5,
        avg_proficiency: 51.5,
        affected_officials: 42,
        priority: 'HIGH',
        recommended_courses: [{ id: 3, title: 'SQL Data Wrangling & Automated Anomaly Detection', igot_course_id: 'IGOT-TECH-205', provider: 'NIC' }]
      },
      {
        subskill_id: 2,
        subskill_name: 'High-Frequency Survey Design',
        subskill_code: 'STAT-02',
        domain_name: 'Statistical Methodology & Data Science',
        avg_gap: 24.0,
        avg_proficiency: 56.0,
        affected_officials: 28,
        priority: 'MEDIUM',
        recommended_courses: [{ id: 1, title: 'Advanced Sampling Design & Multi-Stage Estimation', igot_course_id: 'IGOT-STAT-401', provider: 'iGOT Karmayogi' }]
      }
    ],
    department_comparison: [
      { department: 'NSO Field Operations Division', officials_count: 512, average_competency: 78.5, average_ctq: 81.2, top_gap: 'Digital k-Anonymity & Privacy', training_completion_rate: 88.0 },
      { department: 'Survey Design & Research Division', officials_count: 310, average_competency: 84.0, average_ctq: 85.0, top_gap: 'Automated Anomaly Detection SQL', training_completion_rate: 94.5 },
      { department: 'Economic Statistics Division', officials_count: 240, average_competency: 72.0, average_ctq: 78.0, top_gap: 'High-Frequency Sampling Estimation', training_completion_rate: 79.2 },
      { department: 'National Accounts Division', officials_count: 186, average_competency: 86.5, average_ctq: 87.4, top_gap: 'Econometric Modeling & Anomaly Validation', training_completion_rate: 96.0 }
    ]
  };

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch('/api/admin/workforce-insights/', {
        headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://localhost:8000/api/admin/workforce-insights/', {
          headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
        }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(defaultWorkforceData);
      }
    } catch {
      setData(defaultWorkforceData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('user_role') || 'ADMIN';
    setRole(userRole);
    fetchInsights();
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
        <h2 className="text-xl font-medium text-[#171717]">Unable to Load Workforce Insights</h2>
        <p className="text-sm text-[#707070] max-w-md">{error || 'Server error occurred while aggregating workforce metrics.'}</p>
        <button
          onClick={fetchInsights}
          className="btn-primary-green px-4 py-2 text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const kpis = data.kpis;
  const compDist = data.competency_distribution;
  const domainData = data.domain_breakdown;
  const topGaps = data.top_skill_gaps;
  const deptData = data.department_comparison;

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ededed] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ministry Intelligence · Official Statistical Cadre</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#171717]">Workforce Insights</h1>
          <p className="text-sm text-[#707070] mt-1 font-normal">
            Organization-wide competency benchmarking, skill-gap detection and critical capability intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInsights}
            className="p-2 rounded-[6px] border border-[#dfdfdf] hover:bg-[#fafafa] text-[#707070] transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin-dashboard#e-recruitment"
            className="btn-primary-green text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <span>Proceed to e-Recruitment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>TOTAL OFFICIALS</span>
            <Users className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#171717]">
            {kpis.total_officials.toLocaleString()}
          </div>
          <div className="text-xs text-[#707070]">
            Active Statistical &amp; IT Officers
          </div>
        </div>

        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>AVG COMPETENCY</span>
            <BarChart3 className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#171717]">
            {kpis.average_competency}%
          </div>
          <div className="text-xs text-[#707070]">
            Target Benchmark: 80.0%
          </div>
        </div>

        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>CRITICAL SKILL GAPS</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-amber-600">
            {kpis.critical_skill_gaps}
          </div>
          <div className="text-xs text-[#707070]">
            Deficits &gt; 25.0 pts needing training
          </div>
        </div>

        <div className="card-supa-light p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#707070]">
            <span>AVERAGE CTQ</span>
            <Award className="w-4 h-4 text-[#644fc1]" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#171717]">
            {kpis.average_ctq}
          </div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{kpis.ctq_trend.improvement_percentage}% from prev quarter</span>
          </div>
        </div>

      </div>

      {/* Row 1: Competency Distribution + Competency by Domain */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* A. Competency Distribution (5 Cols) */}
        <div className="lg:col-span-5 card-supa-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#171717] text-base">Competency Distribution</h3>
              <p className="text-xs text-[#707070]">Officer proficiency tier breakdown</p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#fafafa] border border-[#dfdfdf] text-[#707070]">
              FAISS Benchmarked
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compDist} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="tier" type="category" tick={{ fontSize: 11 }} width={75} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Proportion']}
                  contentStyle={{ backgroundColor: '#1c1c1c', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {compDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ededed]">
            {compDist.map((tier: any) => (
              <div key={tier.tier} className="p-2 rounded-[6px] bg-[#fafafa] border border-[#ededed] text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="font-medium text-[#171717]">{tier.tier} ({tier.range})</span>
                </div>
                <div className="text-[#707070] mt-0.5 pl-3.5">
                  {tier.count} proficiencies · {tier.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* B. Competency by Domain (7 Cols) */}
        <div className="lg:col-span-7 card-supa-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#171717] text-base">Competency by Domain</h3>
              <p className="text-xs text-[#707070]">Comparative domain scores vs 82% target threshold (Click to inspect)</p>
            </div>
            <span className="text-xs font-mono text-[#707070]">4 Domains</span>
          </div>

          <div className="space-y-4 pt-2">
            {domainData.map((d: DomainDrilldown) => {
              const pct = d.average_score;
              const isLow = pct < 65;
              return (
                <div
                  key={d.domain_id}
                  onClick={() => setSelectedDomain(d)}
                  className="p-3.5 rounded-[8px] border border-[#ededed] hover:border-[#3ecf8e] hover:bg-[#fafafa] transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-[#171717] group-hover:text-[#24b47e] transition-colors">
                        {d.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#707070]">
                        ({d.subskills_count} Subskills)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-semibold ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {pct}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#9a9a9a] group-hover:text-[#171717] transition-colors" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-[#ededed] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-500' : 'bg-[#3ecf8e]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Row 2: Top Skill Gaps + Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* C. Top Skill Gaps (6 Cols) */}
        <div className="lg:col-span-6 card-supa-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#171717] text-base">Top Priority Skill Gaps</h3>
              <p className="text-xs text-[#707070]">Largest capability deficits across all units (Click to view courses)</p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
              Needs Training
            </span>
          </div>

          <div className="space-y-3">
            {topGaps.map((gap: SkillGapDrilldown, idx: number) => (
              <div
                key={gap.subskill_id}
                onClick={() => setSelectedGap(gap)}
                className="p-3 rounded-[6px] border border-[#ededed] hover:border-[#171717] hover:bg-[#fafafa] transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#171717] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[#171717] group-hover:text-[#24b47e] transition-colors">
                      {gap.subskill_name}
                    </div>
                    <div className="text-xs text-[#707070] flex items-center gap-2 mt-0.5">
                      <span>{gap.subskill_code}</span>
                      <span>·</span>
                      <span>{gap.domain_name}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-rose-600">
                    Gap: -{gap.avg_gap} pts
                  </span>
                  <div className="text-[11px] text-[#707070]">
                    {gap.affected_officials} Officials
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D. Department Comparison (6 Cols) */}
        <div className="lg:col-span-6 card-supa-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#171717] text-base">Department Comparison</h3>
              <p className="text-xs text-[#707070]">Proficiency &amp; CTQ scores across directorates (Click to inspect)</p>
            </div>
            <Building className="w-4 h-4 text-[#707070]" />
          </div>

          <div className="space-y-3.5 pt-1">
            {deptData.map((dept: DeptDrilldown) => (
              <div
                key={dept.department}
                onClick={() => setSelectedDept(dept)}
                className="p-3.5 rounded-[8px] border border-[#ededed] hover:border-[#3ecf8e] hover:bg-[#fafafa] transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[#171717] group-hover:text-[#24b47e] transition-colors">
                    {dept.department}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#707070]">CTQ: <strong>{dept.average_ctq}</strong></span>
                    <span className="text-emerald-700 font-bold">{dept.average_competency}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-full h-2 bg-[#ededed] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#171717] rounded-full"
                      style={{ width: `${dept.average_competency}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#707070] shrink-0 font-mono">
                    {dept.officials_count} Officers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: CTQ Trend Banner */}
      <div className="card-supa-light p-6 border-l-4 border-l-[#644fc1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#644fc1]" />
            <h3 className="text-base font-medium text-[#171717]">Critical Thinking Quotient (CTQ) Cadre Growth</h3>
          </div>
          <p className="text-xs text-[#707070] max-w-2xl leading-relaxed">
            The Critical Thinking &amp; Policy Decision Quotient tracks official performance across multi-agent policy simulation debates, fallacy identification challenges, and grounded RAG assessments.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <div className="text-xs font-mono text-[#707070] uppercase">Previous Qtr</div>
            <div className="text-xl font-mono font-medium text-[#171717]">{kpis.ctq_trend.previous_period}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono text-[#707070] uppercase">Current Cadre</div>
            <div className="text-2xl font-mono font-bold text-[#644fc1]">{kpis.ctq_trend.current_ctq}</div>
          </div>
          <div className="text-center pl-4 border-l border-[#ededed]">
            <div className="text-xs font-mono text-emerald-600 uppercase font-medium">Cadre Delta</div>
            <div className="text-xl font-mono font-bold text-emerald-600">+{kpis.ctq_trend.improvement_percentage}%</div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Domain Drilldown */}
      {selectedDomain && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#ededed] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#ededed] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#707070] block">Domain Intelligence</span>
                <h3 className="text-xl font-medium text-[#171717]">{selectedDomain.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDomain(null)}
                className="p-1.5 rounded-full hover:bg-[#fafafa] text-[#707070]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase text-[#707070]">Subskills Breakdown &amp; Affected Officers</h4>
              <div className="space-y-2">
                {selectedDomain.subskills.map(s => (
                  <div key={s.id} className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#171717]">{s.name}</span>
                      <span className="text-[#707070] ml-2">({s.code})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-rose-600 font-mono">{s.affected_officials} Need Upskilling</span>
                      <span className="font-mono font-bold text-[#171717]">{s.avg_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase text-[#707070]">Recommended iGOT Karmayogi Courses</h4>
              <div className="space-y-2">
                {selectedDomain.recommended_courses.map(c => (
                  <div key={c.id} className="p-3 rounded-[6px] bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-medium text-emerald-950">{c.title}</div>
                      <div className="text-[11px] text-emerald-800">{c.igot_course_id} · {c.provider}</div>
                    </div>
                    <Link
                      href="/courses"
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shrink-0"
                    >
                      Assign Course
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Department Drilldown */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#ededed] max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#ededed] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#707070] block">Directorate Metrics</span>
                <h3 className="text-xl font-medium text-[#171717]">{selectedDept.department}</h3>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-1.5 rounded-full hover:bg-[#fafafa] text-[#707070]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1">
                <span className="text-[#707070] block">Cadre Strength</span>
                <span className="text-lg font-bold text-[#171717]">{selectedDept.officials_count} Officers</span>
              </div>
              <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1">
                <span className="text-[#707070] block">Avg Competency</span>
                <span className="text-lg font-bold text-emerald-700">{selectedDept.average_competency}%</span>
              </div>
              <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1">
                <span className="text-[#707070] block">Average CTQ</span>
                <span className="text-lg font-bold text-[#644fc1]">{selectedDept.average_ctq}</span>
              </div>
              <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1">
                <span className="text-[#707070] block">Training Completion</span>
                <span className="text-lg font-bold text-[#171717]">{selectedDept.training_completion_rate}%</span>
              </div>
            </div>

            <div className="p-3 rounded-[6px] bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <span className="font-semibold block">Priority Department Capability Deficit:</span>
              <p>{selectedDept.top_gap} — Flagged for mandatory iGOT Karmayogi refresher assignment.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Skill Gap Drilldown */}
      {selectedGap && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#ededed] max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#ededed] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-rose-600 font-bold block">Capability Gap Details</span>
                <h3 className="text-xl font-medium text-[#171717]">{selectedGap.subskill_name}</h3>
                <span className="text-xs text-[#707070]">{selectedGap.subskill_code} · {selectedGap.domain_name}</span>
              </div>
              <button
                onClick={() => setSelectedGap(null)}
                className="p-1.5 rounded-full hover:bg-[#fafafa] text-[#707070]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1">
                <span className="text-[#707070] block">Average Proficiency</span>
                <span className="text-lg font-bold text-[#171717]">{selectedGap.avg_proficiency}%</span>
              </div>
              <div className="p-3 rounded-[6px] bg-rose-50 border border-rose-200 space-y-1">
                <span className="text-rose-700 block">Gap to Target (80%)</span>
                <span className="text-lg font-bold text-rose-700">-{selectedGap.avg_gap} pts</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-[#707070]">Curated Training Course Modules</h4>
              {selectedGap.recommended_courses.map(c => (
                <div key={c.id} className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#171717]">{c.title}</div>
                    <div className="text-[11px] text-[#707070]">{c.igot_course_id} · {c.provider}</div>
                  </div>
                  <Link
                    href="/courses"
                    className="px-2.5 py-1 rounded bg-[#171717] text-white text-xs font-medium hover:bg-[#3ecf8e] hover:text-[#171717] transition-colors shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
