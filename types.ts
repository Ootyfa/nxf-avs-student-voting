
// Enum Definitions
export enum FilmStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Archived = 'Archived'
}

export enum UserRole {
  Admin = 'Admin',
  Jury = 'Jury',
  Reviewer = 'Reviewer',
  Viewer = 'Viewer'
}

export enum AchievementTitle {
  Participant = 'Participant',       // 0-50
  ActiveVoter = 'Active Voter',      // 51-150
  FilmReviewer = 'Film Reviewer',    // 151-300
  FestivalCritic = 'Festival Critic', // 301+
  JuryNominee = 'Jury Nominee'       // Top Earner
}

// Updated Film interface to match Supabase "master_films" table
export interface Film {
  id: string;
  title: string;
  director: string;
  
  // Existing fields
  genre: string; 
  duration: string; 
  image_url: string; 
  
  // New CSV Import fields
  category?: string;       // Maps to CSV 'category'
  duration_minutes?: number; // Maps to CSV 'duration_minutes'
  poster_url?: string;     // Maps to CSV 'poster_url'
  trailer_url?: string;    // Maps to CSV 'trailer_url'

  synopsis: string;
  status: string;
  votes_count: number;
  rating: number;
}

// Updated University Interface matching SQL
export interface University {
  id: string;
  name: string;
  logo: string;
  location?: string;
  domain?: string; // Added to match SQL
  active_students: number;
  points: number;
}

// Updated Festival Interface matching SQL "festivals" table
export interface Festival {
  id: string;
  name: string;
  location?: string;
  start_date: string; // ISO string
  end_date: string;   // ISO string
  status: 'Live' | 'Upcoming' | 'Ended' | 'Off';
  is_active: boolean;
}

export interface FestivalSection {
  id: string;
  festivalId: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  points: number;
  title: AchievementTitle;
}

export interface Review {
  id: string;
  filmId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  likes: number;
}
