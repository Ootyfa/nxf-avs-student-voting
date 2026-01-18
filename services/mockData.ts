
import { Film, FilmStatus, Festival, FestivalSection, User, UserRole, AchievementTitle, Review, University } from '../types';

// Mock Films updated to match Supabase schema with reliable image placeholders
export const MOCK_FILMS: Film[] = [
  {
    id: 'f1',
    title: 'The Silent Glaciers',
    director: 'Elena Rossi',
    duration: '84 min',
    genre: 'Environment',
    category: 'Environment',
    synopsis: 'A breathtaking journey through the melting ice caps of Greenland.',
    image_url: 'https://images.unsplash.com/photo-1518182170546-07fa6eb3eb3d?w=500&q=80',
    poster_url: 'https://images.unsplash.com/photo-1518182170546-07fa6eb3eb3d?w=500&q=80',
    status: 'Active',
    votes_count: 120,
    rating: 4.8
  },
  {
    id: 'f2',
    title: 'Urban Rhythm',
    director: 'Marcus Chen',
    duration: '45 min',
    genre: 'Short Doc',
    category: 'Short Doc',
    synopsis: 'The hidden sounds of New York City subways creating a symphony.',
    image_url: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=500&q=80',
    poster_url: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=500&q=80',
    status: 'Active',
    votes_count: 85,
    rating: 4.5
  },
  {
    id: 'f3',
    title: 'Echoes of Tradition',
    director: 'Sarah Al-Fayed',
    duration: '102 min',
    genre: 'Culture',
    category: 'Culture',
    synopsis: 'Preserving ancient weaving techniques in a modernizing world.',
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&q=80',
    poster_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&q=80',
    status: 'Active',
    votes_count: 200,
    rating: 4.9
  },
  {
    id: 'f4',
    title: 'Midnight Odyssey',
    director: 'Aris Thorne',
    genre: 'Sci-Fi',
    category: 'Sci-Fi',
    duration: '110 min',
    synopsis: 'A journey through the unknown.',
    image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80',
    status: 'Active',
    votes_count: 5,
    rating: 4.5
  }
];

export const MOCK_FESTIVALS: Festival[] = [
  {
    id: 'fest1',
    name: 'ATOM Festival',
    location: 'Online',
    start_date: '2024-10-15',
    end_date: '2024-10-25',
    status: 'Live',
    is_active: true
  }
];

export const MOCK_SECTIONS: FestivalSection[] = [
  { id: 's1', festivalId: 'fest1', name: 'Competition', description: 'Main event', icon: 'film' },
  { id: 's2', festivalId: 'fest1', name: 'Student', description: 'Student films', icon: 'graduation-cap' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Priya Patel',
    email: 'priya@nyu.edu',
    role: UserRole.Reviewer,
    points: 450,
    title: AchievementTitle.FestivalCritic,
    avatarUrl: 'https://i.pravatar.cc/150?u=u1'
  }
];

// Restored Indian Institutes for robust onboarding
export const MOCK_UNIVERSITIES: University[] = [
  {
    id: 'u1',
    name: 'Film and Television Institute of India (FTII)',
    logo: '🎥',
    location: 'Pune',
    active_students: 142,
    points: 12500
  },
  {
    id: 'u2',
    name: 'Satyajit Ray Film & TV Institute (SRFTI)',
    logo: '🎬',
    location: 'Kolkata',
    active_students: 98,
    points: 9800
  },
  {
    id: 'u3',
    name: 'National Institute of Design (NID)',
    logo: '🎨',
    location: 'Ahmedabad',
    active_students: 215,
    points: 15400
  },
  {
    id: 'u4',
    name: 'Whistling Woods International',
    logo: '🎭',
    location: 'Mumbai',
    active_students: 180,
    points: 11200
  },
  {
    id: 'u5',
    name: 'A.J.K. Mass Communication Research Centre',
    logo: '📡',
    location: 'New Delhi',
    active_students: 85,
    points: 7600
  },
  {
    id: 'u6',
    name: 'Srishti Manipal Institute of Art, Design',
    logo: '🖌️',
    location: 'Bengaluru',
    active_students: 110,
    points: 8900
  }
];

export const MOCK_REVIEWS: Review[] = [];
