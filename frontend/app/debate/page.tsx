'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, Play, Sparkles, Scale, Shield, AlertTriangle, 
  ChevronRight, ChevronDown, CheckCircle2, Award, Zap, HelpCircle, Layers, LogIn, RefreshCcw, FileText, Eye
} from 'lucide-react';
import { authFetch, getAccessToken, getApiBaseUrl } from '../utils/api';
import { AuthModal } from '../components/AuthModal';

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

  // Auth & Preview States
  const [isAuth, setIsAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTitle, setAuthModalTitle] = useState('Sign in to practise this scenario');
  const [authModalMessage, setAuthModalMessage] = useState('Sign in to practise this scenario, explore trade-offs, and improve your decision-making skills.');

  const stakeholderPreviews = [
    {
      role: "Senior Statistical Officer (SSO)",
      badge: "Statistical Methodology",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-800",
      perspective: "Data integrity and sampling margins cannot be compromised under field pressure. Automated anomaly detection and 95% confidence intervals are legally binding.",
      source: "MoSPI IDQF 2024 Guidelines, Section 1"
    },
    {
      role: "Data Protection Officer (DPO)",
      badge: "Privacy & Compliance",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-800",
      perspective: "Citizen biometric tokens and Aadhaar data must remain masked under k-anonymity (k>=5). Administrative expediency cannot override statutory privacy protections.",
      source: "Digital Personal Data Protection (DPDP) Act 2023"
    },
    {
      role: "Field Enumerator (FE)",
      badge: "Ground Operations",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-800",
      perspective: "Rural terrain and weak server connectivity cause real public distress. Field teams urgently need verified offline-first fallback modes to maintain public trust.",
      source: "District Survey Administration SOP & Field Guidelines"
    },
    {
      role: "Public Advocate (PA)",
      badge: "Accountability & Rights",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-800",
      perspective: "No eligible citizen should be denied rightful benefits due to technical or biometric failure. Grievance redressal must be immediate, human-accessible, and transparent.",
      source: "Citizen Charter & Public Service Guarantee Act"
    }
  ];

  useEffect(() => {
    setIsAuth(!!getAccessToken());
    const base = getApiBaseUrl();
    fetch(`${base}/api/debate/scenarios/`)
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
      setAuthModalTitle("Sign in to practise this scenario");
      setAuthModalMessage("Sign in to practise this scenario, explore trade-offs, and improve your decision-making skills.");
      setAuthModalOpen(true);
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
      if (d.decision_report && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buddy-guidance', {
          detail: {
            type: 'debate_completed',
            message: "Good thinking. You've completed the scenario. Let's look at your decision and what you considered."
          }
        }));
      }
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
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 sm:p-10 shadow-brutal-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#061120] border-2 border-[#111111] text-[#FCD34D] text-xs font-mono shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
            <span className="font-bold uppercase tracking-wider">
              {isAuth ? 'PRACTICAL DECISION EXERCISE &bull; 4 VIEWPOINTS' : '★ PREVIEW MODE &bull; 4 VIEWPOINTS'}
            </span>
          </div>
          <h1 className="display-section text-white">
            NEETI VIVAAD
          </h1>
          <p className="text-xs sm:text-sm text-zinc-200 font-mono font-medium">
            Explore complex government decisions with 4 different perspectives based on trusted sources.
          </p>

          {!isAuth && (
            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 rounded-xl bg-white border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] shadow-brutal-sm">
                ★ PREVIEW MODE — Sign in to start the interactive decision exercise and test policy scenarios.
              </span>
            </div>
          )}
        </div>

        {session && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWhatIfModal(true)}
              className="btn-brutal-saffron !text-xs !py-2.5 !px-4 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Add a Scenario Twist</span>
            </button>

            {session.decision_report && (
              <button
                onClick={() => setShowJudgmentTree(!showJudgmentTree)}
                className="btn-brutal-emerald !text-xs !py-2.5 !px-4 flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{showJudgmentTree ? 'Hide Summary' : 'Decision Summary'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="card-brutal bg-rose-100 border-2 border-[#111111] text-rose-950 p-4 text-xs font-mono flex items-center justify-between shadow-brutal-sm">
          <span>{error}</span>
          {!isAuth && (
            <button
              onClick={() => {
                setAuthModalTitle("Sign in to Neeti Vivaad");
                setAuthModalMessage("Sign in to participate in practical decision exercises and test real policy scenarios.");
                setAuthModalOpen(true);
              }}
              className="btn-brutal-primary !text-xs !py-1.5 !px-3"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {!session ? (
        /* Scenario Selection Screen */
        <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="badge-starburst badge-starburst-saffron text-xs">
              ★ SELECT A POLICY SCENARIO
            </span>
            <h2 className="font-display font-extrabold uppercase text-xl text-[#111111] mt-1">
              Choose a Real-World Situation to Explore
            </h2>
            <p className="text-xs text-[#4B5563]">
              Select a scenario to see how different government stakeholders approach this problem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((sc: any) => {
              const isSelected = selectedScenarioId === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`p-5 rounded-2xl border-2 border-[#111111] cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-[#F2A900] text-[#111111] shadow-brutal-sm' 
                      : 'bg-[#F8F7F2] text-[#111111] hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase block mb-1">
                    Scenario #{sc.id} &bull; {sc.category || 'Policy Situation'}
                  </span>
                  <h3 className="font-display font-extrabold uppercase text-base mb-2">
                    {sc.title}
                  </h3>
                  <p className="text-xs leading-relaxed opacity-90">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 4 Stakeholder Perspectives Preview (Shown for visitors in Preview Mode) */}
          {!isAuth && (
            <div className="space-y-4 pt-4 border-t-2 border-[#111111]">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="badge-starburst badge-starburst-navy text-[11px]">
                    ★ 4 STAKEHOLDER PERSPECTIVES (PREVIEW)
                  </span>
                  <h3 className="font-display font-bold uppercase text-base text-[#111111] mt-1">
                    How Different Stakeholders Approach This Problem
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-[#0B1F3A] text-white">
                  Preview Mode
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stakeholderPreviews.map((st, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] space-y-2.5 shadow-brutal-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#111111] text-white">
                        {st.role}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${st.badgeColor}`}>
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[#111111] leading-relaxed italic border-l-3 border-[#F2A900] pl-2.5">
                      &ldquo;{st.perspective}&rdquo;
                    </p>
                    <div className="text-[10px] font-mono text-[#0F766E] font-bold">
                      Source: {st.source}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-center gap-2 text-xs font-mono">
                <Sparkles className="w-4 h-4 text-[#F2A900] shrink-0" />
                <span className="font-bold">
                  Sign in to interact with all 4 agents, inject real-world constraints, and generate complete decision reports.
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleStartDebate}
            disabled={loading}
            className="btn-brutal-primary w-full !text-sm !py-3.5 flex items-center justify-center gap-2 font-bold"
          >
            {loading ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>Preparing Decision Perspectives...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isAuth ? 'Start Decision Exercise' : 'Start Decision Exercise (Sign In to Practise)'}</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Debate Arena Session */
        <div className="space-y-8">
          
          {/* Active Round Indicator */}
          <div className="card-brutal bg-white p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="badge-starburst badge-starburst-emerald text-xs">
                ★ ROUND {session.current_round} OF 3
              </span>
              <h3 className="font-display font-bold uppercase text-base text-[#111111]">
                {session.round_name || 'Stakeholder Perspectives'}
              </h3>
            </div>

            {session.active_constraint && (
              <span className="badge-starburst badge-starburst-saffron text-[10px]">
                TWIST: {session.active_constraint}
              </span>
            )}

            <button
              onClick={handleNextRound}
              disabled={loading}
              className="btn-brutal-primary !text-xs !py-2 !px-4"
            >
              {loading ? 'Updating...' : 'Next Round →'}
            </button>
          </div>

          {/* 4 Agent Arguments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(session.arguments || []).map((arg: any, idx: number) => (
              <div 
                key={idx}
                className="card-brutal bg-white p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded bg-[#111111] text-white">
                      {arg.persona_role}
                    </span>
                    <span className="text-xs font-mono text-[#0F766E] font-bold">
                      {arg.evidence_source ? `Source: ${arg.evidence_source}` : 'Trusted Source'}
                    </span>
                  </div>

                  <p className="text-sm font-sans text-[#111111] leading-relaxed border-l-3 border-[#F2A900] pl-3 italic">
                    &ldquo;{arg.argument_text}&rdquo;
                  </p>
                </div>

                {arg.fallacy_tag && (
                  <div className="pt-3 border-t-2 border-[#111111] flex items-center justify-between text-xs font-mono text-amber-800">
                    <span className="font-bold">⚠️ Reasoning Note:</span>
                    <span>{arg.fallacy_tag}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Fallacy Hunter Challenge */}
          {session.fallacy_challenge && !fallacyAnswered && (
            <div className="card-brutal bg-[#F2A900] text-[#111111] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="badge-starburst badge-starburst-navy text-xs">
                  ★ REASONING CHALLENGE
                </span>
                <span className="text-xs font-mono font-bold uppercase">
                  Spot the flaw in this argument
                </span>
              </div>

              <h4 className="font-display font-extrabold uppercase text-base">
                {session.fallacy_challenge.question}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(session.fallacy_challenge.options || []).map((opt: string, oIdx: number) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleAnswerFallacy(oIdx)}
                    className="p-3 rounded-xl border-2 border-[#111111] bg-white hover:bg-zinc-50 text-left font-display font-bold text-xs shadow-brutal-sm transition-all"
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {fallacyResult && (
            <div className="card-brutal bg-white p-5 text-xs font-mono space-y-1">
              <span className={`font-bold block ${fallacyResult.is_correct ? 'text-[#0F766E]' : 'text-[#C0392B]'}`}>
                {fallacyResult.is_correct ? '✓ Correct! You spotted the flaw.' : '✗ Not quite. Keep practicing!'}
              </span>
              <p className="text-[#111111] font-medium">{fallacyResult.explanation}</p>
            </div>
          )}

          {/* Expandable Decision Summary */}
          {showJudgmentTree && session.decision_report && (
            <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <span className="badge-starburst badge-starburst-saffron text-xs">
                  ★ DECISION SUMMARY
                </span>
                <span className="text-xs font-mono text-zinc-300 font-bold">
                  Balanced Recommendation
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-[#111111]">
                <div className="p-4 rounded-xl bg-white border-2 border-[#111111] space-y-2">
                  <span className="font-bold text-[#0F766E] uppercase block">RECOMMENDED APPROACH</span>
                  <p className="text-sm font-sans font-medium text-[#111111]">
                    {session.decision_report.recommendation || 'Proceed with Stratified Sample Trimming supported by differential privacy masking.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* What-If Modal */}
      {showWhatIfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-brutal bg-white p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150 text-[#111111]">
            <div className="flex items-center justify-between">
              <span className="badge-starburst badge-starburst-saffron text-xs">
                ★ ADD A SCENARIO TWIST
              </span>
              <button 
                onClick={() => setShowWhatIfModal(false)}
                className="text-xs font-mono font-bold text-[#111111] hover:text-black"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[#111111] font-medium">
              Introduce a real-world constraint to test how decision makers adjust (e.g. &ldquo;Vehicle survey costs increase by 30% due to fuel price changes&rdquo;).
            </p>

            <textarea
              rows={3}
              value={whatIfInput}
              onChange={e => setWhatIfInput(e.target.value)}
              placeholder="Describe the new situation or constraint..."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
            />

            <button
              onClick={handleInjectConstraint}
              className="btn-brutal-primary w-full !text-xs !py-3 font-bold"
            >
              Add Twist &amp; Update Discussion
            </button>
          </div>
        </div>
      )}

      {/* Auth Gate Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalTitle}
        message={authModalMessage}
        returnUrl={`/debate${selectedScenarioId ? `?scenario=${selectedScenarioId}` : ''}`}
      />

    </div>
  );
}

