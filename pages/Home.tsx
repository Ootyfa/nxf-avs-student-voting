
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Star, Users, BarChart3, MapPin, Calendar, AlertCircle, ChevronDown, Film as FilmIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film, University, Festival } from '../types';
import { getGenreGradient } from '../components/FilmCard'; // Use shared gradient logic

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [festivalFilms, setFestivalFilms] = useState<Film[]>([]);
  const [topUniversities, setTopUniversities] = useState<University[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Dynamic Data States
  const [activeFestivals, setActiveFestivals] = useState<Festival[]>([]);
  const [selectedFestivalIndex, setSelectedFestivalIndex] = useState(0);
  
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user avatar
    const name = localStorage.getItem('userName') || 'Guest';
    setAvatarUrl(`https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch ALL Active Festivals
            const { data: festivalsData } = await supabase
              .from('festivals')
              .select('*')
              .eq('is_active', true)
              .order('start_date', { ascending: false }); // Show newest first
            
            if (festivalsData && festivalsData.length > 0) {
                const fests = festivalsData as Festival[];
                setActiveFestivals(fests);
                fetchFestivalFilms(fests[0].id); // Load films for the first one by default
            } else {
                 // No active festival, fallback
                 const { data: films } = await supabase
                    .from('master_films')
                    .select('*')
                    .limit(5)
                    .order('votes_count', { ascending: false });
                 if (films) setFestivalFilms(films as Film[]);
            }

            // 2. Fetch Real-time Stats
            const { count: votesCount } = await supabase.from('film_votes').select('*', { count: 'exact', head: true });
            if (votesCount !== null) setTotalVotes(votesCount);

            const { count: studentsCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
            if (studentsCount !== null) setTotalStudents(studentsCount);

            // 3. Fetch Leaderboard Preview
            const { data: unis } = await supabase.from('universities').select('*').limit(3).order('points', { ascending: false });
            if (unis) setTopUniversities(unis as University[]);

        } catch (e) {
            console.error("Home page data fetch error:", e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const fetchFestivalFilms = async (festivalId: string) => {
      const { data: festivalFilmsData } = await supabase
        .from('festival_films')
        .select('film_id, master_films(*)')
        .eq('festival_id', festivalId)
        .order('sequence_order', { ascending: true });
    
      if (festivalFilmsData && festivalFilmsData.length > 0) {
        const mappedFilms = festivalFilmsData.map((item: any) => item.master_films) as Film[];
        setFestivalFilms(mappedFilms);
      } else {
        setFestivalFilms([]);
      }
  };

  const handleFestivalChange = (index: number) => {
      setSelectedFestivalIndex(index);
      const fest = activeFestivals[index];
      if (fest) fetchFestivalFilms(fest.id);
  };

  const activeFestival = activeFestivals[selectedFestivalIndex];

  const formatRating = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  };

  const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      
      {/* 1. Header Section */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">NXF AVS</h1>
            <p className="text-xs text-brand-600 font-bold tracking-wide uppercase">Advance Voting System</p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
          >
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>

        {/* Festival Switcher (Only if > 1 active festival) */}
        {activeFestivals.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {activeFestivals.map((fest, idx) => (
                    <button
                        key={fest.id}
                        onClick={() => handleFestivalChange(idx)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedFestivalIndex === idx
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                    >
                        {fest.name}
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="p-6 space-y-8">
        
        {/* 2. Hero Banner (Dynamic Festival) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-6 min-h-[220px] flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-40 h-40 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-10"></div>
           
           <div className="relative z-10">
               {activeFestival ? (
                   <>
                       <div className="flex items-center gap-2 mb-4">
                           {activeFestival.status === 'Live' ? (
                               <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase animate-pulse flex items-center gap-1">
                                   <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Live Now
                               </span>
                           ) : (
                               <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">
                                   {activeFestival.status}
                               </span>
                           )}
                           
                           {activeFestival.location && (
                               <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                   <MapPin size={10} /> {activeFestival.location}
                               </span>
                           )}
                       </div>
                       
                       <h2 className="text-3xl font-black text-slate-900 mb-2 leading-none">
                           {activeFestival.name}
                       </h2>
                       
                       <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-6">
                           <Calendar size={14} />
                           <span>
                               {formatDate(activeFestival.start_date)} - {formatDate(activeFestival.end_date)}
                           </span>
                       </div>

                       {activeFestival.status === 'Live' ? (
                           <button 
                              onClick={() => navigate('/films')}
                              className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                           >
                               <PlayCircle size={18} /> Start Voting
                           </button>
                       ) : (
                           <button 
                              disabled
                              className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                           >
                               Voting is currently closed
                           </button>
                       )}
                   </>
               ) : (
                   <div className="text-center py-8">
                       <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                       <h3 className="text-lg font-bold text-slate-900">No Active Festival</h3>
                       <p className="text-slate-400 text-sm">Please check back later for upcoming events.</p>
                   </div>
               )}
           </div>
        </div>
        
        {/* 3. Real-time Quick Stats Widget */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <BarChart3 className="text-brand-500 mb-2" size={20} />
                <span className="text-xl font-black text-slate-900">
                    {loading ? '...' : totalVotes.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Votes Cast</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <Users className="text-blue-500 mb-2" size={20} />
                <span className="text-xl font-black text-slate-900">
                    {loading ? '...' : totalStudents.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
            </div>
        </div>

        {/* 4. Live Leaderboard Preview */}
        <div>
            <div className="flex justify-between items-end mb-4 px-1">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">
                        Campus Leaders
                    </h3>
                </div>
                <button onClick={() => navigate('/leaderboard')} className="text-brand-600 text-xs font-bold">View Full</button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {topUniversities.length > 0 ? topUniversities.map((uni, idx) => (
                    <div key={uni.id} className="p-4 flex items-center gap-4">
                        <span className={`font-black text-sm w-4 text-center ${idx === 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                            {idx + 1}
                        </span>
                        <div className="w-8 h-8 flex items-center justify-center text-lg bg-slate-50 rounded-lg">
                            {uni.logo}
                        </div>
                        <div className="flex-grow">
                            <h4 className="text-sm font-bold text-slate-900">{uni.name}</h4>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                    className="bg-brand-500 h-full rounded-full" 
                                    style={{ width: `${(uni.points / (topUniversities[0]?.points || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{uni.points.toLocaleString()}</span>
                    </div>
                )) : (
                    <div className="p-6 text-center text-slate-400 text-sm">No active leaderboard data.</div>
                )}
            </div>
        </div>

        {/* 5. Festival Program (Featured) */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <div>
                <h3 className="font-bold text-slate-900 text-lg">Festival Program</h3>
                <p className="text-[10px] text-brand-600 font-bold uppercase">Curated Selection</p>
            </div>
            <button onClick={() => navigate('/films')} className="text-brand-600 text-xs font-bold">All Films</button>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
            {festivalFilms.length > 0 ? festivalFilms.map((film) => {
               const hasImage = !!(film.poster_url || film.image_url);
               const displayImage = film.poster_url || film.image_url;
               const genre = film.category || film.genre || 'Film';

               return (
                  <div 
                    key={film.id}
                    onClick={() => navigate('/films')}
                    className="snap-center flex-shrink-0 w-[150px] group cursor-pointer"
                  >
                    <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 shadow-sm border border-slate-100 ${!hasImage ? getGenreGradient(genre) : 'bg-slate-100'}`}>
                      {hasImage ? (
                        <img 
                            src={displayImage} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            alt={film.title}
                        />
                      ) : (
                         <div className="w-full h-full flex flex-col justify-center items-center text-center p-2 relative">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-lg"></div>
                            <FilmIcon className="text-white/30 mb-2" size={20} />
                            <h4 className="text-white font-black text-xs leading-tight mb-1 drop-shadow-md line-clamp-3">
                                {film.title}
                            </h4>
                            <div className="w-4 h-0.5 bg-white/50 rounded-full mb-1"></div>
                            <p className="text-white/80 text-[10px] uppercase line-clamp-1">{film.director}</p>
                         </div>
                      )}
                      
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <Star size={10} className="text-yellow-400 fill-current" />
                        <span className="text-slate-900 text-[10px] font-bold">{formatRating(film.rating)}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate">{film.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{film.director}</p>
                  </div>
               );
            }) : (
              <div className="w-full p-4 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-100 border-dashed">
                  No films assigned to {activeFestival?.name || 'current festival'}.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
