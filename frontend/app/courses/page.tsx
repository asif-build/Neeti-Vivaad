'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ArrowUpRight, CheckCircle2, Sparkles, Filter, LogIn } from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/api';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuth(!!token);

    if (token) {
      authFetch('/api/courses/recommendations/')
        .then(res => res.json())
        .then(d => {
          setCourses(d.recommendations || []);
        })
        .catch(() => {
          setCourses([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      fetch('http://127.0.0.1:8000/api/courses/')
        .then(res => res.json())
        .then(d => {
          setCourses(d.courses || []);
        })
        .catch(() => {
          setCourses([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const filtered = courses.filter(c => {
    const matchesSearch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === 'ALL' || c.domain_name === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" /> iGOT Karmayogi Intelligent Matcher
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            iGOT Course Recommendation Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            {isAuth
              ? 'Courses automatically ranked using FAISS vector semantic search based on your authenticated skill gaps.'
              : 'Sign in to generate personalized course rankings matched to your official competency profile.'}
          </p>

          {!isAuth && (
            <div className="mt-4">
              <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors">
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In for Personalized Matching</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses or skill topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Digital Governance & Data Security', 'Statistical Methodology & Data Science', 'Technical & Software Tools', 'Behavioural, Managerial & Decision Making'].map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                selectedDomain === domain
                  ? 'bg-cyan-500 text-zinc-950 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {domain.replace(' & Data Science', '').replace(', Managerial & Decision Making', '').replace(' & Software Tools', '').replace(' & Data Security', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-12 text-cyan-400 font-mono text-sm">Querying FAISS Vector Database...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 font-mono text-sm">No courses found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/90 hover:border-cyan-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {course.match_percentage ? (
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                      {course.match_percentage}% FAISS Match
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                      {course.domain_name}
                    </span>
                  )}
                  <span className="text-xs font-mono text-zinc-400">
                    {course.duration_hours} Hours · {course.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">{course.title}</h3>
                <p className="text-xs font-mono text-cyan-400">{course.provider}</p>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{course.description}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                {/* Addressed Gaps Badge */}
                {course.addressed_gaps && course.addressed_gaps.length > 0 && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Directly Addresses Your Skill Gap:
                    </span>
                    {course.addressed_gaps.map((gap: string, idx: number) => (
                      <div key={idx} className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {gap}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-zinc-400">ID: {course.igot_course_id}</span>
                  <a
                    href={course.url || "https://igotkarmayogi.gov.in/"}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
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
