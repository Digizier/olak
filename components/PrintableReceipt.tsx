'use client';

import React from 'react';
import { Booking, Captain, SiteSettings } from '@/lib/types';

interface Props {
  booking: Booking;
  captain?: Captain | null;
  settings: SiteSettings;
}

export const PrintableReceipt: React.FC<Props> = ({ booking, captain, settings }) => {
  return (
    <div id="printable-receipt" className="hidden print:block bg-white text-black p-8 font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{settings.company_name}</h1>
          <p className="text-sm font-semibold">{settings.tagline_urdu}</p>
          <p className="text-xs text-gray-600 mt-1">{settings.address}</p>
          <p className="text-xs text-gray-600">Helpline: {settings.phone} | WhatsApp: {settings.whatsapp}</p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-gray-500 block font-bold">Official Trip Receipt</span>
          <span className="text-2xl font-black text-black font-mono">{booking.booking_code}</span>
          <span className="text-xs text-gray-600 block mt-1">
            Date: {new Date(booking.created_at).toLocaleDateString()} {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Customer & Captain Info Grid */}
      <div className="grid grid-cols-2 gap-6 border-b border-gray-300 pb-4 mb-6 text-sm">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Customer Details</h4>
          <p className="font-bold text-black">{booking.customer_name}</p>
          <p className="text-gray-700">Phone: {booking.customer_phone}</p>
          <p className="text-gray-700">Service: <span className="uppercase font-semibold">{booking.service_type}</span></p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Assigned Captain</h4>
          {captain ? (
            <div>
              <p className="font-bold text-black">{captain.full_name}</p>
              <p className="text-gray-700">Vehicle: {captain.vehicle_name} ({captain.vehicle_number_plate})</p>
              <p className="text-gray-700">Phone: {captain.phone}</p>
            </div>
          ) : (
            <p className="text-gray-600 italic">Self / On-demand Dispatch</p>
          )}
        </div>
      </div>

      {/* Route Info */}
      <div className="border-b border-gray-300 pb-4 mb-6 text-sm space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Route & Location Details</h4>
        <div className="flex justify-between">
          <span className="text-gray-600">Pickup Location:</span>
          <span className="font-semibold text-black">{booking.pickup_location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Dropoff Destination:</span>
          <span className="font-semibold text-black">{booking.dropoff_location}</span>
        </div>
        {booking.delivery_parcel_type && (
          <div className="flex justify-between">
            <span className="text-gray-600">Parcel Content:</span>
            <span className="font-semibold text-black">{booking.delivery_parcel_type} ({booking.delivery_weight_kg} KG)</span>
          </div>
        )}
      </div>

      {/* Itemized Fare Table */}
      <div className="mb-8">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Description</th>
              <th className="py-2 text-center">Distance</th>
              <th className="py-2 text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2.5 font-semibold capitalize">
                OLAK {booking.service_type} Ride Service Charge
              </td>
              <td className="py-2.5 text-center">~{booking.estimated_distance_km} KM</td>
              <td className="py-2.5 text-right font-bold">
                PKR {booking.final_fare || booking.estimated_fare}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold text-base">
              <td colSpan={2} className="py-3 text-right">Grand Total:</td>
              <td className="py-3 text-right font-black">
                PKR {booking.final_fare || booking.estimated_fare}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer Notes & Official Stamp */}
      <div className="border-t border-gray-300 pt-4 flex justify-between items-end text-xs text-gray-600">
        <div>
          <p className="font-semibold text-black">Thank you for riding with OLAK Mobility!</p>
          <p>This is a computer-generated official receipt.</p>
          <p>Turbat City, Balochistan • Safe & Reliable Transport</p>
        </div>
        <div className="border border-dashed border-gray-400 p-3 rounded text-center w-36">
          <span className="block text-[10px] uppercase font-bold text-gray-500">OLAK Dispatch</span>
          <span className="font-bold text-black text-xs">VERIFIED STAMP</span>
        </div>
      </div>
    </div>
  );
};
