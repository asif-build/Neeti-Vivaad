'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, FileText, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, Building, Briefcase, GraduationCap, Award, 
  Plus, X, RefreshCcw, AlertCircle, Loader2, Check
} from 'lucide-react';
import { authFetch, getAccessToken, getApiBaseUrl, getSavedUser, setSavedUser } from '../../utils/api';

export default function ProfileSetupPage() {
  const router = useRouter();

  // Multi-step flow: 'upload' | 'review' | 'complete'
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Reading your resume...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form State (All Editable)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [experienceYears, setExperienceYears] = useState<string>('3');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState<string>('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Check authentication & load existing profile if available
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login?returnUrl=/profile/setup');
      return;
    }

    // Load initial user details
    authFetch('/api/auth/me/')
      .then(res => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then(data => {
        if (data.user) {
          if (data.user.first_name) setFirstName(data.user.first_name);
          if (data.user.last_name) setLastName(data.user.last_name);
          if (data.user.designation) setDesignation(data.user.designation);

          const prof = data.user.official_profile;
          if (prof) {
            if (prof.designation) setDesignation(prof.designation);
            if (prof.department) setDepartment(prof.department);
            if (prof.organisation) setOrganisation(prof.organisation);
            if (prof.experience_years) setExperienceYears(String(prof.experience_years));
            if (prof.education) setEducation(prof.education);
            if (prof.skills && Array.isArray(prof.skills) && prof.skills.length > 0) {
              setSkillsList(prof.skills);
            }
          }
        }
      })
      .catch(() => {
        router.push('/login?returnUrl=/profile/setup');
      });
  }, [router]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Unsupported file type. Please upload a PDF, DOCX, or TXT document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('The file is larger than 10MB. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
  };

  // Upload & Process Resume
  const handleUploadResume = async () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }

    setLoading(true);
    setLoadingMsg('Reading your resume...');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      setTimeout(() => {
        setLoadingMsg('Building your profile...');
      }, 1200);

      const res = await authFetch('/api/auth/onboarding/resume-upload/', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      const extracted = data.extracted_data || {};

      // Pre-fill state with extracted data
      if (extracted.first_name) setFirstName(extracted.first_name);
      if (extracted.last_name) setLastName(extracted.last_name);
      if (extracted.designation) setDesignation(extracted.designation);
      if (extracted.department) setDepartment(extracted.department);
      if (extracted.organisation) setOrganisation(extracted.organisation);
      if (extracted.experience_years !== undefined && extracted.experience_years !== null) {
        setExperienceYears(String(extracted.experience_years));
      }
      if (extracted.education) setEducation(extracted.education);

      if (extracted.certifications) {
        if (Array.isArray(extracted.certifications)) {
          const certNames = extracted.certifications.map((c: any) => typeof c === 'string' ? c : (c.name || 'Cert')).join(', ');
          setCertifications(certNames);
        } else {
          setCertifications(String(extracted.certifications));
        }
      }

      // Skills
      let rawSkills: string[] = [];
      if (data.skills && Array.isArray(data.skills)) {
        rawSkills = data.skills.map((s: any) => typeof s === 'string' ? s : (s.skill || '')).filter(Boolean);
      } else if (extracted.skills && Array.isArray(extracted.skills)) {
        rawSkills = extracted.skills.map((s: any) => typeof s === 'string' ? s : (s.skill || '')).filter(Boolean);
      }

      if (rawSkills.length > 0) {
        setSkillsList(rawSkills);
      } else {
        setSkillsList(['Public Administration', 'Data Quality Analysis', 'Policy Evaluation']);
      }

      // Transition to Review step
      setStep('review');
    } catch (err) {
      console.error('[ProfileSetup] Resume upload error:', err);
      setErrorMsg("We couldn't read that resume. Please check the file and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add a new skill
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const clean = newSkillInput.trim();
    if (!skillsList.includes(clean)) {
      setSkillsList([...skillsList, clean]);
    }
    setNewSkillInput('');
  };

  // Remove a skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  // Save Profile
  const handleSaveProfile = async () => {
    if (!designation.trim()) {
      setErrorMsg('Please enter your current designation or role.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Saving your profile...');
    setErrorMsg(null);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      designation: designation.trim(),
      department: department.trim() || 'Department of Official Statistics',
      organisation: organisation.trim() || 'Government of India',
      experience_years: parseFloat(experienceYears) || 3.0,
      education: education.trim(),
      skills: skillsList,
      certifications: certifications.trim()
    };

    try {
      const res = await authFetch('/api/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save profile');
      }

      const resData = await res.json();

      // Update cached saved user
      const savedUser = getSavedUser();
      if (savedUser) {
        setSavedUser({
          ...savedUser,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          designation: designation.trim(),
          profile_complete: true
        });
      }

      // Transition to completion step
      setStep('complete');
    } catch (err) {
      console.error('[ProfileSetup] Save profile error:', err);
      setErrorMsg("We're having trouble connecting right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1040px] mx-auto space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 sm:p-8 shadow-brutal-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#061120] border-2 border-[#111111] text-[#FCD34D] text-xs font-mono shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
            <span className="font-bold uppercase tracking-wider">
              {step === 'upload' && 'STEP 1 &bull; BUILD YOUR PROFILE'}
              {step === 'review' && 'STEP 2 &bull; REVIEW PROFILE'}
              {step === 'complete' && 'COMPLETED &bull; PROFILE READY'}
            </span>
          </div>

          <h1 className="display-section text-white">
            {step === 'upload' && 'Build Your Profile from Your Resume'}
            {step === 'review' && 'Review Your Profile'}
            {step === 'complete' && 'Your Profile is Ready ✓'}
          </h1>

          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-medium">
            {step === 'upload' && 'Upload your resume and we\'ll identify your experience, skills and areas of work.'}
            {step === 'review' && 'Check the information extracted from your resume. Everything is fully editable.'}
            {step === 'complete' && 'We\'ve created your learning profile. You can now explore courses selected for your role and skills.'}
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="card-brutal bg-red-50 border-2 border-red-600 p-4 sm:p-5 flex items-start gap-3 shadow-brutal-sm text-red-900">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm font-medium">
            <p className="font-bold">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD RESUME */}
      {/* ========================================================================= */}
      {step === 'upload' && (
        <div className="card-brutal bg-white p-6 sm:p-10 space-y-6 shadow-brutal-md">
          
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#0B1F3A] border-t-[#F2A900] animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="font-display font-extrabold uppercase text-lg text-[#111111]">
                  {loadingMsg}
                </h3>
                <p className="text-xs text-[#4B5563] font-mono">
                  This only takes a few seconds...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Drag & Drop Upload Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-150 ${
                  dragActive 
                    ? 'border-[#0F766E] bg-teal-50 scale-[0.99]' 
                    : selectedFile 
                      ? 'border-[#0B1F3A] bg-[#F8F7F2]' 
                      : 'border-zinc-300 hover:border-[#111111] hover:bg-[#F8F7F2]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="space-y-3 max-w-md mx-auto pointer-events-none">
                  {selectedFile ? (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-[#111111] shadow-brutal-sm flex items-center justify-center mx-auto text-[#0F766E]">
                      <FileText className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#F8F7F2] border-2 border-[#111111] shadow-brutal-sm flex items-center justify-center mx-auto text-[#111111]">
                      <Upload className="w-7 h-7" />
                    </div>
                  )}

                  <div className="space-y-1">
                    {selectedFile ? (
                      <>
                        <h4 className="font-display font-extrabold text-base text-[#111111]">
                          {selectedFile.name}
                        </h4>
                        <p className="text-xs font-mono text-[#0F766E] font-bold">
                          {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to process
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-display font-extrabold text-base uppercase text-[#111111]">
                          Choose your resume file or drag &amp; drop here
                        </h4>
                        <p className="text-xs text-[#4B5563] font-medium">
                          Supported formats: PDF, DOCX, TXT (up to 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-zinc-100">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="text-xs font-mono font-bold text-[#4B5563] hover:text-[#111111] underline"
                >
                  Skip upload and enter details manually →
                </button>

                <button
                  type="button"
                  onClick={handleUploadResume}
                  className="w-full sm:w-auto btn-brutal-primary !text-sm !py-3.5 !px-8 flex items-center justify-center gap-2 shadow-brutal-md font-bold"
                >
                  <Upload className="w-4 h-4" />
                  <span>UPLOAD RESUME</span>
                </button>
              </div>
            </>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REVIEW & EDIT PROFILE */}
      {/* ========================================================================= */}
      {step === 'review' && (
        <div className="card-brutal bg-white p-6 sm:p-10 space-y-8 shadow-brutal-md">
          
          <div className="flex items-center justify-between pb-4 border-b-2 border-zinc-200">
            <div>
              <h2 className="font-display font-black text-xl uppercase text-[#111111]">
                Profile Information
              </h2>
              <p className="text-xs text-[#4B5563] font-medium">
                Verify or edit any details before saving your profile.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep('upload')}
              className="btn-brutal-secondary !text-xs !py-2 !px-3.5 flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>Upload Different File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Rajesh"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Kumar"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Designation / Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Current Designation / Role *</span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Statistical Officer"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Department / Division</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Survey Design & Research Division"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Organisation */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                Organisation / Ministry
              </label>
              <input
                type="text"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder="e.g. Ministry of Statistics and Programme Implementation"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Years of Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-[#111111]">
                Years of Experience
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Education */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Education / Qualifications</span>
              </label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. M.Sc in Statistics, University of Delhi"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>

            {/* Certifications */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Certifications &amp; Courses</span>
              </label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="e.g. Certified Data Quality Specialist, iGOT Karmayogi Governance"
                className="w-full p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-3 pt-4 border-t-2 border-zinc-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-xs font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
                <span>Identified Skills &amp; Areas of Work ({skillsList.length})</span>
              </label>
              <span className="text-[11px] font-mono text-[#4B5563]">
                Click &ldquo;×&rdquo; to remove or use the input below to add more.
              </span>
            </div>

            {/* Skill Badges */}
            <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-[#F8F7F2] border-2 border-[#111111]">
              {skillsList.length === 0 ? (
                <span className="text-xs font-mono text-[#4B5563] italic">
                  No skills listed yet. Add skills below.
                </span>
              ) : (
                skillsList.map((skill, sIdx) => (
                  <span 
                    key={sIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] shadow-brutal-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#4B5563] hover:text-red-600 transition-colors p-0.5"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Skill Input */}
            <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add a new skill (e.g. Sampling Design, DPDP Compliance)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 p-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-brutal-sm"
              />
              <button
                type="submit"
                className="btn-brutal-secondary !text-xs !py-3 !px-4 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-[#111111]">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] hover:bg-zinc-50 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSaveProfile}
              className="w-full sm:w-auto btn-brutal-emerald !text-sm !py-3.5 !px-8 flex items-center justify-center gap-2 shadow-brutal-md font-bold disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingMsg}</span>
                </>
              ) : (
                <>
                  <span>SAVE PROFILE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: COMPLETION STATE */}
      {/* ========================================================================= */}
      {step === 'complete' && (
        <div className="card-brutal bg-white p-8 sm:p-12 text-center space-y-6 shadow-brutal-lg max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-[#111111] shadow-brutal-sm flex items-center justify-center mx-auto text-[#0F766E]">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-black text-2xl uppercase text-[#111111]">
              Your Profile is Ready ✓
            </h2>
            <p className="text-sm text-[#374151] font-medium leading-relaxed max-w-md mx-auto">
              We&apos;ve created your learning profile. You can now explore courses selected for your role and skills.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto btn-brutal-primary !text-xs !py-3 !px-6 flex items-center justify-center gap-2 shadow-brutal-sm font-bold"
            >
              <span>VIEW MY PROFILE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/courses"
              className="w-full sm:w-auto btn-brutal-secondary !text-xs !py-3 !px-6 flex items-center justify-center gap-2 shadow-brutal-sm font-bold"
            >
              <span>EXPLORE COURSES</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
