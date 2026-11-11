import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
import { localStore } from '../lib/supabase';

// Helper to get client-side Supabase credentials
export function getSupabaseCredentials() {
  let envUrl = '';
  let envKey = '';

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      envUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
      envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch {
    // ignore
  }

  if (!envUrl && typeof process !== 'undefined' && process.env) {
    envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  }

  // Check custom override in localStorage for live user testing
  try {
    if (typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem('eventify_custom_supabase');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed.url && parsed.anonKey) {
          return {
            url: parsed.url.trim(),
            anonKey: parsed.anonKey.trim(),
            source: 'custom' as const,
          };
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    url: envUrl.trim(),
    anonKey: envKey.trim(),
    source: 'env' as const,
  };
}


export function isConfiguredSupabase(url: string, key: string): boolean {
  return Boolean(
    url && 
    key && 
    !url.includes('your-project-ref') && 
    url.startsWith('https://') &&
    key.length > 20
  );
}

// Global reactive client instance
let currentCredentials = getSupabaseCredentials();
export let supabaseClient: SupabaseClient = isConfiguredSupabase(currentCredentials.url, currentCredentials.anonKey)
  ? createClient(currentCredentials.url, currentCredentials.anonKey)
  : createClient('https://placeholder-eventify.supabase.co', 'placeholder-anon-key');

export function updateSupabaseClient(url: string, anonKey: string) {
  if (isConfiguredSupabase(url, anonKey)) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eventify_custom_supabase', JSON.stringify({ url, anonKey }));
    }
    supabaseClient = createClient(url, anonKey);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eventify_supabase_reconfigured'));
    }
    return true;
  }
  return false;
}

export function clearCustomSupabaseConfig() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('eventify_custom_supabase');
  }
  currentCredentials = getSupabaseCredentials();
  supabaseClient = isConfiguredSupabase(currentCredentials.url, currentCredentials.anonKey)
    ? createClient(currentCredentials.url, currentCredentials.anonKey)
    : createClient('https://placeholder-eventify.supabase.co', 'placeholder-anon-key');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eventify_supabase_reconfigured'));
  }
}


export interface SupabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  urlDisplay: string;
  source: 'env' | 'custom' | 'none';
  hasServiceRoleOnServer: boolean;
  tablesFound: string[];
  errorMessage?: string;
}

class SupabaseDataService {
  async checkHealth(): Promise<SupabaseHealthStatus> {
    const creds = getSupabaseCredentials();
    const isConfig = isConfiguredSupabase(creds.url, creds.anonKey);

    // Try server endpoint first
    try {
      const serverRes = await fetch('/api/supabase/status');
      if (serverRes.ok) {
        const data = await serverRes.json();
        return {
          isConfigured: data.configured || isConfig,
          isConnected: data.isConnected,
          urlDisplay: creds.url ? creds.url.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2') : 'Not Configured',
          source: creds.source,
          hasServiceRoleOnServer: data.hasServiceRole,
          tablesFound: data.tablesFound || [],
          errorMessage: data.connectionError,
        };
      }
    } catch {
      // server endpoint unreachable, test client-side
    }

    if (!isConfig) {
      return {
        isConfigured: false,
        isConnected: false,
        urlDisplay: 'Not Configured',
        source: 'none',
        hasServiceRoleOnServer: false,
        tablesFound: [],
      };
    }

    // Direct browser test against Supabase
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('count', { count: 'exact', head: true });

      if (error) {
        return {
          isConfigured: true,
          isConnected: false,
          urlDisplay: creds.url.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2'),
          source: creds.source,
          hasServiceRoleOnServer: false,
          tablesFound: [],
          errorMessage: error.message,
        };
      }

      return {
        isConfigured: true,
        isConnected: true,
        urlDisplay: creds.url.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2'),
        source: creds.source,
        hasServiceRoleOnServer: false,
        tablesFound: ['events'],
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        isConnected: false,
        urlDisplay: creds.url.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2'),
        source: creds.source,
        hasServiceRoleOnServer: false,
        tablesFound: [],
        errorMessage: err.message || 'Network error reaching Supabase',
      };
    }
  }

  // 1. Events
  async getEvents(): Promise<{ events: Event[]; isFromSupabase: boolean }> {
    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        const { data, error } = await supabaseClient
          .from('events')
          .select(`
            *,
            ticket_types (*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return { events: data as Event[], isFromSupabase: true };
        }
      } catch (err) {
        console.warn('Supabase getEvents fallback:', err);
      }
    }
    return { events: localStore.getEvents(), isFromSupabase: false };
  }

  async getEventById(id: string): Promise<{ event: Event | null; isFromSupabase: boolean }> {
    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        const { data, error } = await supabaseClient
          .from('events')
          .select(`
            *,
            ticket_types (*),
            organizer:profiles (*)
          `)
          .or(`id.eq.${id},slug.eq.${id}`)
          .single();

        if (!error && data) {
          return { event: data as Event, isFromSupabase: true };
        }
      } catch (err) {
        console.warn('Supabase getEventById fallback:', err);
      }
    }
    const local = localStore.getEventById(id);
    return { event: local || null, isFromSupabase: false };
  }

  async createEvent(event: Event, ticketTiers: TicketType[]): Promise<{ success: boolean; event: Event; error?: string }> {
    // Always persist to localStore first for immediate UI reactivity
    localStore.saveEvent(event);

    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        // Exclude nested relation before inserting
        const { ticket_types, reviews, organizer, ...eventPayload } = event;
        const { error: eventError } = await supabaseClient
          .from('events')
          .insert(eventPayload);

        if (eventError) {
          console.warn('Supabase event insert error:', eventError);
          return { success: true, event, error: `Saved locally. Supabase error: ${eventError.message}` };
        }

        if (ticketTiers.length > 0) {
          const { error: tiersError } = await supabaseClient
            .from('ticket_types')
            .insert(ticketTiers);
          if (tiersError) {
            console.warn('Supabase ticket tiers insert error:', tiersError);
          }
        }
      } catch (err: any) {
        return { success: true, event, error: err.message };
      }
    }

    return { success: true, event };
  }

  async updateEventStatus(eventId: string, status: EventStatus): Promise<boolean> {
    localStore.updateEventStatus(eventId, status);
    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        await supabaseClient.from('events').update({ status }).eq('id', eventId);
      } catch (e) {
        console.warn(e);
      }
    }
    return true;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    localStore.deleteEvent(eventId);
    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        await supabaseClient.from('events').delete().eq('id', eventId);
      } catch (e) {
        console.warn(e);
      }
    }
    return true;
  }

  // 2. Bookings
  async createBooking(booking: Booking): Promise<{ success: boolean; booking: Booking; error?: string }> {
    localStore.saveBooking(booking);

    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        const { event, tickets, user, ...bookingPayload } = booking;
        const { error: bError } = await supabaseClient
          .from('bookings')
          .insert(bookingPayload);

        if (bError) {
          console.warn('Supabase booking insert error:', bError);
          return { success: true, booking, error: bError.message };
        }

        if (tickets && tickets.length > 0) {
          const ticketsPayload = tickets.map(({ ticket_type, ...t }) => t);
          await supabaseClient.from('booking_tickets').insert(ticketsPayload);
        }
      } catch (err: any) {
        return { success: true, booking, error: err.message };
      }
    }

    return { success: true, booking };
  }

  async getUserBookings(userId: string): Promise<{ bookings: Booking[]; isFromSupabase: boolean }> {
    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        const { data, error } = await supabaseClient
          .from('bookings')
          .select(`
            *,
            event:events (*),
            tickets:booking_tickets (*, ticket_type:ticket_types(*))
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return { bookings: data as Booking[], isFromSupabase: true };
        }
      } catch (e) {
        console.warn('Supabase getUserBookings error:', e);
      }
    }
    const all = localStore.getBookings();
    const userBookings = all.filter(b => b.user_id === userId || b.user_id === 'user-attendee-1');
    return { bookings: userBookings, isFromSupabase: false };
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    localStore.cancelBooking(bookingId);
    const creds = getSupabaseCredentials();
    if (isConfiguredSupabase(creds.url, creds.anonKey)) {
      try {
        await supabaseClient
          .from('bookings')
          .update({ booking_status: 'cancelled', payment_status: 'refunded' })
          .eq('id', bookingId);
        await supabaseClient
          .from('booking_tickets')
          .update({ status: 'cancelled' })
          .eq('booking_id', bookingId);
      } catch (e) {
        console.warn(e);
      }
    }
    return true;
  }

  // 3. Storage Upload
  async uploadPosterFile(file: File, eventId: string): Promise<{ url: string | null; error?: string }> {
    const creds = getSupabaseCredentials();
    if (!isConfiguredSupabase(creds.url, creds.anonKey)) {
      return { url: null, error: 'Supabase not configured' };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabaseClient.storage
        .from('event-posters')
        .upload(fileName, file, { upsert: true });

      if (error) return { url: null, error: error.message };

      const { data: publicData } = supabaseClient.storage
        .from('event-posters')
        .getPublicUrl(fileName);

      return { url: publicData.publicUrl };
    } catch (err: any) {
      return { url: null, error: err.message };
    }
  }
}

export const supabaseDataService = new SupabaseDataService();
