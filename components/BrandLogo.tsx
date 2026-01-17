
import React from 'react';
import { Check } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'plain'; // plain removes border/shadow for smaller sizes
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '', variant = 'default' }) => {
  
  // Logic to scale the logo elements based on prop size
  const getDims = () => {
    switch(size) {
      case 'sm': // Header icon
        return { 
          container: 'w-10 h-10 rounded-xl border-2', 
          strip: 'w-6 h-5 rounded-md', 
          checkSize: 14, 
          perfSize: 'w-0.5 h-1',
          gap: 'gap-0.5',
          perfCount: 3
        };
      case 'md': // Card icon
        return { 
          container: 'w-16 h-16 rounded-2xl border-2', 
          strip: 'w-10 h-8 rounded-md', 
          checkSize: 22, 
          perfSize: 'w-1 h-1.5',
          gap: 'gap-1',
          perfCount: 4
        };
      case 'lg': // Modal icon
        return { 
          container: 'w-24 h-24 rounded-[1.5rem] border-4', 
          strip: 'w-14 h-11 rounded-lg', 
          checkSize: 32, 
          perfSize: 'w-1.5 h-2',
          gap: 'gap-1',
          perfCount: 5
        };
      case 'xl': // Onboarding/Splash
      default:
        return { 
          container: 'w-28 h-28 rounded-[2rem] border-4', 
          strip: 'w-20 h-16 rounded-lg', 
          checkSize: 40, 
          perfSize: 'w-1.5 h-2',
          gap: 'gap-1.5',
          perfCount: 6
        };
    }
  };

  const dims = getDims();

  return (
    <div className={`relative bg-[#FFD100] flex items-center justify-center border-white overflow-hidden shadow-sm flex-shrink-0 ${dims.container} ${className}`}>
      
      {/* Red Film Strip Block */}
      <div className={`bg-[#E31E24] relative flex items-center justify-center shadow-inner ${dims.strip}`}>
          
          {/* Perforations Top */}
          <div className={`absolute -top-[1px] left-0 right-0 flex justify-center ${dims.gap}`}>
              {Array.from({ length: dims.perfCount }).map((_, i) => (
                <div key={`t-${i}`} className={`${dims.perfSize} bg-[#FFD100] rounded-b-[1px]`}></div>
              ))}
          </div>
          
          {/* Perforations Bottom */}
          <div className={`absolute -bottom-[1px] left-0 right-0 flex justify-center ${dims.gap}`}>
              {Array.from({ length: dims.perfCount }).map((_, i) => (
                <div key={`b-${i}`} className={`${dims.perfSize} bg-[#FFD100] rounded-t-[1px]`}></div>
              ))}
          </div>

          {/* White Checkmark */}
          <Check className="text-white drop-shadow-sm relative z-10" size={dims.checkSize} strokeWidth={4} />
      </div>
    </div>
  );
};

export default BrandLogo;
