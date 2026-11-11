import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  Heart, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Star, 
  Ticket, 
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import type { Event, EventReview } from '../types';
import { BookingModal } from '../components/booking/BookingModal';
import { EventCard } from '../components/events/EventCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { localStore } from '../lib/supabase';

interface EventDetailsPageProps {
  event: Event;
  allEvents: Event[];
  onBack: () => void;
  onSelectEvent: (eventId: string) => void;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = ({
  event,
  allEvents,
  onBack,
  onSelectEvent,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  // Reviews state
  const [reviews, setReviews] = useState<EventReview[]>(() => {
    return localStore.getReviews(event.id);
  });
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    return user ? localStore.getFavorites(user.id).includes(event.id) : false;
  });

  const handleToggleFavorite = () => {
    if (!user) {
      showToast('Please sign in to save favorite events', 'info');
      return;
    }
    const nextState = localStore.toggleFavorite(user.id, event.id);
    setIsFavorite(nextState);
    showToast(nextState ? 'Added to favorites!' : 'Removed from favorites', 'info');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Event link copied to clipboard!', 'success');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to post a review', 'info');
      return;
    }
    if (!newReviewText.trim()) {
      showToast('Please enter your review text', 'error');
      return;
    }

    setIsSubmittingReview(true);
    const rev: EventReview = {
      id: `rev-${Date.now()}`,
      event_id: event.id,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: user.avatar_url,
      rating: newRating,
      review: newReviewText.trim(),
      created_at: new Date().toISOString()
    };

    localStore.addReview(rev);
    setReviews(prev => [rev, ...prev]);
    setNewReviewText('');
    setIsSubmittingReview(false);
    showToast('Thank you! Your review has been published.', 'success');
  };

  const handleReportEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      showToast('Please describe the issue with this event listing', 'error');
      return;
    }

    localStore.addReport({
      event_id: event.id,
      event_title: event.title,
      reported_by: user?.id || 'anonymous',
      reporter_name: user?.full_name || 'Anonymous Visitor',
      reason: reportReason.trim()
    });

    setIsReportOpen(false);
    setReportReason('');
    showToast('Report submitted. Eventify administrators will review this listing shortly.', 'success');
  };

  // Related events
  const relatedEvents = allEvents
    .filter(e => e.id !== event.id && (e.category === event.category || e.city === event.city))
    .slice(0, 3);

  // Total capacity and sold
  const totalCapacity = event.ticket_types?.reduce((acc, t) => acc + t.total_quantity, 0) || 0;
  const totalSold = event.ticket_types?.reduce((acc, t) => acc + t.sold_quantity, 0) || 0;
  const lowestPrice = event.ticket_types && event.ticket_types.length > 0
    ? Math.min(...event.ticket_types.map(t => t.price))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation & actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl border transition-colors ${
                isFavorite 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Save Event"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Share Event"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
              title="Report Event"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Main Cover & Details */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-[16/9] w-full bg-slate-900">
              <img
                src={event.poster_url || '/src/assets/images/eventify_hero_concert_1794384951533.jpg'}
                alt={event.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-slate-200">
                <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60 font-semibold text-purple-300">
                  {event.category}
                </span>
                <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/60 font-mono tabular-nums text-emerald-400">
                  {totalCapacity - totalSold > 0 ? `${totalCapacity - totalSold} tickets left` : 'Sold out'}
                </span>
              </div>
            </div>

            {/* Event Description Section */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 py-3 border-y border-slate-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>{event.start_date} to {event.end_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{event.start_time} - {event.end_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{event.city}</span>
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed space-y-4">
                <h3 className="text-base font-bold text-white">About This Event</h3>
                <p className="whitespace-pre-line leading-relaxed">{event.description}</p>
              </div>

              {/* Cancellation Policy */}
              {event.cancellation_policy && (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Cancellation & Refund Policy
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {event.cancellation_policy}
                  </p>
                </div>
              )}
            </div>

            {/* Venue & Location map snippet */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>Venue & Location</span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {event.venue_name}
              </p>
              <p className="text-xs text-slate-400">
                {event.address}, {event.city}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue_name} ${event.address} ${event.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold pt-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Organizer card */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-lg">
                  {event.contact_email ? event.contact_email[0].toUpperCase() : 'O'}
                </div>
                <div>
                  <div className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider">
                    Official Host
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    Soundwave & Eventify Live Productions
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{event.contact_email || 'contact@eventify.live'}</p>
                </div>
              </div>
              {event.contact_phone && (
                <a
                  href={`tel:${event.contact_phone}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Contact Host
                </a>
              )}
            </div>

            {/* REVIEWS & RATINGS SECTION */}
            <div className="space-y-6 pt-4 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Attendee Reviews</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-300 font-mono tabular-nums">
                      {event.average_rating || 4.9} ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Leave a Review</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`p-1 ${star <= newRating ? 'text-amber-400' : 'text-slate-600'}`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReviewText}
                  onChange={e => setNewReviewText(e.target.value)}
                  placeholder="Share your experience at this event..."
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  Post Review
                </button>
              </form>

              {/* Reviews list */}
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                          alt={rev.user_name || 'Attendee'}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-white">{rev.user_name || 'Verified Attendee'}</span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rev.review}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Sticky Ticket Tier Selection & Booking */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Admission Passes
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {lowestPrice === 0 ? 'FREE' : `$${lowestPrice}`}
                  </span>
                  <span className="text-xs text-slate-400">/ starting tier</span>
                </div>
              </div>

              {/* Ticket tier previews */}
              <div className="space-y-3">
                {event.ticket_types?.map(tier => {
                  const remaining = tier.total_quantity - tier.sold_quantity;
                  const isSoldOut = remaining <= 0;

                  return (
                    <div
                      key={tier.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{tier.name}</span>
                        <span className="text-xs font-bold font-mono text-purple-400 tabular-nums">
                          {tier.price === 0 ? 'FREE' : `$${tier.price}`}
                        </span>
                      </div>
                      {tier.description && (
                        <p className="text-[11px] text-slate-400 leading-tight">{tier.description}</p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Status</span>
                        <span className={isSoldOut ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {isSoldOut ? 'Sold out' : `${remaining} tickets left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Primary Book CTA */}
              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-purple-950/40 transition-all flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>Select Tickets & Book</span>
              </button>

              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant cryptographic QR code generation</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Downloadable offline PDF passes</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RELATED EVENTS */}
        {relatedEvents.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-900">
            <h3 className="text-xl font-bold text-white mb-6">Similar Experiences You May Like</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedEvents.map(rel => (
                <EventCard
                  key={rel.id}
                  event={rel}
                  onSelect={onSelectEvent}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Booking Modal */}
      <BookingModal
        event={event}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingSuccess={() => {}}
      />

      {/* Report Event Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Report Inappropriate Content</span>
              </h3>
              <button onClick={() => setIsReportOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Help us maintain community trust. Our safety moderators investigate all reports promptly.
            </p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Describe the issue (fraud, copyright violation, spam, inaccurate venue)..."
              rows={4}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsReportOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReportEvent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
