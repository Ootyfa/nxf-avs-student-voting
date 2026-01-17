import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Sparkles, User, ChevronRight, Check, AlertCircle, School, Search } from 'lucide-react';
import { getUniversities } from '../services/auth';
import { University } from '../types';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  
  // User Data State
  const [name, setName] = useState('');
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

  const completeOnboarding = () => {
    // Explicitly Save User Data
    localStorage.setItem('hasOnboarded', 'true');
    localStorage.setItem('userName', name.trim());
    
    if (selectedUni) {
      localStorage.setItem('userUniversityId', selectedUni.id);
      localStorage.setItem('userUniversityName', selectedUni.name);
      // In India, we trust the selection as verification isn't possible via email domain
      localStorage.setItem('isStudent', 'true'); 
    } else {
      localStorage.setItem('isStudent', 'false');
    }
    
    // Navigate immediately to home
    navigate('/');
  };

  // Filter Universities
  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validation
  const isStep1Valid = name.trim().length > 0 && selectedUni !== null;

  // Render content based on current step
  const renderContent = () => {
    switch(step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-8 mt-10 animate-fade-in px-4">
            {/* Visual */}
            <div className="relative w-40 h-40 flex items-center justify-center">
               <div className="absolute inset-0 bg-brand-500 rounded-[2rem] rotate-6 opacity-10"></div>
               <div className="absolute inset-0 bg-brand-600 rounded-[2rem] -rotate-6 opacity-10"></div>
               <div className="relative z-10 bg-white p-6 rounded-3xl shadow-soft border border-brand-50">
                  <Clapperboard size={48} className="text-brand-600 mb-2" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-lg">
                      <Sparkles size={16} className="text-white" />
                  </div>
               </div>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                Welcome to NXF AVS — <br/>
                <span className="text-brand-600">Advanced Voting System</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The official voting platform for the Atom Film Festival. Represent your college and help your favorite film win.
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col w-full mt-4 animate-fade-in px-2">
             <div className="text-center mb-8">
               <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm">
                 <User size={32} className="text-brand-600" />
               </div>
               <h1 className="text-2xl font-black text-slate-900 mb-2">Student Profile</h1>
               <p className="text-slate-400 text-sm">Tell us who you are and where you study.</p>
             </div>

             <div className="space-y-6 w-full relative">
               
               {/* Name Input */}
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Your Name <span className="text-red-500">*</span></label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="e.g. Rahul Sharma"
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                 />
               </div>

               {/* University Searchable Dropdown */}
               <div className="space-y-2 relative">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">College / University <span className="text-red-500">*</span></label>
                 
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <School size={18} />
                    </div>
                    <input 
                        type="text"
                        value={selectedUni ? selectedUni.name : searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedUni(null); // Reset selection on type
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search your college..."
                        className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-xl font-medium text-slate-900 outline-none transition-all ${selectedUni ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 focus:border-brand-500'}`}
                    />
                    {selectedUni && (
                        <button 
                            onClick={() => { setSelectedUni(null); setSearchQuery(''); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                        >
                            <span className="text-xs font-bold">Change</span>
                        </button>
                    )}
                 </div>

                 {/* Dropdown List */}
                 {showDropdown && !selectedUni && (
                     <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto no-scrollbar">
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
                                     <span className="text-xl">{uni.logo}</span>
                                     <div>
                                         <div className="text-sm font-bold text-slate-900">{uni.name}</div>
                                         <div className="text-xs text-slate-500">{uni.location || 'India'}</div>
                                     </div>
                                 </button>
                             ))
                         ) : (
                             <div className="p-4 text-center text-slate-400 text-sm">
                                 No college found. <br/>
                                 <span className="text-xs">Try "Other" or contact support.</span>
                             </div>
                         )}
                     </div>
                 )}
               </div>
               
               {selectedUni && (
                   <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
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
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 pb-safe max-w-md mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center h-12">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
             <ChevronRight className="rotate-180" size={24} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center w-full">
        {renderContent()}
      </div>

      {/* Footer / Controls */}
      <div className="w-full space-y-6 mt-8">
        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {[0, 1].map((i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-brand-600' : 'w-2 bg-slate-200'
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
          disabled={step === 1 && !isStep1Valid}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center group ${
            step === 1 && !isStep1Valid 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {step === 1 ? (
            <>
               Start Voting
               <Check size={20} className="ml-2" />
            </>
          ) : (
            <>
               Next
               <ChevronRight size={20} className="ml-2 opacity-60 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;