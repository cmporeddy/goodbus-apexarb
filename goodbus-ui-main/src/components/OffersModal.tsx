import React from 'react';

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon: (code: string) => void;
}

const OFFERS = [
  {
    code: 'GOODBUS_FIRST',
    title: 'Flat ₹250 Off on First Bus Booking',
    desc: 'Valid on all intercity AC and sleeper bus tickets with zero minimum booking value.',
    validTill: '31 Oct 2026',
    discount: '₹250 OFF'
  },
  {
    code: 'SUPERBUS50',
    title: 'Up to 15% Instant Discount',
    desc: 'Maximum discount of ₹300 on Volvo and BharatBenz premium sleeper services.',
    validTill: '15 Nov 2026',
    discount: '15% OFF'
  },
  {
    code: 'WEEKEND100',
    title: 'Weekend Getaway ₹100 Cashback',
    desc: 'Applicable on Friday, Saturday & Sunday departures across south & west India.',
    validTill: '30 Nov 2026',
    discount: '₹100 OFF'
  }
];

export const OffersModal: React.FC<OffersModalProps> = ({ isOpen, onClose, onApplyCoupon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in zoom-in-95 my-8 border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#d84e55] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">local_offer</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-base">Exclusive Bus Offers</h3>
              <p className="text-[11px] text-gray-400 font-light">
                Verified discount coupons with instant checkout applicability
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3">
          {OFFERS.map((offer) => (
            <div
              key={offer.code}
              className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-2 hover:border-gray-300 hover:bg-white transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-xs px-3 py-1 rounded-full bg-[#d84e55] text-white tracking-widest shadow-xs">
                  {offer.code}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {offer.discount}
                </span>
              </div>

              <h4 className="font-medium text-gray-900 text-sm">{offer.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-light">{offer.desc}</p>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-gray-400 font-light">Valid till {offer.validTill}</span>
                <button
                  type="button"
                  onClick={() => {
                    onApplyCoupon(offer.code);
                    onClose();
                  }}
                  className="font-semibold text-[#d84e55] hover:text-[#c13a40] cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <span>Apply Coupon</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
