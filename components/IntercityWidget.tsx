'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { INITIAL_INTERCITY_ROUTES } from '@/lib/constants';
import { createBooking, getIntercityRoutes, getCurrentCustomer } from '@/lib/db';
import { Booking, IntercityRoute, Customer } from '@/lib/types';
import { CustomerAuthModal } from '@/components/CustomerAuthModal';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Car, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Phone,
  Package,
  Route,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const IntercityWidget = () => {
  const { t, isUrdu } = useLanguage();
  
  const [routes, setRoutes] = useState<IntercityRoute[]>(INITIAL_INTERCITY_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(INITIAL_INTERCITY_ROUTES[0].id);
  const [vehicleClass, setVehicleClass] = useState<'economy' | 'comfort' | 'cargo'>('economy');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [seats, setSeats] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    getIntercityRoutes().then((data) => {
      if (data && data.length > 0) {
        setRoutes(data);
        setSelectedRouteId(data[0].id);
      }
    });

    const cur = getCurrentCustomer();
    if (cur) {
      setCurrentCustomer(cur);
      setCustomerName(cur.full_name);
      setCustomerPhone(cur.phone);
    }

    const handleUpdate = (e: any) => {
      if (e.detail && e.detail.length > 0) {
        setRoutes(e.detail);
      }
    };
    const handleCustomerAuth = (e: any) => {
      setCurrentCustomer(e.detail);
      if (e.detail) {
        setCustomerName(e.detail.full_name);
        setCustomerPhone(e.detail.phone);
      }
    };

    window.addEventListener('olak_intercity_updated', handleUpdate);
    window.addEventListener('olak_customer_auth_changed', handleCustomerAuth);
    return () => {
      window.removeEventListener('olak_intercity_updated', handleUpdate);
      window.removeEventListener('olak_customer_auth_changed', handleCustomerAuth);
    };
  }, []);

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || INITIAL_INTERCITY_ROUTES[0];

  // Pricing is decided STRICTLY by Admin in the Admin Panel (Fixed vs Per-KM)
  const isPerKm = currentRoute.pricing_model === 'per_km';
  const perKmRate = currentRoute.per_km_rate || 25;
  const distanceKm = currentRoute.estimated_distance_km;

  let estimatedFare = 0;
  if (isPerKm) {
    const multiplier = vehicleClass === 'economy' ? 1.0 : vehicleClass === 'comfort' ? 1.4 : 0.25;
    estimatedFare = Math.round((distanceKm * perKmRate * multiplier) / 50) * 50;
  } else {
    if (vehicleClass === 'economy') {
      estimatedFare = currentRoute.car_economy_fare;
    } else if (vehicleClass === 'comfort') {
      estimatedFare = currentRoute.car_comfort_fare;
    } else {
      estimatedFare = currentRoute.delivery_parcel_fare;
    }
  }

  const executeIntercityBooking = async (name: string, phone: string) => {
    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        service_type: 'intercity',
        customer_name: name,
        customer_phone: phone,
        pickup_location: `${currentRoute.origin_city} (Intercity Terminal)`,
        dropoff_location: `${currentRoute.destination_city} (City Center)`,
        intercity_origin: currentRoute.origin_city,
        intercity_destination: currentRoute.destination_city,
        intercity_travel_date: travelDate || new Date().toISOString().split('T')[0],
        intercity_seats: parseInt(seats) || 1,
        notes: `Class: ${vehicleClass.toUpperCase()} • ${notes}`,
        estimated_distance_km: distanceKm,
        estimated_fare: estimatedFare,
        payment_method: 'cash',
      });

      setConfirmedBooking(booking);
      setIsSubmitting(false);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D084', '#10B981', '#061325']
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('Could not book intercity seat. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if customer is already logged in
    const activeCustomer = getCurrentCustomer() || currentCustomer;
    if (!activeCustomer) {
      setShowAuthModal(true);
      return;
    }

    await executeIntercityBooking(activeCustomer.full_name || customerName, activeCustomer.phone || customerPhone);
  };

  const handleAuthSuccess = async (customer: Customer) => {
    setCurrentCustomer(customer);
    setCustomerName(customer.full_name);
    setCustomerPhone(customer.phone);
    setShowAuthModal(false);

    await executeIntercityBooking(customer.full_name, customer.phone);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
      {confirmedBooking ? (
        <div className="text-center py-6 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {isUrdu ? 'انٹرسٹی سیٹ کنفرم' : 'Intercity Booking Confirmed'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-600 mt-1 font-urdu">
              {isUrdu 
                ? 'ہائی وے ڈرائیور آپ سے روانگی کے وقت سے پہلے رابطہ کرے گا۔' 
                : 'Our highway dispatch desk has scheduled your vehicle.'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'روٹ' : 'Route'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.intercity_origin} ➔ {confirmedBooking.intercity_destination}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'مسافر' : 'Passenger'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.customer_name} ({confirmedBooking.customer_phone})</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'فاصلہ و وقت' : 'Distance & Duration'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.estimated_distance_km} KM • {currentRoute.estimated_duration}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'تاریخ سفر' : 'Travel Date'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.intercity_travel_date}</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-1 text-base">
              <span className="font-bold text-emerald-600">{isUrdu ? 'کرایہ' : 'Total Fare'}:</span>
              <span className="font-black text-emerald-600">PKR {confirmedBooking.estimated_fare}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`/track/?code=${confirmedBooking.booking_code}`}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>{t.track_status_btn}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setConfirmedBooking(null)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition border border-slate-200 cursor-pointer"
            >
              {isUrdu ? 'دوسری ٹکٹ بک کریں' : 'Book Another Route'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isUrdu ? 'بلوچستان انٹرسٹی ہائی وے سفر' : 'Balochistan Intercity Travel'}
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Highway Inspected
            </span>
          </div>

          {/* Select Intercity Highway Route */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUrdu ? 'ہائی وے روٹ منتخب کریں' : 'Select Intercity Route'}</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {currentRoute.estimated_distance_km} KM • {currentRoute.estimated_duration}
              </span>
            </label>

            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.origin_city} ➔ {r.destination_city} ({r.estimated_distance_km} KM - {r.estimated_duration})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Class Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isUrdu ? 'گاڑی کا انتخاب' : 'Select Ride Category'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVehicleClass('economy')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer ${
                  vehicleClass === 'economy'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <span className="block text-[11px] sm:text-xs font-bold">Car Economy</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  PKR {isPerKm ? Math.round(distanceKm * perKmRate / 50) * 50 : currentRoute.car_economy_fare}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleClass('comfort')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer ${
                  vehicleClass === 'comfort'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-4 h-4 mx-auto mb-1 text-teal-700" />
                <span className="block text-[11px] sm:text-xs font-bold">AC Comfort</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  PKR {isPerKm ? Math.round(distanceKm * perKmRate * 1.4 / 50) * 50 : currentRoute.car_comfort_fare}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleClass('cargo')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer ${
                  vehicleClass === 'cargo'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span className="block text-[11px] sm:text-xs font-bold">Parcel Cargo</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  PKR {isPerKm ? Math.round(distanceKm * perKmRate * 0.25 / 50) * 50 : currentRoute.delivery_parcel_fare}
                </span>
              </button>
            </div>
          </div>

          {/* Passenger Contact Details (Pre-filled or verified if logged in) */}
          {currentCustomer ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Passenger: {currentCustomer.full_name} ({currentCustomer.phone})</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">Verified</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{t.name_label}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aslam Baloch"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{t.phone_label}</span>
                </label>
                <input
                  type="tel"
                  placeholder="0334 1234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Travel Date</span>
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Car className="w-3 h-3 text-slate-400" />
                <span>Passengers / Luggage</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2 seats, 1 bag"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Constant Total Fare Summary decided by Admin */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {isUrdu ? 'انٹرسٹی روٹ کا کل کرایہ' : 'Intercity Trip Fare'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-600">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{estimatedFare}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <span className="block font-bold text-slate-800">{currentRoute.estimated_duration}</span>
              <span className="text-emerald-700 font-bold block">{distanceKm} KM Highway</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.99] disabled:opacity-50 text-base cursor-pointer"
          >
            {isSubmitting ? (
              <span>{isUrdu ? 'بکنگ درج ہو رہی ہے...' : 'Reserving Seat...'}</span>
            ) : (
              <span className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                <span>{t.book_intercity_btn}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      )}

      {/* Customer Auth Modal for Intercity */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        serviceTitle="OLAK Intercity Highway Travel"
        estimatedFare={estimatedFare}
        pickupLocation={currentRoute.origin_city}
        dropoffLocation={currentRoute.destination_city}
        defaultTab="register"
      />

    </div>
  );
};
