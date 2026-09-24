'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, CheckCircle2, XCircle, Sparkles, AlertCircle, 
  ArrowRight, RefreshCw, Clock, Award, ChevronRight, FileText,
  HelpCircle, BarChart3, Check, Filter, Search
} from 'lucide-react';
import { authFetch, getAccessToken, safeJson } from '../utils/api';
import { AuthModal } from '../components/AuthModal';

interface PublishedCheck {
  id: number;
  title: string;
  difficulty: string;
  version: number;
  time_estimate_mins: number;
  question_count: number;
  subskill_id?: number;
  subskill_name?: string;
  domain_name?: string;
  published_at?: string;
}

interface RunnerOption {
  id: number;
  text: string;
}

interface RunnerQuestion {
  id: number;
  order: number;
  question_text: string;
  question_type: string;
  source_page: number;
  options: RunnerOption[];
}

interface DetailedResult {
  question_id: number;
  question_text: string;
  question_type: string;
  source_page: number;
  source_section: string;
  evidence_text: string;
  source_citation: string;
  user_selected_id: number | null;
  correct_option_id: number | null;
  correct_option_text: string;
  is_correct: boolean;
  explanation: string;
  feedback: string;
}

export default function KnowledgeCheckLearnerPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTitle, setAuthModalTitle] = useState('Sign In to Submit Knowledge Check');
  const [authModalMessage, setAuthModalMessage] = useState('Sign in to submit your answers, receive source-backed explanations, and record your competency growth.');

  // Catalog State
  const [catalog, setCatalog] = useState<PublishedCheck[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Active Runner State
  const [activeCheckId, setActiveCheckId] = useState<number | null>(null);
  const [activeCheck, setActiveCheck] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result State
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsAuth(!!getAccessToken());
    loadCatalog();
  }, []);

  // Check URL params for deep-link e.g. /quiz?checkId=5
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get('checkId');
      if (cid) {
        startCheck(Number(cid));
      }
    }
  }, []);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const res = await authFetch('/api/assessment/checks/');
      if (res.ok) {
        const data = await safeJson(res);
        setCatalog(data.checks || []);
      }
    } catch (e: any) {
      setError("Could not load available knowledge checks.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const startCheck = async (checkId: number) => {
    setLoadingCheck(true);
    setActiveCheckId(checkId);
    setCurrentQIndex(0);
    setUserAnswers({});
    setResult(null);
    setError(null);

    try {
      const res = await authFetch(`/api/assessment/checks/${checkId}/`);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to load Knowledge Check.');

      setActiveCheck(data);
    } catch (e: any) {
      setError(e.message || 'Error opening Knowledge Check.');
      setActiveCheckId(null);
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    if (result) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!activeCheckId || !activeCheck) return;

    if (!isAuth) {
      setAuthModalTitle("Sign in to submit your Knowledge Check");
      setAuthModalMessage("Sign in to verify your answers against the official document, receive detailed explanations, and update your competency progress.");
      setAuthModalOpen(true);
      return;
    }

    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === 0) {
      setError("Please answer at least one question before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId
      }));

      const res = await authFetch(`/api/assessment/checks/${activeCheckId}/submit/`, {
        method: 'POST',
        body: JSON.stringify({ answers: formattedAnswers })
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.detail || "We couldn't save your answers. Please try again.");

      setResult(data);

      // Trigger buddy event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buddy-guidance', {
          detail: {
            type: 'quiz_completed',
            message: `Knowledge Check completed! You scored ${data.score_percentage}%. Your civil service learning record has been updated.`
          }
        }));
      }
    } catch (e: any) {
      setError(e.message || "We couldn't save your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = catalog.filter(c => {
    const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.subskill_name && c.subskill_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = !difficultyFilter || c.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="card-brutal bg-[#F2A900] text-[#111111] p-6 sm:p-10 shadow-brutal-lg relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1F3A] border-2 border-[#111111] text-[#FCD34D] text-xs font-mono shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
            <span className="font-bold uppercase tracking-wider">
              {isAuth ? 'VERIFIED MATERIAL &bull; SOURCE-GROUNDED QUESTIONS' : 'PUBLIC ACCESS &bull; EXPLORE KNOWLEDGE CHECK'}
            </span>
          </div>
          <h1 className="display-section text-[#111111]">
            KNOWLEDGE CHECK
          </h1>
          <p className="text-sm sm:text-base text-zinc-900 leading-relaxed font-medium">
            Answer a few questions about what you just learned. Every question is grounded directly in official government guidelines, circulars, and verified standards.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              href="/quiz/studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white border-2 border-[#111111] text-xs font-mono font-bold shadow-brutal-sm hover:bg-black transition-all"
            >
              <span>Knowledge Check Studio &rarr;</span>
            </Link>
            {!isAuth && (
              <span className="inline-block px-3 py-2 rounded-xl bg-white border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] shadow-brutal-sm">
                ★ Preview Mode — Sign in to submit answers and earn competency progress.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="card-brutal bg-rose-50 border-2 border-rose-900 text-rose-950 p-4 text-xs font-mono flex items-center justify-between shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-zinc-500 hover:text-black font-bold text-sm">&times;</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TEST RUNNER (Active Knowledge Check in Progress)                       */}
      {/* ========================================================================= */}
      {activeCheck && !result && (
        <div className="card-brutal bg-white p-6 sm:p-10 shadow-brutal-lg border-2 border-[#111111] space-y-8">
          
          {/* Runner Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0B1F3A] text-[#FCD34D] text-[10px] font-mono font-bold uppercase">
                  {activeCheck.difficulty}
                </span>
                <span className="text-xs font-mono text-zinc-600">
                  {activeCheck.subskill_name} &bull; v{activeCheck.version}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#111111] mt-1">
                {activeCheck.title}
              </h2>
            </div>

            <button
              onClick={() => { setActiveCheck(null); setActiveCheckId(null); }}
              className="btn-brutal-outline !text-xs !py-1.5 !px-3 self-start sm:self-auto"
            >
              Exit to Catalog
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span>Question {currentQIndex + 1} of {activeCheck.questions.length}</span>
              <span className="text-zinc-500">
                {Object.keys(userAnswers).length} / {activeCheck.questions.length} Answered
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-3 rounded-full overflow-hidden border-2 border-[#111111]">
              <div 
                className="bg-[#0F766E] h-full transition-all duration-300"
                style={{ width: `${((currentQIndex + 1) / activeCheck.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Question */}
          {activeCheck.questions[currentQIndex] && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-300 text-zinc-700">
                    {activeCheck.questions[currentQIndex].question_type}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    Source Page {activeCheck.questions[currentQIndex].source_page}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-[#111111] leading-relaxed">
                  {activeCheck.questions[currentQIndex].question_text}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {activeCheck.questions[currentQIndex].options.map((opt: RunnerOption, optIdx: number) => {
                  const qId = activeCheck.questions[currentQIndex].id;
                  const isSelected = userAnswers[qId] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(qId, opt.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 text-xs sm:text-sm font-medium ${
                        isSelected
                          ? 'border-[#111111] bg-[#0B1F3A] text-white shadow-brutal-sm'
                          : 'border-zinc-300 bg-white hover:border-black text-zinc-900'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                        isSelected ? 'bg-[#F2A900] text-black' : 'border border-zinc-400 bg-zinc-100 text-zinc-700'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-6 border-t-2 border-zinc-200">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  className="btn-brutal-outline !text-xs !py-2 !px-4 disabled:opacity-40"
                >
                  &larr; Previous
                </button>

                {currentQIndex < activeCheck.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="btn-brutal-primary !text-xs !py-2 !px-5 flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-brutal-primary !text-xs !py-2.5 !px-6 flex items-center gap-2 !bg-[#0F766E] !text-white"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-[#FCD34D]" />
                        <span>SUBMIT KNOWLEDGE CHECK</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RESULT SCREEN (Source-Backed Provenance & Competency Growth)           */}
      {/* ========================================================================= */}
      {result && (
        <div className="card-brutal bg-white p-6 sm:p-10 shadow-brutal-lg border-2 border-[#111111] space-y-8">
          
          {/* Score Header */}
          <div className="bg-[#0B1F3A] text-white p-6 sm:p-8 rounded-2xl border-2 border-[#111111] shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FCD34D]">
                YOUR RESULT &bull; KNOWLEDGE CHECK
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display">
                {result.quiz_title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                Grounded evaluation against official guidelines.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/20">
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-black font-display text-[#F2A900]">
                  {result.score_percentage}%
                </div>
                <div className="text-xs font-mono text-zinc-300">
                  {result.correct_answers} of {result.total_questions} Correct
                </div>
              </div>
            </div>
          </div>

          {/* Competency Progression Section */}
          {result.subskill_name && (
            <div className="card-brutal bg-[#F8F7F2] p-5 border-2 border-[#111111] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
                  Competency Growth &bull; {result.subskill_name}
                </span>
                {result.competency_score_delta > 0 ? (
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    +{result.competency_score_delta} pts earned
                  </span>
                ) : (
                  <span className="text-xs font-mono text-zinc-500">
                    Review source materials to improve
                  </span>
                )}
              </div>

              {result.new_subskill_score !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span>Proficiency Score</span>
                    <span className="font-bold">{result.new_subskill_score} / 100</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden border border-zinc-400">
                    <div 
                      className="bg-[#0F766E] h-full transition-all"
                      style={{ width: `${Math.min(100, result.new_subskill_score)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Diagnostic Learning Feedback ("Teach, Don't Just Score") */}
          {result.diagnostic_feedback && (
            <div className="card-brutal bg-[#F8F7F2] p-6 rounded-2xl border-2 border-[#111111] space-y-4 shadow-brutal-sm">
              <div className="flex items-center gap-2 border-b border-zinc-300 pb-3">
                <BookOpen className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#111111]">
                  DIAGNOSTIC LEARNING FEEDBACK &bull; CONCEPTUAL ANALYSIS
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-4 rounded-xl bg-white border border-zinc-300">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 block">
                    ✓ What You Understood
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                    {result.diagnostic_feedback.what_you_understood}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-white border border-zinc-300">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                    ⚡ Where Confusion Exists
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                    {result.diagnostic_feedback.where_confusion_exists}
                  </p>
                </div>
              </div>

              {result.diagnostic_feedback.conceptual_contrast && (
                <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-900 block">
                    ★ Key Concept Distinction
                  </span>
                  <p className="text-xs sm:text-sm text-teal-950 leading-relaxed">
                    {result.diagnostic_feedback.conceptual_contrast}
                  </p>
                  {result.diagnostic_feedback.concrete_example && (
                    <div className="pt-2 mt-2 border-t border-teal-200/80 text-xs text-teal-900 italic">
                      {result.diagnostic_feedback.concrete_example}
                    </div>
                  )}
                </div>
              )}

              {result.diagnostic_feedback.concept_to_review && (
                <div className="flex items-center justify-between text-xs font-mono px-3 py-2 bg-zinc-100 rounded-lg border border-zinc-300">
                  <span className="text-zinc-600">Recommended for Review:</span>
                  <span className="font-bold text-[#0F766E]">{result.diagnostic_feedback.concept_to_review}</span>
                </div>
              )}
            </div>
          )}

          {/* Feedback Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-brutal bg-emerald-50/70 p-5 rounded-2xl border-2 border-emerald-800 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                WHAT YOU DID WELL
              </span>
              <ul className="text-xs text-emerald-950 space-y-1.5 pl-5 list-disc">
                {result.what_you_did_well?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="card-brutal bg-amber-50/70 p-5 rounded-2xl border-2 border-amber-800 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                KEEP PRACTISING
              </span>
              <ul className="text-xs text-amber-950 space-y-1.5 pl-5 list-disc">
                {result.keep_practising?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Question Review with Source Evidence */}
          <div className="space-y-4 pt-4 border-t-2 border-zinc-200">
            <h3 className="text-lg font-black font-display text-[#111111]">
              Review Your Answers &amp; Source Citations
            </h3>

            {result.detailed_results?.map((item: DetailedResult, idx: number) => (
              <div 
                key={item.question_id || idx}
                className={`card-brutal p-5 rounded-2xl border-2 space-y-3 ${
                  item.is_correct ? 'border-emerald-800 bg-emerald-50/30' : 'border-rose-900 bg-rose-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                      item.is_correct ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111111]">
                        {item.question_text}
                      </p>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        Source Page {item.source_page} &bull; {item.source_section}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0 ${
                    item.is_correct ? 'bg-emerald-100 text-emerald-950 border border-emerald-400' : 'bg-rose-100 text-rose-950 border border-rose-400'
                  }`}>
                    {item.is_correct ? 'CORRECT' : 'INCORRECT'}
                  </span>
                </div>

                {/* Explanation */}
                <div className="text-xs text-zinc-700 pl-8 leading-relaxed">
                  {item.feedback}
                </div>

                {/* Source Provenance Excerpt */}
                {item.evidence_text && (
                  <div className="ml-8 p-3 rounded-xl bg-white border border-zinc-300 font-mono text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                      Document Excerpt (Page {item.source_page}):
                    </span>
                    <p className="text-zinc-800 italic font-serif">
                      &ldquo;{item.evidence_text}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t-2 border-zinc-200">
            <button
              onClick={() => { setResult(null); setActiveCheck(null); setActiveCheckId(null); }}
              className="btn-brutal-primary !text-xs !py-2.5 !px-6"
            >
              &larr; Back to Catalog
            </button>
            <button
              onClick={() => {
                if (activeCheckId) startCheck(activeCheckId);
              }}
              className="btn-brutal-outline !text-xs !py-2.5 !px-6"
            >
              Retake Check
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PUBLISHED KNOWLEDGE CHECKS CATALOG                                     */}
      {/* ========================================================================= */}
      {!activeCheck && (
        <div className="space-y-6">
          
          {/* Catalog Controls */}
          <div className="card-brutal bg-white p-5 rounded-2xl border-2 border-[#111111] shadow-brutal-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Knowledge Checks by title or competency..."
                className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-[#F8F7F2] rounded-xl border border-zinc-300 focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-600">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-zinc-300 text-xs font-mono bg-white focus:outline-none"
              >
                <option value="">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Catalog Grid */}
          {loadingCatalog ? (
            <div className="py-16 text-center text-xs font-mono text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-700" />
              Loading published Knowledge Checks...
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="card-brutal bg-white p-12 text-center border-2 border-[#111111] shadow-brutal space-y-4">
              <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-zinc-800">
                  No Knowledge Checks Found
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  {searchQuery || difficultyFilter
                    ? "Try adjusting your filters or search terms."
                    : "No published checks are currently available. Create one using Knowledge Check Studio."}
                </p>
              </div>
              <Link
                href="/quiz/studio"
                className="btn-brutal-primary !text-xs !py-2.5 !px-5 inline-flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Knowledge Check Studio</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map(item => (
                <div
                  key={item.id}
                  className="card-brutal bg-white p-6 rounded-2xl border-2 border-[#111111] shadow-brutal flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0B1F3A] text-[#FCD34D] text-[10px] font-mono font-bold uppercase">
                        {item.difficulty}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-zinc-500">
                        v{item.version}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold font-display text-[#111111] leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs font-mono text-zinc-500 mt-1">
                        {item.subskill_name || 'Civil Service Competency'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-zinc-100 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-600">
                      <span>{item.question_count} questions</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        ~{item.time_estimate_mins} mins
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => startCheck(item.id)}
                      disabled={loadingCheck && activeCheckId === item.id}
                      className="w-full btn-brutal-primary !text-xs !py-2.5 flex items-center justify-center gap-1.5 shadow-brutal-sm"
                    >
                      {loadingCheck && activeCheckId === item.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <span>START KNOWLEDGE CHECK</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalTitle}
        message={authModalMessage}
        returnUrl="/quiz"
      />
    </div>
  );
}
