'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, FileText, CheckCircle2, XCircle, Sparkles, BookOpen, AlertCircle, ArrowRight, LogIn, RefreshCcw, ShieldCheck, HelpCircle } from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/api';
import { AuthModal } from '../components/AuthModal';

export default function QuizStudio() {
  const [documentTitle, setDocumentTitle] = useState('MoSPI India Data Quality Framework (IDQF) 2024 Guidelines');
  const [documentText, setDocumentText] = useState(`India Data Quality Framework (IDQF) 2024 Standards.
Ministry of Statistics and Programme Implementation (MoSPI).

Section 1. Core Principles:
All national sample statistical collections must maintain a minimum confidence interval of 95%. Automated anomaly detection must flag duplicate household records within 24 hours of submission.

Section 2. Privacy & Masking:
Microdata dissemination must undergo k-anonymity (k>=5) and differential privacy noise addition before public release. Personally Identifiable Information (PII) including Aadhaar numbers and biometric tokens must be stripped at the field collection tablet level.

Section 3. Enumerator Compliance:
Enumerators operating in LWE (Left-Wing Extremism) affected or hilly terrains must be provided offline-first mobile survey tools. Multi-tier verification shouldn't exceed 15 minutes per household to maintain public cooperation and response rates.`);

  const [documentId, setDocumentId] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth & Preview States
  const [isAuth, setIsAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTitle, setAuthModalTitle] = useState('Sign in to take the Knowledge Check');
  const [authModalMessage, setAuthModalMessage] = useState('Sign in to take the Knowledge Check, get personalized skill evaluations, and track your progress.');

  // Public Preview Question
  const [previewSelectedOption, setPreviewSelectedOption] = useState<number | null>(null);
  const previewQuestion = {
    id: 999,
    question_text: "Under Section 2 of the India Data Quality Framework (IDQF) 2024, what privacy standard is mandatory for microdata dissemination prior to open public release?",
    source_page: 2,
    options: [
      { id: 1, option_text: "Simple manual masking of phone numbers and names" },
      { id: 2, option_text: "k-anonymity (k ≥ 5) and differential privacy noise addition" },
      { id: 3, option_text: "Password-protected compressed archives with access logging" },
      { id: 4, option_text: "Exemption of municipal survey clusters from anonymization" }
    ]
  };

  useEffect(() => {
    setIsAuth(!!getAccessToken());
  }, []);

  const openAuthModal = (title?: string, message?: string) => {
    if (title) setAuthModalTitle(title);
    if (message) setAuthModalMessage(message);
    setAuthModalOpen(true);
  };

  const handleUpload = async () => {
    const token = getAccessToken();
    if (!token) {
      openAuthModal(
        "Sign in to generate a Knowledge Check",
        "Sign in to upload custom official documents, generate verified questions, and build your competency score."
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/assessment/upload/', {
        method: 'POST',
        body: JSON.stringify({ title: documentTitle, text: documentText })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to upload document.');
      setDocumentId(d.document_id);
      
      // Auto generate quiz
      generateQuiz(d.document_id);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || "Could not connect to backend server.");
    }
  };

  const generateQuiz = async (docId: number) => {
    setLoading(true);
    setQuizResult(null);
    setUserAnswers({});
    setError(null);
    try {
      const res = await authFetch('/api/assessment/generate-quiz/', {
        method: 'POST',
        body: JSON.stringify({ document_id: docId })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to generate quiz.');
      setQuiz(d);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Error generating quiz.');
    }
  };

  const handleOptionSelect = (questionId: number, optionId: number) => {
    if (quizResult) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !quiz.quiz_id) return;
    
    // Format answers array
    const formattedAnswers = Object.entries(userAnswers).map(([qId, oId]) => ({
      question_id: parseInt(qId),
      selected_option_id: oId
    }));

    if (formattedAnswers.length === 0) {
      setError("Please answer at least one question before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/api/assessment/evaluate/', {
        method: 'POST',
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers: formattedAnswers
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to evaluate quiz.');
      setQuizResult(d);
      setSubmitting(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buddy-guidance', {
          detail: {
            type: 'quiz_completed',
            message: "Nice work! Your Knowledge Check is complete. Your learning progress has been updated."
          }
        }));
      }
    } catch (e: any) {
      setSubmitting(false);
      setError(e.message || 'Error submitting assessment.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="card-brutal bg-[#F2A900] text-[#111111] p-6 sm:p-10 shadow-brutal-lg relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1F3A] border-2 border-[#111111] text-[#FCD34D] text-xs font-mono shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
            <span className="font-bold uppercase tracking-wider">
              {isAuth ? 'TRUSTED MATERIAL &bull; VERIFIED QUESTIONS' : '★ PREVIEW MODE &bull; EXPLORE KNOWLEDGE CHECK'}
            </span>
          </div>
          <h1 className="display-section text-[#111111]">
            QUICK KNOWLEDGE CHECK
          </h1>
          <p className="text-sm sm:text-base text-zinc-900 leading-relaxed font-medium">
            {isAuth
              ? 'Test your understanding of official guidelines and circulars. Every question comes directly from trusted government source documents.'
              : 'Test your understanding of official guidelines and circulars. Experience real question formats pulled directly from official government documents.'}
          </p>

          {!isAuth && (
            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 rounded-xl bg-white border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] shadow-brutal-sm">
                ★ PREVIEW MODE — Sign in to submit answers and earn skills progress.
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card-brutal bg-rose-100 border-2 border-[#111111] text-rose-950 p-4 text-xs font-mono flex items-center justify-between shadow-brutal-sm">
          <span>{error}</span>
          {!isAuth && (
            <button 
              onClick={() => openAuthModal()} 
              className="btn-brutal-primary !text-xs !py-1.5 !px-3"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Document Uploader (5 cols) */}
        <div className="lg:col-span-5 card-brutal bg-white p-6 space-y-4">
          <h2 className="font-display font-extrabold uppercase text-base text-[#111111] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F766E]" /> Source Material
          </h2>
          <p className="text-xs text-[#4B5563]">
            {isAuth 
              ? 'Use the sample official circular below or paste any guideline text to generate a quick check.' 
              : 'Review the sample official circular below to see how questions are extracted from policy guidelines.'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono font-bold uppercase text-[#111111] block mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={e => setDocumentTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold uppercase text-[#111111] block mb-1">
                Material Text
              </label>
              <textarea
                rows={9}
                value={documentText}
                onChange={e => setDocumentText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] text-xs font-mono text-[#111111] font-medium bg-[#F8F7F2] focus:bg-white focus:outline-none shadow-brutal-sm"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn-brutal-primary w-full !text-xs !py-3 flex items-center justify-center gap-2 font-bold"
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Your Questions...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isAuth ? 'Generate Knowledge Check' : 'Generate Knowledge Check from Document'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quiz Testing Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {quiz ? (
            <div className="card-brutal bg-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#111111]">
                <div className="space-y-0.5">
                  <span className="badge-starburst badge-starburst-emerald text-xs">
                    ★ KNOWLEDGE CHECK READY
                  </span>
                  <h3 className="font-display font-extrabold uppercase text-lg text-[#111111] mt-1">
                    {quiz.title || documentTitle}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#111111] text-white">
                  {quiz.questions?.length || 0} Questions
                </span>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {(quiz.questions || []).map((q: any, qIdx: number) => {
                  const selectedOpt = userAnswers[q.id];
                  const resultItem = quizResult?.evaluations?.find((e: any) => e.question_id === q.id);

                  return (
                    <div 
                      key={q.id || qIdx} 
                      className="p-5 rounded-2xl border-2 border-[#111111] bg-[#F8F7F2] space-y-3.5 shadow-brutal-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-display font-bold text-sm text-[#111111]">
                          <span className="text-[#0F766E] font-black mr-1.5">Q{qIdx + 1}.</span> {q.question_text}
                        </h4>
                        {q.source_page && (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#111111] shrink-0">
                            Page {q.source_page}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {(q.options || []).map((opt: any) => {
                          const isSelected = selectedOpt === opt.id;
                          let optStyle = "bg-white text-[#111111] border-2 border-[#111111] hover:bg-zinc-50";

                          if (isSelected) {
                            optStyle = "bg-[#F2A900] text-[#111111] border-2 border-[#111111] shadow-brutal-sm font-bold";
                          }

                          if (quizResult && resultItem) {
                            if (opt.id === resultItem.correct_option_id) {
                              optStyle = "bg-emerald-100 text-emerald-950 border-2 border-emerald-800 font-bold";
                            } else if (isSelected && !resultItem.is_correct) {
                              optStyle = "bg-rose-100 text-rose-950 border-2 border-rose-800 font-bold";
                            }
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleOptionSelect(q.id, opt.id)}
                              className={`w-full p-3 rounded-xl text-left text-xs transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt.option_text}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {resultItem && (
                        <div className="p-3 rounded-xl bg-white border border-[#111111] text-[11px] font-mono space-y-1">
                          <span className={`font-bold flex items-center gap-1 ${resultItem.is_correct ? 'text-[#0F766E]' : 'text-[#C0392B]'}`}>
                            {resultItem.is_correct ? '✓ Correct Answer' : '✗ Not quite.'}
                          </span>
                          <p className="text-[#111111] font-medium">{resultItem.explanation || 'Verified from the source text.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit CTA or Result Summary */}
              {!quizResult ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="btn-brutal-emerald w-full !py-3.5 !text-sm flex items-center justify-center gap-2 font-bold"
                >
                  {submitting ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>Checking Your Answers...</span>
                    </>
                  ) : (
                    <>
                      <span>Check My Answers</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="badge-starburst badge-starburst-saffron text-xs">
                        ★ COMPLETED
                      </span>
                      <h4 className="font-display font-bold text-xl uppercase mt-1">
                        Your Score: {quizResult.score_percentage || 80}%
                      </h4>
                    </div>
                    <Link href="/dashboard" className="btn-brutal-primary !text-xs !py-2 !px-4">
                      <span>View My Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-xs text-zinc-200 font-medium">
                    Your skills overview and course recommendations have been updated automatically.
                  </p>
                </div>
              )}
            </div>
          ) : !isAuth ? (
            /* Unauthenticated Visitor Preview Question Card */
            <div className="card-brutal bg-white p-6 sm:p-8 space-y-6 shadow-brutal-md">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-[#111111]">
                <div className="space-y-1">
                  <span className="badge-starburst badge-starburst-saffron text-xs">
                    ★ PREVIEW QUESTION &bull; TRY IT OUT
                  </span>
                  <h3 className="font-display font-extrabold uppercase text-lg text-[#111111]">
                    Sample Assessment Question
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#0B1F3A] text-white">
                  Preview Mode
                </span>
              </div>

              {/* Interactive Preview Question */}
              <div className="p-5 rounded-2xl border-2 border-[#111111] bg-[#F8F7F2] space-y-4 shadow-brutal-sm">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#111111] leading-snug">
                    <span className="text-[#0F766E] font-black mr-1.5">Q1.</span> {previewQuestion.question_text}
                  </h4>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#111111] shrink-0">
                    Page 2 &bull; IDQF 2024
                  </span>
                </div>

                <div className="space-y-2.5">
                  {previewQuestion.options.map((opt) => {
                    const isSelected = previewSelectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreviewSelectedOption(opt.id)}
                        className={`w-full p-3.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border-2 border-[#111111] ${
                          isSelected
                            ? 'bg-[#F2A900] text-[#111111] shadow-brutal-sm font-bold'
                            : 'bg-white text-[#111111] hover:bg-zinc-50'
                        }`}
                      >
                        <span className="font-medium">{opt.option_text}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#111111] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#F2A900] shrink-0" />
                  <span>Select an option above to see how Knowledge Checks work.</span>
                </div>
              </div>

              {/* Submit CTA opens AuthModal */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => openAuthModal(
                    "Sign in to take the Knowledge Check",
                    "Sign in to submit your answers, get verified score evaluations, and earn skills progress."
                  )}
                  className="btn-brutal-emerald w-full !py-3.5 !text-sm flex items-center justify-center gap-2 shadow-brutal-sm font-bold"
                >
                  <span>Submit Answer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs font-mono text-[#4B5563]">
                  Want to test on your own guidelines?{' '}
                  <button 
                    onClick={() => openAuthModal(
                      "Sign in to upload guidelines",
                      "Create an account to upload custom circulars and generate verified knowledge evaluations."
                    )}
                    className="underline text-[#0F766E] font-bold"
                  >
                    Sign in to upload circulars
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Authenticated Default State */
            <div className="card-brutal bg-white p-12 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-[#0F766E] mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-display font-extrabold uppercase text-lg text-[#111111]">
                  Ready to Practice?
                </h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Click &ldquo;Generate Knowledge Check&rdquo; to test your understanding with questions pulled directly from the document.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Auth Gate Modal */}
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

