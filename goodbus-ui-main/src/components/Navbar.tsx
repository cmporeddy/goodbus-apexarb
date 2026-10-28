import React, { useState } from 'react';
import { Logo } from './Logo';

interface NavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onOpenPnr: () => void;
  onOpenOffers: () => void;
  onOpenSupport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  onOpenPnr,
  onOpenOffers,
  onOpenSupport
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isBookingFlow = ['home', 'results', 'points', 'passengers', 'payment', 'confirmation'].includes(
    currentScreen
  );

  // Calculate progress width for the glowing accent line
  const progressWidth =
    currentScreen === 'home'
      ? 'w-1/4'
      : currentScreen === 'results'
      ? 'w-2/4'
      : currentScreen === 'points' || currentScreen === 'passengers'
      ? 'w-3/4'
      : 'w-full';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <Logo onClick={() => onNavigate('home')} />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`h-16 flex items-center text-sm font-medium transition-colors cursor-pointer ${
                isBookingFlow
                  ? 'text-[#d84e55] border-b-2 border-[#d84e55] font-semibold'
                  : 'text-gray-600 hover:text-[#d84e55]'
              }`}
            >
              Book Bus
            </button>

            <button
              type="button"
              onClick={onOpenPnr}
              className="h-16 flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#d84e55] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-gray-400">receipt_long</span>
              Check PNR / Status
            </button>

            <button
              type="button"
              onClick={onOpenSupport}
              className="h-16 flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#d84e55] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-gray-400">support_agent</span>
              Help &amp; Support
            </button>

            <button
              type="button"
              onClick={onOpenOffers}
              className="h-16 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#d84e55] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#d84e55]">local_offer</span>
              Offers
              <span className="bg-[#fef2f2] text-[#d84e55] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                Up to 15%
              </span>
            </button>

            {/* Admin button: Only displayed when explicitly on /admin */}
            {currentScreen === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="h-16 flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer text-[#d84e55] border-b-2 border-[#d84e55]"
              >
                <span className="material-symbols-outlined text-[18px] text-[#d84e55]">admin_panel_settings</span>
                Admin
              </button>
            )}
          </nav>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={onOpenOffers}
              className="px-2.5 py-1 text-[#d84e55] bg-[#fef2f2] border border-red-100 hover:bg-red-50 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">local_offer</span>
              <span>Offers</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Top subtle red accent line matching redBus */}
      <div className="w-full h-[2px] bg-gray-100 overflow-hidden">
        <div
          className={`h-full bg-[#d84e55] transition-all duration-500 ease-out shadow-[0_0_8px_rgba(216,78,85,0.5)] ${progressWidth}`}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-gray-100 bg-white px-4 py-3 shadow-lg space-y-2">
          <button
            type="button"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-red-50 hover:text-[#d84e55] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-[#d84e55]">directions_bus</span>
            Book Bus
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenPnr();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-gray-500">receipt_long</span>
            Check PNR / Status
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenSupport();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-gray-500">support_agent</span>
            Help &amp; Customer Support
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenOffers();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#d84e55]">local_offer</span>
              Discount Offers
            </span>
            <span className="bg-[#fef2f2] text-[#d84e55] border border-red-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Up to 15%
            </span>
          </button>
          {/* Mobile Admin Link: Only displayed when explicitly on /admin */}
          {currentScreen === 'admin' && (
            <button
              type="button"
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-[#d84e55] bg-red-50/50 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 pt-2.5"
            >
              <span className="material-symbols-outlined text-[18px] text-[#d84e55]">admin_panel_settings</span>
              Admin &amp; Gateway Settings
            </button>
          )}
        </div>
      )}
    </header>
  );
};
