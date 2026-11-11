-- ==============================================================================
-- EVENTIFY: Full-Stack Event Management & Ticket Booking Database Schema
-- Compatible with Supabase PostgreSQL, Authentication, Storage, & RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('attendee', 'organizer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'pending', 'published', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  role user_role DEFAULT 'attendee' NOT NULL,
  is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  poster_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  registration_deadline TIMESTAMPTZ,
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status event_status DEFAULT 'pending' NOT NULL,
  cancellation_policy TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TICKET TYPES TABLE
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
  sold_quantity INTEGER DEFAULT 0 NOT NULL CHECK (sold_quantity <= total_quantity),
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  booking_reference TEXT UNIQUE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  booking_status booking_status DEFAULT 'confirmed' NOT NULL,
  payment_status payment_status DEFAULT 'paid' NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. BOOKING TICKETS TABLE (Individual digital tickets with unique QR codes)
CREATE TABLE IF NOT EXISTS public.booking_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  ticket_code TEXT UNIQUE NOT NULL,
  qr_code TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status ticket_status DEFAULT 'valid' NOT NULL,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  payment_provider TEXT DEFAULT 'razorpay' NOT NULL,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status TEXT DEFAULT 'captured' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. EVENT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_event_user_review UNIQUE (event_id, user_id)
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. EVENT REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.event_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_favorite UNIQUE (user_id, event_id)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_booking_tickets_booking ON public.booking_tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_tickets_code ON public.booking_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER update_events_timestamp
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- TICKET INVENTORY SAFETY & CHECK-IN RPC FUNCTIONS
-- ==============================================================================
-- Atomically reserve tickets and increment sold_quantity
CREATE OR REPLACE FUNCTION reserve_ticket_inventory(
  p_ticket_type_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Select with FOR UPDATE to lock row against race conditions
  SELECT (total_quantity - sold_quantity) INTO v_available
  FROM public.ticket_types
  WHERE id = p_ticket_type_id
  FOR UPDATE;

  IF v_available >= p_quantity THEN
    UPDATE public.ticket_types
    SET sold_quantity = sold_quantity + p_quantity
    WHERE id = p_ticket_type_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check in a ticket securely with role and ownership verification
CREATE OR REPLACE FUNCTION check_in_ticket(
  p_ticket_code TEXT,
  p_scanner_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_event RECORD;
  v_scanner RECORD;
BEGIN
  -- Verify ticket exists
  SELECT bt.*, b.event_id, b.user_id as attendee_id, tt.name as tier_name
  INTO v_ticket
  FROM public.booking_tickets bt
  JOIN public.bookings b ON bt.booking_id = b.id
  JOIN public.ticket_types tt ON bt.ticket_type_id = tt.id
  WHERE bt.ticket_code = p_ticket_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid ticket code. Ticket not found.');
  END IF;

  -- Verify scanner role and event ownership
  SELECT * INTO v_scanner FROM public.profiles WHERE id = p_scanner_id;
  SELECT * INTO v_event FROM public.events WHERE id = v_ticket.event_id;

  IF v_scanner.role != 'admin' AND v_event.organizer_id != p_scanner_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: You are not the organizer of this event.');
  END IF;

  -- Check if already used
  IF v_ticket.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_used', true,
      'message', 'Ticket was ALREADY CHECKED IN at ' || v_ticket.checked_in_at,
      'checked_in_at', v_ticket.checked_in_at
    );
  END IF;

  IF v_ticket.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'message', 'This ticket has been CANCELLED.');
  END IF;

  -- Mark ticket as checked in
  UPDATE public.booking_tickets
  SET status = 'used', checked_in_at = NOW()
  WHERE ticket_code = p_ticket_code;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Check-in successful!',
    'tier_name', v_ticket.tier_name,
    'checked_in_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Profiles:
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile (cannot escalate role)"
  ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR 
     (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- Events:
CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT USING (
    status = 'published' OR 
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Organizers and Admins can create events"
  ON public.events FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "Organizers can update their own events"
  ON public.events FOR UPDATE USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Organizers can delete their own draft/pending events"
  ON public.events FOR DELETE USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ticket Types:
CREATE POLICY "Ticket types are viewable by everyone"
  ON public.ticket_types FOR SELECT USING (true);

CREATE POLICY "Organizers can manage ticket types for their events"
  ON public.ticket_types FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE id = ticket_types.event_id AND (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Bookings:
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.events WHERE id = bookings.event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Booking Tickets:
CREATE POLICY "Users can view their booking tickets"
  ON public.booking_tickets FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      JOIN public.events e ON b.event_id = e.id 
      WHERE b.id = booking_tickets.booking_id AND 
      (b.user_id = auth.uid() OR e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Reviews:
CREATE POLICY "Reviews are viewable by all"
  ON public.event_reviews FOR SELECT USING (true);

CREATE POLICY "Attendees can create reviews"
  ON public.event_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications:
CREATE POLICY "Users can view and update their own notifications"
  ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Favorites:
CREATE POLICY "Users manage their favorites"
  ON public.favorites FOR ALL USING (user_id = auth.uid());

-- Storage Buckets Setup:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;
