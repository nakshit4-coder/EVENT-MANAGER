import React, { useState, useEffect } from 'react';
import type { Event, EventFilterState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { CreateEventPage } from './pages/CreateEventPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { AuthModal } from './components/auth/AuthModal';
import { QRScannerModal } from './components/scanner/QRScannerModal';
import { DeploymentGuideModal } from './components/modals/DeploymentGuideModal';
import { localStore } from './lib/supabase';

function EventifyApp() {
  const { user, role } = useAuth();
  
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [exploreFilters, setExploreFilters] = useState<Partial<EventFilterState>>({});
  
  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Reactive store state
  const [events, setEvents] = useState<Event[]>(() => localStore.getEvents());

  useEffect(() => {
    const handleStoreChange = () => {
      setEvents(localStore.getEvents());
    };

    window.addEventListener('eventify_store_updated', handleStoreChange);
    return () => {
      window.removeEventListener('eventify_store_updated', handleStoreChange);
    };
  }, []);

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'explore' && params) {
      setExploreFilters(params);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const selectedEvent = selectedEventId ? localStore.getEventById(selectedEventId) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Primary Top Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuthModal={handleOpenAuth}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            events={events}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            events={events}
            onSelectEvent={handleSelectEvent}
            initialFilters={exploreFilters}
          />
        )}

        {currentPage === 'event-details' && selectedEvent && (
          <EventDetailsPage
            event={selectedEvent}
            allEvents={events}
            onBack={() => handleNavigate('explore')}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentPage === 'my-bookings' && (
          <MyBookingsPage
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentPage === 'organizer-dashboard' && (
          <OrganizerDashboard
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentPage === 'create-event' && (
          <CreateEventPage
            onBack={() => handleNavigate(role === 'organizer' ? 'organizer-dashboard' : 'explore')}
            onSuccess={(newEvent) => {
              setSelectedEventId(newEvent.id);
              setCurrentPage('event-details');
            }}
          />
        )}

        {currentPage === 'admin-dashboard' && (
          <AdminDashboard
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            allEvents={events}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenConfigModal={() => setIsGuideOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      <DeploymentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <EventifyApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
