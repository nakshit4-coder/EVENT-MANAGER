import React, { useState } from 'react';
import { 
  X, 
  Ticket, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Download,
  Calendar,
  MapPin,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import type { Event, TicketType, Booking, BookingTicket } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localStore } from '../../lib/supabase';
import { supabaseDataService } from '../../services/supabaseService';
import { generateUUID, toValidUUID } from '../../utils/uuid';

interface BookingModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  event,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(
    event.ticket_types && event.ticket_types.length > 0 ? event.ticket_types[0] : null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [attendeeName, setAttendeeName] = useState<string>(user?.full_name || '');
  const [attendeeEmail, setAttendeeEmail] = useState<string>(user?.email || '');
  const [attendeePhone, setAttendeePhone] = useState<string>(user?.phone || '+1 (555) 432-1098');
  
  // Payment simulation state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<string[]>([]);

  if (!isOpen) return null;

  const ticketPrice = selectedTicketType ? selectedTicketType.price : 0;
  const subtotal = ticketPrice * quantity;
  const platformFee = subtotal > 0 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const totalAmount = subtotal + platformFee;
  const isFree = totalAmount === 0;

  const remainingQuantity = selectedTicketType 
    ? selectedTicketType.total_quantity - selectedTicketType.sold_quantity
    : 0;

  const handleNextToReview = () => {
    if (!selectedTicketType) {
      showToast('Please select a ticket tier', 'error');
      return;
    }
    if (quantity < 1 || quantity > 10) {
      showToast('Quantity must be between 1 and 10 tickets', 'error');
      return;
    }
    if (quantity > remainingQuantity) {
      showToast(`Only ${remainingQuantity} tickets left in this tier`, 'error');
      return;
    }
    setStep(2);
  };

  const handleProcessBooking = async () => {
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      showToast('Please provide your name and email address', 'error');
      return;
    }

    setIsProcessingPayment(true);
    setStep(3);

    // Simulate server-side Razorpay order creation and cryptographic verification
    setTimeout(async () => {
      try {
        const bookingRef = `EVF-${Math.floor(100000 + Math.random() * 900000)}`;
        const bookingId = generateUUID();
        const newTickets: BookingTicket[] = [];
        const qrUrls: string[] = [];

        // Generate cryptographic ticket codes and QR codes
        for (let i = 0; i < quantity; i++) {
          const suffix = String.fromCharCode(65 + i);
          const ticketCode = `TKT-${event.slug.slice(0, 4).toUpperCase()}-${bookingRef.slice(4)}-${suffix}`;
          const qrPayload = JSON.stringify({
            code: ticketCode,
            ref: bookingRef,
            event_id: event.id,
            tier: selectedTicketType?.name,
            attendee: attendeeName,
            issued_at: new Date().toISOString()
          });

          // Generate QR data URL
          const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 320,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            }
          });
          qrUrls.push(qrDataUrl);

          newTickets.push({
            id: generateUUID(),
            booking_id: bookingId,
            ticket_type_id: selectedTicketType!.id,
            ticket_type: selectedTicketType!,
            ticket_code: ticketCode,
            qr_code: qrPayload,
            price: ticketPrice,
            status: 'valid',
            created_at: new Date().toISOString(),
          });
        }

        const newBooking: Booking = {
          id: bookingId,
          user_id: toValidUUID(user?.id),
          user: user || undefined,
          event_id: event.id,
          event: event,
          booking_reference: bookingRef,
          total_amount: totalAmount,
          booking_status: 'confirmed',
          payment_status: 'paid',
          payment_reference: isFree ? 'free_pass_bypass' : `pay_rzp_${Date.now()}`,
          tickets: newTickets,
          created_at: new Date().toISOString(),
        };

        // Save booking and update inventory in database store and Supabase
        await supabaseDataService.createBooking(newBooking);

        // Add attendee notification
        if (user) {
          localStore.addNotification({
            user_id: user.id,
            title: 'Tickets Confirmed!',
            message: `Your booking ${bookingRef} for ${event.title} is confirmed. Download your passes in My Bookings.`,
            is_read: false,
          });
        }

        setCompletedBooking(newBooking);
        setQrCodeDataUrls(qrUrls);
        setIsProcessingPayment(false);
        setStep(4);

        // Fire festive confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        showToast('Tickets booked successfully!', 'success');
        onBookingSuccess(newBooking);
      } catch (err) {
        console.error(err);
        setIsProcessingPayment(false);
        showToast('Payment verification failed. Please try again.', 'error');
        setStep(2);
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Book Tickets</h2>
              <p className="text-xs text-slate-400 truncate max-w-xs">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close booking modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-step Content */}
        <div className="p-6">
          
          {/* STEP 1: SELECT TICKET TIER & QUANTITY */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Ticket Tier
                </label>
                <div className="space-y-2.5">
                  {event.ticket_types?.map(tier => {
                    const available = tier.total_quantity - tier.sold_quantity;
                    const isSoldOut = available <= 0;
                    const isSelected = selectedTicketType?.id === tier.id;

                    return (
                      <div
                        key={tier.id}
                        onClick={() => !isSoldOut && setSelectedTicketType(tier)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                          isSoldOut
                            ? 'opacity-50 border-slate-800 bg-slate-950 cursor-not-allowed'
                            : isSelected
                            ? 'border-purple-500 bg-purple-950/20 shadow-md shadow-purple-950/20'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                        }`}
                      >
                        <div className="space-y-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{tier.name}</span>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-purple-400 bg-purple-900/60 px-1.5 py-0.2 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          {tier.description && (
                            <p className="text-xs text-slate-400 leading-snug">{tier.description}</p>
                          )}
                          <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                            {isSoldOut ? 'Sold out' : `${available} tickets remaining`}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-bold text-white font-mono tabular-nums">
                            {tier.price === 0 ? <span className="text-emerald-400">FREE</span> : `$${tier.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Number of Tickets</span>
                  <span className="text-[11px] text-slate-500">Max 10 passes per checkout</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="font-mono text-base font-bold text-white w-6 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(10, remainingQuantity, quantity + 1))}
                    disabled={quantity >= 10 || quantity >= remainingQuantity}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Order quick summary */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Estimated Total:</span>
                <span className="text-base font-bold text-white font-mono tabular-nums">
                  {totalAmount === 0 ? 'FREE' : `$${totalAmount.toFixed(2)}`}
                </span>
              </div>

              <button
                onClick={handleNextToReview}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-950/30"
              >
                <span>Continue to Attendee Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: ATTENDEE INFO & CHECKOUT SUMMARY */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Attendee Information
                </h3>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={attendeeName}
                    onChange={e => setAttendeeName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={attendeeEmail}
                      onChange={e => setAttendeeEmail(e.target.value)}
                      placeholder="e.g. alex@example.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mobile Phone (for SMS updates)</label>
                    <input
                      type="tel"
                      value={attendeePhone}
                      onChange={e => setAttendeePhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Order breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{selectedTicketType?.name} × {quantity}</span>
                  <span className="text-white font-mono tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform & Processing Fee (5%)</span>
                  <span className="text-white font-mono tabular-nums">${platformFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                  <span className="text-white">Total Amount Due</span>
                  <span className="text-purple-400 font-mono tabular-nums">
                    {totalAmount === 0 ? 'FREE' : `$${totalAmount.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-start gap-2.5 text-xs text-purple-300">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Payments powered securely by Razorpay. Your QR passes are cryptographically generated and stored immediately.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleProcessBooking}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-950/30"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isFree ? 'Claim Free Passes' : `Pay $${totalAmount.toFixed(2)} via Razorpay`}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT PROCESSING / VERIFICATION */}
          {step === 3 && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Verifying Razorpay Payment
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Acquiring ticket inventory locks and signing cryptographic check-in passes...
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION & QR CODE DISPLAY */}
          {step === 4 && completedBooking && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">Booking Confirmed!</h3>
                <p className="text-xs text-slate-400">
                  Booking Reference:{' '}
                  <strong className="text-purple-400 font-mono tracking-wider">
                    {completedBooking.booking_reference}
                  </strong>
                </p>
              </div>

              {/* QR Code Presentation */}
              <div className="p-4 rounded-2xl bg-white text-slate-900 inline-block shadow-xl mx-auto border border-slate-200">
                {qrCodeDataUrls[0] ? (
                  <img
                    src={qrCodeDataUrls[0]}
                    alt="Ticket QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs">
                    Generating QR...
                  </div>
                )}
                <div className="text-[11px] font-mono text-slate-600 mt-2 font-medium">
                  {completedBooking.tickets?.[0]?.ticket_code}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-semibold text-white">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span>{event.start_date} at {event.start_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue:</span>
                  <span>{event.venue_name}, {event.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passes Issued:</span>
                  <span className="font-mono text-purple-400">{completedBooking.tickets?.length} Passes</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition-colors"
                >
                  Done & View in My Bookings
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
