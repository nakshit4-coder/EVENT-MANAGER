import React, { useState } from 'react';
import { Ticket, ArrowRight, ShieldCheck, Mail, Database, Send } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenConfigModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenConfigModal }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast(`Subscribed! You will receive weekly curated event drops at ${newsletterEmail}.`, 'success');
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
                <Ticket className="w-4 h-4" />
              </div>
              <span>
                EVENT<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">IFY</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed">
              Discover extraordinary events, book digital tickets with encrypted QR check-ins, and empower event creators with real-time analytics.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
              <button
                onClick={onOpenConfigModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase & Vercel Guide</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('explore', { category: 'Music & Concerts' })} className="hover:text-white transition-colors">
                  Music & Concerts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { category: 'Technology & Business' })} className="hover:text-white transition-colors">
                  Tech Summits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { category: 'Food & Culinary' })} className="hover:text-white transition-colors">
                  Food & Culinary
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { category: 'Art & Design' })} className="hover:text-white transition-colors">
                  Art & Design
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-white transition-colors">
                  All Featured Events
                </button>
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Organizers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('create-event')} className="hover:text-white transition-colors">
                  Create an Event
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('organizer-dashboard')} className="hover:text-white transition-colors">
                  Sales Analytics
                </button>
              </li>
              <li>
                <span className="text-slate-500">QR Check-in Scanner</span>
              </li>
              <li>
                <span className="text-slate-500">Attendee CSV Export</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Stay Connected</h4>
            <p className="text-xs text-slate-400">
              Get notified when top tier festival passes and conference tickets go live.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1 text-purple-400 hover:text-white rounded"
                  aria-label="Submit newsletter subscription"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[11px] text-slate-500 block">No spam. Unsubscribe anytime.</span>
            </form>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EVENTIFY Inc. All rights reserved. Built with React, Supabase & Tailwind.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security & RLS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
