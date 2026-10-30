import React from 'react';

interface MobileBottomNavProps {
  currentScreen: string;
  onNavigateHome: () => void;
  onOpenPnr: () => void;
  onOpenOffers: () => void;
  onOpenSupport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigateHome,
  onOpenPnr,
  onOpenOffers,
  onOpenSupport,
}) => {
  // Hide bottom nav during checkout / payment to keep users focused on payment
  if (currentScreen === 'payment' || currentScreen === 'points') {
    return null;
  }

  const isHomeActive = currentScreen === 'home' || currentScreen === 'results';

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-4 items-center">
        {/* Home / Book Bus */}
        <button
          type="button"
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            isHomeActive
              ? 'text-[#d84e55] font-bold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[24px] ${
              isHomeActive ? 'fill-1' : ''
            }`}
          >
            directions_bus
          </span>
          <span className="text-[10px] tracking-tight mt-0.5">Book</span>
        </button>

        {/* PNR Status */}
        <button
          type="button"
          onClick={onOpenPnr}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-500 hover:text-gray-900 font-medium transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
          <span className="text-[10px] tracking-tight mt-0.5">My Ticket</span>
        </button>

        {/* Offers */}
        <button
          type="button"
          onClick={onOpenOffers}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-500 hover:text-gray-900 font-medium transition-all cursor-pointer relative"
        >
          <span className="material-symbols-outlined text-[24px]">local_offer</span>
          <span className="text-[10px] tracking-tight mt-0.5">Offers</span>
          <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-[#d84e55]" />
        </button>

        {/* 24x7 Support */}
        <button
          type="button"
          onClick={onOpenSupport}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-500 hover:text-gray-900 font-medium transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">support_agent</span>
          <span className="text-[10px] tracking-tight mt-0.5">Help</span>
        </button>
      </div>
    </nav>
  );
};
