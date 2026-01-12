
// 2.1.1 Users Table / Profile
export interface UserProfile {
  id: string;
  email: string;
  name: string; 
  surname: string; // Added surname
  
  // Biometrics
  dob: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  height: number; // stored in cm usually, or depends on preferences
  weight: number; // stored in kg usually
  
  // Preferences
  units: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'ft_in';
  };
  
  // Fitness Profile
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  goals: string[]; // multi-select IDs
  tracking_mode: 'simple' | 'advanced';
  
  avatar_url?: string;
  created_at: number;
  updated_at: number;
}

// Deprecated legacy User interface (alias to keep existing code working temporarily if needed, 
// but we will migrate App to use UserProfile)
export type User = UserProfile;

// 2.1.2 Exercise Library
export interface Exercise {
  id: string;
  name: string;
  target_muscle_group: string;
  equipment_type: string;
  category: 'Strength' | 'Cardio' | 'Flexibility' | 'Plyometrics';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  mets_code?: number;
  video_url?: string;
  description?: string;
  tips?: string;
  image_url?: string;
}

// 2.1.4 Workout Logs
export interface WorkoutLog {
  id: string;
  user_id: string;
  name?: string;
  start_time: string;
  end_time?: string;
  duration_sec: number;
  body_weight_snapshot?: number;
  feeling_rpe?: number;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  status: 'active' | 'finished';
}

// 2.1.5 Workout Sets
export interface WorkoutSet {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  set_order: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
  type: 'warmup' | 'normal' | 'failure' | 'drop';
  rest_time_ms?: number;
  estimated_1rm?: number;
  completed?: boolean;
}

// User Posts
export interface UserPost {
  id: string;
  user_id: string;
  content: string;
  media: { type: 'image' | 'video', url: string }[];
  created_at: number;
  updated_at: number;
}

// Plan Item Structure
export interface WorkoutPlanItem {
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  target_weight: number;
  target_rest_sec: number;
}

// App View State
export type AppView = 'login' | 'onboarding' | 'dashboard' | 'workout_logger' | 'exercise_library' | 'workout_details' | 'day_plan' | 'legal_tos' | 'legal_privacy' | 'workout_summary' | 'profile';

// Session Types
export interface ExerciseSessionData {
  def: Exercise;
  sets: WorkoutSet[];
  expanded: boolean;
}

export interface SavedSessionState {
  elapsedTime: number;
  sessionExercises: ExerciseSessionData[];
  plan?: WorkoutPlanItem[];
  timestamp: number;
}