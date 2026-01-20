
import React from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const LOGO_URL = "https://i.imgur.com/KJX2gkw.jpeg"; 

  return (
    <div className="bg-black sticky top-0 z-50 border-b border-white/10 backdrop-blur-md transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 md:gap-4">
          <div 
            onClick={onLogoClick}
            className="group w-12 h-12 md:w-14 md:h-14 shrink-0 bg-white rounded-xl p-1 border border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 relative"
            title="Klik untuk Log Masuk Admin"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src={LOGO_URL} 
              alt="Logo SK Sri Aman" 
              className="w-full h-full object-contain relative z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2997/2997322.png';
              }}
            />
          </div>
          <div className="flex flex-col justify-center select-none">
            <h1 className="text-lg md:text-xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              e-KOKURIKULUM
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {/* White Line with Glow */}
              <span className="w-8 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"></span>
              {/* White Text with Glow */}
              <p className="text-[10px] md:text-xs font-bold text-white tracking-[0.2em] uppercase drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]">
                SK SRI AMAN
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
