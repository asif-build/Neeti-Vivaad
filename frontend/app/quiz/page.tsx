'use client';

import { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';

type QuizOption = {
  id: number;
  text: string;
};

type QuizQuestion = {
  id: number;
  question: string;
  source_citation: string;
  options: QuizOption[];
};

type Quiz = {
  quiz_id: number;
  quiz_title: string;
  questions: QuizQuestion[];
};

type ResultItem = {
  question_id: number;
  correct_option_id: number;
  user_option_id: number;
  is_correct: boolean;
  source_citation: string;
  explanation: string;
};

type QuizResult = {
  score_percentage: number;
  correct_answers: number;
  total_questions: number;
  competency_score_delta: number;
  detailed_results: ResultItem[];
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}.`);
  }
  return payload;
}

export default function QuizStudio() {
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(4);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = async (docId: number) => {
    const response = await fetch('/api/assessment/generate-quiz/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: docId,
        num_questions: questionCount,
      }),
    });
    const generatedQuiz = await readApiResponse<Quiz>(response);
    setQuiz(generatedQuiz);
    setQuizResult(null);
    setUserAnswers({});
  };

  const handleUpload = async () => {
    if (!documentFile && documentText.trim().length < 200) {
      setError('Paste at least 200 characters or upload a supported document.');
      return;
    }

    setLoading(true);
    setError('');
    setQuiz(null);
    setQuizResult(null);

    try {
      const body = new FormData();
      if (documentTitle.trim()) body.append('title', documentTitle.trim());
      if (documentFile) {
        body.append('file', documentFile);
      } else {
        body.append('text', documentText.trim());
      }

      const uploadResponse = await fetch('/api/assessment/upload/', {
        method: 'POST',
        body,
      });
      const uploaded = await readApiResponse<{ document_id: number }>(uploadResponse);
      setDocumentId(uploaded.document_id);
      await generateQuiz(uploaded.document_id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Quiz generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    if (Object.keys(userAnswers).length !== quiz.questions.length) {
      setError('Answer every question before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/assessment/submit-quiz/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers: userAnswers,
        }),
      });
      setQuizResult(await readApiResponse<QuizResult>(response));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Quiz submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const regenerateQuiz = async () => {
    if (!documentId) return;
    setLoading(true);
    setError('');
    try {
      await generateQuiz(documentId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Quiz generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      <div className="card-supa-light p-6 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill-tag-emerald">
            <Sparkles className="w-3.5 h-3.5" /> Source-grounded AI quiz generator
          </span>
          <span className="text-xs font-mono text-[#707070]">
            AI citations are checked against the uploaded source before questions are saved.
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
          AI Assessment &amp; Document Quiz Studio
        </h1>
        <p className="text-xs text-[#707070] leading-relaxed max-w-3xl">
          Upload a PDF, TXT, Markdown, or CSV document—or paste source text—and generate a fresh
          assessment from its actual contents.
        </p>
      </div>

      {error && (
        <div className="rounded-[8px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block">Could not complete the request</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 card-supa-light p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#24b47e]" /> Source document
            </h2>
            <span className="text-[10px] font-mono uppercase text-[#707070]">10 MB maximum</span>
          </div>

          <div>
            <label className="text-xs font-mono text-[#707070] block mb-1">Document title</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder="Optional—uses the filename when omitted"
              className="w-full bg-white border border-[#dfdfdf] rounded-[6px] px-3 py-2 text-xs focus:outline-none focus:border-[#171717]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#707070] block mb-1">
              Upload PDF, TXT, MD, or CSV
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-dashed border-[#c9c9c9] bg-[#fafafa] px-4 py-5 text-xs text-[#575757] hover:border-[#24b47e]">
              <Upload className="w-4 h-4" />
              <span>{documentFile ? documentFile.name : 'Choose a document'}</span>
              <input
                type="file"
                accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv"
                className="sr-only"
                onChange={(event) => {
                  setDocumentFile(event.target.files?.[0] ?? null);
                  setDocumentText('');
                  setError('');
                }}
              />
            </label>
            {documentFile && (
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  PDF selected and ready to process
                </span>
                <button
                  type="button"
                  onClick={() => setDocumentFile(null)}
                  className="text-rose-700 underline"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[#9a9a9a]">
            <span className="h-px flex-1 bg-[#ededed]" /> or <span className="h-px flex-1 bg-[#ededed]" />
          </div>

          <div>
            <label className="text-xs font-mono text-[#707070] block mb-1">Paste source text</label>
            <textarea
              rows={10}
              value={documentText}
              disabled={Boolean(documentFile)}
              onChange={(event) => setDocumentText(event.target.value)}
              placeholder="Paste at least 200 characters from the source document…"
              className="w-full bg-[#fafafa] border border-[#dfdfdf] rounded-[6px] p-3 text-xs font-mono focus:outline-none focus:border-[#171717] leading-relaxed disabled:opacity-50"
            />
            <span className="text-[10px] font-mono text-[#9a9a9a]">
              {documentText.trim().length.toLocaleString()} characters
            </span>
          </div>

          <div>
            <label className="text-xs font-mono text-[#707070] block mb-1">Number of questions</label>
            <select
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              className="w-full bg-white border border-[#dfdfdf] rounded-[6px] px-3 py-2 text-xs"
            >
              {[2, 3, 4, 5, 6, 8, 10].map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn-primary-green w-full py-2.5 text-xs flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? 'Reading source and generating questions…' : 'Generate quiz from source'}
          </button>
        </div>

        <div className="lg:col-span-7 card-supa-light p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ededed] pb-4">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#24b47e]" /> Assessment
              </h2>
              {quiz && <p className="text-xs font-mono text-[#24b47e] mt-1">{quiz.quiz_title}</p>}
            </div>
            {quizResult && (
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                {quizResult.correct_answers}/{quizResult.total_questions} · {quizResult.score_percentage}%
              </span>
            )}
          </div>

          {!quiz && !loading && (
            <div className="text-center py-16 text-[#707070] text-xs font-mono space-y-3">
              {documentFile || documentText.trim().length >= 200 ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-emerald-800">
                    Source selected. Click “Generate quiz from source” to continue.
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-8 h-8 text-[#9a9a9a] mx-auto" />
                  <p>Choose a source document to generate an assessment.</p>
                </>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-20 text-[#24b47e] font-mono text-xs">
              Extracting text, generating questions, and verifying citations…
            </div>
          )}

          {quiz && !loading && (
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const result = quizResult?.detailed_results.find(
                  (item) => item.question_id === question.id,
                );
                return (
                  <div key={question.id} className="p-4 rounded-[8px] bg-[#fafafa] border border-[#ededed] space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-[#171717] text-white text-xs font-mono font-bold shrink-0">
                        Q{index + 1}
                      </span>
                      <h3 className="font-semibold text-sm leading-snug">{question.question}</h3>
                    </div>

                    <div className="p-2.5 rounded-[6px] bg-emerald-50/70 border border-emerald-200 text-[11px] font-mono text-emerald-950">
                      <strong>Verified source excerpt:</strong> “{question.source_citation}”
                    </div>

                    <div className="space-y-2 pt-1">
                      {question.options.map((option) => {
                        const selected = userAnswers[question.id] === option.id;
                        let optionClass = 'bg-white border-[#dfdfdf] hover:border-[#171717]';
                        if (quizResult && result) {
                          if (option.id === result.correct_option_id) {
                            optionClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                          } else if (selected && !result.is_correct) {
                            optionClass = 'bg-rose-50 border-rose-400 text-rose-950 font-bold';
                          }
                        } else if (selected) {
                          optionClass = 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500';
                        }

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={Boolean(quizResult)}
                            onClick={() =>
                              setUserAnswers((answers) => ({ ...answers, [question.id]: option.id }))
                            }
                            className={`w-full p-2.5 rounded-[6px] text-left text-xs transition-all border flex items-center justify-between disabled:cursor-default ${optionClass}`}
                          >
                            <span>{option.text}</span>
                            {quizResult && option.id === result?.correct_option_id && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {quizResult && selected && !result?.is_correct && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {result && (
                      <div className="p-3 rounded-[6px] bg-white border border-[#dfdfdf] text-xs text-[#707070] leading-relaxed">
                        <strong className="text-emerald-700 font-mono block mb-1">Explanation</strong>
                        {result.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizResult ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="btn-primary-green w-full py-2.5 text-xs font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Evaluating answers…' : 'Submit assessment'}
                </button>
              ) : (
                <div className="p-3.5 rounded-[6px] bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span>Assessment saved successfully.</span>
                  <button
                    type="button"
                    onClick={regenerateQuiz}
                    className="px-3 py-1.5 rounded-[4px] bg-[#171717] text-white text-xs font-medium"
                  >
                    Generate new questions
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
