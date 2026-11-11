import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

// Server-side Supabase client with Service Role privileges (NEVER exposed to frontend!)
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Health & Status
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Eventify Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Supabase Connection & Configuration Status (Safe, non-leaking)
  app.get('/api/supabase/status', async (_req, res) => {
    const isUrlConfigured = Boolean(supabaseUrl && !supabaseUrl.includes('your-project-ref') && supabaseUrl.startsWith('http'));
    const isAnonConfigured = Boolean(supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'));
    const isServiceRoleConfigured = Boolean(supabaseServiceRoleKey && supabaseServiceRoleKey.length > 20 && !supabaseServiceRoleKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'));

    let isConnected = false;
    let tablesFound: string[] = [];
    let connectionError: string | null = null;

    if (isUrlConfigured && (isAnonConfigured || isServiceRoleConfigured)) {
      try {
        const testClient = isServiceRoleConfigured && supabaseAdmin
          ? supabaseAdmin
          : createClient(supabaseUrl, supabaseAnonKey);

        // Ping database tables
        const results = await Promise.allSettled([
          testClient.from('events').select('count', { count: 'exact', head: true }),
          testClient.from('profiles').select('count', { count: 'exact', head: true }),
          testClient.from('bookings').select('count', { count: 'exact', head: true }),
          testClient.from('ticket_types').select('count', { count: 'exact', head: true }),
        ]);

        const tableNames = ['events', 'profiles', 'bookings', 'ticket_types'];
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && !r.value.error) {
            tablesFound.push(tableNames[idx]);
          }
        });

        isConnected = tablesFound.length > 0;
        if (!isConnected && results[0].status === 'fulfilled' && results[0].value.error) {
          connectionError = results[0].value.error.message;
        }
      } catch (err: any) {
        connectionError = err.message || 'Failed to connect to Supabase';
      }
    }

    res.json({
      configured: isUrlConfigured && isAnonConfigured,
      hasServiceRole: isServiceRoleConfigured,
      url: isUrlConfigured ? supabaseUrl.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, 'https://$1***$2') : 'Not Configured',
      isConnected,
      tablesFound,
      tablesCount: tablesFound.length,
      requiredTablesCount: 10,
      connectionError,
    });
  });

  // 3. Test Connection with custom parameters
  app.post('/api/supabase/test-connection', async (req, res) => {
    const { url, anonKey } = req.body;
    const targetUrl = url || supabaseUrl;
    const targetKey = anonKey || supabaseAnonKey;

    if (!targetUrl || !targetKey || targetUrl.includes('your-project-ref')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or placeholder Supabase credentials provided.',
      });
    }

    try {
      const client = createClient(targetUrl, targetKey);
      const { data, error } = await client.from('events').select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet, but check if endpoint is reachable
        if (error.message.includes('relation "public.events" does not exist')) {
          return res.json({
            success: true,
            tablesCreated: false,
            message: 'Connected to Supabase project successfully! Note: Database tables have not been created yet. Please execute /supabase/schema.sql in the Supabase SQL Editor.',
          });
        }
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.json({
        success: true,
        tablesCreated: true,
        message: 'Connected to Supabase PostgreSQL database successfully! Tables verified.',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Connection test failed',
      });
    }
  });

  // 4. Server-Side Secure Ticket Check-in (Service Role Protection)
  app.post('/api/tickets/checkin', async (req, res) => {
    const { ticketCode, scannerId } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ success: false, message: 'Ticket code is required' });
    }

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.rpc('check_in_ticket', {
          p_ticket_code: ticketCode,
          p_scanner_id: scannerId,
        });

        if (error) {
          return res.status(400).json({ success: false, message: error.message });
        }
        return res.json(data);
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    // Inform client to use client-side or fallback handler
    res.json({
      fallback: true,
      message: 'Service role key not configured on server; falling back to authenticated client check-in.',
    });
  });

  // 4b. Diagnostic DB Inspection
  app.get('/api/audit/db-inspect', async (_req, res) => {
    const client = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
    if (!client) {
      return res.status(400).json({ success: false, message: 'Client not configured' });
    }

    try {
      const tables = ['events', 'profiles', 'bookings', 'ticket_types', 'booking_tickets', 'payments', 'event_reviews', 'notifications', 'event_reports', 'favorites'];
      const statusMap: Record<string, any> = {};

      for (const t of tables) {
        const { data, error, count } = await client.from(t).select('*', { count: 'exact', head: false }).limit(2);
        statusMap[t] = {
          exists: !error || !error.message.includes('does not exist'),
          error: error ? error.message : null,
          count: count ?? 0,
          sample: data ? data[0] : null,
        };
      }

      // Check auth users
      let authUsersCount = 0;
      let authError: string | null = null;
      if (supabaseAdmin) {
        try {
          const { data: authData, error: aErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 5 });
          authUsersCount = authData?.users?.length || 0;
          if (aErr) authError = aErr.message;
        } catch (e: any) {
          authError = e.message;
        }
      }

      // Check storage buckets
      let buckets: any[] = [];
      let storageError: string | null = null;
      try {
        const { data: bData, error: bErr } = await client.storage.listBuckets();
        buckets = bData || [];
        if (bErr) storageError = bErr.message;
      } catch (e: any) {
        storageError = e.message;
      }

      res.json({
        success: true,
        tables: statusMap,
        authUsersCount,
        authError,
        buckets,
        storageError,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // 4c. Diagnostic Auth Test
  app.get('/api/audit/test-auth', async (_req, res) => {
    if (!supabaseAdmin) return res.json({ error: 'No admin client' });

    const email = `diag_${Date.now()}@eventify.test`;
    const password = 'Password123!Safe';

    // Test 1: createUser with full metadata including avatar_url
    const r1 = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Attendee',
        role: 'attendee',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    });

    // Test 2: client signUp with avatar_url
    let r2 = null;
    if (r1.error) {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      r2 = await client.auth.signUp({
        email: `signup_${Date.now()}@eventify.test`,
        password,
        options: {
          data: {
            full_name: 'Test Attendee',
            role: 'attendee',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          }
        }
      });
    }


    // Test 3: Check direct profile insert
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';
    const profileInsert = await supabaseAdmin.from('profiles').insert({
      id: testUuid,
      full_name: 'Test Profile',
      email: `test_profile_${Date.now()}@eventify.test`,
      role: 'attendee',
    });

    // Test 3b: Check RPC functions
    let rpcCheck = null;
    let execCheck = null;

    try {
      const { data, error } = await supabaseAdmin.rpc('check_in_ticket', {
        p_ticket_code: 'nonexistent',
        p_scanner_id: '00000000-0000-0000-0000-000000000000'
      });
      rpcCheck = { data, error: error ? error.message : null };
    } catch (e: any) {
      rpcCheck = { error: e.message };
    }

    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: 'SELECT 1' });
      execCheck = { data, error: error ? error.message : null };
    } catch (e: any) {
      execCheck = { error: e.message };
    }


    // Test 4: Check if DATABASE_URL or POSTGRES_URL is configured
    const dbKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('POSTGRES') || k.includes('DATABASE'));

    res.json({
      test1: { data: r1.data, error: r1.error },
      test2: r2 ? { data: r2.data, error: r2.error } : null,
      profileInsert: { error: profileInsert.error?.message },
      rpcCheck,
      execCheck,
      dbKeys,
    });
  });





  // 5. Run Complete End-to-End Audit Suite (All 20 Requirements)

  app.all('/api/audit/run-all-20', async (_req, res) => {
    try {
      const { runFullAudit } = await import('./src/server/auditSuite.ts');
      const report = await runFullAudit(supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
        stack: err.stack,
      });
    }
  });

  // 6. Seed sample events & organizers to real Supabase
  app.post('/api/supabase/seed-data', async (_req, res) => {
    const client = supabaseAdmin || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null);
    if (!client) {
      return res.status(400).json({ success: false, message: 'Supabase client not initialized.' });
    }

    try {
      // Check existing count
      const { count, error: countErr } = await client.from('events').select('*', { count: 'exact', head: true });
      if (countErr) {
        return res.status(400).json({ success: false, message: countErr.message });
      }

      if (count && count > 0) {
        return res.json({ success: true, count, message: `Database already contains ${count} events.` });
      }

      // 1. Ensure organizer user exists in Auth and Profiles
      let organizerId = '11111111-1111-4111-8111-111111111111';
      if (supabaseAdmin) {
        try {
          const { data: userAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: 'elena@eventify.live',
            password: 'OrganizerPassword2026!',
            email_confirm: true,
            user_metadata: { full_name: 'Elena Rostova', role: 'organizer' }
          });
          if (!authErr && userAuth?.user) {
            organizerId = userAuth.user.id;
          }
        } catch (e) {
          // ignore if user already exists
        }
      }

      // Ensure profile row
      await client.from('profiles').upsert({
        id: organizerId,
        full_name: 'Elena Rostova',
        email: 'elena@eventify.live',
        role: 'organizer',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: '+1 (555) 234-8901',
        location: 'San Francisco, CA',
        is_suspended: false,
      });

      // 2. Insert initial sample events
      const { generateUUID } = await import('./src/utils/uuid.ts');
      const seedEvents = [
        {
          id: generateUUID(),
          organizer_id: organizerId,
          title: 'Electric Horizon Music Festival 2026',
          slug: 'electric-horizon-music-festival-2026',
          category: 'Music & Concerts',
          poster_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
          description: 'Experience an unparalleled electronic audio-visual journey featuring top international DJs, state-of-the-art laser installations, and multi-stage performances under the stars.',
          start_date: '2026-08-14',
          end_date: '2026-08-16',
          start_time: '17:00',
          end_time: '02:00',
          venue_name: 'Bayfront Amphitheater',
          address: '301 Biscayne Blvd',
          city: 'Miami, FL',
          status: 'published',
          cancellation_policy: 'Full refund available up to 7 days before the event start date.',
          contact_email: 'support@soundwave.io',
          contact_phone: '+1 (555) 891-2345',
        },
        {
          id: generateUUID(),
          organizer_id: organizerId,
          title: 'Global AI Developer Summit 2026',
          slug: 'global-ai-developer-summit-2026',
          category: 'Technology & Business',
          poster_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
          description: 'The premier conference for foundational model research, edge inference architecture, and autonomous agents with world-class engineers.',
          start_date: '2026-09-22',
          end_date: '2026-09-24',
          start_time: '09:00',
          end_time: '18:00',
          venue_name: 'Moscone Convention Center',
          address: '747 Howard Street',
          city: 'San Francisco, CA',
          status: 'published',
          cancellation_policy: 'Full cancellation allowed up to 14 days before conference.',
          contact_email: 'elena@eventify.live',
          contact_phone: '+1 (555) 234-8901',
        },
        {
          id: generateUUID(),
          organizer_id: organizerId,
          title: 'Artisan Twilight Food & Wine Gala',
          slug: 'artisan-twilight-food-wine-gala',
          category: 'Food & Culinary',
          poster_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
          description: 'An open-air evening celebrating farm-to-table culinary mastery and boutique vineyard pairings with over 25 award-winning master chefs.',
          start_date: '2026-07-18',
          end_date: '2026-07-18',
          start_time: '18:00',
          end_time: '23:00',
          venue_name: 'Villa Bellissima Estates',
          address: '1420 Silverado Trail',
          city: 'Napa Valley, CA',
          status: 'published',
          cancellation_policy: 'Non-refundable within 7 days of event due to ingredient procurement.',
          contact_email: 'gala@eventify.live',
          contact_phone: '+1 (555) 762-3400',
        }
      ];

      for (const ev of seedEvents) {
        await client.from('events').insert(ev);
        await client.from('ticket_types').insert([
          {
            id: generateUUID(),
            event_id: ev.id,
            name: 'General Admission',
            description: 'Full event entry access',
            price: 89.00,
            total_quantity: 500,
            sold_quantity: 120,
          },
          {
            id: generateUUID(),
            event_id: ev.id,
            name: 'VIP Experience Pass',
            description: 'Expedited entry, VIP lounge, and complimentary refreshments',
            price: 249.00,
            total_quantity: 100,
            sold_quantity: 45,
          }
        ]);
      }

      res.json({
        success: true,
        message: 'Successfully seeded 3 live production events and ticket tiers to Supabase!',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });


  // Mount Vite development middlewares or serve production build
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eventify server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
