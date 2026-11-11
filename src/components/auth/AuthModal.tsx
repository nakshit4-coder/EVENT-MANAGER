import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Ticket } from 'lucide-react';
import type { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const { login, register, loginWithGoogle, switchPersona } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('attendee');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please provide an email address', 'error');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const res = await login(email.trim(), password);
      setIsSubmitting(false);
      if (res.success) {
        showToast('Welcome back to Eventify!', 'success');
        onClose();
      } else {
        showToast(res.error || 'Login failed. Check credentials.', 'error');
      }
    } else if (mode === 'register') {
      if (!fullName.trim() || !password) {
        setIsSubmitting(false);
        showToast('Please provide your name, email, and password', 'error');
        return;
      }
      const res = await register(email.trim(), password, fullName.trim(), selectedRole);
      setIsSubmitting(false);
      if (res.success) {
        showToast(`Account created as ${selectedRole}!`, 'success');
        onClose();
      } else {
        showToast(res.error || 'Registration failed', 'error');
      }
    } else if (mode === 'forgot') {
      setIsSubmitting(false);
      showToast(`Password recovery link sent to ${email}`, 'success');
      setMode('login');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      showToast('Logged in via Google Authentication', 'success');
      onClose();
    } catch {
      showToast('OAuth flow could not complete.', 'error');
    }
  };

  const handleQuickPersona = (role: UserRole) => {
    switchPersona(role);
    showToast(`Switched active persona to ${role}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {mode === 'login' && 'Sign in to Eventify'}
                {mode === 'register' && 'Create your account'}
                {mode === 'forgot' && 'Reset your password'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Quick Persona Picker for Instant Testing */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 space-y-2">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">
              1-Click Demo Login
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPersona('attendee')}
                className="py-1.5 px-2 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-semibold transition-colors"
              >
                Attendee
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('organizer')}
                className="py-1.5 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-semibold transition-colors"
              >
                Organizer
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('admin')}
                className="py-1.5 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white text-[11px] font-semibold transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Google OAuth Button */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase">Or with email</span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">I want to:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('attendee')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                        selectedRole === 'attendee'
                          ? 'border-purple-500 bg-purple-950/40 text-purple-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Book Tickets
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('organizer')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                        selectedRole === 'organizer'
                          ? 'border-purple-500 bg-purple-950/40 text-purple-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Host Events
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-slate-400">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-purple-400 hover:text-purple-300"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/40 transition-colors"
            >
              {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {/* Switch mode */}
          <div className="text-center text-xs text-slate-400 pt-1">
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-purple-400 hover:underline font-semibold">
                  Sign up
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-purple-400 hover:underline font-semibold">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Remembered your password?{' '}
                <button onClick={() => setMode('login')} className="text-purple-400 hover:underline font-semibold">
                  Back to Sign In
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
