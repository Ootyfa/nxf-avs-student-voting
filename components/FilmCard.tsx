
import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Check, Clock, Bookmark, Play, Eye } from 'lucide-react';
import { Film } from '../types';
import VotingModal from './VotingModal';
import FilmDetailModal from './FilmDetailModal';

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
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Normalize Data
  const displayImage = film.poster_url || film.image_url || 'https://placehold.co/300x450/f1f5f9/94a3b8?text=No+Img';
  const displayDuration = film.duration || (film.duration_minutes ? `${film.duration_minutes} min` : 'N/A');

  useEffect(() => {
    // Check local storage for watchlist
    const watchlist = JSON.parse(localStorage.getItem('userWatchlist') || '[]');
    setIsInWatchlist(watchlist.includes(film.id));

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

  const formatRating = (val: any) => {
    const num = Number(val);
    return (isNaN(num) || num === 0) ? '0.0' : num.toFixed(1);
  };

  const handleVoteClick = () => {
    setShowDetailModal(false); // Close detail modal if open
    if (!hasVoted) {
        setShowVotingModal(true);
    }
  };

  const handleVoteComplete = () => {
    setHasVoted(true);
    setShowVotingModal(false);

    const votedList = JSON.parse(localStorage.getItem('votedFilms') || '[]');
    if (!votedList.includes(film.id)) {
        const newList = [...votedList, film.id];
        localStorage.setItem('votedFilms', JSON.stringify(newList));
    }

    if (onVoteSuccess) {
        onVoteSuccess(film.id);
    }
  };

  return (
    <>
      <div 
        onClick={() => setShowDetailModal(true)}
        className={`bg-white rounded-2xl p-3 shadow-sm border transition-all duration-300 flex flex-col h-full cursor-pointer relative group hover:shadow-soft active:scale-[0.98] ${
            hasVoted 
            ? 'border-green-100 bg-green-50/10' 
            : 'border-slate-100 hover:border-slate-200'
        }`}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3">
          <img 
            src={displayImage} 
            alt={film.title} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                hasVoted ? 'grayscale-[0.3]' : ''
            } ${!showVoteBtn ? 'grayscale-[0.5]' : ''}`}
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-current" />
            <span className="text-white text-[10px] font-bold">{formatRating(film.rating)}</span>
          </div>

          <button 
             onClick={toggleWatchlist}
             className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md transition-colors z-20 ${isInWatchlist ? 'bg-brand-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
          >
            <Bookmark size={14} fill={isInWatchlist ? "currentColor" : "none"} />
          </button>
          
          {hasVoted && (
              <div className="absolute inset-0 bg-green-900/10 flex items-center justify-center backdrop-blur-[1px] animate-fade-in">
                  <div className="bg-white text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border border-green-100">
                      <Check size={14} strokeWidth={3} /> Voted
                  </div>
              </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col">
          <div className="mb-3">
            {/* Removed Section Name and Genre for cleaner design as requested */}
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{film.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{film.director}</p>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 mb-3 mt-auto">
             <span className="flex items-center gap-1">
                <Clock size={10} /> {displayDuration}
             </span>
             {film.trailer_url && (
                 <span className="flex items-center gap-1 text-slate-500">
                    <Play size={10} /> Trailer
                 </span>
             )}
          </div>

          {/* Action Button */}
          {showVoteBtn ? (
            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  handleVoteClick();
              }}
              disabled={hasVoted}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 relative z-10 ${
                hasVoted 
                  ? 'bg-green-50 text-green-600 border border-green-100 cursor-not-allowed' 
                  : 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  <span>Voted</span>
                </>
              ) : (
                <>
                  <ThumbsUp size={14} />
                  <span>Vote</span>
                </>
              )}
            </button>
          ) : (
              <div className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 cursor-default">
                  <Eye size={14} />
                  <span>View Details</span>
              </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && (
          <FilmDetailModal 
              film={film}
              hasVoted={hasVoted}
              onClose={() => setShowDetailModal(false)}
              onVoteClick={handleVoteClick}
          />
      )}

      {/* VOTING MODAL (Renders on top of Detail) */}
      {showVotingModal && (
        <VotingModal 
            filmId={film.id}
            filmTitle={film.title}
            onClose={() => setShowVotingModal(false)}
            onVoteComplete={handleVoteComplete}
        />
      )}
    </>
  );
};

export default FilmCard;
