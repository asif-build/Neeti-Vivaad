'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Scale, MessageSquare, ShieldCheck, ChevronRight, CheckCircle2, 
  ArrowRight, RefreshCw, BookOpen, Check, X, FileText, 
  AlertCircle, ArrowLeft, Paperclip, Upload, Send, 
  ChevronDown, HelpCircle, Eye, Edit3, 
  LayoutGrid, BarChart2, Mic, MicOff, Volume2, Sparkles, ChevronUp
} from 'lucide-react';
import { authFetch, getAccessToken, getApiBaseUrl } from '../utils/api';
import { AuthModal } from '../components/AuthModal';
import { useLanguage } from '../context/LanguageContext';

// Types and Interfaces
interface SourceChunk {
  chunk_id: number;
  page_number: number;
  section_title: string;
  text: string;
}

interface ScenarioSource {
  id: number;
  title: string;
  filename: string;
  file_type: string;
  page_count: number;
  file_size: number;
  chunks: SourceChunk[];
  preview?: string;
}

interface Perspective {
  id: number;
  name: string;
  role: string;
  avatar_color: string;
  primary_concern: string;
  objective?: string;
  position: string;
  relevant_evidence?: string;
  source_page?: number | null;
  source_section?: string;
  key_questions?: string[];
}

interface DecisionOption {
  id: string;
  label: string;
  summary?: string;
  description?: string;
}

interface ScenarioDetail {
  id: number;
  title: string;
  version: number;
  category: string;
  difficulty: string;
  source_type: 'DOCUMENT' | 'CUSTOM';
  source_label: string;
  source?: ScenarioSource | null;
  situation: string;
  decision_question: string;
  objective: string;
  constraints: string[];
  affected_people: string[];
  risks: string[];
  options: DecisionOption[];
  perspectives: Perspective[];
}

interface ScenarioCatalogItem {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  version: number;
  source_type: string;
  source_label: string;
  situation_summary: string;
  decision_question: string;
  perspective_count: number;
  published_at?: string;
}

interface SimulationSession {
  session_id: number;
  scenario_id: number;
  scenario_title: string;
  version: number;
  status: string;
}

interface DialogueTurn {
  speaker: 'LEARNER' | 'PERSPECTIVE';
  message: string;
  turn_number: number;
}

interface CriteriaItem {
  label: string;
  score: number;
  explanation: string;
}

interface PerspectiveReaction {
  role: string;
  name: string;
  reaction: string;
}

interface EvaluationResult {
  overall_score: number;
  your_decision?: string;
  why_your_reasoning_works?: string;
  what_you_considered_well?: string[];
  one_thing_to_think_about?: string;
  another_perspective?: string;
  what_this_teaches_you?: string;
  next_step?: string;
  makes_sense_because?: string;
  think_about_this_too?: string[];
  another_view?: string;
  criteria_scores: Record<string, number>;
  criteria_feedback?: Record<string, CriteriaItem>;
  what_you_considered?: string[];
  areas_to_think_about?: string[];
  other_perspectives_reaction?: PerspectiveReaction[];
  what_you_did_well?: string[];
  try_next_time?: string[];
  tradeoffs_analysis?: string;
}

type Stage = 'understand' | 'views' | 'choice' | 'explain' | 'learn';

const DOMAIN_OPTIONS = [
  'Public Administration',
  'Digital Governance',
  'Health',
  'Education',
  'Environment',
  'Finance',
  'Rural Development'
];

const DIFFICULTY_OPTIONS = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

const SCENARIO_TYPES = [
  'Policy Decision',
  'Ethical Dilemma',
  'Resource Allocation',
  'Crisis Response',
  'Governance Trade-off'
];

const SAMPLE_CATEGORY_PILLS = [
  'Data Privacy',
  'AI in Governance',
  'Public Health',
  'Education Policy',
  'Urban Development',
  'Agriculture'
];

// Helper to assign a relatable emoji to different community/officer roles
const getRoleEmoji = (role: string): string => {
  const r = (role || '').toLowerCase();
  if (r.includes('teacher') || r.includes('school') || r.includes('faculty') || r.includes('shikshak')) return '👩‍🏫';
  if (r.includes('parent') || r.includes('citizen') || r.includes('resident') || r.includes('family') || r.includes('mata') || r.includes('pita')) return '👨‍👩‍👧';
  if (r.includes('privacy') || r.includes('data') || r.includes('security') || r.includes('suraksha')) return '🛡️';
  if (r.includes('education') || r.includes('officer') || r.includes('director') || r.includes('analyst') || r.includes('adhikari')) return '📋';
  if (r.includes('field') || r.includes('farmer') || r.includes('kisan') || r.includes('krishi') || r.includes('survey')) return '🌾';
  if (r.includes('health') || r.includes('doctor') || r.includes('medical') || r.includes('swasthya')) return '🏥';
  return '👤';
};

function NeetiVivaadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t, speechCode } = useLanguage();

  // Mode: Landing vs Active Simulation
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage>('understand');

  // Scenarios Catalog
  const [scenarios, setScenarios] = useState<ScenarioCatalogItem[]>([]);
  const [selectedCategoryPill, setSelectedCategoryPill] = useState<string>('Data Privacy');
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Active Scenario Detail
  const [currentScenario, setCurrentScenario] = useState<ScenarioDetail | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  // Progressive disclosure: Read more toggle in Step 1
  const [showFullContext, setShowFullContext] = useState(false);

  // Read more toggle for perspective cards in Step 2
  const [expandedViews, setExpandedViews] = useState<Record<number, boolean>>({});

  // Arena-style Input State
  const [promptText, setPromptText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(DOMAIN_OPTIONS[1]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_OPTIONS[1]);
  const [selectedType, setSelectedType] = useState(SCENARIO_TYPES[0]);

  // Dropdown menus
  const [openDropdown, setOpenDropdown] = useState<'domain' | 'difficulty' | 'type' | null>(null);

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Step 2: Interactive Dialogue with a View
  const [activePerspectiveForDialogue, setActivePerspectiveForDialogue] = useState<Perspective | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([]);
  const [learnerQuestion, setLearnerQuestion] = useState('');
  const [dialogueLoading, setDialogueLoading] = useState(false);

  // Step 3 & 4: Choice, Reasoning & Voice Input
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [reasoningText, setReasoningText] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Voice Speech Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Step 5: Evaluation Debrief State
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [showDetailedScorecard, setShowDetailedScorecard] = useState(false);
  const [processingStage, setProcessingStage] = useState<{
    stage: string;
    label: string;
    step: number;
    totalSteps: number;
  } | null>(null);

  // Source reading modal
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  // Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('Create an account to practise this scenario.');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch scenarios catalog
  const fetchScenarios = async () => {
    try {
      setCatalogLoading(true);
      const res = await authFetch('/api/debate/scenarios/');
      if (res.ok) {
        const data = await res.json();
        setScenarios(data.scenarios || []);
      }
    } catch (err) {
      console.warn('Could not fetch scenarios:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  // Fetch specific scenario detail
  const loadScenarioDetail = async (scenarioId: number): Promise<ScenarioDetail | null> => {
    try {
      setLoadingScenario(true);
      const res = await authFetch(`/api/debate/scenarios/${scenarioId}/`);
      if (res.ok) {
        const data = await res.json();
        setCurrentScenario(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching scenario detail:', err);
      return null;
    } finally {
      setLoadingScenario(false);
    }
  };

  // Check URL query param ?scenario=<id>&session=<id> or localStorage on mount/refresh
  useEffect(() => {
    const queryScenarioId = searchParams.get('scenario') || (typeof window !== 'undefined' ? localStorage.getItem('neeti_vivaad_last_scenario') : null);
    const querySessionId = searchParams.get('session') || (typeof window !== 'undefined' ? localStorage.getItem('neeti_vivaad_last_session') : null);

    if (queryScenarioId && !activeSession) {
      const sId = parseInt(queryScenarioId, 10);
      if (!isNaN(sId)) {
        loadScenarioDetail(sId).then((scen) => {
          if (scen && querySessionId) {
            const sessId = parseInt(querySessionId, 10);
            if (!isNaN(sessId)) {
              authFetch(`/api/debate/sessions/${sessId}/result/`)
                .then(async (res) => {
                  if (res.ok) {
                    const resData = await res.json();
                    setActiveSession({
                      session_id: sessId,
                      scenario_id: sId,
                      scenario_title: scen.title,
                      version: scen.version,
                      status: 'EVALUATED'
                    });
                    setEvaluationResult(resData.evaluation);
                    if (resData.decision) {
                      setSelectedOptionId(resData.decision.selected_option_label || '');
                      setReasoningText(resData.decision.reasoning || '');
                    }
                    setCurrentStage('learn');
                  } else {
                    setActiveSession({
                      session_id: sessId,
                      scenario_id: sId,
                      scenario_title: scen.title,
                      version: scen.version,
                      status: 'IN_PROGRESS'
                    });
                  }
                })
                .catch(() => {
                  setActiveSession({
                    session_id: sessId,
                    scenario_id: sId,
                    scenario_title: scen.title,
                    version: scen.version,
                    status: 'IN_PROGRESS'
                  });
                });
            }
          }
        });
      }
    }
  }, [searchParams]);

  // Auth checker helper
  const requireAuth = (actionMessage?: string): boolean => {
    const token = getAccessToken();
    if (!token) {
      if (actionMessage) setAuthModalMessage(actionMessage);
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  // Start Simulation Session
  const handleStartSimulation = async (scenarioId: number) => {
    if (!requireAuth('Create an account to practise this scenario and save your decision.')) {
      return;
    }

    try {
      setLoadingScenario(true);
      let scenario = currentScenario;
      if (!scenario || scenario.id !== scenarioId) {
        scenario = await loadScenarioDetail(scenarioId);
      }

      if (!scenario) {
        alert('Could not load scenario details.');
        return;
      }

      const res = await authFetch('/api/debate/sessions/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      if (res.ok) {
        const sessionData = await res.json();
        setActiveSession(sessionData);
        setCurrentStage('understand');
        setSelectedOptionId('');
        setReasoningText('');
        setEvaluationResult(null);
        setShowDetailedScorecard(false);
        setDialogueHistory([]);
        setActivePerspectiveForDialogue(null);
        setShowFullContext(false);
        setExpandedViews({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
          window.history.replaceState(null, '', `?scenario=${scenarioId}&session=${sessionData.session_id}`);
          localStorage.setItem('neeti_vivaad_last_scenario', String(scenarioId));
          localStorage.setItem('neeti_vivaad_last_session', String(sessionData.session_id));
        } catch (_) {}
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to start policy simulation.');
      }
    } catch (err) {
      console.error('Start session error:', err);
      alert('Network error while starting simulation.');
    } finally {
      setLoadingScenario(false);
    }
  };

  // Handle file attachment selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      setUploadError(null);
    }
  };

  // Arena Main Button: EXPLORE SCENARIO / START VIVAAD
  const handleMainPromptSubmit = async () => {
    if (attachedFile || promptText.trim()) {
      if (!requireAuth('Sign in to upload policy documents or create custom scenarios.')) {
        return;
      }

      setIsGenerating(true);
      setUploadError(null);

      try {
        let sourceId: number | null = null;

        if (attachedFile) {
          const formData = new FormData();
          formData.append('file', attachedFile);
          formData.append('title', promptText.trim() || attachedFile.name);

          const uploadRes = await authFetch('/api/debate/studio/source/', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || 'Failed to upload document source.');
          }
          const uploadData = await uploadRes.json();
          sourceId = uploadData.source_id;
        }

        const generatePayload: any = {
          category: selectedDomain,
          difficulty: selectedDifficulty,
          title: promptText.trim().slice(0, 70) || (attachedFile ? attachedFile.name.replace(/\.[^/.]+$/, '') : 'Custom Dilemma'),
          language: language
        };

        if (sourceId) {
          generatePayload.source_id = sourceId;
        } else {
          generatePayload.situation = promptText.trim();
          generatePayload.decision_question = promptText.includes('?') 
            ? promptText.trim() 
            : `What course of action should be taken regarding this issue?`;
        }

        const genRes = await authFetch('/api/debate/studio/generate/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatePayload),
        });

        if (!genRes.ok) {
          const genErr = await genRes.json();
          throw new Error(genErr.error || 'Failed to generate scenario.');
        }

        const genData = await genRes.json();
        const newScenarioId = genData.scenario_id;

        await authFetch(`/api/debate/studio/${newScenarioId}/publish/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        setAttachedFile(null);
        setPromptText('');
        fetchScenarios();
        await handleStartSimulation(newScenarioId);

      } catch (err: any) {
        console.error('Generation failure:', err);
        setUploadError(err.message || 'Error creating policy scenario.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (scenarios.length > 0) {
      handleStartSimulation(scenarios[0].id);
    } else {
      promptInputRef.current?.focus();
    }
  };

  // Follow-up interaction with a view
  const handleSendDialogueQuestion = async () => {
    if (!activeSession || !activePerspectiveForDialogue || !learnerQuestion.trim()) return;

    const question = learnerQuestion.trim();
    setLearnerQuestion('');
    setDialogueLoading(true);

    const nextTurn = dialogueHistory.length + 1;
    setDialogueHistory(prev => [
      ...prev,
      { speaker: 'LEARNER', message: question, turn_number: nextTurn }
    ]);

    try {
      const res = await authFetch(`/api/debate/sessions/${activeSession.session_id}/turn/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perspective_id: activePerspectiveForDialogue.id,
          message: question,
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDialogueHistory(prev => [
          ...prev,
          { speaker: 'PERSPECTIVE', message: data.perspective_reply, turn_number: nextTurn + 1 }
        ]);
      } else {
        const err = await res.json();
        alert(err.error || 'Could not send question.');
      }
    } catch (err) {
      console.error('Turn error:', err);
    } finally {
      setDialogueLoading(false);
    }
  };

  // Web Speech API Voice Recognition
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(t('vivaad.speech_not_supported', 'Voice input is not supported in this browser. Please type your explanation.'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechCode;
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setReasoningText(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access to speak.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech initialization error:', err);
      setSpeechError('Could not start voice recognition. Please type your reasoning.');
      setIsListening(false);
    }
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Submit Decision
  const handleSubmitDecision = async () => {
    if (!activeSession || !selectedOptionId) {
      setDecisionError('Please choose one of the options.');
      return;
    }

    if (!reasoningText.trim() || reasoningText.trim().length < 10) {
      setDecisionError('Please tell us in a few words why you chose this.');
      return;
    }

    // Stop recording if active
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (_) {}
    }

    setIsSubmittingDecision(true);
    setDecisionError(null);
    setProcessingStage({
      stage: 'understanding_decision',
      label: 'Reviewing your decision against scenario constraints...',
      step: 1,
      totalSteps: 4
    });

    try {
      const token = getAccessToken();
      const chosenOpt = currentScenario?.options?.find(o => o.id === selectedOptionId);
      const base = getApiBaseUrl();
      const streamRes = await fetch(`${base}/api/debate/sessions/${activeSession.session_id}/decide-stream/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selected_option_id: selectedOptionId,
          selected_option_label: chosenOpt?.label || selectedOptionId,
          reasoning: reasoningText.trim(),
          language: language
        })
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(trimmed.slice(6));
                if (eventData.stage === 'complete') {
                  setEvaluationResult(eventData.evaluation);
                  setCurrentStage('learn');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  try {
                    window.history.replaceState(null, '', `?scenario=${currentScenario?.id || ''}&session=${activeSession.session_id}`);
                    localStorage.setItem('neeti_vivaad_last_scenario', String(currentScenario?.id || ''));
                    localStorage.setItem('neeti_vivaad_last_session', String(activeSession.session_id));
                  } catch (_) {}
                  return;
                } else {
                  setProcessingStage({
                    stage: eventData.stage,
                    label: eventData.label,
                    step: eventData.step || 1,
                    totalSteps: eventData.total_steps || 4
                  });
                }
              } catch (_) {}
            }
          }
        }
      } else {
        // Fallback to standard endpoint
        const res = await authFetch(`/api/debate/sessions/${activeSession.session_id}/decide/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selected_option_id: selectedOptionId,
            selected_option_label: chosenOpt?.label || selectedOptionId,
            reasoning: reasoningText.trim(),
            language: language
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEvaluationResult(data.evaluation);
          setCurrentStage('learn');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          try {
            window.history.replaceState(null, '', `?scenario=${currentScenario?.id || ''}&session=${activeSession.session_id}`);
            localStorage.setItem('neeti_vivaad_last_scenario', String(currentScenario?.id || ''));
            localStorage.setItem('neeti_vivaad_last_session', String(activeSession.session_id));
          } catch (_) {}
        } else {
          const err = await res.json();
          setDecisionError(err.error || 'Failed to submit decision.');
        }
      }
    } catch (err) {
      console.error('Decision submission error:', err);
      setDecisionError('Connection error while submitting your choice.');
    } finally {
      setIsSubmittingDecision(false);
      setProcessingStage(null);
    }
  };

  // Filtered scenarios based on category pill
  const filteredScenarios = scenarios.filter(s => {
    if (selectedCategoryPill === 'All') return true;
    const cat = (s.category || '').toLowerCase();
    const pill = (selectedCategoryPill || '').toLowerCase();
    return cat.includes(pill) || pill.includes(cat);
  });

  // Extract a brief 1-2 sentence "Why Does it Matter?" summary from scenario situation
  const extractWhyItMatters = (situation: string): string => {
    if (!situation) return 'This decision affects public service delivery, community rights, and citizen trust.';
    const sentences = situation.split(/[.!?]+/).filter(s => s.trim().length > 15);
    if (sentences.length >= 2) {
      return `${sentences[1].trim()}.`;
    }
    return sentences[0] ? `${sentences[0].trim()}.` : 'This decision balances delivery speed with safeguards.';
  };

  // Extract a 1-2 sentence brief for "What is happening?"
  const extractWhatIsHappening = (situation: string): string => {
    if (!situation) return 'An important administrative proposal is being evaluated in your district.';
    const sentences = situation.split(/[.!?]+/).filter(s => s.trim().length > 15);
    return sentences[0] ? `${sentences[0].trim()}.` : situation.slice(0, 140);
  };

  // =========================================================================
  // VIEW: SIMPLIFIED 5-STEP POLICY EXPERIENCE (READ → THINK → CHOOSE → EXPLAIN → LEARN)
  // =========================================================================
  if (activeSession && currentScenario) {
    const steps: { id: Stage; label: string; num: string }[] = [
      { id: 'understand', label: t('step.1', '1. Understand'), num: '1' },
      { id: 'views', label: t('step.2', '2. Different Views'), num: '2' },
      { id: 'choice', label: t('step.3', '3. Your Choice'), num: '3' },
      { id: 'explain', label: t('step.4', '4. Explain'), num: '4' },
      { id: 'learn', label: t('step.5', '5. Learn'), num: '5' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStage);

    return (
      <div className="w-full bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 font-sans select-none">
        <div className="max-w-[960px] mx-auto space-y-8">
          
          {/* Minimal Top Bar with Exit & 5 Simple Steps */}
          <div className="bg-white rounded-2xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            
            {/* Left: Exit button */}
            <button
              onClick={() => {
                if (confirm('Return to scenarios list? Your current progress will be saved.')) {
                  setActiveSession(null);
                  setCurrentScenario(null);
                  setEvaluationResult(null);
                  try {
                    localStorage.removeItem('neeti_vivaad_last_session');
                    localStorage.removeItem('neeti_vivaad_last_scenario');
                    window.history.replaceState(null, '', window.location.pathname);
                  } catch (_) {}
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-[#F8F7F2] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('vivaad.exit', 'Exit to Scenarios')}</span>
            </button>

            {/* Right: 5 Steps Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {steps.map((step, idx) => {
                const isActive = step.id === currentStage;
                const isPassed = idx < currentStepIndex;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (isPassed || evaluationResult !== null || idx <= currentStepIndex) {
                        setCurrentStage(step.id);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-display font-extrabold uppercase transition-all flex items-center gap-1.5 border border-[#111111] ${
                      isActive
                        ? 'bg-[#14B8A6] text-white shadow-xs'
                        : isPassed
                        ? 'bg-[#FEF3C7] text-[#111111] hover:bg-zinc-100 cursor-pointer'
                        : 'bg-white text-[#9CA3AF] cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* =============================================================== */}
          {/* STEP 1: UNDERSTAND ("What is happening?") */}
          {/* =============================================================== */}
          {currentStage === 'understand' && (
            <div className="bg-white rounded-[28px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-6 sm:p-10 space-y-6">
              
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D9488] block">
                  {t('vivaad.badge', 'NEETI VIVAAD')}
                </span>
                <span className="text-xs font-mono text-[#4B5563] uppercase">
                  {t('vivaad.what_happening', 'What is happening?')}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111] leading-tight">
                {currentScenario.title}
              </h1>

              {/* Simple 1-2 sentence core explanation */}
              <div className="text-base sm:text-lg text-[#111111] leading-relaxed font-normal p-4 bg-[#F8F7F2] rounded-2xl border border-[#111111]/30">
                {extractWhatIsHappening(currentScenario.situation)}
              </div>

              {/* "WHY DOES IT MATTER?" */}
              <div className="space-y-2 p-5 bg-[#FEF3C7] rounded-2xl border-2 border-[#111111] shadow-xs">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('vivaad.why_matter', 'WHY DOES IT MATTER?')}</span>
                </div>
                <p className="text-sm sm:text-base font-display font-bold text-[#111111] leading-relaxed">
                  "{currentScenario.decision_question}"
                </p>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  {extractWhyItMatters(currentScenario.situation)}
                </p>
              </div>

              {/* Progressive Disclosure: [Read more] */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowFullContext(!showFullContext)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  <span>{showFullContext ? t('vivaad.read_less', 'Show less') : t('vivaad.read_more', 'Read more background')}</span>
                  {showFullContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showFullContext && (
                  <div className="p-4 bg-[#F8F7F2] rounded-2xl border border-[#111111]/20 text-xs sm:text-sm text-[#111111] leading-relaxed whitespace-pre-line animate-in fade-in duration-200">
                    {currentScenario.situation}
                  </div>
                )}
              </div>

              {/* Step 1 Footer Action */}
              <div className="pt-4 border-t border-[#111111]/20 flex items-center justify-between gap-4">
                <span className="text-xs font-mono text-[#4B5563]">
                  {t('step.1', '1. Understand')} &bull; Read → Think
                </span>

                <button
                  onClick={() => setCurrentStage('views')}
                  className="px-6 py-2.5 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-2 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>{t('vivaad.continue_views', 'See Different Views')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 2: DIFFERENT VIEWS (Rename Perspectives to Different Views) */}
          {/* =============================================================== */}
          {currentStage === 'views' && (
            <div className="bg-white rounded-[28px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-6 sm:p-10 space-y-6">
              
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D9488] block">
                  {t('vivaad.badge', 'NEETI VIVAAD')} &bull; {t('step.2', '2. Different Views')}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                  {t('vivaad.different_views_title', 'DIFFERENT VIEWS')}
                </h2>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  {t('vivaad.different_views_desc', 'Before making a decision, see what different people think about this situation.')}
                </p>
              </div>

              {/* 3-4 Simple View Cards with Relatable Emojis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentScenario.perspectives.slice(0, 4).map((p) => {
                  const emoji = getRoleEmoji(p.role);
                  const isExpanded = !!expandedViews[p.id];
                  const isDiscussing = activePerspectiveForDialogue?.id === p.id;

                  // Take short 1-2 sentence snippet
                  const shortPosition = p.position.split(/[.!?]+/).slice(0, 2).join('. ') + '.';

                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border-2 border-[#111111] p-5 space-y-3.5 flex flex-col justify-between transition-all ${
                        isDiscussing 
                          ? 'bg-[#FEF3C7] shadow-[3px_3px_0px_#111111]' 
                          : 'bg-[#F8F7F2] hover:bg-white shadow-xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        
                        {/* Header: Emoji + Role */}
                        <div className="flex items-center gap-2.5 pb-2 border-b border-[#111111]/20">
                          <span className="text-2xl" role="img" aria-label={p.role}>
                            {emoji}
                          </span>
                          <div>
                            <h3 className="font-display font-extrabold text-sm text-[#111111]">
                              {p.role}
                            </h3>
                            <span className="text-[11px] font-mono text-[#4B5563]">
                              {p.name}
                            </span>
                          </div>
                        </div>

                        {/* Short initial explanation (2-3 sentences max) */}
                        <p className="text-xs sm:text-sm text-[#111111] leading-relaxed font-sans italic">
                          "{isExpanded ? p.position : shortPosition}"
                        </p>

                        {/* Progressive disclosure: Read more on this view */}
                        {p.position.length > shortPosition.length && (
                          <button
                            onClick={() => setExpandedViews(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                            className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                          >
                            {isExpanded ? t('vivaad.read_less', 'Show less') : t('vivaad.read_more', 'Read more')}
                          </button>
                        )}

                      </div>

                      {/* Ask a question button */}
                      <div className="pt-2 border-t border-[#111111]/20 flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (isDiscussing) {
                              setActivePerspectiveForDialogue(null);
                            } else {
                              setActivePerspectiveForDialogue(p);
                              setDialogueHistory([]);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#111111] bg-white text-[11px] font-bold text-[#111111] hover:bg-zinc-100 cursor-pointer transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-[#0D9488]" />
                          <span>{isDiscussing ? t('vivaad.close_question', 'Close Discussion') : t('vivaad.ask_question', 'Ask a Question')}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Discussion Drawer with a person */}
              {activePerspectiveForDialogue && (
                <div className="bg-[#FEF3C7] rounded-2xl border-2 border-[#111111] p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#111111]/20">
                    <span className="font-display font-extrabold text-xs uppercase text-[#111111] flex items-center gap-2">
                      <span className="text-lg">{getRoleEmoji(activePerspectiveForDialogue.role)}</span>
                      <span>Ask {activePerspectiveForDialogue.role} ({activePerspectiveForDialogue.name})</span>
                    </span>
                    <button
                      onClick={() => setActivePerspectiveForDialogue(null)}
                      className="p-1 rounded-full hover:bg-black/10 text-[#111111] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* History */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                    {dialogueHistory.length === 0 ? (
                      <p className="text-[#4B5563] italic">
                        Type a question below to see how this person responds...
                      </p>
                    ) : (
                      dialogueHistory.map((turn, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                            turn.speaker === 'LEARNER' 
                              ? 'bg-white border-[#111111] ml-4' 
                              : 'bg-[#CCFBF1] border-[#0D9488] mr-4'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase block text-[#4B5563] mb-0.5">
                            {turn.speaker === 'LEARNER' ? 'You' : activePerspectiveForDialogue.role}
                          </span>
                          <p className="text-[#111111]">{turn.message}</p>
                        </div>
                      ))
                    )}
                    {dialogueLoading && (
                      <div className="p-2 bg-white rounded-xl border border-[#111111] text-xs font-mono text-[#0D9488] flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Responding...</span>
                      </div>
                    )}
                  </div>

                  {/* Question Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={learnerQuestion}
                      onChange={(e) => setLearnerQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendDialogueQuestion();
                      }}
                      placeholder={t('vivaad.type_question_placeholder', 'Ask this person a question...')}
                      className="flex-1 bg-white border border-[#111111] rounded-xl px-3.5 py-2 text-xs text-[#111111] focus:outline-none"
                    />
                    <button
                      onClick={handleSendDialogueQuestion}
                      disabled={dialogueLoading || !learnerQuestion.trim()}
                      className="px-4 py-2 rounded-full border border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      {t('vivaad.send', 'Send')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 Footer Navigation */}
              <div className="pt-4 border-t border-[#111111]/20 flex items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentStage('understand')}
                  className="px-4 py-2 rounded-full border border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-[#F8F7F2] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('vivaad.back', 'Back')}</span>
                </button>

                <button
                  onClick={() => setCurrentStage('choice')}
                  className="px-6 py-2.5 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-2 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>{t('vivaad.continue_choice', 'Make Your Choice')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 3: YOUR CHOICE ("WHAT WOULD YOU DO?") */}
          {/* =============================================================== */}
          {currentStage === 'choice' && (
            <div className="bg-white rounded-[28px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-6 sm:p-10 space-y-6">
              
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D9488] block">
                  {t('vivaad.badge', 'NEETI VIVAAD')} &bull; {t('step.3', '3. Your Choice')}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                  {t('vivaad.your_choice_title', 'WHAT WOULD YOU DO?')}
                </h2>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  {t('vivaad.your_choice_desc', 'Choose the option that seems best to you. There is no single correct answer — your reasoning matters.')}
                </p>
              </div>

              {/* Question Banner */}
              <div className="p-4 bg-[#FEF3C7] rounded-2xl border border-[#111111]/30">
                <p className="font-display font-bold text-sm sm:text-base text-[#111111]">
                  "{currentScenario.decision_question}"
                </p>
              </div>

              {/* 3-4 Clean Choice Cards */}
              <div className="grid grid-cols-1 gap-3">
                {currentScenario.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setSelectedOptionId(opt.id);
                        setDecisionError(null);
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border-2 border-[#111111] cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-[#CCFBF1] shadow-[3px_3px_0px_#111111] ring-2 ring-[#0D9488]'
                          : 'bg-[#F8F7F2] hover:bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 border-[#111111] flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#0D9488] text-white' : 'bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="space-y-1">
                        <span className="font-display font-bold text-sm sm:text-base text-[#111111] block">
                          {opt.label}
                        </span>
                        {(opt.summary || opt.description) && (
                          <p className="text-xs text-[#4B5563] leading-relaxed">
                            {opt.summary || opt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 3 Footer Navigation */}
              <div className="pt-4 border-t border-[#111111]/20 flex items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentStage('views')}
                  className="px-4 py-2 rounded-full border border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-[#F8F7F2] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('vivaad.back', 'Back')}</span>
                </button>

                <button
                  onClick={() => {
                    if (!selectedOptionId) {
                      alert('Please pick one of the choices to continue.');
                      return;
                    }
                    setCurrentStage('explain');
                  }}
                  disabled={!selectedOptionId}
                  className="px-6 py-2.5 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-2 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <span>{t('vivaad.continue_explain', 'Explain Your Choice')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 4: EXPLAIN & VOICE INPUT ("WHY DID YOU CHOOSE THIS?") */}
          {/* =============================================================== */}
          {currentStage === 'explain' && (
            <div className="bg-white rounded-[28px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-6 sm:p-10 space-y-6">
              
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D9488] block">
                  {t('vivaad.badge', 'NEETI VIVAAD')} &bull; {t('step.4', '4. Explain')}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                  {t('vivaad.explain_title', 'WHY DID YOU CHOOSE THIS?')}
                </h2>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  {t('vivaad.explain_desc', 'Tell us what made you choose this option. Explain in your own words.')}
                </p>
              </div>

              {/* Chosen Option Review Pill */}
              <div className="p-3.5 bg-[#FEF3C7] rounded-2xl border border-[#111111]/30 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0D9488] shrink-0" />
                <span className="text-xs sm:text-sm font-display font-bold text-[#111111]">
                  {currentScenario.options.find(o => o.id === selectedOptionId)?.label || selectedOptionId}
                </span>
              </div>

              {/* Natural Textarea */}
              <div className="space-y-2">
                <textarea
                  value={reasoningText}
                  onChange={(e) => {
                    setReasoningText(e.target.value);
                    setDecisionError(null);
                  }}
                  rows={5}
                  placeholder={t('vivaad.explain_placeholder', 'Explain in your own words what made you pick this choice...')}
                  className="w-full bg-[#F8F7F2] border-2 border-[#111111] rounded-2xl p-4 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white shadow-xs leading-relaxed"
                />

                {/* Voice Input Microphone Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#111111] text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-white text-[#111111] hover:bg-[#FEF3C7]'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>{t('vivaad.stop_listening', 'Stop Listening')}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-[#0D9488]" />
                        <span>{t('vivaad.speak_btn', 'Speak')}</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] font-mono text-[#4B5563]">
                    {isListening 
                      ? t('vivaad.listening', 'Listening... (Speak now in your language)') 
                      : 'Type or speak naturally in any language'}
                  </span>

                </div>

                {speechError && (
                  <div className="p-2.5 bg-yellow-50 border border-yellow-400 rounded-xl text-xs text-yellow-800 font-mono">
                    {speechError}
                  </div>
                )}

                {/* Real Backend Processing Animation (Zero fake spinners) */}
                {isSubmittingDecision && processingStage && (
                  <div className="p-5 bg-[#F8F7F2] rounded-2xl border-2 border-[#111111] space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#111111]">
                      <span className="uppercase tracking-wider">EVALUATING DECISION &bull; STEP {processingStage.step} OF {processingStage.totalSteps}</span>
                      <span className="text-[#0D9488] font-bold">{processingStage.label}</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className={`flex items-center gap-2 ${processingStage.step >= 1 ? 'text-emerald-700 font-bold' : 'text-zinc-400'}`}>
                        <span>{processingStage.step > 1 ? '✓' : '●'}</span>
                        <span>Scenario and selected decision reviewed</span>
                      </div>
                      <div className={`flex items-center gap-2 ${processingStage.step >= 2 ? 'text-emerald-700 font-bold' : 'text-zinc-400'}`}>
                        <span>{processingStage.step > 2 ? '✓' : (processingStage.step === 2 ? '●' : '○')}</span>
                        <span>Relevant provisions and statutory evidence checked</span>
                      </div>
                      <div className={`flex items-center gap-2 ${processingStage.step >= 3 ? 'text-emerald-700 font-bold' : 'text-zinc-400'}`}>
                        <span>{processingStage.step > 3 ? '✓' : (processingStage.step === 3 ? '●' : '○')}</span>
                        <span>Stakeholder perspectives and ground trade-offs evaluated</span>
                      </div>
                      <div className={`flex items-center gap-2 ${processingStage.step >= 4 ? 'text-emerald-700 font-bold' : 'text-zinc-400'}`}>
                        <span>{processingStage.step === 4 ? '●' : '○'}</span>
                        <span>Preparing 7-part personalized decision feedback</span>
                      </div>
                    </div>
                  </div>
                )}

                {decisionError && (
                  <div className="p-2.5 bg-red-50 border border-red-400 rounded-xl text-xs text-red-600 font-mono font-bold">
                    {decisionError}
                  </div>
                )}
              </div>

              {/* Step 4 Footer Navigation */}
              <div className="pt-4 border-t border-[#111111]/20 flex items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentStage('choice')}
                  className="px-4 py-2 rounded-full border border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-[#F8F7F2] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('vivaad.back', 'Back')}</span>
                </button>

                <button
                  onClick={handleSubmitDecision}
                  disabled={isSubmittingDecision || !reasoningText.trim()}
                  className="px-7 py-3 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-2 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDecision ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{processingStage?.label || t('vivaad.submitting', 'Evaluating Reasoning...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('vivaad.submit_decision', 'Submit Decision')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 5: LEARN (7-PART DECISION FEEDBACK SCHEMA)                 */}
          {/* =============================================================== */}
          {currentStage === 'learn' && evaluationResult && (
            <div className="bg-white rounded-[28px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-6 sm:p-10 space-y-6">
              
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D9488] block">
                  {t('vivaad.badge', 'NEETI VIVAAD')} &bull; {t('step.5', '5. Learn')}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                  DECISION FEEDBACK &bull; HOW YOUR REASONING HELD UP
                </h2>
              </div>

              {/* 1. YOUR DECISION */}
              <div className="p-4 bg-[#FEF3C7] rounded-2xl border-2 border-[#111111] shadow-xs space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] block">
                  YOUR DECISION
                </span>
                <p className="font-display font-extrabold text-base text-[#111111]">
                  {evaluationResult.your_decision || currentScenario.options.find(o => o.id === selectedOptionId)?.label || selectedOptionId}
                </p>
              </div>

              {/* 2. WHY YOUR REASONING WORKS */}
              <div className="p-5 bg-[#F8F7F2] rounded-2xl border-2 border-[#111111] shadow-xs space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#0D9488] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WHY YOUR REASONING WORKS</span>
                </div>
                <p className="text-sm text-[#111111] leading-relaxed font-medium">
                  {evaluationResult.why_your_reasoning_works || evaluationResult.makes_sense_because || 'Your articulated reasoning considers ground realities alongside necessary safeguards.'}
                </p>
              </div>

              {/* 3. WHAT YOU CONSIDERED WELL */}
              <div className="p-5 bg-white rounded-2xl border-2 border-[#111111] shadow-xs space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>WHAT YOU CONSIDERED WELL</span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#111111]">
                  {(evaluationResult.what_you_considered_well || evaluationResult.what_you_did_well || [
                    'Balanced operational velocity against statutory accountability.',
                    'Accounted for frontline delivery feasibility.'
                  ]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. ONE THING TO THINK ABOUT */}
              <div className="p-5 bg-amber-50/70 rounded-2xl border-2 border-amber-800 shadow-xs space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-950 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>ONE THING TO THINK ABOUT</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                  {evaluationResult.one_thing_to_think_about || (evaluationResult.think_about_this_too && evaluationResult.think_about_this_too[0]) || 'How will frontline staff handle unexpected network outages or field operational bottlenecks?'}
                </p>
              </div>

              {/* 5. ANOTHER PERSPECTIVE */}
              <div className="p-5 bg-[#F8F7F2] rounded-2xl border border-[#111111]/30 space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B5563] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#0D9488]" />
                  <span>ANOTHER PERSPECTIVE</span>
                </div>
                <p className="text-xs sm:text-sm text-[#111111] leading-relaxed italic">
                  "{evaluationResult.another_perspective || evaluationResult.another_view || 'Community representatives and frontline staff value direct communication and realistic targets more than statutory circulars alone.'}"
                </p>
              </div>

              {/* 6. WHAT THIS TEACHES YOU */}
              <div className="p-5 bg-teal-50/60 rounded-2xl border-2 border-[#0D9488] shadow-xs space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#0D9488] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>WHAT THIS TEACHES YOU</span>
                </div>
                <p className="text-xs sm:text-sm text-[#111111] leading-relaxed font-medium">
                  {evaluationResult.what_this_teaches_you || 'Sound public governance is shown not by avoiding hard trade-offs, but by making conscious choices, justifying them with verifiable standards, and safeguarding citizen trust.'}
                </p>
              </div>

              {/* 7. NEXT STEP */}
              <div className="p-5 bg-[#0B1F3A] text-white rounded-2xl border-2 border-[#111111] shadow-xs space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#FCD34D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>NEXT STEP</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {evaluationResult.next_step || 'Draft standard operating procedures for this decision with designated field verification responsibilities and a 60-day review milestone.'}
                </p>
              </div>

              {/* Progressive Disclosure: [See detailed feedback] */}
              <div className="pt-2">
                <button
                  onClick={() => setShowDetailedScorecard(!showDetailedScorecard)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  <span>{showDetailedScorecard ? t('vivaad.hide_details', 'Hide Detailed Assessment') : t('vivaad.see_details', 'See Detailed Assessment')}</span>
                  {showDetailedScorecard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDetailedScorecard && (
                  <div className="mt-4 p-5 bg-[#F8F7F2] rounded-2xl border-2 border-[#111111] space-y-4 animate-in fade-in duration-200">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#4B5563] block">
                      Mission Karmayogi Competency Dimensions
                    </span>

                    {evaluationResult.criteria_feedback && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(evaluationResult.criteria_feedback).map(([key, item]) => (
                          <div key={key} className="p-3 bg-white rounded-xl border border-[#111111] space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
                              <span>{item.label || key}</span>
                              <span className="font-mono text-[#0D9488]">{item.score}/100</span>
                            </div>
                            <p className="text-[11px] text-[#4B5563] leading-relaxed">{item.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {evaluationResult.other_perspectives_reaction && (
                      <div className="space-y-2 pt-2 border-t border-[#111111]/20">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#4B5563]">
                          Reactions from Different Community Roles
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {evaluationResult.other_perspectives_reaction.map((react, idx) => (
                            <div key={idx} className="p-2.5 bg-white rounded-xl border border-[#111111] text-xs">
                              <span className="font-bold text-[#0D9488] block text-[10px] uppercase">
                                {react.role} ({react.name})
                              </span>
                              <p className="text-[#111111] italic mt-0.5">"{react.reaction}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 5 Footer Actions */}
              <div className="pt-4 border-t border-[#111111]/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStage('views')}
                    className="px-4 py-2 rounded-full border border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-[#F8F7F2] transition-colors cursor-pointer"
                  >
                    {t('vivaad.continue_views', 'Review Different Views')}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentStage('choice');
                      setEvaluationResult(null);
                    }}
                    className="px-4 py-2 rounded-full border border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-[#F8F7F2] transition-colors cursor-pointer"
                  >
                    {t('vivaad.try_again', 'Try This Scenario Again')}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setActiveSession(null);
                    setCurrentScenario(null);
                  }}
                  className="px-6 py-2.5 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-2 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>{t('vivaad.try_another', 'Try Another Scenario')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN NEETI VIVAAD ARENA WORKSPACE (CATALOG & PROMPT AREA)
  // =========================================================================
  return (
    <div className="w-full bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 font-sans select-none">
      <div className="max-w-[1080px] mx-auto space-y-10">
        
        {/* ================================================================= */}
        {/* TOP HEADER (MATCHING SCREENSHOT) */}
        {/* ================================================================= */}
        <div className="space-y-4 text-center">
          {/* Centered Pill Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#111111] bg-white shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                {t('vivaad.badge', 'NEETI VIVAAD')}
              </span>
            </div>
          </div>

          {/* Headline in Serif font */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#111111] tracking-tight leading-tight">
            {t('vivaad.hero_title', 'Practice real policy decisions.')}
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-[#4B5563] max-w-xl mx-auto leading-relaxed">
            {t('vivaad.hero_sub', 'Explore a policy situation, consider different perspectives, and make your own decision.')}
          </p>
        </div>

        {/* ================================================================= */}
        {/* MAIN ARENA-STYLE INPUT AREA (MATCHING SCREENSHOT) */}
        {/* ================================================================= */}
        <div className="bg-white rounded-[28px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-5 sm:p-7 space-y-4 relative">
          
          {/* Main Textarea */}
          <div className="space-y-2">
            <textarea
              ref={promptInputRef}
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={t('vivaad.prompt_placeholder', 'Describe a policy issue or scenario you want to explore...')}
              className="w-full bg-transparent text-sm sm:text-base text-[#111111] placeholder:text-[#9CA3AF] border-none focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Uploaded File Chip if attached */}
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 px-3 bg-[#CCFBF1] rounded-xl border border-[#0D9488] text-xs font-mono text-[#0D9488] w-fit">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-bold">{attachedFile.name}</span>
              <span className="text-[#4B5563]">({Math.round(attachedFile.size / 1024)} KB)</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="hover:text-red-600 ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {uploadError && (
            <div className="p-2.5 bg-red-50 border border-red-400 rounded-xl text-xs text-red-600 font-mono font-bold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Bottom Bar: Pill Controls & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            
            {/* Left side pill buttons */}
            <div className="flex flex-wrap items-center gap-2 relative">
              
              {/* Domain Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'domain' ? null : 'domain');
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-[#111111] bg-white text-xs font-medium text-[#111111] flex items-center gap-2 hover:bg-[#F8F7F2] transition-colors cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#111111]" />
                  <span>{t('vivaad.domain', 'Domain')}</span>
                  <ChevronDown className="w-3 h-3 text-[#111111]" />
                </button>

                {openDropdown === 'domain' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] z-30 p-1 space-y-0.5">
                    {DOMAIN_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSelectedDomain(d);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between ${
                          selectedDomain === d ? 'bg-[#FEF3C7] text-[#111111]' : 'hover:bg-[#F8F7F2]'
                        }`}
                      >
                        <span>{d}</span>
                        {selectedDomain === d && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Difficulty Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'difficulty' ? null : 'difficulty');
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-[#111111] bg-white text-xs font-medium text-[#111111] flex items-center gap-2 hover:bg-[#F8F7F2] transition-colors cursor-pointer"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-[#111111]" />
                  <span>{t('vivaad.difficulty', 'Difficulty')}</span>
                  <ChevronDown className="w-3 h-3 text-[#111111]" />
                </button>

                {openDropdown === 'difficulty' && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] z-30 p-1 space-y-0.5">
                    {DIFFICULTY_OPTIONS.map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          setSelectedDifficulty(diff);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between ${
                          selectedDifficulty === diff ? 'bg-[#FEF3C7] text-[#111111]' : 'hover:bg-[#F8F7F2]'
                        }`}
                      >
                        <span>{diff}</span>
                        {selectedDifficulty === diff && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scenario Type Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'type' ? null : 'type');
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-[#111111] bg-white text-xs font-medium text-[#111111] flex items-center gap-2 hover:bg-[#F8F7F2] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#111111]" />
                  <span>{t('vivaad.scenario_type', 'Scenario Type')}</span>
                  <ChevronDown className="w-3 h-3 text-[#111111]" />
                </button>

                {openDropdown === 'type' && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] z-30 p-1 space-y-0.5">
                    {SCENARIO_TYPES.map((tItem) => (
                      <button
                        key={tItem}
                        type="button"
                        onClick={() => {
                          setSelectedType(tItem);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between ${
                          selectedType === tItem ? 'bg-[#FEF3C7] text-[#111111]' : 'hover:bg-[#F8F7F2]'
                        }`}
                      >
                        <span>{tItem}</span>
                        {selectedType === tItem && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right side controls: Upload Document + START VIVAAD */}
            <div className="flex items-center gap-3">
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-full border border-[#111111] bg-white text-xs font-medium text-[#111111] flex items-center gap-2 hover:bg-[#F8F7F2] transition-colors cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#111111]" />
                <span className="text-left leading-tight">
                  <span className="font-semibold">{t('vivaad.upload_doc', 'Upload Document')}</span>{' '}
                  <span className="text-[10px] text-[#4B5563] font-normal block sm:inline">(PDF, DOCX)</span>
                </span>
              </button>

              <button
                onClick={handleMainPromptSubmit}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-2 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('vivaad.generating', 'Generating...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('vivaad.start_btn', 'START VIVAAD')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

        {/* ================================================================= */}
        {/* THREE ACTION CARDS (EXACT MATCH TO SCREENSHOT) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Upload a Document */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white rounded-[24px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] p-6 sm:p-7 space-y-4 flex flex-col justify-between hover:translate-y-[-2px] transition-transform cursor-pointer"
          >
            <div className="space-y-2.5">
              <FileText className="w-7 h-7 text-[#0284C7]" />
              <h3 className="font-display font-bold text-base sm:text-lg text-[#111111]">
                {t('vivaad.card1_title', 'Upload a Document')}
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {t('vivaad.card1_desc', 'Use a policy report, guideline or article to create a scenario.')}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline">
              <span>{t('vivaad.card1_btn', 'Upload File')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Write a Scenario */}
          <div 
            onClick={() => {
              promptInputRef.current?.focus();
              setPromptText('Should a district introduce AI-based attendance for teachers and students in remote rural schools?');
            }}
            className="bg-white rounded-[24px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] p-6 sm:p-7 space-y-4 flex flex-col justify-between hover:translate-y-[-2px] transition-transform cursor-pointer"
          >
            <div className="space-y-2.5">
              <Edit3 className="w-7 h-7 text-[#111111]" />
              <h3 className="font-display font-bold text-base sm:text-lg text-[#111111]">
                {t('vivaad.card2_title', 'Write a Scenario')}
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {t('vivaad.card2_desc', 'Enter a custom issue or question to debate.')}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline">
              <span>{t('vivaad.card2_btn', 'Get Started')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Explore Examples */}
          <div 
            onClick={() => {
              const el = document.getElementById('sample-scenarios-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white rounded-[24px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] p-6 sm:p-7 space-y-4 flex flex-col justify-between hover:translate-y-[-2px] transition-transform cursor-pointer"
          >
            <div className="space-y-2.5">
              <BookOpen className="w-7 h-7 text-[#111111]" />
              <h3 className="font-display font-bold text-base sm:text-lg text-[#111111]">
                {t('vivaad.card3_title', 'Explore Examples')}
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {t('vivaad.card3_desc', 'Try ready-made scenarios across key domains.')}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline">
              <span>{t('vivaad.card3_btn', 'Browse Examples')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>

        {/* ================================================================= */}
        {/* TRY A SCENARIO SECTION (MATCHING SCREENSHOT) */}
        {/* ================================================================= */}
        <div id="sample-scenarios-section" className="space-y-6 pt-2">
          
          {/* Centered Hairline Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#111111]/20"></div>
            </div>
            <div className="relative bg-[#F8F7F2] px-4 text-[11px] font-mono font-bold uppercase tracking-widest text-[#4B5563]">
              {t('vivaad.try_section', 'TRY A SCENARIO')}
            </div>
          </div>

          {/* Horizontal Pills Row */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {SAMPLE_CATEGORY_PILLS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryPill(cat === selectedCategoryPill ? 'All' : cat)}
                className={`px-5 py-2 rounded-full border border-[#111111] text-xs font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                  selectedCategoryPill === cat
                    ? 'bg-[#14B8A6] text-white border-[#111111]'
                    : 'bg-white text-[#111111] hover:bg-[#FEF3C7]'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => {
                const nextIdx = (SAMPLE_CATEGORY_PILLS.indexOf(selectedCategoryPill) + 1) % SAMPLE_CATEGORY_PILLS.length;
                setSelectedCategoryPill(SAMPLE_CATEGORY_PILLS[nextIdx]);
              }}
              title="Next category"
              className="w-8 h-8 rounded-full border border-[#111111] bg-white flex items-center justify-center shrink-0 hover:bg-[#F8F7F2] shadow-xs cursor-pointer ml-1"
            >
              <ChevronRight className="w-4 h-4 text-[#111111]" />
            </button>
          </div>

          {/* Real Scenario Cards Grid */}
          {catalogLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
              <span className="font-mono text-xs text-[#4B5563]">Loading scenarios...</span>
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-[#111111] p-8 text-center space-y-2">
              <p className="text-sm font-display font-bold uppercase text-[#111111]">No scenarios found in this category.</p>
              <p className="text-xs text-[#4B5563]">Type an issue in the box above or upload a document to practice.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="bg-white rounded-[24px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] p-6 sm:p-7 space-y-4 flex flex-col justify-between hover:translate-y-[-2px] transition-transform"
                >
                  <div className="space-y-3">
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#111111] bg-[#CCFBF1] text-[#0D9488]">
                          {scenario.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#111111] bg-white">
                          {scenario.difficulty}
                        </span>
                      </div>
                      
                      <span className="text-[10px] font-mono text-[#4B5563]">
                        {scenario.perspective_count} Different Views
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-display font-extrabold text-[#111111] leading-tight">
                      {scenario.title}
                    </h3>

                    <div className="p-3 bg-[#FEF3C7] rounded-xl border border-[#111111] text-xs font-display font-bold text-[#111111]">
                      "{scenario.decision_question}"
                    </div>

                    <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2">
                      {extractWhatIsHappening(scenario.situation_summary)}
                    </p>

                  </div>

                  <div className="pt-4 border-t border-[#111111]/20 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#4B5563]">
                      {scenario.source_type === 'DOCUMENT' ? 'Document-Backed' : 'Case Situation'}
                    </span>

                    <button
                      onClick={() => handleStartSimulation(scenario.id)}
                      disabled={loadingScenario}
                      className="px-5 py-2 rounded-full border-2 border-[#111111] bg-[#14B8A6] text-[#111111] text-xs font-display font-extrabold uppercase tracking-wide flex items-center gap-1.5 hover:bg-[#0D9488] hover:text-white transition-all shadow-xs cursor-pointer"
                    >
                      <span>{t('vivaad.start_btn', 'START VIVAAD')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to Neeti Vivaad"
        message={authModalMessage}
        returnUrl="/debate"
      />

    </div>
  );
}

export default function NeetiVivaadPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[60vh] bg-[#F8F7F2] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 font-mono text-sm text-[#0D9488]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Neeti Vivaad...</span>
        </div>
      </div>
    }>
      <NeetiVivaadContent />
    </Suspense>
  );
}
