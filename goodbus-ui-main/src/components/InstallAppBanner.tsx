import React, { useState, useEffect } from 'react';

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode (Android or iOS)
    const checkStandalone =
      (typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && (window.navigator as any).standalone === true);

    setIsStandalone(Boolean(checkStandalone));

    // Detect iOS
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const isIosDevice = /iPhone|iPad|iPod/i.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Check if user previously dismissed today
    const dismissedAt = sessionStorage.getItem('goodbus_pwa_dismissed');
    if (dismissedAt) {
      setIsDismissed(true);
    }

    // Android PWA install listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android / Chrome native install trigger
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsDismissed(true);
      }
    } else if (isIos) {
      // iOS Guide
      setShowIosGuide(true);
    } else {
      // General prompt
      alert('To install GoodBus: Tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('goodbus_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Sleek Native Mobile Install Chip (Visible on mobile) */}
      <aside
        aria-label="Install App"
        className="sm:hidden fixed top-16 left-3 right-3 z-30 bg-gradient-to-r from-[#0c2340] to-[#153660] text-white p-2.5 px-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/icon-192.png"
            alt="GoodBus App"
            className="w-8 h-8 rounded-lg shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">GoodBus Mobile App</div>
            <div className="text-[10px] text-gray-300 truncate">
              Install for instant offline tickets & UPI
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1 bg-[#d84e55] hover:bg-[#c13a40] text-white text-[11px] font-bold rounded-full shadow-xs cursor-pointer transition-colors active:scale-95"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full text-gray-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </aside>

      {/* iOS Installation Instruction Bottom Sheet */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div
            className="w-full bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 border border-gray-100 animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="GoodBus" className="w-8 h-8 rounded-lg shadow-xs" />
                <h3 className="text-base font-bold text-gray-900">Install on iPhone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Install GoodBus to your home screen for a full-screen, native app experience with zero browser bars:
            </p>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  1
                </div>
                <div>
                  Tap the <span className="font-bold text-blue-600">Share [ ⎋ ]</span> button in Safari at the bottom of your screen.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  2
                </div>
                <div>
                  Scroll down and tap <span className="font-bold text-gray-900">"Add to Home Screen"</span>.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  3
                </div>
                <div>
                  Tap <span className="font-bold text-[#d84e55]">"Add"</span> in the top right corner.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 bg-[#0c2340] text-white text-xs font-bold rounded-full shadow-md cursor-pointer transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
