import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Ticket, 
  Heart, 
  Calendar, 
  Save, 
  LogOut, 
  Key,
  CheckCircle2
} from 'lucide-react';
import type { Event, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { localStore } from '../lib/supabase';
import { EventCard } from '../components/events/EventCard';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
  onSelectEvent: (eventId: string) => void;
  allEvents: Event[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  onSelectEvent,
  allEvents,
}) => {
  const { user, role, updateProfile, logout, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'details' | 'favorites' | 'password'>('details');

  // Favorites
  const favoriteEventIds = user ? localStore.getFavorites(user.id) : [];
  const favoriteEvents = allEvents.filter(e => favoriteEventIds.includes(e.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    const success = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      avatar_url: avatarUrl.trim(),
    });

    if (success) {
      showToast('Profile updated successfully!', 'success');
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const res = await resetPassword(user.email);
    showToast(res.message, res.success ? 'success' : 'error');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-400">Please sign in to view your profile.</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-4 py-2 bg-purple-600 rounded-xl text-xs font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Profile Header Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user.full_name}
              className="w-18 h-18 rounded-2xl object-cover ring-2 ring-purple-500/40"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.full_name}</h1>
              <p className="text-xs text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono font-bold uppercase text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  {user.role}
                </span>
                {user.location && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => { logout(); onNavigate('landing'); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'details' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'favorites' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved Events ({favoriteEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'password' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* EDIT PROFILE TAB */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Account Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Location / Home City</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-950/40 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favoriteEvents.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-2 text-xs text-slate-400">
                <Heart className="w-8 h-8 mx-auto text-slate-600" />
                <p>No saved favorite events yet. Browse events and tap the heart icon to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {favoriteEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSelect={onSelectEvent}
                    isFavorite={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASSWORD & SECURITY TAB */}
        {activeTab === 'password' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>Password & Authentication</span>
            </h3>
            <p className="text-xs text-slate-400">
              Trigger a secure password reset link to your registered email address ({user.email}).
            </p>
            <button
              onClick={handlePasswordReset}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Send Password Reset Email
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
