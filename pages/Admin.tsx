import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash, Film as FilmIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Film } from '../types';

const AdminPage: React.FC = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
        const { data, error } = await supabase.from('master_films').select('*').order('created_at', { ascending: false });
        if (data) {
            setFilms(data as Film[]);
        }
    } catch (e) {
        console.error("Failed to fetch films for admin", e);
    }
  };

  const filteredFilms = films.filter(f => 
    f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          <p className="text-xs text-gray-500">Manage Database</p>
        </div>
      </div>

      <div className="p-4">
        {/* Simple Mobile Admin View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex gap-2">
                 <div className="relative flex-grow">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="text" 
                     placeholder="Search films..." 
                     className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm outline-none"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </div>
                 <button className="bg-slate-900 text-white p-2 rounded-lg">
                   <Plus size={20} />
                 </button>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredFilms.length > 0 ? filteredFilms.map(film => (
                <div key={film.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-14 bg-gray-200 rounded overflow-hidden">
                       <img src={film.image_url || 'https://placehold.co/100x150'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{film.title}</p>
                      <p className="text-xs text-gray-500">{film.category || film.genre}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 text-gray-400">
                    <Edit size={16} className="cursor-pointer hover:text-blue-500" />
                    <Trash size={16} className="cursor-pointer hover:text-red-500" />
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-sm text-gray-400">
                    No films found in Supabase.
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;