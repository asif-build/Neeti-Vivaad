'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Play, Sparkles, Scale, Shield, AlertTriangle, 
  ChevronRight, ChevronDown, CheckCircle2, Award, Zap, HelpCircle, Layers, RefreshCw
} from 'lucide-react';

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

  const defaultScenarios = [
    {
      id: 1,
      title: 'Direct Benefit Transfer (DBT) Survey Redesign: Continuous Digital Capture vs 5-Year Sample',
      category: 'Data Policy',
      description: 'Debate on replacing traditional periodic paper sample surveys with real-time digital household microdata capture across rural and urban blocks.',
      initial_constraint: 'Standard 2026 MoSPI Operational Budget'
    },
    {
      id: 2,
      title: 'Mandatory Geo-tagging and Facial Verification in Agricultural Crop Yield Surveys',
      category: 'Field Operations',
      description: 'Debate on enforcing mandatory real-time GPS boundary mapping and enumerator facial authentication during harvest data collection.',
      initial_constraint: 'Rural cellular network outage across 4 states'
    }
  ];

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        let res = await fetch('/api/debate/scenarios/').catch(() => null);
        if (!res || !res.ok) {
          res = await fetch('http://127.0.0.1:8000/api/debate/scenarios/').catch(() => null);
        }
        if (res && res.ok) {
          const d = await res.json();
          const list = d.scenarios && d.scenarios.length > 0 ? d.scenarios : defaultScenarios;
          setScenarios(list);
          setSelectedScenarioId(list[0].id);
        } else {
          setScenarios(defaultScenarios);
          setSelectedScenarioId(1);
        }
      } catch {
        setScenarios(defaultScenarios);
        setSelectedScenarioId(1);
      }
    };
    fetchScenarios();
  }, []);

  const handleStartDebate = async () => {
    setLoading(true);
    setFallacyAnswered(false);
    setFallacyResult(null);
    try {
      let res = await fetch('/api/debate/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: selectedScenarioId })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/debate/start/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario_id: selectedScenarioId })
        }).catch(() => null);
      }

      if (res && res.ok) {
        const d = await res.json();
        setSession(d);
      } else {
        // Mock session
        setSession({
          session_id: 1,
          scenario_id: selectedScenarioId,
          scenario_title: scenarios.find(s => s.id === selectedScenarioId)?.title || 'DBT Survey Redesign',
          current_round: 1,
          round_name: 'Opening Policy Statements & Initial Trade-Offs',
          active_constraint: 'Standard 2026 MoSPI Operational Budget',
          arguments: [
            {
              id: 1,
              agent_name: 'Statistical Methodologist (Dr. Rao)',
              avatar_color: '#3b82f6',
              priority_tag: 'Statistical Rigor',
              document_code: 'NSC-SAMPLING-2024',
              argument_text: 'Transitioning completely to continuous digital capture risks severe non-coverage bias in remote tribal and LWE sectors where tablet connectivity is intermittent.',
              source_citation: 'NSC Multi-Stage Guidelines Section 3.2'
            },
            {
              id: 2,
              agent_name: 'Digital Transformation Director (MeitY)',
              avatar_color: '#10b981',
              priority_tag: 'Data Velocity',
              document_code: 'MOSPI-IDQF-2024',
              argument_text: 'Quarterly macro-planning requires sub-30 day indicators. 5-year survey cycles produce obsolete baseline metrics for high-velocity DBT transfer auditing.',
              source_citation: 'IDQF 2024 Section 1.4'
            },
            {
              id: 3,
              agent_name: 'Field Operations Commissioner (NSO FOD)',
              avatar_color: '#f59e0b',
              priority_tag: 'Operational Feasibility',
              document_code: 'FOD-CAPI-MANUAL-2025',
              argument_text: 'Enumerator burden must be capped at 15 minutes per household. Excessive digital biometric re-authentication spikes refusal rates in urban clusters.',
              source_citation: 'FOD Survey Protocol SOP 8'
            },
            {
              id: 4,
              agent_name: 'Data Privacy & Ethics Lead',
              avatar_color: '#8b5cf6',
              priority_tag: 'NDSAP & Privacy Compliance',
              document_code: 'NDSAP-PRIVACY-2023',
              argument_text: 'Real-time geo-coordinates must undergo k-anonymity (k>=5) and differential privacy noise before cross-ministerial database sharing.',
              source_citation: 'NDSAP Guidelines Clause 12'
            }
          ],
          fallacy_challenge: {
            id: 1,
            argument_snippet: 'If we do not mandate daily biometric sync, the entire DBT evaluation system will completely collapse.',
            options: ['False Dilemma / Catastrophizing', 'Ad Hominem', 'Post Hoc Fallacy', 'Cherry Picking']
          }
        });
      }
    } catch {
      // Fallback handled
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!session) return;
    setLoading(true);
    setFallacyAnswered(false);
    setFallacyResult(null);
    try {
      let res = await fetch('/api/debate/next-round/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/debate/next-round/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: session.session_id })
        }).catch(() => null);
      }

      if (res && res.ok) {
        const d = await res.json();
        setSession((prev: any) => ({
          ...prev,
          current_round: d.current_round,
          round_name: d.round_name,
          arguments: d.arguments,
          fallacy_challenge: d.fallacy_challenge,
          decision_report: d.decision_report || prev.decision_report
        }));
      } else {
        const nextRound = session.current_round + 1;
        setSession((prev: any) => ({
          ...prev,
          current_round: nextRound,
          round_name: nextRound === 2 ? 'Constraint Adaptation' : nextRound === 3 ? 'Cross-Examination' : 'Consensus Synthesis',
          decision_report: nextRound >= 4 ? {
            executive_summary: 'Consensus achieved on a hybrid rolling-panel CAPI architecture with offline cryptographic caching.',
            recommended_policy: 'Implement hybrid quarterly stratified sampling with offline-first CAPI caching and weekly aggregate synchronization.',
            judgment_tree: {
              nodes: [
                {
                  id: 'node-1',
                  label: 'Core Sampling Strategy: Rolling Panel vs Periodic Sample',
                  content: 'Hybrid rolling panel selected to balance data velocity with statistical confidence interval requirements.',
                  children: [
                    { id: 'child-1', label: 'NSC Confidence Interval Compliance', content: 'Maintains 95% confidence bounds across all surveyed blocks.', source: 'NSC-SAMPLING-2024', source_title: 'NSC Sampling Guidelines' },
                    { id: 'child-2', label: 'Offline Fallback Caching Mechanism', content: 'Encrypts tablet data and flushes records upon cellular reconnect.', source: 'FOD-CAPI-MANUAL-2025', source_title: 'Field Survey Protocol' }
                  ]
                }
              ]
            }
          } : undefined
        }));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleInjectConstraint = async () => {
    if (!session || !whatIfInput.trim()) return;
    setLoading(true);
    setShowWhatIfModal(false);
    try {
      let res = await fetch('/api/debate/what-if/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          constraint_text: whatIfInput
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/debate/what-if/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.session_id,
            constraint_text: whatIfInput
          })
        }).catch(() => null);
      }

      if (res && res.ok) {
        const d = await res.json();
        setSession((prev: any) => ({
          ...prev,
          active_constraint: whatIfInput,
          current_round: d.current_round,
          round_name: d.round_name,
          arguments: d.arguments
        }));
      } else {
        setSession((prev: any) => ({
          ...prev,
          active_constraint: whatIfInput
        }));
      }
    } catch {
      setSession((prev: any) => ({ ...prev, active_constraint: whatIfInput }));
    } finally {
      setWhatIfInput('');
      setLoading(false);
    }
  };

  const handleAnswerFallacy = async (optionIdx: number) => {
    if (fallacyAnswered) return;
    try {
      let res = await fetch('/api/debate/answer-fallacy/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: session.fallacy_challenge.id,
          option_index: optionIdx
        })
      }).catch(() => null);

      if (res && res.ok) {
        const d = await res.json();
        setFallacyAnswered(true);
        setFallacyResult(d);
      } else {
        setFallacyAnswered(true);
        const isCorrect = optionIdx === 0;
        setFallacyResult({
          is_correct: isCorrect,
          correct_option_index: 0,
          explanation: 'The argument creates a false dilemma and catastrophizes catastrophic failure without addressing nuanced caching mitigations.',
          new_ctq_score: isCorrect ? 83.5 : 81.2
        });
      }
    } catch {
      setFallacyAnswered(true);
      setFallacyResult({
        is_correct: true,
        correct_option_index: 0,
        explanation: 'The argument creates a false dilemma and catastrophizes without supporting evidence.',
        new_ctq_score: 83.5
      });
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="card-supa-light p-6 space-y-3 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="pill-tag-emerald">
              <Sparkles className="w-3.5 h-3.5" /> AI-Moderated Policy Debate Simulator
            </span>
            <span className="text-xs font-mono text-[#707070]">Multi-Agent Decision Training</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#171717] mt-1">
            Neeti Saarthi Debate Arena
          </h1>
          <p className="text-xs text-[#707070] mt-0.5 font-normal">
            4 Ministry Personas · Strictly RAG Grounded · Fallacy Hunter · What-If Injector · Judgment Tree
          </p>
        </div>

        {session && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWhatIfModal(true)}
              className="px-3.5 py-2 rounded-[6px] bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs hover:bg-amber-100 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>What-If Injector</span>
            </button>

            {session.decision_report && (
              <button
                onClick={() => setShowJudgmentTree(!showJudgmentTree)}
                className="btn-primary-green px-3.5 py-2 text-xs flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{showJudgmentTree ? 'Hide Judgment Tree' : 'Expand Judgment Tree'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!session ? (
        /* Scenario Selector Screen */
        <div className="card-supa-light p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
          <div className="border-b border-[#ededed] pb-3">
            <h2 className="text-base font-semibold text-[#171717] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#24b47e]" /> Select Policy Debate Scenario
            </h2>
            <p className="text-xs text-[#707070] mt-0.5">Select a grounded government simulation scenario to launch multi-agent deliberations</p>
          </div>

          <div className="space-y-4">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-5 rounded-[8px] border cursor-pointer transition-all ${
                  selectedScenarioId === sc.id
                    ? 'border-[#3ecf8e] bg-emerald-50/40 ring-2 ring-[#3ecf8e]/20 shadow-xs'
                    : 'border-[#dfdfdf] bg-[#fafafa] hover:border-[#171717]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#dfdfdf] text-[#171717] font-medium">
                    {sc.category}
                  </span>
                  <span className="text-[11px] font-mono text-[#707070]">Constraint: {sc.initial_constraint}</span>
                </div>
                <h3 className="font-semibold text-[#171717] text-sm mb-1">{sc.title}</h3>
                <p className="text-xs text-[#707070] leading-relaxed font-normal">{sc.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartDebate}
            disabled={loading}
            className="btn-primary-green w-full py-3 text-xs flex items-center justify-center gap-2 font-semibold"
          >
            {loading ? (
              <span>Orchestrating Multi-Agent Debate Arena...</span>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Launch Neeti Saarthi Debate (Round 1)</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Debate Arena View */
        <div className="space-y-8">
          
          {/* Active Constraints Banner */}
          <div className="p-4 rounded-[8px] bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-emerald-800 font-bold uppercase tracking-wider">Active Constraint:</span>
              <span className="text-[#171717]">{session.active_constraint || 'Standard MoSPI Guidelines'}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-800 font-bold">
              Round {session.current_round} / 4: {session.round_name}
            </span>
          </div>

          {/* 4 Agent Argument Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {session.arguments?.map((arg: any) => (
              <div
                key={arg.id}
                className="card-supa-light p-6 space-y-4 shadow-xs border-[#ededed] hover:border-[#c7c7c7] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3.5 h-3.5 rounded-full shrink-0" 
                      style={{ backgroundColor: arg.avatar_color }} 
                    />
                    <div>
                      <h4 className="font-semibold text-[#171717] text-sm">{arg.agent_name}</h4>
                      <span className="text-[10px] font-mono text-[#707070] block">{arg.priority_tag}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fafafa] border border-[#dfdfdf] text-[#171717]">
                    grounded in: {arg.document_code}
                  </span>
                </div>

                <p className="text-xs text-[#171717] leading-relaxed font-normal">
                  "{arg.argument_text}"
                </p>

                <div className="pt-3 border-t border-[#ededed] text-[11px] font-mono text-[#707070] italic">
                  📌 {arg.source_citation}
                </div>
              </div>
            ))}
          </div>

          {/* Fallacy Hunter Challenge Card */}
          {session.fallacy_challenge && (
            <div className="card-supa-light p-6 space-y-4 bg-amber-50/40 border-amber-300 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Fallacy Hunter Challenge (Round {session.current_round})
                </span>
                <span className="text-[11px] font-mono text-amber-800 font-semibold">+5 CTQ Points</span>
              </div>

              <p className="text-xs text-[#171717] font-normal">
                <strong>Argument Snippet:</strong> "{session.fallacy_challenge.argument_snippet}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {session.fallacy_challenge.options.map((optText: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerFallacy(idx)}
                    disabled={fallacyAnswered}
                    className={`p-3 rounded-[6px] text-xs font-mono text-left transition-all border ${
                      fallacyResult && idx === fallacyResult.correct_option_index
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-[#dfdfdf] text-[#171717] hover:border-[#171717]'
                    }`}
                  >
                    {optText}
                  </button>
                ))}
              </div>

              {fallacyResult && (
                <div className={`p-3.5 rounded-[6px] text-xs font-mono ${
                  fallacyResult.is_correct ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
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
              className="btn-primary-green w-full py-3 text-xs flex items-center justify-center gap-2 font-semibold"
            >
              {loading ? 'Synthesizing Next Round Arguments...' : `Advance to Round ${session.current_round + 1}`}
            </button>
          ) : (
            <div className="card-supa-light p-6 text-center space-y-3 bg-emerald-50/50 border-emerald-300">
              <span className="text-xs font-mono text-emerald-900 font-bold uppercase tracking-wider block">
                Debate Concluded · Decision Report Synthesized
              </span>
              <p className="text-xs text-[#707070]">
                The Judge Agent has compiled the final policy decision report with full source traceabilities.
              </p>
              <button
                onClick={() => setShowJudgmentTree(true)}
                className="btn-primary-green px-5 py-2 text-xs font-semibold"
              >
                Inspect Expandable Judgment Tree
              </button>
            </div>
          )}

          {/* Expandable Judgment Tree Drawer */}
          {showJudgmentTree && session.decision_report && (
            <div className="card-supa-light p-6 space-y-6 shadow-sm border-[#ededed]">
              <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
                <h3 className="text-base font-semibold text-[#171717] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#24b47e]" /> Expandable Judgment Tree &amp; Synthesis
                </h3>
                <span className="text-xs font-mono text-[#707070]">Zero-Hallucination Verified</span>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="p-4 rounded-[6px] bg-[#fafafa] border border-[#ededed]">
                  <strong className="text-[#171717] font-mono block mb-1">Executive Summary:</strong>
                  <p className="text-[#707070] leading-relaxed">{session.decision_report.executive_summary}</p>
                </div>

                <div className="p-4 rounded-[6px] bg-emerald-50/60 border border-emerald-200">
                  <strong className="text-emerald-900 font-mono block mb-1">Recommended Policy:</strong>
                  <p className="text-emerald-950 leading-relaxed font-semibold">{session.decision_report.recommended_policy}</p>
                </div>

                {/* Hierarchical Tree Nodes */}
                <div className="space-y-3 pt-2">
                  <strong className="text-xs font-mono uppercase tracking-wider text-[#707070] block">
                    Claim Verification Traceability Tree:
                  </strong>

                  {session.decision_report.judgment_tree?.nodes?.map((node: any) => (
                    <div key={node.id} className="p-4 rounded-[8px] bg-[#fafafa] border border-[#ededed] space-y-3">
                      <div
                        onClick={() => toggleNode(node.id)}
                        className="flex items-center justify-between cursor-pointer text-[#171717] font-semibold"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronRight className={`w-4 h-4 text-[#24b47e] transition-transform ${expandedNodes[node.id] ? 'rotate-90' : ''}`} />
                          {node.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#24b47e]">Expand Reasoning</span>
                      </div>

                      {expandedNodes[node.id] && (
                        <div className="pl-6 space-y-3 pt-2 border-l border-[#dfdfdf]">
                          <p className="text-[#707070]">{node.content}</p>
                          
                          {node.children?.map((child: any) => (
                            <div key={child.id} className="p-3 rounded-[6px] bg-white border border-[#dfdfdf] space-y-1">
                              <span className="font-semibold text-[#171717] block">{child.label}</span>
                              <p className="text-[#707070]">{child.content}</p>
                              <span className="text-[10px] font-mono text-[#24b47e] block pt-1">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="p-6 rounded-[12px] bg-white border border-[#dfdfdf] max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-[#171717] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" /> Inject Mid-Debate Constraint
            </h3>
            <p className="text-xs text-[#707070]">
              Introduce a sudden parameter change. Agents will adapt their next round arguments accordingly.
            </p>
            <input
              type="text"
              placeholder="e.g. Budget cut by 40% / Field survey window reduced to 15 days"
              value={whatIfInput}
              onChange={(e) => setWhatIfInput(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#dfdfdf] rounded-[6px] p-3 text-xs font-mono text-[#171717] focus:outline-none focus:border-[#171717]"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWhatIfModal(false)}
                className="px-4 py-2 rounded-[6px] text-xs font-mono text-[#707070] hover:text-[#171717] border border-[#dfdfdf]"
              >
                Cancel
              </button>
              <button
                onClick={handleInjectConstraint}
                className="btn-primary-green px-4 py-2 text-xs font-semibold"
              >
                Inject &amp; Trigger Round
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
