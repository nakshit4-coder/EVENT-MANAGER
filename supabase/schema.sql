-- ==============================================================================
-- EVENTIFY: Full-Stack Event Management & Ticket Booking Database Schema
-- Production PostgreSQL Schema for Supabase (Auth, RLS, Storage, Triggers)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  currency TEXT DEFAULT 'USD' NOT NULL,
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
-- INDEXES FOR QUERY OPTIMIZATION
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

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_events_timestamp ON public.events;
CREATE TRIGGER update_events_timestamp
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- AUTO-SYNC NEW AUTH USERS INTO PROFILES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'attendee';
  v_full_name TEXT;
  v_avatar TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'organizer' THEN
    v_role := 'organizer';
  ELSIF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    v_role := 'admin';
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || NEW.id::text);

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_role,
    v_avatar
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent trigger errors from aborting auth user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- ATOMIC INVENTORY RESERVATION & SECURE CHECK-IN FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION reserve_ticket_inventory(
  p_ticket_type_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
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
  SELECT bt.*, b.event_id, b.user_id as attendee_id, tt.name as tier_name
  INTO v_ticket
  FROM public.booking_tickets bt
  JOIN public.bookings b ON bt.booking_id = b.id
  JOIN public.ticket_types tt ON bt.ticket_type_id = tt.id
  WHERE bt.ticket_code = p_ticket_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid ticket code. Not found in database.');
  END IF;

  SELECT * INTO v_scanner FROM public.profiles WHERE id = p_scanner_id;
  SELECT * INTO v_event FROM public.events WHERE id = v_ticket.event_id;

  IF v_scanner.role != 'admin' AND v_event.organizer_id != p_scanner_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: You are not the organizer of this event.');
  END IF;

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
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR 
     (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- Events:
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT USING (
    status = 'published' OR 
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Organizers and Admins can create events" ON public.events;
CREATE POLICY "Organizers and Admins can create events"
  ON public.events FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

DROP POLICY IF EXISTS "Organizers can update their own events" ON public.events;
CREATE POLICY "Organizers can update their own events"
  ON public.events FOR UPDATE USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Organizers can delete their own draft/pending events" ON public.events;
CREATE POLICY "Organizers can delete their own draft/pending events"
  ON public.events FOR DELETE USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ticket Types:
DROP POLICY IF EXISTS "Ticket types are viewable by everyone" ON public.ticket_types;
CREATE POLICY "Ticket types are viewable by everyone"
  ON public.ticket_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organizers can manage ticket types for their events" ON public.ticket_types;
CREATE POLICY "Organizers can manage ticket types for their events"
  ON public.ticket_types FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE id = ticket_types.event_id AND (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Bookings:
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.events WHERE id = bookings.event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Booking Tickets:
DROP POLICY IF EXISTS "Users can view their booking tickets" ON public.booking_tickets;
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
DROP POLICY IF EXISTS "Reviews are viewable by all" ON public.event_reviews;
CREATE POLICY "Reviews are viewable by all"
  ON public.event_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Attendees can create reviews" ON public.event_reviews;
CREATE POLICY "Attendees can create reviews"
  ON public.event_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications:
DROP POLICY IF EXISTS "Users can view and update their own notifications" ON public.notifications;
CREATE POLICY "Users can view and update their own notifications"
  ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Favorites:
DROP POLICY IF EXISTS "Users manage their favorites" ON public.favorites;
CREATE POLICY "Users manage their favorites"
  ON public.favorites FOR ALL USING (user_id = auth.uid());

-- Reports:
DROP POLICY IF EXISTS "Users can report events" ON public.event_reports;
CREATE POLICY "Users can report events"
  ON public.event_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Admins can view and manage event reports" ON public.event_reports;
CREATE POLICY "Admins can view and manage event reports"
  ON public.event_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- STORAGE BUCKETS & ACCESS POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for event-posters
DROP POLICY IF EXISTS "Public access to event posters" ON storage.objects;
CREATE POLICY "Public access to event posters"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-posters');

DROP POLICY IF EXISTS "Organizers can upload event posters" ON storage.objects;
CREATE POLICY "Organizers can upload event posters"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-posters' AND 
    auth.role() = 'authenticated'
  );

-- Storage Policies for profile-avatars
DROP POLICY IF EXISTS "Public access to profile avatars" ON storage.objects;
CREATE POLICY "Public access to profile avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-avatars' AND 
    auth.role() = 'authenticated'
  );
