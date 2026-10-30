import React, { useState, useEffect } from 'react';
import { BusTrip, Seat, BoardingPoint, DroppingPoint, Passenger } from '../types';

interface PassengerDetailsScreenProps {
  bus: BusTrip;
  selectedSeats: Seat[];
  boardingPoint: BoardingPoint;
  droppingPoint: DroppingPoint;
  journeyDate: string;
  passengers: Passenger[];
  contactMobile: string;
  contactEmail: string;
  whatsappAlerts: boolean;
  promoCode: string;
  isPromoApplied: boolean;
  onUpdatePassenger: (index: number, updated: Partial<Passenger>) => void;
  onUpdateContactMobile: (val: string) => void;
  onUpdateContactEmail: (val: string) => void;
  onToggleWhatsapp: (val: boolean) => void;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  onProceedToPayment: () => void;
  onBackToPoints: () => void;
  isBlockingSeats?: boolean;
}

export const PassengerDetailsScreen: React.FC<PassengerDetailsScreenProps> = ({
  bus,
  selectedSeats,
  boardingPoint,
  droppingPoint,
  journeyDate,
  passengers,
  contactMobile,
  contactEmail,
  whatsappAlerts,
  promoCode,
  isPromoApplied,
  onUpdatePassenger,
  onUpdateContactMobile,
  onUpdateContactEmail,
  onToggleWhatsapp,
  onApplyPromo,
  onRemovePromo,
  onProceedToPayment,
  onBackToPoints,
  isBlockingSeats = false
}) => {
  const [promoInput, setPromoInput] = useState(promoCode || 'GOODBUS_FIRST');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (promoCode) {
      setPromoInput(promoCode);
    }
  }, [promoCode]);

  const baseFare = selectedSeats.reduce((sum, s) => sum + (s.baseFare ?? s.price), 0);
  const gstAmount = selectedSeats.reduce((sum, s) => {
    if (s.gst !== undefined && s.gst > 0) return sum + s.gst;
    return sum + Math.round((s.baseFare ?? s.price) * 0.05);
  }, 0);
  const discountAmount = isPromoApplied ? 250 : 0;
  const totalPayable = Math.max(0, baseFare + gstAmount - discountAmount);

  const handleValidateAndProceed = () => {
    // Validate contact
    if (!contactMobile || contactMobile.trim().length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number for ticket updates.');
      return;
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || p.name.trim().length < 2) {
        setValidationError(`Please enter full name for Passenger ${i + 1} (${p.seatDeckText}).`);
        return;
      }
      if (!p.age || Number(p.age) <= 0 || Number(p.age) > 120) {
        setValidationError(`Please enter a valid age for Passenger ${i + 1} (${p.seatDeckText}).`);
        return;
      }
    }

    setValidationError(null);
    onProceedToPayment();
  };

  return (
    <main className="min-h-screen pt-24 pb-20 bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBackToPoints}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 transition-colors shadow-sm cursor-pointer w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Boarding Points</span>
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="p-1 hover:bg-red-100 rounded-full text-gray-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-gray-900">
                    contact_phone
                  </span>
                  <h3 className="font-medium text-gray-900 text-sm">
                    Contact Details (For e-Ticket &amp; WhatsApp Alerts)
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">Instant SMS &amp; Email</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-full px-4 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#d84e55] focus-within:ring-1 focus-within:ring-[#d84e55] transition-all">
                    <span className="text-xs font-medium text-gray-500 mr-2 shrink-0">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={contactMobile}
                      onChange={(e) => onUpdateContactMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Email Address *
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-full px-4 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#d84e55] focus-within:ring-1 focus-within:ring-[#d84e55] transition-all">
                    <span className="material-symbols-outlined text-gray-400 text-[18px] mr-2 shrink-0">
                      mail
                    </span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => onUpdateContactEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={whatsappAlerts}
                    onChange={(e) => onToggleWhatsapp(e.target.checked)}
                    className="rounded border-gray-300 text-[#d84e55] focus:ring-[#d84e55]"
                  />
                  <span>Send booking confirmation &amp; live bus tracking link via WhatsApp</span>
                </label>
              </div>
            </div>

            {/* Passenger Information Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-gray-900">groups</span>
                  <h3 className="font-medium text-gray-900 text-sm">Passenger Information</h3>
                </div>
                <span className="text-[11px] text-gray-400 font-light">
                  {passengers.length} {passengers.length === 1 ? 'Traveler' : 'Travelers'}
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 flex items-center gap-2 font-light">
                <span className="material-symbols-outlined text-[18px] text-gray-500 shrink-0">
                  badge
                </span>
                <span>
                  Please enter passenger names exactly as shown on government-issued photo ID cards.
                </span>
              </div>

              {passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#d84e55] text-white flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span>
                        {passenger.isPrimary ? 'Primary Passenger' : `Co-Passenger ${index}`}
                      </span>
                    </span>

                    <span className="px-3 py-1 rounded-full bg-[#fef2f2] text-[#d84e55] border border-red-100 font-mono text-xs font-semibold">
                      Seat: {passenger.seatDeckText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Gender Selector */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Gender
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdatePassenger(index, { gender: 'Male' })}
                          className={`flex-1 py-2 text-xs font-medium rounded-full border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            passenger.gender === 'Male'
                              ? 'bg-[#d84e55] text-white border-[#d84e55] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {passenger.gender === 'Male' && (
                            <span className="material-symbols-outlined text-[14px] text-white">
                              check
                            </span>
                          )}
                          <span>Male</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdatePassenger(index, { gender: 'Female' })}
                          className={`flex-1 py-2 text-xs font-medium rounded-full border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            passenger.gender === 'Female'
                              ? 'bg-[#d84e55] text-white border-[#d84e55] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {passenger.gender === 'Female' && (
                            <span className="material-symbols-outlined text-[14px] text-white">
                              check
                            </span>
                          )}
                          <span>Female</span>
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(e) => onUpdatePassenger(index, { name: e.target.value })}
                        placeholder="e.g. Vikram Aditya"
                        className="w-full border border-gray-200 rounded-full px-4 py-2 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55]"
                      />
                    </div>

                    {/* Age */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Age (Yrs) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={passenger.age}
                        onChange={(e) => onUpdatePassenger(index, { age: e.target.value })}
                        placeholder="28"
                        className="w-full border border-gray-200 rounded-full px-4 py-2 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Sticky Trip Summary & Fare Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24 space-y-4">
              {/* Trip Banner Header */}
              <div className="h-28 relative overflow-hidden bg-gray-900">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCovmYkZaUqe4Uf2tYquCCbudrvMJoJvU0aRmFkY3xDgTcj9G06e3hBo1cx5AcGURkHMThgFT6XJvIyPLVLIeUP_evQvGSiPcBaELudZjm0hQuquURtutqqUJZnD7dHdhA8vx_ypP20VxFdBHBBonhKznrFi6xfvYU8dgRjBaxIi3kzAyVvnIm7mw6kCUQKznovbZxZaHWjfqvJSWRVOv4kAMmwjBdz_Q4OjtaiHCm61a6Aik6LUpcV"
                  alt="Trip Banner"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white flex items-end justify-between">
                  <div>
                    <h4 className="font-medium text-sm leading-tight">{bus.operator}</h4>
                    <span className="text-[11px] text-gray-300 font-light">{bus.busType}</span>
                  </div>
                  <span className="text-xs font-mono font-medium bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    ★ {bus.rating}
                  </span>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Route & Schedule Timeline */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Journey Date</span>
                    <span className="font-medium text-gray-800">{journeyDate}</span>
                  </div>

                  <div className="border-t border-gray-200/60 pt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        <strong className="font-medium">Boarding:</strong> {boardingPoint.name}
                      </span>
                      <span className="font-mono font-medium text-gray-900">{boardingPoint.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        <strong className="font-medium">Dropping:</strong> {droppingPoint.name}
                      </span>
                      <span className="font-mono font-medium text-gray-900">{droppingPoint.time}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200/60 pt-2 flex items-center justify-between">
                    <span className="text-gray-500 text-[11px]">Assigned Berths:</span>
                    <div className="flex items-center gap-1">
                      {selectedSeats.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-medium font-mono shadow-xs"
                        >
                          {s.number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Promo Code Box */}
                <div className="p-4 bg-[#fef2f2]/60 rounded-2xl border border-red-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#d84e55]">
                        local_offer
                      </span>
                      <span>Promo Code</span>
                    </span>
                    {isPromoApplied && (
                      <button
                        type="button"
                        onClick={onRemovePromo}
                        className="text-[11px] text-[#d84e55] hover:underline font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled={isPromoApplied}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="ENTER PROMO CODE"
                      className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider focus:outline-none focus:border-[#d84e55] disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <button
                      type="button"
                      disabled={isPromoApplied || !promoInput.trim()}
                      onClick={() => onApplyPromo(promoInput.trim())}
                      className="px-5 py-2 bg-[#d84e55] hover:bg-[#c13a40] disabled:bg-gray-300 text-white font-medium text-xs rounded-full transition-colors cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  </div>

                  {isPromoApplied && (
                    <div className="text-[11px] text-[#13805b] font-medium flex items-center gap-1 pt-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>₹250 instant discount unlocked! ({promoCode || 'GOODBUS_FIRST'})</span>
                    </div>
                  )}
                </div>

                {/* Fare Computation Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Base Fare ({selectedSeats.length} Seats)</span>
                    <span className="font-mono font-medium text-gray-800">
                      ₹{baseFare}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Integrated GST (5%)</span>
                    <span className="font-mono text-gray-700">₹{gstAmount}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <span>Convenience Fee</span>
                      <span className="text-[#13805b] font-medium text-[10px]">100% OFF</span>
                    </span>
                    <span className="font-mono font-medium text-[#13805b]">FREE</span>
                  </div>

                  {isPromoApplied && (
                    <div className="flex items-center justify-between text-[#d84e55] font-semibold">
                      <span>Instant Promo Discount</span>
                      <span className="font-mono font-medium">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">Total Payable</span>
                      {isPromoApplied && (
                        <span className="text-[11px] text-[#13805b] font-normal">
                          You saved ₹{discountAmount} today!
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-gray-900 font-mono">
                      ₹{totalPayable}
                    </span>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  disabled={isBlockingSeats}
                  onClick={handleValidateAndProceed}
                  className="w-full py-3.5 bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] disabled:bg-gray-400 text-white font-semibold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isBlockingSeats ? 'animate-spin' : ''}`}>
                    {isBlockingSeats ? 'sync' : 'lock'}
                  </span>
                  <span>{isBlockingSeats ? 'Securing 8-Minute Tentative Block...' : 'Continue to Secure Payment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
