import React from 'react';
import { BusTrip, Seat } from '../types';

interface SeatMapProps {
  bus: BusTrip;
  selectedSeats: Seat[];
  onToggleSeat: (seat: Seat) => void;
  onProceed: () => void;
}

// Double side berth companion mapping (berths sharing the partition side-by-side)
const DOUBLE_BERTH_PAIRS: Record<string, string> = {
  // Lower deck sleeper double berths (Row 1 & Row 2)
  L2: 'L3',
  L3: 'L2',
  L5: 'L6',
  L6: 'L5',
  L8: 'L9',
  L9: 'L8',
  L11: 'L12',
  L12: 'L11',
  L14: 'L15',
  L15: 'L14',
  L17: 'L18',
  L18: 'L17',

  // Upper deck sleeper double berths (Row 1 & Row 2)
  U2: 'U3',
  U3: 'U2',
  U5: 'U6',
  U6: 'U5',
  U8: 'U9',
  U9: 'U8',
  U11: 'U12',
  U12: 'U11',
  U14: 'U15',
  U15: 'U14',
  U17: 'U18',
  U18: 'U17',

  // Lower deck 2-seater pairs
  S1: 'S2',
  S2: 'S1',
  S3: 'S4',
  S4: 'S3',
  S5: 'S6',
  S6: 'S5',
  S7: 'S8',
  S8: 'S7',
  S9: 'S10',
  S10: 'S9',
  S11: 'S12',
  S12: 'S11'
};

export const SeatMap: React.FC<SeatMapProps> = ({
  bus,
  selectedSeats,
  onToggleSeat,
  onProceed
}) => {
  const isSelected = (seatId: string) => selectedSeats.some((s) => s.id === seatId);

  const totalFare = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Helper to determine if a berth is ladies-booked:
  // 1. Direct: This seat was booked by a female passenger or marked as ladies booked
  // 2. Double side berth: If any one berth is booked by lady, the other companion berth also comes as lady
  const isLadiesBookedSeat = (seat: Seat): boolean => {
    if (seat.isLadiesBooked || (seat.isBooked && seat.bookedGender === 'Female')) {
      return true;
    }

    const partnerNumber = DOUBLE_BERTH_PAIRS[seat.number];
    if (partnerNumber) {
      const partnerSeat = bus.seats.find((s) => s.number === partnerNumber);
      if (
        partnerSeat &&
        (partnerSeat.isLadiesBooked || (partnerSeat.isBooked && partnerSeat.bookedGender === 'Female'))
      ) {
        return true;
      }
    }

    return false;
  };

  // Group seats
  const lowerSleepersRow1 = bus.seats.filter(
    (s) => s.deck === 'lower' && s.type === 'sleeper' && ['L2', 'L5', 'L8', 'L11', 'L14', 'L17'].includes(s.number)
  );
  const lowerSleepersRow2 = bus.seats.filter(
    (s) => s.deck === 'lower' && s.type === 'sleeper' && ['L3', 'L6', 'L9', 'L12', 'L15', 'L18'].includes(s.number)
  );
  const lowerSeaters = bus.seats.filter((s) => s.deck === 'lower' && s.type === 'seater');

  const upperSleepersRow1 = bus.seats.filter(
    (s) => s.deck === 'upper' && ['U2', 'U5', 'U8', 'U11', 'U14', 'U17'].includes(s.number)
  );
  const upperSleepersRow2 = bus.seats.filter(
    (s) => s.deck === 'upper' && ['U3', 'U6', 'U9', 'U12', 'U15', 'U18'].includes(s.number)
  );
  const upperSleepersRow3 = bus.seats.filter(
    (s) => s.deck === 'upper' && ['U1', 'U4', 'U7', 'U10', 'U13', 'U16'].includes(s.number)
  );

  const renderSleeper = (seat: Seat) => {
    const selected = isSelected(seat.id);
    const ladiesBooked = isLadiesBookedSeat(seat);

    // If ladies booked (or double-berth partner booked by lady) -> border with red colour & disable seat selection
    if (ladiesBooked) {
      return (
        <div
          key={seat.id}
          className="h-10 rounded-xl bg-red-50/40 border-2 border-red-500 flex items-center justify-between px-2.5 cursor-not-allowed select-none shadow-xs"
          title={`Berth ${seat.number} (Ladies Booked - Selection Disabled)`}
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-red-600 font-semibold">female</span>
            <span className="text-xs font-semibold text-red-700">{seat.number}</span>
          </div>
          <span className="text-[9px] font-medium text-red-600 uppercase tracking-tight">Ladies</span>
        </div>
      );
    }

    // Standard Booked / Sold
    if (seat.isBooked) {
      return (
        <div
          key={seat.id}
          className="h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-between px-2.5 opacity-50 cursor-not-allowed select-none"
          title={`Seat ${seat.number} (Booked)`}
        >
          <span className="text-xs font-medium text-gray-400">{seat.number}</span>
          <span className="text-[9px] text-gray-400 font-normal">Sold</span>
        </div>
      );
    }

    // Selected
    if (selected) {
      return (
        <button
          key={seat.id}
          type="button"
          onClick={() => onToggleSeat(seat)}
          className="h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-between px-2.5 shadow-sm ring-1 ring-emerald-600 cursor-pointer transition-transform active:scale-95"
          title={`Selected ${seat.number}`}
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-white">check</span>
            <span className="text-xs font-semibold">{seat.number}</span>
          </div>
          <span className="text-[10px] text-emerald-100 font-mono font-medium">₹{seat.price}</span>
        </button>
      );
    }

    // Standard Available Berth (no initial ladies reserved seats)
    return (
      <button
        key={seat.id}
        type="button"
        onClick={() => onToggleSeat(seat)}
        className="h-10 rounded-xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-sm flex items-center justify-between px-2.5 cursor-pointer transition-all active:scale-95"
        title={`Seat ${seat.number}`}
      >
        <span className="text-xs font-medium text-gray-800">{seat.number}</span>
        <span className="text-[10px] text-gray-400 font-mono">₹{seat.price}</span>
      </button>
    );
  };

  const renderSeater = (seat: Seat) => {
    const selected = isSelected(seat.id);
    const ladiesBooked = isLadiesBookedSeat(seat);

    // If ladies booked -> border with red colour & disable seat selection
    if (ladiesBooked) {
      return (
        <div
          key={seat.id}
          className="w-10 h-10 rounded-xl bg-red-50/40 border-2 border-red-500 flex flex-col items-center justify-center shrink-0 cursor-not-allowed select-none shadow-xs"
          title={`Seat ${seat.number} (Ladies Booked - Selection Disabled)`}
        >
          <div className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[13px] text-red-600 font-semibold">female</span>
            <span className="text-[10px] font-semibold text-red-700">{seat.number}</span>
          </div>
          <span className="text-[8px] font-medium text-red-600 leading-none uppercase">Ladies</span>
        </div>
      );
    }

    // Standard Booked / Sold
    if (seat.isBooked) {
      return (
        <div
          key={seat.id}
          className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center opacity-50 shrink-0 cursor-not-allowed select-none"
          title={`Seat ${seat.number} (Booked)`}
        >
          <div className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[13px] text-gray-400">chair</span>
            <span className="text-[10px] font-medium text-gray-400">{seat.number}</span>
          </div>
          <span className="text-[9px] text-gray-400 font-normal leading-none">Sold</span>
        </div>
      );
    }

    // Selected
    if (selected) {
      return (
        <button
          key={seat.id}
          type="button"
          onClick={() => onToggleSeat(seat)}
          className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center shadow-sm ring-1 ring-emerald-600 shrink-0 cursor-pointer transition-transform active:scale-95"
          title={`Selected Seat ${seat.number}`}
        >
          <div className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px] text-white">check</span>
            <span className="text-[10px] font-semibold">{seat.number}</span>
          </div>
          <span className="text-[9px] text-emerald-100 font-mono leading-none font-medium">₹{seat.price}</span>
        </button>
      );
    }

    // Standard Available Seat
    return (
      <button
        key={seat.id}
        type="button"
        onClick={() => onToggleSeat(seat)}
        className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-sm flex flex-col items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95"
        title={`Pushback Seat ${seat.number}`}
      >
        <div className="flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[13px] text-gray-400">chair</span>
          <span className="text-[10px] font-medium text-gray-700">{seat.number}</span>
        </div>
        <span className="text-[9px] text-gray-400 font-mono leading-none">₹{seat.price}</span>
      </button>
    );
  };

  return (
    <div className="bg-gray-50/70 border-t border-gray-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Seat Legend Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-gray-800 font-medium text-xs sm:text-sm">
            <span className="material-symbols-outlined text-[18px] text-gray-900">info</span>
            <span>Seat Legend:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-5 rounded-lg border border-gray-200 bg-white flex items-center justify-center font-normal text-[9px] text-gray-700 shadow-sm">
                ₹
              </div>
              <span className="text-gray-500 font-normal">Available</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-6 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[12px] text-white">check</span>
              </div>
              <span className="text-gray-700 font-medium">
                Selected ({selectedSeats.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-6 h-5 rounded-lg border-2 border-red-500 bg-red-50/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-red-600 font-semibold">female</span>
              </div>
              <span className="text-red-700 font-medium">Ladies Booked</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-6 h-5 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] font-normal text-gray-400">
                Sold
              </div>
              <span className="text-gray-500 font-normal">Booked / Sold</span>
            </div>
          </div>
        </div>

        {/* LOWER DECK */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-900 font-medium uppercase tracking-wider">
                Lower Deck (Seating &amp; Sleeper)
              </span>
              <span className="text-[11px] text-gray-400 font-light">
                2+1 Hybrid (Upper Sleeper, Lower Seater + Sleeper)
              </span>
            </div>
          </div>

          <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
            {/* Driver Cabin */}
            <div className="w-12 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-1 text-center shrink-0">
              <span className="material-symbols-outlined text-[20px] text-gray-400">sports_volleyball</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mt-1 leading-none">
                Driver
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5 leading-none">Cabin</span>
            </div>

            {/* Berths Matrix */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-[520px]">
              {/* Sleeper Row 1 */}
              <div className="grid grid-cols-6 gap-1.5">
                {lowerSleepersRow1.map(renderSleeper)}
              </div>

              {/* Sleeper Row 2 */}
              <div className="grid grid-cols-6 gap-1.5">
                {lowerSleepersRow2.map(renderSleeper)}
              </div>

              {/* Walkway */}
              <div className="h-5 flex items-center justify-center bg-gray-50 rounded-lg px-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  Walkway
                </span>
              </div>

              {/* Pushback Seater Row */}
              <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-0.5">
                {lowerSeaters.map(renderSeater)}
              </div>
            </div>
          </div>
        </div>

        {/* UPPER DECK */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-900 font-medium uppercase tracking-wider">
                Upper Deck
              </span>
              <span className="text-[11px] text-gray-400 font-light">Panoramic Windows</span>
            </div>
          </div>

          <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
            {/* Front indicator */}
            <div className="w-12 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-1 text-center shrink-0">
              <span className="material-symbols-outlined text-[20px] text-gray-400">panorama</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mt-1 leading-none">
                Front
              </span>
            </div>

            {/* Upper Deck Grid */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-[520px]">
              {/* Row 1 */}
              <div className="grid grid-cols-6 gap-1.5">
                {upperSleepersRow1.map(renderSleeper)}
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-6 gap-1.5">
                {upperSleepersRow2.map(renderSleeper)}
              </div>

              {/* Walkway */}
              <div className="h-5 flex items-center justify-center bg-gray-50 rounded-lg px-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  Walkway
                </span>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-6 gap-1.5">
                {upperSleepersRow3.map(renderSleeper)}
              </div>
            </div>
          </div>
        </div>

        {/* Action / Selection Summary Footer */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="space-y-1">
              <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">
                Selected Berths ({selectedSeats.length})
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-medium text-xs inline-flex items-center gap-1 shadow-xs"
                    >
                      {s.number} ({s.deck === 'lower' ? (s.type === 'seater' ? 'Lower Seat' : 'Lower') : 'Upper'})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic font-light">No seats selected yet</span>
                )}
              </div>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-gray-100"></div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">
                Total Fare
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 font-mono">
                  ₹{totalFare}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0}
            onClick={onProceed}
            className={`w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer ${selectedSeats.length > 0
              ? 'bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] text-white hover:shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">pin_drop</span>
            <span>Select Boarding &amp; Dropping Points</span>
          </button>
        </div>
      </div>
    </div>
  );
};
