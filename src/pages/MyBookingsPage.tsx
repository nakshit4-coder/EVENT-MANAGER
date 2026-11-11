import React, { useState } from 'react';
import { 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  QrCode, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Ban,
  ArrowRight
} from 'lucide-react';
import type { Booking } from '../types';
import { TicketViewerModal } from '../components/booking/TicketViewerModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { localStore } from '../lib/supabase';

interface MyBookingsPageProps {
  onNavigate: (page: string, params?: any) => void;
  onSelectEvent: (eventId: string) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  onNavigate,
  onSelectEvent,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  // Load all user bookings
  const allBookings = localStore.getBookings();
  // Filter for current user (or show all in demo if guest)
  const userBookings = user 
    ? allBookings.filter(b => b.user_id === user.id || b.user_id === 'user-attendee-1')
    : allBookings;

  const filteredBookings = userBookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'cancelled') return b.booking_status === 'cancelled';
    if (activeTab === 'completed') {
      return b.booking_status === 'confirmed' && new Date(b.event?.start_date || '').getTime() < Date.now();
    }
    if (activeTab === 'upcoming') {
      return b.booking_status === 'confirmed' && new Date(b.event?.start_date || '').getTime() >= Date.now();
    }
    return true;
  });

  const handleCancelBooking = (bookingId: string) => {
    const success = localStore.cancelBooking(bookingId);
    if (success) {
      showToast('Booking cancelled. Ticket inventory has been restored.', 'success');
      setCancelModalBooking(null);
    } else {
      showToast('Failed to cancel booking.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              My Bookings & Passes
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Access your digital entry passes, offline QR codes, and booking receipts.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Discover More Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Filter Tabs (Button Segmented Controls allowed by design guidelines) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            All ({userBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'completed' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'cancelled' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Cancelled
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <TicketIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No bookings found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You don't have any tickets in this category yet. Explore upcoming festivals and secure your passes!
              </p>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const event = booking.event;
              const isCancelled = booking.booking_status === 'cancelled';
              const ticketCount = booking.tickets?.length || 1;
              const ticketTierName = booking.tickets?.[0]?.ticket_type?.name || 'Standard Pass';

              return (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all"
                >
                  {/* Left: Event Poster & Basic Info */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                    <img
                      src={event?.poster_url || '/src/assets/images/eventify_hero_concert_1794384951533.jpg'}
                      alt={event?.title || 'Event'}
                      className="w-full sm:w-32 aspect-[16/10] sm:aspect-square object-cover rounded-xl shrink-0 bg-slate-800"
                    />

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-purple-400 font-bold">{booking.booking_reference}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-slate-400">{new Date(booking.created_at).toLocaleDateString()}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className={`font-semibold ${isCancelled ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isCancelled ? 'Cancelled' : 'Confirmed'}
                        </span>
                      </div>

                      <h3
                        onClick={() => event && onSelectEvent(event.id)}
                        className="text-base font-bold text-white hover:text-purple-300 cursor-pointer transition-colors"
                      >
                        {event?.title || 'Event Experience'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>{event?.start_date} · {event?.start_time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span>{event?.venue_name}, {event?.city}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 pt-1">
                        Tier: <strong className="text-white">{ticketTierName}</strong> ({ticketCount} {ticketCount === 1 ? 'pass' : 'passes'})
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Actions */}
                  <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-400 block">Total Paid</span>
                      <span className="text-base font-bold text-white font-mono tabular-nums">
                        {booking.total_amount === 0 ? 'FREE' : `$${booking.total_amount.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCancelled && (
                        <>
                          <button
                            onClick={() => setSelectedBookingForPass(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View Digital Pass</span>
                          </button>

                          <button
                            onClick={() => setCancelModalBooking(booking)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs transition-colors"
                            title="Cancel Booking"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Ticket Viewer Modal */}
      {selectedBookingForPass && (
        <TicketViewerModal
          booking={selectedBookingForPass}
          isOpen={Boolean(selectedBookingForPass)}
          onClose={() => setSelectedBookingForPass(null)}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Cancel Booking?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel booking <strong className="text-purple-400 font-mono">{cancelModalBooking.booking_reference}</strong>? 
              Your tickets will be invalidated and returned to event inventory for other attendees.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancelModalBooking.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
