import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import type { Event, TicketType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { localStore } from '../lib/supabase';
import { supabaseDataService } from '../services/supabaseService';
import { generateUUID, toValidUUID } from '../utils/uuid';

interface CreateEventPageProps {
  onBack: () => void;
  onSuccess: (event: Event) => void;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Music & Concerts');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('/src/assets/images/eventify_hero_concert_1794384951533.jpg');

  // Dates & Times
  const [startDate, setStartDate] = useState('2026-09-15');
  const [endDate, setEndDate] = useState('2026-09-17');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-09-14');

  // Location
  const [venueName, setVenueName] = useState('Grand Palladium Center');
  const [address, setAddress] = useState('500 Convention Way');
  const [city, setCity] = useState('Austin, TX');

  // Additional
  const [cancellationPolicy, setCancellationPolicy] = useState('Full refund up to 7 days before event start date.');
  const [contactEmail, setContactEmail] = useState(user?.email || 'events@eventify.live');
  const [contactPhone, setContactPhone] = useState('+1 (555) 234-8901');

  // Ticket Tiers
  const [ticketTiers, setTicketTiers] = useState<Array<{ name: string; price: number; quantity: number; desc: string }>>([
    { name: 'General Admission', price: 49, quantity: 500, desc: 'Full event floor access' },
    { name: 'VIP Pass', price: 149, quantity: 100, desc: 'Priority entrance & VIP lounge access' }
  ]);

  const presetPosters = [
    { label: 'Festival Concert', url: '/src/assets/images/eventify_hero_concert_1794384951533.jpg' },
    { label: 'Tech Summit', url: '/src/assets/images/event_tech_summit_1794384952885.jpg' },
    { label: 'Food & Wine Gala', url: '/src/assets/images/event_culinary_gala_1794384953612.jpg' },
    { label: 'Digital Art Expo', url: '/src/assets/images/event_indie_art_fest_1794384953146.jpg' },
  ];

  const handleAddTier = () => {
    setTicketTiers(prev => [
      ...prev,
      { name: 'Tier ' + (prev.length + 1), price: 75, quantity: 200, desc: 'Standard access' }
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) {
      showToast('At least one ticket category is required', 'error');
      return;
    }
    setTicketTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: 'published' | 'pending' | 'draft') => {
    if (!title.trim() || !description.trim() || !venueName.trim() || !city.trim()) {
      showToast('Please fill out all required basic and venue fields', 'error');
      return;
    }

    const eventId = generateUUID();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const generatedTiers: TicketType[] = ticketTiers.map((t) => ({
      id: generateUUID(),
      event_id: eventId,
      name: t.name,
      description: t.desc,
      price: Number(t.price),
      total_quantity: Number(t.quantity),
      sold_quantity: 0,
      created_at: new Date().toISOString(),
    }));

    const newEvent: Event = {
      id: eventId,
      organizer_id: toValidUUID(user?.id),
      title: title.trim(),
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      description: description.trim(),
      category,
      poster_url: posterUrl,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      registration_deadline: registrationDeadline,
      venue_name: venueName.trim(),
      address: address.trim(),
      city: city.trim(),
      status: status,
      cancellation_policy: cancellationPolicy,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      ticket_types: generatedTiers,
      average_rating: 5.0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
    };

    supabaseDataService.createEvent(newEvent, generatedTiers).then((res) => {
      if (res.error) {
        showToast(res.error, 'info');
      } else {
        showToast(status === 'published' ? 'Event published and saved to Supabase!' : 'Event submitted for admin review.', 'success');
      }
      onSuccess(newEvent);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubmit('draft')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('published')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-colors"
            >
              Publish Event Now
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create a New Event</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fill in the essential details, configure ticket categories, and launch your experience.
          </p>
        </div>

        {/* Multi-section form container */}
        <div className="space-y-6">
          
          {/* SECTION 1: BASIC DETAILS */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 font-mono text-xs flex items-center justify-center">1</span>
              <span>Basic Information</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Neon Odyssey Music & Light Festival"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Music & Concerts">Music & Concerts</option>
                    <option value="Technology & Business">Technology & Business</option>
                    <option value="Food & Culinary">Food & Culinary</option>
                    <option value="Art & Design">Art & Design</option>
                    <option value="Sports & Wellness">Sports & Wellness</option>
                    <option value="Community & Culture">Community & Culture</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Event Poster Preview
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src={posterUrl}
                      alt="Preview"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-800"
                    />
                    <div className="flex-1">
                      <select
                        value={posterUrl}
                        onChange={e => setPosterUrl(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                      >
                        {presetPosters.map(p => (
                          <option key={p.url} value={p.url}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Description *
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your artists, keynote speakers, venue ambience, schedule, and what attendees should expect..."
                  rows={4}
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DATE & TIME */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 font-mono text-xs flex items-center justify-center">2</span>
              <span>Date & Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Doors Open / Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Curfew / End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: VENUE & LOCATION */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 font-mono text-xs flex items-center justify-center">3</span>
              <span>Venue & Location</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Venue Name *</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={e => setVenueName(e.target.value)}
                  placeholder="e.g. Austin City Limits Center"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 310 Willie Nelson Blvd"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City, State *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: TICKET TIERS */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 font-mono text-xs flex items-center justify-center">4</span>
                <span>Ticket Categories & Pricing</span>
              </h2>

              <button
                type="button"
                onClick={handleAddTier}
                className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {ticketTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={e => {
                        const copy = [...ticketTiers];
                        copy[idx].name = e.target.value;
                        setTicketTiers(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Price ($USD, 0 for free)</label>
                    <input
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={e => {
                        const copy = [...ticketTiers];
                        copy[idx].price = Number(e.target.value);
                        setTicketTiers(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Quantity Available</label>
                    <input
                      type="number"
                      min="1"
                      value={tier.quantity}
                      onChange={e => {
                        const copy = [...ticketTiers];
                        copy[idx].quantity = Number(e.target.value);
                        setTicketTiers(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON ROW */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('published')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-xl shadow-purple-950/40 transition-colors"
            >
              Launch Event
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
