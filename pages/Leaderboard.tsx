import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, School, Film as FilmIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film, University } from '../types';

const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FILMS' | 'CAMPUS'>('FILMS');
  const [topFilms, setTopFilms] = useState<Film[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
      setLoading(true);
      try {
          if (activeTab === 'FILMS') {
              const { data, error } = await supabase
                  .from('master_films')
                  .select('*')
                  .order('rating', { ascending: false })
                  .limit(10);
              
              if (!error && data) {
                  setTopFilms(data as Film[]);
              } else {
                  setTopFilms([]);
              }
          } else {
              // Fetch Universities from Supabase
              const { data, error } = await supabase
                  .from('universities')
                  .select('*')
                  .order('points', { ascending: false })
                  .limit(10);
              
              if (!error && data) {
                  setUniversities(data as University[]);
              } else {
                  setUniversities([]);
              }
          }
      } catch(e) {
          console.error("Leaderboard fetch error:", e);
          setTopFilms([]);
          setUniversities([]);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1">Live Standings</h1>
          <p className="text-gray-500 text-sm">Real-time tracking of top films & campuses</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
                <button 
                    onClick={() => setActiveTab('FILMS')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'FILMS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FilmIcon size={16} /> Films
                </button>
                <button 
                    onClick={() => setActiveTab('CAMPUS')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'CAMPUS' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <School size={16} /> Campus
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* Main Content */}
          {activeTab === 'FILMS' ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <h2 className="font-bold text-lg text-gray-900">Audience Choice Award</h2>
                 <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase">Live Voting</span>
               </div>
               
               {loading ? (
                   <div className="p-8 text-center text-slate-400">Loading standings...</div>
               ) : (
                   <div className="divide-y divide-gray-100">
                      {topFilms.length > 0 ? topFilms.map((film, index) => (
                        <div key={film.id} className="p-4 sm:p-6 flex items-center hover:bg-brand-50/30 transition-colors">
                          <div className="flex-shrink-0 w-8 text-center mr-4">
                            {index === 0 && <Medal className="mx-auto text-yellow-400 w-6 h-6" />}
                            {index === 1 && <Medal className="mx-auto text-slate-400 w-6 h-6" />}
                            {index === 2 && <Medal className="mx-auto text-amber-600 w-6 h-6" />}
                            {index > 2 && <span className="text-lg font-bold text-gray-400">#{index + 1}</span>}
                          </div>
                          
                          {/* Image Removed Here */}

                          <div className="flex-grow min-w-0">
                            <h3 className="font-bold text-sm sm:text-lg text-gray-900 truncate">{film.title}</h3>
                            <p className="text-gray-500 text-xs sm:text-sm mb-2 truncate">{film.director}</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                                {/* Use rating for bar width, max 5 */}
                                <div className="bg-brand-500 h-1.5 sm:h-2 rounded-full" style={{ width: `${((film.rating || 0) / 5) * 100}%` }}></div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4 text-right">
                            <div className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center justify-end">
                                {(film.rating || 0).toFixed(1)} <Star size={14} fill="currentColor" className="text-amber-400 ml-1"/>
                            </div>
                            <p className="text-[10px] sm:text-sm text-gray-500">{film.votes_count || 0} votes</p>
                          </div>
                        </div>
                      )) : (
                          <div className="p-6 text-center text-slate-400">No films have been ranked yet.</div>
                      )}
                   </div>
               )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-brand-50/50 flex justify-between items-center">
                 <h2 className="font-bold text-lg text-gray-900">Top University Participation</h2>
                 {/* School Spirit Badge Removed */}
               </div>
               
               {loading ? (
                   <div className="p-8 text-center text-slate-400">Loading standings...</div>
               ) : (
                   <div className="divide-y divide-gray-100">
                      {universities.length > 0 ? universities.map((uni, index) => (
                        <div key={uni.id} className="p-4 sm:p-6 flex items-center hover:bg-brand-50/30 transition-colors">
                          <div className="flex-shrink-0 w-8 text-center mr-4">
                            {index === 0 && <Medal className="mx-auto text-yellow-400 w-8 h-8" />}
                            {index === 1 && <Medal className="mx-auto text-slate-400 w-8 h-8" />}
                            {index === 2 && <Medal className="mx-auto text-amber-600 w-8 h-8" />}
                            {index > 2 && <span className="text-xl font-black text-slate-300">#{index + 1}</span>}
                          </div>
                          
                          {/* Logo Removed Here */}
                          
                          <div className="flex-grow">
                            <h3 className="font-bold text-lg text-gray-900">{uni.name}</h3>
                            <p className="text-gray-500 text-sm font-medium">{uni.active_students} active students</p>
                            <div className="w-full max-w-[200px] bg-gray-100 rounded-full h-1.5 mt-2">
                                {/* Calculating arbitrary max points for bar visualization (e.g. 20000) */}
                                <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${(uni.points / (universities[0].points || 1)) * 100}%` }}></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-brand-600 font-black text-xl">{uni.points.toLocaleString()}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Points</div>
                          </div>
                        </div>
                      )) : (
                          <div className="p-6 text-center text-slate-400">No university data found in database.</div>
                      )}
                   </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;