'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Shield, Users, Award, AlertTriangle, TrendingUp, Cpu, Building, Lock } from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    authFetch('/api/dashboard/admin/')
      .then(async res => {
        if (res.status === 403 || res.status === 401) {
          setForbidden(true);
          return null;
        }
        if (!res.ok) throw new Error('Failed to load admin metrics.');
        return res.json();
      })
      .then(d => {
        if (d) {
          setData(d);
        }
      })
      .catch(() => {
        setForbidden(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        Loading Ministry Admin Skill Intelligence Metrics...
      </div>
    );
  }

  if (forbidden || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white font-sans p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Administrator Access Required</h2>
        <p className="text-xs text-zinc-400 max-w-md text-center font-mono">
          The Ministry Leadership Skill Intelligence Dashboard is restricted to verified administrators and DG MoSPI credentials.
        </p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-colors">
          Sign In as Administrator
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-400 text-xs font-mono mb-3">
            <Shield className="w-3.5 h-3.5" /> Ministry Leadership View (DG MoSPI)
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Admin Skill Intelligence Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Org-Wide Competency Distribution · CTQ Metrics · iGOT Training Impact
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400">
            System Status: Healthy
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-2">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Total Active Officials</span>
          <div className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" /> {data.summary.total_officials}
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Across MoSPI Divisions</span>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-2">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Org Average CTQ</span>
          <div className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" /> {data.summary.org_average_ctq}
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Calculated from debates</span>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-2">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Debates Concluded</span>
          <div className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400" /> {data.summary.completed_debates_count}
          </div>
          <span className="text-[11px] font-mono text-purple-400">Neeti Vivaad Simulations</span>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-2">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Quizzes Taken</span>
          <div className="text-3xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" /> {data.summary.total_quizzes_taken}
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Grounded Assessments</span>
        </div>
      </div>

      {/* Department Heatmap Bar Chart */}
      <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-cyan-400" /> Department-Wise Competency Heatmap
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">Average proficiency levels (0-100) across 4 core domains</p>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.department_heatmap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="department" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="statistical_score" name="Statistical" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="technical_score" name="Technical" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="digital_gov_score" name="Digital Gov" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="behavioural_score" name="Behavioural/CTQ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
