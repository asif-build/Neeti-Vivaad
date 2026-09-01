'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, User, Briefcase, GraduationCap, Sparkles, 
  CheckCircle2, ArrowRight, BookOpen, Shield, HelpCircle, Award
} from 'lucide-react';
import { authFetch, getSavedUser, setSavedUser, getAccessToken } from '../../utils/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organisation, setOrganisation] = useState('National Statistical Office (NSO)');
  const [department, setDepartment] = useState('NSO Field Operations Division');
  const [designation, setDesignation] = useState('Senior Statistical Officer');
  const [experience, setExperience] = useState('5');
  const [education, setEducation] = useState('M.Sc. Statistics / Econometrics');
  const [skills, setSkills] = useState('Sampling Design, SQL, Data Validation, Survey Audit');
  const [prefLearning, setPrefLearning] = useState('Interactive Case Studies & Simulated Policy Debates');

  // Baseline Questions State
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [baselineResult, setBaselineResult] = useState<any>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch current profile
    authFetch('/api/auth/me/')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setFirstName(data.user.first_name || '');
          setLastName(data.user.last_name || '');
          if (data.user.organisation) setOrganisation(data.user.organisation);
          if (data.user.department) setDepartment(data.user.department);
          if (data.user.designation) setDesignation(data.user.designation);
          if (data.user.experience_years) setExperience(String(data.user.experience_years));
          if (data.user.education) setEducation(data.user.education);
          if (data.user.skills && Array.isArray(data.user.skills)) setSkills(data.user.skills.join(', '));

          // If profile is already complete but baseline is not
          if (data.user.profile_complete && !data.user.baseline_completed) {
            setStep(2);
            loadBaselineQuestions();
          } else if (data.user.profile_complete && data.user.baseline_completed) {
            router.push('/dashboard');
          }
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const loadBaselineQuestions = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/assessment/baseline/');
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch {
      setError('Failed to load baseline questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const res = await authFetch('/api/profile/', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          organisation,
          department,
          designation,
          experience_years: parseFloat(experience) || 0,
          education,
          skills: skillsArray,
          learning_preferences: { preferred_modality: prefLearning }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSavedUser(data.user);
      setStep(2);
      loadBaselineQuestions();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, optionIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [String(questionId)]: optionIdx
    }));
  };

  const handleBaselineSubmit = async () => {
    // Check that all questions are answered
    if (Object.keys(answers).length < questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/assessment/baseline/submit/', {
        method: 'POST',
        body: JSON.stringify({ answers })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit assessment.');
      }

      setBaselineResult(data);
      setStep(3);

      // Refresh user profile in localStorage
      const meRes = await authFetch('/api/auth/me/');
      const meData = await meRes.json();
      if (meData.user) setSavedUser(meData.user);
    } catch (err: any) {
      setError(err.message || 'Submission error.');
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
            <span>Neeti-Vivaad Official Onboarding</span>
          </div>
          <h1 className="text-3xl font-semibold text-[#171717] tracking-tight">
            {step === 1 && 'Complete Your Official Profile'}
            {step === 2 && 'Baseline Competency Assessment'}
            {step === 3 && 'Competency Profile Initialized!'}
          </h1>
          <p className="text-sm text-[#707070] max-w-xl mx-auto">
            {step === 1 && 'Provide your official details to establish role competency requirements and career benchmarks.'}
            {step === 2 && 'Answer calibrated baseline questions to evaluate your real baseline proficiencies across 4 MoSPI domains.'}
            {step === 3 && 'Your personalized competency radar, CTQ quotient, and skill gaps have been calculated from your answers.'}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${step >= 1 ? 'text-[#171717]' : 'text-zinc-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-[#171717] text-[#3ecf8e]' : 'bg-zinc-200 text-zinc-600'}`}>1</span>
              <span>Profile Setup</span>
            </div>
            <div className="w-8 h-px bg-zinc-300" />
            <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${step >= 2 ? 'text-[#171717]' : 'text-zinc-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-[#171717] text-[#3ecf8e]' : 'bg-zinc-200 text-zinc-600'}`}>2</span>
              <span>Baseline Test</span>
            </div>
            <div className="w-8 h-px bg-zinc-300" />
            <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${step >= 3 ? 'text-[#171717]' : 'text-zinc-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-[#171717] text-[#3ecf8e]' : 'bg-zinc-200 text-zinc-600'}`}>3</span>
              <span>Competency Ready</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Profile Setup Form */}
        {step === 1 && (
          <form onSubmit={handleProfileSubmit} className="card-supa-light space-y-6 shadow-xl border border-[#dfdfdf] bg-white p-8 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Designation / Cadre</label>
                <input
                  type="text"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Statistical Officer"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Department / Division</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. NSO Field Operations Division"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Ministry / Organisation</label>
                <input
                  type="text"
                  value={organisation}
                  onChange={e => setOrganisation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#707070] uppercase font-medium">Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#707070] uppercase font-medium">Highest Education / Qualifications</label>
              <input
                type="text"
                value={education}
                onChange={e => setEducation(e.target.value)}
                placeholder="e.g. M.Sc. Statistics (Delhi University), PG Diploma in Data Analytics"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#707070] uppercase font-medium">Current Skills (Comma separated)</label>
              <input
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="Sampling Design, SQL, Data Validation, Field Audit"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#707070] uppercase font-medium">Learning Preferences</label>
              <input
                type="text"
                value={prefLearning}
                onChange={e => setPrefLearning(e.target.value)}
                placeholder="e.g. Simulated Policy Debates, Case Studies, Python Exercises"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#dfdfdf] text-sm focus:border-[#3ecf8e] focus:outline-none bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-green py-3 text-sm font-medium shadow-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Saving Profile...' : 'Save Profile & Proceed to Baseline Test'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Baseline Assessment Questions */}
        {step === 2 && (
          <div className="space-y-6">
            {loading && questions.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-[#707070]">Loading calibrated baseline questions...</div>
            ) : (
              <>
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="card-supa-light bg-white border border-[#dfdfdf] p-6 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-[#ededed] pb-3">
                        <span className="text-[11px] font-mono text-[#3ecf8e] uppercase font-semibold">
                          Q{qIndex + 1} · {q.domain_name} ({q.subskill_code})
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          {q.subskill_name}
                        </span>
                      </div>

                      <h3 className="text-sm font-medium text-[#171717] leading-relaxed">
                        {q.question_text}
                      </h3>

                      <div className="space-y-2 pt-2">
                        {q.options.map((optText: string, optIdx: number) => {
                          const isSelected = answers[String(q.id)] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-3 ${
                                isSelected
                                  ? 'border-[#3ecf8e] bg-emerald-50/50 text-[#171717] font-medium shadow-xs'
                                  : 'border-[#dfdfdf] bg-[#fafafa] text-[#505050] hover:border-zinc-400'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 ${
                                isSelected ? 'bg-[#3ecf8e] text-black font-bold' : 'bg-zinc-200 text-zinc-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{optText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleBaselineSubmit}
                    disabled={loading}
                    className="w-full btn-primary-green py-3 text-sm font-medium shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Evaluating Answers & Generating Profile...' : `Submit Baseline Assessment (${Object.keys(answers).length}/${questions.length} Answered)`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Baseline Result & Competency Profile Generated */}
        {step === 3 && baselineResult && (
          <div className="card-supa-light bg-white border border-[#dfdfdf] p-8 rounded-xl space-y-6 shadow-xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#24b47e] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-semibold text-[#171717]">
                Official Competency Profile Successfully Initialized
              </h2>
              <p className="text-xs text-[#707070]">
                Baseline accuracy: {baselineResult.correct_answers} / {baselineResult.total_questions} questions correct.
              </p>
            </div>

            {/* CTQ & Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-[#fafafa] border border-[#dfdfdf] text-center space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#707070]">Initial CTQ Score</span>
                <div className="text-3xl font-bold text-[#171717]">{baselineResult.calculated_ctq}</div>
                <span className="text-[10px] text-[#24b47e] font-mono">Critical Thinking Quotient</span>
              </div>

              <div className="p-4 rounded-lg bg-[#fafafa] border border-[#dfdfdf] text-center space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#707070]">Baseline Accuracy</span>
                <div className="text-3xl font-bold text-[#171717]">
                  {Math.round((baselineResult.correct_answers / baselineResult.total_questions) * 100)}%
                </div>
                <span className="text-[10px] text-[#707070] font-mono">Calibrated Assessment</span>
              </div>

              <div className="p-4 rounded-lg bg-[#fafafa] border border-[#dfdfdf] text-center space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#707070]">Skill Gaps Identified</span>
                <div className="text-3xl font-bold text-rose-600">Active</div>
                <span className="text-[10px] text-rose-600 font-mono">Ready for iGOT matching</span>
              </div>
            </div>

            {/* Domain Scores List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase text-[#707070] font-medium">Domain Proficiency Averages:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {baselineResult.domain_scores.map((d: any) => (
                  <div key={d.domain_id} className="p-3 rounded-lg bg-[#fafafa] border border-[#ededed] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#171717]">{d.domain_name}</span>
                    <span className="text-xs font-mono font-bold text-[#24b47e]">{d.average_score} / 100</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full btn-primary-green py-3 text-sm font-medium shadow-sm flex items-center justify-center gap-2"
              >
                <span>Proceed to Personal Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
