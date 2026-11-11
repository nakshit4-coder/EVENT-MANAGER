import React, { useState } from 'react';
import { X, Database, Terminal, Globe, Key, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envSample = `VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">
              Supabase, Razorpay & Vercel Production Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close guide modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          
          {/* STEP 1: SUPABASE SETUP */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>1. Connect Real Supabase PostgreSQL & Auth</span>
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>supabase.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed pl-1">
              <li>Create a new project on <strong className="text-slate-200">Supabase</strong>.</li>
              <li>Go to <strong className="text-slate-200">SQL Editor</strong> and execute the generated schema in <code className="text-purple-300 font-mono">/supabase/schema.sql</code>. It creates all 10 tables, enums, triggers, RLS policies, and storage buckets.</li>
              <li>Go to <strong className="text-slate-200">Project Settings → API</strong> to copy your <em>Project URL</em> and <em>anon public key</em>.</li>
            </ol>
          </div>

          {/* STEP 2: RAZORPAY CONFIG */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Razorpay Payment Gateway Configuration</span>
              </span>
              <a
                href="https://dashboard.razorpay.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>razorpay.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed pl-1">
              <li>Log into Razorpay Dashboard and switch to <em>Test Mode</em> (or Live).</li>
              <li>Navigate to <strong className="text-slate-200">Account & Settings → API Keys</strong>.</li>
              <li>Generate your Key ID and Key Secret.</li>
            </ol>
          </div>

          {/* STEP 3: VERCEL DEPLOYMENT */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Deploy to Vercel</span>
              </span>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>vercel.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed pl-1">
              <li>Push your codebase to a GitHub repository.</li>
              <li>Import the repository on Vercel with framework preset set to <strong className="text-slate-200">Vite</strong>.</li>
              <li>Add the environment variables in Vercel project settings:</li>
            </ol>

            <div className="relative p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-purple-200">
              <button
                onClick={() => copyToClipboard(envSample, 'Environment Variables')}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                title="Copy snippet"
              >
                {copiedKey === 'Environment Variables' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="overflow-x-auto">{envSample}</pre>
            </div>
          </div>

        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
