'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, Play, Sparkles, Scale, Shield, AlertTriangle, 
  ChevronRight, ChevronDown, CheckCircle2, Award, Zap, HelpCircle, Layers, LogIn
} from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/api';

export default function DebateStudio() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [whatIfInput, setWhatIfInput] = useState('');
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const [showJudgmentTree, setShowJudgmentTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({'node-1': true});
  const [fallacyAnswered, setFallacyAnswered] = useState<boolean>(false);
  const [fallacyResult, setFallacyResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/debate/scenarios/')
      .then(res => res.json())
      .then(d => {
        setScenarios(d.scenarios || []);
        if (d.scenarios?.length > 0) {
          setSelectedScenarioId(d.scenarios[0].id);
        }
      })
      .catch(() => {
        setScenarios([]);
      });
  }, []);

  const handleStartDebate = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Please sign in to participate in policy debates.");
      return;
    }

    setLoading(true);
    setFallacyAnswered(false);
    setFallacyResult(null);
    setError(null);
    try {
      const res = await authFetch('/api/debate/start/', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: selectedScenarioId })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to start debate session.');
      setSession(d);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || "Could not connect to backend server.");
    }
  };

  const handleNextRound = async () => {
    if (!session) return;
    setLoading(true);
    setFallacyAnswered(false);
    setFallacyResult(null);
    setError(null);
    try {
      const res = await authFetch('/api/debate/next-round/', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.session_id })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to advance round.');
      setSession((prev: any) => ({
        ...prev,
        current_round: d.current_round,
        round_name: d.round_name,
        arguments: d.arguments,
        fallacy_challenge: d.fallacy_challenge,
        decision_report: d.decision_report || prev.decision_report
      }));
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Error advancing round.');
    }
  };

  const handleInjectConstraint = async () => {
    if (!session || !whatIfInput.trim()) return;
    setLoading(true);
    setShowWhatIfModal(false);
    setError(null);
    try {
      const res = await authFetch('/api/debate/inject-constraint/', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session.session_id,
          constraint_text: whatIfInput
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to inject constraint.');
      setSession((prev: any) => ({
        ...prev,
        active_constraint: whatIfInput,
        current_round: d.current_round,
        round_name: d.round_name,
        arguments: d.arguments,
        fallacy_challenge: d.fallacy_challenge,
        decision_report: d.decision_report || prev.decision_report
      }));
      setWhatIfInput('');
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Error injecting constraint.');
    }
  };

  const handleAnswerFallacy = async (optionIdx: number) => {
    if (!session?.fallacy_challenge || fallacyAnswered) return;
    try {
      const res = await authFetch('/api/debate/answer-fallacy/', {
        method: 'POST',
        body: JSON.stringify({
          challenge_id: session.fallacy_challenge.id,
          option_index: optionIdx
        })
      });
      const d = await res.json();
      setFallacyAnswered(true);
      setFallacyResult(d);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" /> AI-Moderated Policy Debate Simulator
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Neeti Vivaad Debate Arena
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            4 Personas · Strictly RAG Grounded · Fallacy Hunter · What-If Injector · Judgment Tree
          </p>
        </div>

        {session && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWhatIfModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-xs hover:bg-amber-500/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>What-If Injector</span>
            </button>

            {session.decision_report && (
              <button
                onClick={() => setShowJudgmentTree(!showJudgmentTree)}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 font-bold font-mono text-xs hover:bg-cyan-400 transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{showJudgmentTree ? 'Hide Judgment Tree' : 'Expand Judgment Tree'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          {!getAccessToken() && (
            <Link href="/login" className="px-3 py-1 rounded-lg bg-white text-black font-bold text-xs">
              Sign In
            </Link>
          )}
        </div>
      )}

      {!session ? (
        /* Scenario Selector Screen */
        <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 shadow-xl max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" /> Select Policy Debate Scenario
          </h2>

          <div className="space-y-4">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  selectedScenarioId === sc.id
                    ? 'bg-zinc-950 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-cyan-400">
                    {sc.category}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">Constraint: {sc.initial_constraint}</span>
                </div>
                <h3 className="font-bold text-white text-base mb-2">{sc.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{sc.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartDebate}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <span>Orchestrating Multi-Agent Debate Arena...</span>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Launch Neeti Vivaad Debate (Round 1)</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Debate Arena View */
        <div className="space-y-8">
          
          {/* Active Constraints Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider">Active Constraint:</span>
              <span className="text-zinc-200">{session.active_constraint || 'Standard MoSPI Guidelines'}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-cyan-400 font-bold">
              Round {session.current_round} / 4: {session.round_name}
            </span>
          </div>

          {/* 4 Agent Argument Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {session.arguments?.map((arg: any) => (
              <div
                key={arg.id}
                className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4 relative overflow-hidden transition-all hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3.5 h-3.5 rounded-full" 
                      style={{ backgroundColor: arg.avatar_color }} 
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{arg.agent_name}</h4>
                      <span className="text-[10px] font-mono text-zinc-400 block">{arg.priority_tag}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-cyan-300">
                    grounded in: {arg.document_code}
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  "{arg.argument_text}"
                </p>

                <div className="pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 italic">
                  📌 {arg.source_citation}
                </div>
              </div>
            ))}
          </div>

          {/* Fallacy Hunter Challenge Card */}
          {session.fallacy_challenge && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Fallacy Hunter Challenge (Round {session.current_round})
                </span>
                <span className="text-[11px] font-mono text-zinc-400">+5 CTQ Points</span>
              </div>

              <p className="text-xs text-zinc-300 font-sans">
                <strong>Argument Snippet:</strong> "{session.fallacy_challenge.argument_snippet}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {session.fallacy_challenge.options.map((optText: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerFallacy(idx)}
                    disabled={fallacyAnswered}
                    className={`p-3 rounded-xl text-xs font-mono text-left transition-all border ${
                      fallacyResult && idx === fallacyResult.correct_option_index
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {optText}
                  </button>
                ))}
              </div>

              {fallacyResult && (
                <div className={`p-4 rounded-xl text-xs font-mono ${
                  fallacyResult.is_correct ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                }`}>
                  {fallacyResult.is_correct ? '✓ Correct! ' : '✕ Incorrect. '}
                  {fallacyResult.explanation} (CTQ Score updated: {fallacyResult.new_ctq_score})
                </div>
              )}
            </div>
          )}

          {/* Advance Round Button */}
          {session.current_round < 4 ? (
            <button
              onClick={handleNextRound}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-sm hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Synthesizing Next Round Arguments...' : `Advance to Round ${session.current_round + 1}`}
            </button>
          ) : (
            <div className="p-6 rounded-3xl bg-zinc-900 border border-amber-500/60 text-center space-y-3">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                Debate Concluded · Decision Report Synthesized
              </span>
              <p className="text-sm text-zinc-200">
                The Judge Agent has compiled the final policy decision report with full source traceabilities.
              </p>
              <button
                onClick={() => setShowJudgmentTree(true)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Inspect Expandable Judgment Tree
              </button>
            </div>
          )}

          {/* Expandable Judgment Tree Drawer */}
          {showJudgmentTree && session.decision_report && (
            <div className="p-8 rounded-3xl bg-zinc-900 border border-cyan-500/50 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" /> Expandable Judgment Tree & Synthesis
                </h3>
                <span className="text-xs font-mono text-zinc-400">Zero-Hallucination Verified</span>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <strong className="text-cyan-400 font-mono block mb-1">Executive Summary:</strong>
                  <p className="text-zinc-300 leading-relaxed">{session.decision_report.executive_summary}</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <strong className="text-emerald-400 font-mono block mb-1">Recommended Policy:</strong>
                  <p className="text-zinc-200 leading-relaxed font-bold">{session.decision_report.recommended_policy}</p>
                </div>

                {/* Hierarchical Tree Nodes */}
                <div className="space-y-3 pt-2">
                  <strong className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
                    Claim Verification Traceability Tree:
                  </strong>

                  {session.decision_report.judgment_tree?.nodes?.map((node: any) => (
                    <div key={node.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div
                        onClick={() => toggleNode(node.id)}
                        className="flex items-center justify-between cursor-pointer text-white font-bold"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronRight className={`w-4 h-4 text-cyan-400 transition-transform ${expandedNodes[node.id] ? 'rotate-90' : ''}`} />
                          {node.label}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">Expand Reasoning</span>
                      </div>

                      {expandedNodes[node.id] && (
                        <div className="pl-6 space-y-3 pt-2 border-l border-zinc-800">
                          <p className="text-zinc-300">{node.content}</p>
                          
                          {node.children?.map((child: any) => (
                            <div key={child.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                              <span className="font-bold text-amber-300 block">{child.label}</span>
                              <p className="text-zinc-400">{child.content}</p>
                              <span className="text-[10px] font-mono text-cyan-400 block pt-1">
                                📌 Source Citation: [{child.source}] - {child.source_title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* What-If Constraint Injector Modal */}
      {showWhatIfModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-zinc-900 border border-amber-500/50 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Inject Mid-Debate Constraint
            </h3>
            <p className="text-xs text-zinc-400">
              Introduce a sudden parameter change. Agents will adapt their next round arguments accordingly.
            </p>
            <input
              type="text"
              placeholder="e.g. Budget cut by 40% / Field survey window reduced to 15 days"
              value={whatIfInput}
              onChange={(e) => setWhatIfInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWhatIfModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleInjectConstraint}
                className="px-5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Inject & Trigger Next Round
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
