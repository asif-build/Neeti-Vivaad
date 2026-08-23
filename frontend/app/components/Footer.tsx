import React from 'react';
import { PlainviewSunLogo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <PlainviewSunLogo className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-white tracking-tight">Neeti Vivaad</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            AI-Powered Skill Intelligence & Policy Debate Platform for officials in India's Official Statistical System.
          </p>
          <p className="text-[11px] font-mono text-zinc-400">
            Problem Statement SIH26101 · MoSPI
          </p>
        </div>

        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200 mb-3">Core Modules</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/dashboard" className="hover:text-cyan-400 transition-colors">Competency Engine</a></li>
            <li><a href="/courses" className="hover:text-cyan-400 transition-colors">iGOT Course Matcher</a></li>
            <li><a href="/quiz" className="hover:text-cyan-400 transition-colors">Grounded AI Quiz Studio</a></li>
            <li><a href="/debate" className="hover:text-cyan-400 transition-colors">Neeti Vivaad Debate Arena</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200 mb-3">Grounding Sources</h4>
          <ul className="space-y-2 text-xs">
            <li><span className="text-zinc-400">MoSPI Annual Reports 2024-25</span></li>
            <li><span className="text-zinc-400">National Statistical Commission</span></li>
            <li><span className="text-zinc-400">India Data Quality Framework</span></li>
            <li><span className="text-zinc-400">NDSAP Data Sharing Rules</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200 mb-3">Compliance & Trust</h4>
          <p className="text-xs text-zinc-400 leading-relaxed mb-3">
            Zero-hallucination constraint enforcement. All debate claims cite retrieved MoSPI documents.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            RAG Grounding Active
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400">
        <p>© 2026 Neeti Vivaad · Smart India Hackathon 2026</p>
        <p>Built for Ministry of Statistics and Programme Implementation</p>
      </div>
    </footer>
  );
}
