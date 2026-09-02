'use client';

import React from 'react';
import { AdvancedAnalyticsSummary, SiteSettings } from '@/lib/types';
import { printElementDirectly } from '@/lib/printHelper';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Car, 
  Users, 
  Calendar,
  Clock
} from 'lucide-react';

interface Props {
  analytics: AdvancedAnalyticsSummary;
  settings: SiteSettings;
  onClose: () => void;
}

export const AnalyticsReportModal: React.FC<Props> = ({ analytics, settings, onClose }) => {
  const triggerPrint = () => {
    printElementDirectly(
      'analytics-report-card',
      `OLAK-Financial-Report-${analytics.dateRange.startDate}-to-${analytics.dateRange.endDate}`
    );
  };

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const generatedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print & PDF) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">Official Executive Analytics & Financial Audit Report</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Instant Print / Save PDF Button */}
            <button
              onClick={triggerPrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Open full-color print and PDF dialog"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Card Body */}
        <div 
          id="analytics-report-card"
          className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 print:p-4 print:space-y-4"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          
          {/* Header Strip with Official OLAK Logo */}
          <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/olak-logo.png" 
                  alt="OLAK" 
                  className="h-10 sm:h-12 w-auto object-contain"
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
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full inline-block">
                Operations & Financial Audit
              </span>
              <div className="text-base sm:text-lg font-black text-slate-950">
                Performance Executive Report
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Audited on {generatedDate}</span>
                <span className="text-slate-300">•</span>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{generatedTime}</span>
              </div>
            </div>
          </div>

          {/* Selected Date Range Notification Strip */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">Selected Audit Period:</span>
              <span className="text-xs font-black text-white">{analytics.dateRange.label}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/40 px-3 py-1 rounded-full">
              {analytics.dateRange.daysCount} Calendar Days Aggregated
            </span>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Gross Ride Volume</span>
              <div className="text-xl font-black text-emerald-950">PKR {analytics.financials.grossVolume.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Total passenger spend</span>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-teal-700 block">Platform Commission</span>
              <div className="text-xl font-black text-teal-950">PKR {analytics.financials.platformCommission.toLocaleString()}</div>
              <span className="text-[10px] text-teal-600 font-medium">{analytics.financials.commissionRate}% platform fee</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">Captains Net Income</span>
              <div className="text-xl font-black text-blue-950">PKR {analytics.financials.driverEarnings.toLocaleString()}</div>
              <span className="text-[10px] text-blue-600 font-medium">Paid out to verified drivers</span>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-700 block">Trip Conversion</span>
              <div className="text-xl font-black text-purple-950">{analytics.trips.completionRate}%</div>
              <span className="text-[10px] text-purple-600 font-medium">{analytics.trips.completed} of {analytics.trips.total} trips completed</span>
            </div>
          </div>

          {/* Detailed Financial & Trips Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Financial Reconciliation Table */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Financial Reconciliation Summary</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Ride Volume (GMV):</span>
                  <strong className="text-slate-900">PKR {analytics.financials.grossVolume.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Commission ({analytics.financials.commissionRate}%):</span>
                  <strong className="text-emerald-700">PKR {analytics.financials.platformCommission.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Driver Take-Home Earnings (90%):</span>
                  <strong className="text-blue-700">PKR {analytics.financials.driverEarnings.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cleared Cash Paid by Drivers:</span>
                  <strong className="text-teal-700">PKR {analytics.financials.clearedCash.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Outstanding Settlement Balance:</span>
                  <strong className="text-red-600">PKR {analytics.financials.pendingClearance.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-800 font-bold">
                  <span>Average Order Value (AOV):</span>
                  <span className="text-emerald-700">PKR {analytics.financials.averageOrderValue} / trip</span>
                </div>
              </div>
            </div>

            {/* Trip Operations Breakdown */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Car className="w-3.5 h-3.5 text-teal-600" />
                <span>Trip Operations & Fleet Funnel</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Rides & Courier Orders:</span>
                  <strong className="text-slate-900">{analytics.trips.total}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Successfully Completed:</span>
                  <strong className="text-emerald-700">{analytics.trips.completed} ({analytics.trips.completionRate}%)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>In-Progress / Assigned:</span>
                  <strong className="text-blue-700">{analytics.trips.inProgress}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pending Assignment:</span>
                  <strong className="text-amber-700">{analytics.trips.pending}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cancelled Orders:</span>
                  <strong className="text-red-600">{analytics.trips.cancelled} ({analytics.trips.cancellationRate}%)</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-800 font-bold">
                  <span>Total Distance Covered:</span>
                  <span className="text-slate-900">~{analytics.trips.totalDistanceKm} KM (Avg ~{analytics.trips.avgDistanceKm} KM)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Service Category Performance Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200">
              Service Category Performance Matrix
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">Service Type</th>
                  <th className="px-4 py-2 text-center">Total Bookings</th>
                  <th className="px-4 py-2 text-center">Share of Trips</th>
                  <th className="px-4 py-2 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.services.map((s) => (
                  <tr key={s.service} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{s.label}</td>
                    <td className="px-4 py-2.5 text-center text-slate-700">{s.trips}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-emerald-700">
                      PKR {s.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Captains Leaderboard Table */}
          {analytics.topCaptains.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200">
                Top Performing Captains in Range
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Captain Name</th>
                    <th className="px-4 py-2">Vehicle & Plate</th>
                    <th className="px-4 py-2 text-center">Completed Trips</th>
                    <th className="px-4 py-2 text-right">Gross Fare</th>
                    <th className="px-4 py-2 text-right">Net Driver Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.topCaptains.slice(0, 5).map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td className="px-4 py-2 font-bold text-slate-900">{c.name}</td>
                      <td className="px-4 py-2 text-slate-600">{c.vehicle} ({c.plate})</td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-700">{c.trips}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900">PKR {c.grossRevenue.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-black text-blue-700">PKR {c.netEarnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Official Stamp & Disclaimer */}
          <div className="pt-3 border-t border-slate-200 flex items-end justify-between">
            <div className="space-y-1 max-w-sm text-[10px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Certified OLAK Administrative Audit Document</span>
              </div>
              <p>Generated automatically by OLAK Mobility Turbat Management Information System.</p>
              <p>All records are verified against live Supabase cloud database logs.</p>
              <p className="font-urdu text-[11px] text-slate-600">اولاک موبائل سروس تربت — سفر ہر قدم آسان</p>
            </div>

            {/* Official Stamp Box */}
            <div className="border-2 border-dashed border-emerald-600/80 bg-emerald-50/60 rounded-2xl p-3 text-center w-44 shrink-0 print:border-emerald-600">
              <div className="w-5 h-5 mx-auto text-emerald-600 mb-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="block text-[9px] uppercase font-black tracking-wider text-emerald-800">
                OLAK TURBAT
              </span>
              <span className="block text-[8px] font-bold text-emerald-700">
                AUDITED & VERIFIED
              </span>
              <span className="block text-[7px] text-slate-400 font-mono mt-0.5">
                PERIOD: {analytics.dateRange.startDate} - {analytics.dateRange.endDate}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Action Footer (Hidden on Print & PDF) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Click <strong>Print Report / Save PDF</strong> to send to your physical printer or export as a digital PDF document.
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={triggerPrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report / Save PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
