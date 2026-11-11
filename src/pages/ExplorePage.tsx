import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  X, 
  Calendar,
  DollarSign,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import type { Event, EventFilterState } from '../types';
import { EventCard } from '../components/events/EventCard';
import { useAuth } from '../contexts/AuthContext';
import { localStore } from '../lib/supabase';

interface ExplorePageProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
  initialFilters?: Partial<EventFilterState>;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  events,
  onSelectEvent,
  initialFilters = {},
}) => {
  const { user } = useAuth();
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<EventFilterState>({
    searchQuery: initialFilters.searchQuery || '',
    category: initialFilters.category || '',
    city: initialFilters.city || '',
    dateRange: initialFilters.dateRange || 'all',
    priceType: initialFilters.priceType || 'all',
    maxPrice: initialFilters.maxPrice || 1000,
    sortBy: initialFilters.sortBy || 'popularity',
  });

  // Favorites
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

  const categories = [
    'All Categories',
    'Music & Concerts',
    'Technology & Business',
    'Food & Culinary',
    'Art & Design',
    'Sports & Wellness',
    'Community & Culture'
  ];

  const cities = ['All Cities', 'Miami, FL', 'San Francisco, CA', 'Austin, TX', 'Napa Valley, CA', 'New York, NY'];

  // Filtered and Sorted Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Must be published for attendees
      if (e.status !== 'published') return false;

      // Search keyword
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesDesc = e.description.toLowerCase().includes(query);
        const matchesVenue = e.venue_name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesVenue) return false;
      }

      // Category
      if (filters.category && filters.category !== 'All Categories') {
        if (e.category !== filters.category) return false;
      }

      // City
      if (filters.city && filters.city !== 'All Cities') {
        if (!e.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      }

      // Price Filter
      const lowestPrice = e.ticket_types && e.ticket_types.length > 0
        ? Math.min(...e.ticket_types.map(t => t.price))
        : 0;

      if (filters.priceType === 'free' && lowestPrice > 0) return false;
      if (filters.priceType === 'paid' && lowestPrice === 0) return false;
      if (filters.maxPrice && lowestPrice > filters.maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (filters.sortBy === 'price-asc') {
        const minA = a.ticket_types ? Math.min(...a.ticket_types.map(t => t.price)) : 0;
        const minB = b.ticket_types ? Math.min(...b.ticket_types.map(t => t.price)) : 0;
        return minA - minB;
      }
      if (filters.sortBy === 'price-desc') {
        const minA = a.ticket_types ? Math.min(...a.ticket_types.map(t => t.price)) : 0;
        const minB = b.ticket_types ? Math.min(...b.ticket_types.map(t => t.price)) : 0;
        return minB - minA;
      }
      // Default: popularity by reviews / rating
      return (b.average_rating || 0) * (b.total_reviews || 1) - (a.average_rating || 0) * (a.total_reviews || 1);
    });
  }, [events, filters]);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      city: '',
      dateRange: 'all',
      priceType: 'all',
      maxPrice: 1000,
      sortBy: 'popularity',
    });
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery || 
    (filters.category && filters.category !== 'All Categories') || 
    (filters.city && filters.city !== 'All Cities') || 
    filters.priceType !== 'all' || 
    (filters.maxPrice !== undefined && filters.maxPrice < 1000)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Explore Events
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Discover live concerts, technology conferences, culinary festivals, and creative experiences.
              </p>
            </div>

            {/* Layout Toggle & Mobile Filter Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Filters {hasActiveFilters && '(Active)'}</span>
              </button>

              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  aria-label="Grid layout"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'list' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  aria-label="List layout"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Search & Sort Bar */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search events, artists, venues or keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4 flex items-center gap-2">
              <div className="relative w-full">
                <select
                  value={filters.sortBy}
                  onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="popularity">Sort: Most Popular</option>
                  <option value="newest">Sort: Newly Added</option>
                  <option value="price-asc">Sort: Price: Low to High</option>
                  <option value="price-desc">Sort: Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Filter Sidebar (Desktop + Mobile conditional) */}
          <aside className={`lg:col-span-3 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Refine Events</span>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Category</label>
                <div className="space-y-1">
                  {categories.map(cat => {
                    const isSelected = (!filters.category && cat === 'All Categories') || filters.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilters(prev => ({ ...prev, category: cat === 'All Categories' ? '' : cat }))}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">City / Region</label>
                <select
                  value={filters.city || 'All Cities'}
                  onChange={e => setFilters(prev => ({ ...prev, city: e.target.value === 'All Cities' ? '' : e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Price Type Segmented Control */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Admission Type</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, priceType: 'all' }))}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${filters.priceType === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, priceType: 'free' }))}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${filters.priceType === 'free' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, priceType: 'paid' }))}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${filters.priceType === 'paid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              {/* Max Price Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Max Ticket Price</span>
                  <span className="text-purple-400 font-mono tabular-nums font-semibold">
                    ${filters.maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="20"
                  value={filters.maxPrice}
                  onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

            </div>
          </aside>

          {/* Events Grid or List Area */}
          <main className="lg:col-span-9">
            
            {/* Results counter */}
            <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <strong className="text-white font-mono tabular-nums">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'}
              </div>
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Filters applied</span>
                  <button onClick={resetFilters} className="text-slate-500 hover:text-slate-300 underline">
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredEvents.length === 0 ? (
              <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No matching events found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search terms, changing the city, or clearing active filters.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            ) : layoutMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSelect={onSelectEvent}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.includes(event.id)}
                  />
                ))}
              </div>
            ) : (
              /* List Mode */
              <div className="space-y-4">
                {filteredEvents.map(event => {
                  const lowestPrice = event.ticket_types && event.ticket_types.length > 0
                    ? Math.min(...event.ticket_types.map(t => t.price))
                    : 0;

                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event.id)}
                      className="group cursor-pointer p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row gap-5 items-center transition-all duration-200"
                    >
                      <img
                        src={event.poster_url || '/src/assets/images/eventify_hero_concert_1794384951533.jpg'}
                        alt={event.title}
                        className="w-full sm:w-44 aspect-[16/10] object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
                          <span>{event.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{event.start_date}</span>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{event.venue_name}, {event.city}</span>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <span className="text-xs text-slate-400">Starting from</span>
                        <span className="text-base font-bold text-white font-mono tabular-nums">
                          {lowestPrice === 0 ? <span className="text-emerald-400">FREE</span> : `$${lowestPrice}`}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event.id);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
                        >
                          Book Tickets
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
};
