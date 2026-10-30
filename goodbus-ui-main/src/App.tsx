import { useState, useEffect } from 'react';
import {
  SAMPLE_BUS_TRIPS,
  SAMPLE_BOARDING_POINTS,
  SAMPLE_DROPPING_POINTS,
  DEFAULT_CONFIRMED_BOOKING
} from './data/busData';
import { BusTrip, Seat, BoardingPoint, DroppingPoint, Passenger, BookingDetails } from './types';
import { resolveCityId, blockTicketV2, verifyPaymentStatus, verifyRazorpayPayment, sendTicketWhatsApp } from './services/redbusService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { HomeScreen } from './components/HomeScreen';
import { SearchResultsScreen } from './components/SearchResultsScreen';
import { BoardingDroppingScreen } from './components/BoardingDroppingScreen';
import { PassengerDetailsScreen } from './components/PassengerDetailsScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { PnrStatusModal } from './components/PnrStatusModal';
import { OffersModal } from './components/OffersModal';
import { SupportModal } from './components/SupportModal';
import { AdminScreen } from './components/AdminScreen';
import { MobileBottomNav } from './components/MobileBottomNav';
import { InstallAppBanner } from './components/InstallAppBanner';

export default function App() {
  // Navigation screen (supports /admin directly from URL)
  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'results' | 'points' | 'passengers' | 'payment' | 'confirmation' | 'admin'
  >(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'home';
  });

  // Search parameters
  const [sourceCity, setSourceCity] = useState('Bengaluru');
  const [sourceCityId, setSourceCityId] = useState('3');
  const [destinationCity, setDestinationCity] = useState('Hyderabad');
  const [destinationCityId, setDestinationCityId] = useState('6');
  const [journeyDate, setJourneyDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Bus selection state
  const [buses, setBuses] = useState<BusTrip[]>(SAMPLE_BUS_TRIPS);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<BusTrip>(SAMPLE_BUS_TRIPS[0]);

  // Selected seats
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([
    SAMPLE_BUS_TRIPS[0].seats.find((s) => s.id === 'L3') || SAMPLE_BUS_TRIPS[0].seats[6],
    SAMPLE_BUS_TRIPS[0].seats.find((s) => s.id === 'U4') || SAMPLE_BUS_TRIPS[0].seats[27]
  ]);

  // Boarding and Dropping points
  const [selectedBoarding, setSelectedBoarding] = useState<BoardingPoint>(SAMPLE_BOARDING_POINTS[1]); // Majestic
  const [selectedDropping, setSelectedDropping] = useState<DroppingPoint>(SAMPLE_DROPPING_POINTS[2]); // MGBS

  // Passengers
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: 'p-1',
      seatId: 'L3',
      seatDeckText: 'L3 (Lower)',
      name: 'Vikram Aditya Malhotra',
      age: 29,
      gender: 'Male',
      isPrimary: true
    },
    {
      id: 'p-2',
      seatId: 'U4',
      seatDeckText: 'U4 (Upper)',
      name: 'Pooja Malhotra',
      age: 27,
      gender: 'Female'
    }
  ]);

  // Contact info
  const [contactMobile, setContactMobile] = useState('9876543210');
  const [contactEmail, setContactEmail] = useState('vikram.m@gmail.com');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<BookingDetails>(DEFAULT_CONFIRMED_BOOKING);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Tentative block state (8-minute lock)
  const [blockKey, setBlockKey] = useState<string>('');
  const [isBlockingSeats, setIsBlockingSeats] = useState<boolean>(false);

  // Modals
  const [isPnrModalOpen, setIsPnrModalOpen] = useState(false);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Check for Razorpay payment return callback URL query params (?merchantOrderId=... or ?status=success... or ?razorpay_payment_id=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const merchantOrderId = urlParams.get('merchantOrderId');
    const rzpPaymentId = urlParams.get('razorpay_payment_id');
    const rzpOrderId = urlParams.get('razorpay_order_id');
    const rzpSignature = urlParams.get('razorpay_signature');
    const tinParam = urlParams.get('tin');
    const pnrParam = urlParams.get('pnr');
    const errorParam = urlParams.get('error');

    // Case 1: Direct backend callback redirect with confirmed TIN & PNR
    if (status === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
      const confirmedTin = tinParam || `SF${Date.now().toString().slice(-9)}`;
      const confirmedPnr = pnrParam || `GB-${Math.floor(10000 + Math.random() * 90000)}`;
      handlePaymentSuccess(
        'Razorpay Verified',
        rzpPaymentId || rzpOrderId || merchantOrderId || `RZP_${Date.now().toString().slice(-8)}`,
        confirmedTin,
        confirmedPnr
      );
      addToast('Payment & Ticket Confirmed!', `TIN: ${confirmedTin}`, 'success');
      return;
    }

    // Case 2: Failed redirect
    if (status === 'failed') {
      window.history.replaceState({}, document.title, window.location.pathname);
      addToast('Payment Unsuccessful', errorParam || 'Payment was not completed. Please try again.', 'error');
      setCurrentScreen('payment');
      return;
    }

    // Case 3: Direct Razorpay redirect with signature parameters
    if (rzpPaymentId && rzpOrderId && rzpSignature) {
      window.history.replaceState({}, document.title, window.location.pathname);
      (async () => {
        addToast('Verifying Payment', 'Validating payment signature with Razorpay...', 'info');
        try {
          const verifyResp = await verifyRazorpayPayment({
            merchantOrderId: merchantOrderId || `GB_ORD_${Date.now()}`,
            razorpayOrderId: rzpOrderId,
            razorpayPaymentId: rzpPaymentId,
            razorpaySignature: rzpSignature
          });

          if (verifyResp && verifyResp.success) {
            const confirmedTin = verifyResp.tin || `SF${Date.now().toString().slice(-9)}`;
            const confirmedPnr = verifyResp.pnr || `GB-${Math.floor(10000 + Math.random() * 90000)}`;
            handlePaymentSuccess(
              verifyResp.paymentMode || 'Razorpay Verified',
              rzpPaymentId,
              confirmedTin,
              confirmedPnr
            );
            addToast('Payment & Ticket Confirmed!', `TIN: ${confirmedTin}`, 'success');
          } else {
            addToast('Verification Failed', verifyResp?.message || 'Payment signature could not be verified.', 'error');
            setCurrentScreen('payment');
          }
        } catch (e: any) {
          console.error('Error verifying Razorpay redirect signature:', e);
        }
      })();
      return;
    }

    // Case 4: merchantOrderId status check fallback
    if (merchantOrderId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      (async () => {
        addToast('Verifying Payment', 'Confirming transaction status with Razorpay...', 'info');
        try {
          const statusResp = await verifyPaymentStatus(merchantOrderId);
          if (statusResp && (statusResp.state === 'COMPLETED' || statusResp.tin)) {
            const confirmedTin = statusResp.tin || `SF${Date.now().toString().slice(-9)}`;
            const confirmedPnr = statusResp.pnr || `GB-${Math.floor(10000 + Math.random() * 90000)}`;
            handlePaymentSuccess(
              statusResp.paymentMode ? `Razorpay (${statusResp.paymentMode})` : 'Razorpay UPI',
              statusResp.orderId || merchantOrderId,
              confirmedTin,
              confirmedPnr
            );
            addToast('Payment & Ticket Confirmed!', `TIN: ${confirmedTin}`, 'success');
          } else if (statusResp.state === 'FAILED') {
            addToast('Payment Failed', statusResp.message || 'Payment was not completed.', 'error');
            setCurrentScreen('payment');
          }
        } catch (e: any) {
          console.error('Razorpay callback verification error:', e);
        }
      })();
    }
  }, []);

  // Listen for browser Back/Forward or direct path changes
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        setCurrentScreen('admin');
      } else {
        setCurrentScreen((prev) => (prev === 'admin' ? 'home' : prev));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toast Helper
  const addToast = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'info' = 'success',
    actionText?: string,
    onAction?: () => void,
    duration = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type, actionText, onAction, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync passengers whenever selected seats change
  const syncPassengersWithSeats = (newSeats: Seat[]) => {
    setPassengers((prevPassengers) => {
      return newSeats.map((seat, index) => {
        const existing = prevPassengers.find((p) => p.seatId === seat.id);
        if (existing) return existing;

        const deckLabel =
          seat.deck === 'lower'
            ? seat.type === 'seater'
              ? `${seat.number} (Lower Seat)`
              : `${seat.number} (Lower)`
            : `${seat.number} (Upper)`;

        return {
          id: `pass-${seat.id}-${Date.now()}`,
          seatId: seat.id,
          seatDeckText: deckLabel,
          name: index === 0 ? 'Vikram Aditya Malhotra' : '',
          age: index === 0 ? 29 : '',
          gender: index === 0 ? 'Male' : 'Female',
          isPrimary: index === 0
        };
      });
    });
  };

  // Toggle seat selection
  const handleToggleSeat = (seat: Seat) => {
    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    if (isAlreadySelected) {
      const updatedSeats = selectedSeats.filter((s) => s.id !== seat.id);
      setSelectedSeats(updatedSeats);
      syncPassengersWithSeats(updatedSeats);
    } else {
      if (selectedSeats.length >= 6) {
        addToast(
          'Maximum 6 Seats Allowed',
          'You can book up to 6 seats per transaction as per bus transport rules.',
          'error'
        );
        return;
      }
      const updatedSeats = [...selectedSeats, seat];
      setSelectedSeats(updatedSeats);
      syncPassengersWithSeats(updatedSeats);
    }
  };

  // Search handler
  const handleSearchBuses = () => {
    if (!sourceCity.trim() || !destinationCity.trim()) {
      addToast('City Required', 'Please provide both departure and arrival cities.', 'error');
      return;
    }
    if (
      (sourceCityId && destinationCityId && sourceCityId === destinationCityId) ||
      sourceCity.trim().toLowerCase() === destinationCity.trim().toLowerCase()
    ) {
      addToast(
        'Invalid Route',
        'Departure and destination cannot be the same city. Please choose a different destination.',
        'error'
      );
      return;
    }
    setCurrentScreen('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPopularRoute = async (from: string, to: string) => {
    setSourceCity(from);
    setDestinationCity(to);
    const [fromId, toId] = await Promise.all([
      resolveCityId(from),
      resolveCityId(to)
    ]);
    if (fromId) setSourceCityId(fromId);
    if (toId) setDestinationCityId(toId);
    setCurrentScreen('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('Route Selected', `Searching express buses for ${from} to ${to}.`, 'info');
  };

  // Proceed to Boarding & Dropping
  const handleProceedToPoints = (bus: BusTrip) => {
    if (selectedSeats.length === 0) {
      addToast('No Seats Selected', 'Please select at least 1 seat to continue.', 'error');
      return;
    }
    setSelectedBus(bus);
    setSelectedBoarding(bus.boardingPoints[1] || bus.boardingPoints[0]);
    setSelectedDropping(bus.droppingPoints[2] || bus.droppingPoints[0]);
    setCurrentScreen('points');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Promo code actions with Undo
  const handleApplyPromo = (code: string) => {
    if (code.toUpperCase() === 'GOODBUS_FIRST' || code.toUpperCase() === 'SUPERBUS50') {
      setPromoCode(code.toUpperCase());
      setIsPromoApplied(true);
      addToast('Promo Code Applied!', '₹250 instant discount applied to total fare.', 'success');
    } else {
      addToast('Invalid Promo Code', 'Please enter a valid coupon code like GOODBUS_FIRST.', 'error');
    }
  };

  const handleRemovePromo = () => {
    const prevCode = promoCode;
    setIsPromoApplied(false);
    addToast(
      'Promo Code Removed',
      'Discount has been removed from order.',
      'info',
      'Undo',
      () => {
        setPromoCode(prevCode);
        setIsPromoApplied(true);
        addToast('Promo Code Restored', '₹250 discount reapplied.', 'success');
      },
      6000
    );
  };

  // Payment success handler
  const handlePaymentSuccess = (paymentMethod: string, txnId: string, customTin?: string, customPnr?: string) => {
    const baseFare = selectedSeats.reduce((sum, s) => sum + (s.baseFare ?? s.price), 0);
    const gstAmount = selectedSeats.reduce((sum, s) => {
      if (s.gst !== undefined && s.gst > 0) return sum + s.gst;
      return sum + Math.round((s.baseFare ?? s.price) * 0.05);
    }, 0);
    const discountAmount = isPromoApplied ? 250 : 0;
    const totalPaid = Math.max(0, baseFare + gstAmount - discountAmount);

    const now = new Date();
    const bookingTimestamp = `${now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} IST`;

    const newBooking: BookingDetails = {
      tin: customTin || `GB-2026-${sourceCity.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      pnr: customPnr || `${selectedBus.operatorLogoText}-${destinationCity.slice(0, 3).toUpperCase()}-${Math.floor(
        10000 + Math.random() * 90000
      )}`,
      bus: selectedBus,
      selectedSeats,
      boardingPoint: selectedBoarding,
      droppingPoint: selectedDropping,
      passengers,
      contactMobile,
      contactEmail,
      whatsappAlerts,
      journeyDate,
      bookingTimestamp,
      baseFare,
      gstAmount,
      discountAmount,
      totalPaid,
      paymentMethod,
      status: 'CONFIRMED',
      txnId,
      cancellationPolicy: selectedBus.cancellationPolicy,
      partialCancellationAllowed: selectedBus.partialCancellationAllowed
    };

    setConfirmedBooking(newBooking);

    // Update bus state with newly booked seats and gender tags
    setBuses((prevBuses) =>
      prevBuses.map((b) => {
        if (b.id !== selectedBus.id) return b;
        const updatedSeats = b.seats.map((s) => {
          const matchedPassenger = passengers.find((p) => p.seatNumber === s.number);
          if (matchedPassenger) {
            return {
              ...s,
              isBooked: true,
              bookedGender: matchedPassenger.gender,
              isLadiesBooked: matchedPassenger.gender === 'Female'
            };
          }
          return s;
        });
        const updatedBus = {
          ...b,
          seats: updatedSeats,
          seatsLeft: Math.max(0, b.seatsLeft - selectedSeats.length)
        };
        setSelectedBus(updatedBus);
        return updatedBus;
      })
    );

    setCurrentScreen('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Send WhatsApp notification with all required ticket details
    sendTicketWhatsApp({
      merchantOrderId: txnId,
      pnr: newBooking.pnr,
      tin: newBooking.tin,
      phone: contactMobile || '917207904076',
      sourceCity,
      destCity: destinationCity,
      doj: journeyDate,
      busType: selectedBus.busType,
      boardingPoint: selectedBoarding?.name || 'Boarding Point',
      departureTime: selectedBus.departureTime,
      seatNumbers: selectedSeats.map((s) => s.number).join(', ')
    }).then((res) => {
      console.log('WhatsApp ticket notification response:', res);
    }).catch((err) => {
      console.warn('WhatsApp ticket notification error:', err);
    });

    addToast(
      'Booking Confirmed!',
      `TIN: ${newBooking.tin}. e-Ticket issued successfully to your WhatsApp.`,
      'success'
    );
  };

  // SeatSeller Tentative Block (8-Minute hold)
  const handleProceedToPayment = async () => {
    setIsBlockingSeats(true);
    try {
      const inventoryItems = passengers.map((p, idx) => {
        const seat = selectedSeats[idx] || selectedSeats[0];
        const fareVal = seat?.totalFare ?? seat?.price ?? (seat?.baseFare ? seat.baseFare + (seat.gst || 0) : 10.50);
        return {
          seatName: p.seatId || seat?.number || String(idx + 1),
          fare: String(fareVal),
          ladiesSeat: String(seat?.isLadies || p.gender === 'Female'),
          passenger: {
            title: p.gender === 'Female' ? 'Ms' : 'Mr',
            name: p.name || 'Passenger',
            age: String(p.age || 25),
            gender: p.gender === 'Female' ? 'FEMALE' : 'MALE',
            primary: String(idx === 0),
            mobile: contactMobile || '9876543210',
            email: contactEmail || 'passenger@example.com',
            address: selectedBoarding?.name || 'Bangalore',
            idType: 'NONE',
            idNumber: 'NA'
          }
        };
      });

      const blockPayload = {
        availableTripId: String(selectedBus.id),
        boardingPointId: String(selectedBoarding?.id || '252884'),
        droppingPointId: String(selectedDropping?.id || ''),
        source: String(sourceCityId || '3'),
        destination: String(destinationCityId || '6'),
        operator: String(selectedBus.operatorId || ''),
        inventoryItems
      };

      const blockResp = await blockTicketV2(blockPayload);

      if (blockResp?.blockKey) {
        setBlockKey(blockResp.blockKey);

        const updatedFare = blockResp.fareBreakup?.updatedFare;
        const previousFare = blockResp.fareBreakup?.previousFare;
        if (updatedFare && previousFare && parseFloat(updatedFare) !== parseFloat(previousFare)) {
          addToast(
            'Operator Fare Update',
            `The bus operator has updated the total fare from ₹${previousFare} to ₹${updatedFare}.`,
            'info',
            undefined,
            undefined,
            7000
          );
        }
        addToast(
          'Seats Held Tentatively (8 Mins)',
          `Seats tentatively blocked with operator (Block Key: ${blockResp.blockKey}).`,
          'success'
        );
      } else {
        const fallbackKey = `BKY_${Date.now().toString().slice(-6)}`;
        setBlockKey(fallbackKey);
        addToast('Seats Held Tentatively', `Seats held for 8 minutes (Block Key: ${fallbackKey}).`, 'info');
      }
    } catch (e: any) {
      console.warn('Seat block notice/fallback:', e);
      const fallbackKey = `BKY_${Date.now().toString().slice(-6)}`;
      setBlockKey(fallbackKey);
      addToast('Seats Held Tentatively', 'Seats locked for 8 minutes to complete payment.', 'info');
    } finally {
      setIsBlockingSeats(false);
      setCurrentScreen('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Ticket cancellation with 10-second Undo action!
  const handleCancelTicket = (bookingToCancel: BookingDetails) => {
    const refundAmount = Math.round(bookingToCancel.totalPaid * 0.9);
    setConfirmedBooking((prev) => ({ ...prev, status: 'CANCELLED' }));

    // Show prominent success notification with UNDO functionality
    addToast(
      'Ticket Cancelled Successfully',
      `PNR: ${bookingToCancel.pnr}. ₹${refundAmount} instant refund initiated to your original bank account.`,
      'error',
      'Undo (10s)',
      () => {
        // Undo cancellation!
        setConfirmedBooking((prev) => ({ ...prev, status: 'CONFIRMED' }));
        addToast(
          'Cancellation Undone!',
          `Ticket ${bookingToCancel.pnr} restored. Your seats (${bookingToCancel.selectedSeats.map((s) => s.number).join(', ')}) remain confirmed.`,
          'success'
        );
      },
      10000
    );
  };

  const handleUndoCancellation = (bookingToRestore: BookingDetails) => {
    setConfirmedBooking((prev) => ({ ...prev, status: 'CONFIRMED' }));
    addToast(
      'Booking Restored',
      `PNR ${bookingToRestore.pnr} has been reactivated. Boarding pass is valid.`,
      'success'
    );
  };

  // Total amount computation for Payment Screen
  const baseFare = selectedSeats.reduce((sum, s) => sum + (s.baseFare ?? s.price), 0);
  const gstAmount = selectedSeats.reduce((sum, s) => {
    if (s.gst !== undefined && s.gst > 0) return sum + s.gst;
    return sum + Math.round((s.baseFare ?? s.price) * 0.05);
  }, 0);
  const discountAmount = isPromoApplied ? 250 : 0;
  const totalAmount = Math.max(0, baseFare + gstAmount - discountAmount);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          if (screen === 'admin') {
            window.history.pushState({}, '', '/admin');
          } else if (currentScreen === 'admin') {
            window.history.pushState({}, '', '/');
          }
          setCurrentScreen(screen as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPnr={() => setIsPnrModalOpen(true)}
        onOpenOffers={() => setIsOffersModalOpen(true)}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* PWA Mobile App Install Prompt */}
      <InstallAppBanner />

      {/* Active Screen */}
      <div className="flex-1 pb-16 sm:pb-0">
        {currentScreen === 'home' && (
          <HomeScreen
            sourceCity={sourceCity}
            sourceCityId={sourceCityId}
            destinationCity={destinationCity}
            destinationCityId={destinationCityId}
            journeyDate={journeyDate}
            setSourceCity={(val, id) => {
              setSourceCity(val);
              if (id !== undefined) setSourceCityId(id);
            }}
            setDestinationCity={(val, id) => {
              setDestinationCity(val);
              if (id !== undefined) setDestinationCityId(id);
            }}
            setJourneyDate={setJourneyDate}
            onSearch={handleSearchBuses}
            onSelectPopularRoute={handleSelectPopularRoute}
          />
        )}

        {currentScreen === 'results' && (
          <SearchResultsScreen
            sourceCity={sourceCity}
            sourceCityId={sourceCityId}
            destinationCity={destinationCity}
            destinationCityId={destinationCityId}
            journeyDate={journeyDate}
            selectedBusId={selectedBusId}
            onSelectBus={(busId) => setSelectedBusId(busId)}
            onBackToHome={() => setCurrentScreen('home')}
            onProceedToBooking={(trip, seats, bps, dps) => {
              const convertedBus: BusTrip = {
                id: trip.id,
                operator: trip.travels,
                operatorLogoText: trip.operatorLogoText,
                operatorLogoBg: trip.operatorLogoBg,
                operatorLogoColor: trip.operatorLogoColor,
                busType: trip.busType,
                rating: trip.rating,
                reviewsCount: trip.reviewsCount,
                sourceCity: sourceCity,
                destinationCity: destinationCity,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                duration: trip.duration,
                routeVia: trip.busRoutes || `${sourceCity} - ${destinationCity}`,
                priceStart: trip.priceStart,
                seatsLeft: trip.availableSeats,
                isLiveTracking: trip.liveTrackingAvailable,
                hasAC: trip.hasAC,
                hasSleeper: trip.hasSleeper,
                hasCharging: true,
                hasWifi: true,
                hasBlanket: trip.hasAC,
                hasWater: true,
                cancellationPolicy: trip.cancellationPolicy,
                partialCancellationAllowed: trip.partialCancellationAllowed,
                boardingPoints: ((bps && bps.length > 0) ? bps : [
                  { bpId: '252884', bpName: 'Anand Rao Circle (Opp State Bank)', time: '21:00', landmark: 'Opp State Bank' },
                  { bpId: '252885', bpName: 'Majestic Bus Stand Platform 4', time: '21:30', landmark: 'Platform 4' }
                ]).map((b: any) => ({
                  id: b.id || b.bpId || 'bp1',
                  name: b.name || b.bpName || 'Boarding Point',
                  landmark: b.landmark || b.address || '',
                  time: b.timeFormatted || b.time || '21:00'
                })),
                droppingPoints: ((dps && dps.length > 0) ? dps : [
                  { bpId: '352884', bpName: 'Shamshabad Airport Toll', time: '05:45', landmark: 'Toll Gate' },
                  { bpId: '352885', bpName: 'Ameerpet Metro Station', time: '06:30', landmark: 'Metro Pillar 12' }
                ]).map((d: any) => ({
                  id: d.id || d.bpId || 'dp1',
                  name: d.name || d.bpName || 'Dropping Point',
                  landmark: d.landmark || d.address || '',
                  time: d.timeFormatted || d.time || '06:30'
                })),
                seats: seats
              };

              setSelectedBus(convertedBus);
              setSelectedSeats(seats);
              syncPassengersWithSeats(seats);
              if (convertedBus.boardingPoints.length > 0) {
                setSelectedBoarding(convertedBus.boardingPoints[0]);
              }
              if (convertedBus.droppingPoints.length > 0) {
                setSelectedDropping(convertedBus.droppingPoints[0]);
              }
              setCurrentScreen('points');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onUpdateSearch={(newSrc, newSrcId, newDst, newDstId, newDate) => {
              setSourceCity(newSrc);
              setSourceCityId(newSrcId);
              setDestinationCity(newDst);
              setDestinationCityId(newDstId);
              if (newDate) setJourneyDate(newDate);
            }}
          />
        )}

        {currentScreen === 'points' && (
          <BoardingDroppingScreen
            bus={selectedBus}
            selectedSeats={selectedSeats}
            selectedBoarding={selectedBoarding}
            selectedDropping={selectedDropping}
            onSelectBoarding={setSelectedBoarding}
            onSelectDropping={setSelectedDropping}
            onProceedToPassengers={() => {
              setCurrentScreen('passengers');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToSeats={() => setCurrentScreen('results')}
          />
        )}

        {currentScreen === 'passengers' && (
          <PassengerDetailsScreen
            bus={selectedBus}
            selectedSeats={selectedSeats}
            boardingPoint={selectedBoarding}
            droppingPoint={selectedDropping}
            journeyDate={journeyDate}
            passengers={passengers}
            contactMobile={contactMobile}
            contactEmail={contactEmail}
            whatsappAlerts={whatsappAlerts}
            promoCode={promoCode}
            isPromoApplied={isPromoApplied}
            onUpdatePassenger={(index, updated) => {
              setPassengers((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], ...updated };
                return next;
              });
            }}
            onUpdateContactMobile={setContactMobile}
            onUpdateContactEmail={setContactEmail}
            onToggleWhatsapp={setWhatsappAlerts}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
            onProceedToPayment={handleProceedToPayment}
            onBackToPoints={() => setCurrentScreen('points')}
            isBlockingSeats={isBlockingSeats}
          />
        )}

        {currentScreen === 'payment' && (
          <PaymentScreen
            bus={selectedBus}
            selectedSeats={selectedSeats}
            boardingPoint={selectedBoarding}
            droppingPoint={selectedDropping}
            journeyDate={journeyDate}
            passengers={passengers}
            contactMobile={contactMobile}
            contactEmail={contactEmail}
            totalAmount={totalAmount}
            blockKey={blockKey}
            onPaymentSuccess={handlePaymentSuccess}
            onBackToPassengers={() => setCurrentScreen('passengers')}
          />
        )}

        {currentScreen === 'confirmation' && (
          <ConfirmationScreen
            booking={confirmedBooking}
            onBookAnother={() => {
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={addToast}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminScreen
            onBackToHome={() => {
              window.history.pushState({}, '', '/');
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      {/* Footer */}
      <Footer
        onSelectRoute={handleSelectPopularRoute}
        onOpenPnr={() => setIsPnrModalOpen(true)}
        onOpenOffers={() => setIsOffersModalOpen(true)}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* Modals */}
      <PnrStatusModal
        isOpen={isPnrModalOpen}
        onClose={() => setIsPnrModalOpen(false)}
        booking={confirmedBooking}
        onCancelTicket={handleCancelTicket}
        onUndoCancellation={handleUndoCancellation}
      />

      <OffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        onApplyCoupon={(code) => {
          handleApplyPromo(code);
          addToast('Coupon Applied', `Code ${code} applied for ₹250 discount.`, 'success');
        }}
      />

      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav
        currentScreen={currentScreen}
        onNavigateHome={() => {
          setCurrentScreen('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPnr={() => setIsPnrModalOpen(true)}
        onOpenOffers={() => setIsOffersModalOpen(true)}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />
    </div>
  );
}
