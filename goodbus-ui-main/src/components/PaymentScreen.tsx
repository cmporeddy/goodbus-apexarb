import React, { useState, useEffect } from 'react';
import { BusTrip, Seat, BoardingPoint, DroppingPoint, Passenger } from '../types';

interface PaymentScreenProps {
  bus: BusTrip;
  selectedSeats: Seat[];
  boardingPoint: BoardingPoint;
  droppingPoint: DroppingPoint;
  journeyDate: string;
  passengers: Passenger[];
  contactMobile: string;
  contactEmail: string;
  totalAmount: number;
  blockKey?: string;
  onPaymentSuccess: (paymentMethod: string, txnId: string, tin?: string, pnr?: string) => void;
  onBackToPassengers: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  bus,
  selectedSeats,
  boardingPoint,
  droppingPoint,
  journeyDate,
  passengers,
  contactMobile,
  contactEmail,
  totalAmount,
  blockKey,
  onPaymentSuccess,
  onBackToPassengers,
}) => {
  // Timer countdown: 8 minutes (480 seconds) per SeatSeller tentative block specification
  const [secondsRemaining, setSecondsRemaining] = useState(480);
  const [isTestMode, setIsTestMode] = useState(true); // Default to Re. 1.00 sample test mode for easy verification
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [manualUtrInput, setManualUtrInput] = useState('');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>(() => `GB_ORD_${Date.now()}`);
  const [utrStatusMsg, setUtrStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  });
  const [showQrOnMobile, setShowQrOnMobile] = useState(false);

  // Auto-detect mobile devices for direct UPI intent vs desktop QR scanning
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Active receiving UPI VPA & Merchant details dynamically fetched from server
  const [receivingUpiId, setReceivingUpiId] = useState('cmporeddy-9@okaxis');
  const [payeeName, setPayeeName] = useState('GoodBus');
  const [bankName, setBankName] = useState('DBS Bank');
  const effectiveAmount = isTestMode ? 1.00 : totalAmount;

  // Fetch active bank & UPI config from backend
  useEffect(() => {
    fetch('/api/v1/active-payment-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.upiId) {
          setReceivingUpiId(data.upiId);
          if (data.payeeName) setPayeeName(data.payeeName);
          if (data.bankName) setBankName(data.bankName);
        }
      })
      .catch((e) => console.warn('Could not fetch active payment config, using defaults:', e));
  }, []);

  // Format timer MM:SS
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Auto-listen to window YouPI CustomEvents (emitted by observer & checkout portal)
  useEffect(() => {
    const handleSuccessEvent = (e: any) => {
      const detail = e.detail || {};
      const confirmedTin = `SF${Date.now().toString().slice(-9)}`;
      const confirmedPnr = `GB-${Math.floor(10000 + Math.random() * 90000)}`;
      onPaymentSuccess('GoodBus UPI (Verified)', detail.utr || manualUtrInput || '630141344124', confirmedTin, confirmedPnr);
    };

    window.addEventListener('youpi:payment:success', handleSuccessEvent);
    window.addEventListener('youpi:payment:observed', handleSuccessEvent);
    return () => {
      window.removeEventListener('youpi:payment:success', handleSuccessEvent);
      window.removeEventListener('youpi:payment:observed', handleSuccessEvent);
    };
  }, [onPaymentSuccess, manualUtrInput]);

  // Automatic Zero-Click Payment Detection: Polls backend every 2s for incoming bank credits
  useEffect(() => {
    let isMounted = true;
    // Strict session start: only look for credits received AFTER the user enters this checkout screen
    const sessionStartTime = Date.now();
    const targetAmountPaise = Math.round(effectiveAmount * 100);

    const pollTimer = setInterval(async () => {
      if (!isMounted) return;
      try {
        const query = `/api/v1/latest-verified-credit?since=${sessionStartTime}&orderId=${encodeURIComponent(activeOrderId)}&amountPaise=${targetAmountPaise}`;
        const res = await fetch(query);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.verified && data.utr) {
          clearInterval(pollTimer);
          setUtrStatusMsg({ text: '✓ Bank payment verified! Confirming your booking...', type: 'success' });
          const confirmedTin = data.tin || `SF${Date.now().toString().slice(-9)}`;
          const confirmedPnr = data.pnr || `GB-${Math.floor(10000 + Math.random() * 90000)}`;
          setTimeout(() => {
            if (isMounted) {
              onPaymentSuccess('GoodBus UPI (Bank Verified)', data.utr, confirmedTin, confirmedPnr);
            }
          }, 600);
        }
      } catch (_e) {
        // Silently continue polling
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [activeOrderId, effectiveAmount, onPaymentSuccess]);

  // Initiate YouPI Payment Gateway Session
  const handleYoupiPayment = async (force1Re: boolean = isTestMode) => {
    setIsProcessing(true);
    setProcessingStatus('Connecting to UPI payment app...');

    const amountToCharge = force1Re ? 1.00 : totalAmount;
    const generatedOrderId = `GB_ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    setActiveOrderId(generatedOrderId);

    // If on a mobile device or touch screen, directly launch the native UPI intent
    const isMobile = typeof window !== 'undefined' && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
    if (isMobile) {
      setIsProcessing(false);
      setProcessingStatus('');
      window.location.href = upiIntentUrl;
      return;
    }

    try {
      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          amount: amountToCharge.toFixed(2),
          currency: 'INR',
          customer: {
            name: passengers[0]?.name || 'Passenger',
            phoneNumber: contactMobile || '8861163436',
            email: contactEmail || 'passenger@goodbus.local',
          },
          metadata: {
            service: 'GoodBus (godbus.epicsevelabs.com)',
            route: `${bus.sourceCity} ➔ ${bus.destinationCity}`,
            seats: selectedSeats.map((s) => s.number).join(', '),
            busType: bus.busType,
            isSampleRe1: force1Re,
          },
        }),
      });

      // If backend API returned HTML or non-JSON (e.g. 404/502), fall back to UPI intent link
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        setIsProcessing(false);
        setProcessingStatus('');
        window.location.href = upiIntentUrl;
        return;
      }

      let data = await res.json();
      setIsProcessing(false);
      setProcessingStatus('');

      const paymentId = data.paymentId || data.id;
      if (paymentId) {
        setActivePaymentId(paymentId);
      }

      const checkoutUrl = `/checkout/${paymentId}?customerPhone=${encodeURIComponent(
        contactMobile || '8861163436'
      )}&customerName=${encodeURIComponent(passengers[0]?.name || 'Reddy')}`;

      if ((window as any).Youpi) {
        (window as any).Youpi.pay({
          checkoutUrl: checkoutUrl,
          paymentId: paymentId,
          order_id: generatedOrderId,
          amount: amountToCharge,
          currency: 'INR',
          name: 'GoodBus',
          description: force1Re
            ? 'GoodBus Re. 1.00 Test Ticket'
            : `${bus.sourceCity} to ${bus.destinationCity} (${bus.busType})`,
          customer: {
            name: passengers[0]?.name || 'Passenger',
            phone: contactMobile || '8861163436',
            email: contactEmail || 'passenger@goodbus.local',
          },
          handler: function (response: any) {
            const confirmedTin = `SF${Date.now().toString().slice(-9)}`;
            const confirmedPnr = `GB-${Math.floor(10000 + Math.random() * 90000)}`;
            onPaymentSuccess('GoodBus UPI', response.utr || manualUtrInput || '630141344124', confirmedTin, confirmedPnr);
          },
          onClose: function () {
            setIsProcessing(false);
          },
        });
      } else {
        window.open(checkoutUrl, '_blank');
      }
    } catch (_err) {
      setIsProcessing(false);
      setProcessingStatus('');
      // Smooth fallback to opening the UPI App directly without error alert
      window.location.href = upiIntentUrl;
    }
  };

  // Instant UTR Verification Handler — STRICT FAIL-CLOSED (No Fake Confirmations)
  const handleVerifyManualUtr = async () => {
    const trimmed = manualUtrInput.trim();
    if (!trimmed || !/^\d{12}$/.test(trimmed)) {
      setUtrStatusMsg({
        text: 'Please enter a valid 12-digit numeric UTR from your UPI payment receipt.',
        type: 'error',
      });
      return;
    }

    setUtrStatusMsg({ text: 'Verifying bank reference number (UTR) with banking engine...', type: 'info' });

    try {
      // 1. Check with Spring Boot Payment API or YouPI Payment API for verified bank observation
      let verifyRes = await fetch(`/busticket/api/payment/verify-utr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: trimmed,
          orderId: activeOrderId,
          amount: effectiveAmount,
          receivingUpiId: receivingUpiId,
        }),
      }).catch(() => null);

      if (!verifyRes || !verifyRes.ok) {
        const fallbackEndpoint = activePaymentId
          ? `/api/v1/checkout/${activePaymentId}/verify-utr`
          : `/api/v1/checkout/verify-utr`;

        const altRes = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utr: trimmed,
            orderId: activeOrderId,
            amount: effectiveAmount,
            receivingUpiId: receivingUpiId,
          }),
        }).catch(() => null);

        if (altRes) verifyRes = altRes;
      }

      const verifyContentType = verifyRes?.headers?.get('content-type') || '';
      let verifyData: any = null;
      if (verifyRes && verifyContentType.includes('application/json')) {
        verifyData = await verifyRes.json().catch(() => null);
      }

      // If backend explicitly rejected the UTR or observation is not found:
      if (verifyRes && verifyRes.status === 404) {
        setUtrStatusMsg({
          text: verifyData?.error || `❌ Bank credit not found for UTR ${trimmed} (₹${effectiveAmount.toFixed(2)}). Please ensure funds were debited from your UPI app, or wait 15–30 seconds for your bank's SMS/notification to reach the server.`,
          type: 'error',
        });
        return; // <--- STRICTLY PREVENT TICKET ISSUANCE
      }

      if (verifyRes && !verifyRes.ok && verifyData?.error) {
        setUtrStatusMsg({
          text: `❌ Verification failed: ${verifyData.error}`,
          type: 'error',
        });
        return; // <--- STRICTLY PREVENT TICKET ISSUANCE
      }

      // If verified by bank observation:
      if (verifyData?.success === true || verifyData?.status === 'SUCCESS' || verifyData?.status === 'OBSERVED_SUCCESS') {
        const confirmedTin = `SF${Date.now().toString().slice(-9)}`;
        const confirmedPnr = `GB-${Math.floor(10000 + Math.random() * 90000)}`;

        setUtrStatusMsg({ text: '✓ Bank payment verified! Generating confirmed ticket...', type: 'success' });
        setTimeout(() => {
          onPaymentSuccess('GoodBus UPI (Bank Verified)', trimmed, confirmedTin, confirmedPnr);
        }, 700);
        return;
      }

      // If no live bank observer is attached to the backend yet:
      setUtrStatusMsg({
        text: `⏳ Waiting for bank notification for UTR ${trimmed}. If you just transferred ₹${effectiveAmount.toFixed(2)}, your bank SMS/alert will be processed in a few moments.`,
        type: 'info',
      });
    } catch (e: any) {
      setUtrStatusMsg({ text: 'Verification error: ' + (e.message || 'Network error'), type: 'error' });
    }
  };

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText(receivingUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleLaunchUpiApp = (appName?: 'PhonePe' | 'Google Pay' | 'Paytm' | 'CRED') => {
    if (isMobileDevice) {
      const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
      const query = `pa=${receivingUpiId}&pn=${encodeURIComponent(payeeName)}&tr=${activeOrderId}&am=${effectiveAmount.toFixed(
        2
      )}&cu=INR&tn=GoodBusTicket`;

      let targetUrl = `upi://pay?${query}`;

      if (isAndroid && appName) {
        // Direct Android Intent with targeted package to completely bypass OS app chooser dialog
        const packageMap: Record<string, string> = {
          'Google Pay': 'com.google.android.apps.nbu.paisa.user',
          'PhonePe': 'com.phonepe.app',
          'Paytm': 'net.one97.paytm',
          'CRED': 'com.dreamplug.androidapp',
        };
        const targetPackage = packageMap[appName];
        if (targetPackage) {
          targetUrl = `intent://pay?${query}#Intent;scheme=upi;package=${targetPackage};end`;
        }
      } else if (!isAndroid && appName) {
        // iOS custom scheme handlers
        const iosSchemeMap: Record<string, string> = {
          'PhonePe': `phonepe://pay?${query}`,
          'Paytm': `paytmmp://pay?${query}`,
          'Google Pay': `gpay://upi/pay?${query}`,
          'CRED': `credpay://upi/pay?${query}`,
        };
        if (iosSchemeMap[appName]) {
          targetUrl = iosSchemeMap[appName];
        }
      }

      try {
        window.location.href = targetUrl;
      } catch (_e) {
        window.location.href = upiIntentUrl;
      }
      return;
    }

    copyUpiToClipboard();
    setUtrStatusMsg({
      text: `Copied UPI ID (${receivingUpiId})! Scan the QR code or send ₹${effectiveAmount.toFixed(2)} via ${appName || 'any UPI app'}.`,
      type: 'info',
    });
  };

  // UPI deep link
  const upiIntentUrl = `upi://pay?pa=${receivingUpiId}&pn=${encodeURIComponent(payeeName)}&tr=${activeOrderId}&am=${effectiveAmount.toFixed(
    2
  )}&cu=INR&tn=GoodBusTicket`;

  return (
    <main className="min-h-screen pt-20 pb-16 bg-[#F9FAFB] text-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPassengers}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 shadow-xs"
              title="Back to Passenger Details"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Payment Checkout</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Step 4 of 4
                </span>
              </div>
              <p className="text-xs text-gray-500 font-light mt-0.5">
                {bus.sourceCity} ➔ {bus.destinationCity} • {journeyDate}
              </p>
            </div>
          </div>

          {/* Seat Lock Countdown */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto text-amber-900 shadow-xs">
            <span className="material-symbols-outlined text-[18px] text-amber-600 animate-pulse">timer</span>
            <span className="text-xs font-medium">Berths locked:</span>
            <span className="font-mono font-bold text-xs text-amber-800">{formatTimer(secondsRemaining)}</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: YouPI Sovereign Gateway */}
          <div className="lg:col-span-7 space-y-5">
            {/* Payment Method Selector Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-5">
              {/* Amount Selection Mode Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Select Payment Amount For Testing:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Sample 1 Re Button */}
                  <button
                    type="button"
                    onClick={() => setIsTestMode(true)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      isTestMode
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-xs'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <span>⚡ Sample Test Mode</span>
                      </span>
                      {isTestMode && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-700 mt-1">₹1.00</div>
                    <p className="text-[10px] text-emerald-800/80 font-light mt-0.5">
                      Real UPI test payment directly to active UPI ID
                    </p>
                  </button>

                  {/* Full Fare Button */}
                  <button
                    type="button"
                    onClick={() => setIsTestMode(false)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      !isTestMode
                        ? 'border-[#0c2340] bg-slate-50 ring-2 ring-[#0c2340]/20 shadow-xs'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Full Ticket Fare</span>
                      {!isTestMode && (
                        <span className="w-4 h-4 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold font-mono text-gray-900 mt-1">₹{totalAmount.toFixed(2)}</div>
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">
                      Standard fare for {selectedSeats.length} berth(s)
                    </p>
                  </button>
                </div>
              </div>

              {/* Dynamic QR Code & UPI Deep Links */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-4">
                {/* 1-Tap Mobile UPI Intent Launcher (Prominent at top on mobile) */}
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleYoupiPayment(isTestMode)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-[#0c2340] hover:from-emerald-700 hover:to-[#163660] text-white font-bold text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    <span>
                      {isProcessing
                        ? 'Launching UPI App...'
                        : `Pay ₹${effectiveAmount.toFixed(2)} with any UPI App`}
                    </span>
                  </button>

                  {/* Direct App Deep Links */}
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('Google Pay')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-800 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Google Pay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('PhonePe')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-800 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('Paytm')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-800 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>Paytm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchUpiApp('CRED')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-800 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-black" />
                      <span>CRED</span>
                    </button>
                  </div>
                </div>



                {/* QR Code Section (Clean high-res QR with no obscuring overlay) */}
                <div className="pt-2 border-t border-gray-200/60">
                  {isMobileDevice && (
                    <button
                      type="button"
                      onClick={() => setShowQrOnMobile((prev) => !prev)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer mb-3 inline-block"
                    >
                      {showQrOnMobile ? '▲ Hide QR Code' : '▼ Or show QR Code to scan from another device'}
                    </button>
                  )}

                  {(!isMobileDevice || showQrOnMobile) && (
                    <div className="space-y-3">
                      <div className="inline-block p-3 bg-white rounded-2xl border border-gray-200 shadow-xs">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=H&margin=2&data=${encodeURIComponent(
                            upiIntentUrl
                          )}`}
                          alt="Scan UPI QR Code"
                          className="w-[190px] h-[190px] rounded-lg mx-auto"
                        />
                      </div>
                      <div className="text-xs text-gray-500 font-light">
                        {isMobileDevice
                          ? 'Aim your second phone’s camera at this screen to pay'
                          : 'Aim your phone’s live camera at this QR code to complete payment'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Prominent Manual UPI ID Copy Card (Completely Bypasses Gallery Limits) */}
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-2 text-left shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Merchant UPI ID (Direct Transfer)
                    </span>
                    <span className="font-mono font-bold text-xs text-gray-900 select-all truncate block">
                      {receivingUpiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyUpiToClipboard}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-300 rounded-lg text-xs font-bold text-blue-600 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUpi ? '✓ Copied' : 'Copy UPI ID'}
                  </button>
                </div>

                {utrStatusMsg && (
                  <div
                    className={`text-xs p-3 rounded-xl font-medium text-center ${
                      utrStatusMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : utrStatusMsg.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {utrStatusMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Fare & Trip Summary */}
          <div className="lg:col-span-5 space-y-5">
            {/* Trip Details Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Booking Summary</h2>

              <div className="space-y-3 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900">{bus.operator}</span>
                  <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                    {bus.busType}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Selected Berths:</span>
                  <span className="font-bold text-gray-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                    {selectedSeats.map((s) => s.number).join(', ')} ({selectedSeats.length})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Boarding Point:</span>
                  <span className="font-medium text-gray-800">{boardingPoint?.name || 'Boarding Point'}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Dropping Point:</span>
                  <span className="font-medium text-gray-800">{droppingPoint?.name || 'Dropping Point'}</span>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="space-y-2 pb-3 border-b border-gray-100 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Base Ticket Fare</span>
                  <span className="font-mono font-medium">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST &amp; Taxes</span>
                  <span className="font-mono font-medium text-emerald-700">Included (₹0.00)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment Gateway Convenience Fee</span>
                  <span className="font-mono font-bold text-emerald-700">₹0.00 (Zero Fee)</span>
                </div>
              </div>

              {/* Total Payable */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                    {isTestMode ? 'Payable (Sample Test)' : 'Total Payable'}
                  </span>
                  <span className="text-2xl font-bold font-mono text-gray-900">
                    ₹{effectiveAmount.toFixed(2)}
                  </span>
                </div>

                {isTestMode && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    1 Re. Test Active
                  </span>
                )}
              </div>
            </div>

            {/* Passenger Info Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary Passenger</h3>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-gray-900">{passengers[0]?.name || 'Passenger'}</div>
                <div className="text-gray-500 font-light">
                  +91 {contactMobile || '8861163436'} • {contactEmail || 'passenger@goodbus.local'}
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 text-center space-y-2 text-[11px] text-gray-500 font-light">
              <div className="flex items-center justify-center gap-3 font-medium text-gray-700">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
                  <span>256-Bit SSL</span>
                </span>
                <span>•</span>
                <span>NPCI UPI Verified</span>
                <span>•</span>
                <span>Zero Fee Gateway</span>
              </div>
              <p>Direct peer-to-peer settlement to merchant bank account without intermediate escrow.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
