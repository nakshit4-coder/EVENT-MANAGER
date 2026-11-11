import React, { useState } from 'react';
import { 
  Compass, 
  Calendar, 
  Ticket, 
  LayoutDashboard, 
  ShieldAlert, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  PlusCircle,
  QrCode,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { localStore } from '../../lib/supabase';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  onNavigate, 
  onOpenAuthModal,
  onOpenScanner
}) => {
  const { user, role, logout, switchPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = user ? localStore.getNotifications(user.id) : [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Top Test-Drive Persona Bar for seamless evaluation */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-1.5 px-4 text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-400">DEMO PERSONA:</span>
          <span>Viewing as <strong className="text-white capitalize">{role || 'Guest'}</strong> ({user?.full_name || 'Guest'})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 mr-1">Switch:</span>
          <button
            onClick={() => switchPersona('attendee')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${role === 'attendee' ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Attendee
          </button>
          <button
            onClick={() => switchPersona('organizer')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${role === 'organizer' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Organizer
          </button>
          <button
            onClick={() => switchPersona('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${role === 'admin' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Main Top Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 dark:bg-slate-950/90 border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
            <span>
              EVENT<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">IFY</span>
            </span>
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${currentPage === 'landing' ? 'text-purple-400 font-semibold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${currentPage === 'explore' ? 'text-purple-400 font-semibold' : ''}`}
            >
              Explore Events
            </button>
            <button
              onClick={() => onNavigate('my-bookings')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${currentPage === 'my-bookings' ? 'text-purple-400 font-semibold' : ''}`}
            >
              My Bookings
            </button>
            {(role === 'organizer' || role === 'admin') && (
              <button
                onClick={() => onNavigate('organizer-dashboard')}
                className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${currentPage === 'organizer-dashboard' ? 'text-purple-400 font-semibold' : ''}`}
              >
                Organizer Studio
              </button>
            )}
            {role === 'admin' && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${currentPage === 'admin-dashboard' ? 'text-amber-400 font-semibold' : ''}`}
              >
                Admin Panel
              </button>
            )}
          </nav>

          {/* Zone 3: 1 primary action / controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Ticket QR Scanner (for organizers & admins) */}
            {(role === 'organizer' || role === 'admin') && (
              <button
                onClick={onOpenScanner}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition-colors"
                title="Scan QR Tickets"
              >
                <QrCode className="w-3.5 h-3.5 text-purple-400" />
                <span>Scan Passes</span>
              </button>
            )}

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-slate-950"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Notifications</span>
                      <span className="text-[11px] text-slate-400">{notifications.length} total</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => localStore.markNotificationRead(n.id)}
                            className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${n.is_read ? 'bg-slate-800/40 text-slate-400' : 'bg-purple-950/40 border border-purple-800/30 text-slate-200'}`}
                          >
                            <p className="font-semibold text-slate-200">{n.title}</p>
                            <p className="mt-0.5 text-slate-400 text-[11px]">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth / Profile Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors focus:outline-none"
                >
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/50"
                  />
                  <span className="hidden sm:inline text-xs font-medium text-slate-200 max-w-[100px] truncate">
                    {user.full_name.split(' ')[0]}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[10px] uppercase font-semibold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => { setIsUserMenuOpen(false); onNavigate('profile'); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => { setIsUserMenuOpen(false); onNavigate('my-bookings'); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>My Bookings</span>
                    </button>

                    {(role === 'organizer' || role === 'admin') && (
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onNavigate('create-event'); }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 transition-colors text-left"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create Event</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800"></div>

                    <button
                      onClick={() => { setIsUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg shadow-sm transition-all whitespace-nowrap"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Open mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
            <button
              onClick={() => { setIsMobileMenuOpen(false); onNavigate('landing'); }}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); onNavigate('explore'); }}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              Explore Events
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); onNavigate('my-bookings'); }}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              My Bookings
            </button>
            {(role === 'organizer' || role === 'admin') && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); onNavigate('organizer-dashboard'); }}
                className="block w-full text-left py-2 text-sm text-purple-400"
              >
                Organizer Dashboard
              </button>
            )}
            {role === 'admin' && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); onNavigate('admin-dashboard'); }}
                className="block w-full text-left py-2 text-sm text-amber-400"
              >
                Admin Panel
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
};
