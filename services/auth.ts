
import { supabase } from './supabase';
import { University } from '../types';

// Helper: Title Case
const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Fetch list for Onboarding Dropdown
// CHANGED: Removed Mock Data fallback to prevent UUID mismatch errors.
// Now strictly fetches from Supabase.
export const getUniversities = async (): Promise<University[]> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }
    
    return (data as University[]) || [];
  } catch (err) {
    console.error("Unexpected error fetching universities:", err);
    return [];
  }
};

// NEW: Allow user to add a new university if theirs is missing
export const addNewUniversity = async (name: string, location: string): Promise<University | null> => {
  try {
    const formattedName = toTitleCase(name.trim());
    const formattedLocation = toTitleCase(location.trim());

    const { data, error } = await supabase
      .from('universities')
      .insert({ 
        name: formattedName, 
        location: formattedLocation, 
        logo: '🎓', // Default emoji logo
        active_students: 1, // Start with 1 (the creator)
        points: 0 
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating university:", error.message);
      return null;
    }
    return data as University;
  } catch (e) {
    console.error("Exception creating university:", e);
    return null;
  }
};

// --- CRITICAL FIX: Recalculate University Stats from Source of Truth ---
export const recalculateUniversityStats = async (universityId: string) => {
    if (!universityId) return;
    
    try {
        // 1. Get Exact Student Count (Count rows in user_profiles)
        const { count: studentCount, error: countError } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('university_id', universityId);

        if (countError) throw countError;

        // 2. Get Exact Total Points (Sum points in user_profiles)
        const { data: profiles, error: pointsError } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('university_id', universityId);

        if (pointsError) throw pointsError;

        const totalPoints = profiles?.reduce((acc, curr) => acc + (curr.points || 0), 0) || 0;

        // 3. Update the University Master Record
        await supabase
            .from('universities')
            .update({ 
                active_students: studentCount || 0,
                points: totalPoints 
            })
            .eq('id', universityId);
            
    } catch (e) {
        console.error("Error recalculating university stats:", e);
    }
};

// Save User Profile immediately during Onboarding
export const registerNewUser = async (email: string, name: string, universityId?: string) => {
  try {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('university_id')
        .eq('email', email)
        .single();

    // 2. Upsert the user
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        email: email,
        name: name,
        university_id: universityId || null,
        is_student: !!universityId
      }, { onConflict: 'email' });

    if (error) {
      console.error("Error saving profile:", error.message);
      return false;
    }

    // 3. Trigger Recalculation if University Changed/Added
    if (universityId) {
        // If it's a new user OR they changed universities, recalculate
        if (!existingUser || existingUser.university_id !== universityId) {
            await recalculateUniversityStats(universityId);
            
            // If they moved FROM another uni, recalculate that one too to decrease count
            if (existingUser?.university_id && existingUser.university_id !== universityId) {
                await recalculateUniversityStats(existingUser.university_id);
            }
        }
    }

    return true;
  } catch (e) {
    console.error("Register user exception:", e);
    return false; 
  }
};

// NEW: Fetch all film IDs a user has voted for to restore session
export const fetchUserVoteHistory = async (email: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('film_votes')
      .select('film_id')
      .eq('user_email', email);

    if (error) {
      return [];
    }
    
    const ids = data.map((v: any) => v.film_id);
    return ids;
  } catch (e) {
    return [];
  }
};

// Retrieve user data from DB and update local storage (Source of Truth)
export const syncUserProfile = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (data && !error) {
      localStorage.setItem('userPoints', (data.points || 0).toString());
      if (data.name) localStorage.setItem('userName', data.name);
      
      if (data.university_id) {
        localStorage.setItem('userUniversityId', data.university_id);
        localStorage.setItem('isStudent', 'true');
        
        const { data: uni } = await supabase
            .from('universities')
            .select('name')
            .eq('id', data.university_id)
            .single();
        if (uni) localStorage.setItem('userUniversityName', uni.name);
      }
      return true;
    }
  } catch (e) {
    console.log("Sync profile failed:", e);
  }
  return false;
};

// CRITICAL: Recalculate Master Film Stats (Rating & Count) based on Votes table
export const recalculateFilmStats = async (filmId: string) => {
    if (!filmId) return;

    try {
        const { data: votes, error } = await supabase
            .from('film_votes')
            .select('rating')
            .eq('film_id', filmId);

        if (error || !votes) return;

        const totalVotes = votes.length;
        if (totalVotes === 0) return;

        const sum = votes.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        const average = sum / totalVotes;

        // Update Master Table
        await supabase
            .from('master_films')
            .update({ 
                rating: average,
                votes_count: totalVotes
            })
            .eq('id', filmId);
            
    } catch (e) {
        console.error("Error recalculating stats:", e);
    }
};

// Handle Vote + University Point Attribution
export const registerUserVote = async (email: string, name: string, pointsToAdd: number) => {
  try {
    // 1. Fetch existing profile points
    const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('points, university_id')
        .eq('email', email)
        .single();

    const currentDbPoints = existingUser ? (existingUser.points || 0) : 0;
    const newTotalPoints = currentDbPoints + pointsToAdd;
    
    let uniId = localStorage.getItem('userUniversityId');
    if (!uniId && existingUser?.university_id) {
        uniId = existingUser.university_id;
    }

    // 2. Upsert User Profile
    await supabase
      .from('user_profiles')
      .upsert({
        email: email,
        name: name,
        points: newTotalPoints, 
        university_id: uniId || null
      }, { onConflict: 'email' });

    localStorage.setItem('userPoints', newTotalPoints.toString());

    // 3. Update University Points via Recalculation
    if (uniId) {
       await recalculateUniversityStats(uniId);
    }
    
    return !!uniId;
  } catch (error) {
    console.error("Error in registerUserVote:", error);
    return false;
  }
};

// NEW: Award Points for Trivia
export const awardBonusPoints = async (points: number) => {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName') || 'Anonymous';
    if (!email) return false;
    return await registerUserVote(email, name, points);
};
