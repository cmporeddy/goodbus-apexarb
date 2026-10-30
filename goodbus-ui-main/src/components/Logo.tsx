import React, { useState } from 'react';

interface LogoProps {
  onClick?: () => void;
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ onClick, className = '', showSubtitle = true }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {!imgError ? (
        <img
          src="https://lh3.googleusercontent.com/d/1eD_D79gQo7jT34e3QfC1B2Y4mK7s9vN0"
          alt="goodbus.in Logo"
          className="h-8 w-auto object-contain shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-[#d84e55] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[20px] text-white">directions_bus</span>
        </div>
      )}

      <div className="flex flex-col">
        <span className="font-bold text-[18px] leading-tight tracking-tight text-gray-900">
          good<span className="text-[#d84e55]">bus</span><span className="text-gray-400 font-normal text-sm">.in</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] text-gray-400 font-light hidden sm:block leading-none tracking-wider">
            Fast &amp; Frictionless Bus Booking
          </span>
        )}
      </div>
    </div>
  );
};
