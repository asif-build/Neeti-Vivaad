// VoiceService.ts — Provider-independent speech synthesis (TTS) & speech recognition (STT)

export class VoiceService {
  private static instance: VoiceService;
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speakingState: boolean = false;
  private listeningState: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private loadVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prioritize natural Indian English, then Hindi, then natural English voices
    const indianVoice = voices.find(v => 
      v.lang === 'en-IN' || 
      v.name.toLowerCase().includes('india') || 
      v.name.toLowerCase().includes('hindi')
    );

    const naturalEnVoice = voices.find(v => 
      v.lang.startsWith('en') && (
        v.name.toLowerCase().includes('natural') || 
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('aria')
      )
    );

    const fallbackEn = voices.find(v => v.lang.startsWith('en'));
    this.preferredVoice = indianVoice || naturalEnVoice || fallbackEn || voices[0];
  }

  public getVoiceForLanguage(langCode?: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return this.preferredVoice;

    if (!langCode) return this.preferredVoice || voices[0];

    const target = langCode.toLowerCase();
    const baseLang = target.split('-')[0];

    // 1. Exact match (e.g. 'hi-IN', 'ta-IN', 'bn-IN')
    const exactMatch = voices.find(v => v.lang.toLowerCase() === target);
    if (exactMatch) return exactMatch;

    // 2. Base match (e.g. starts with 'hi', 'ta', 'bn')
    const baseMatch = voices.find(v => v.lang.toLowerCase().startsWith(baseLang));
    if (baseMatch) return baseMatch;

    // 3. Fall back to preferred default
    return this.preferredVoice || voices[0];
  }

  public hasSpeechSynthesis(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public hasSpeechRecognition(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public isSpeaking(): boolean {
    return this.speakingState;
  }

  public isListening(): boolean {
    return this.listeningState;
  }

  /**
   * Speaks the provided text using client-side synthesis.
   * Immediately halts any previous utterance to avoid overlap.
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void,
    langCode?: string
  ): void {
    if (!this.synth || !this.hasSpeechSynthesis()) {
      if (onError) onError(new Error("Speech synthesis not supported in this browser."));
      return;
    }

    // Stop any ongoing speech first
    this.stop();

    // Sanitize text for speech (strip markdown asterisks, URLs, brackets)
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\[\]\(\)]/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = this.getVoiceForLanguage(langCode);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    if (langCode) {
      utterance.lang = langCode;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Warm and approachable tone

    utterance.onstart = () => {
      this.speakingState = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.speakingState = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.speakingState = false;
      this.currentUtterance = null;
      // Speech cancellation errors are expected when user stops
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('[VoiceService TTS Error]:', e);
        if (onError) onError(e);
      } else {
        if (onEnd) onEnd();
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Immediately halts any active speech output.
   */
  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.speakingState = false;
    this.currentUtterance = null;
  }

  public pause(): void {
    if (this.synth && this.speakingState) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Starts listening to microphone input via Web Speech Recognition.
   * Only called on explicit user click.
   */
  public startListening(
    onResult: (transcript: string) => void,
    onError: (err: string) => void,
    onEnd?: () => void,
    langCode?: string
  ): void {
    if (!this.hasSpeechRecognition()) {
      onError("Voice isn't available right now. You can type your question instead.");
      return;
    }

    // Stop speaking while user wants to speak
    this.stop();

    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = langCode || 'en-IN'; // Indian English default or user selected

      this.recognition.onstart = () => {
        this.listeningState = true;
      };

      this.recognition.onresult = (event: any) => {
        this.listeningState = false;
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          onResult(transcript.trim());
        } else {
          onError("I couldn't hear that. Please try again.");
        }
      };

      this.recognition.onerror = (event: any) => {
        this.listeningState = false;
        if (event.error === 'not-allowed') {
          onError("Microphone access is needed for voice. You can type your question instead.");
        } else if (event.error === 'no-speech') {
          onError("I couldn't hear that. Please tap again to retry.");
        } else {
          onError("I couldn't catch that. Please try again or type your question.");
        }
      };

      this.recognition.onend = () => {
        this.listeningState = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err: any) {
      this.listeningState = false;
      onError("Voice isn't available right now. You can type your question instead.");
    }
  }

  /**
   * Stops listening to the microphone.
   */
  public stopListening(): void {
    if (this.recognition && this.listeningState) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.listeningState = false;
  }
}

export const voiceService = VoiceService.getInstance();
