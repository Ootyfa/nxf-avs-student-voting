
import React, { useState } from 'react';
import { X, Play, Clock, Star, MessageCircle, Send, CheckCircle, ThumbsUp, Check, Film as FilmIcon } from 'lucide-react';
import { Film } from '../types';
import { supabase } from '../services/supabase';
import { getGenreGradient } from './FilmCard'; // Reuse the gradient logic

interface FilmDetailModalProps {
  film: Film;
  onClose: () => void;
  onVoteClick: () => void;
  hasVoted: boolean;
}

const FilmDetailModal: React.FC<FilmDetailModalProps> = ({ film, onClose, onVoteClick, hasVoted }) => {
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaSent, setQaSent] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Normalize Data
  const hasUrl = !!(film.poster_url?.trim() || film.image_url?.trim());
  const displayImage = film.poster_url || film.image_url;
  const showImage = hasUrl && !imageError;

  const displayDuration = film.duration || (film.duration_minutes ? `${film.duration_minutes} min` : 'N/A');
  const genre = film.category || film.genre || 'Film';

  const handleQASubmit = async () => {
    if (qaQuestion.trim()) {
      const userName = localStorage.getItem('userName') || 'Anonymous';
      const userEmail = localStorage.getItem('userEmail');

      try {
        const payload = {
            film_id: film.id,
            film_title: film.title,
            user_name: userName,
            user_email: userEmail,
            question: qaQuestion,
            created_at: new Date().toISOString()
        };
        
        await supabase.from('film_questions').insert([payload]);
      } catch (error) {
        console.error("Error submitting question:", error);
      }

      setQaSent(true);
      setTimeout(() => {
        setQaQuestion('');
        setQaSent(false);
      }, 3000);
    }
  };

  const formatRating = (val: any) => {
    const num = Number(val);
    return (isNaN(num) || num === 0) ? '0.0' : num.toFixed(1);
  };

  return (
    // Updated Z-Index to z-[100] to ensure it covers the Layout BottomNav
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Image (Image or Dynamic Typography) */}
        <div className={`relative h-56 sm:h-64 flex-shrink-0 ${!showImage ? getGenreGradient(genre) : 'bg-slate-100'}`}>
          {showImage ? (
            <>
                <img 
                    src={displayImage} 
                    alt={film.title} 
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                />
                {/* Subtle gradient for depth on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </>
          ) : (
             <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
                 <FilmIcon className="text-white/30 mb-3" size={48} />
                 <h2 className="text-white font-black text-3xl leading-tight mb-2 drop-shadow-lg">
                    {film.title}
                 </h2>
                 <div className="w-12 h-1 bg-white/50 rounded-full mb-3"></div>
                 <p className="text-white/90 text-sm font-bold uppercase tracking-wider">
                     {film.director}
                 </p>
             </div>
          )}

          {/* Controls Overlay */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all z-20 active:scale-95"
          >
            <X size={20} />
          </button>
          
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-20">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-white text-xs font-bold">{formatRating(film.rating)}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-white no-scrollbar">
            
            {/* Title & Main Info */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                    {film.title}
                </h2>
                <p className="text-slate-500 font-medium text-sm">
                    Directed by <span className="text-slate-900">{film.director}</span>
                </p>
            </div>

            {/* Meta & Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
                    <Clock size={14} className="text-brand-500" />
                    {displayDuration}
                </span>
                
                {film.trailer_url && (
                    <a 
                        href={film.trailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                    >
                        <Play size={14} fill="currentColor" /> Watch Trailer
                    </a>
                )}
            </div>

            {/* Synopsis */}
            <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase mb-2">Synopsis</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {film.synopsis || "No synopsis available for this film. Immerse yourself in the visual storytelling."}
                </p>
            </div>

            {/* Q&A Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase mb-3 flex items-center gap-2">
                    <MessageCircle size={14} className="text-brand-500" /> 
                    Ask the Director
                </h4>
                {qaSent ? (
                    <div className="bg-green-100 text-green-700 text-sm p-3 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Question Submitted!
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={qaQuestion}
                            onChange={(e) => setQaQuestion(e.target.value)}
                            placeholder="What inspired this scene?"
                            className="flex-grow text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        />
                        <button 
                            onClick={handleQASubmit}
                            className="bg-slate-900 text-white rounded-xl w-10 flex items-center justify-center hover:bg-slate-800 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Spacer */}
            <div className="h-4"></div>
        </div>

        {/* Footer Actions (Fixed at bottom) */}
        <div className="p-4 border-t border-slate-100 bg-white z-20 flex-shrink-0">
            <button 
              onClick={onVoteClick}
              disabled={hasVoted}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                hasVoted 
                  ? 'bg-green-50 text-green-600 border border-green-200 cursor-not-allowed' 
                  : 'bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  Vote Submitted
                </>
              ) : (
                <>
                  <ThumbsUp size={18} />
                  Rate & Review Film
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default FilmDetailModal;
