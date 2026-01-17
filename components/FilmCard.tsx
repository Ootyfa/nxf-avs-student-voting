import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Check, Clock, ChevronDown, Info, Bookmark, MessageCircle, Send, CheckCircle, Play } from 'lucide-react';
import { Film } from '../types';
import VotingModal from './VotingModal';
import { supabase } from '../services/supabase';

interface FilmCardProps {
  film: Film;
  sectionName?: string;
  rating?: number;
  votes?: number;
  showVoteBtn?: boolean;
  onVoteSuccess?: (filmId: string) => void;
  isVotedProp?: boolean;
}

const FilmCard: React.FC<FilmCardProps> = ({ film, sectionName, showVoteBtn = true, onVoteSuccess, isVotedProp = false }) => {
  const [hasVoted, setHasVoted] = useState(isVotedProp);
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // New Features
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaSent, setQaSent] = useState(false);

  // Normalize Data (Handle CSV import variations)
  const displayImage = film.poster_url || film.image_url || 'https://placehold.co/300x450/f1f5f9/94a3b8?text=No+Img';
  const displayGenre = film.category || film.genre || 'Documentary';
  const displayDuration = film.duration || (film.duration_minutes ? `${film.duration_minutes} min` : 'N/A');

  useEffect(() => {
    // Check local storage for watchlist
    const watchlist = JSON.parse(localStorage.getItem('userWatchlist') || '[]');
    setIsInWatchlist(watchlist.includes(film.id));

    // Priority to prop, fallback to local storage
    if (isVotedProp) {
        setHasVoted(true);
    } else {
        const votedList = JSON.parse(localStorage.getItem('votedFilms') || '[]');
        if (votedList.includes(film.id)) {
            setHasVoted(true);
        }
    }
  }, [film.id, isVotedProp]);

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const watchlist = JSON.parse(localStorage.getItem('userWatchlist') || '[]');
    let newWatchlist;
    
    if (watchlist.includes(film.id)) {
      newWatchlist = watchlist.filter((id: string) => id !== film.id);
    } else {
      newWatchlist = [...watchlist, film.id];
    }
    
    localStorage.setItem('userWatchlist', JSON.stringify(newWatchlist));
    setIsInWatchlist(!isInWatchlist);
  };

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
        
        console.log("Submitting Q&A to Supabase:", payload);
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
    // Show 0.0 if no rating exists yet
    return (isNaN(num) || num === 0) ? '0.0' : num.toFixed(1);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVoted) {
        setShowModal(true);
    }
  };

  const handleVoteComplete = () => {
    setHasVoted(true);
    setShowModal(false);

    // Persist to local storage
    const votedList = JSON.parse(localStorage.getItem('votedFilms') || '[]');
    if (!votedList.includes(film.id)) {
        const newList = [...votedList, film.id];
        localStorage.setItem('votedFilms', JSON.stringify(newList));
    }

    if (onVoteSuccess) {
        onVoteSuccess(film.id);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div 
        onClick={toggleExpand}
        className={`bg-white rounded-2xl p-3 shadow-sm border border-slate-100 transition-all duration-300 flex flex-col h-full cursor-pointer relative group ${isExpanded ? 'ring-2 ring-brand-100 z-10' : ''} ${hasVoted ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : 'hover:shadow-soft'}`}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3">
          <img 
            src={displayImage} 
            alt={film.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-current" />
            <span className="text-white text-[10px] font-bold">{formatRating(film.rating)}</span>
          </div>

          {/* Watchlist Button */}
          <button 
             onClick={toggleWatchlist}
             className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${isInWatchlist ? 'bg-brand-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
          >
            <Bookmark size={14} fill={isInWatchlist ? "currentColor" : "none"} />
          </button>
          
          {/* Voted Overlay Indicator (Optional, but adds clarity) */}
          {hasVoted && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Check size={12} /> Voted
                  </div>
              </div>
          )}
          
          {/* Expand/Collapse Indicator */}
          <div className={`absolute bottom-2 right-2 backdrop-blur-md px-2 py-1.5 rounded-full flex items-center gap-1 transition-all duration-300 ${isExpanded ? 'bg-brand-500/90 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
             {!isExpanded && <span className="text-[10px] font-bold pr-1">Info</span>}
             <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col">
          <div className="mb-2">
            {sectionName && (
               <div className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">
                   {sectionName}
               </div>
            )}
            <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider mb-0.5 block">
              {displayGenre}
            </span>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{film.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{film.director}</p>
          </div>

          {/* Expanded Details Section */}
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              isExpanded ? 'max-h-[500px] opacity-100 mb-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600">
                        <Clock size={12} className="text-brand-500" />
                        {displayDuration}
                    </span>
                    {film.trailer_url && (
                        <a 
                            href={film.trailer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-100 text-xs font-semibold text-red-600 active:scale-95 transition-transform hover:bg-red-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Play size={12} /> Trailer
                        </a>
                    )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {film.synopsis || "No synopsis available for this film."}
                </p>

                {/* Q&A Section */}
                <div className="bg-slate-50 rounded-xl p-2.5" onClick={(e) => e.stopPropagation()}>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <MessageCircle size={10} /> Ask the Director
                    </h4>
                    {qaSent ? (
                        <div className="bg-green-100 text-green-700 text-xs p-2 rounded-lg text-center font-bold flex items-center justify-center gap-1 h-[34px]">
                            <CheckCircle size={12} />
                            Question Sent!
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={qaQuestion}
                                onChange={(e) => setQaQuestion(e.target.value)}
                                placeholder="What inspired you?"
                                className="flex-grow text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-500"
                            />
                            <button 
                                onClick={handleQASubmit}
                                className="bg-brand-600 text-white rounded-lg px-2 flex items-center justify-center hover:bg-brand-700 transition-colors"
                            >
                                <Send size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {showVoteBtn && (
            <button 
              onClick={handleVoteClick}
              disabled={hasVoted}
              className={`w-full mt-auto py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 z-10 relative ${
                hasVoted 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                  : 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check size={14} />
                  <span>Voted</span>
                </>
              ) : (
                <>
                  <ThumbsUp size={14} />
                  <span>Vote</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <VotingModal 
            filmId={film.id}
            filmTitle={film.title}
            onClose={() => setShowModal(false)}
            onVoteComplete={handleVoteComplete}
        />
      )}
    </>
  );
};

export default FilmCard;