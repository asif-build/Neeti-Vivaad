'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, User, Briefcase, GraduationCap, Sparkles, 
  CheckCircle2, ArrowRight, ArrowLeft, BookOpen, Shield, 
  HelpCircle, Award, Upload, FileText, Trash2, Plus, Edit2, 
  AlertTriangle, Loader2, Check, X, Sliders, Target, Clock
} from 'lucide-react';
import { authFetch, getSavedUser, setSavedUser, getAccessToken, getApiBaseUrl } from '../../utils/api';

interface SkillItem {
  id?: string;
  skill: string;
  evidence: string;
  confidence: number;
  source: string;
  user_confirmed: boolean;
  domain_type: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: Resume Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawResumeText, setRawResumeText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(null);

  // Step 2: Extracted Skills State
  const [skillsList, setSkillsList] = useState<SkillItem[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDomain, setNewSkillDomain] = useState('STATISTICAL');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Step 3: Career Goals State
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Statistical Officer');
  const [careerGoal, setCareerGoal] = useState('');

  // Step 4: Learning Preferences State
  const [preferredFormats, setPreferredFormats] = useState<string[]>([
    'Interactive Policy Simulations',
    'Case Studies & Micro-Modules'
  ]);
  const [weeklyHours, setWeeklyHours] = useState('5');
  const [preferredDifficulty, setPreferredDifficulty] = useState('Intermediate');

  // Step 5: Competency Engine Results State
  const [competencyResult, setCompetencyResult] = useState<any>(null);

  useEffect(() => {
    router.replace('/profile/setup');
  }, [router]);

  // -------------------------------------------------------------
  // STEP 1: Handle Resume File Upload & Extraction
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit. Please upload a smaller document.');
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!uploadedFile && !rawResumeText.trim()) {
      setError('Please select a resume file (PDF, DOCX, TXT) or enter resume text.');
      return;
    }

    setExtracting(true);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('resume', uploadedFile);
      } else {
        formData.append('resume_text', rawResumeText.trim());
      }

      const base = getApiBaseUrl();
      const res = await authFetch('/api/onboarding/resume-upload/', {
        method: 'POST',
        headers: {}, // FormData sets Content-Type automatically with boundary
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract resume data.');
      }

      setExtractedProfile(data.extracted_data);
      if (data.skills && Array.isArray(data.skills)) {
        setSkillsList(data.skills);
      }
      if (data.extracted_data?.designation) {
        setCurrentRole(data.extracted_data.designation);
      }

      setSuccessMsg('Resume parsed and analyzed successfully.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buddy-guidance', {
          detail: {
            type: 'resume_uploaded',
            message: "Nice! Your resume is uploaded. I’ve created your profile from it. Have a look and make any changes you want."
          }
        }));
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing the resume.');
    } finally {
      setExtracting(false);
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: Handle Skill Review (Confirm, Edit, Remove, Add)
  // -------------------------------------------------------------
  const handleToggleSkill = (index: number) => {
    setSkillsList(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, user_confirmed: !s.user_confirmed };
      }
      return s;
    }));
  };

  const handleRemoveSkill = (index: number) => {
    setSkillsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStartEditSkill = (index: number) => {
    setEditingIndex(index);
    setEditingText(skillsList[index].skill);
  };

  const handleSaveEditSkill = (index: number) => {
    if (!editingText.trim()) return;
    setSkillsList(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, skill: editingText.trim() };
      }
      return s;
    }));
    setEditingIndex(null);
    setEditingText('');
  };

  const handleAddCustomSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill: SkillItem = {
      skill: newSkillName.trim(),
      evidence: 'Officer manually attested proficiency during onboarding',
      confidence: 0.90,
      source: 'MANUAL_ENTRY',
      user_confirmed: true,
      domain_type: newSkillDomain
    };
    setSkillsList(prev => [newSkill, ...prev]);
    setNewSkillName('');
  };

  const handleSaveSkillsAndProceed = async () => {
    const activeSkills = skillsList.filter(s => s.user_confirmed);
    if (activeSkills.length === 0) {
      setError('Please confirm at least one skill or add a skill to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/onboarding/confirm-skills/', {
        method: 'POST',
        body: JSON.stringify({ skills: activeSkills })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save confirmed skills.');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error updating skills.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3: Handle Career Goals & Target Role
  // -------------------------------------------------------------
  const handleSaveCareerGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError('Please select or specify your target role.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/onboarding/career-goals/', {
        method: 'POST',
        body: JSON.stringify({
          current_role: currentRole.trim(),
          target_role: targetRole.trim(),
          career_goal: careerGoal.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save career goals.');
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Error saving career goals.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 4: Handle Learning Preferences & Generate Competencies
  // -------------------------------------------------------------
  const handleToggleFormat = (fmt: string) => {
    setPreferredFormats(prev => 
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    );
  };

  const handleFinalizeOnboarding = async () => {
    if (preferredFormats.length === 0) {
      setError('Please select at least one preferred learning format.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Save preferences
      const prefRes = await authFetch('/api/onboarding/learning-preferences/', {
        method: 'POST',
        body: JSON.stringify({
          preferred_formats: preferredFormats,
          weekly_hours: parseFloat(weeklyHours) || 5.0,
          preferred_difficulty: preferredDifficulty
        })
      });

      if (!prefRes.ok) {
        const pData = await prefRes.json();
        throw new Error(pData.error || 'Failed to save learning preferences.');
      }

      // 2. Finalize competency engine
      const compRes = await authFetch('/api/onboarding/finalize-competencies/', {
        method: 'POST'
      });

      const compData = await compRes.json();
      if (!compRes.ok) {
        throw new Error(compData.error || 'Failed to generate competency profile.');
      }

      setCompetencyResult(compData);
      setSavedUser(compData.user);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buddy-guidance', {
          detail: {
            type: 'profile_ready',
            message: "Great! Your profile is ready. Let’s see which skills you can strengthen."
          }
        }));
      }
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding calibration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Neeti Saarthi Profile Setup</span>
          </div>
          
          <h1 className="text-3xl font-semibold text-[#171717] tracking-tight">
            {step === 1 && 'Upload Your Resume / CV'}
            {step === 2 && 'Review & Confirm Your Skills'}
            {step === 3 && 'Your Role & Career Goals'}
            {step === 4 && 'How You Like to Learn'}
            {step === 5 && 'Your Profile Is Ready!'}
          </h1>
          
          <p className="text-sm text-[#374151] font-medium max-w-xl mx-auto">
            {step === 1 && 'Upload your resume or CV. We will create a personalized profile of your professional experience and skills.'}
            {step === 2 && 'Here are the skills identified from your resume. You can edit, remove, or add any skills to keep your profile accurate.'}
            {step === 3 && 'Tell us your current position and where you would like to grow next so we can suggest relevant opportunities.'}
            {step === 4 && 'Choose how much time you have and your preferred learning style so we recommend courses that fit your schedule.'}
            {step === 5 && 'Your profile has been created with a clear breakdown of your strengths and recommended areas to grow.'}
          </p>

          {/* Stepper Dots (1 to 5) */}
          <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
            {[
              { num: 1, label: 'Resume / CV' },
              { num: 2, label: 'Your Skills' },
              { num: 3, label: 'Role & Goals' },
              { num: 4, label: 'Preferences' },
              { num: 5, label: 'Summary' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${step >= s.num ? 'text-[#171717]' : 'text-zinc-700 font-semibold'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= s.num ? 'bg-[#171717] text-[#3ecf8e]' : 'bg-zinc-200 text-zinc-600'}`}>
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < 4 && <div className="w-6 h-px bg-zinc-300 hidden sm:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 1: Resume Upload & Gemini Analysis
        ------------------------------------------------------------- */}
        {step === 1 && (
          <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#dfdfdf] hover:border-[#3ecf8e] p-8 rounded-xl bg-[#fafafa] flex flex-col items-center justify-center text-center cursor-pointer transition-colors space-y-3"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden" 
                />
                
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#3ecf8e] flex items-center justify-center border border-emerald-200">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#171717]">
                    {uploadedFile ? uploadedFile.name : 'Click to Upload Resume or Drag & Drop'}
                  </h3>
                  <p className="text-xs text-[#374151] font-medium mt-0.5">
                    Supports PDF, DOCX, and TXT (Max 10MB)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-mono">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{(uploadedFile.size / 1024).toFixed(1)} KB &bull; Ready to Analyze</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="text-xs text-[#111111] hover:text-[#000000] underline font-mono font-bold"
                >
                  {showTextInput ? 'Hide Text Paste Option' : 'Or Paste Resume Text Directly'}
                </button>
              </div>

              {showTextInput && (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-mono text-[#111111] uppercase font-bold">Resume Text Content</label>
                  <textarea
                    rows={6}
                    value={rawResumeText}
                    onChange={e => setRawResumeText(e.target.value)}
                    placeholder="Paste resume or CV text here..."
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-xs font-mono text-[#111111] placeholder:text-[#4B5563] focus:border-[#3ecf8e] focus:outline-none bg-white"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="block font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-700" /> Accurate Profile Creation:
              </strong>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                We read your resume to identify your skills and experience accurately. You will be able to review, edit, or remove anything in the next step.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUploadAndAnalyze}
              disabled={loading || (!uploadedFile && !rawResumeText.trim())}
              className="w-full btn-primary-green py-3 text-sm font-semibold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reading Resume & Identifying Skills...</span>
                </>
              ) : (
                <>
                  <span>Create My Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 2: Skill Review & Confirmation
        ------------------------------------------------------------- */}
        {step === 2 && (
          <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
            
            {extractedProfile && (
              <div className="p-4 rounded-xl bg-[#fafafa] border border-[#ededed] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#111111] block font-mono font-bold">EXTRACTED ROLE:</span>
                  <strong className="text-[#171717]">{extractedProfile.designation || 'Statistical Officer'}</strong>
                </div>
                <div>
                  <span className="text-[#111111] block font-mono font-bold">DEPARTMENT:</span>
                  <strong className="text-[#171717]">{extractedProfile.department || 'MoSPI'}</strong>
                </div>
                <div>
                  <span className="text-[#111111] block font-mono font-bold">EXPERIENCE:</span>
                  <strong className="text-[#171717]">{extractedProfile.experience_years || 0} Years</strong>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#171717]">Extracted Competencies & Skills</h3>
                <p className="text-xs text-[#374151] font-medium">Verify evidence snippets and confirm capabilities.</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {skillsList.filter(s => s.user_confirmed).length} / {skillsList.length} Confirmed
              </span>
            </div>

            {/* Add New Custom Skill Input */}
            <div className="p-3.5 rounded-lg bg-[#fafafa] border border-[#dfdfdf] flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                placeholder="Add custom skill (e.g. Sampling Design, Time Series CPI)..."
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] placeholder:text-[#4B5563] font-medium bg-white focus:outline-none focus:border-[#3ecf8e]"
              />
              <select
                value={newSkillDomain}
                onChange={e => setNewSkillDomain(e.target.value)}
                className="px-2.5 py-2 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] font-medium bg-white focus:outline-none"
              >
                <option value="STATISTICAL">Statistical</option>
                <option value="TECHNICAL">Technical & Tools</option>
                <option value="DIGITAL_GOVERNANCE">Digital Governance</option>
                <option value="BEHAVIOURAL">Behavioural & Leadership</option>
              </select>
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="btn-primary-green px-4 py-2 text-xs font-semibold shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Skills List with Evidence */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {skillsList.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-lg border transition-all ${
                    item.user_confirmed 
                      ? 'border-[#dfdfdf] bg-white hover:border-[#3ecf8e]' 
                      : 'border-zinc-200 bg-zinc-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(idx)}
                        className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                          item.user_confirmed 
                            ? 'bg-[#3ecf8e] border-[#3ecf8e] text-black font-bold' 
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {item.user_confirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1">
                        {editingIndex === idx ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs text-[#111111] font-medium border rounded focus:outline-none focus:border-[#3ecf8e]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditSkill(idx)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px]"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-xs text-[#171717]">{item.skill}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase">
                              {item.domain_type || 'STATISTICAL'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {Math.round(item.confidence * 100)}% Confidence
                            </span>
                          </div>
                        )}

                        <p className="text-[11px] text-[#374151] font-medium mt-1 italic font-sans">
                          &ldquo;{item.evidence}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSkill(idx)}
                        className="p-1 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                        title="Edit Skill Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="p-1 rounded text-zinc-600 hover:text-rose-600 hover:bg-rose-50"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#ededed]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary-outline px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Re-upload</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSkillsAndProceed}
                disabled={loading}
                className="btn-primary-green px-6 py-2.5 text-xs font-semibold shadow-xs flex items-center gap-2"
              >
                <span>{loading ? 'Saving...' : 'Confirm Skills & Set Goals'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 3: Career Goals & Target Cadre
        ------------------------------------------------------------- */}
        {step === 3 && (
          <form onSubmit={handleSaveCareerGoals} className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#111111] uppercase font-bold">Current Role</label>
                <input
                  type="text"
                  value={currentRole}
                  onChange={e => setCurrentRole(e.target.value)}
                  placeholder="e.g. Statistical Officer"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] font-medium placeholder:text-[#4B5563] focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#111111] uppercase font-bold">Role You Are Aiming For</label>
                <select
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] font-medium focus:border-[#3ecf8e] focus:outline-none bg-white font-sans"
                >
                  <option value="Senior Statistical Officer">Senior Statistical Officer</option>
                  <option value="Assistant Director (Statistics)">Assistant Director (Statistics)</option>
                  <option value="Deputy Director (Economic Statistics)">Deputy Director (Economic Statistics)</option>
                  <option value="Director (National Accounts Division)">Director (National Accounts Division)</option>
                  <option value="Data Analytics & Anomaly Specialist">Data Analytics & Anomaly Specialist</option>
                  <option value="Digital Governance & Privacy Officer">Digital Governance & Privacy Officer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#111111] uppercase font-bold">Career Goals & Learning Interests</label>
                <textarea
                  rows={4}
                  value={careerGoal}
                  onChange={e => setCareerGoal(e.target.value)}
                  placeholder="e.g. Modernize digital survey processes, lead national statistics estimation, and strengthen data governance."
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] font-medium placeholder:text-[#4B5563] focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#ededed]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary-outline px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Skills</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-green px-6 py-2.5 text-xs font-semibold shadow-xs flex items-center gap-2"
              >
                <span>{loading ? 'Saving...' : 'Save & Set Learning Preferences'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* -------------------------------------------------------------
            STEP 4: Learning Preferences & Final Profile Calibration
        ------------------------------------------------------------- */}
        {step === 4 && (
          <div className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
            <div className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#111111] uppercase font-bold block">
                  How You Prefer to Learn (Select any that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Interactive Policy Exercises',
                    'Case Studies & Short Modules',
                    'Practical Data Exercises',
                    'Quick Knowledge Checks',
                    'Video Lessons & Masterclasses'
                  ].map(fmt => {
                    const isSelected = preferredFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleToggleFormat(fmt)}
                        className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'border-[#3ecf8e] bg-emerald-50/50 text-[#171717] font-semibold' 
                            : 'border-[#dfdfdf] bg-[#fafafa] text-[#111111] font-medium hover:border-zinc-500'
                        }`}
                      >
                        <span>{fmt}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#111111] uppercase font-bold">Weekly Study Time (Hours)</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-600" />
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={weeklyHours}
                      onChange={e => setWeeklyHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] font-medium focus:border-[#3ecf8e] focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#111111] uppercase font-bold">Preferred Course Level</label>
                  <select
                    value={preferredDifficulty}
                    onChange={e => setPreferredDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-xs text-[#111111] font-medium focus:border-[#3ecf8e] focus:outline-none bg-white font-sans"
                  >
                    <option value="Foundational">Foundational (Concepts & Overview)</option>
                    <option value="Intermediate">Intermediate (Practical & Analytical)</option>
                    <option value="Advanced">Advanced (Strategic & Policy Leadership)</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#ededed]">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-secondary-outline px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Goals</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeOnboarding}
                disabled={loading}
                className="btn-primary-green px-6 py-2.5 text-xs font-semibold shadow-xs flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting Up Your Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Profile Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            STEP 5: Results & Summary
        ------------------------------------------------------------- */}
        {step === 5 && competencyResult && (
          <div className="card-supa-light bg-white border border-[#dfdfdf] p-8 rounded-xl space-y-6 shadow-xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#24b47e] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-semibold text-[#171717]">
                Your Profile is Ready
              </h2>
              <p className="text-xs text-[#374151] font-medium">
                Your skills overview has been prepared across all 4 key areas of government work.
              </p>
            </div>

            {/* Domain Scores Breakdown */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase text-[#111111] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" />
                Skill Overview (0 to 100):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {competencyResult.domain_scores?.map((d: any) => (
                  <div key={d.domain_id} className="p-3.5 rounded-lg bg-[#fafafa] border border-[#ededed] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#171717] block">{d.domain_name}</span>
                      <span className="text-[10px] font-mono text-[#374151] font-bold uppercase">{d.domain_type}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#24b47e]">{d.average_score} / 100</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Identified Gaps */}
            {competencyResult.top_gaps && competencyResult.top_gaps.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono uppercase text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Recommended Areas to Grow:
                </h4>
                <div className="space-y-2">
                  {competencyResult.top_gaps.map((g: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#171717]">{g.subskill_name}</strong>
                        <span className="text-[10px] font-mono text-[#374151] font-medium block">
                          Current: {g.current_score}% &bull; Recommended: {g.target_score}%
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono font-semibold text-rose-700 bg-rose-100 text-[11px]">
                        Focus Area
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full btn-primary-green py-3 text-sm font-semibold shadow-xs flex items-center justify-center gap-2"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
