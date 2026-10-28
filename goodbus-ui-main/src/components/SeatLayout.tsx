import React, { useState, useEffect, useMemo } from 'react';
import {
  AvailableTrip,
  RedBusSeatRaw,
  RedBusTripDetailsResponse,
  fetchTripDetails,
  FormattedPoint,
  parseCancellationPolicy
} from '../services/redbusService';
import { Seat } from '../types';

interface SeatLayoutProps {
  bus: AvailableTrip;
  onProceedToBooking?: (
    bus: AvailableTrip,
    selectedSeats: Seat[],
    boardingPoints: FormattedPoint[],
    droppingPoints: FormattedPoint[]
  ) => void;
  onClose?: () => void;
}

// Helper to identify emergency exit slots from RedBus API (e.g. RB_BK_EXIT, RB_EXIT)
export const isEmergencyExit = (seat?: RedBusSeatRaw | null): boolean => {
  if (!seat?.name) return false;
  const name = seat.name.trim().toUpperCase();
  return name === 'RB_BK_EXIT' || name === 'RB_EXIT';
};

export const SeatLayout: React.FC<SeatLayoutProps> = ({
  bus,
  onProceedToBooking,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tripDetails, setTripDetails] = useState<RedBusTripDetailsResponse | null>(null);

  // Selected seats state
  const [selectedSeatList, setSelectedSeatList] = useState<RedBusSeatRaw[]>([]);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState<boolean>(false);
  const [forcedSeatsAlert, setForcedSeatsAlert] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<RedBusSeatRaw | null>(null);

  // Live real-time call to tripdetails (no caching)
  const loadLiveSeatLayout = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedSeatList([]);
    setForcedSeatsAlert(null);

    try {
      const data = await fetchTripDetails(bus.id);
      setTripDetails(data);
    } catch (err: any) {
      console.error('Error loading live seat layout for bus', bus.id, err);
      setError(
        err.message || 'Unable to fetch real-time seat layout from bus operator API. Please retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveSeatLayout();
  }, [bus.id]);

  // Max seats permitted per transaction
  const maxSeatsAllowed = useMemo(() => {
    if (tripDetails?.maxSeatsPerTicket) {
      const parsed = parseInt(String(tripDetails.maxSeatsPerTicket), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return bus.maxSeatsPerTicket || 6;
  }, [tripDetails, bus.maxSeatsPerTicket]);

  // Forced seats constraints logic:
  // forcedSeats string format: "femaleseat1,femaleseat2@maleseat1,maleseat2" or "U11@"
  const { forcedFemaleSeats, forcedMaleSeats } = useMemo(() => {
    const rawForced = tripDetails?.forcedSeats || '';
    if (!rawForced || !rawForced.includes('@')) {
      return { forcedFemaleSeats: [], forcedMaleSeats: [] };
    }
    const [femalePart, malePart] = rawForced.split('@');
    const fSeats = femalePart
      ? femalePart
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const mSeats = malePart
      ? malePart
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return { forcedFemaleSeats: fSeats, forcedMaleSeats: mSeats };
  }, [tripDetails?.forcedSeats]);

  // Seats partitioned by deck level
  const { lowerDeckSeats, upperDeckSeats, hasLowerDeck, hasUpperDeck } = useMemo(() => {
    const allSeats = tripDetails?.seats || [];
    const lower = allSeats.filter((s) => String(s.zIndex) === '0');
    const upper = allSeats.filter((s) => String(s.zIndex) === '1');
    return {
      lowerDeckSeats: lower,
      upperDeckSeats: upper,
      hasLowerDeck: lower.length > 0,
      hasUpperDeck: upper.length > 0
    };
  }, [tripDetails?.seats]);

  // Global column bounds across both decks to guarantee seamless matching alignment
  const { globalMinCol, globalMaxCol, totalBusCols } = useMemo(() => {
    const allSeats = tripDetails?.seats || [];
    if (allSeats.length === 0) {
      return { globalMinCol: 0, globalMaxCol: 0, totalBusCols: 1 };
    }
    const minC = Math.min(...allSeats.map((s) => parseInt(String(s.column), 10) || 0));
    const maxC = Math.max(
      ...allSeats.map(
        (s) =>
          (parseInt(String(s.column), 10) || 0) +
          (parseInt(String(s.length), 10) || 1) -
          1
      )
    );
    return {
      globalMinCol: minC,
      globalMaxCol: maxC,
      totalBusCols: Math.max(1, maxC - minC + 1)
    };
  }, [tripDetails?.seats]);

  // Check if seat is currently selected
  const isSeatSelected = (seat: RedBusSeatRaw) => {
    return selectedSeatList.some((s) => s.name === seat.name && String(s.zIndex) === String(seat.zIndex));
  };

  // Toggle seat selection
  const handleToggleSeat = (seat: RedBusSeatRaw) => {
    setForcedSeatsAlert(null);
    if (isEmergencyExit(seat)) return;
    const isAvailable = seat.available === 'true';
    if (!isAvailable) return;

    const alreadySelected = isSeatSelected(seat);

    if (alreadySelected) {
      setSelectedSeatList((prev) =>
        prev.filter((s) => !(s.name === seat.name && String(s.zIndex) === String(seat.zIndex)))
      );
      return;
    }

    // Limit check
    if (selectedSeatList.length >= maxSeatsAllowed) {
      setForcedSeatsAlert(`Maximum ${maxSeatsAllowed} seats can be selected per booking.`);
      return;
    }

    // Forced Seats Validation Rule:
    // If forced female seats exist and are currently open/available, prompt user
    if (forcedFemaleSeats.length > 0) {
      const openForcedSeats = (tripDetails?.seats || []).filter(
        (s) =>
          forcedFemaleSeats.includes(s.name) &&
          s.available === 'true' &&
          !selectedSeatList.some((sel) => sel.name === s.name)
      );

      // If the selected seat is NOT one of the forced female seats, but forced seats are still open
      if (openForcedSeats.length > 0 && !forcedFemaleSeats.includes(seat.name)) {
        const forcedNames = openForcedSeats.map((s) => s.name).join(', ');
        setForcedSeatsAlert(`Please select one of the seats reserved for ladies: [${forcedNames}]`);
      }
    }

    // Exact fare integrity: add seat as is
    setSelectedSeatList((prev) => [...prev, seat]);
  };

  // Total base fare calculated from selected seats (SearchResultsScreen shows only baseFare)
  const totalBaseFare = useMemo(() => {
    return selectedSeatList.reduce((acc, s) => {
      const bf = typeof s.baseFare === 'number' ? s.baseFare : parseFloat(String(s.baseFare)) || 0;
      const f = typeof s.fare === 'number' ? s.fare : parseFloat(String(s.fare)) || 0;
      return acc + (bf > 0 ? bf : f);
    }, 0);
  }, [selectedSeatList]);

  // Convert selected RedBusSeatRaw to App Seat interface for downstream booking flow
  const handleProceed = () => {
    if (selectedSeatList.length === 0) {
      setForcedSeatsAlert('Please select at least 1 seat to continue.');
      return;
    }

    const mappedSeats: Seat[] = selectedSeatList.map((raw) => {
      const rawBaseFare = typeof raw.baseFare === 'number' ? raw.baseFare : parseFloat(String(raw.baseFare)) || 0;
      const rawTotalFare = typeof raw.fare === 'number' ? raw.fare : parseFloat(String(raw.fare)) || 0;
      const rawGst = typeof raw.serviceTaxAbsolute === 'number'
        ? raw.serviceTaxAbsolute
        : parseFloat(String(raw.serviceTaxAbsolute)) || (rawTotalFare > rawBaseFare ? rawTotalFare - rawBaseFare : Math.round(rawBaseFare * 0.05));

      const baseFareVal = rawBaseFare > 0 ? rawBaseFare : rawTotalFare;
      const totalFareVal = rawTotalFare > 0 ? rawTotalFare : Math.round(baseFareVal + rawGst);
      const len = parseInt(String(raw.length), 10) || 1;
      const wid = parseInt(String(raw.width), 10) || 1;
      const isSleeper = len > 1 || wid > 1;

      return {
        id: `${raw.zIndex === '1' || raw.zIndex === 1 ? 'U' : 'L'}-${raw.name}`,
        number: raw.name,
        deck: String(raw.zIndex) === '1' ? 'upper' : 'lower',
        type: isSleeper ? 'sleeper' : 'seater',
        price: baseFareVal, // base fare as primary price for SearchResultsScreen
        baseFare: baseFareVal,
        gst: rawGst,
        totalFare: totalFareVal,
        isLadies: raw.ladiesSeat === 'true' || raw.ladiesSeat === true,
        row: parseInt(String(raw.row), 10) || 0,
        col: parseInt(String(raw.column), 10) || 0,
        title: raw.name
      };
    });

    const resolvedBps = tripDetails?.boardingTimes || bus.boardingTimes || [];
    const resolvedDps = tripDetails?.droppingTimes || bus.droppingTimes || [];
    if (onProceedToBooking) {
      onProceedToBooking(bus, mappedSeats, resolvedBps as any, resolvedDps as any);
    }
  };

  // Parse cancellation policy into clean table rows
  const cancellationPolicyRows = useMemo(() => {
    const policyStr = tripDetails?.cancellationPolicy || bus.cancellationPolicy || '';
    return parseCancellationPolicy(policyStr);
  }, [tripDetails?.cancellationPolicy, bus.cancellationPolicy]);

  // Render an individual seat button / berth placed directly via CSS Grid coordinates
  const renderSeatItem = (seat: RedBusSeatRaw, minCol: number, minRow: number) => {
    const sR = parseInt(String(seat.row), 10) || 0;
    const sC = parseInt(String(seat.column), 10) || 0;
    const sLen = parseInt(String(seat.length), 10) || 1;
    const sWid = parseInt(String(seat.width), 10) || 1;

    const colStart = sC - minCol + 1;
    const rowStart = sR - minRow + 1;

    const isSeat = sLen === 1 && sWid === 1;
    const isVerticalBerth = sLen === 1 && sWid >= 2;

    const containerSizeClass = isSeat
      ? 'w-full h-full min-w-0 min-h-0 rounded-r-lg rounded-l-xs'
      : 'w-full h-full min-w-0 min-h-0 rounded-lg';

    const gridPlacementStyle: React.CSSProperties = {
      gridColumn: `${colStart} / span ${sLen}`,
      gridRow: `${rowStart} / span ${sWid}`,
    };

    // Emergency Exit Check: If name is RB_BK_EXIT, do not display as berth/seat, leave empty space
    if (isEmergencyExit(seat)) {
      return (
        <div
          key={`exit-${seat.name}-${seat.zIndex}-${sR}-${sC}`}
          style={gridPlacementStyle}
          className="pointer-events-none select-none invisible"
          aria-hidden="true"
        />
      );
    }

    const isAvailable = seat.available === 'true';
    const isSelected = isSeatSelected(seat);
    const isLadies = seat.ladiesSeat === 'true' || seat.ladiesSeat === true;
    const isMales = seat.malesSeat === 'true' || seat.malesSeat === true;
    const isForced = forcedFemaleSeats.includes(seat.name);

    const fareValue = typeof seat.fare === 'number' ? seat.fare : parseFloat(String(seat.fare)) || 0;
    const baseFareVal = typeof seat.baseFare === 'number' ? seat.baseFare : parseFloat(String(seat.baseFare)) || 0;
    const gstVal = typeof seat.serviceTaxAbsolute === 'number' ? seat.serviceTaxAbsolute : parseFloat(String(seat.serviceTaxAbsolute)) || 0;
    const displayPrice = Math.round(baseFareVal > 0 ? baseFareVal : fareValue);

    // Content alignment for price inside seat (shifted slightly left to account for right-side backrest) vs berth
    const priceTextClass = isSeat
      ? 'pr-1.5 text-[9px] sm:text-[10px] font-bold font-mono tracking-tight select-none'
      : isVerticalBerth
      ? 'mt-2 text-[9px] sm:text-[10px] font-bold font-mono tracking-tight select-none'
      : 'pl-2 text-[9px] sm:text-[10px] font-bold font-mono tracking-tight select-none';

    // 1. Unavailable / Booked Seats (Darker Gray background, NO icons, NO seat numbers, NO price)
    if (!isAvailable) {
      const bookedBorderColor = isLadies
        ? 'border-2 border-rose-400'
        : isMales
        ? 'border-2 border-blue-400'
        : 'border-2 border-gray-400';

      return (
        <div
          key={`seat-${seat.name}-${seat.zIndex}`}
          style={gridPlacementStyle}
          onMouseEnter={() => setHoveredSeat(seat)}
          onMouseLeave={() => setHoveredSeat(null)}
          className={`${containerSizeClass} ${bookedBorderColor} bg-gray-300 text-gray-500 flex items-center justify-center cursor-not-allowed select-none transition-all shadow-2xs relative`}
          title={`Seat ${seat.name} (${isSeat ? 'Seat' : 'Berth'}) - Booked${
            isLadies ? ' (Female Passenger)' : isMales ? ' (Male Passenger)' : ''
          }`}
        >
          {/* Seat facing Front Driver (Left): Backrest on Right, front seat lip on Left */}
          {isSeat && (
            <>
              <div className="absolute right-0.5 top-0.5 bottom-0.5 w-1 rounded-r-xs bg-current opacity-35 pointer-events-none" />
              <div className="absolute right-2 top-1 bottom-1 w-px bg-current opacity-25 pointer-events-none" />
              <div className="absolute left-0.5 top-1.5 bottom-1.5 w-0.5 rounded-full bg-current opacity-20 pointer-events-none" />
            </>
          )}

          {/* Sleeper pillow contour (for berths) */}
          {!isSeat && !isVerticalBerth && (
            <>
              <div className="absolute left-1 top-1 bottom-1 w-1.5 rounded-xs border border-current opacity-30 pointer-events-none" />
              <div className="absolute left-3.5 top-1 bottom-1 w-px bg-current opacity-20 pointer-events-none" />
            </>
          )}
          {isVerticalBerth && (
            <>
              <div className="absolute top-1 left-1 right-1 h-1.5 rounded-xs border border-current opacity-30 pointer-events-none" />
              <div className="absolute top-3 left-1 right-1 h-px bg-current opacity-20 pointer-events-none" />
            </>
          )}
        </div>
      );
    }

    // 2. Selected Seat State (ONLY price shown, NO icons, NO seat number)
    if (isSelected) {
      return (
        <button
          type="button"
          key={`seat-${seat.name}-${seat.zIndex}`}
          style={gridPlacementStyle}
          onClick={() => handleToggleSeat(seat)}
          onMouseEnter={() => setHoveredSeat(seat)}
          onMouseLeave={() => setHoveredSeat(null)}
          className={`${containerSizeClass} bg-[#13805b] text-white border-2 border-emerald-700 flex items-center justify-center cursor-pointer shadow-sm ring-2 ring-emerald-300/70 transition-all scale-[1.03] active:scale-95 relative`}
          title={`Seat ${seat.name} (${isSeat ? 'Seat' : 'Berth'}) - Selected (Base Fare: ₹${displayPrice}${gstVal > 0 ? ` + GST: ₹${gstVal}` : ''})`}
        >
          {/* Seat facing Front Driver (Left): Backrest on Right */}
          {isSeat && (
            <>
              <div className="absolute right-0.5 top-0.5 bottom-0.5 w-1 rounded-r-xs bg-white opacity-40 pointer-events-none" />
              <div className="absolute right-2 top-1 bottom-1 w-px bg-white opacity-25 pointer-events-none" />
              <div className="absolute left-0.5 top-1.5 bottom-1.5 w-0.5 rounded-full bg-white opacity-25 pointer-events-none" />
            </>
          )}

          {/* Sleeper pillow contour */}
          {!isSeat && !isVerticalBerth && (
            <>
              <div className="absolute left-1 top-1 bottom-1 w-1.5 rounded-xs border border-white opacity-50 pointer-events-none" />
              <div className="absolute left-3.5 top-1 bottom-1 w-px bg-white opacity-30 pointer-events-none" />
            </>
          )}
          {isVerticalBerth && (
            <>
              <div className="absolute top-1 left-1 right-1 h-1.5 rounded-xs border border-white opacity-50 pointer-events-none" />
              <div className="absolute top-3 left-1 right-1 h-px bg-white opacity-30 pointer-events-none" />
            </>
          )}

          <span className={`${priceTextClass} text-white`}>
            ₹{displayPrice}
          </span>
        </button>
      );
    }

    // 3. Available - Ladies Reserved Seat
    if (isLadies) {
      return (
        <button
          type="button"
          key={`seat-${seat.name}-${seat.zIndex}`}
          style={gridPlacementStyle}
          onClick={() => handleToggleSeat(seat)}
          onMouseEnter={() => setHoveredSeat(seat)}
          onMouseLeave={() => setHoveredSeat(null)}
          className={`${containerSizeClass} border-2 border-rose-400 bg-white text-rose-500 hover:bg-rose-50/40 hover:border-rose-500 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs relative ${
            isForced ? 'ring-2 ring-rose-300 animate-pulse' : ''
          }`}
          title={`Seat ${seat.name} (${isSeat ? 'Seat' : 'Berth'}) - Ladies Reserved (Base Fare: ₹${displayPrice}${gstVal > 0 ? ` + GST: ₹${gstVal}` : ''})`}
        >
          {/* Seat facing Front Driver (Left): Backrest on Right */}
          {isSeat && (
            <>
              <div className="absolute right-0.5 top-0.5 bottom-0.5 w-1 rounded-r-xs bg-rose-400 opacity-35 pointer-events-none" />
              <div className="absolute right-2 top-1 bottom-1 w-px bg-rose-300 opacity-25 pointer-events-none" />
              <div className="absolute left-0.5 top-1.5 bottom-1.5 w-0.5 rounded-full bg-rose-300 opacity-25 pointer-events-none" />
            </>
          )}

          {/* Sleeper pillow contour */}
          {!isSeat && !isVerticalBerth && (
            <>
              <div className="absolute left-1 top-1 bottom-1 w-1.5 rounded-xs border border-rose-400 opacity-40 pointer-events-none" />
              <div className="absolute left-3.5 top-1 bottom-1 w-px bg-rose-300 opacity-30 pointer-events-none" />
            </>
          )}
          {isVerticalBerth && (
            <>
              <div className="absolute top-1 left-1 right-1 h-1.5 rounded-xs border border-rose-400 opacity-40 pointer-events-none" />
              <div className="absolute top-3 left-1 right-1 h-px bg-rose-300 opacity-30 pointer-events-none" />
            </>
          )}

          <span className={`${priceTextClass} text-rose-600`}>
            ₹{displayPrice}
          </span>
        </button>
      );
    }

    // 4. Standard Available Seat / Berth
    return (
      <button
        type="button"
        key={`seat-${seat.name}-${seat.zIndex}`}
        style={gridPlacementStyle}
        onClick={() => handleToggleSeat(seat)}
        onMouseEnter={() => setHoveredSeat(seat)}
        onMouseLeave={() => setHoveredSeat(null)}
        className={`${containerSizeClass} border-2 border-gray-300 bg-white text-gray-400 hover:border-[#d84e55] hover:bg-red-50/20 hover:shadow-xs flex items-center justify-center cursor-pointer transition-all active:scale-95 relative`}
        title={`Seat ${seat.name} (${isSeat ? 'Seat' : 'Berth'}) - Base Fare: ₹${displayPrice}${gstVal > 0 ? ` (+ GST: ₹${gstVal} at checkout)` : ''}`}
      >
        {/* Seat facing Front Driver (Left): Backrest on Right */}
        {isSeat && (
          <>
            <div className="absolute right-0.5 top-0.5 bottom-0.5 w-1 rounded-r-xs bg-gray-400 opacity-35 pointer-events-none" />
            <div className="absolute right-2 top-1 bottom-1 w-px bg-gray-300 opacity-25 pointer-events-none" />
            <div className="absolute left-0.5 top-1.5 bottom-1.5 w-0.5 rounded-full bg-gray-300 opacity-20 pointer-events-none" />
          </>
        )}

        {/* Sleeper pillow contour */}
        {!isSeat && !isVerticalBerth && (
          <>
            <div className="absolute left-1 top-1 bottom-1 w-1.5 rounded-xs border border-gray-400 opacity-40 pointer-events-none" />
            <div className="absolute left-3.5 top-1 bottom-1 w-px bg-gray-300 opacity-30 pointer-events-none" />
          </>
        )}
        {isVerticalBerth && (
          <>
            <div className="absolute top-1 left-1 right-1 h-1.5 rounded-xs border border-gray-400 opacity-40 pointer-events-none" />
            <div className="absolute top-3 left-1 right-1 h-px bg-gray-300 opacity-30 pointer-events-none" />
          </>
        )}

        <span className={`${priceTextClass} text-gray-800`}>
          ₹{displayPrice}
        </span>
      </button>
    );
  };

  // Render Deck View Container using unified CSS Grid
  const renderDeckLayout = (deckSeats: RedBusSeatRaw[], deckTitle: string, isLowerDeck: boolean) => {
    if (!deckSeats || deckSeats.length === 0) return null;

    const availableCount = deckSeats.filter((s) => s.available === 'true' && !isEmergencyExit(s)).length;

    const realSeats = deckSeats.filter((s) => !isEmergencyExit(s));
    const hasBerths = realSeats.some((s) => {
      const l = parseInt(String(s.length), 10) || 1;
      const w = parseInt(String(s.width), 10) || 1;
      return l !== 1 || w !== 1;
    });
    const hasSeats = realSeats.some((s) => {
      const l = parseInt(String(s.length), 10) || 1;
      const w = parseInt(String(s.width), 10) || 1;
      return l === 1 && w === 1;
    });

    const deckTypeBadge =
      hasSeats && hasBerths
        ? 'Seats & Berths'
        : hasBerths
        ? 'Berths'
        : 'Seats';

    const deckIcon =
      hasBerths && !hasSeats
        ? 'bed'
        : hasSeats && !hasBerths
        ? 'airline_seat_recline_extra'
        : 'directions_bus';

    const minR = Math.min(...deckSeats.map((s) => parseInt(String(s.row), 10) || 0));
    const maxR = Math.max(
      ...deckSeats.map(
        (s) =>
          (parseInt(String(s.row), 10) || 0) +
          (parseInt(String(s.width), 10) || 1) -
          1
      )
    );

    interface WalkwayItem {
      row: number;
      gridRowIndex: number;
      colSpan: number;
    }

    const walkwayItems: WalkwayItem[] = [];
    const rowTrackStyles: string[] = [];

    for (let r = minR; r <= maxR; r++) {
      // Check standard seats (width === 1) that start in row r (excluding emergency exits)
      const standardSeatsInRow = deckSeats.filter((s) => {
        const sR = parseInt(String(s.row), 10) || 0;
        const sW = parseInt(String(s.width), 10) || 1;
        return sR === r && sW === 1 && !isEmergencyExit(s);
      });

      // Check all seats touching row r (including multi-row berths like L6 / U16, excluding emergency exits)
      const seatsTouchingRow = deckSeats.filter((s) => {
        const sR = parseInt(String(s.row), 10) || 0;
        const sW = parseInt(String(s.width), 10) || 1;
        return sR <= r && r < sR + sW && !isEmergencyExit(s);
      });

      // Check emergency exits touching row r
      const exitsTouchingRow = deckSeats.filter((s) => {
        const sR = parseInt(String(s.row), 10) || 0;
        const sW = parseInt(String(s.width), 10) || 1;
        return sR <= r && r < sR + sW && isEmergencyExit(s);
      });

      if (standardSeatsInRow.length === 0) {
        // Walkway aisle row!
        rowTrackStyles.push('var(--walk-h)');

        // Look for any rear vertical berth (width >= 2) that touches this row
        const rearSeat = seatsTouchingRow.find(
          (s) => (parseInt(String(s.width), 10) || 1) >= 2
        );
        let endCol = rearSeat ? (parseInt(String(rearSeat.column), 10) || 0) - 1 : globalMaxCol;

        // If emergency exit is at the rear of the walkway row, stop walkway before it so it stays empty space
        if (exitsTouchingRow.length > 0) {
          const minExitCol = Math.min(...exitsTouchingRow.map((s) => parseInt(String(s.column), 10) || 0));
          endCol = Math.min(endCol, minExitCol - 1);
        }

        const colSpan = Math.max(1, endCol - globalMinCol + 1);

        walkwayItems.push({
          row: r,
          gridRowIndex: r - minR + 1,
          colSpan
        });
      } else {
        // Row has standard seats
        const minColInRow = Math.min(
          ...standardSeatsInRow.map((s) => parseInt(String(s.column), 10) || 0)
        );
        if (minColInRow >= globalMinCol + 3) {
          // Rear seat only (like Royal Cruze middle seat at col 11): front part is aisle
          rowTrackStyles.push('var(--row-h)');
          walkwayItems.push({
            row: r,
            gridRowIndex: r - minR + 1,
            colSpan: minColInRow - globalMinCol
          });
        } else {
          rowTrackStyles.push('var(--row-h)');
        }
      }
    }

    return (
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-200/90 shadow-2xs space-y-2">
        {/* Deck Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-gray-800">
              {deckIcon}
            </span>
            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{deckTitle}</h4>
            <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
              {deckTypeBadge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {availableCount} Available
            </span>
          </div>
        </div>

        {/* Bus Coach Shell - Tightly wraps the bus with zero unnecessary empty space */}
        <div className="overflow-x-auto pb-0.5">
          <div className="inline-flex items-stretch gap-1.5 w-fit bg-linear-to-r from-gray-50 to-gray-100/70 p-1.5 sm:p-2 rounded-xl border border-gray-200/90 shadow-2xs">
            {/* Front Driver Cabin / Entrance */}
            <div className="w-8 sm:w-9 rounded-lg bg-gray-100/90 border border-gray-200 flex flex-col items-center justify-between py-1 shrink-0 select-none">
              <div className="text-center">
                <span className="material-symbols-outlined text-[16px] text-gray-500">
                  {isLowerDeck ? 'sports_volleyball' : 'panorama'}
                </span>
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest block leading-tight mt-0.5">
                  Front
                </span>
                {isLowerDeck && (
                  <span className="text-[7px] text-gray-400 block leading-tight">Driver</span>
                )}
              </div>

              {/* Passenger Entry Indicator - ONLY shown for Lower Deck */}
              {isLowerDeck && (
                <div className="text-center pt-0.5 border-t border-gray-200/70 w-full px-0.5">
                  <span className="material-symbols-outlined text-[12px] text-[#d84e55]">
                    sensor_door
                  </span>
                  <span className="text-[7px] font-bold text-gray-500 uppercase block">Entry</span>
                </div>
              )}
            </div>

            {/* Matrix Grid of seats and walkway aisles - compact, snug, matching RedBus */}
            <div
              className="grid gap-1 py-0.5 w-fit [--col-w:35px] sm:[--col-w:37px] [--row-h:35px] sm:[--row-h:37px] [--walk-h:18px] sm:[--walk-h:20px]"
              style={{
                gridTemplateColumns: `repeat(${totalBusCols}, var(--col-w))`,
                gridTemplateRows: rowTrackStyles.join(' '),
              }}
            >
              {/* Walkway aisles */}
              {walkwayItems.map((w) => (
                <div
                  key={`walkway-${w.row}`}
                  style={{
                    gridColumn: `1 / span ${w.colSpan}`,
                    gridRow: `${w.gridRowIndex} / span 1`,
                  }}
                  className="h-full flex items-center justify-center bg-gray-100/70 rounded-md border border-dashed border-gray-200/90 w-full px-2 select-none"
                >
                  <span className="text-[7px] font-bold uppercase tracking-widest text-gray-400">
                    Walkway
                  </span>
                </div>
              ))}

              {/* Seats and Berths */}
              {deckSeats.map((seat) => renderSeatItem(seat, globalMinCol, minR))}
            </div>

            {/* Back / Rear Indicator - snugly positioned directly behind last seat column */}
            <div className="w-5 sm:w-5.5 rounded-lg bg-gray-100/80 border border-gray-200 flex flex-col items-center justify-center py-1 shrink-0 select-none">
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest rotate-90 whitespace-nowrap">
                Back
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200/90 space-y-4 animate-fadeIn">
      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-10 border border-gray-200/80 text-center shadow-xs space-y-4">
          <div className="w-10 h-10 border-3 border-[#d84e55] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Fetching Live Seat Layout...</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Connecting directly to operator {bus.travels} live inventory system
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center shadow-xs">
          <span className="material-symbols-outlined text-[32px] text-red-500 mb-1">
            error_outline
          </span>
          <h4 className="font-bold text-red-900 text-sm mb-1">Could Not Load Seat Layout</h4>
          <p className="text-xs text-red-700 mb-3">{error}</p>
          <button
            type="button"
            onClick={loadLiveSeatLayout}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold cursor-pointer transition-colors"
          >
            Retry Live Call
          </button>
        </div>
      )}

      {/* Main Seat Layout Content */}
      {!isLoading && !error && tripDetails && (
        <div className="space-y-4">
          {/* Forced Seats Warning Banner (if active) */}
          {forcedSeatsAlert && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
                  notification_important
                </span>
                <span className="font-semibold">{forcedSeatsAlert}</span>
              </div>
              <button
                type="button"
                onClick={() => setForcedSeatsAlert(null)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Control Bar: Title & Legend */}
          <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-gray-800">directions_bus</span>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Select Your Seats</h4>
              <span className="text-[11px] text-gray-500 font-mono">
                ({(tripDetails.seats || []).filter((s) => s.available === 'true' && !isEmergencyExit(s)).length} seats available)
              </span>
            </div>

            {/* Seat Status Legend */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[10px] sm:text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3.5 rounded-r-md rounded-l-xs border-2 border-gray-300 bg-white shadow-2xs"></div>
                <span className="text-gray-600 font-medium">Available</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3.5 rounded-r-md rounded-l-xs bg-[#13805b] border-2 border-emerald-700 shadow-2xs"></div>
                <span className="text-gray-800 font-bold">Selected</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3.5 rounded-r-md rounded-l-xs border-2 border-rose-400 bg-white shadow-2xs"></div>
                <span className="text-rose-700 font-medium">Ladies Reserved</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3.5 rounded-r-md rounded-l-xs border-2 border-rose-400 bg-gray-300 shadow-2xs"></div>
                <span className="text-rose-700 font-medium">Ladies Booked</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3.5 rounded-r-md rounded-l-xs bg-gray-300 border-2 border-gray-400 shadow-2xs"></div>
                <span className="text-gray-600 font-medium">Booked / Sold</span>
              </div>
            </div>
          </div>

          {/* Always Render Both Decks by Default */}
          <div className="space-y-2.5">
            {hasLowerDeck && renderDeckLayout(lowerDeckSeats, 'Lower Deck', true)}
            {hasUpperDeck && renderDeckLayout(upperDeckSeats, 'Upper Deck', false)}
          </div>

          {/* Cancellation Policy Accordion (as per user instruction) */}
          <div className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#d84e55]">policy</span>
                <span className="text-xs font-bold text-gray-900">Cancellation Policy &amp; Refund Rules</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="text-[11px] font-medium">
                  {showCancellationPolicy ? 'Hide Details' : 'View Policy'}
                </span>
                <span className="material-symbols-outlined text-[18px]">
                  {showCancellationPolicy ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </button>

            {showCancellationPolicy && (
              <div className="p-5 pt-1 border-t border-gray-100 space-y-3 bg-gray-50/50">
                {cancellationPolicyRows.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    {tripDetails.cancellationPolicy || bus.cancellationPolicy || 'Standard bus operator cancellation policy applies.'}
                  </p>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-gray-50 px-4 py-2.5 font-bold text-gray-600 border-b border-gray-200">
                      <span className="col-span-7">Cancellation Cutoff</span>
                      <span className="col-span-3 text-right">Fee Deduction</span>
                      <span className="col-span-2 text-right">Refund Amount</span>
                    </div>
                    {cancellationPolicyRows.map((tier, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 px-4 py-2.5 border-b last:border-0 border-gray-100 items-center text-gray-700"
                      >
                        <span className="col-span-7 font-medium">{tier.timeDesc}</span>
                        <span className="col-span-3 text-right text-red-600 font-semibold">
                          {tier.deduction}
                        </span>
                        <span className="col-span-2 text-right text-emerald-700 font-semibold">
                          {tier.refund}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1">
                  <span>
                    Partial Cancellation: <strong>{bus.partialCancellationAllowed ? 'Allowed' : 'Not Allowed'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Max Seats per Booking: <strong>{maxSeatsAllowed}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Selected Seats Summary & Proceed Action Bar */}
          <div className="bg-white p-5 rounded-3xl border-2 border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Selected Seats ({selectedSeatList.length} of {maxSeatsAllowed} max)
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedSeatList.length > 0 ? (
                  selectedSeatList.map((s) => {
                    const bf = typeof s.baseFare === 'number' ? s.baseFare : parseFloat(String(s.baseFare)) || 0;
                    const f = typeof s.fare === 'number' ? s.fare : parseFloat(String(s.fare)) || 0;
                    const seatBaseVal = Math.round(bf > 0 ? bf : f);
                    return (
                      <span
                        key={`sel-${s.name}-${s.zIndex}`}
                        className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs font-mono"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] opacity-90 font-normal">₹{seatBaseVal}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSeat(s)}
                          className="hover:text-red-200 ml-1 cursor-pointer"
                          title="Remove seat"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    Click on any available seat above to select
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Base Fare</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900 font-mono">
                  ₹{Math.round(totalBaseFare)}
                </span>
                <span className="text-[10px] text-gray-400 block font-light">+ GST added at payment</span>
              </div>

              <button
                type="button"
                disabled={selectedSeatList.length === 0}
                onClick={handleProceed}
                className={`px-7 py-3 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer ${
                  selectedSeatList.length > 0
                    ? 'bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] text-white hover:shadow-md active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Continue to Booking</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
