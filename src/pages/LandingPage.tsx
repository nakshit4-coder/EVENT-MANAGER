import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  QrCode, 
  Users, 
  TrendingUp, 
  Star,
  CheckCircle2
} from 'lucide-react';
import type { Event } from '../types';
import { EventCard } from '../components/events/EventCard';
import { useAuth } from '../contexts/AuthContext';
import { localStore } from '../lib/supabase';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
  onSelectEvent: (eventId: string) => void;
  events: Event[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectEvent,
  events,
}) => {
  const { user } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    return user ? localStore.getFavorites(user.id) : [];
  });

  const handleToggleFavorite = (eventId: string) => {
    if (!user) return;
    const isNowFav = localStore.toggleFavorite(user.id, eventId);
    setFavorites(prev => 
      isNowFav ? [...prev, eventId] : prev.filter(id => id !== eventId)
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('explore', {
      searchQuery: searchKeyword,
      city: searchCity,
      category: searchCategory,
    });
  };

  const featuredEvents = events.filter(e => e.status === 'published').slice(0, 3);
  const trendingEvents = events.filter(e => e.status === 'published').slice(1, 4);

  // Platform dynamic stats
  const totalTicketsSold = events.reduce((sum, e) => {
    const tSold = e.ticket_types?.reduce((acc, t) => acc + t.sold_quantity, 0) || 0;
    return sum + tSold;
  }, 0);

  const categories = [
    { name: 'Music & Concerts', count: 18, desc: 'Festivals, live tours & underground sets' },
    { name: 'Technology & Business', count: 24, desc: 'AI summits, developer conferences & hackathons' },
    { name: 'Food & Culinary', count: 14, desc: 'Wine tastings, gourmet dinners & street markets' },
    { name: 'Art & Design', count: 12, desc: 'Digital light galleries, photography & sculpture' },
    { name: 'Sports & Wellness', count: 9, desc: 'Marathons, yoga retreats & fitness expos' },
    { name: 'Community & Culture', count: 16, desc: 'Local meetups, charity galas & workshops' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 overflow-hidden border-b border-slate-900">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Event Management & Ticket Booking</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
                Find Your Next{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
                  Unforgettable
                </span>{' '}
                Experience.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Discover extraordinary events, connect with amazing people, and create memories that last forever with instant cryptographic QR tickets.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2"
                >
                  <span>Explore Events</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('create-event')}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all"
                >
                  Host an Event
                </button>
              </div>

              {/* Compact Search Bar Card */}
              <form
                onSubmit={handleSearchSubmit}
                className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 mt-4"
              >
                <div className="sm:col-span-4 flex items-center gap-2 px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    placeholder="Search artist, title..."
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchCity}
                    onChange={e => setSearchCity(e.target.value)}
                    placeholder="Any City"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <select
                    value={searchCategory}
                    onChange={e => setSearchCategory(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-300">All Categories</option>
                    <option value="Music & Concerts" className="bg-slate-900 text-slate-300">Music & Concerts</option>
                    <option value="Technology & Business" className="bg-slate-900 text-slate-300">Technology & AI</option>
                    <option value="Food & Culinary" className="bg-slate-900 text-slate-300">Food & Wine</option>
                    <option value="Art & Design" className="bg-slate-900 text-slate-300">Art & Design</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full min-h-[40px] px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-purple-950/30 group">
                <img
                  src="/src/assets/images/eventify_hero_concert_1794384951533.jpg"
                  alt="Electric Horizon Festival 2026"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                {/* Floating Highlight Card */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                        Featured Event of the Month
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">Electric Horizon Festival 2026</h3>
                      <p className="text-xs text-slate-400 mt-1">Miami, FL · Aug 14 - 16</p>
                    </div>
                    <button
                      onClick={() => onSelectEvent('event-01')}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shrink-0 transition-colors"
                    >
                      View Passes
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Platform Statistics Strip (Tabular Numerals) */}
          <div className="mt-16 pt-8 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                {events.length}+
              </div>
              <div className="text-xs text-slate-400">Curated Events</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono tabular-nums">
                {(totalTicketsSold + 3840).toLocaleString()}+
              </div>
              <div className="text-xs text-slate-400">Verified Tickets Booked</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono tabular-nums">
                99.8%
              </div>
              <div className="text-xs text-slate-400">Gate Check-in Speed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                4.9 / 5.0
              </div>
              <div className="text-xs text-slate-400">Attendee Satisfaction</div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED EVENTS SECTION */}
      <section className="py-20 border-b border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Spotlight</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Featured Experiences
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Hand-picked by our curatorial team for high-production value.</p>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>See all events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={onSelectEvent}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favorites.includes(event.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Discover by Theme</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Browse Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From high-energy festivals and tech masterclasses to culinary tastings and modern art.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map(cat => (
              <div
                key={cat.name}
                onClick={() => onNavigate('explore', { category: cat.name })}
                className="group cursor-pointer p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 flex items-start justify-between"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
                  <span className="text-[11px] text-purple-400 font-mono tabular-nums block pt-1">
                    {cat.count} Events Available
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-purple-600/20 text-slate-400 group-hover:text-purple-300 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW EVENTIFY WORKS */}
      <section className="py-20 border-b border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Simple & Seamless</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              How Eventify Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              End-to-end ticketing designed for lightning-fast bookings and effortless venue check-ins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-base">
                01
              </div>
              <h3 className="text-base font-bold text-white">Discover & Select Tier</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by date, location, or vibe. Pick your preferred tier from General Admission to VIP Backstage passes with clear remaining inventory.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-base">
                02
              </div>
              <h3 className="text-base font-bold text-white">Instant QR & PDF Pass</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm your booking with Razorpay or complimentary checkout. Each pass receives a unique cryptographic QR code and downloadable PDF.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-base">
                03
              </div>
              <h3 className="text-base font-bold text-white">Seamless Gate Scan</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Present your phone screen at the venue gate. Organizers scan with the built-in scanner to verify authenticity in under 0.2 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE EVENTIFY */}
      <section className="py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Enterprise Reliability</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Built for High-Stakes Festivals and Intimate Gatherings
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Unlike bloated ticketing monopolies charging astronomical hidden fees, Eventify puts transparency, speed, and real-time organizer control at center stage.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">PostgreSQL Row Level Security (RLS)</h4>
                    <p className="text-xs text-slate-400">Strict database policies ensure attendees only see their tickets and organizers manage only their events.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Zero Overselling Concurrency Guarantee</h4>
                    <p className="text-xs text-slate-400">Database row-locking prevents double-booking when high-demand ticket drops occur simultaneously.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Hardware-Free Browser QR Scanner</h4>
                    <p className="text-xs text-slate-400">Staff can scan tickets on any smartphone camera with instantaneous duplicate check-in prevention.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Box */}
            <div className="rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800/80 p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold text-white">Cryptographic Gate Pass</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    VERIFIED ACTIVE
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Attendee</span>
                    <span className="text-white font-medium">Alex Rivera</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Booking Ref</span>
                    <span className="text-purple-300 font-mono">EVF-892401</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tier</span>
                    <span className="text-white font-medium">VIP Front Row & Lounge</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Gate Check-in</span>
                    <span className="text-emerald-400">Valid for Gate A Entry</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 text-center">
                  Tamper-proof ticket signatures backed by Supabase PostgreSQL.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 border-b border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Social Proof</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Loved by Attendees & Organizers Alike
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Eventify handled our 2,000-person tech summit ticket drop without a single timeout. The attendee check-in scanner saved our volunteers hours at the registration desk."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Elena Rostova"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Elena Rostova</h4>
                  <p className="text-[11px] text-slate-400">Organizer, Global AI Dev Summit</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Booking tickets took less than 45 seconds. Being able to download the crisp PDF with full offline QR code meant zero anxiety at the festival entrance."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                  alt="Alex Rivera"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Alex Rivera</h4>
                  <p className="text-[11px] text-slate-400">Music & Arts Festival Enthusiast</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "The real-time sales charts and attendee CSV exports are light years ahead of old ticketing dashboards. Eventify is our permanent home for all future tours."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Marcus Vance"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Marcus Vance</h4>
                  <p className="text-[11px] text-slate-400">Festival Producer, Soundwave Live</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-purple-950/60 via-slate-900 to-blue-950/60 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Experience Something Extraordinary?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Explore hundreds of verified concerts, conferences, and culinary galas. Or create your own event in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-xl transition-all"
            >
              Discover All Events
            </button>
            <button
              onClick={() => onNavigate('create-event')}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Host with Eventify
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
