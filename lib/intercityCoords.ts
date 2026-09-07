import { TURBAT_LANDMARKS } from '@/lib/constants';

// Comprehensive regional coordinates for Balochistan, Sindh & Pakistan transport hubs
export const INTERCITY_CITY_COORDINATES: Record<string, { lat: number; lng: number; nameUrdu: string }> = {
  'turbat': { lat: 26.0031, lng: 63.0544, nameUrdu: 'تربت' },
  'gwadar': { lat: 25.1264, lng: 62.3225, nameUrdu: 'گوادر' },
  'pasni': { lat: 25.2631, lng: 63.4692, nameUrdu: 'پسنی' },
  'jiwani': { lat: 25.0485, lng: 61.7410, nameUrdu: 'جیونی' },
  'tump': { lat: 26.0827, lng: 62.5938, nameUrdu: 'تمپ' },
  'mand': { lat: 26.0450, lng: 62.0620, nameUrdu: 'مند' },
  'panjgur': { lat: 26.9644, lng: 64.0903, nameUrdu: 'پنجگور' },
  'quetta': { lat: 30.1798, lng: 66.9750, nameUrdu: 'کوئٹہ' },
  'hub chowki': { lat: 25.0270, lng: 66.8833, nameUrdu: 'حب چوکی' },
  'hub': { lat: 25.0270, lng: 66.8833, nameUrdu: 'حب' },
  'karachi': { lat: 24.8607, lng: 67.0011, nameUrdu: 'کراچی' },
  'khuzdar': { lat: 27.8000, lng: 66.6167, nameUrdu: 'خضدار' },
  'awaran': { lat: 26.4500, lng: 65.2333, nameUrdu: 'آواران' },
  'ormara': { lat: 25.2088, lng: 64.6357, nameUrdu: 'اورماڑہ' },
  'hoshab': { lat: 26.0028, lng: 63.9014, nameUrdu: 'ہوشاب' },
  'bela': { lat: 26.2271, lng: 66.3115, nameUrdu: 'بیلہ' },
  'uthal': { lat: 25.8072, lng: 66.6219, nameUrdu: 'اوتھل' },
  'buleda': { lat: 26.2625, lng: 63.0289, nameUrdu: 'بلیدہ' },
  'zamuran': { lat: 26.4167, lng: 62.5000, nameUrdu: 'زامران' },
  'dasht': { lat: 25.8333, lng: 62.2500, nameUrdu: 'دشت' },
  'surab': { lat: 28.4914, lng: 66.2585, nameUrdu: 'سوراب' },
  'kalat': { lat: 29.0266, lng: 66.5936, nameUrdu: 'قلات' },
  'mastung': { lat: 29.7997, lng: 66.8455, nameUrdu: 'مستونگ' },
  'pishin': { lat: 30.5803, lng: 66.9961, nameUrdu: 'پشین' },
  'chaman': { lat: 30.9236, lng: 66.4512, nameUrdu: 'چمن' },
  'sibi': { lat: 29.5448, lng: 67.8764, nameUrdu: 'سبی' },
  'nushki': { lat: 29.5542, lng: 66.0215, nameUrdu: 'نوشکی' },
  'dalbandin': { lat: 28.8885, lng: 64.4062, nameUrdu: 'دالبندین' },
  'taftan': { lat: 28.9667, lng: 61.5833, nameUrdu: 'تفتان' },
  'lasbela': { lat: 25.8072, lng: 66.6219, nameUrdu: 'لسبیلہ' },
  'sukkur': { lat: 27.7052, lng: 68.8574, nameUrdu: 'سکھر' },
  'larkana': { lat: 27.5590, lng: 68.2120, nameUrdu: 'لاڑکانہ' },
  'hyderabad': { lat: 25.3960, lng: 68.3578, nameUrdu: 'حیدرآباد' },
  'multan': { lat: 30.1575, lng: 71.5249, nameUrdu: 'ملتان' },
  'lahore': { lat: 31.5204, lng: 74.3587, nameUrdu: 'لاہور' },
  'islamabad': { lat: 33.6844, lng: 73.0479, nameUrdu: 'اسلام آباد' },
  'rawalpindi': { lat: 33.5651, lng: 73.0169, nameUrdu: 'راولپنڈی' },
  'peshawar': { lat: 34.0151, lng: 71.5249, nameUrdu: 'پشاور' },
};

export function resolveIntercityCoords(cityName: string, fallbackCoords?: { lat: number; lng: number }): { lat: number; lng: number; nameUrdu: string } {
  if (fallbackCoords && Number.isFinite(fallbackCoords.lat) && Number.isFinite(fallbackCoords.lng)) {
    return { lat: fallbackCoords.lat, lng: fallbackCoords.lng, nameUrdu: cityName };
  }

  const clean = (cityName || '').toLowerCase().trim();
  if (!clean) return { lat: 26.0031, lng: 63.0544, nameUrdu: 'تربت' };

  // 1. Extract lat,lng from string if present (e.g. "Pickup (27.0410, 66.6969)" or "(24.8700, 67.0400)")
  const coordMatch = cityName.match(/\((-?\d+\.?\d+),\s*(-?\d+\.?\d+)\)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, nameUrdu: cityName };
    }
  }

  // 2. Direct city match
  if (INTERCITY_CITY_COORDINATES[clean]) {
    return INTERCITY_CITY_COORDINATES[clean];
  }

  // 3. Substring match in known cities
  for (const [key, val] of Object.entries(INTERCITY_CITY_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  // 4. Match against Turbat landmarks
  for (const lm of TURBAT_LANDMARKS) {
    const lmName = lm.name.toLowerCase();
    if (clean.includes(lmName) || lmName.includes(clean)) {
      return { lat: lm.lat, lng: lm.lng, nameUrdu: lm.nameUrdu || lm.name };
    }
  }

  return { lat: 26.0031, lng: 63.0544, nameUrdu: cityName };
}
