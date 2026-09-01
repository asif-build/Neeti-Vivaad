'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, FileText, CheckCircle2, XCircle, Sparkles, BookOpen, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/api';

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

  const handleUpload = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Please sign in to upload documents and take assessments.");
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
    if (!quiz) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/api/assessment/submit-quiz/', {
        method: 'POST',
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers: userAnswers
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to submit quiz.');
      setQuizResult(d);
      setSubmitting(false);
    } catch (e: any) {
      setSubmitting(false);
      setError(e.message || 'Error submitting quiz.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Strictly Grounded AI Quiz Generator
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Assessment & Document Quiz Studio
          </h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Upload any MoSPI guideline document, SOP, or policy text. MCQs are generated strictly from the uploaded text with explicit source citations and zero external hallucination.
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Document Uploader & Text Input (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Reference Document Input
          </h2>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Document Title</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Document Text / Guideline Content</label>
            <textarea
              rows={12}
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Generating Grounded MCQs via AI Engine...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse Document & Generate Quiz</span>
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-zinc-400 text-center">
            Non-negotiable rule: No outside facts are used to form questions.
          </p>
        </div>

        {/* Interactive Quiz Area (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Grounded Assessment Questions
              </h2>
              {quiz && <p className="text-xs font-mono text-cyan-400 mt-0.5">{quiz.quiz_title}</p>}
            </div>
            {quizResult && (
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                Score: {quizResult.score_percentage}%
              </span>
            )}
          </div>

          {!quiz && !loading && (
            <div className="text-center py-16 text-zinc-400 text-xs font-mono space-y-3">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
              <p>Click "Parse Document & Generate Quiz" to generate grounded questions.</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-20 text-emerald-400 font-mono text-sm">
              Analyzing document text and synthesizing grounded questions with citations...
            </div>
          )}

          {quiz && !loading && (
            <div className="space-y-6">
              {quiz.questions.map((q: any, idx: number) => {
                const resultItem = quizResult?.detailed_results?.find((r: any) => r.question_id === q.id);
                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-cyan-400 font-bold">
                        Q{idx + 1}
                      </span>
                      <h3 className="font-bold text-white text-sm leading-snug">{q.question}</h3>
                    </div>

                    {/* Source Citation Badge */}
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 text-[11px] font-mono text-zinc-400 italic">
                      📌 <strong className="text-zinc-300">Document Citation:</strong> {q.source_citation}
                    </div>

                    {/* Options */}
                    <div className="space-y-2 pt-2">
                      {q.options.map((opt: any) => {
                        const isSelected = userAnswers[q.id] === opt.id;
                        let optionClass = 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700';

                        if (quizResult && resultItem) {
                          if (opt.id === resultItem.correct_option_id) {
                            optionClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isSelected && !resultItem.is_correct) {
                            optionClass = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                          }
                        } else if (isSelected) {
                          optionClass = 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold';
                        }

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleOptionSelect(q.id, opt.id)}
                            className={`w-full p-3 rounded-xl text-left text-xs font-sans transition-all border flex items-center justify-between ${optionClass}`}
                          >
                            <span>{opt.text}</span>
                            {quizResult && opt.id === resultItem?.correct_option_id && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                            {quizResult && isSelected && !resultItem?.is_correct && (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation after submission */}
                    {quizResult && resultItem && (
                      <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-sans text-zinc-300 leading-relaxed">
                        <strong className="text-emerald-400 font-mono block mb-1">Source Grounded Explanation:</strong>
                        {resultItem.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizResult ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
                >
                  {submitting ? 'Evaluating Answers...' : 'Submit Assessment & Update Profile Score'}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between">
                  <span>✓ Quiz evaluation completed! Competency delta (+{quizResult.competency_score_delta} pts) saved.</span>
                  <button
                    onClick={() => generateQuiz(documentId || 1)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Retake / New Questions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
