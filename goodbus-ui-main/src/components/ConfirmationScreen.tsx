import React, { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { BookingDetails } from '../types';
import { parseCancellationPolicy } from '../services/redbusService';

interface ConfirmationScreenProps {
  booking: BookingDetails;
  onBookAnother: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  booking,
  onBookAnother,
  onShowToast
}) => {
  useEffect(() => {
    // Fire celebratory confetti upon loading confirmation
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if canvas not available
    }
  }, []);

  const handleDownloadTicket = () => {
    window.print();
    onShowToast('Ticket Downloaded', 'Official PDF boarding pass ready for print.', 'success');
  };

  return (
    <main className="min-h-screen pt-24 pb-20 bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Celebration Ribbon */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center shadow-sm border border-emerald-200">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>

          <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium uppercase tracking-widest rounded-full">
            Payment Success • Instant e-Ticket Issued
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
            Booking Successful! Your Trip is Confirmed.
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto font-light">
            Ticket sent to WhatsApp (+91 {booking.contactMobile}) &amp; {booking.contactEmail}.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadTicket}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download PDF Ticket</span>
            </button>
          </div>
        </div>

        {/* Boarding Pass Main Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative print:shadow-none print:border-black">
          {/* Top Bar with TIN and PNR */}
          <div className="bg-[#d84e55] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <span className="text-[10px] text-red-100 uppercase font-bold tracking-widest block">
                Ticket Identification No (TIN)
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-white">
                {booking.tin}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-red-100 uppercase font-bold tracking-widest block text-left sm:text-right">
                  Operator PNR
                </span>
                <span className="font-mono font-bold text-base sm:text-lg text-white">
                  {booking.pnr}
                </span>
              </div>

              <div className="h-8 w-[1px] bg-red-400/40 hidden sm:block" />

              <span className="bg-white/20 text-white font-semibold text-[10px] uppercase px-3 py-1 rounded-full tracking-widest border border-white/30 backdrop-blur-xs">
                Confirmed &amp; Issued
              </span>
            </div>
          </div>

          {/* Route & Operator Summary */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${booking.bus.operatorLogoBg} ${booking.bus.operatorLogoColor} font-bold text-sm flex items-center justify-center shadow-sm`}
                >
                  {booking.bus.operatorLogoText}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-base">{booking.bus.operator}</h3>
                  <p className="text-xs text-gray-500 font-light">{booking.bus.busType}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-gray-400 font-light block">Journey Date</span>
                <span className="font-medium text-gray-900 text-sm">{booking.journeyDate}</span>
              </div>
            </div>

            {/* Travel Schedule Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Boarding Point
                </span>
                <div className="font-mono font-light text-lg text-gray-900">
                  {booking.boardingPoint.time}
                </div>
                <div className="font-medium text-xs text-gray-800">{booking.boardingPoint.name}</div>
                <div className="text-[11px] text-gray-500 font-light">{booking.boardingPoint.landmark}</div>
              </div>

              <div className="text-center py-2 sm:py-0">
                <span className="text-xs font-medium text-gray-400 uppercase">{booking.bus.duration}</span>
                <div className="flex items-center gap-1 my-1 justify-center">
                  <span className="w-2 h-2 rounded-full bg-gray-900" />
                  <div className="w-24 border-t border-dashed border-gray-300" />
                  <span className="material-symbols-outlined text-gray-700 text-[16px]">
                    directions_bus
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-light">{booking.bus.routeVia}</span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Dropping Point
                </span>
                <div className="font-mono font-light text-lg text-gray-900">
                  {booking.droppingPoint.time}
                </div>
                <div className="font-medium text-xs text-gray-800">{booking.droppingPoint.name}</div>
                <div className="text-[11px] text-gray-500 font-light">{booking.droppingPoint.landmark}</div>
              </div>
            </div>
          </div>

          {/* Ticket Perforation Visual Effect with Semicircles */}
          <div className="relative py-2">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F9FAFB] border-r border-gray-100" />
            <div className="border-t border-dashed border-gray-200 w-full" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F9FAFB] border-l border-gray-100" />
          </div>

          {/* Passenger Roster Section */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Confirmed Passengers ({booking.passengers.length})
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {booking.passengers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-50 text-[#d84e55] font-semibold text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900 text-sm block">{p.name}</span>
                        <span className="text-gray-400 text-[11px] font-light">
                          {p.gender} • {p.age} years
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-semibold text-xs text-[#d84e55] bg-[#fef2f2] border border-red-100 px-3 py-1 rounded-full">
                        Seat {p.seatDeckText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator-Matched Cancellation & Refund Policy Table */}
            {(() => {
              const operatorName = booking.bus?.operator || 'Bus Operator';
              const policyStr = booking.cancellationPolicy || booking.bus?.cancellationPolicy || '';
              const tiers = parseCancellationPolicy(policyStr);
              const isPartialAllowed = booking.partialCancellationAllowed ?? booking.bus?.partialCancellationAllowed ?? true;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {operatorName} Cancellation &amp; Refund Policy
                      </h4>
                      <p className="text-[11px] text-gray-400 font-light">
                        Official terms as configured by {operatorName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                        isPartialAllowed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        Partial Cancellation: {isPartialAllowed ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-100 text-xs shadow-2xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/90 border-b border-gray-100 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Cancellation Timing (Cutoff)</th>
                          <th className="p-3.5">Operator Fee</th>
                          <th className="p-3.5">Refund Percentage</th>
                          <th className="p-3.5 text-right">Est. Refundable Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tiers.map((tier, idx) => {
                          const estimatedRefund = Math.max(0, Math.round(booking.totalPaid * (tier.refundPct / 100)));
                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3.5 text-gray-800 font-medium">{tier.timeDesc}</td>
                              <td className="p-3.5 text-red-600 font-semibold">{tier.deduction}</td>
                              <td className="p-3.5 text-emerald-700 font-semibold">{tier.refund}</td>
                              <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                                ₹{estimatedRefund}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-gray-400 italic">
                    * Estimated refund is calculated on total fare of ₹{booking.totalPaid} according to {operatorName}&apos;s cutoff rules.
                  </p>
                </div>
              );
            })()}

            {/* Fare Summary Footer */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>
                  <strong className="font-medium text-gray-900">Payment Mode:</strong> {booking.paymentMethod}
                </div>
                <div className="text-[11px] text-gray-400 font-mono font-light">Txn ID: {booking.txnId}</div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-500 font-light">Total Amount Paid:</span>
                <span className="text-2xl font-bold text-gray-900 font-mono">
                  ₹{booking.totalPaid}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Post-booking action */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBookAnother}
            className="px-8 py-3.5 bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] text-white font-semibold text-sm rounded-full shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Book Another Bus Trip</span>
          </button>
        </div>
      </div>
    </main>
  );
};
