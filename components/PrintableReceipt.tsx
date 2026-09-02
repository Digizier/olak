'use client';

import React, { useState } from 'react';
import { Booking, Captain, SiteSettings } from '@/lib/types';
import { exportElementToPdf } from '@/lib/pdfHelper';
import { 
  Printer, 
  Download,
  Loader2,
  X, 
  CheckCircle2, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Phone, 
  Clock, 
  Calendar
} from 'lucide-react';

interface Props {
  booking: Booking;
  captain?: Captain | null;
  settings: SiteSettings;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<Props> = ({ booking, captain, settings, onClose }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const triggerPrint = () => {
    window.print();
  };

  const triggerDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await exportElementToPdf(
        'printable-receipt-card', 
        `OLAK-${booking.booking_code}-Official-Invoice.pdf`
      );
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const bookingDate = new Date(booking.created_at);
  const formattedDate = bookingDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = bookingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const totalFare = booking.final_fare || booking.estimated_fare;
  const isDelivery = booking.service_type === 'delivery';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print & PDF) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">Official Trip Invoice</span>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold">
              {booking.booking_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct 1-Click PDF Download Button */}
            <button
              onClick={triggerDownloadPdf}
              disabled={isDownloadingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              title="Download official PDF file"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Direct Physical Printer Button */}
            <button
              onClick={triggerPrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Print to physical printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Card Body */}
        <div 
          id="printable-receipt-card"
          className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 print:p-4 print:space-y-5"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          
          {/* Header Strip with Official OLAK Logo */}
          <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {/* Official OLAK Logo */}
                <img 
                  src="/assets/olak-logo.png" 
                  alt="OLAK" 
                  className="h-9 sm:h-11 w-auto object-contain"
                />
                <div className="border-s-2 border-slate-200 ps-2.5">
                  <span className="text-xs font-black text-emerald-700 font-urdu block">اولاک تربت</span>
                  <span className="text-[10px] text-slate-500 font-urdu block">سفر ہر قدم آسان</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                {settings.address || 'Main Commercial Center, Turbat, Balochistan'}
              </p>
              <p className="text-[11px] text-slate-500">
                Helpline: <strong className="text-slate-800">{settings.phone}</strong> | WhatsApp: <strong className="text-slate-800">{settings.whatsapp}</strong>
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                Official Trip Invoice
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-950 tracking-tight">
                {booking.booking_code}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formattedDate}</span>
                <span className="text-slate-300">•</span>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Passenger & Captain Information Two-Column Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200 print:bg-slate-50 print:border-slate-200">
            {/* Passenger */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Passenger / Customer
              </span>
              <p className="text-sm font-black text-slate-900 leading-tight">
                {booking.customer_name}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{booking.customer_phone}</span>
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md uppercase">
                  Service: {booking.service_type}
                </span>
              </div>
            </div>

            {/* Captain */}
            <div className="space-y-1 border-s border-slate-200 ps-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Captain / Driver
              </span>
              {captain ? (
                <>
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {captain.full_name}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {captain.vehicle_name} • <span className="font-mono font-bold text-slate-800">{captain.vehicle_number_plate}</span>
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{captain.phone}</span>
                  </p>
                </>
              ) : (
                <div className="pt-1">
                  <p className="text-xs font-semibold text-slate-700">Self / On-demand Dispatch</p>
                  <p className="text-[11px] text-slate-500">Turbat Operations Fleet</p>
                </div>
              )}
            </div>
          </div>

          {/* Route & Destination Details */}
          <div className="space-y-2.5 bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Route & Destination Log
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Est. Distance: ~{booking.estimated_distance_km} KM
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Pickup Location</span>
                  <span className="font-bold text-slate-900">{booking.pickup_location}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Dropoff Destination</span>
                  <span className="font-bold text-slate-900">{booking.dropoff_location}</span>
                </div>
              </div>

              {isDelivery && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-700">
                  <span><strong>Parcel Type:</strong> {booking.delivery_parcel_type || 'General Goods'} ({booking.delivery_weight_kg || 1} KG)</span>
                  {booking.delivery_receiver_phone && (
                    <span><strong>Receiver:</strong> {booking.delivery_receiver_phone}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Fare Billing Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200 print:bg-slate-100">
                <tr>
                  <th className="px-4 py-2.5">Billing Description</th>
                  <th className="px-4 py-2.5 text-center">Distance / Units</th>
                  <th className="px-4 py-2.5 text-center">Payment</th>
                  <th className="px-4 py-2.5 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">
                      OLAK {booking.service_type.toUpperCase()} Mobility Service
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Standard verified passenger & courier fare
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700">
                    ~{booking.estimated_distance_km} KM
                  </td>
                  <td className="px-4 py-3 text-center uppercase font-bold text-slate-600">
                    {booking.payment_method || 'CASH'}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                    PKR {totalFare}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-600 text-slate-900 font-bold print:bg-emerald-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-xs font-black uppercase text-emerald-950">
                    Total Amount Due / ادا شدہ رقم:
                  </td>
                  <td className="px-4 py-3 text-right font-black text-base text-emerald-700 whitespace-nowrap">
                    PKR {totalFare}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification Stamp & Computer Generated Disclaimer */}
          <div className="pt-3 border-t border-slate-200 flex items-end justify-between">
            <div className="space-y-1 max-w-sm text-[10px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified OLAK Electronic Receipt</span>
              </div>
              <p>Thank you for choosing OLAK ({settings.company_name}) for your journey across Turbat.</p>
              <p>This is a computer-generated official receipt and requires no physical signature.</p>
              <p className="font-urdu text-[11px] text-slate-600">اولاک موبائل ایپ اور ویب سائٹ — سفر ہر قدم آسان</p>
            </div>

            {/* Official Stamp Box */}
            <div className="border-2 border-dashed border-emerald-600/80 bg-emerald-50/60 rounded-2xl p-3 text-center w-40 shrink-0 print:border-emerald-600">
              <div className="w-5 h-5 mx-auto text-emerald-600 mb-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="block text-[9px] uppercase font-black tracking-wider text-emerald-800">
                OLAK TURBAT
              </span>
              <span className="block text-[8px] font-bold text-emerald-700">
                VERIFIED DISPATCH
              </span>
              <span className="block text-[7px] text-slate-400 font-mono mt-0.5">
                STATUS: {booking.booking_status.toUpperCase()}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Action Footer (Hidden on Print & PDF) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Click <strong>Download PDF</strong> for instant file download or <strong>Print</strong> for physical printer.
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={triggerDownloadPdf}
              disabled={isDownloadingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={triggerPrint}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
