import React, { useState } from 'react';
import { BookingDetails } from '../types';
import { parseCancellationPolicy } from '../services/redbusService';

interface PnrStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetails;
  onCancelTicket: (booking: BookingDetails) => void;
  onUndoCancellation: (booking: BookingDetails) => void;
}

export const PnrStatusModal: React.FC<PnrStatusModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCancelTicket,
  onUndoCancellation
}) => {
  const [pnrInput, setPnrInput] = useState(booking.pnr || 'ORG-HYD-55102');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSearchPnr = () => {
    setErrorMessage(null);
    if (!pnrInput.trim()) {
      setErrorMessage('Please enter a valid PNR or Ticket ID.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (
        pnrInput.trim().toUpperCase() !== booking.pnr.toUpperCase() &&
        pnrInput.trim().toUpperCase() !== booking.tin.toUpperCase() &&
        pnrInput.trim() !== 'ORG-HYD-55102'
      ) {
        setErrorMessage('No active booking found with this PNR. Please check and try again.');
      }
    }, 600);
  };

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in zoom-in-95 my-8 border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#d84e55] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-base">Check PNR &amp; Live Tracking</h3>
              <p className="text-[11px] text-gray-400 font-light">
                Real-time satellite GPS updates &amp; ticket management
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

        {/* PNR Search Bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-gray-200 rounded-full px-4 py-2 bg-gray-50 focus-within:bg-white focus-within:border-[#d84e55] focus-within:ring-1 focus-within:ring-[#d84e55] transition-all">
              <span className="material-symbols-outlined text-gray-400 text-[18px] mr-2">search</span>
              <input
                type="text"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                placeholder="Enter PNR (e.g. ORG-HYD-55102)"
                className="w-full text-xs sm:text-sm font-mono font-medium uppercase text-gray-900 focus:outline-none placeholder:text-gray-400 bg-transparent"
              />
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleSearchPnr}
              className="px-6 py-2.5 bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] disabled:bg-gray-200 text-white font-semibold text-xs rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              ) : (
                <span>Check Status</span>
              )}
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        {/* Status Content */}
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 font-light">Fetching real-time satellite telemetry...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isCancelled
                  ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                  : 'bg-gray-50 border-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCancelled ? 'bg-rose-600' : 'bg-emerald-600 animate-pulse'
                    }`}
                  />
                  <span className="font-medium text-xs uppercase tracking-widest">
                    {isCancelled ? 'Booking Cancelled (Refunded)' : 'Bus En-Route • On Time'}
                  </span>
                </div>

                <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded-full bg-white border border-gray-200">
                  PNR: {booking.pnr}
                </span>
              </div>

              {!isCancelled ? (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-600 font-light">
                    <span>GPS Telemetry:</span>
                    <span className="font-medium text-gray-900">NH 44, Near Kurnool Bypass</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 font-light">
                    <span>Live Cruising Speed:</span>
                    <span className="font-mono font-medium text-emerald-600">68 km/h</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 font-light">
                    <span>Next Passenger Stop:</span>
                    <span className="font-medium text-gray-900">
                      {booking.droppingPoint.name} (ETA: {booking.droppingPoint.time})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-rose-800 space-y-2 font-light">
                  <p>This ticket has been cancelled. Instant refund of 90% has been processed.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onUndoCancellation(booking);
                      onClose();
                    }}
                    className="px-4 py-1.5 bg-[#d84e55] hover:bg-[#c13a40] text-white font-medium text-xs rounded-full inline-flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">undo</span>
                    <span>Undo Cancellation (Restore Seats)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Trip Summary */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium text-gray-800">
                <span>{booking.bus.operator}</span>
                <span className="font-mono text-gray-500 font-light">
                  Seats: {booking.selectedSeats.map((s) => s.number).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-400 font-light">
                <span>
                  {booking.sourceCity} → {booking.destinationCity}
                </span>
                <span>{booking.journeyDate}</span>
              </div>
            </div>

            {/* Driver Contact & SOS */}
            {!isCancelled && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-gray-100 bg-white">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="material-symbols-outlined text-[20px] text-gray-400">
                    contact_phone
                  </span>
                  <div>
                    <span className="font-medium text-gray-900 block">Duty Driver: Ramesh K.</span>
                    <span className="text-gray-400 text-[11px] font-light">+91 98451 22910</span>
                  </div>
                </div>

                <a
                  href="tel:9845122910"
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs rounded-full transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Call Driver</span>
                </a>
              </div>
            )}

            {/* Cancel Ticket Action with Instant Undo Notification */}
            {!isCancelled && (
              <div className="pt-2 border-t border-gray-100">
                {!showCancelConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer border border-rose-200 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Cancel Ticket &amp; Claim Instant Refund</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
                    {(() => {
                      const operatorName = booking.bus?.operator || 'Operator';
                      const tiers = parseCancellationPolicy(booking.cancellationPolicy || booking.bus?.cancellationPolicy);
                      const bestRefundTier = tiers[0] || { refundPct: 90, timeDesc: 'eligible cancellation window' };
                      const refundAmount = Math.max(0, Math.round(booking.totalPaid * (bestRefundTier.refundPct / 100)));

                      return (
                        <div className="text-xs text-rose-950 font-light">
                          <strong className="block mb-1 text-sm font-medium">Confirm Ticket Cancellation?</strong>
                          <p>
                            As per {operatorName}&apos;s cancellation policy ({bestRefundTier.timeDesc}), you will receive an estimated {bestRefundTier.refundPct}% refund (₹{refundAmount}) to your original payment method.
                          </p>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCancelConfirm(false);
                          onCancelTicket(booking);
                          onClose();
                        }}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-full cursor-pointer transition-colors shadow-sm"
                      >
                        Yes, Cancel Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200 cursor-pointer hover:bg-gray-50"
                      >
                        Keep Ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
