import React, { useState } from 'react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pnr, setPnr] = useState('');
  const [category, setCategory] = useState('Bus Delay & Live Tracking');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    name: string;
    pnr: string;
    email: string;
    category: string;
    timestamp: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@goodbus.in');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const ticketId = `GB-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setSubmittedTicket({
        id: ticketId,
        name: name.trim(),
        pnr: pnr.trim() ? pnr.trim().toUpperCase() : 'N/A (Pre-booking query)',
        email: email.trim() || 'customer@traveler.in',
        category,
        timestamp: `${now.toLocaleDateString('en-GB')}, ${timeStr}`
      });
      setIsSubmitting(false);
    }, 600);
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setName('');
    setEmail('');
    setPnr('');
    setDescription('');
    setCategory('Bus Delay & Live Tracking');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 my-8 border border-gray-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#d84e55] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Help &amp; Customer Support</h3>
              <p className="text-xs text-gray-500 font-light">
                Submit an issue with your PNR or reach us via email
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Direct Email Contact Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/50 to-orange-50/40 border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#d84e55] shadow-xs flex items-center justify-center shrink-0 border border-red-100">
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Direct Email Support
              </div>
              <a
                href="mailto:support@goodbus.in"
                className="text-sm font-semibold text-[#d84e55] hover:underline"
              >
                support@goodbus.in
              </a>
              <div className="text-[11px] text-gray-500 font-light">
                Average reply time within 15 minutes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedEmail ? 'check' : 'content_copy'}
              </span>
              <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href="mailto:support@goodbus.in?subject=Bus%20Support%20Enquiry"
              className="text-xs px-3 py-1.5 bg-[#d84e55] hover:bg-[#c13a40] text-white rounded-xl font-medium transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
              <span>Email Us</span>
            </a>
          </div>
        </div>

        {submittedTicket ? (
          /* Submission Confirmation Card */
          <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-3xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">check</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Support Ticket Created!</h4>
                <p className="text-xs text-emerald-800">
                  Ticket Reference:{' '}
                  <span className="font-mono font-bold text-gray-900">{submittedTicket.id}</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-xs space-y-2 text-gray-600">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Passenger Name:</span>
                <span className="font-medium text-gray-900">{submittedTicket.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">PNR Number:</span>
                <span className="font-mono font-medium text-[#d84e55]">{submittedTicket.pnr}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Issue Category:</span>
                <span className="font-medium text-gray-900">{submittedTicket.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Follow-up Contact:</span>
                <span className="font-medium text-gray-900">{submittedTicket.email}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-light leading-relaxed">
              Our 24x7 support dispatch team has received your issue. An agent will investigate with the bus operator and reply to your email address within <strong>15 minutes</strong>.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Submit Another Issue
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Support Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Submit An Issue Description
              </h4>
              <span className="text-[11px] text-gray-400">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Passenger Name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Your Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55] transition-all"
                  />
                </div>
              </div>

              {/* PNR Number */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  PNR Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value)}
                    placeholder="e.g. OT-HYD-84920"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-mono uppercase text-gray-900 focus:bg-white focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Contact Email */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55] transition-all"
                />
              </div>

              {/* Issue Category */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55] transition-all cursor-pointer"
                >
                  <option value="Bus Delay & Live Tracking">Bus Delay &amp; Live Tracking</option>
                  <option value="Refund & Cancellation">Refund &amp; Cancellation</option>
                  <option value="Boarding Point Location / Driver Contact">Boarding Point / Driver Contact</option>
                  <option value="Ticket Reschedule / Seat Modification">Ticket / Seat Modification</option>
                  <option value="Luggage or Bus Cleanliness Issue">Luggage or Cleanliness Issue</option>
                  <option value="Other Travel Query">Other Travel Query</option>
                </select>
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Issue Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your issue in detail so our team can resolve it quickly..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#d84e55] focus:ring-1 focus:ring-[#d84e55] transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>SUBMIT SUPPORT REQUEST</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick FAQs */}
        <div className="pt-2 border-t border-gray-100">
          <details className="group text-xs">
            <summary className="font-semibold text-gray-700 flex items-center justify-between cursor-pointer list-none py-1">
              <span>Frequently Asked Questions</span>
              <span className="material-symbols-outlined text-[16px] text-gray-400 group-open:rotate-180 transition-transform">
                expand_more
              </span>
            </summary>
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-100 text-gray-500 font-light">
              <div className="p-3 bg-gray-50 rounded-xl">
                <strong className="text-gray-900 font-medium block mb-0.5">
                  How do automated instant refunds work?
                </strong>
                Direct UPI/source bank account reversals execute within 2-5 minutes once cancelled.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <strong className="text-gray-900 font-medium block mb-0.5">
                  When will I get driver contact and live tracking?
                </strong>
                SMS and WhatsApp alerts with live bus coordinates are dispatched 2 hours before boarding.
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
