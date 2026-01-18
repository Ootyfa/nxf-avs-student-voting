
import React, { useState } from 'react';
import { Star, X, Mail, MessageSquare, Sparkles, CheckCircle, ArrowRight, Share2, School, Info } from 'lucide-react';
import { supabase } from '../services/supabase';
import { gradeUserReview } from '../services/ai';
import { registerUserVote, syncUserProfile } from '../services/auth';

interface VotingModalProps {
  filmId: string;
  filmTitle: string;
  onClose: () => void;
  onVoteComplete: () => void;
}

type Step = 'RATING' | 'EMAIL' | 'REVIEW_PROMPT' | 'REVIEW_FORM' | 'ANALYZING' | 'SUCCESS';

const RATING_CATEGORIES = [
  { id: 'story', label: 'Story & Clarity', sub: 'Easy to follow & engaging?' },
  { id: 'authenticity', label: 'Authenticity & Depth', sub: 'Honest & well-researched?' },
  { id: 'craft', label: 'Craft & Presentation', sub: 'Visuals, sound, editing' },
  { id: 'impact', label: 'Impact', sub: 'Did it make you think/feel?' }
] as const;

const VotingModal: React.FC<VotingModalProps> = ({ filmId, filmTitle, onClose, onVoteComplete }) => {
  const [step, setStep] = useState<Step>('RATING');
  
  // Detailed ratings state
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    story: 0,
    authenticity: 0,
    craft: 0,
    impact: 0
  });

  // Overall averaged rating (for compatibility and logic)
  const [rating, setRating] = useState(0);
  
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [review, setReview] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [linkedUniversity, setLinkedUniversity] = useState(false);
  const userUniversityName = localStorage.getItem('userUniversityName');

  // 1. Submit Rating
  const handleRatingSubmit = async () => {
    // Validate all categories are filled
    const values = Object.values(categoryRatings);
    if (values.some((v: number) => v === 0)) return;

    // Calculate Average (Rounded)
    const sum = values.reduce((acc: number, curr: number) => acc + curr, 0);
    const average = Math.round(sum / values.length);
    setRating(average);
    
    // Check if we need email
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
      setStep('EMAIL');
    } else {
      await submitVote(average, storedEmail);
      setStep('REVIEW_PROMPT');
    }
  };

  // 2. Submit Email
  const handleEmailSubmit = async () => {
    if (!email.includes('@')) return;
    localStorage.setItem('userEmail', email);
    
    // RETRIEVE DATA: Check if user exists in DB and restore their profile (points, uni, etc.)
    await syncUserProfile(email);

    await submitVote(rating, email);
    setStep('REVIEW_PROMPT');
  };

  const submitVote = async (stars: number, userEmail: string) => {
    const name = localStorage.getItem('userName') || 'Anonymous';

    try {
        const { error: voteError } = await supabase
            .from('film_votes')
            .upsert({
                film_id: filmId,
                user_email: userEmail,
                user_name: name,
                rating: stars,
                created_at: new Date().toISOString()
            }, { onConflict: 'film_id, user_email' });

        if (voteError) {
             if (voteError.code === '42P01' || voteError.code === 'PGRST205') {
                 console.warn("Table film_votes missing or not cached. Detail vote skipped.");
             } else {
                 console.error("Error saving vote detail:", JSON.stringify(voteError, null, 2));
             }
        }

        const { error: rpcError } = await supabase.rpc('increment_vote', { row_id: filmId });
        if (rpcError) {
             console.warn("RPC increment_vote failed:", rpcError.message);
             const { data: film } = await supabase.from('master_films').select('votes_count').eq('id', filmId).single();
             if (film) {
                 await supabase.from('master_films').update({ votes_count: (film.votes_count || 0) + 1 }).eq('id', filmId);
             }
        }
        
        const isLinked = await registerUserVote(userEmail, name, 10); 
        setLinkedUniversity(isLinked);
        
    } catch (e) {
        console.error("Vote submission critical error:", e);
    }
  };

  // 3. Review Logic
  const handleReviewSubmit = async () => {
    setStep('ANALYZING');
    
    // Call Google AI
    const grade = await gradeUserReview(filmTitle, review);
    
    // Update the existing vote record with the review
    const storedEmail = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName') || 'Anonymous';
    
    if (storedEmail) {
        try {
            const breakdownText = `[Ratings: Story=${categoryRatings.story}, Auth=${categoryRatings.authenticity}, Craft=${categoryRatings.craft}, Impact=${categoryRatings.impact}] \n\n`;
            const fullReviewText = breakdownText + review;

            const { error } = await supabase
                .from('film_votes')
                .upsert({
                    film_id: filmId,
                    user_email: storedEmail,
                    user_name: name,
                    rating: rating,
                    review_text: fullReviewText,
                    ai_score: grade.pointsAwarded,
                    created_at: new Date().toISOString()
                }, { onConflict: 'film_id, user_email' });

            if (error) {
                console.error("Review save error:", error.message);
            }
                
            // Also give points to the user profile
            await registerUserVote(storedEmail, name, grade.pointsAwarded); // Review Points
        } catch (e) {
            console.error("Error saving review:", e);
        }
    }

    setPointsEarned(grade.pointsAwarded);
    setAiFeedback(grade.constructiveFeedback);
    setStep('SUCCESS');
    setTimeout(() => {
        onVoteComplete(); 
    }, 5000); 
  };

  const handleSkipReview = () => {
    setStep('SUCCESS');
    setTimeout(() => {
        onVoteComplete();
    }, 2500);
  };

  const handleShare = () => {
     if (navigator.share) {
         navigator.share({
             title: `I voted for ${filmTitle}!`,
             text: `I just cast my vote for ${filmTitle} at NXF AVS Festival.`,
             url: window.location.href
         });
     } else {
         alert("Sharing link copied to clipboard!");
     }
  };

  const isRatingComplete = Object.values(categoryRatings).every((v: number) => v > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto no-scrollbar animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 active:scale-95 transition-transform">
          <X size={24} />
        </button>

        {/* --- STEP: RATING --- */}
        {step === 'RATING' && (
          <div className="p-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-black text-slate-900 mb-1">Rate this Film</h3>
                <p className="text-slate-500 text-xs">Recommended 4-Category Model</p>
            </div>
            
            <div className="space-y-5 mb-8">
              {RATING_CATEGORIES.map((cat) => (
                <div key={cat.id} className="animate-fade-in">
                   <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-bold text-slate-800">{cat.label}</label>
                      <span className="text-[10px] text-slate-400 font-medium">{cat.sub}</span>
                   </div>
                   <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.id]: star }))}
                          className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${
                            categoryRatings[cat.id] >= star ? 'bg-yellow-50 text-yellow-400 ring-1 ring-yellow-100' : 'bg-slate-50 text-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Star size={20} fill={categoryRatings[cat.id] >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                   </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleRatingSubmit}
              disabled={!isRatingComplete}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
            >
              Submit Evaluation
            </button>
          </div>
        )}

        {/* --- STEP: EMAIL --- */}
        {step === 'EMAIL' && (
          <div className="p-8">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-4 text-brand-600">
                <Mail size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Almost Done</h3>
            <p className="text-slate-500 text-sm mb-6">
                Enter your email ID to verify your vote. This helps us ensure one person, one vote.
            </p>
            
            <input 
              type="email" 
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-brand-500 outline-none"
            />

            <button 
              onClick={handleEmailSubmit}
              disabled={!email.includes('@')}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
            >
              Continue
            </button>
          </div>
        )}

        {/* --- STEP: REVIEW PROMPT --- */}
        {step === 'REVIEW_PROMPT' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500 animate-bounce">
                <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Want to earn more?</h3>
            <p className="text-slate-500 text-sm mb-6">Write a short review. Our AI will grade it and award you up to 100 extra points!</p>
            
            <button 
              onClick={() => setStep('REVIEW_FORM')}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold mb-3 shadow-lg shadow-brand-200"
            >
              Write a Review
            </button>
            <button 
              onClick={handleSkipReview}
              className="text-slate-400 text-sm font-medium hover:text-slate-600"
            >
              No thanks, maybe later
            </button>
          </div>
        )}

        {/* --- STEP: REVIEW FORM --- */}
        {step === 'REVIEW_FORM' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Your Review</h3>
            <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you think about the cinematography, story, or message?"
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-brand-500 outline-none resize-none text-sm"
            />
            <button 
              onClick={handleReviewSubmit}
              disabled={review.length < 10}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Submit for Grading <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* --- STEP: ANALYZING --- */}
        {step === 'ANALYZING' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="font-bold text-slate-900 mb-2">AI is reading your review...</h3>
            <p className="text-xs text-slate-400">Analyzing sentiment and depth</p>
          </div>
        )}

        {/* --- STEP: SUCCESS --- */}
        {step === 'SUCCESS' && (
          <div className="p-8 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Vote Recorded!</h3>
            <p className="text-slate-500 text-sm mb-4">Your vote has been successfully cast.</p>

            {pointsEarned > 0 && (
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 mb-6">
                    <p className="text-brand-800 font-bold text-lg">+{pointsEarned} Points Earned</p>
                    <p className="text-xs text-brand-600 mt-1 mb-2">"{aiFeedback}"</p>
                </div>
            )}
            
            <button 
                onClick={handleShare}
                className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-4"
            >
                <Share2 size={16} /> Share Vote
            </button>

            <button onClick={onClose} className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingModal;
