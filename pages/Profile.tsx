
import React, { useState, useEffect } from 'react';
import { CheckCircle, Shield, X, Smartphone, Bookmark, Share2, GraduationCap, School, Search, Pencil, Crown, Circle, Film as FilmIcon } from 'lucide-react';
import { MOCK_USERS } from '../services/mockData';
import { supabase } from '../services/supabase';
import { Film, University, AchievementTitle } from '../types';
import { getUniversities } from '../services/auth';
import { getTitleFromPoints, getNextMilestone } from '../utils/gamification';
import { getGenreGradient } from '../components/FilmCard';

const ProfilePage: React.FC = () => {
  // Read real data from Local Storage
  const [name, setName] = useState(localStorage.getItem('userName') || MOCK_USERS[0].name);
  const [points, setPoints] = useState(Number(localStorage.getItem('userPoints') || MOCK_USERS[0].points));
  const [isStudent, setIsStudent] = useState(localStorage.getItem('isStudent') === 'true');
  const [userUniName, setUserUniName] = useState(localStorage.getItem('userUniversityName') || '');
  
  // Dynamic Title State
  const [currentTitle, setCurrentTitle] = useState<AchievementTitle>(AchievementTitle.Participant);
  const [milestone, setMilestone] = useState<any>(null);

  // University Selection State
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Redeem Modal State (Kept for compatibility but trigger removed)
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState(0);
  const [formData, setFormData] = useState({ gender: '', phone: '', background: '' });
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Watchlist State
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [watchlistFilms, setWatchlistFilms] = useState<Film[]>([]);
  // Track broken images
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Refresh data
  useEffect(() => {
    const p = Number(localStorage.getItem('userPoints') || '0');
    setPoints(p);
    
    // Calculate Title
    const title = getTitleFromPoints(p);
    setCurrentTitle(title);
    setMilestone(getNextMilestone(p));

    const w = JSON.parse(localStorage.getItem('userWatchlist') || '[]');
    setWatchlistIds(w);

    const s = localStorage.getItem('isStudent') === 'true';
    setIsStudent(s);
    
    const uni = localStorage.getItem('userUniversityName');
    if (uni) setUserUniName(uni);

    if (w.length > 0) {
        fetchWatchlistFilms(w);
    }
    
    // Load unis for the modal
    getUniversities().then(setUniversities);
  }, []);

  const fetchWatchlistFilms = async (ids: string[]) => {
      try {
          const { data } = await supabase
            .from('master_films')
            .select('*')
            .in('id', ids);
          
          if (data) {
              setWatchlistFilms(data as Film[]);
              setBrokenImages({});
          }
      } catch (e) {
          console.error("Error fetching watchlist", e);
      }
  };

  const handleCampusSelect = (uni: University) => {
      localStorage.setItem('userUniversityId', uni.id);
      localStorage.setItem('userUniversityName', uni.name);
      localStorage.setItem('isStudent', 'true');
      
      setUserUniName(uni.name);
      setIsStudent(true);
      setShowCampusModal(false);
      
      // Reset search
      setSearchQuery('');
  };

  const handleRedeemSubmit = () => {
    console.log("Saving Private Data to Supabase:", formData);
    setRedeemStep(1); 
  };

  // Generate dynamic avatar
  const avatarUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // Filter Universities for Modal
  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const milestones = [
      { title: AchievementTitle.Participant, range: '0–50 pts', min: 0 },
      { title: AchievementTitle.ActiveVoter, range: '51–150 pts', min: 51 },
      { title: AchievementTitle.FilmReviewer, range: '151–300 pts', min: 151 },
      { title: AchievementTitle.FestivalCritic, range: '301+ pts', min: 301 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* Header Profile Section */}
      <div className="bg-white pb-8 pt-12 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-brand-50"></div>
        
        <div className="relative flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full p-1 bg-white shadow-xl mb-4 relative">
             <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover bg-slate-100" />
             {isStudent && (
                 <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white" title="Verified Student">
                     <GraduationCap size={16} />
                 </div>
             )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">{name}</h1>
          
          {/* Dynamic Title Badge */}
          <div className="flex gap-2 justify-center mt-1 mb-4">
             <div className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                {currentTitle === AchievementTitle.FestivalCritic && <Crown size={12} fill="currentColor" className="text-amber-500" />}
                {currentTitle}
             </div>
             {isStudent && (
                 <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle size={10} /> Student
                 </div>
             )}
          </div>

          {/* Progress to Next Tier */}
          {milestone && !milestone.isMax && (
              <div className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-xl p-3 mb-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                      <span>{points} pts</span>
                      <span>Target: {milestone.target}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${milestone.progressPercent}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      {milestone.pointsNeeded} points until <span className="text-brand-600 font-bold">{milestone.nextTitle}</span>
                  </p>
              </div>
          )}
          {milestone && milestone.isMax && (
               <div className="w-full max-w-xs bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-2">
                   <p className="text-xs font-bold text-yellow-700 flex items-center justify-center gap-1">
                       <Crown size={14} fill="currentColor" /> Jury Candidate
                   </p>
               </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center relative group">
             <div className="text-3xl font-black text-brand-600 mb-1">{points}</div>
             <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Points</div>
             <button className="absolute top-2 right-2 text-slate-300 hover:text-brand-500">
                <Share2 size={14} />
             </button>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
             <div className="text-3xl font-black text-amber-500 mb-1">#42</div>
             <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Global Rank</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* Campus / University Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
             <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                     <School size={18} className="text-blue-600" />
                     My Campus
                 </div>
                 <button 
                    onClick={() => setShowCampusModal(true)}
                    className="text-blue-600 hover:text-blue-800"
                 >
                     <Pencil size={16} />
                 </button>
             </div>
             
             {isStudent ? (
                 <div className="flex items-center gap-3 mt-1">
                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                         🎓
                     </div>
                     <div>
                         <p className="font-bold text-slate-900 leading-tight">{userUniName}</p>
                         <p className="text-xs text-blue-600/80">Points go to this campus</p>
                     </div>
                 </div>
             ) : (
                 <div className="text-center py-2">
                     <p className="text-sm text-blue-800 mb-3">Select your college to represent them on the leaderboard.</p>
                     <button 
                        onClick={() => setShowCampusModal(true)}
                        className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl w-full"
                     >
                        Select Campus
                     </button>
                 </div>
             )}
        </div>
        
        {/* Watchlist Section */}
        <div>
           <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
               <Bookmark size={20} className="text-brand-500" />
               My Watchlist
           </h3>
           {watchlistFilms.length > 0 ? (
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                   {watchlistFilms.map(film => {
                       const hasUrl = !!(film.poster_url?.trim() || film.image_url?.trim());
                       const displayImage = film.poster_url || film.image_url;
                       const showImage = hasUrl && !brokenImages[film.id];
                       const genre = film.category || film.genre || 'Film';
                       
                       return (
                           <div key={film.id} className="min-w-[100px] w-[100px]">
                               <div className={`w-full h-32 rounded-xl shadow-sm mb-2 overflow-hidden ${!showImage ? getGenreGradient(genre) : 'bg-slate-100'}`}>
                                   {showImage ? (
                                       <img 
                                            src={displayImage} 
                                            className="w-full h-full object-cover" 
                                            alt={film.title}
                                            onError={() => setBrokenImages(prev => ({...prev, [film.id]: true}))}
                                       />
                                   ) : (
                                       // Simplified Typography - Title Only
                                       <div className="w-full h-full flex flex-col justify-center items-center text-center p-2 relative">
                                            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-lg"></div>
                                           <p className="text-xs text-white font-black leading-tight line-clamp-4 drop-shadow-md">
                                               {film.title}
                                           </p>
                                       </div>
                                   )}
                               </div>
                               <p className="text-xs font-bold text-slate-900 truncate">{film.title}</p>
                           </div>
                       );
                   })}
               </div>
           ) : (
               <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                   <p className="text-slate-400 text-sm font-medium">Your watchlist is empty.</p>
               </div>
           )}
        </div>

        {/* Road to the Jury Section (Replaces Rewards) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Crown size={20} fill="currentColor" />
                </div>
                <div>
                <h3 className="font-bold text-slate-900 text-lg leading-none">Road to the Jury</h3>
                <p className="text-xs text-slate-500 mt-1">Unlock roles & earn your place.</p>
                </div>
            </div>

            <div className="space-y-6 relative ml-2">
                {/* Connector Line */}
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                
                {/* Milestones */}
                {milestones.map((level, idx) => {
                    // Simple logic: Highlight if user has reached this point bucket
                    const isReached = points >= level.min;
                    
                    return (
                        <div key={level.title} className="relative flex items-center gap-4 z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                isReached 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-110' 
                                : 'bg-white border-slate-200 text-slate-300'
                            }`}>
                                {isReached ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                            </div>
                            <div className={`${isReached ? 'opacity-100' : 'opacity-50'}`}>
                                <h4 className={`text-sm font-bold ${isReached ? 'text-slate-900' : 'text-slate-400'}`}>{level.title}</h4>
                                <p className="text-xs font-medium text-slate-400">{level.range}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Jury Invitation Text */}
            <div className="mt-8 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100 text-center">
                <p className="text-yellow-800 text-xs font-bold leading-relaxed">
                    🏆 The highest point earner will receive an official invitation to join the <span className="underline decoration-yellow-300 decoration-2 underline-offset-2">Film Jury committee of NXF</span>.
                </p>
            </div>
        </div>

        {/* Branding Footer with Hyperlink */}
        <div className="mt-8 pt-4 pb-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-semibold mb-3">
              Powered by <a href="http://nxfindia.org" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline hover:text-brand-700">NilgirisNext Foundation for Art & Culture</a>
            </p>
            <button 
                onClick={() => setShowPrivacy(true)}
                className="text-[10px] font-bold text-slate-300 hover:text-slate-500 transition-colors"
            >
                Privacy Policy & Legal
            </button>
        </div>

      </div>

      {/* --- CAMPUS SELECTION MODAL --- */}
      {showCampusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 h-[80vh] flex flex-col animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="font-black text-xl text-slate-900">Select Campus</h2>
                      <button onClick={() => setShowCampusModal(false)}><X className="text-slate-400" /></button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                          type="text"
                          placeholder="Search college..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                          autoFocus
                      />
                  </div>

                  <div className="flex-grow overflow-y-auto no-scrollbar space-y-2">
                      {filteredUnis.length > 0 ? (
                          filteredUnis.map(uni => (
                              <button
                                 key={uni.id}
                                 onClick={() => handleCampusSelect(uni)}
                                 className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 rounded-xl transition-colors"
                              >
                                  <span className="text-xl">{uni.logo}</span>
                                  <div>
                                      <div className="text-sm font-bold text-slate-900">{uni.name}</div>
                                      <div className="text-xs text-slate-500">{uni.location || 'India'}</div>
                                  </div>
                                  {userUniName === uni.name && <CheckCircle size={16} className="ml-auto text-green-500" />}
                              </button>
                          ))
                      ) : (
                          <div className="text-center py-8 text-slate-400 text-sm">No campus found.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- REDEEM MODAL --- */}
      {showRedeem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-black text-xl text-slate-900">Redeem Rewards</h2>
                    <button onClick={() => setShowRedeem(false)}><X className="text-slate-400" /></button>
                </div>
                
                {redeemStep === 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 mb-4">To ship your rewards, we need a few more details. This info is private.</p>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                            <div className="flex items-center gap-2 border-b border-slate-200 py-2">
                                <Smartphone size={16} className="text-slate-400"/>
                                <input 
                                    type="tel" 
                                    className="w-full outline-none text-sm font-medium" 
                                    placeholder="+1 234 567 890"
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                            <select 
                                className="w-full border-b border-slate-200 py-2 text-sm font-medium outline-none bg-transparent"
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleRedeemSubmit}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold mt-4"
                        >
                            Confirm & Redeem
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">Request Sent!</h3>
                        <p className="text-sm text-slate-500 mt-2">Check your email for tracking info.</p>
                        <button onClick={() => setShowRedeem(false)} className="mt-6 text-brand-600 font-bold text-sm">Close</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- PRIVACY MODAL --- */}
      {showPrivacy && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white p-6">
              <div className="max-w-md h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black">Privacy Policy</h2>
                      <button onClick={() => setShowPrivacy(false)}><X size={24} /></button>
                  </div>
                  <div className="prose prose-sm text-slate-600 space-y-4">
                      <p><strong>Effective Date: October 15, 2024</strong></p>
                      
                      <h3 className="font-bold text-slate-900">1. Introduction</h3>
                      <p>Welcome to NXF AVS (Advance Voting System). We are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information in accordance with applicable laws in India, including the Digital Personal Data Protection Act (DPDP Act), 2023.</p>

                      <h3 className="font-bold text-slate-900">2. Information We Collect</h3>
                      <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Personal Information:</strong> Name, Email Address, and University/College affiliation.</li>
                          <li><strong>Usage Data:</strong> Voting history, film ratings, reviews, and platform interaction logs.</li>
                          <li><strong>Device Information:</strong> Browser type and IP address for security and fraud prevention.</li>
                      </ul>

                      <h3 className="font-bold text-slate-900">3. Purpose of Collection</h3>
                      <p>We use your data to:</p>
                      <ul className="list-disc pl-5 space-y-1">
                          <li>Authenticate your identity to ensure "One Person, One Vote".</li>
                          <li>Calculate film ratings and generate festival leaderboards.</li>
                          <li>Link your participation to your university for campus rankings.</li>
                          <li>Prevent fraudulent voting activity.</li>
                      </ul>

                      <h3 className="font-bold text-slate-900">4. Data Sharing & Disclosure</h3>
                      <p>We do not sell your personal data. Your data is shared only in the following circumstances:</p>
                      <ul className="list-disc pl-5 space-y-1">
                          <li><strong>Festival Organizers:</strong> Aggregated voting data is shared with the ATOM Documentary Festival jury.</li>
                          <li><strong>Legal Requirements:</strong> If required by Indian law or legal process.</li>
                      </ul>

                      <h3 className="font-bold text-slate-900">5. Data Security</h3>
                      <p>We implement robust security measures to protect your data using encryption and secure cloud storage (Supabase). However, no method of transmission over the internet is 100% secure.</p>

                      <h3 className="font-bold text-slate-900">6. Your Rights</h3>
                      <p>Under Indian law, you have the right to:</p>
                      <ul className="list-disc pl-5 space-y-1">
                          <li>Access the personal data we hold about you.</li>
                          <li>Request correction of inaccurate data.</li>
                          <li>Request deletion of your account and associated data (Right to be Forgotten).</li>
                      </ul>

                      <h3 className="font-bold text-slate-900">7. Contact Us</h3>
                      <p>If you have any questions or wish to exercise your rights, please contact the Data Protection Officer at:</p>
                      <p className="font-medium text-slate-900">NilgirisNext Foundation (NXF)<br/>Email: privacy@nxf.org<br/>Address: Ooty, Nilgiris, Tamil Nadu, India.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfilePage;
