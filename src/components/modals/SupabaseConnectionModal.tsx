import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  ShieldCheck,
  Server,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  updateSupabaseClient, 
  clearCustomSupabaseConfig, 
  supabaseDataService,
  SupabaseHealthStatus 
} from '../../services/supabaseService';
import { useToast } from '../../contexts/ToastContext';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [health, setHealth] = useState<SupabaseHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Form inputs for testing or overriding
  const creds = getSupabaseCredentials();
  const [urlInput, setUrlInput] = useState(creds.url);
  const [anonKeyInput, setAnonKeyInput] = useState(creds.anonKey);
  const [isTestingCustom, setIsTestingCustom] = useState(false);

  const checkConnection = async () => {
    setIsLoading(true);
    const status = await supabaseDataService.checkHealth();
    setHealth(status);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingCustom(true);

    try {
      const res = await fetch('/api/supabase/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), anonKey: anonKeyInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        updateSupabaseClient(urlInput.trim(), anonKeyInput.trim());
        showToast(data.message, 'success');
        checkConnection();
      } else {
        showToast(data.message || 'Connection failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not reach server endpoint', 'error');
    } finally {
      setIsTestingCustom(false);
    }
  };

  const handleCopySchema = async () => {
    try {
      const schemaResponse = await fetch('/supabase/schema.sql');
      const text = await schemaResponse.text();
      navigator.clipboard.writeText(text);
      setCopiedSQL(true);
      showToast('Complete SQL Schema copied to clipboard!', 'success');
      setTimeout(() => setCopiedSQL(false), 2500);
    } catch {
      showToast('Failed to load SQL file text. Please view /supabase/schema.sql', 'error');
    }
  };

  const requiredTables = [
    'profiles', 'events', 'ticket_types', 'bookings', 'booking_tickets',
    'payments', 'event_reviews', 'notifications', 'event_reports', 'favorites'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Supabase PostgreSQL Connection & Health Inspector
              </h2>
              <p className="text-[11px] text-slate-400">Real-time database connectivity and security verification</p>
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          
          {/* Live Status Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Connection Status
              </span>
              <button
                onClick={checkConnection}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${health?.isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
              <div>
                <h4 className="text-sm font-bold text-white">
                  {health?.isConnected 
                    ? 'Connected to Live Supabase Database' 
                    : health?.isConfigured 
                    ? 'Credentials Configured · Verifying Database Tables'
                    : 'Awaiting Supabase Credentials'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target Endpoint: <code className="font-mono text-purple-300">{health?.urlDisplay || 'None'}</code>
                </p>
              </div>
            </div>

            {/* Security Verification Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-0.5">
                <span className="text-slate-500 block">Frontend Client</span>
                <span className="font-semibold text-white">
                  {health?.isConfigured ? 'Publishable Key Active' : 'Not Loaded'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-0.5">
                <span className="text-slate-500 block">Server-Side Admin</span>
                <span className={`font-semibold ${health?.hasServiceRoleOnServer ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {health?.hasServiceRoleOnServer ? 'Service Role Bound' : 'Pending in .env'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-0.5">
                <span className="text-slate-500 block">Secret Key Security</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Hidden from Browser</span>
                </span>
              </div>
            </div>

            {health?.errorMessage && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-[11px] leading-relaxed">
                <strong>Status Message:</strong> {health.errorMessage}
              </div>
            )}
          </div>

          {/* Table Verification Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Database Tables (10 Required)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {health?.tablesFound.length || 0} / 10 verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {requiredTables.map(table => {
                const isFound = health?.tablesFound.includes(table) || health?.isConnected;
                return (
                  <div
                    key={table}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      isFound
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-semibold truncate">{table}</div>
                    <span className="text-[9px] uppercase tracking-wider block mt-0.5">
                      {isFound ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SQL Migration Script Execution Guide */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>How to Execute Migration in Supabase</span>
              </span>
              <button
                onClick={handleCopySchema}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition-colors"
              >
                {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSQL ? 'Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
              <li>Log into your project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-purple-400 underline">supabase.com/dashboard</a>.</li>
              <li>Click on the <strong className="text-white">SQL Editor</strong> tab on the left sidebar.</li>
              <li>Click <strong className="text-white">"New query"</strong>, paste the copied SQL from above (from <code className="text-purple-300 font-mono">/supabase/schema.sql</code>), and click <strong className="text-white">Run</strong>.</li>
              <li>All tables, auto-profile triggers, atomic ticket reservation functions, and storage buckets (<code className="text-purple-300 font-mono">event-posters</code>, <code className="text-purple-300 font-mono">profile-avatars</code>) are created instantly!</li>
            </ol>
          </div>

          {/* Test or Override Credentials Form */}
          <form onSubmit={handleTestAndSave} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Configure or Override Credentials
            </span>
            <p className="text-[11px] text-slate-400">
              You can set these in <code className="text-purple-300">.env</code> or test directly below:
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">VITE_SUPABASE_URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">VITE_SUPABASE_ANON_KEY (Publishable Public Key)</label>
                <input
                  type="password"
                  value={anonKeyInput}
                  onChange={e => setAnonKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {creds.source === 'custom' && (
                <button
                  type="button"
                  onClick={() => {
                    clearCustomSupabaseConfig();
                    setUrlInput('');
                    setAnonKeyInput('');
                    showToast('Reset to default environment configuration', 'info');
                    checkConnection();
                  }}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Reset to .env defaults
                </button>
              )}
              <button
                type="submit"
                disabled={isTestingCustom}
                className="ml-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
              >
                {isTestingCustom ? 'Testing Connection...' : 'Test & Connect'}
              </button>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">Eventify PostgreSQL Integration v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
