'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Scale, MessageSquare, Sparkles, Shield, AlertTriangle, 
  ChevronRight, CheckCircle2, Award, Zap, HelpCircle, Layers, 
  LogIn, RefreshCw, FileText, Eye, Users, Send, ArrowRight, BookOpen, Check, Play
} from 'lucide-react';
import { authFetch, getAccessToken, getApiBaseUrl } from '../utils/api';
import { AuthModal } from '../components/AuthModal';

interface Perspective {
  id: number;
  name: string;
  role: string;
  avatar_color: string;
  primary_concern: string;
  objective?: string;
  position: string;
  relevant_evidence?: string;
  source_page?: number | null;
  key_questions?: string[];
}

interface DecisionOption {
  id: string;
  label: string;
  description: string;
}

interface ScenarioDetail {
  id: number;
  title: string;
  version: number;
  category: string;
  difficulty: string;
  source_type: string;
  source_label: string;
  situation: string;
  decision_question: string;
  objective: string;
  constraints: string[];
  affected_people: string[];
  risks: string[];
  options: DecisionOption[];
  perspectives: Perspective[];
}

interface SimulationSession {
  session_id: number;
  scenario_id: number;
  scenario_title: string;
  version: number;
  status: string;
}

interface DialogueTurn {
  speaker: 'LEARNER' | 'PERSPECTIVE';
  message: string;
  turn_number: number;
}

export default function NeetiVivaadPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [scenarioDetail, setScenarioDetail] = useState<ScenarioDetail | null>(null);
  
  // Simulation Flow States
  const [step, setStep] = useState<'catalog' | 'perspectives' | 'discussion' | 'decision' | 'evaluation'>('catalog');
  const [session, setSession] = useState<SimulationSession | null>(null);
  
  // Discussion Turn States
  const [activePerspective, setActivePerspective] = useState<Perspective | null>(null);
  const [dialogueTurns, setDialogueTurns] = useState<DialogueTurn[]>([]);
  const [learnerInput, setLearnerInput] = useState('');
  const [sendingTurn, setSendingTurn] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [isFinalTurn, setIsFinalTurn] = useState(false);

  // Decision & Reasoning States
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // UI & Auth States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTitle, setAuthModalTitle] = useState('Sign in to practise this scenario');
  const [authModalMessage, setAuthModalMessage] = useState('Sign in to explore stakeholder perspectives, engage in dialogue, and make an evidence-backed decision.');

  useEffect(() => {
    setIsAuth(!!getAccessToken());
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    const base = getApiBaseUrl();
    try {
      const res = await fetch(`${base}/api/debate/scenarios/`);
      const d = await res.json();
      setScenarios(d.scenarios || []);
      if (d.scenarios?.length > 0) {
        loadScenarioDetails(d.scenarios[0].id);
      }
    } catch {
      setScenarios([]);
    }
  };

  const loadScenarioDetails = async (scenarioId: number) => {
    setSelectedScenarioId(scenarioId);
    setLoading(true);
    const base = getApiBaseUrl();
    try {
      const res = await fetch(`${base}/api/debate/scenarios/${scenarioId}/`);
      if (res.ok) {
        const d = await res.json();
        setScenarioDetail(d);
        if (d.perspectives && d.perspectives.length > 0) {
          setActivePerspective(d.perspectives[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Start authenticated simulation session
  const handleStartSimulation = async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthModalTitle("Sign in to Practise Policy Decision");
      setAuthModalMessage("Sign in to engage in structured dialogue with stakeholders and submit your reasoned policy decision.");
      setAuthModalOpen(true);
      return;
    }

    if (!selectedScenarioId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/debate/sessions/start/', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: selectedScenarioId })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to start simulation.');

      setSession(d);
      setStep('perspectives');
      setDialogueTurns([]);
      setTurnCount(0);
      setIsFinalTurn(false);
      setSelectedOption(null);
      setReasoning('');
      setEvaluationResult(null);
    } catch (e: any) {
      setError(e.message || 'Error starting simulation.');
    } finally {
      setLoading(false);
    }
  };

  // Advance to Discussion step
  const handleEnterDiscussion = (persp?: Perspective) => {
    if (persp) setActivePerspective(persp);
    setStep('discussion');
  };

  // Send turn in interactive discussion
  const handleSendTurn = async () => {
    if (!session || !activePerspective || !learnerInput.trim() || sendingTurn) return;

    const userMsg = learnerInput.trim();
    setLearnerInput('');
    setSendingTurn(true);
    setError(null);

    // Optimistically add user turn
    const currentTurnNum = turnCount + 1;
    setDialogueTurns(prev => [...prev, { speaker: 'LEARNER', message: userMsg, turn_number: currentTurnNum }]);

    try {
      const res = await authFetch(`/api/debate/sessions/${session.session_id}/turn/`, {
        method: 'POST',
        body: JSON.stringify({
          perspective_id: activePerspective.id,
          message: userMsg
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to get perspective response.');

      setDialogueTurns(prev => [
        ...prev,
        { speaker: 'PERSPECTIVE', message: d.reply, turn_number: currentTurnNum }
      ]);
      setTurnCount(d.learner_turn_number);
      if (d.is_final_turn) {
        setIsFinalTurn(true);
      }
    } catch (e: any) {
      setError(e.message || 'Error in discussion turn.');
    } finally {
      setSendingTurn(false);
    }
  };

  // Submit Final Decision & Reasoning
  const handleSubmitDecision = async () => {
    if (!session || !selectedOption) return;
    if (reasoning.trim().length < 20) {
      setError('Please provide at least 20 characters explaining your policy rationale and trade-offs.');
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const res = await authFetch(`/api/debate/sessions/${session.session_id}/decide/`, {
        method: 'POST',
        body: JSON.stringify({
          selected_option_id: selectedOption.id,
          selected_option_label: selectedOption.label,
          reasoning: reasoning.trim()
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to evaluate decision.');

      setEvaluationResult(d.evaluation);
      setStep('evaluation');

      // Dispatch event to Buddy if available
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buddy-guidance', {
          detail: {
            type: 'vivaad_evaluated',
            message: `You completed your policy decision simulation with an overall score of ${d.evaluation.overall_score}%.`
          }
        }));
      }
    } catch (e: any) {
      setError(e.message || 'Error submitting decision.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-8 font-sans">
      
      {/* Top Banner */}
      <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 sm:p-10 shadow-brutal-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#061120] border-2 border-[#111111] text-[#FCD34D] text-xs font-mono shadow-brutal-sm">
            <Scale className="w-3.5 h-3.5 text-[#F2A900]" />
            <span className="font-bold uppercase tracking-wider">
              {isAuth ? 'POLICY DECISION SIMULATION' : '★ PUBLIC SHOWCASE &bull; EXPLORE REAL POLICY SCENARIOS'}
            </span>
          </div>
          <h1 className="display-section text-white">
            NEETI VIVAAD
          </h1>
          <p className="text-xs sm:text-sm text-zinc-200 font-mono font-medium">
            Enter real public-sector situations, examine conflicting perspectives, consider evidence, make a reasoned decision, and receive structured multi-criteria feedback.
          </p>

          {!isAuth && (
            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 rounded-xl bg-white border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] shadow-brutal-sm">
                ★ PREVIEW MODE — Anyone can explore scenarios & stakeholder viewpoints. Sign in to engage in dialogue and evaluate your decision.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/debate/studio"
            className="btn-brutal-saffron !text-xs !py-2.5 !px-4 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Scenario Studio</span>
          </Link>
        </div>
      </div>

      {/* Error Message */}
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

      {/* MAIN CONTENT AREA */}
      {step === 'catalog' && (
        /* STEP 1: SCENARIO CATALOG & SELECTION */
        <div className="space-y-6">
          <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="badge-starburst badge-starburst-saffron text-xs">
                ★ AVAILABLE POLICY SCENARIOS
              </span>
              <h2 className="font-display font-extrabold uppercase text-xl text-[#111111] mt-1">
                Select a Policy Situation to Explore
              </h2>
              <p className="text-xs text-[#4B5563]">
                Each scenario tests balancing administrative velocity, statutory privacy, and public accountability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((sc: any) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => loadScenarioDetails(sc.id)}
                    className={`p-5 rounded-2xl border-2 border-[#111111] cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-[#F2A900] text-[#111111] shadow-brutal-sm' 
                        : 'bg-[#F8F7F2] text-[#111111] hover:bg-zinc-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-[#111111]">
                          {sc.category || 'Policy'}
                        </span>
                        <span className="text-[10px] font-mono font-bold">
                          {sc.source_label || 'Case Study'}
                        </span>
                      </div>
                      <h3 className="font-display font-extrabold uppercase text-sm mb-2 line-clamp-2">
                        {sc.title}
                      </h3>
                      <p className="text-xs leading-relaxed opacity-90 line-clamp-3 mb-4">
                        {sc.situation_summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#111111]/20 flex items-center justify-between text-[11px] font-mono font-bold">
                      <span>{sc.perspective_count || 4} Stakeholders</span>
                      <span className="flex items-center gap-1">Select <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenario Overview Details Card */}
          {scenarioDetail && (
            <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#111111]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-[#111111]">
                    {scenarioDetail.category} &bull; {scenarioDetail.difficulty} (v{scenarioDetail.version})
                  </span>
                  <h2 className="font-display font-black uppercase text-xl text-[#111111] mt-2">
                    {scenarioDetail.title}
                  </h2>
                </div>
                <button
                  onClick={handleStartSimulation}
                  disabled={loading}
                  className="btn-brutal-emerald !text-sm !py-3 !px-6 flex items-center gap-2 self-start sm:self-auto shrink-0"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Policy Simulation</span>
                </button>
              </div>

              {/* Dilemma Question Callout */}
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-[#111111] shadow-brutal-sm">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-900 block mb-1">
                  Core Policy Decision Dilemma
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {scenarioDetail.decision_question}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Situation Description */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="font-display font-extrabold uppercase text-xs text-slate-700">
                    Administrative Situation & Context
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                    {scenarioDetail.situation}
                  </p>

                  <div className="pt-2">
                    <h5 className="font-display font-bold uppercase text-[11px] text-slate-500 mb-2">
                      Key Operational Constraints
                    </h5>
                    <ul className="space-y-1.5">
                      {scenarioDetail.constraints?.map((c, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-emerald-700 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Affected Stakeholders Preview */}
                <div className="space-y-3 bg-[#F8F7F2] p-4 rounded-xl border-2 border-[#111111]">
                  <h4 className="font-display font-extrabold uppercase text-xs text-slate-700">
                    Civil Service Perspectives ({scenarioDetail.perspectives?.length || 0})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    You will hear and deliberate with these viewpoints during the simulation:
                  </p>
                  <div className="space-y-2">
                    {scenarioDetail.perspectives?.map((p) => (
                      <div key={p.id} className="p-2.5 bg-white border border-[#111111] rounded-lg text-xs">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] font-mono text-emerald-800 font-bold">{p.role}</div>
                        <div className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">"{p.primary_concern}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: STAKEHOLDER PERSPECTIVES BREAKDOWN */}
      {step === 'perspectives' && scenarioDetail && (
        <div className="space-y-6">
          <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="badge-starburst badge-starburst-saffron text-xs">
                  ★ STEP 1: HEAR STAKEHOLDER PERSPECTIVES
                </span>
                <h2 className="font-display font-extrabold uppercase text-xl text-[#111111] mt-1">
                  Examine Competing Priorities & Arguments
                </h2>
                <p className="text-xs text-[#4B5563]">
                  Review the arguments and source evidence from each stakeholder before entering interactive discussion.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('catalog')}
                  className="px-3 py-2 border-2 border-[#111111] rounded-xl text-xs font-mono font-bold hover:bg-slate-100"
                >
                  Change Scenario
                </button>
                <button
                  onClick={() => handleEnterDiscussion()}
                  className="btn-brutal-primary !text-xs !py-2.5 !px-5 flex items-center gap-2"
                >
                  <span>Start Discussion (2-4 Turns)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Perspectives Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarioDetail.perspectives?.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl border-2 border-[#111111] bg-[#F8F7F2] flex flex-col justify-between shadow-brutal-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#111111]">
                        {p.role}
                      </span>
                      {p.source_page && (
                        <span className="text-[10px] font-mono font-bold text-emerald-800">
                          Source Page {p.source_page}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-extrabold uppercase text-base text-slate-900 mb-1">
                      {p.name}
                    </h3>
                    <div className="text-xs font-bold text-emerald-900 mb-3">
                      Priority: {p.primary_concern}
                    </div>

                    <p className="text-xs text-slate-800 italic bg-white p-3 rounded-xl border border-[#111111] mb-3 leading-relaxed">
                      "{p.position}"
                    </p>

                    {p.relevant_evidence && (
                      <div className="text-[11px] text-slate-600 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-300 mb-3">
                        <span className="font-bold text-emerald-950">Statutory / Document Evidence: </span>
                        {p.relevant_evidence}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#111111]/20 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {p.key_questions?.length || 0} Challenge Questions
                    </span>
                    <button
                      onClick={() => handleEnterDiscussion(p)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#111111] rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      Debate This Role
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONTROLLED INTERACTIVE DISCUSSION (2-4 TURNS) */}
      {step === 'discussion' && activePerspective && scenarioDetail && (
        <div className="space-y-6">
          <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#111111]">
              <div>
                <span className="badge-starburst badge-starburst-saffron text-xs">
                  ★ STEP 2: CONTROLLED POLICY DIALOGUE
                </span>
                <h2 className="font-display font-extrabold uppercase text-xl text-[#111111] mt-1">
                  Discussing with {activePerspective.name} ({activePerspective.role})
                </h2>
                <p className="text-xs text-[#4B5563]">
                  Turn {turnCount} of 3. Address their concerns and test your arguments before making your decision.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('decision')}
                  className="btn-brutal-emerald !text-xs !py-2.5 !px-4 flex items-center gap-1.5"
                >
                  <span>Proceed to Decision</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stakeholder Switcher */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 py-1 mr-1">Switch Perspective:</span>
              {scenarioDetail.perspectives?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePerspective(p)}
                  className={`text-xs px-3 py-1 rounded-lg border font-mono font-bold transition ${
                    activePerspective.id === p.id 
                      ? 'bg-[#0B1F3A] text-white border-[#111111]' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {p.role}
                </button>
              ))}
            </div>

            {/* Dialogue Transcript Container */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto p-4 bg-[#F8F7F2] rounded-2xl border-2 border-[#111111]">
              {/* Initial Stakeholder Opening Statement */}
              <div className="p-4 bg-white border-2 border-[#111111] rounded-xl shadow-brutal-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">
                    {activePerspective.name} &bull; Opening Stance
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Official Record</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  "{activePerspective.position}"
                </p>
                {activePerspective.key_questions && activePerspective.key_questions.length > 0 && (
                  <p className="text-xs text-slate-600 font-medium pt-1">
                    <strong>Challenge: </strong>{activePerspective.key_questions[0]}
                  </p>
                )}
              </div>

              {/* Dynamic Turn History */}
              {dialogueTurns.map((turn, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl border-2 border-[#111111] text-xs leading-relaxed ${
                    turn.speaker === 'LEARNER' 
                      ? 'bg-blue-50 ml-6 border-blue-900 shadow-brutal-sm' 
                      : 'bg-white mr-6 shadow-brutal-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {turn.speaker === 'LEARNER' ? 'You (Policy Officer)' : `${activePerspective.role}`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Turn {turn.turn_number}</span>
                  </div>
                  <p className="text-slate-900">{turn.message}</p>
                </div>
              ))}

              {sendingTurn && (
                <div className="p-3 bg-white border border-[#111111] rounded-xl text-xs text-slate-500 italic flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{activePerspective.name} is formulating their response based on policy precedent...</span>
                </div>
              )}
            </div>

            {/* Turn Input Bar */}
            {!isFinalTurn ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={learnerInput}
                    onChange={(e) => setLearnerInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendTurn(); }}
                    placeholder={`Address ${activePerspective.role}'s concern or propose an operational mitigation...`}
                    disabled={sendingTurn}
                    className="flex-1 text-xs p-3 border-2 border-[#111111] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                  />
                  <button
                    onClick={handleSendTurn}
                    disabled={sendingTurn || !learnerInput.trim()}
                    className="btn-brutal-primary !text-xs !py-3 !px-5 flex items-center gap-2"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Dialogue is structured to test conciseness and evidence use (max 3 turns).</span>
                  <button
                    onClick={() => setStep('decision')}
                    className="text-emerald-800 font-bold hover:underline"
                  >
                    Skip to Decision &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border-2 border-[#111111] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-950">Dialogue Concluded</h4>
                  <p className="text-[11px] text-amber-900">
                    You have completed the discussion rounds. You are ready to make and justify your final policy decision.
                  </p>
                </div>
                <button
                  onClick={() => setStep('decision')}
                  className="btn-brutal-emerald !text-xs !py-2.5 !px-4 flex items-center gap-1.5"
                >
                  <span>Proceed to Final Decision</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: DECISION & REASONING SUBMISSION */}
      {step === 'decision' && scenarioDetail && (
        <div className="space-y-6">
          <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="badge-starburst badge-starburst-saffron text-xs">
                ★ STEP 3: SUBMIT POLICY DECISION & REASONING
              </span>
              <h2 className="font-display font-extrabold uppercase text-xl text-[#111111] mt-1">
                Select Your Policy Action & Explain Your Reasoning
              </h2>
              <p className="text-xs text-[#4B5563]">
                There is no dogmatic single right answer. You will be evaluated across evidence use, risk awareness, people impact, and ethical balance.
              </p>
            </div>

            {/* Decision Dilemma */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-[#111111]">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
                Decision Dilemma
              </span>
              <p className="text-sm font-bold text-slate-900">
                {scenarioDetail.decision_question}
              </p>
            </div>

            {/* Options Radio List */}
            <div className="space-y-3">
              <h4 className="font-display font-bold uppercase text-xs text-slate-700">
                Select One Policy Direction:
              </h4>
              {scenarioDetail.options?.map((opt) => {
                const isSelected = selectedOption?.id === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOption(opt)}
                    className={`p-4 rounded-xl border-2 border-[#111111] cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected 
                        ? 'bg-amber-50 border-amber-800 shadow-brutal-sm ring-1 ring-amber-600' 
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 border-[#111111] flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#0B1F3A] text-white' : 'bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 mb-1">{opt.label}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mandatory Reasoning Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-display font-bold uppercase text-xs text-slate-700">
                  Explain Your Policy Rationale & Mitigation Strategy <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Minimum 20 characters ({reasoning.length} entered)
                </span>
              </div>
              <textarea
                rows={5}
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Detail why you chose this option, how you mitigate stakeholder risks (e.g. privacy, field burden, citizen exclusion), and what evidence from the scenario supports this..."
                className="w-full text-xs p-3.5 border-2 border-[#111111] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
              />
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#111111]">
              <button
                onClick={() => setStep('discussion')}
                className="px-4 py-2 text-xs font-mono font-bold text-slate-600 hover:text-slate-900"
              >
                &larr; Back to Discussion
              </button>

              <button
                onClick={handleSubmitDecision}
                disabled={evaluating || !selectedOption || reasoning.trim().length < 20}
                className="btn-brutal-emerald !text-xs !py-3 !px-6 flex items-center gap-2 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Multi-Criteria Reasoning...
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" /> Submit Decision for Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: STRUCTURED 6-CRITERIA EVALUATION RESULT */}
      {step === 'evaluation' && evaluationResult && scenarioDetail && (
        <div className="space-y-6">
          <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#111111]">
              <div>
                <span className="badge-starburst badge-starburst-emerald text-xs">
                  ★ SIMULATION COMPLETE &bull; EVALUATION REPORT
                </span>
                <h2 className="font-display font-black uppercase text-xl text-[#111111] mt-1">
                  Policy Decision Evaluation & Learning Feedback
                </h2>
                <p className="text-xs text-[#4B5563]">
                  Scenario: {scenarioDetail.title} (v{scenarioDetail.version})
                </p>
              </div>

              {/* Overall Score Badge */}
              <div className="p-4 bg-[#0B1F3A] text-white rounded-2xl border-2 border-[#111111] shadow-brutal-sm text-center">
                <div className="text-[10px] font-mono uppercase text-[#FCD34D] font-bold">Overall Score</div>
                <div className="text-2xl font-black">{evaluationResult.overall_score}%</div>
              </div>
            </div>

            {/* 6 Multi-Criteria Evaluation Meters */}
            <div className="space-y-3">
              <h4 className="font-display font-extrabold uppercase text-xs text-slate-700">
                Multi-Criteria Dimension Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(evaluationResult.criteria_scores || {}).map(([dim, score]: [string, any]) => (
                  <div key={dim} className="p-3.5 bg-[#F8F7F2] border-2 border-[#111111] rounded-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 capitalize mb-1.5">
                      <span>{dim.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-emerald-800">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Feedback Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* What You Did Well */}
              <div className="p-5 bg-emerald-50 border-2 border-emerald-900 rounded-2xl space-y-2">
                <h4 className="font-display font-bold uppercase text-xs text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> What You Handled Well
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-line font-sans">
                  {evaluationResult.what_you_did_well}
                </p>
              </div>

              {/* Try Next Time / Opportunities */}
              <div className="p-5 bg-amber-50 border-2 border-amber-900 rounded-2xl space-y-2">
                <h4 className="font-display font-bold uppercase text-xs text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" /> Opportunities for Next Time
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line font-sans">
                  {evaluationResult.try_next_time}
                </p>
              </div>
            </div>

            {/* Trade-offs Analysis */}
            {evaluationResult.tradeoffs_analysis && (
              <div className="p-5 bg-slate-50 border-2 border-[#111111] rounded-2xl space-y-2">
                <h4 className="font-display font-bold uppercase text-xs text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-700" /> Policy Trade-off Analysis
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                  {evaluationResult.tradeoffs_analysis}
                </p>
              </div>
            )}

            {/* Source-Backed Notes */}
            {evaluationResult.source_backed_notes && (
              <div className="p-4 bg-white border border-[#111111] rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Source Precedent & Grounding: </span>
                  {evaluationResult.source_backed_notes}
                </div>
              </div>
            )}

            {/* Next Steps Buttons */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#111111]">
              <button
                onClick={() => { setStep('catalog'); setSelectedOption(null); setReasoning(''); }}
                className="btn-brutal-primary !text-xs !py-2.5 !px-5 flex items-center gap-1.5"
              >
                <span>Try Another Scenario</span>
              </button>

              <Link
                href="/dashboard"
                className="btn-brutal-emerald !text-xs !py-2.5 !px-5 flex items-center gap-1.5"
              >
                <span>View Skill Growth &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sign-in Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalTitle}
        message={authModalMessage}
        returnUrl="/debate"
      />
    </div>
  );
}
