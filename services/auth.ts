
import { supabase } from './supabase';
import { University } from '../types';
import { MOCK_UNIVERSITIES } from './mockData';

// Fetch list for Onboarding Dropdown with Fallback
export const getUniversities = async (): Promise<University[]> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true });
    
    if (error || !data || data.length === 0) {
      console.warn("Supabase fetch failed or empty, using mock data.", error?.message);
      return MOCK_UNIVERSITIES;
    }
    
    return (data as University[]);
  } catch (err) {
    console.error("Unexpected error fetching universities, using fallback:", err);
    return MOCK_UNIVERSITIES;
  }
};

// NEW: Allow user to add a new university if theirs is missing
export const addNewUniversity = async (name: string, location: string): Promise<University | null> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .insert({ 
        name: name.trim(), 
        location: location.trim(), 
        logo: '🎓', // Default emoji logo
        active_students: 0,
        points: 0 
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating university:", error.message, error.details);
      return null;
    }
    return data as University;
  } catch (e) {
    console.error("Exception creating university:", e);
    return null;
  }
};

// Save User Profile immediately during Onboarding
export const registerNewUser = async (email: string, name: string, universityId?: string) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        email: email,
        name: name,
        university_id: universityId || null,
        // We don't overwrite points if they exist, but if new, default to 0
      }, { onConflict: 'email' });

    if (error) {
      console.error("Error saving profile to Supabase:", error.message);
      // We return true anyway to let the UI proceed in offline/demo mode
      return true;
    }
    return true;
  } catch (e) {
    console.error("Register user exception:", e);
    return true; // Fail open for demo
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
      console.log("Existing user found, syncing...", data);
      
      // Restore Points
      localStorage.setItem('userPoints', (data.points || 0).toString());
      
      // Restore Name if valid
      if (data.name) {
          localStorage.setItem('userName', data.name);
      }
      
      // Restore University
      if (data.university_id) {
        localStorage.setItem('userUniversityId', data.university_id);
        localStorage.setItem('isStudent', 'true');
        
        // Fetch uni name for UI consistency
        const { data: uni } = await supabase
            .from('universities')
            .select('name')
            .eq('id', data.university_id)
            .single();
            
        if (uni) {
            localStorage.setItem('userUniversityName', uni.name);
        } else {
             // Fallback lookup in mock data
             const mockUni = MOCK_UNIVERSITIES.find(u => u.id === data.university_id);
             if (mockUni) localStorage.setItem('userUniversityName', mockUni.name);
        }
      }
      return true;
    }
  } catch (e) {
    console.log("Sync profile failed or user new:", e);
  }
  return false;
};

// Handle Vote + University Point Attribution
export const registerUserVote = async (email: string, name: string, pointsToAdd: number) => {
  try {
    console.log(`Registering vote for ${email}: +${pointsToAdd} points`);
    
    // 1. Fetch existing profile first to get CURRENT points
    const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('points, university_id')
        .eq('email', email)
        .single();

    if (fetchError) {
        console.warn("Could not fetch user profile, creating new entry fallback.");
    }

    const currentDbPoints = existingUser ? (existingUser.points || 0) : 0;
    const newTotalPoints = currentDbPoints + pointsToAdd;
    
    // Determine University ID: Prefer Local Storage (recent choice), fallback to DB
    let uniId = localStorage.getItem('userUniversityId');
    if (!uniId && existingUser?.university_id) {
        uniId = existingUser.university_id;
        localStorage.setItem('userUniversityId', uniId); // Sync back to local
    }

    // 2. Upsert User Profile with new total
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        email: email,
        name: name,
        points: newTotalPoints, 
        university_id: uniId || null
      }, { onConflict: 'email' });

    if (upsertError) {
        console.error("Profile stats update failed:", upsertError.message);
    } else {
        // Update local storage to match DB
        localStorage.setItem('userPoints', newTotalPoints.toString());
    }

    // 3. If user belongs to a university, increment university stats
    if (uniId) {
       // Try RPC first (Atomic update)
       const { error: rpcError } = await supabase.rpc('increment_university_points', { 
         uni_id: uniId, 
         points_to_add: pointsToAdd 
       });
       
       if (rpcError) {
           console.warn("RPC failed, attempting manual fallback update:", rpcError.message);
           
           // Fallback: Fetch -> Calculate -> Update
           const { data: uni, error: uniFetchError } = await supabase
              .from('universities')
              .select('points, active_students')
              .eq('id', uniId)
              .single();
           
           if (!uniFetchError && uni) {
             const { error: manualUpdateError } = await supabase.from('universities').update({
               points: (uni.points || 0) + pointsToAdd,
               // We only roughly increment active students here to avoid complexity
             }).eq('id', uniId);
             
             if (manualUpdateError) console.error("Manual university update failed:", manualUpdateError.message);
           }
       }
    }
    
    return !!uniId;
  } catch (error) {
    console.error("Critical error in registerUserVote:", error);
    const storedUniId = localStorage.getItem('userUniversityId');
    return !!storedUniId;
  }
};
