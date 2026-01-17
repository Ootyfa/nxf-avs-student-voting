
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Sparkles, User, ChevronRight, Check, School, Mail, Loader2 } from 'lucide-react';
import { getUniversities, registerNewUser } from '../services/auth';
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
    // This ensures if they clear cache or switch devices, their email retrieves their profile later
    await registerNewUser(email.trim(), name.trim(), selectedUni?.id);
    
    setIsSubmitting(false);
    navigate('/');
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
            {/* Visual with Animation */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
               <div className="absolute inset-0 bg-brand-500 rounded-[2rem] rotate-6 opacity-10 animate-pulse"></div>
               <div className="absolute inset-0 bg-brand-600 rounded-[2rem] -rotate-6 opacity-10 animate-pulse delay-75"></div>
               <div className="relative z-10 bg-white p-5 rounded-3xl shadow-soft border border-brand-50">
                  <Clapperboard size={40} className="text-brand-600 mb-2" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-lg animate-bounce">
                      <Sparkles size={14} className="text-white" />
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                NXF AVS <br/>
                <span className="text-brand-600 text-lg">Advance Voting System</span>
              </h1>
              <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">
                The official platform for the Film Festival. Represent your college, rate documentaries, and earn rewards.
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col w-full animate-fade-in px-1 h-full">
             <div className="text-center mb-6 flex-shrink-0">
               <div className="w-16 h-16 bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-brand-100 shadow-sm">
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

               {/* Email Input - Added for Supabase Storage */}
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

               {/* University Searchable Dropdown */}
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
                             filteredUnis.map(uni => (
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
                             ))
                         ) : (
                             <div className="p-4 text-center text-slate-400 text-xs">
                                 No college found. <br/>
                                 Select "Other" if not listed.
                             </div>
                         )}
                     </div>
                 )}
               </div>
               
               {selectedUni && (
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
      
      {/* Decorative background blur */}
      <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[50%] bg-brand-50/50 blur-3xl rounded-full -z-10 pointer-events-none"></div>

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
            : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800 active:scale-[0.98]'
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
               Next
               <ChevronRight size={18} className="ml-2 opacity-60 group-hover:translate-x-1 transition-transform" />
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
