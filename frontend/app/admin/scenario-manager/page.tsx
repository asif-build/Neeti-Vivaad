'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GitBranch, Workflow, Settings2, Plus, CheckCircle2, 
  AlertTriangle, ShieldCheck, FileText, BarChart3, 
  Trash2, Edit3, X, RefreshCw, ArrowRight, Play, 
  Layers, Clock, HelpCircle, Sparkles
} from 'lucide-react';

interface ReferenceDoc {
  id: number;
  title: string;
  doc_code: string;
  publisher: string;
  document_type: string;
  page_reference: string;
  is_indexed: boolean;
}

interface Constraint {
  id?: number;
  name: string;
  description: string;
  impact?: string;
  trigger_round: number;
}

interface Scenario {
  id: number;
  title: string;
  category: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Active' | 'Archived';
  initial_constraint?: string;
  learning_objective?: string;
  attempts_count: number;
  average_ctq: number;
  reference_sources_count: number;
  constraints_count: number;
  reference_sources: ReferenceDoc[];
  constraints: Constraint[];
  updated_at: string;
}

export default function ScenarioManagerPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [allRefs, setAllRefs] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnalyticsScenario, setSelectedAnalyticsScenario] = useState<Scenario | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedConstraintScenario, setSelectedConstraintScenario] = useState<Scenario | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Data Policy');
  const [newDesc, setNewDesc] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newStatus, setNewStatus] = useState<'Draft' | 'Active' | 'Archived'>('Active');
  const [newConstraint, setNewConstraint] = useState('');
  const [newLearningObj, setNewLearningObj] = useState('');
  const [selectedRefIds, setSelectedRefIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Add Constraint Form State
  const [conName, setConName] = useState('');
  const [conDesc, setConDesc] = useState('');
  const [conImpact, setConImpact] = useState('');
  const [conRound, setConRound] = useState(2);
  const [conError, setConError] = useState<string | null>(null);

  const defaultScenarios: Scenario[] = [
    {
      id: 1,
      title: 'Direct Benefit Transfer (DBT) Survey Redesign: Continuous Digital Capture vs 5-Year Sample',
      category: 'Data Policy',
      description: 'Debate on replacing traditional periodic paper sample surveys with real-time digital household microdata capture across rural and urban blocks.',
      difficulty: 'Intermediate',
      status: 'Active',
      initial_constraint: 'Standard 2026 MoSPI Operational Budget',
      learning_objective: 'Evaluate data velocity trade-offs against multi-stage confidence interval stability.',
      attempts_count: 124,
      average_ctq: 76.4,
      reference_sources_count: 2,
      constraints_count: 2,
      reference_sources: [
        { id: 1, title: 'India Data Quality Framework 2024', doc_code: 'MOSPI-IDQF-2024', publisher: 'MoSPI', document_type: 'Official Policy Standard', page_reference: 'Section 4.2', is_indexed: true },
        { id: 2, title: 'National Statistical Commission Multi-Stage Guidelines', doc_code: 'NSC-SAMPLING-2024', publisher: 'NSC', document_type: 'Technical Guidelines', page_reference: 'Chapter 3', is_indexed: true }
      ],
      constraints: [
        { id: 1, name: 'Budget Reduction (20%)', description: 'Mid-year 20% austerity order.', impact: 'Prioritize high density blocks.', trigger_round: 2 },
        { id: 2, name: 'Offline Sync Mandate', description: 'Daily cache flush required.', impact: 'Offline fallback protocol.', trigger_round: 3 }
      ],
      updated_at: '24 Aug 2026'
    },
    {
      id: 2,
      title: 'Mandatory Geo-tagging and Facial Verification in Agricultural Crop Yield Surveys',
      category: 'Field Operations',
      description: 'Debate on enforcing mandatory real-time GPS boundary mapping and enumerator facial authentication during kharif harvest data collection.',
      difficulty: 'Advanced',
      status: 'Active',
      initial_constraint: 'Severe rural cellular network outage reported across 4 states',
      learning_objective: 'Analyze enumerator operational burden versus fraud elimination in crop cutting experiments.',
      attempts_count: 89,
      average_ctq: 81.2,
      reference_sources_count: 2,
      constraints_count: 1,
      reference_sources: [
        { id: 3, title: 'NSO Field Operations Division CAPI Survey Manual', doc_code: 'FOD-CAPI-MANUAL-2025', publisher: 'NSO Field Directorate', document_type: 'Field Operations Manual', page_reference: 'SOP 8', is_indexed: true }
      ],
      constraints: [
        { id: 3, name: 'Cellular Blackout', description: 'Complete loss of cellular connectivity in 4 zones.', impact: 'Biometric verification offline.', trigger_round: 2 }
      ],
      updated_at: '22 Aug 2026'
    },
    {
      id: 3,
      title: 'Open Microdata Dissemination vs Strict Respondent Privacy under NDSAP 2024',
      category: 'Ethics & Privacy',
      description: 'Debate on balancing public statistical transparency with respondent identity preservation using synthetic data generators and differential noise.',
      difficulty: 'Intermediate',
      status: 'Active',
      initial_constraint: 'Compliance deadline shortened from 6 months to 30 days',
      learning_objective: 'Determine optimal k-anonymity parameters without compromising econometric microdata utility.',
      attempts_count: 64,
      average_ctq: 79.5,
      reference_sources_count: 2,
      constraints_count: 1,
      reference_sources: [
        { id: 4, title: 'NDSAP Microdata Privacy Mandates', doc_code: 'NDSAP-PRIVACY-2023', publisher: 'MeitY & MoSPI', document_type: 'Gazette Notification', page_reference: 'Clause 12', is_indexed: true }
      ],
      constraints: [
        { id: 4, name: 'Accelerated Compliance Order', description: 'High Court mandate requiring microdata release in 30 days.', impact: 'Precludes manual de-identification.', trigger_round: 2 }
      ],
      updated_at: '19 Aug 2026'
    }
  ];

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      let resScenarios = await fetch('/api/admin/scenarios/', {
        headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
      }).catch(() => null);

      if (!resScenarios || !resScenarios.ok) {
        resScenarios = await fetch('http://localhost:8000/api/admin/scenarios/', {
          headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
        }).catch(() => null);
      }

      if (resScenarios && resScenarios.ok) {
        const dataScenarios = await resScenarios.json();
        setScenarios(dataScenarios.scenarios && dataScenarios.scenarios.length > 0 ? dataScenarios.scenarios : defaultScenarios);
      } else {
        setScenarios(defaultScenarios);
      }

      let resRefs = await fetch('/api/admin/reference-documents/', {
        headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
      }).catch(() => null);

      if (resRefs && resRefs.ok) {
        const dataRefs = await resRefs.json();
        setAllRefs(dataRefs.reference_documents || []);
      }
    } catch {
      setScenarios(defaultScenarios);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Rule: Cannot set to Active without valid reference sources
    if (newStatus === 'Active' && selectedRefIds.length === 0) {
      setFormError('A scenario cannot be set to Active status without at least one valid reference source for RAG grounding.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/admin/scenarios/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': localStorage.getItem('user_role') || 'ADMIN'
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          description: newDesc,
          difficulty: newDifficulty,
          status: newStatus,
          initial_constraint: newConstraint,
          learning_objective: newLearningObj,
          reference_source_ids: selectedRefIds
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create scenario.');
      }

      // Reset form & reload
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewConstraint('');
      setNewLearningObj('');
      setSelectedRefIds([]);
      fetchScenarios();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleAddConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConstraintScenario) return;
    setConError(null);

    if (!conName || !conDesc) {
      setConError('Constraint name and description are required.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/admin/scenarios/${selectedConstraintScenario.id}/constraints/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': localStorage.getItem('user_role') || 'ADMIN'
        },
        body: JSON.stringify({
          name: conName,
          description: conDesc,
          impact: conImpact,
          trigger_round: conRound
        })
      });

      if (!res.ok) throw new Error('Failed to add constraint.');

      setConName('');
      setConDesc('');
      setConImpact('');
      setConRound(2);
      setSelectedConstraintScenario(null);
      fetchScenarios();
    } catch (err: any) {
      setConError(err.message);
    }
  };

  const fetchAnalytics = async (scenario: Scenario) => {
    setSelectedAnalyticsScenario(scenario);
    setAnalyticsData(null);
    try {
      const res = await fetch(`http://localhost:8000/api/admin/scenarios/${scenario.id}/analytics/`, {
        headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
      });
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteScenario = async (id: number) => {
    if (!confirm('Are you sure you want to delete this decision simulation scenario?')) return;
    try {
      await fetch(`http://localhost:8000/api/admin/scenarios/${id}/`, {
        method: 'DELETE',
        headers: { 'X-User-Role': localStorage.getItem('user_role') || 'ADMIN' }
      });
      fetchScenarios();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#171717] py-12 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-48 bg-[#ededed] rounded" />
          <div className="h-8 w-96 bg-[#ededed] rounded" />
          <div className="h-4 w-80 bg-[#ededed] rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-[#fafafa] border border-[#ededed] rounded-[8px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171717] py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ededed] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-mono text-purple-800 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Neeti Vivaad Simulation Engine · Content &amp; Rules Orchestration</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#171717]">Scenario Manager</h1>
          <p className="text-sm text-[#707070] mt-1 font-normal">
            Create, configure and manage evidence-grounded policy decision simulations and What-If constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchScenarios}
            className="p-2 rounded-[6px] border border-[#dfdfdf] hover:bg-[#fafafa] text-[#707070] transition-colors"
            title="Refresh Scenarios"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedRefIds(allRefs.map(r => r.id));
              setShowCreateModal(true);
            }}
            className="btn-primary-green text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Scenario</span>
          </button>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className="card-supa-light p-6 space-y-5 flex flex-col justify-between hover:border-[#c7c7c7] transition-all shadow-xs"
          >
            <div className="space-y-3.5">
              
              {/* Category & Status Badges */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#fafafa] border border-[#dfdfdf] text-[#707070]">
                  {sc.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                    sc.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {sc.status}
                  </span>
                  <span className="text-[11px] font-mono text-[#707070] border border-[#ededed] px-1.5 py-0.5 rounded">
                    {sc.difficulty}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-semibold text-[#171717] leading-snug">
                {sc.title}
              </h3>
              <p className="text-xs text-[#707070] leading-relaxed line-clamp-3">
                {sc.description}
              </p>

              {/* Metrics row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ededed] text-xs font-mono">
                <div className="p-2 rounded bg-[#fafafa] border border-[#ededed]">
                  <span className="text-[#707070] text-[10px] block">ATTEMPTS</span>
                  <span className="font-bold text-[#171717]">{sc.attempts_count} Sessions</span>
                </div>
                <div className="p-2 rounded bg-[#fafafa] border border-[#ededed]">
                  <span className="text-[#707070] text-[10px] block">AVG CTQ SCORE</span>
                  <span className="font-bold text-[#644fc1]">{sc.average_ctq} / 100</span>
                </div>
              </div>

              {/* Grounding & Constraints count summary */}
              <div className="flex items-center justify-between text-[11px] text-[#707070] pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{sc.reference_sources_count}</strong> Grounding Sources
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                  <strong>{sc.constraints_count}</strong> What-If Events
                </span>
              </div>

            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-[#ededed] flex items-center justify-between">
              <button
                onClick={() => fetchAnalytics(sc)}
                className="text-xs font-medium text-[#171717] hover:text-[#3ecf8e] transition-colors flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConstraintScenario(sc)}
                  className="px-2.5 py-1 rounded bg-[#fafafa] border border-[#dfdfdf] text-xs text-[#171717] hover:bg-[#ededed] transition-colors flex items-center gap-1 font-mono"
                  title="Manage What-If Constraints"
                >
                  <Workflow className="w-3 h-3 text-blue-600" />
                  <span>+ What-If</span>
                </button>
                <button
                  onClick={() => handleDeleteScenario(sc.id)}
                  className="p-1 text-[#707070] hover:text-rose-600 transition-colors"
                  title="Delete Scenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL 1: Create Scenario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#ededed] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-[#ededed] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#707070]">Scenario Builder</span>
                <h3 className="text-xl font-medium text-[#171717]">Create Grounded Debate Scenario</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-full hover:bg-[#fafafa] text-[#707070]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-[6px] bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateScenario} className="space-y-4 text-xs">
              
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Scenario Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Direct Benefit Transfer Survey Redesign: Continuous Digital Capture vs 5-Year Sample"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border border-[#dfdfdf] focus:border-[#171717] outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Domain Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs bg-white"
                  >
                    <option value="Data Policy">Data Policy</option>
                    <option value="Digital Governance">Digital Governance</option>
                    <option value="Field Operations">Field Operations</option>
                    <option value="Ethics & Privacy">Ethics &amp; Privacy</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs bg-white"
                  >
                    <option value="Active">Active (RAG Grounded)</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Dilemma Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the policy conflict, analytical trade-off, or statistical trade-off..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border border-[#dfdfdf] focus:border-[#171717] outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Initial Constraint / Baseline Context</label>
                <input
                  type="text"
                  placeholder="e.g. Standard 2026 MoSPI Operational Budget"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border border-[#dfdfdf] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Learning Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Evaluate data velocity trade-offs against multi-stage confidence interval stability"
                  value={newLearningObj}
                  onChange={(e) => setNewLearningObj(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border border-[#dfdfdf] text-xs"
                />
              </div>

              {/* Reference Document Selector */}
              <div className="space-y-2 pt-2 border-t border-[#ededed]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#171717]">
                    Attach Verified Grounding Sources *
                  </label>
                  <span className="text-[11px] font-mono text-[#707070]">
                    Zero Hallucination RAG
                  </span>
                </div>
                <p className="text-[11px] text-[#707070]">
                  Select the official MoSPI, NSC, or government publications that debate agents must strictly cite.
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto border border-[#ededed] rounded-[6px] p-2 bg-[#fafafa]">
                  {allRefs.map(ref => {
                    const isChecked = selectedRefIds.includes(ref.id);
                    return (
                      <label key={ref.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedRefIds(selectedRefIds.filter(id => id !== ref.id));
                            } else {
                              setSelectedRefIds([...selectedRefIds, ref.id]);
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <span className="font-medium text-[#171717] block">{ref.title}</span>
                          <span className="text-[10px] font-mono text-[#707070]">{ref.doc_code} · {ref.publisher}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ededed]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-[6px] border border-[#dfdfdf] text-xs text-[#707070] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-5 py-2 text-xs"
                >
                  Create Grounded Scenario
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: Add What-If Constraint */}
      {selectedConstraintScenario && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#ededed] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-[#ededed] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-blue-600 font-bold block">+ What-If Dynamic Trigger</span>
                <h3 className="text-base font-semibold text-[#171717]">{selectedConstraintScenario.title}</h3>
              </div>
              <button onClick={() => setSelectedConstraintScenario(null)} className="p-1 rounded-full hover:bg-[#fafafa] text-[#707070]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {conError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {conError}
              </div>
            )}

            {/* List Existing Constraints */}
            {selectedConstraintScenario.constraints && selectedConstraintScenario.constraints.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-[#707070]">Existing Round Triggers</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedConstraintScenario.constraints.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-[#fafafa] border border-[#ededed] text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#171717]">{c.name}</span>
                        <p className="text-[11px] text-[#707070]">{c.description}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold shrink-0">
                        Round {c.trigger_round}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddConstraint} className="space-y-3 text-xs pt-2 border-t border-[#ededed]">
              <div>
                <label className="font-semibold text-[#171717] block mb-1">Constraint Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Year Budget Cut 30%"
                  value={conName}
                  onChange={(e) => setConName(e.target.value)}
                  className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#171717] block mb-1">Constraint Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe how the real-world constraint changes the policy trade-off..."
                  value={conDesc}
                  onChange={(e) => setConDesc(e.target.value)}
                  className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Trigger Round</label>
                  <select
                    value={conRound}
                    onChange={(e) => setConRound(Number(e.target.value))}
                    className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs bg-white"
                  >
                    <option value={1}>Round 1: Opening</option>
                    <option value={2}>Round 2: Cross-Examination</option>
                    <option value={3}>Round 3: Policy Synthesis</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#171717] block mb-1">Expected Policy Impact</label>
                  <input
                    type="text"
                    placeholder="e.g. Forces offline caching fallback"
                    value={conImpact}
                    onChange={(e) => setConImpact(e.target.value)}
                    className="w-full p-2 rounded-[6px] border border-[#dfdfdf] text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ededed]">
                <button
                  type="button"
                  onClick={() => setSelectedConstraintScenario(null)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#dfdfdf] text-xs text-[#707070]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-4 py-1.5 text-xs"
                >
                  Save What-If Event
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: Scenario Analytics Drawer */}
      {selectedAnalyticsScenario && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#ededed] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-[#ededed] pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-[#707070]">Scenario Performance</span>
                <h3 className="text-lg font-medium text-[#171717]">{selectedAnalyticsScenario.title}</h3>
              </div>
              <button onClick={() => setSelectedAnalyticsScenario(null)} className="p-1.5 rounded-full hover:bg-[#fafafa] text-[#707070]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {analyticsData ? (
              <div className="space-y-4 text-xs">
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded bg-[#fafafa] border border-[#ededed] text-center">
                    <span className="text-[#707070] text-[10px] block">TOTAL ATTEMPTS</span>
                    <span className="text-base font-bold text-[#171717]">{analyticsData.total_attempts}</span>
                  </div>
                  <div className="p-3 rounded bg-[#fafafa] border border-[#ededed] text-center">
                    <span className="text-[#707070] text-[10px] block">COMPLETION RATE</span>
                    <span className="text-base font-bold text-emerald-600">{analyticsData.completion_rate}</span>
                  </div>
                  <div className="p-3 rounded bg-[#fafafa] border border-[#ededed] text-center">
                    <span className="text-[#707070] text-[10px] block">AVERAGE CTQ</span>
                    <span className="text-base font-bold text-[#644fc1]">{analyticsData.average_ctq}</span>
                  </div>
                </div>

                <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ededed] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#171717]">Fallacy Detection Accuracy:</span>
                    <span className="font-mono font-bold text-blue-600">{analyticsData.fallacy_accuracy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#171717]">Decision Quality Score:</span>
                    <span className="font-mono font-bold text-emerald-600">{analyticsData.decision_score}</span>
                  </div>
                  <div className="pt-1 text-[#707070] border-t border-[#ededed]">
                    Most Common Fallacy: <strong className="text-[#171717]">{analyticsData.most_common_fallacy}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono uppercase text-[#707070] text-[11px]">Fallacy Accuracy by Type</h4>
                  <div className="space-y-1.5">
                    {analyticsData.fallacy_breakdown.map((f: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-[#fafafa] border border-[#ededed] flex items-center justify-between">
                        <span className="font-medium text-[#171717]">{f.fallacy}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-[#707070]">{f.attempts_identified} Identified</span>
                          <span className="font-bold text-emerald-700">{f.accuracy} Acc</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-[#707070]">Loading Scenario Analytics...</div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
