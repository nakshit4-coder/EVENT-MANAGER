import React, { useEffect, useState } from 'react';
import { X, Download, Printer, Calendar, MapPin, User, Ticket as TicketIcon, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import type { Booking, BookingTicket } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface TicketViewerModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketViewerModal: React.FC<TicketViewerModalProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const tickets = booking.tickets || [];
  const currentTicket: BookingTicket | undefined = tickets[activeTicketIndex];

  useEffect(() => {
    if (!currentTicket) return;

    QRCode.toDataURL(currentTicket.qr_code || currentTicket.ticket_code, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('QR code generation error:', err);
    });
  }, [currentTicket]);

  if (!isOpen || !booking || !currentTicket) return null;

  const event = booking.event;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      // Background Navy
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 148, 210, 'F');

      // Top brand header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('EVENTIFY DIGITAL PASS', 15, 20);

      doc.setTextColor(192, 132, 252);
      doc.setFontSize(9);
      doc.text('OFFICIAL ADMISSION TICKET', 15, 26);

      // White card area
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 35, 124, 155, 4, 4, 'F');

      // Event Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      const splitTitle = doc.splitTextToSize(event?.title || 'Event Pass', 110);
      doc.text(splitTitle, 18, 47);

      // Event Details
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${event?.start_date} · Time: ${event?.start_time}`, 18, 62);
      doc.text(`Venue: ${event?.venue_name}, ${event?.city}`, 18, 68);
      doc.text(`Tier: ${currentTicket.ticket_type?.name || 'General'}`, 18, 74);
      doc.text(`Attendee: ${booking.user?.full_name || 'Verified Guest'}`, 18, 80);
      doc.text(`Booking Ref: ${booking.booking_reference}`, 18, 86);
      doc.text(`Ticket Code: ${currentTicket.ticket_code}`, 18, 92);

      // Hairline divider
      doc.setDrawColor(226, 232, 240);
      doc.line(18, 98, 130, 98);

      // Embed QR Code
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 42, 104, 64, 64);
      }

      // Gate instruction
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Present this QR code at the venue gate for instant check-in.', 74, 178, { align: 'center' });
      doc.text('Valid for 1 admission. Non-transferable once checked in.', 74, 183, { align: 'center' });

      doc.save(`Ticket-${currentTicket.ticket_code}.pdf`);
      showToast('Ticket PDF generated and downloaded!', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Could not generate PDF. Please try printing screen.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Action Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Digital Entry Pass
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close pass modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-ticket selector if booking has multiple passes */}
        {tickets.length > 1 && (
          <div className="px-6 pt-4 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0">Pass:</span>
            {tickets.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => setActiveTicketIndex(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
                  activeTicketIndex === idx
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Pass {idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Pass Visual Canvas */}
        <div className="p-6">
          <div className="rounded-2xl bg-white text-slate-900 overflow-hidden shadow-2xl border border-slate-200">
            
            {/* Ticket Header Banner */}
            <div className="bg-slate-950 text-white p-5 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
                  EVENTIFY ADMISSION
                </span>
                <h3 className="text-base font-extrabold text-white mt-1 leading-snug">
                  {event?.title || 'Live Experience'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {event?.start_date} · {event?.start_time}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-purple-300 block">
                  {currentTicket.ticket_type?.name}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {currentTicket.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Perforated separator */}
            <div className="relative border-b-2 border-dashed border-slate-300 py-1 bg-slate-100 flex items-center justify-between px-4">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border border-slate-800" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border border-slate-800" />
            </div>

            {/* Ticket Body with QR Code */}
            <div className="p-6 text-center space-y-4 bg-white">
              <div className="inline-block p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Admission QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Loading QR...
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-mono font-bold text-slate-900 tracking-wider">
                  {currentTicket.ticket_code}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Ref: {booking.booking_reference}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Venue</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{event?.venue_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Attendee</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{booking.user?.full_name || 'Guest'}</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center text-xs text-slate-400">
          Present this barcode or QR pass at the venue entrance. Check-in staff will scan directly from your device screen.
        </div>

      </div>
    </div>
  );
};
