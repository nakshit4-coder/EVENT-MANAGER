import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localStore } from '../../lib/supabase';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scan Result State
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'already_used' | 'invalid';
    message: string;
    ticketCode?: string;
    checkedInAt?: string;
    tierName?: string;
  }>({ status: 'idle', message: '' });

  // Camera stream handling
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen && cameraActive) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraError(null);
        })
        .catch(err => {
          console.warn('Camera access error:', err);
          setCameraError('Camera access not available or blocked. Please use manual code check-in below.');
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, cameraActive]);

  if (!isOpen) return null;

  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = (codeToVerify || ticketCodeInput).trim();
    if (!code) {
      showToast('Please enter a ticket code', 'error');
      return;
    }

    const scannerId = user?.id || 'user-organizer-1';

    // Try server-side secure verification first
    try {
      const apiRes = await fetch('/api/tickets/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: code, scannerId }),
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (!apiData.fallback) {
          if (apiData.success) {
            setScanResult({
              status: 'success',
              message: apiData.message || 'Check-in verified via Supabase server-side RPC!',
              ticketCode: code,
              checkedInAt: new Date().toLocaleTimeString(),
              tierName: apiData.tier_name,
            });
            showToast('Check-in confirmed!', 'success');
            return;
          } else if (apiData.already_used) {
            setScanResult({
              status: 'already_used',
              message: apiData.message,
              ticketCode: code,
              checkedInAt: apiData.checked_in_at ? new Date(apiData.checked_in_at).toLocaleTimeString() : undefined,
            });
            return;
          } else {
            setScanResult({
              status: 'invalid',
              message: apiData.message || 'Invalid ticket code',
              ticketCode: code,
            });
            return;
          }
        }
      }
    } catch {
      // server API unavailable, proceed to client/store validation
    }

    const result = localStore.checkInTicket(code, scannerId);

    if (result.success) {
      setScanResult({
        status: 'success',
        message: result.message,
        ticketCode: code,
        checkedInAt: new Date().toLocaleTimeString(),
        tierName: result.ticket?.ticket_type?.name,
      });
      showToast('Check-in confirmed!', 'success');
    } else if (result.already_used) {
      setScanResult({
        status: 'already_used',
        message: result.message,
        ticketCode: code,
        checkedInAt: result.ticket?.checked_in_at ? new Date(result.ticket.checked_in_at).toLocaleTimeString() : undefined,
      });
    } else {
      setScanResult({
        status: 'invalid',
        message: result.message,
        ticketCode: code,
      });
    }
  };

  const handleReset = () => {
    setScanResult({ status: 'idle', message: '' });
    setTicketCodeInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Gate Ticket Scanner & Validator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close scanner modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Scan result display */}
          {scanResult.status !== 'idle' && (
            <div
              className={`p-4 rounded-2xl border text-center space-y-2 animate-in fade-in zoom-in-95 ${
                scanResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : scanResult.status === 'already_used'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex justify-center">
                {scanResult.status === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                {scanResult.status === 'already_used' && <AlertCircle className="w-8 h-8 text-amber-400" />}
                {scanResult.status === 'invalid' && <ShieldAlert className="w-8 h-8 text-rose-400" />}
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {scanResult.status === 'success' && 'Valid Ticket · Access Granted'}
                  {scanResult.status === 'already_used' && 'Duplicate Entry Rejected'}
                  {scanResult.status === 'invalid' && 'Invalid Ticket'}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{scanResult.message}</p>
                {scanResult.tierName && (
                  <span className="inline-block mt-2 text-xs font-mono font-bold bg-slate-900/80 px-2 py-0.5 rounded text-white">
                    Tier: {scanResult.tierName}
                  </span>
                )}
              </div>

              <button
                onClick={handleReset}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                Scan Next Attendee
              </button>
            </div>
          )}

          {/* Camera Viewfinder */}
          {cameraActive ? (
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-purple-500/60 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Laser line animation overlay */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-purple-500 shadow-[0_0_12px_#a855f7] animate-pulse" />
              <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/80 bg-black/60 py-1">
                Point camera at attendee QR code
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-purple-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Device Camera Feed</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Launch the rear camera to scan attendee passes continuously.
                </p>
              </div>
              <button
                onClick={() => setCameraActive(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                Activate Camera
              </button>
              {cameraError && (
                <p className="text-[11px] text-amber-400 leading-snug">{cameraError}</p>
              )}
            </div>
          )}

          {/* Manual Ticket Code Entry Form */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              Manual Code Validation
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ticketCodeInput}
                onChange={e => setTicketCodeInput(e.target.value)}
                placeholder="e.g. TKT-EH26-892401-A"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => handleVerifyCode()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shrink-0"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Quick Demo Test Passes */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Test Passes
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setTicketCodeInput('TKT-EH26-892401-A');
                  handleVerifyCode('TKT-EH26-892401-A');
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-purple-300 border border-slate-700"
              >
                Pass A (Unchecked)
              </button>
              <button
                onClick={() => {
                  setTicketCodeInput('TKT-EH26-892401-B');
                  handleVerifyCode('TKT-EH26-892401-B');
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-purple-300 border border-slate-700"
              >
                Pass B
              </button>
              <button
                onClick={() => {
                  setTicketCodeInput('TKT-FAKE-999999-Z');
                  handleVerifyCode('TKT-FAKE-999999-Z');
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-rose-300 border border-slate-700"
              >
                Fake Ticket
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
