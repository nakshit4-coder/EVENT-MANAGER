import { createClient } from '@supabase/supabase-js';
import type { 
  Event, 
  TicketType, 
  Booking, 
  BookingTicket, 
  Profile, 
  EventReview, 
  AppNotification, 
  EventReport, 
  Favorite, 
  EventStatus 
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-ref') &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://mock-eventify.supabase.co', 'mock-anon-key');

// Pre-seeded initial data for instant evaluation & demonstration
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-organizer-1',
    full_name: 'Elena Rostova',
    email: 'elena@eventify.live',
    role: 'organizer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 234-8901',
    location: 'San Francisco, CA',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'user-organizer-2',
    full_name: 'Marcus Vance',
    email: 'marcus@soundwave.io',
    role: 'organizer',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 891-2345',
    location: 'Austin, TX',
    created_at: '2026-01-12T10:00:00Z',
  },
  {
    id: 'user-attendee-1',
    full_name: 'Alex Rivera',
    email: 'alex@example.com',
    role: 'attendee',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 432-1098',
    location: 'Seattle, WA',
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'user-admin-1',
    full_name: 'Sarah Chen (Admin)',
    email: 'admin@eventify.live',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 999-0000',
    location: 'New York, NY',
    created_at: '2026-01-01T00:00:00Z',
  }
];

const INITIAL_EVENTS: Event[] = [
  {
    id: 'event-01',
    organizer_id: 'user-organizer-2',
    title: 'Electric Horizon Festival 2026',
    slug: 'electric-horizon-festival-2026',
    category: 'Music & Concerts',
    poster_url: '/src/assets/images/eventify_hero_concert_1794384951533.jpg',
    description: 'Experience an unparalleled electronic audio-visual journey featuring top international DJs, state-of-the-art laser installations, immersive acoustics, and multi-stage performances across two unforgettable nights under the stars.',
    start_date: '2026-08-14',
    end_date: '2026-08-16',
    start_time: '17:00',
    end_time: '02:00',
    registration_deadline: '2026-08-13T23:59:00Z',
    venue_name: 'Bayfront Amphitheater',
    address: '301 Biscayne Blvd',
    city: 'Miami, FL',
    latitude: 25.7743,
    longitude: -80.1856,
    status: 'published',
    cancellation_policy: 'Full refund available up to 7 days before the event start date. 50% refund between 7 days and 48 hours.',
    contact_email: 'support@soundwave.io',
    contact_phone: '+1 (555) 891-2345',
    average_rating: 4.9,
    total_reviews: 38,
    created_at: '2026-01-15T08:00:00Z',
    ticket_types: [
      {
        id: 'tt-01-gen',
        event_id: 'event-01',
        name: 'General Admission',
        description: 'Standard access to Main Stage and Food Village across all festival days.',
        price: 89,
        total_quantity: 1500,
        sold_quantity: 1140,
      },
      {
        id: 'tt-01-vip',
        event_id: 'event-01',
        name: 'VIP Front Row & Lounge',
        description: 'Express lane entrance, dedicated elevated viewing deck, private air-conditioned restrooms, complimentary drinks bar.',
        price: 249,
        total_quantity: 300,
        sold_quantity: 285,
      },
      {
        id: 'tt-01-backstage',
        event_id: 'event-01',
        name: 'Backstage Platinum Pass',
        description: 'Artist lounge access, backstage tour, exclusive after-party invitation, and collectible festival merchandise box.',
        price: 499,
        total_quantity: 50,
        sold_quantity: 48,
      }
    ]
  },
  {
    id: 'event-02',
    organizer_id: 'user-organizer-1',
    title: 'Global AI Developer Summit 2026',
    slug: 'global-ai-developer-summit-2026',
    category: 'Technology & Business',
    poster_url: '/src/assets/images/event_tech_summit_1794384952885.jpg',
    description: 'The premier conference for foundational model research, edge inference architecture, autonomous agents, and open-source tooling. Featuring keynote presentations from industry pioneers, deep-dive technical workshops, and high-impact founder networking.',
    start_date: '2026-09-22',
    end_date: '2026-09-24',
    start_time: '09:00',
    end_time: '18:00',
    registration_deadline: '2026-09-20T18:00:00Z',
    venue_name: 'Moscone Convention Center, Hall D',
    address: '747 Howard Street',
    city: 'San Francisco, CA',
    latitude: 37.7842,
    longitude: -122.4016,
    status: 'published',
    cancellation_policy: 'Full cancellation allowed up to 14 days before conference. Substitutions of attendee names permitted anytime.',
    contact_email: 'elena@eventify.live',
    contact_phone: '+1 (555) 234-8901',
    average_rating: 4.8,
    total_reviews: 24,
    created_at: '2026-01-20T11:00:00Z',
    ticket_types: [
      {
        id: 'tt-02-virtual',
        event_id: 'event-02',
        name: 'Digital Stream & Q&A',
        description: 'Livestream all keynote stages, virtual speaker chatroom, and full video recordings archive access for 1 year.',
        price: 49,
        total_quantity: 5000,
        sold_quantity: 1820,
      },
      {
        id: 'tt-02-full',
        event_id: 'event-02',
        name: 'Full Conference Pass',
        description: 'Access to all stages, expo hall, daily catered lunch & refreshments, evening rooftop networking mixer.',
        price: 399,
        total_quantity: 1200,
        sold_quantity: 940,
      },
      {
        id: 'tt-02-exec',
        event_id: 'event-02',
        name: 'Executive & VIP Workshop Pass',
        description: 'Hands-on masterclasses with lead researchers, private VIP speaker dinner, dedicated co-working suite.',
        price: 899,
        total_quantity: 150,
        sold_quantity: 138,
      }
    ]
  },
  {
    id: 'event-03',
    organizer_id: 'user-organizer-1',
    title: 'Artisan Twilight Food & Wine Gala',
    slug: 'artisan-twilight-food-wine-gala',
    category: 'Food & Culinary',
    poster_url: '/src/assets/images/event_culinary_gala_1794384953612.jpg',
    description: 'An open-air evening celebrating farm-to-table culinary mastery and boutique vineyard pairings. Over 25 award-winning chefs serve live-cooked signature courses accompanied by sommelier-guided reserve wine tastings in an idyllic garden terrace setting.',
    start_date: '2026-07-18',
    end_date: '2026-07-18',
    start_time: '18:00',
    end_time: '23:00',
    registration_deadline: '2026-07-16T12:00:00Z',
    venue_name: 'Villa Bellissima Estates',
    address: '1420 Silverado Trail',
    city: 'Napa Valley, CA',
    latitude: 38.2975,
    longitude: -122.2869,
    status: 'published',
    cancellation_policy: 'Non-refundable within 7 days of event due to ingredient procurement. Fully transferable.',
    contact_email: 'gala@eventify.live',
    contact_phone: '+1 (555) 762-3400',
    average_rating: 5.0,
    total_reviews: 42,
    created_at: '2026-02-05T09:30:00Z',
    ticket_types: [
      {
        id: 'tt-03-tasting',
        event_id: 'event-03',
        name: 'Grand Tasting Passport',
        description: 'Unlimited culinary bites from 25 chef stations and 10 wine tasting pours, souvenir crystal tasting glass.',
        price: 135,
        total_quantity: 600,
        sold_quantity: 512,
      },
      {
        id: 'tt-03-cellar',
        event_id: 'event-03',
        name: 'Reserve Cellar & Sommelier Table',
        description: 'Exclusive 5-course seated pairing dinner with rare vintage library wines, private sommelier instruction.',
        price: 295,
        total_quantity: 120,
        sold_quantity: 118,
      }
    ]
  },
  {
    id: 'event-04',
    organizer_id: 'user-organizer-2',
    title: 'Chroma Vortex: Digital Art & Light Expo',
    slug: 'chroma-vortex-digital-art-expo',
    category: 'Art & Design',
    poster_url: '/src/assets/images/event_indie_art_fest_1794384953146.jpg',
    description: 'Walk through dynamic architectural light chambers, responsive projection-mapped geometry, and kinetic digital sculptures created by international digital artists. A multisensory journey exploring the fusion of human emotion and machine creativity.',
    start_date: '2026-08-01',
    end_date: '2026-08-08',
    start_time: '11:00',
    end_time: '22:00',
    registration_deadline: '2026-08-07T20:00:00Z',
    venue_name: 'The Foundry Modern Art Space',
    address: '450 Industrial Ave',
    city: 'Austin, TX',
    latitude: 30.2672,
    longitude: -97.7431,
    status: 'published',
    cancellation_policy: 'Free date change or full refund up to 24 hours prior to booked timeslot.',
    contact_email: 'expo@soundwave.io',
    contact_phone: '+1 (555) 891-2345',
    average_rating: 4.7,
    total_reviews: 19,
    created_at: '2026-02-10T14:15:00Z',
    ticket_types: [
      {
        id: 'tt-04-free-preview',
        event_id: 'event-04',
        name: 'Community Opening Night (Free)',
        description: 'Complimentary access for students, artists, and community members during opening evening. Limited capacity.',
        price: 0,
        total_quantity: 200,
        sold_quantity: 195,
      },
      {
        id: 'tt-04-day',
        event_id: 'event-04',
        name: 'General Admission',
        description: 'Timed entry ticket granting 2 hours exploration across all 7 immersive exhibition rooms.',
        price: 32,
        total_quantity: 1800,
        sold_quantity: 820,
      },
      {
        id: 'tt-04-night',
        event_id: 'event-04',
        name: 'Night Immersion & Sound Bath',
        description: 'Late night entry with ambient electronic live performance and complimentary herbal cocktail.',
        price: 55,
        total_quantity: 250,
        sold_quantity: 210,
      }
    ]
  }
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-1001',
    user_id: 'user-attendee-1',
    event_id: 'event-01',
    booking_reference: 'EVF-892401',
    total_amount: 178,
    booking_status: 'confirmed',
    payment_status: 'paid',
    payment_reference: 'pay_rzp_demo_892401',
    created_at: '2026-02-28T14:22:00Z',
    tickets: [
      {
        id: 'bkt-01',
        booking_id: 'bk-1001',
        ticket_type_id: 'tt-01-gen',
        ticket_code: 'TKT-EH26-892401-A',
        qr_code: 'EVENTIFY://CHECKIN?code=TKT-EH26-892401-A&event=event-01&ref=EVF-892401',
        price: 89,
        status: 'valid',
        created_at: '2026-02-28T14:22:00Z'
      },
      {
        id: 'bkt-02',
        booking_id: 'bk-1001',
        ticket_type_id: 'tt-01-gen',
        ticket_code: 'TKT-EH26-892401-B',
        qr_code: 'EVENTIFY://CHECKIN?code=TKT-EH26-892401-B&event=event-01&ref=EVF-892401',
        price: 89,
        status: 'valid',
        created_at: '2026-02-28T14:22:00Z'
      }
    ]
  }
];

const INITIAL_REVIEWS: EventReview[] = [
  {
    id: 'rev-01',
    event_id: 'event-01',
    user_id: 'user-attendee-1',
    user_name: 'Alex Rivera',
    user_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    review: 'Attended the last edition and it blew my mind! The production sound engineering and visual laser work were top tier. Can not wait for August!',
    created_at: '2026-02-20T16:00:00Z'
  },
  {
    id: 'rev-02',
    event_id: 'event-02',
    user_id: 'user-attendee-1',
    user_name: 'David Kim',
    user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    review: 'The quality of technical discussions and research papers presented here is unrivaled. Absolute must-attend for any AI practitioner.',
    created_at: '2026-02-22T09:30:00Z'
  }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    user_id: 'user-attendee-1',
    title: 'Booking Confirmed!',
    message: 'Your tickets for Electric Horizon Festival 2026 have been issued. Access your QR codes in My Bookings.',
    is_read: false,
    created_at: '2026-02-28T14:22:05Z'
  },
  {
    id: 'notif-02',
    user_id: 'user-organizer-1',
    title: 'New Ticket Sold',
    message: 'Alex Rivera purchased 2 tickets for Electric Horizon Festival.',
    is_read: true,
    created_at: '2026-02-28T14:22:05Z'
  }
];

// Persistent local data store implementation with reactive events
const STORAGE_KEYS = {
  EVENTS: 'eventify_db_events',
  BOOKINGS: 'eventify_db_bookings',
  PROFILES: 'eventify_db_profiles',
  REVIEWS: 'eventify_db_reviews',
  NOTIFICATIONS: 'eventify_db_notifications',
  FAVORITES: 'eventify_db_favorites',
  REPORTS: 'eventify_db_reports',
};

class EventifyLocalStore {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('eventify_store_updated', { detail: { key } }));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  }

  getProfiles(): Profile[] {
    return this.get<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  getProfile(id: string): Profile | undefined {
    return this.getProfiles().find(p => p.id === id);
  }

  updateProfile(profile: Partial<Profile> & { id: string }): Profile {
    const list = this.getProfiles();
    const index = list.findIndex(p => p.id === profile.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...profile, updated_at: new Date().toISOString() };
    } else {
      list.push(profile as Profile);
    }
    this.set(STORAGE_KEYS.PROFILES, list);
    return this.getProfile(profile.id)!;
  }

  getEvents(): Event[] {
    return this.get<Event[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  }

  getEventById(id: string): Event | undefined {
    return this.getEvents().find(e => e.id === id || e.slug === id);
  }

  saveEvent(event: Event): Event {
    const list = this.getEvents();
    const index = list.findIndex(e => e.id === event.id);
    if (index >= 0) {
      list[index] = { ...event, updated_at: new Date().toISOString() };
    } else {
      list.unshift(event);
    }
    this.set(STORAGE_KEYS.EVENTS, list);
    return event;
  }

  deleteEvent(id: string): void {
    const list = this.getEvents().filter(e => e.id !== id);
    this.set(STORAGE_KEYS.EVENTS, list);
  }

  updateEventStatus(id: string, status: EventStatus): Event | undefined {
    const list = this.getEvents();
    const event = list.find(e => e.id === id);
    if (event) {
      event.status = status;
      event.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.EVENTS, list);
    }
    return event;
  }

  getBookings(): Booking[] {
    return this.get<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  }

  saveBooking(booking: Booking): Booking {
    const list = this.getBookings();
    list.unshift(booking);
    this.set(STORAGE_KEYS.BOOKINGS, list);

    // Atomically increment sold quantities in event ticket_types
    const events = this.getEvents();
    const event = events.find(e => e.id === booking.event_id);
    if (event && event.ticket_types && booking.tickets) {
      for (const t of booking.tickets) {
        const tt = event.ticket_types.find(type => type.id === t.ticket_type_id);
        if (tt) {
          tt.sold_quantity = Math.min(tt.total_quantity, tt.sold_quantity + 1);
        }
      }
      this.set(STORAGE_KEYS.EVENTS, events);
    }

    return booking;
  }

  cancelBooking(bookingId: string): boolean {
    const list = this.getBookings();
    const booking = list.find(b => b.id === bookingId);
    if (!booking) return false;

    booking.booking_status = 'cancelled';
    booking.payment_status = 'refunded';
    if (booking.tickets) {
      booking.tickets.forEach(t => t.status = 'cancelled');
    }
    this.set(STORAGE_KEYS.BOOKINGS, list);

    // Restore ticket inventory
    const events = this.getEvents();
    const event = events.find(e => e.id === booking.event_id);
    if (event && event.ticket_types && booking.tickets) {
      for (const t of booking.tickets) {
        const tt = event.ticket_types.find(type => type.id === t.ticket_type_id);
        if (tt) {
          tt.sold_quantity = Math.max(0, tt.sold_quantity - 1);
        }
      }
      this.set(STORAGE_KEYS.EVENTS, events);
    }

    return true;
  }

  checkInTicket(ticketCode: string, scannerUserId: string): { 
    success: boolean; 
    message: string; 
    already_used?: boolean;
    ticket?: BookingTicket; 
    event?: Event;
  } {
    const bookings = this.getBookings();
    let foundTicket: BookingTicket | null = null;
    let foundBooking: Booking | null = null;

    for (const b of bookings) {
      if (b.tickets) {
        const t = b.tickets.find(item => item.ticket_code === ticketCode);
        if (t) {
          foundTicket = t;
          foundBooking = b;
          break;
        }
      }
    }

    if (!foundTicket || !foundBooking) {
      return { success: false, message: 'Invalid ticket code. No matching record in registry.' };
    }

    const event = this.getEventById(foundBooking.event_id);
    const scanner = this.getProfile(scannerUserId);

    if (scanner && scanner.role !== 'admin' && event && event.organizer_id !== scannerUserId) {
      return { success: false, message: 'Unauthorized: You are not designated as the organizer of this event.' };
    }

    if (foundTicket.status === 'used') {
      return {
        success: false,
        already_used: true,
        message: `TICKET ALREADY USED: Checked in on ${new Date(foundTicket.checked_in_at || '').toLocaleTimeString()}`,
        ticket: foundTicket,
        event
      };
    }

    if (foundTicket.status === 'cancelled') {
      return { success: false, message: 'Invalid: This ticket has been cancelled or refunded.' };
    }

    // Check in
    foundTicket.status = 'used';
    foundTicket.checked_in_at = new Date().toISOString();
    this.set(STORAGE_KEYS.BOOKINGS, bookings);

    return {
      success: true,
      message: 'Check-in verified! Welcome to the event.',
      ticket: foundTicket,
      event
    };
  }

  getReviews(eventId: string): EventReview[] {
    const all = this.get<EventReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    return all.filter(r => r.event_id === eventId);
  }

  addReview(review: EventReview): EventReview {
    const all = this.get<EventReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    all.unshift(review);
    this.set(STORAGE_KEYS.REVIEWS, all);

    // Update average rating
    const eventReviews = all.filter(r => r.event_id === review.event_id);
    const avg = eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length;
    const events = this.getEvents();
    const event = events.find(e => e.id === review.event_id);
    if (event) {
      event.average_rating = parseFloat(avg.toFixed(1));
      event.total_reviews = eventReviews.length;
      this.set(STORAGE_KEYS.EVENTS, events);
    }

    return review;
  }

  getNotifications(userId: string): AppNotification[] {
    const all = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return all.filter(n => n.user_id === userId);
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'created_at'>): AppNotification {
    const all = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    all.unshift(newNotif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotif;
  }

  markNotificationRead(notifId: string): void {
    const all = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const item = all.find(n => n.id === notifId);
    if (item) {
      item.is_read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  getFavorites(userId: string): string[] {
    const favs = this.get<Favorite[]>(STORAGE_KEYS.FAVORITES, []);
    return favs.filter(f => f.user_id === userId).map(f => f.event_id);
  }

  toggleFavorite(userId: string, eventId: string): boolean {
    let favs = this.get<Favorite[]>(STORAGE_KEYS.FAVORITES, []);
    const exists = favs.some(f => f.user_id === userId && f.event_id === eventId);
    if (exists) {
      favs = favs.filter(f => !(f.user_id === userId && f.event_id === eventId));
      this.set(STORAGE_KEYS.FAVORITES, favs);
      return false;
    } else {
      favs.push({ id: `fav-${Date.now()}`, user_id: userId, event_id: eventId, created_at: new Date().toISOString() });
      this.set(STORAGE_KEYS.FAVORITES, favs);
      return true;
    }
  }

  getReports(): EventReport[] {
    return this.get<EventReport[]>(STORAGE_KEYS.REPORTS, []);
  }

  addReport(report: Omit<EventReport, 'id' | 'created_at' | 'status'>): EventReport {
    const list = this.getReports();
    const item: EventReport = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(item);
    this.set(STORAGE_KEYS.REPORTS, list);
    return item;
  }

  updateReportStatus(id: string, status: EventReport['status']): void {
    const list = this.getReports();
    const item = list.find(r => r.id === id);
    if (item) {
      item.status = status;
      this.set(STORAGE_KEYS.REPORTS, list);
    }
  }
}

export const localStore = new EventifyLocalStore();
