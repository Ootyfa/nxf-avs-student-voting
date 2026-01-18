
import React, { useEffect, useState } from 'react';
import FilmCard from '../components/FilmCard';
import { Search, Info, PlayCircle, Archive } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film } from '../types';

const FilmsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'ARCHIVE'>('LIVE');
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  // State to track names of all currently active festivals
  const [activeFestivalNames, setActiveFestivalNames] = useState<string[]>([]);

  useEffect(() => {
    fetchFilmsByTab();
  }, [activeTab]);

  const fetchFilmsByTab = async () => {
    setLoading(true);
    setFilms([]); // Clear previous
    
    try {
        if (activeTab === 'LIVE') {
            // 1. Get ALL Active Festivals (not just single)
            const { data: activeFests } = await supabase
                .from('festivals')
                .select('id, name')
                .eq('is_active', true);
            
            if (activeFests && activeFests.length > 0) {
                const festIds = activeFests.map((f: any) => f.id);
                setActiveFestivalNames(activeFests.map((f: any) => f.name));

                // 2. Get Films assigned to ANY of these active festivals
                const { data: festFilms } = await supabase
                    .from('festival_films')
                    .select('master_films(*)')
                    .in('festival_id', festIds)
                    .order('sequence_order', { ascending: true });
                
                if (festFilms && festFilms.length > 0) {
                    // Extract films and deduplicate by ID (in case a film is in 2 festivals)
                    const rawFilms = festFilms.map((f: any) => f.master_films);
                    const uniqueFilms = Array.from(new Map(rawFilms.map((item:any) => [item.id, item])).values()) as Film[];
                    setFilms(uniqueFilms);
                }
            } else {
                setActiveFestivalNames([]);
            }
        } else {
            // ARCHIVE MODE: Fetch everything from master table
            const { data: allFilms } = await supabase
                .from('master_films')
                .select('*')
                .order('title', { ascending: true });
            
            if (allFilms) setFilms(allFilms as Film[]);
        }
    } catch (e) {
        console.error("Error fetching films:", e);
    } finally {
        setLoading(false);
    }
  };

  // Filter Logic
  const filteredFilms = films.filter(f => {
    const genre = f.category || f.genre || 'Documentary';
    const matchesGenre = filter === 'All' || genre === filter;
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const genres = ['All', ...Array.from(new Set(films.map(f => f.category || f.genre || 'Documentary').filter(Boolean)))];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* Sticky Header with Tabs */}
      <div className="bg-white/90 backdrop-blur-lg pt-10 pb-0 sticky top-0 z-40 border-b border-slate-200">
        
        {/* Title & Search */}
        <div className="px-6 mb-4">
             <h1 className="text-xl font-black text-slate-900 mb-4">Explore Films</h1>
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={activeTab === 'LIVE' ? "Search current festival..." : "Search entire library..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                />
            </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 gap-6">
            <button 
                onClick={() => setActiveTab('LIVE')}
                className={`pb-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 ${
                    activeTab === 'LIVE' 
                    ? 'border-brand-600 text-brand-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
            >
                <PlayCircle size={18} />
                Live Festival
            </button>
            <button 
                onClick={() => setActiveTab('ARCHIVE')}
                className={`pb-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 ${
                    activeTab === 'ARCHIVE' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
            >
                <Archive size={18} />
                Archive
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        
        {/* Context Banner */}
        {activeTab === 'LIVE' ? (
            <div className="mb-4 bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 flex-shrink-0">
                    <PlayCircle size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-brand-900 text-sm">
                        {activeFestivalNames.length > 0 ? activeFestivalNames.join(' & ') : 'Current Competition'}
                    </h2>
                    <p className="text-xs text-brand-700">These films are open for voting. Watch and rate!</p>
                </div>
            </div>
        ) : (
            <div className="mb-4 bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm">
                    <Archive size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 text-sm">Master Archive</h2>
                    <p className="text-xs text-slate-500">Browsing historical database. Voting is disabled.</p>
                </div>
            </div>
        )}

        {/* Categories (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
            {genres.map((cat) => (
                <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        filter === cat 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Grid */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="text-xs font-medium">Loading content...</span>
            </div>
        ) : (
            <>
                {filteredFilms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {filteredFilms.map((film) => (
                            <FilmCard 
                                key={film.id} 
                                film={film}
                                showVoteBtn={activeTab === 'LIVE'} // Enable voting only in Live tab
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            {activeTab === 'LIVE' ? <PlayCircle size={32} /> : <Search size={32} />}
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1">
                            {activeTab === 'LIVE' ? "No films in competition" : "No films found"}
                        </h3>
                        <p className="text-slate-400 text-xs px-8">
                            {activeTab === 'LIVE' 
                                ? "Check back later or switch to the Archive tab to browse past films." 
                                : "Try adjusting your search filters."}
                        </p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default FilmsPage;
