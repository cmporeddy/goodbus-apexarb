import React from 'react';
import { Logo } from './Logo';

interface FooterProps {
  onSelectRoute?: (from: string, to: string) => void;
  onOpenPnr?: () => void;
  onOpenOffers?: () => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectRoute,
  onOpenPnr,
  onOpenOffers,
  onOpenSupport
}) => {
  return (
    <footer className="w-full bg-white border-t border-gray-100 mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Contact */}
          <div className="space-y-4">
            <Logo showSubtitle={false} />
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              India's simplest, most transparent platform for booking intercity bus tickets with instant confirmation, live bus tracking, and zero surprise fees.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="material-symbols-outlined text-[18px] text-[#d84e55]">mail</span>
                <span>
                  Email us:{' '}
                  <a href="mailto:support@goodbus.in" className="text-gray-900 hover:text-[#d84e55] font-medium underline underline-offset-4 transition-colors">
                    support@goodbus.in
                  </a>
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSupport}
                className="flex items-center gap-1.5 text-[#d84e55] hover:text-[#c13a40] font-medium cursor-pointer transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Submit issue with PNR</span>
              </button>
            </div>
          </div>

          {/* Col 2: Popular Routes */}
          <div>
            <h4 className="font-medium text-gray-900 text-xs mb-4 uppercase tracking-widest">
              Popular Routes
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-500 font-light">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Bengaluru', 'Hyderabad')}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Bengaluru to Hyderabad
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Bengaluru', 'Chennai')}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Bengaluru to Chennai
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Mumbai', 'Pune')}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Mumbai to Pune
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Delhi', 'Jaipur')}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Delhi to Jaipur
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Hyderabad', 'Vijayawada')}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Hyderabad to Vijayawada
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Top Operators */}
          <div>
            <h4 className="font-medium text-gray-900 text-xs mb-4 uppercase tracking-widest">
              Top Operators
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-500 font-light">
              <li>
                <span className="hover:text-gray-900 transition-colors cursor-pointer">
                  Orange Tours &amp; Travels
                </span>
              </li>
              <li>
                <span className="hover:text-gray-900 transition-colors cursor-pointer">
                  SRS Travels
                </span>
              </li>
              <li>
                <span className="hover:text-gray-900 transition-colors cursor-pointer">
                  VRL Travels
                </span>
              </li>
              <li>
                <span className="hover:text-gray-900 transition-colors cursor-pointer">
                  Zingbus
                </span>
              </li>
              <li>
                <span className="hover:text-gray-900 transition-colors cursor-pointer">
                  IntrCity SmartBus
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Access */}
          <div>
            <h4 className="font-medium text-gray-900 text-xs mb-4 uppercase tracking-widest">
              Quick Access
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-500 font-light">
              <li>
                <button
                  type="button"
                  onClick={onOpenPnr}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Check PNR Status
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenPnr}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Cancel &amp; Refund Ticket
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenOffers}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Bus Offers &amp; Coupons
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Privacy Policy &amp; Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-gray-900 transition-colors text-left cursor-pointer"
                >
                  Help &amp; Customer Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom sub-footer: Copyright */}
        <div className="border-t border-gray-100 pt-8 text-center text-xs text-gray-400 font-light">
          <p>© 2026 goodbus.in. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
