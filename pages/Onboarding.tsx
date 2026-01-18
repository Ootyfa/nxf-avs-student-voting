
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, User, ChevronRight, Check, School, Mail, Loader2, Play, Plus, MapPin, ArrowLeft } from 'lucide-react';
import { getUniversities, registerNewUser, addNewUniversity, syncUserProfile, fetchUserVoteHistory } from '../services/auth';
import { University } from '../types';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User Data State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Add New Uni State
  const [isAddingUni, setIsAddingUni] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniLocation, setNewUniLocation] = useState('');
  const [isCreatingUni, setIsCreatingUni] = useState(false);

  // Load Universities on Mount
  useEffect(() => {
    const loadUnis = async () => {
      const data = await getUniversities();
      setUniversities(data);
    };
    loadUnis();
  }, []);

  const completeOnboarding = async () => {
    setIsSubmitting(true);
    
    // 1. Save to Local Storage (Immediate Offline Access)
    localStorage.setItem('hasOnboarded', 'true');
    localStorage.setItem('userName', name.trim());
    localStorage.setItem('userEmail', email.trim());
    
    if (selectedUni) {
      localStorage.setItem('userUniversityId', selectedUni.id);
      localStorage.setItem('userUniversityName', selectedUni.name);
      localStorage.setItem('isStudent', 'true'); 
    } else {
      localStorage.setItem('isStudent', 'false');
    }
    
    // 2. Save to Supabase (Cloud Persistence)
    // This upserts the user, ensuring they exist in the DB
    await registerNewUser(email.trim(), name.trim(), selectedUni?.id);

    // 3. CRITICAL: Sync previous data (Votes & Points) from Supabase
    // This handles the "Clear Cookies -> Re-enter Email" scenario
    console.log("Restoring session for returning user...");
    await syncUserProfile(email.trim()); // Restores points & university if they differ
    
    const previousVotes = await fetchUserVoteHistory(email.trim());
    if (previousVotes.length > 0) {
        // Update local storage so the UI knows which films are already voted
        // We merge with existing just in case, though usually it's empty after clear
        const existing = JSON.parse(localStorage.getItem('votedFilms') || '[]');
        const merged = Array.from(new Set([...existing, ...previousVotes]));
        localStorage.setItem('votedFilms', JSON.stringify(merged));
    }
    
    setIsSubmitting(false);
    navigate('/');
  };

  const handleCreateUniversity = async () => {
    if (!newUniName.trim() || !newUniLocation.trim()) return;
    
    setIsCreatingUni(true);
    const newUni = await addNewUniversity(newUniName, newUniLocation);
    
    if (newUni) {
        // Success: Select it and close add mode
        setSelectedUni(newUni);
        setUniversities(prev => [...prev, newUni]); // Optimistic update
        setIsAddingUni(false);
        setSearchQuery(''); 
    }
    setIsCreatingUni(false);
  };

  // Filter Universities
  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validation
  const isStep1Valid = name.trim().length > 0 && email.includes('@') && selectedUni !== null;

  // Render content based on current step
  const renderContent = () => {
    switch(step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-fade-in w-full max-w-xs mx-auto">
            {/* Custom Logo: Red Film Strip with Checkmark on Yellow Background */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
               {/* Background Blobs */}
               <div className="absolute inset-0 bg-accent-400 rounded-[2.5rem] rotate-6 opacity-20 animate-pulse"></div>
               <div className="absolute inset-0 bg-red-400 rounded-[2.5rem] -rotate-6 opacity-20 animate-pulse delay-75"></div>
               
               {/* Main Logo Container (Yellow Rounded Square) */}
               <div className="relative z-10 bg-[#FFD100] w-28 h-28 rounded-[2rem] shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                  
                  {/* Red Film Strip Block */}
                  <div className="w-20 h-16 bg-[#E31E24] rounded-lg relative flex items-center justify-center shadow-inner">
                      
                      {/* Film Perforations (Top) */}
                      <div className="absolute -top-1 left-0 right-0 flex justify-center gap-1.5">
                          {[1,2,3,4,5,6].map(i => <div key={`t-${i}`} className="w-1.5 h-2 bg-[#FFD100] rounded-b-sm"></div>)}
                      </div>
                      
                      {/* Film Perforations (Bottom) */}
                      <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1.5">
                          {[1,2,3,4,5,6].map(i => <div key={`b-${i}`} className="w-1.5 h-2 bg-[#FFD100] rounded-t-sm"></div>)}
                      </div>

                      {/* White Checkmark */}
                      <Check className="text-white drop-shadow-md" size={40} strokeWidth={4} />
                      
                      {/* Vertical Strip Line (Decorative) */}
                      <div className="absolute left-3 top-2 bottom-2 w-1 border-r-2 border-dashed border-white/30"></div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                NXF AVS <br/>
                <span className="text-brand-600 text-xl tracking-normal">Advance Voting System</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                The official platform for the <strong className="text-slate-800">ATOM Film Festival</strong>. Represent your college, rate documentaries, and earn rewards.
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col w-full animate-fade-in px-1 h-full">
             <div className="text-center mb-6 flex-shrink-0">
               <div className="w-16 h-16 bg-gradient-to-br from-brand-50 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-brand-100 shadow-sm">
                 <User size={28} className="text-brand-600" />
               </div>
               <h1 className="text-xl font-black text-slate-900 mb-1">Student Profile</h1>
               <p className="text-slate-400 text-xs">One-time setup. Saves to cloud.</p>
             </div>

             <div className="space-y-4 w-full relative flex-grow overflow-y-auto no-scrollbar pb-2">
               
               {/* Name Input */}
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name <span className="text-red-500">*</span></label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="e.g. Rahul Sharma"
                   className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                 />
               </div>

               {/* Email Input */}
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address <span className="text-red-500">*</span></label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="w-full pl-10 pr-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    />
                 </div>
               </div>

               {/* University Section - Either Search or Create */}
               {!isAddingUni ? (
                   <div className="space-y-1.5 relative z-20">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">College / University <span className="text-red-500">*</span></label>
                     
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <School size={16} />
                        </div>
                        <input 
                            type="text"
                            value={selectedUni ? selectedUni.name : searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedUni(null);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search your college..."
                            className={`w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-xl font-medium text-slate-900 outline-none transition-all text-sm ${selectedUni ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 focus:border-brand-500'}`}
                        />
                        {selectedUni && (
                            <button 
                                onClick={() => { setSelectedUni(null); setSearchQuery(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                            >
                                <span className="text-[10px] font-bold uppercase">Change</span>
                            </button>
                        )}
                     </div>

                     {/* Dropdown List */}
                     {showDropdown && !selectedUni && (
                         <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                             {filteredUnis.length > 0 ? (
                                 <>
                                    {filteredUnis.map(uni => (
                                        <button
                                            key={uni.id}
                                            onClick={() => {
                                                setSelectedUni(uni);
                                                setShowDropdown(false);
                                                setSearchQuery('');
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                                        >
                                            <span className="text-lg">{uni.logo}</span>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{uni.name}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{uni.location || 'India'}</div>
                                            </div>
                                        </button>
                                    ))}
                                    {/* Action at bottom of list */}
                                    <div className="p-2 border-t border-slate-50 sticky bottom-0 bg-white">
                                        <button 
                                            onClick={() => {
                                                setIsAddingUni(true);
                                                setShowDropdown(false);
                                                setNewUniName(searchQuery); // Pre-fill with what they typed
                                            }}
                                            className="w-full py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-brand-600 hover:bg-brand-50 flex items-center justify-center gap-1"
                                        >
                                            <Plus size={14} /> Add "{searchQuery || 'New'}"
                                        </button>
                                    </div>
                                 </>
                             ) : (
                                 <div className="p-4 text-center">
                                     <p className="text-slate-400 text-xs mb-3">No college found matching "{searchQuery}"</p>
                                     <button 
                                        onClick={() => {
                                            setIsAddingUni(true);
                                            setShowDropdown(false);
                                            setNewUniName(searchQuery);
                                        }}
                                        className="bg-brand-50 text-brand-600 px-4 py-2 rounded-lg text-xs font-bold w-full"
                                     >
                                         + Add New College
                                     </button>
                                 </div>
                             )}
                         </div>
                     )}
                   </div>
               ) : (
                   <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-fade-in relative z-20">
                       <div className="flex justify-between items-center mb-3">
                           <h3 className="font-bold text-slate-900 text-sm">Add New Campus</h3>
                           <button onClick={() => setIsAddingUni(false)} className="text-slate-400 hover:text-slate-600">
                               <ArrowLeft size={16} />
                           </button>
                       </div>
                       
                       <div className="space-y-3">
                           <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase">College Name</label>
                               <input 
                                   type="text" 
                                   value={newUniName}
                                   onChange={(e) => setNewUniName(e.target.value)}
                                   placeholder="e.g. St. Xavier's College"
                                   className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-brand-500 mt-1"
                               />
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase">City / Location</label>
                               <div className="relative">
                                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        value={newUniLocation}
                                        onChange={(e) => setNewUniLocation(e.target.value)}
                                        placeholder="e.g. Mumbai"
                                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-brand-500 mt-1"
                                    />
                               </div>
                           </div>
                           <button 
                               onClick={handleCreateUniversity}
                               disabled={!newUniName || !newUniLocation || isCreatingUni}
                               className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-2"
                           >
                               {isCreatingUni ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                               Save & Select
                           </button>
                       </div>
                   </div>
               )}
               
               {selectedUni && !isAddingUni && (
                   <div className="bg-green-50 text-green-700 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                       <Check size={14} />
                       You are representing {selectedUni.name}
                   </div>
               )}

             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    // Uses 100dvh (Dynamic Viewport Height) to ensure it fits perfectly on mobile browsers
    <div className="h-[100dvh] bg-white flex flex-col p-6 pb-safe max-w-md mx-auto relative overflow-hidden">
      
      {/* Decorative background blur (Updated to Red/Yellow) */}
      <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[50%] bg-brand-50/80 blur-3xl rounded-full -z-10 pointer-events-none"></div>

      {/* Header */}
      <div className="w-full flex justify-between items-center h-12 flex-shrink-0">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
             <ChevronRight className="rotate-180" size={24} />
          </button>
        ) : <div />}
      </div>

      {/* Main Content - Flex Grow to push Footer down */}
      <div className="flex-grow flex items-center justify-center w-full z-10">
        {renderContent()}
      </div>

      {/* Footer / Controls - Flex Shrink to stay visible */}
      <div className="w-full space-y-4 mt-auto pt-4 flex-shrink-0 z-20 bg-white/80 backdrop-blur-sm">
        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mb-2">
          {[0, 1].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={() => {
            if (step === 0) {
              setStep(1);
            } else if (isStep1Valid) {
              completeOnboarding();
            }
          }}
          disabled={(step === 1 && !isStep1Valid) || isSubmitting}
          className={`w-full py-3.5 rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center group ${
            (step === 1 && !isStep1Valid) || isSubmitting
            ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
            : 'bg-brand-600 text-white shadow-brand-200 hover:bg-brand-700 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
             <Loader2 size={20} className="animate-spin" />
          ) : step === 1 ? (
            <>
               Start Voting
               <Check size={18} className="ml-2" />
            </>
          ) : (
            <>
               Get Started
               <ChevronRight size={18} className="ml-2 opacity-80 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Branding */}
        <div className="text-center pt-2 pb-1">
             <p className="text-[10px] font-semibold text-slate-400">
               Powered by <span className="text-brand-600">NilgirisNext Foundation for Art & Culture</span>
             </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
