'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Scale, FileText, Sparkles, Plus, Trash2, Edit3, CheckCircle2, 
  ArrowRight, RefreshCw, Upload, ShieldCheck, AlertTriangle, 
  Users, Layers, Eye, BookOpen, ChevronRight, XCircle
} from 'lucide-react';
import { authFetch, getAccessToken } from '../../utils/api';
import { AuthModal } from '../../components/AuthModal';

interface PerspectiveItem {
  id?: number;
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

interface VivaadScenarioDraft {
  scenario_id: number;
  title: string;
  source_type: string;
  source_label: string;
  category: string;
  difficulty: string;
  status: string;
  version: number;
  situation: string;
  decision_question: string;
  objective: string;
  constraints: string[];
  affected_people: string[];
  risks: string[];
  options: DecisionOption[];
  perspectives: PerspectiveItem[];
}

export default function VivaadStudioPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'dashboard'>('create');
  const [isAuth, setIsAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Creation Mode: Option A (Document) vs Option B (Custom)
  const [creationMode, setCreationMode] = useState<'document' | 'custom'>('document');

  // Option A State
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [uploadedSourceInfo, setUploadedSourceInfo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option B State
  const [customTitle, setCustomTitle] = useState('');
  const [customSituation, setCustomSituation] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customConstraints, setCustomConstraints] = useState('');

  // Common Metadata
  const [category, setCategory] = useState('Data Policy');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [generating, setGenerating] = useState(false);

  // Studio Workspace / Review State
  const [draft, setDraft] = useState<VivaadScenarioDraft | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Perspective Modal / Add State
  const [showAddPerspModal, setShowAddPerspModal] = useState(false);
  const [newPerspName, setNewPerspName] = useState('');
  const [newPerspRole, setNewPerspRole] = useState('');
  const [newPerspColor, setNewPerspColor] = useState('blue');
  const [newPerspConcern, setNewPerspConcern] = useState('');
  const [newPerspPosition, setNewPerspPosition] = useState('');
  const [newPerspEvidence, setNewPerspEvidence] = useState('');
  const [newPerspPage, setNewPerspPage] = useState<number | ''>('');

  // Dashboard State
  const [dashboardScenarios, setDashboardScenarios] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuth(!!token);
    if (token) {
      loadDashboard();
    }
  }, []);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await authFetch('/api/debate/studio/dashboard/');
      if (res.ok) {
        const d = await res.json();
        setDashboardScenarios(d.scenarios || []);
      }
    } catch (e) {
      console.error('Error loading studio dashboard', e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleUploadSource = async () => {
    if (!sourceFile) return;
    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', sourceFile);
    formData.append('title', sourceFile.name);

    try {
      const res = await authFetch('/api/debate/studio/source/', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document.');
      setUploadedSourceInfo(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading source.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateScenario = async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    setGenerating(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        category,
        difficulty
      };

      if (creationMode === 'document') {
        if (!uploadedSourceInfo) {
          throw new Error('Please upload a source document first.');
        }
        payload.source_id = uploadedSourceInfo.source_id;
        payload.title = uploadedSourceInfo.title;
      } else {
        if (!customSituation.trim()) {
          throw new Error('Please describe the policy situation/background.');
        }
        payload.title = customTitle.trim() || 'Custom Policy Decision Scenario';
        payload.situation = customSituation.trim();
        payload.decision_question = customQuestion.trim();
        payload.constraints = customConstraints.split('\n').map(c => c.trim()).filter(Boolean);
      }

      const res = await authFetch('/api/debate/studio/generate/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scenario synthesis failed.');
      setDraft(data);
      loadDashboard();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate scenario.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraftEdits = async () => {
    if (!draft) return;
    setSavingDraft(true);
    setErrorMsg(null);

    try {
      const res = await authFetch(`/api/debate/studio/${draft.scenario_id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: draft.title,
          situation: draft.situation,
          decision_question: draft.decision_question,
          objective: draft.objective,
          constraints: draft.constraints,
          affected_people: draft.affected_people,
          risks: draft.risks,
          options: draft.options
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save edits.');
      alert('Draft saved successfully!');
      loadDashboard();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishScenario = async () => {
    if (!draft) return;
    if (draft.perspectives.length < 2) {
      setErrorMsg('A scenario must have at least 2 perspectives before publishing.');
      return;
    }
    if (draft.options.length < 2) {
      setErrorMsg('A scenario must have at least 2 decision options before publishing.');
      return;
    }

    setPublishing(true);
    setErrorMsg(null);

    try {
      const res = await authFetch(`/api/debate/studio/${draft.scenario_id}/publish/`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publishing failed.');
      setPublishSuccess(data);
      setDraft(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
      loadDashboard();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleAddPerspective = async () => {
    if (!draft) return;
    if (!newPerspName || !newPerspRole || !newPerspPosition) {
      alert('Please fill in Name, Role, and Position.');
      return;
    }

    try {
      const res = await authFetch(`/api/debate/studio/${draft.scenario_id}/perspectives/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          name: newPerspName,
          role: newPerspRole,
          avatar_color: newPerspColor,
          primary_concern: newPerspConcern,
          position: newPerspPosition,
          relevant_evidence: newPerspEvidence,
          source_page: newPerspPage || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add perspective.');

      setDraft({
        ...draft,
        perspectives: [...draft.perspectives, data.perspective]
      });
      setShowAddPerspModal(false);
      setNewPerspName('');
      setNewPerspRole('');
      setNewPerspConcern('');
      setNewPerspPosition('');
      setNewPerspEvidence('');
      setNewPerspPage('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeletePerspective = async (perspId: number) => {
    if (!draft) return;
    if (!confirm('Remove this stakeholder perspective from the scenario?')) return;

    try {
      const res = await authFetch(`/api/debate/studio/${draft.scenario_id}/perspectives/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          perspective_id: perspId
        })
      });
      if (res.ok) {
        setDraft({
          ...draft,
          perspectives: draft.perspectives.filter(p => p.id !== perspId)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadScenarioFromDashboard = async (scenarioId: number) => {
    try {
      const res = await authFetch(`/api/debate/studio/${scenarioId}/`);
      if (res.ok) {
        const data = await res.json();
        setDraft(data);
        setActiveTab('create');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">Neeti Vivaad Studio</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                Policy Simulation Authoring
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Author Scenario
              </button>
              <button
                onClick={() => { setActiveTab('dashboard'); loadDashboard(); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Scenarios ({dashboardScenarios.length})
              </button>
            </div>

            <Link
              href="/debate"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 border border-emerald-300 bg-emerald-50/60 px-3 py-1.5 rounded-md transition"
            >
              <Eye className="w-3.5 h-3.5" />
              Learner View
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Action Required</p>
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Publish Success Alert */}
        {publishSuccess && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <div>
                <h4 className="font-bold">Scenario Published Successfully!</h4>
                <p className="text-xs text-emerald-800">
                  Version {publishSuccess.version} is now available in the public civil servant simulation catalog.
                </p>
              </div>
            </div>
            <Link
              href={`/debate?scenario=${publishSuccess.scenario_id}`}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
            >
              Test as Learner <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          /* DASHBOARD VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Scenario Studio</h2>
                <p className="text-xs text-slate-500">Drafts, published simulations, and policy case studies.</p>
              </div>
              <button
                onClick={() => { setDraft(null); setActiveTab('create'); }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create New Scenario
              </button>
            </div>

            {loadingDashboard ? (
              <div className="p-12 text-center text-slate-400">Loading your scenarios...</div>
            ) : dashboardScenarios.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                <Scale className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700">No scenarios created yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Synthesize an authentic policy decision simulation from an uploaded government policy document or custom case study.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Create Your First Scenario
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dashboardScenarios.map((sc) => (
                  <div key={sc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          sc.status === 'PUBLISHED' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {sc.status} (v{sc.version})
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {sc.source_label}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">{sc.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {sc.perspectives_count} Perspectives</span>
                        <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {sc.options_count} Options</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => loadScenarioFromDashboard(sc.id)}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Workspace
                      </button>
                      {sc.status === 'PUBLISHED' && (
                        <Link
                          href={`/debate?scenario=${sc.id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Test
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* AUTHORING / REVIEW WORKSPACE */
          <div className="space-y-8">
            {!draft ? (
              /* SCENARIO GENERATOR WIZARD */
              <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Scenario Generator
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">Create a Policy Decision Simulation</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a creation method below to generate stakeholder perspectives, constraints, and decision options.
                  </p>
                </div>

                {/* Creation Mode Tabs */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setCreationMode('document')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      creationMode === 'document'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={`w-4 h-4 ${creationMode === 'document' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs text-slate-900">Option A: Document-Backed</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Upload PDF/DOCX (guidelines, SOP, audit report). Citations and evidence are strictly bound to page numbers.
                    </p>
                  </button>

                  <button
                    onClick={() => setCreationMode('custom')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      creationMode === 'custom'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Edit3 className={`w-4 h-4 ${creationMode === 'custom' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs text-slate-900">Option B: Custom Policy Case</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Paste a real scenario description, dilemma question, and operational constraints. Clearly labeled as custom.
                    </p>
                  </button>
                </div>

                {creationMode === 'document' ? (
                  /* Option A File Upload */
                  <div className="space-y-4 mb-6">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/30"
                    >
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">
                        {sourceFile ? sourceFile.name : 'Click to select PDF or DOCX file'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 10MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSourceFile(e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    {sourceFile && !uploadedSourceInfo && (
                      <button
                        onClick={handleUploadSource}
                        disabled={uploading}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extracting Structure & Page Boundaries...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verify & Ingest Document
                          </>
                        )}
                      </button>
                    )}

                    {uploadedSourceInfo && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>
                            <strong>{uploadedSourceInfo.title}</strong> ({uploadedSourceInfo.page_count} pages, {uploadedSourceInfo.chunk_count} sections)
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-900">
                          Ready for Synthesis
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Option B Custom Form */
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Scenario Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Automated Welfare Beneficiary Verification Dilemma"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Situation / Policy Dilemma <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe the operational background, competing stakeholder priorities, and field tensions..."
                        value={customSituation}
                        onChange={(e) => setCustomSituation(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Question</label>
                      <input
                        type="text"
                        placeholder="e.g. How should the ministry resolve conflicting speed and biometric error mandates?"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Operational Constraints (one per line)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Statutory compliance with DPDP Act 2023&#10;Zero budget increase for hardware replacements"
                        value={customConstraints}
                        onChange={(e) => setCustomConstraints(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                {/* Common Settings */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Data Policy">Data Policy & Governance</option>
                      <option value="Statistical Methodology">Statistical Methodology</option>
                      <option value="Field Operations">Field Operations & Administration</option>
                      <option value="Public Accountability">Public Accountability & Grievance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Foundation">Foundation</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced (Senior Policy)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateScenario}
                  disabled={generating || (creationMode === 'document' && !uploadedSourceInfo)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Perspectives & Decision Trade-offs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Synthesize Simulation Draft
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* DRAFT REVIEW & PERSPECTIVE WORKSPACE */
              <div className="space-y-6">
                {/* Draft Banner & Actions */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                        {draft.status} (v{draft.version})
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {draft.source_label}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{draft.title}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveDraftEdits}
                      disabled={savingDraft}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      {savingDraft ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                      onClick={handlePublishScenario}
                      disabled={publishing}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      {publishing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Publishing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Publish Scenario
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section 1: Situation & Constraints Editor */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" /> Situation & Decision Context
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Scenario Title</label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Situation Description</label>
                    <textarea
                      rows={4}
                      value={draft.situation}
                      onChange={(e) => setDraft({ ...draft, situation: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Dilemma Question</label>
                    <input
                      type="text"
                      value={draft.decision_question}
                      onChange={(e) => setDraft({ ...draft, decision_question: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-semibold text-emerald-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Operational Constraints ({draft.constraints?.length || 0})
                      </label>
                      <textarea
                        rows={3}
                        value={(draft.constraints || []).join('\n')}
                        onChange={(e) => setDraft({ ...draft, constraints: e.target.value.split('\n') })}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Affected Groups ({draft.affected_people?.length || 0})
                      </label>
                      <textarea
                        rows={3}
                        value={(draft.affected_people || []).join('\n')}
                        onChange={(e) => setDraft({ ...draft, affected_people: e.target.value.split('\n') })}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Stakeholder Perspectives Workspace */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-700" /> Stakeholder Perspectives ({draft.perspectives.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Dynamic in-character arguments representing distinct administrative, technical, and citizen concerns.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddPerspModal(true)}
                      className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stakeholder
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {draft.perspectives.map((p, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                              <span className="text-[11px] font-semibold text-emerald-800">{p.role}</span>
                            </div>
                            {p.id && (
                              <button
                                onClick={() => handleDeletePerspective(p.id!)}
                                className="text-slate-400 hover:text-red-600 transition"
                                title="Remove perspective"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Primary Concern</span>
                            <p className="text-xs text-slate-700 font-medium">{p.primary_concern}</p>
                          </div>

                          <div className="mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Position</span>
                            <p className="text-xs text-slate-600 italic">"{p.position}"</p>
                          </div>

                          {p.relevant_evidence && (
                            <div className="p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-600 mb-2">
                              <span className="font-semibold text-slate-800">Source Evidence: </span>
                              {p.relevant_evidence}
                              {p.source_page && <span className="text-emerald-700 font-bold ml-1">(p. {p.source_page})</span>}
                            </div>
                          )}
                        </div>

                        {p.key_questions && p.key_questions.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <span className="text-[10px] font-semibold text-slate-500">Key Inquiry:</span>
                            <p className="text-[11px] text-slate-600">{p.key_questions[0]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Decision Options */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" /> Decision Options & Trade-offs ({draft.options.length})
                  </h3>

                  <div className="space-y-3">
                    {draft.options.map((opt, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-white flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const newOpts = [...draft.options];
                              newOpts[idx].label = e.target.value;
                              setDraft({ ...draft, options: newOpts });
                            }}
                            className="w-full text-xs font-bold text-slate-900 mb-1 border-b border-transparent focus:border-slate-300 focus:outline-none"
                          />
                          <textarea
                            rows={2}
                            value={opt.description}
                            onChange={(e) => {
                              const newOpts = [...draft.options];
                              newOpts[idx].description = e.target.value;
                              setDraft({ ...draft, options: newOpts });
                            }}
                            className="w-full text-xs text-slate-600 border border-slate-100 rounded p-1.5 focus:border-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Stakeholder Modal */}
      {showAddPerspModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Stakeholder Perspective</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Sharma"
                  value={newPerspName}
                  onChange={(e) => setNewPerspName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Risk Officer"
                  value={newPerspRole}
                  onChange={(e) => setNewPerspRole(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Concern</label>
              <input
                type="text"
                placeholder="e.g. Auditability and Statutory Exposure"
                value={newPerspConcern}
                onChange={(e) => setNewPerspConcern(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Position / Argument</label>
              <textarea
                rows={3}
                placeholder="State the stakeholder's core argument and why they advocate or object..."
                value={newPerspPosition}
                onChange={(e) => setNewPerspPosition(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Evidence</label>
                <input
                  type="text"
                  placeholder="e.g. Audit Report Section 4"
                  value={newPerspEvidence}
                  onChange={(e) => setNewPerspEvidence(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page No.</label>
                <input
                  type="number"
                  placeholder="e.g. 14"
                  value={newPerspPage}
                  onChange={(e) => setNewPerspPage(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddPerspModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPerspective}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
              >
                Save Stakeholder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to Author Simulations"
        message="Sign in to create, edit, and publish policy decision scenarios for civil servants."
        returnUrl="/debate/studio"
      />
    </div>
  );
}
