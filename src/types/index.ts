export type UserRole = 'attendee' | 'organizer' | 'admin';

export type EventStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'cancelled';

export type BookingStatus = 'confirmed' | 'cancelled' | 'pending';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export type TicketStatus = 'valid' | 'used' | 'cancelled';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  role: UserRole;
  is_suspended?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  total_quantity: number;
  sold_quantity: number;
  sale_start?: string;
  sale_end?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  organizer?: Profile;
  title: string;
  slug: string;
  description: string;
  category: string;
  poster_url: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  start_time: string; // HH:mm
  end_time: string;
  registration_deadline?: string;
  venue_name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status: EventStatus;
  cancellation_policy?: string;
  contact_email?: string;
  contact_phone?: string;
  ticket_types?: TicketType[];
  reviews?: EventReview[];
  average_rating?: number;
  total_reviews?: number;
  created_at: string;
  updated_at?: string;
}

export interface BookingTicket {
  id: string;
  booking_id: string;
  ticket_type_id: string;
  ticket_type?: TicketType;
  ticket_code: string;
  qr_code: string;
  price: number;
  status: TicketStatus;
  checked_in_at?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  user?: Profile;
  event_id: string;
  event?: Event;
  booking_reference: string;
  total_amount: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  payment_reference?: string;
  tickets?: BookingTicket[];
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_provider: string;
  provider_order_id?: string;
  provider_payment_id?: string;
  status: 'captured' | 'failed' | 'pending';
  created_at: string;
}

export interface EventReview {
  id: string;
  event_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  rating: number; // 1-5
  review: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface EventReport {
  id: string;
  event_id: string;
  event_title?: string;
  reported_by: string;
  reporter_name?: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export interface EventFilterState {
  searchQuery: string;
  category: string;
  city: string;
  dateRange: 'all' | 'today' | 'this-weekend' | 'this-month' | 'custom';
  customDate?: string;
  priceType: 'all' | 'free' | 'paid';
  maxPrice?: number;
  sortBy: 'popularity' | 'newest' | 'price-asc' | 'price-desc';
}
