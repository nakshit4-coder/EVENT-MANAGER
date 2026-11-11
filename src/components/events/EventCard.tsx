import React from 'react';
import { Calendar, MapPin, Heart, ArrowRight } from 'lucide-react';
import type { Event } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { localStore } from '../../lib/supabase';

interface EventCardProps {
  event: Event;
  onSelect: (eventId: string) => void;
  onToggleFavorite?: (eventId: string) => void;
  isFavorite?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const { user } = useAuth();

  // Find lowest ticket price
  const lowestPrice = event.ticket_types && event.ticket_types.length > 0
    ? Math.min(...event.ticket_types.map(t => t.price))
    : 0;

  const totalCapacity = event.ticket_types
    ? event.ticket_types.reduce((sum, t) => sum + t.total_quantity, 0)
    : 0;

  const totalSold = event.ticket_types
    ? event.ticket_types.reduce((sum, t) => sum + t.sold_quantity, 0)
    : 0;

  const isSoldOut = totalCapacity > 0 && totalSold >= totalCapacity;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user && onToggleFavorite) {
      onToggleFavorite(event.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(event.id)}
      className="group cursor-pointer flex flex-col rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/20"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-800">
        <img
          src={event.poster_url || '/src/assets/images/eventify_hero_concert_1794384951533.jpg'}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle overlay scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

        {/* Favorite Heart Button */}
        {user && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors ${
              isFavorite 
                ? 'bg-rose-500/90 text-white shadow-md shadow-rose-950/40' 
                : 'bg-slate-950/50 text-slate-300 hover:text-white hover:bg-slate-950/80'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Bottom image metadata: clean unboxed text (anti-slop rule) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2 font-medium drop-shadow-md">
            <span>{event.category}</span>
            <span aria-hidden="true" className="opacity-60">·</span>
            <span>{event.city}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Date & Time clean unboxed typography */}
          <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(event.start_date)}</span>
            <span aria-hidden="true">·</span>
            <span>{event.start_time}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {event.title}
          </h3>

          {/* Venue & Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span className="truncate">{event.venue_name}, {event.address}</span>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">Starting from</span>
            <span className="text-sm font-bold text-white tabular-nums">
              {lowestPrice === 0 ? (
                <span className="text-emerald-400">FREE</span>
              ) : (
                `$${lowestPrice}`
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSoldOut ? (
              <span className="text-xs font-semibold text-rose-400">Sold Out</span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(event.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all group-hover:bg-purple-600 group-hover:text-white"
              >
                <span>Book Tickets</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
