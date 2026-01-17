import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Trophy, Star, Users, BarChart3, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film, University, Festival } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredFilms, setFeaturedFilms] = useState<Film[]>([]);
  const [topUniversities, setTopUniversities] = useState<University[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Dynamic Data States
  const [activeFestival, setActiveFestival] = useState<Festival | null>(null);
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
            // 1. Fetch Active Festival
            const { data: festivalData } = await supabase
              .from('festivals')
              .select('*')
              .eq('is_active', true)
              .single();
            
            if (festivalData) {
                setActiveFestival(festivalData as Festival);
            }

            // 2. Fetch Real-time Stats (Using Exact Count)
            // Votes Count
            const { count: votesCount } = await supabase
              .from('film_votes')
              .select('*', { count: 'exact', head: true });
            if (votesCount !== null) setTotalVotes(votesCount);

            // Students Count (Profiles)
            const { count: studentsCount } = await supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true });
            if (studentsCount !== null) setTotalStudents(studentsCount);

            // 3. Fetch Trending Films
            const { data: films } = await supabase
              .from('master_films')
              .select('*')
              .limit(5)
              .order('votes_count', { ascending: false });
            
            if (films) setFeaturedFilms(films as Film[]);

            // 4. Fetch Leaderboard Preview
            const { data: unis } = await supabase
              .from('universities')
              .select('*')
              .limit(3)
              .order('points', { ascending: false });
            
            if (unis) setTopUniversities(unis as University[]);

        } catch (e) {
            console.error("Home page data fetch error:", e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

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
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-40">
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
      </div>

      <div className="p-6 space-y-8">
        
        {/* 2. Hero Banner (Dynamic Festival) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-6 min-h-[220px] flex flex-col justify-center">
           {/* Background Decor */}
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
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Trophy size={20} className="text-amber-500" />
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

        {/* 5. Featured Films Carousel */}
        <div>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-bold text-slate-900 text-lg">Trending Films</h3>
            <button onClick={() => navigate('/films')} className="text-brand-600 text-xs font-bold">See All</button>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
            {featuredFilms.length > 0 ? featuredFilms.map((film) => (
              <div 
                key={film.id}
                onClick={() => navigate('/films')}
                className="snap-center flex-shrink-0 w-[150px] group cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 shadow-sm bg-slate-100 border border-slate-100">
                  <img 
                    src={film.poster_url || film.image_url} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={film.title}
                    onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/300x450/e2e8f0/64748b?text=No+Img'}
                  />
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star size={10} className="text-yellow-400 fill-current" />
                    <span className="text-slate-900 text-[10px] font-bold">{formatRating(film.rating)}</span>
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate">{film.title}</h4>
                <p className="text-[10px] text-slate-500 truncate">{film.director}</p>
              </div>
            )) : (
              <div className="w-full p-4 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-100 border-dashed">
                  Loading films...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
