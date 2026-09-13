'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Upload, FileText, CheckCircle2, XCircle, Sparkles, BookOpen, 
  AlertCircle, ArrowRight, RefreshCw, Trash2, Edit3, Plus, 
  Eye, Check, ShieldCheck, ChevronRight, FileCheck, Layers, Award
} from 'lucide-react';
import { authFetch, getAccessToken } from '../../utils/api';
import { AuthModal } from '../../components/AuthModal';

interface CompetencyOption {
  id: number;
  code: string;
  name: string;
  domain_name: string;
}

interface QuestionOption {
  id?: number;
  text: string;
  is_correct: boolean;
}

interface QuestionItem {
  id: number;
  order: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  source_page: number;
  source_section: string;
  evidence_text: string;
  source_citation: string;
  explanation: string;
  options: QuestionOption[];
}

interface DraftQuiz {
  quiz_id: number;
  title: string;
  status: string;
  version: number;
  difficulty: string;
  time_estimate_mins: number;
  subskill_id?: number;
  subskill_name?: string;
  document_id: number;
  document_title: string;
  questions: QuestionItem[];
}

export default function KnowledgeCheckStudio() {
  const [activeTab, setActiveTab] = useState<'create' | 'dashboard'>('create');
  const [isAuth, setIsAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Competencies
  const [competencies, setCompetencies] = useState<CompetencyOption[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | ''>('');

  // Step 1: Upload / Source State
  const [sourceMode, setSourceMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [uploadedDocInfo, setUploadedDocInfo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Generation Settings
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['MCQ', 'SCENARIO', 'TRUE_FALSE']);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  // Step 3: Review & Edit Workspace
  const [currentQuiz, setCurrentQuiz] = useState<DraftQuiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [sourcePreviewItem, setSourcePreviewItem] = useState<QuestionItem | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<any>(null);

  // New Question Form state
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState('MCQ');
  const [newQPage, setNewQPage] = useState(1);
  const [newQEvidence, setNewQEvidence] = useState('');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQOptions, setNewQOptions] = useState<QuestionOption[]>([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);

  // Dashboard Data
  const [dashboardQuizzes, setDashboardQuizzes] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Errors / Notifications
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuth(!!token);
    loadCompetencies();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && isAuth) {
      loadDashboard();
    }
  }, [activeTab, isAuth]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadCompetencies = async () => {
    try {
      const res = await fetch('/api/assessment/competencies/');
      if (res.ok) {
        const data = await res.json();
        setCompetencies(data.competencies || []);
        if (data.competencies?.length > 0 && !selectedCompetencyId) {
          setSelectedCompetencyId(data.competencies[0].id);
        }
      }
    } catch {
      // Fallback silent
    }
  };

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await authFetch('/api/assessment/studio/dashboard/');
      if (res.ok) {
        const data = await res.json();
        setDashboardQuizzes(data.quizzes || []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard.');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setDocumentTitle(cleanName);
      }
      setError(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!isAuth) {
      setAuthModalOpen(true);
      return;
    }

    if (sourceMode === 'file' && !selectedFile) {
      setError("Please select a PDF or DOCX document to upload.");
      return;
    }
    if (sourceMode === 'text' && (!documentText || documentText.trim().length < 50)) {
      setError("Please provide at least 50 characters of document text.");
      return;
    }

    setUploading(true);
    setError(null);
    setGenerationProgress('Reading your document...');

    try {
      let res;
      if (sourceMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', documentTitle || selectedFile.name);
        res = await authFetch('/api/assessment/documents/', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await authFetch('/api/assessment/documents/', {
          method: 'POST',
          body: JSON.stringify({
            title: documentTitle || 'Uploaded Guideline',
            text: documentText
          })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "We couldn't read this document. Please try another file.");
      }

      setUploadedDocInfo(data);
      showNotification(`Document processed successfully! Extracted ${data.page_count} page(s) and ${data.chunk_count} section(s).`);
    } catch (e: any) {
      setError(e.message || "We couldn't read this document. Please try another file.");
    } finally {
      setUploading(false);
      setGenerationProgress('');
    }
  };

  const handleGenerateCheck = async () => {
    if (!uploadedDocInfo || !uploadedDocInfo.document_id) {
      setError("Please upload and process a document first.");
      return;
    }

    setGenerating(true);
    setError(null);
    setGenerationProgress('Preparing your knowledge check from source material...');

    try {
      const res = await authFetch('/api/assessment/studio/generate/', {
        method: 'POST',
        body: JSON.stringify({
          document_id: uploadedDocInfo.document_id,
          title: documentTitle ? `Knowledge Check: ${documentTitle}` : undefined,
          num_questions: numQuestions,
          difficulty: difficulty,
          question_types: questionTypes,
          subskill_id: selectedCompetencyId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "We couldn't prepare the knowledge check. Please try again.");
      }

      setCurrentQuiz(data);
      showNotification(`Generated ${data.questions.length} verified questions tied directly to source evidence!`);
    } catch (e: any) {
      setError(e.message || "We couldn't prepare the knowledge check. Please try again.");
    } finally {
      setGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleRegenerateQuestion = async (qId: number) => {
    if (!currentQuiz) return;
    setError(null);
    try {
      const res = await authFetch(`/api/assessment/studio/${currentQuiz.quiz_id}/questions/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'regenerate',
          question_id: qId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed.");

      setCurrentQuiz(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map(q => q.id === qId ? data.question : q)
        };
      });
      showNotification("Question refreshed with alternative source excerpt.");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!currentQuiz) return;
    try {
      const res = await authFetch(`/api/assessment/studio/${currentQuiz.quiz_id}/questions/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          question_id: qId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed.");

      setCurrentQuiz(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.filter(q => q.id !== qId)
        };
      });
      showNotification("Question removed from Knowledge Check.");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentQuiz) return;
    setSavingDraft(true);
    setError(null);
    try {
      const res = await authFetch(`/api/assessment/studio/${currentQuiz.quiz_id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: currentQuiz.title,
          difficulty: currentQuiz.difficulty,
          subskill_id: currentQuiz.subskill_id,
          questions: currentQuiz.questions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft.");
      showNotification("Draft saved successfully.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishCheck = async () => {
    if (!currentQuiz) return;
    if (currentQuiz.questions.length === 0) {
      setError("Please ensure the Knowledge Check has at least one question before publishing.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await authFetch(`/api/assessment/studio/${currentQuiz.quiz_id}/publish/`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publishing failed.");
      setPublishSuccess(data);
      setCurrentQuiz(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
      showNotification("Knowledge Check published! It is now live for civil servants.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleAddManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz) return;
    if (!newQText.trim()) {
      setError("Question text cannot be empty.");
      return;
    }

    try {
      const res = await authFetch(`/api/assessment/studio/${currentQuiz.quiz_id}/questions/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          question_text: newQText,
          question_type: newQType,
          source_page: newQPage,
          source_section: 'Author Specification',
          evidence_text: newQEvidence,
          explanation: newQExplanation || "Verified rule per administrative specification.",
          options: newQOptions.filter(o => o.text.trim())
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add question.");

      setCurrentQuiz(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: [...prev.questions, data.question]
        };
      });
      setShowAddQuestionModal(false);
      // Reset form
      setNewQText('');
      setNewQEvidence('');
      setNewQExplanation('');
      showNotification("Manual question added to draft check.");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-8 font-sans">
      
      {/* Top Breadcrumb & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#111111] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-sm shadow-brutal-sm">
            KC
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              NEETI SAARTHI &bull; AUTHORING ENGINE
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-[#111111]">
              KNOWLEDGE CHECK STUDIO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl border-2 border-[#111111] transition-all shadow-brutal-sm ${
              activeTab === 'create' ? 'bg-[#F2A900] text-[#111111]' : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            + Create Check
          </button>
          <button
            onClick={() => {
              if (!isAuth) {
                setAuthModalOpen(true);
              } else {
                setActiveTab('dashboard');
              }
            }}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl border-2 border-[#111111] transition-all shadow-brutal-sm ${
              activeTab === 'dashboard' ? 'bg-[#0B1F3A] text-white' : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            Author Dashboard
          </button>
          <Link
            href="/quiz"
            className="btn-brutal-outline !text-xs !py-2 !px-3 inline-flex items-center gap-1.5"
          >
            <span>Learner Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="card-brutal bg-rose-50 border-2 border-rose-900 text-rose-950 p-4 text-xs font-mono flex items-center justify-between shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-zinc-500 hover:text-black font-bold text-sm">&times;</button>
        </div>
      )}

      {toast && (
        <div className="card-brutal bg-emerald-50 border-2 border-emerald-900 text-emerald-950 p-4 text-xs font-mono flex items-center gap-2 shadow-brutal-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CREATE KNOWLEDGE CHECK                                             */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="space-y-8">
          
          {/* STEP 1: SOURCE DOCUMENT UPLOAD */}
          <div className="card-brutal bg-white p-6 sm:p-8 shadow-brutal border-2 border-[#111111] space-y-6">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#0F766E]">
                  STEP 1 &bull; SOURCE DOCUMENT
                </span>
                <h2 className="text-lg sm:text-xl font-black font-display text-[#111111]">
                  Upload Official Learning Material
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600">
                  Questions are grounded strictly in your source material. Supported formats: <span className="font-bold text-[#111111]">PDF</span>, <span className="font-bold text-[#111111]">DOCX</span>, or <span className="font-bold text-[#111111]">TXT</span> (max 15MB).
                </p>
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border-2 border-[#111111]">
                <button
                  type="button"
                  onClick={() => setSourceMode('file')}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    sourceMode === 'file' ? 'bg-[#111111] text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Document File
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('text')}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    sourceMode === 'text' ? 'bg-[#111111] text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Paste Content
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: File Drop or Text Area */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Guideline / Circular Title
                  </label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={e => setDocumentTitle(e.target.value)}
                    placeholder="e.g., MoSPI India Data Quality Framework (IDQF) 2024"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#111111] text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                  />
                </div>

                {sourceMode === 'file' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      selectedFile ? 'border-emerald-600 bg-emerald-50/40' : 'border-zinc-400 hover:border-black bg-zinc-50/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#111111] flex items-center justify-center shadow-brutal-sm">
                        <Upload className="w-6 h-6 text-[#111111]" />
                      </div>
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-bold text-emerald-950 font-display">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs font-mono text-zinc-600">
                            {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to change file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-zinc-900">
                            Click to browse or drop PDF / DOCX file
                          </p>
                          <p className="text-xs font-mono text-zinc-500 mt-1">
                            Maintains page numbers, headings, tables, and exact citations
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 mb-1">
                      Document Text Content
                    </label>
                    <textarea
                      rows={8}
                      value={documentText}
                      onChange={e => setDocumentText(e.target.value)}
                      placeholder="Paste guideline text, circular provisions, or training sections..."
                      className="w-full p-4 rounded-xl border-2 border-[#111111] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                    />
                  </div>
                )}
              </div>

              {/* Right 1 Col: Process Action & Doc Metadata */}
              <div className="card-brutal bg-[#F8F7F2] p-5 border-2 border-[#111111] rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    Security &amp; Processing
                  </span>
                  <ul className="text-xs text-zinc-700 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Validated MIME, extension, and content structure.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Encrypted, owner-isolated chunk repository.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Zero synthetic data or hallucinated page references.</span>
                    </li>
                  </ul>

                  {uploadedDocInfo && (
                    <div className="pt-3 border-t-2 border-zinc-300 text-xs font-mono space-y-1 bg-white p-3 rounded-xl border border-zinc-300">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ready for Generation</span>
                      </div>
                      <div className="text-zinc-600">Pages: <span className="font-bold text-black">{uploadedDocInfo.page_count}</span></div>
                      <div className="text-zinc-600">Sections: <span className="font-bold text-black">{uploadedDocInfo.chunk_count}</span></div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUploadDocument}
                  disabled={uploading}
                  className="w-full btn-brutal-primary !text-xs !py-3 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{generationProgress || 'Reading document...'}</span>
                    </>
                  ) : uploadedDocInfo ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Re-process Document</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Process Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: GENERATION SETTINGS */}
          {uploadedDocInfo && (
            <div className="card-brutal bg-white p-6 sm:p-8 shadow-brutal border-2 border-[#111111] space-y-6">
              <div className="border-b-2 border-zinc-200 pb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#0F766E]">
                  STEP 2 &bull; KNOWLEDGE CHECK PARAMETERS
                </span>
                <h2 className="text-lg sm:text-xl font-black font-display text-[#111111]">
                  Configure Knowledge Check
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600">
                  Select question count, difficulty, question styles, and associate with a Karmayogi civil service competency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Question Count */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setNumQuestions(cnt)}
                        className={`py-2 text-xs font-mono font-bold rounded-xl border-2 border-[#111111] transition-all shadow-brutal-sm ${
                          numQuestions === cnt ? 'bg-[#F2A900] text-black font-black' : 'bg-white hover:bg-zinc-100'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Beginner', 'Intermediate', 'Advanced'].map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`py-2 text-[11px] font-mono font-bold rounded-xl border-2 border-[#111111] transition-all shadow-brutal-sm ${
                          difficulty === diff ? 'bg-[#0B1F3A] text-white font-black' : 'bg-white hover:bg-zinc-100'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Types */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">
                    Question Formats
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'MCQ', label: 'Multiple Choice' },
                      { key: 'SCENARIO', label: 'Scenario' },
                      { key: 'TRUE_FALSE', label: 'True / False' }
                    ].map(t => {
                      const active = questionTypes.includes(t.key);
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            if (active && questionTypes.length > 1) {
                              setQuestionTypes(questionTypes.filter(x => x !== t.key));
                            } else if (!active) {
                              setQuestionTypes([...questionTypes, t.key]);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl border-2 border-[#111111] shadow-brutal-sm transition-all ${
                            active ? 'bg-emerald-700 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}{t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Competency Association */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">
                    Karmayogi Competency
                  </label>
                  <select
                    value={selectedCompetencyId}
                    onChange={e => setSelectedCompetencyId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
                  >
                    {competencies.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.name} ({c.domain_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateCheck}
                  disabled={generating}
                  className="btn-brutal-primary !text-sm !py-3 !px-8 flex items-center gap-2 shadow-brutal-md"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Preparing knowledge check...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#F2A900]" />
                      <span>GENERATE KNOWLEDGE CHECK &rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AUTHOR REVIEW WORKSPACE */}
          {currentQuiz && (
            <div className="card-brutal bg-white p-6 sm:p-8 shadow-brutal-lg border-2 border-[#111111] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-[#F2A900] text-black">
                      {currentQuiz.status} v{currentQuiz.version}
                    </span>
                    <span className="text-xs font-mono text-zinc-600">
                      Target: {currentQuiz.subskill_name || 'General'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-[#111111] mt-1">
                    {currentQuiz.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddQuestionModal(true)}
                    className="btn-brutal-outline !text-xs !py-2 !px-3 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    className="btn-brutal-outline !text-xs !py-2 !px-3 inline-flex items-center gap-1.5"
                  >
                    {savingDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishCheck}
                    disabled={publishing}
                    className="btn-brutal-primary !text-xs !py-2 !px-4 inline-flex items-center gap-1.5 !bg-[#0F766E] !text-white"
                  >
                    {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5 text-[#FCD34D]" />}
                    <span>PUBLISH CHECK</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-600">
                  <span>{currentQuiz.questions.length} Questions Generated</span>
                  <span>Estimated Time: ~{currentQuiz.time_estimate_mins} mins</span>
                </div>

                {currentQuiz.questions.map((q, idx) => (
                  <div 
                    key={q.id || idx} 
                    className="card-brutal bg-[#F8F7F2] p-5 border-2 border-[#111111] rounded-2xl space-y-4 shadow-brutal-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-white border border-zinc-300 text-[10px] font-mono font-bold text-zinc-700">
                              {q.question_type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white border border-zinc-300 text-[10px] font-mono font-bold text-zinc-700">
                              Page {q.source_page}
                            </span>
                            <span className="text-xs font-mono text-zinc-500">
                              {q.source_section}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base font-bold text-[#111111]">
                            {q.question_text}
                          </p>
                        </div>
                      </div>

                      {/* Question Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setSourcePreviewItem(q)}
                          className="p-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700"
                          title="View Source Excerpt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingQuestion(q)}
                          className="p-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700"
                          title="Edit Question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateQuestion(q.id)}
                          className="p-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700"
                          title="Regenerate Question"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`p-3 rounded-xl border-2 text-xs font-medium flex items-center gap-2 ${
                            opt.is_correct
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                              : 'border-zinc-300 bg-white text-zinc-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                            opt.is_correct ? 'bg-emerald-700 text-white' : 'border border-zinc-400'
                          }`}>
                            {opt.is_correct ? '✓' : String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation snippet */}
                    <div className="pl-10 text-xs text-zinc-600 italic border-l-2 border-zinc-300 ml-4">
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTHOR DASHBOARD (Drafts, Published, Archived)                     */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="card-brutal bg-white p-6 sm:p-8 shadow-brutal border-2 border-[#111111] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#0F766E]">
                MANAGEMENT WORKSPACE
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#111111]">
                Your Knowledge Checks
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Manage all drafts and published assessments authored under your account.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="btn-brutal-primary !text-xs !py-2 !px-4"
            >
              + Create New Check
            </button>
          </div>

          {loadingDashboard ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-700" />
              Loading your authored checks...
            </div>
          ) : dashboardQuizzes.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-bold text-zinc-700">No Knowledge Checks authored yet.</p>
              <p className="text-xs text-zinc-500">Upload a guideline document to create your first grounded check.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="btn-brutal-primary !text-xs !py-2 !px-4 mt-2"
              >
                Create Your First Check
              </button>
            </div>
          ) : (
            <div className="divide-y-2 divide-zinc-200">
              {dashboardQuizzes.map(q => (
                <div key={q.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        q.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-950 border border-emerald-800' : 'bg-amber-100 text-amber-950 border border-amber-800'
                      }`}>
                        {q.status} v{q.version}
                      </span>
                      <span className="text-xs font-mono text-zinc-600">
                        {q.subskill_name}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#111111] font-display">
                      {q.title}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      Source: {q.document_title} &bull; {q.questions_count} Questions
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/quiz?checkId=${q.id}`}
                      className="btn-brutal-outline !text-xs !py-1.5 !px-3"
                    >
                      Learner Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW SOURCE PROVENANCE                                             */}
      {/* ========================================================================= */}
      {sourcePreviewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-brutal bg-white p-6 max-w-xl w-full border-2 border-[#111111] shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F766E]" />
                <h3 className="text-base font-bold font-display text-[#111111]">
                  Verified Source Provenance
                </h3>
              </div>
              <button 
                onClick={() => setSourcePreviewItem(null)} 
                className="text-zinc-500 hover:text-black font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-300 font-mono space-y-1">
                <div><span className="text-zinc-500">Source Page:</span> <strong className="text-black">Page {sourcePreviewItem.source_page}</strong></div>
                <div><span className="text-zinc-500">Section:</span> <strong className="text-black">{sourcePreviewItem.source_section}</strong></div>
              </div>

              <div>
                <span className="font-mono font-bold uppercase text-[11px] text-zinc-500 block mb-1">
                  Verbatim Document Excerpt:
                </span>
                <blockquote className="p-4 bg-amber-50 rounded-xl border-l-4 border-[#F2A900] text-zinc-800 text-xs sm:text-sm leading-relaxed font-serif italic">
                  &ldquo;{sourcePreviewItem.evidence_text || sourcePreviewItem.source_citation}&rdquo;
                </blockquote>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-950 font-mono text-[11px]">
                <strong>Explanation:</strong> {sourcePreviewItem.explanation}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSourcePreviewItem(null)}
                className="btn-brutal-primary !text-xs !py-2 !px-4"
              >
                Close Provenance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MANUAL QUESTION                                                */}
      {/* ========================================================================= */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddManualQuestion} className="card-brutal bg-white p-6 max-w-2xl w-full border-2 border-[#111111] shadow-brutal-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <h3 className="text-base font-bold font-display text-[#111111]">
                Add Question Manually
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddQuestionModal(false)} 
                className="text-zinc-500 hover:text-black font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold uppercase text-zinc-700 mb-1">Question Text</label>
                <input
                  type="text"
                  required
                  value={newQText}
                  onChange={e => setNewQText(e.target.value)}
                  placeholder="e.g., What is the minimum k-anonymity parameter required under Section 2?"
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold uppercase text-zinc-700 mb-1">Source Page</label>
                  <input
                    type="number"
                    min={1}
                    value={newQPage}
                    onChange={e => setNewQPage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-zinc-700 mb-1">Question Format</label>
                  <select
                    value={newQType}
                    onChange={e => setNewQType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] text-xs bg-white"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="SCENARIO">Scenario</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-mono font-bold uppercase text-zinc-700">Options (Select radio for correct)</label>
                {newQOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_opt"
                      checked={opt.is_correct}
                      onChange={() => {
                        setNewQOptions(newQOptions.map((o, idx) => ({
                          ...o,
                          is_correct: idx === i
                        })));
                      }}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQOptions(newQOptions.map((o, idx) => idx === i ? { ...o, text: val } : o));
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 text-xs bg-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-zinc-700 mb-1">Source Excerpt / Evidence</label>
                <textarea
                  rows={2}
                  value={newQEvidence}
                  onChange={e => setNewQEvidence(e.target.value)}
                  placeholder="Paste excerpt from source document that verifies this question..."
                  className="w-full p-2.5 rounded-xl border-2 border-[#111111] text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-zinc-700 mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={newQExplanation}
                  onChange={e => setNewQExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is right based on the source..."
                  className="w-full p-2.5 rounded-xl border-2 border-[#111111] text-xs bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="btn-brutal-outline !text-xs !py-2 !px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-brutal-primary !text-xs !py-2 !px-4"
              >
                Add Question
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In to Access Knowledge Check Studio"
        message="Sign in to upload official training documents, generate verified questions, and publish knowledge checks."
        returnUrl="/quiz/studio"
      />
    </div>
  );
}
