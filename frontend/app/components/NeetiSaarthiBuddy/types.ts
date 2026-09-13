export interface BuddyMessage {
  id: string;
  sender: 'buddy' | 'user';
  text: string;
  timestamp: Date;
  shouldSpeak?: boolean;
  actions?: string[];
  action_button?: { label: string; route: string };
}

export type MascotState = 'idle' | 'greeting' | 'thinking' | 'listening' | 'speaking' | 'success' | 'error';

export interface TourStep {
  step: number;
  title: string;
  targetId?: string;
  route: string;
  message: string;
  highlightText: string;
  actionText: string;
}

export interface BuddyContextResponse {
  context: {
    user: {
      username: string;
      full_name: string;
      designation: string;
      department: string;
      organisation: string;
      profile_complete: boolean;
      baseline_completed: boolean;
      ctq_score: number;
      onboarding_tour_completed: boolean;
      buddy_voice_enabled: boolean;
      buddy_language: string;
    };
    confirmed_skills: string[];
    top_gaps: Array<{
      subskill_name: string;
      current_score: number;
      target_score: number;
      gap: number;
    }>;
    recommended_courses: Array<{
      id: number;
      title: string;
      provider: string;
      duration_hours: number;
      difficulty: string;
    }>;
    page_intent: string;
    current_route: string;
  };
  greeting: string;
  suggestions: string[];
  onboarding_tour_completed: boolean;
  buddy_voice_enabled: boolean;
  buddy_language: string;
}
