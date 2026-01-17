import { supabase } from './supabase';
import { University } from '../types';

// Fetch list for Onboarding Dropdown
export const getUniversities = async (): Promise<University[]> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Error fetching universities from Supabase:", error.message);
      return [];
    }
    
    return (data as University[]) || [];
  } catch (err) {
    console.error("Unexpected error fetching universities:", err);
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
    // 1. Fetch existing profile first to get CURRENT points (Accumulate, don't Overwrite)
    const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('points, university_id')
        .eq('email', email)
        .single();

    const currentDbPoints = existingUser ? (existingUser.points || 0) : 0;
    const newTotalPoints = currentDbPoints + pointsToAdd;
    
    // Determine University ID: Prefer Local Storage (recent choice), fallback to DB
    let uniId = localStorage.getItem('userUniversityId');
    if (!uniId && existingUser?.university_id) {
        uniId = existingUser.university_id;
        localStorage.setItem('userUniversityId', uniId); // Sync back to local
    }

    // 2. Upsert User Profile with new total
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        email: email,
        name: name,
        points: newTotalPoints, 
        university_id: uniId || null
      }, { onConflict: 'email' });

    if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
            console.warn("Profile stats update failed (table missing/uncached):", error.message);
            return !!uniId;
        }
        console.warn("Profile stats update failed (non-fatal):", error.message);
        return !!uniId;
    }
    
    // Update local storage to match DB
    localStorage.setItem('userPoints', newTotalPoints.toString());

    // 3. If user belongs to a university, increment university stats
    if (uniId) {
       const { error: rpcError } = await supabase.rpc('increment_university_points', { 
         uni_id: uniId, 
         points_to_add: pointsToAdd 
       });
       
       if (rpcError) {
           console.warn("RPC failed, attempting fallback update:", rpcError.message);
           
           // Fallback if RPC doesn't exist yet
           const { data: uni, error: fetchError } = await supabase.from('universities').select('points, active_students').eq('id', uniId).single();
           
           if (!fetchError && uni) {
             await supabase.from('universities').update({
               points: (uni.points || 0) + pointsToAdd,
               active_students: (uni.active_students || 0) + 1
             }).eq('id', uniId);
           }
       }
    }
    
    return !!uniId;
  } catch (error) {
    console.error("Error in registerUserVote (swallowed):", error);
    const storedUniId = localStorage.getItem('userUniversityId');
    return !!storedUniId;
  }
};