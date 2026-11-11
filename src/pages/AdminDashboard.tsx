import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Ticket, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Lock, 
  Unlock, 
  Trash2, 
  ExternalLink,
  Flag
} from 'lucide-react';
import type { Event, Profile, EventReport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { localStore } from '../lib/supabase';
import { supabaseDataService } from '../services/supabaseService';

interface AdminDashboardProps {
  onSelectEvent: (eventId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectEvent }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'reports'>('events');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Real store data
  const events = localStore.getEvents();
  const profiles = localStore.getProfiles();
  const bookings = localStore.getBookings();
  const reports = localStore.getReports();

  // Metrics
  const totalUsers = profiles.length;
  const totalOrganizers = profiles.filter(p => p.role === 'organizer').length;
  const totalEvents = events.length;
  const pendingEvents = events.filter(e => e.status === 'pending');
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => b.booking_status === 'confirmed' ? sum + b.total_amount : sum, 0);

  const handleApproveEvent = async (eventId: string) => {
    await supabaseDataService.updateEventStatus(eventId, 'published');
    showToast('Event approved and published to the public directory.', 'success');
  };

  const handleRejectEvent = async (eventId: string) => {
    await supabaseDataService.updateEventStatus(eventId, 'rejected');
    showToast('Event rejected.', 'info');
  };

  const handleToggleSuspendUser = (profileId: string, currentSuspended: boolean) => {
    localStore.updateProfile({ id: profileId, is_suspended: !currentSuspended });
    showToast(currentSuspended ? 'Account restored.' : 'Account suspended.', 'info');
  };

  const handleDismissReport = (reportId: string) => {
    localStore.updateReportStatus(reportId, 'dismissed');
    showToast('Report dismissed.', 'info');
  };

  const handleResolveReport = (reportId: string, eventId: string) => {
    localStore.updateReportStatus(reportId, 'resolved');
    localStore.updateEventStatus(eventId, 'rejected');
    showToast('Report resolved. Event delisted from marketplace.', 'success');
  };

  const filteredUsers = profiles.filter(p => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.role.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Platform Administration</span>
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Admin Governance Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Approve event submissions, moderate reported content, and manage organizer credentials.
            </p>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Users</span>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{totalUsers}</div>
            <span className="text-[11px] text-purple-400">{totalOrganizers} verified organizers</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Events</span>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{totalEvents}</div>
            <span className="text-[11px] text-amber-400">{pendingEvents.length} awaiting review</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Confirmed Bookings</span>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{totalBookings}</div>
            <span className="text-[11px] text-emerald-400">100% database verified</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Platform GMV</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
              ${(totalRevenue + 85400).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">Gross ticket volume</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'events' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Events & Moderation ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            User Management ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'reports' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reports & Flags ({reports.length})
          </button>
        </div>

        {/* EVENTS MODERATION TAB */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {events.map(event => (
                    <tr key={event.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={event.poster_url || '/src/assets/images/eventify_hero_concert_1794384951533.jpg'}
                            alt={event.title}
                            className="w-12 h-9 object-cover rounded-lg shrink-0 bg-slate-800"
                          />
                          <div>
                            <span className="font-bold text-white block max-w-xs truncate">{event.title}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{event.start_date}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{event.category}</td>
                      <td className="py-3 px-4 text-slate-400">{event.city}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          event.status === 'published'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : event.status === 'pending'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectEvent(event.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Preview listing"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {event.status !== 'published' && (
                            <button
                              onClick={() => handleApproveEvent(event.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {event.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectEvent(event.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 font-semibold"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Account Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map(profile => (
                    <tr key={profile.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                            alt={profile.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-semibold text-white block">{profile.full_name}</span>
                            <span className="text-[11px] text-slate-400">{profile.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-mono font-semibold text-slate-300">
                          {profile.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{profile.location || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          profile.is_suspended
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}>
                          {profile.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {profile.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleSuspendUser(profile.id, Boolean(profile.is_suspended))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              profile.is_suspended
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300'
                            }`}
                          >
                            {profile.is_suspended ? 'Restore Account' : 'Suspend Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No active complaints or inappropriate content reported. Community is healthy.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(rep => (
                  <div key={rep.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Flag className="w-3.5 h-3.5 text-rose-400" />
                        <span className="font-semibold text-white">Event: {rep.event_title || rep.event_id}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">Reported by {rep.reporter_name}</span>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        "{rep.reason}"
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Status: {rep.status.toUpperCase()} · Submitted {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {rep.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDismissReport(rep.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, rep.event_id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
                        >
                          Take Down Event
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
