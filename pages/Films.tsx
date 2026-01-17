import React, { useEffect, useState } from 'react';
import FilmCard from '../components/FilmCard';
import { Search, Filter } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film } from '../types';

const FilmsPage: React.FC = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [votedFilmIds, setVotedFilmIds] = useState<string[]>([]);

  useEffect(() => {
    fetchFilms();
    // Initialize voted list from local storage
    const voted = JSON.parse(localStorage.getItem('votedFilms') || '[]');
    setVotedFilmIds(voted);
  }, []);

  const fetchFilms = async () => {
    try {
        setLoading(true);
        // Query master_films without limit to show all
        const { data, error } = await supabase
          .from('master_films')
          .select('*')
          .order('title', { ascending: true });
        
        if (!error && data && data.length > 0) {
            setFilms(data as Film[]);
        } else {
            console.log("No films found in database.");
            setFilms([]);
        }
    } catch (error) {
        console.error("Error fetching films:", error);
        setFilms([]);
    } finally {
        setLoading(false);
    }
  };

  const handleVoteSuccess = (filmId: string) => {
      setVotedFilmIds(prev => {
          const newList = prev.includes(filmId) ? prev : [...prev, filmId];
          // Update local storage immediately just in case
          localStorage.setItem('votedFilms', JSON.stringify(newList));
          return newList;
      });
  };

  // Filter Logic
  const filteredFilms = films.filter(f => {
    const genre = f.category || f.genre || 'Documentary';
    const matchesGenre = filter === 'All' || genre === filter;
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  // SORTING: Push voted films to the bottom
  const sortedFilms = [...filteredFilms].sort((a, b) => {
      const aVoted = votedFilmIds.includes(a.id);
      const bVoted = votedFilmIds.includes(b.id);
      
      if (aVoted && !bVoted) return 1; // a is voted, b is not -> a goes last
      if (!aVoted && bVoted) return -1; // b is voted, a is not -> a goes first
      
      // Secondary sort: Alphabetical
      return a.title.localeCompare(b.title);
  });

  const genres = ['All', ...Array.from(new Set(films.map(f => f.category || f.genre || 'Documentary').filter(Boolean)))];

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-lg px-6 pt-12 pb-2 sticky top-0 z-40 border-b border-slate-100">
        <div className="flex justify-between items-center mb-4">
           <h1 className="text-2xl font-black text-slate-900">All Films</h1>
           <div className="bg-slate-100 p-2 rounded-full">
             <Filter size={18} className="text-slate-500"/>
           </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Find a documentary..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm"
            />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {genres.map((cat) => (
                <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        filter === cat 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 pb-32">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="text-xs font-medium">Loading library...</span>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {sortedFilms.map((film) => (
                        <FilmCard 
                            key={film.id} 
                            film={film}
                            showVoteBtn={true}
                            onVoteSuccess={handleVoteSuccess}
                            isVotedProp={votedFilmIds.includes(film.id)}
                        />
                    ))}
                </div>
                
                {sortedFilms.length > 0 && votedFilmIds.length > 0 && (
                    <div className="text-center mt-8 mb-4">
                        <p className="text-xs text-slate-400 font-medium">Voted films are moved to the bottom of the list.</p>
                    </div>
                )}
            </>
        )}
        
        {!loading && sortedFilms.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            {search ? `No films found matching "${search}"` : "No films available."}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilmsPage;