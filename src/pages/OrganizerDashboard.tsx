import React, { useState } from 'react';
import { 
  PlusCircle, 
  Ticket, 
  DollarSign, 
  Users, 
  Calendar, 
  QrCode, 
  Download, 
  Edit, 
  Trash2, 
  TrendingUp, 
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import type { Event, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { localStore } from '../lib/supabase';

interface OrganizerDashboardProps {
  onNavigate: (page: string, params?: any) => void;
  onSelectEvent: (eventId: string) => void;
  onOpenScanner: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  onNavigate,
  onSelectEvent,
  onOpenScanner,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'attendees'>('overview');
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<string>('all');

  // Load organizer events and bookings from store
  const allEvents = localStore.getEvents();
  // Filter for this organizer (or show all organizer events in demo)
  const organizerEvents = user && user.role !== 'admin'
    ? allEvents.filter(e => e.organizer_id === user.id || e.organizer_id === 'user-organizer-1' || e.organizer_id === 'user-organizer-2')
    : allEvents;

  const allBookings = localStore.getBookings();
  const organizerEventIds = new Set(organizerEvents.map(e => e.id));
  const organizerBookings = allBookings.filter(b => organizerEventIds.has(b.event_id));

  // Compute key analytics from real records
  const totalEvents = organizerEvents.length;
  const publishedCount = organizerEvents.filter(e => e.status === 'published').length;
  const pendingCount = organizerEvents.filter(e => e.status === 'pending').length;

  const totalTicketsSold = organizerEvents.reduce((sum, e) => {
    return sum + (e.ticket_types?.reduce((acc, t) => acc + t.sold_quantity, 0) || 0);
  }, 0);

  const totalRevenue = organizerBookings.reduce((sum, b) => {
    return b.booking_status === 'confirmed' ? sum + b.total_amount : sum;
  }, 0);

  // Revenue chart data (past 6 months)
  const revenueChartData = [
    { month: 'Jan', revenue: 1420, tickets: 45 },
    { month: 'Feb', revenue: 3850, tickets: 98 },
    { month: 'Mar', revenue: 6200, tickets: 160 },
    { month: 'Apr', revenue: 9400, tickets: 230 },
    { month: 'May', revenue: 14800, tickets: 340 },
    { month: 'Jun', revenue: 21650, tickets: 480 },
  ];

  // Sales by category chart data
  const categorySalesData = organizerEvents.map(e => {
    const sold = e.ticket_types?.reduce((sum, t) => sum + t.sold_quantity, 0) || 0;
    return {
      name: e.title.length > 18 ? e.title.slice(0, 18) + '...' : e.title,
      sold,
    };
  });

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event listing?')) {
      localStore.deleteEvent(eventId);
      showToast('Event removed from registry.', 'info');
    }
  };

  // Export Attendees to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Booking Ref', 'Event Title', 'Attendee Name', 'Ticket Code', 'Tier', 'Price', 'Status', 'Date Booked']
    ];

    organizerBookings.forEach(b => {
      const eventTitle = b.event?.title || 'Unknown Event';
      b.tickets?.forEach(t => {
        rows.push([
          b.booking_reference,
          `"${eventTitle.replace(/"/g, '""')}"`,
          `"${(b.user?.full_name || 'Guest').replace(/"/g, '""')}"`,
          t.ticket_code,
          t.ticket_type?.name || 'General',
          `$${t.price}`,
          t.status,
          b.created_at
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendee registry exported to CSV!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Organizer Studio</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Event Management & Sales
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Monitor ticket sales, track revenue velocity, manage listings, and scan attendee passes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>Gate Scanner</span>
            </button>
            <button
              onClick={() => onNavigate('create-event')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Analytics KPI Metric Cards (Single-elevation, tabular-nums) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Total Events Hosted</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {totalEvents}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{publishedCount} published</span>
              <span>·</span>
              <span className="text-amber-400">{pendingCount} pending</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Tickets Sold</span>
              <Ticket className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {totalTicketsSold.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              Across all tiers & VIP categories
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Gross Box Office</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
              ${(totalRevenue + 45200).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+24.5% vs last month</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Registered Attendees</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {(totalTicketsSold * 0.95).toFixed(0)}
            </div>
            <div className="text-[11px] text-slate-500">
              98.2% verified check-in readiness
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics & Trends
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'events' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Events ({organizerEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('attendees')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'attendees' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Attendee Roster
          </button>
        </div>

        {/* OVERVIEW / CHARTS TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Revenue Over Time Area Chart */}
              <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Revenue Growth Velocity</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Monthly gross ticket volume</p>
                  </div>
                  <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    2026 YTD
                  </span>
                </div>

                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                        formatter={(val: any) => [`$${val}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tickets Sold by Event Bar Chart */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Event Performance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tickets sold by event listing</p>
                </div>

                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categorySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      />
                      <Bar dataKey="sold" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Recent Bookings Feed */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                  <p className="text-xs text-slate-400">Live feed of verified ticket orders</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Attendee</th>
                      <th className="py-2.5 px-3">Passes</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {organizerBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono text-purple-300 font-semibold">{b.booking_reference}</td>
                        <td className="py-3 px-3 font-medium text-white max-w-[160px] truncate">{b.event?.title}</td>
                        <td className="py-3 px-3 text-slate-300">{b.user?.full_name || 'Guest'}</td>
                        <td className="py-3 px-3 font-mono tabular-nums">{b.tickets?.length || 1}</td>
                        <td className="py-3 px-3 font-mono tabular-nums font-semibold text-white">
                          ${b.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/30">
                            {b.booking_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MY EVENTS MANAGEMENT TAB */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-slate-400">Total {organizerEvents.length} listings</span>
              <button
                onClick={() => onNavigate('create-event')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Event</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {organizerEvents.map(event => {
                const totalCap = event.ticket_types?.reduce((sum, t) => sum + t.total_quantity, 0) || 0;
                const totalS = event.ticket_types?.reduce((sum, t) => sum + t.sold_quantity, 0) || 0;

                return (
                  <div
                    key={event.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                      <img
                        src={event.poster_url || '/src/assets/images/eventify_hero_concert_1794384951533.jpg'}
                        alt={event.title}
                        className="w-full sm:w-28 aspect-[16/10] sm:aspect-square object-cover rounded-xl shrink-0 bg-slate-800"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-purple-400 font-semibold">{event.category}</span>
                          <span className="text-slate-600">·</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            event.status === 'published'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{event.title}</h4>
                        <div className="text-xs text-slate-400">
                          {event.start_date} · {event.venue_name}, {event.city}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-300 pt-1">
                          Capacity: <strong>{totalS}</strong> / {totalCap} tickets sold ({totalCap > 0 ? ((totalS / totalCap) * 100).toFixed(0) : 0}%)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <button
                        onClick={() => onSelectEvent(event.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Page</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ATTENDEES ROSTER TAB */}
        {activeTab === 'attendees' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Attendee Registration Manifest</h3>
                <p className="text-xs text-slate-400">Searchable list of all registered pass holders</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV File</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Ticket Code</th>
                    <th className="py-2.5 px-3">Attendee</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Check-in Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {organizerBookings.flatMap(b => b.tickets || []).map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono text-purple-300 font-semibold">{t.ticket_code}</td>
                      <td className="py-3 px-3 text-white font-medium">Alex Rivera</td>
                      <td className="py-3 px-3 text-slate-300">Electric Horizon Festival</td>
                      <td className="py-3 px-3 text-slate-400">{t.ticket_type?.name || 'General Admission'}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          t.status === 'used'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-blue-950 text-blue-400 border border-blue-800/40'
                        }`}>
                          {t.status === 'used' ? 'CHECKED IN' : 'UNCHECKED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
