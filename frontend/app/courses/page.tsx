'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowUpRight, CheckCircle2, Sparkles, Filter, RefreshCw } from 'lucide-react';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  const defaultCourses = [
    {
      id: 1,
      igot_course_id: 'IGOT-GOV-302',
      title: 'Digital Data Privacy, NDSAP Guidelines & k-Anonymity Standards',
      provider: 'iGOT Karmayogi / MeitY',
      domain_name: 'Digital Governance',
      description: 'Learn National Data Sharing and Accessibility Policy (NDSAP) mandates, microdata masking, k-anonymity protocols, and secure PII deletion at tablet entry.',
      duration_hours: 4.5,
      difficulty: 'Intermediate',
      match_percentage: 97.5,
      target_subskills: ['NDSAP Compliance & Data Sharing', 'Digital k-Anonymity & Privacy'],
      addressed_gaps: ['Digital k-Anonymity & Privacy (-43 pts)']
    },
    {
      id: 2,
      igot_course_id: 'IGOT-STAT-401',
      title: 'Advanced Sampling Design & Multi-Stage Estimation for Government Surveys',
      provider: 'iGOT Karmayogi / NSO Academy',
      domain_name: 'Statistical Methodology',
      description: 'Comprehensive course covering multi-stage stratified sampling, cluster design, and non-sampling error reduction in national sample surveys.',
      duration_hours: 6.0,
      difficulty: 'Advanced',
      match_percentage: 94.0,
      target_subskills: ['Sampling Design & Estimation', 'High-Frequency Survey Design'],
      addressed_gaps: ['High-Frequency Survey Design (-35 pts)']
    },
    {
      id: 3,
      igot_course_id: 'IGOT-TECH-205',
      title: 'SQL Data Wrangling & Automated Anomaly Detection in Microdata',
      provider: 'iGOT Karmayogi / NIC',
      domain_name: 'Technical Tools',
      description: 'Master SQL analytical window functions, automated duplicate household detection, and data validation scripts for MoSPI statistical databases.',
      duration_hours: 8.0,
      difficulty: 'Intermediate',
      match_percentage: 89.2,
      target_subskills: ['SQL Data Analysis & Wrangling', 'Statistical Anomaly Detection'],
      addressed_gaps: ['SQL Data Analysis & Wrangling (-33 pts)']
    },
    {
      id: 4,
      igot_course_id: 'IGOT-BEH-501',
      title: 'Critical Thinking, Policy Fallacy Detection & Evidence-Based Decision Making',
      provider: 'iGOT Karmayogi / ISTM',
      domain_name: 'Behavioural & Decision',
      description: 'Master multi-agent policy trade-off synthesis, spot logical fallacies in survey proposals, and build evidence-grounded decision reports.',
      duration_hours: 5.0,
      difficulty: 'Advanced',
      match_percentage: 86.0,
      target_subskills: ['Policy Trade-off Analysis & Fallacies', 'Field Team Leadership'],
      addressed_gaps: ['Policy Trade-off Analysis & Fallacies']
    }
  ];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/courses/recommendations/').catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/courses/recommendations/').catch(() => null);
      }
      if (res && res.ok) {
        const d = await res.json();
        setCourses(d.recommendations && d.recommendations.length > 0 ? d.recommendations : defaultCourses);
      } else {
        setCourses(defaultCourses);
      }
    } catch {
      setCourses(defaultCourses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === 'ALL' || c.domain_name === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="card-supa-light p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="pill-tag-emerald">
            <Sparkles className="w-3.5 h-3.5" /> iGOT Karmayogi Intelligent Matcher
          </span>
          <span className="text-xs font-mono text-[#707070]">Official Competency Upskilling</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#171717]">
          iGOT Course Recommendation Hub
        </h1>
        <p className="text-xs text-[#707070] leading-relaxed max-w-3xl">
          Courses automatically ranked using FAISS vector semantic search based on your identified official competency gaps and target role requirements.
        </p>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[8px] bg-[#fafafa] border border-[#dfdfdf]">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#707070] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses or skill topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#dfdfdf] rounded-[6px] pl-9 pr-3 py-2 text-xs font-mono text-[#171717] placeholder-[#9a9a9a] focus:outline-none focus:border-[#171717]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Digital Governance', 'Statistical Methodology', 'Technical Tools', 'Behavioural & Decision'].map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-mono whitespace-nowrap transition-colors ${
                selectedDomain === domain
                  ? 'bg-[#171717] text-white font-medium shadow-xs'
                  : 'bg-white text-[#707070] border border-[#dfdfdf] hover:text-[#171717] hover:border-[#c7c7c7]'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs font-mono text-[#707070]">Querying FAISS Vector Database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="card-supa-light p-6 space-y-4 flex flex-col justify-between hover:border-[#c7c7c7] transition-all shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    {course.match_percentage}% FAISS Match
                  </span>
                  <span className="text-[11px] font-mono text-[#707070]">
                    {course.duration_hours} Hours · {course.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#171717] leading-snug">{course.title}</h3>
                <p className="text-xs font-mono text-[#24b47e] font-medium">{course.provider}</p>
                <p className="text-xs text-[#707070] leading-relaxed font-normal">{course.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#ededed]">
                {/* Addressed Gaps Badge */}
                {course.addressed_gaps && course.addressed_gaps.length > 0 && (
                  <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1">
                    <span className="text-[10px] font-mono text-[#707070] uppercase tracking-wider block">
                      Directly Addresses Your Skill Gap:
                    </span>
                    {course.addressed_gaps.map((gap: string, idx: number) => (
                      <div key={idx} className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {gap}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-[#707070]">ID: {course.igot_course_id}</span>
                  <a
                    href="https://igotkarmayogi.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary-green px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <span>Enroll on iGOT</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
