
import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash, Film as FilmIcon, Calendar, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film, Festival } from '../types';

const AdminPage: React.FC = () => {
  // View State: 'FILMS' (Master DB) or 'PROGRAM' (Festival Assignment)
  const [activeTab, setActiveTab] = useState<'FILMS' | 'PROGRAM'>('PROGRAM');
  
  // Data States
  const [films, setFilms] = useState<Film[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string>('');
  const [assignedFilmIds, setAssignedFilmIds] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedFestivalId) {
        fetchAssignedFilms(selectedFestivalId);
    }
  }, [selectedFestivalId]);

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch Master Films
    const { data: filmData } = await supabase.from('master_films').select('*').order('created_at', { ascending: false });
    if (filmData) setFilms(filmData as Film[]);

    // 2. Fetch Festivals
    const { data: festData } = await supabase.from('festivals').select('*').order('start_date', { ascending: false });
    if (festData && festData.length > 0) {
        setFestivals(festData as Festival[]);
        // Default to the first active festival, or just the first one
        const active = festData.find((f: any) => f.is_active) || festData[0];
        setSelectedFestivalId(active.id);
    }
    setLoading(false);
  };

  const fetchAssignedFilms = async (festId: string) => {
      const { data } = await supabase.from('festival_films').select('film_id').eq('festival_id', festId);
      if (data) {
          setAssignedFilmIds(data.map((f: any) => f.film_id));
      } else {
          setAssignedFilmIds([]);
      }
  };

  const toggleAssignment = async (filmId: string) => {
      if (!selectedFestivalId) return;

      const isAssigned = assignedFilmIds.includes(filmId);

      if (isAssigned) {
          // REMOVE from festival
          await supabase.from('festival_films').delete().match({ festival_id: selectedFestivalId, film_id: filmId });
          setAssignedFilmIds(prev => prev.filter(id => id !== filmId));
      } else {
          // ADD to festival
          await supabase.from('festival_films').insert({ festival_id: selectedFestivalId, film_id: filmId });
          setAssignedFilmIds(prev => [...prev, filmId]);
      }
  };

  const filteredFilms = films.filter(f => 
    f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-xl font-black text-slate-900">Admin Dashboard</h1>
           <p className="text-xs text-slate-500 font-medium">Manage Content & Festivals</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('PROGRAM')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'PROGRAM' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}
            >
                Program
            </button>
            <button 
                onClick={() => setActiveTab('FILMS')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'FILMS' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}
            >
                Database
            </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        
        {/* --- PROGRAM MANAGEMENT TAB --- */}
        {activeTab === 'PROGRAM' && (
            <div className="space-y-6">
                
                {/* 1. Festival Selector */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Active Festival</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedFestivalId}
                            onChange={(e) => setSelectedFestivalId(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-brand-500"
                        >
                            {festivals.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.name} ({f.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Active Status Indicator */}
                    {festivals.find(f => f.id === selectedFestivalId)?.is_active ? (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-bold px-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Currently Live on Home Page
                        </div>
                    ) : (
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400 font-bold px-1">
                            <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                            Not Live (Draft/Ended)
                        </div>
                    )}
                </div>

                {/* 2. Assign Films Interface */}
                <div>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <FilmIcon size={18} /> Assign Films to Program
                    </h3>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search master database..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm"
                        />
                    </div>

                    {/* List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {filteredFilms.map(film => {
                                const isAssigned = assignedFilmIds.includes(film.id);
                                return (
                                    <div key={film.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={film.image_url} className="w-10 h-10 rounded-lg object-cover bg-slate-200 flex-shrink-0" alt="" />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-900 truncate">{film.title}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{film.director} • {film.duration}</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => toggleAssignment(film.id)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                                isAssigned 
                                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600 group' 
                                                : 'bg-slate-900 text-white shadow-md active:scale-95'
                                            }`}
                                        >
                                            {isAssigned ? (
                                                <>
                                                    <span className="group-hover:hidden flex items-center gap-1"><CheckCircle size={14}/> Added</span>
                                                    <span className="hidden group-hover:flex items-center gap-1"><XCircle size={14}/> Remove</span>
                                                </>
                                            ) : (
                                                <>Add <ArrowRight size={14}/></>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MASTER DATABASE TAB --- */}
        {activeTab === 'FILMS' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Master Library ({films.length})</h3>
                    <button className="bg-brand-600 text-white p-2 rounded-lg shadow-sm">
                        <Plus size={20} />
                    </button>
                </div>
                {/* Simplified List for Demo */}
                <div className="p-4 text-center text-sm text-slate-400">
                    Use Supabase Dashboard to add new films to Master Table.
                    <br/>
                    (Feature coming soon to Admin UI)
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;
