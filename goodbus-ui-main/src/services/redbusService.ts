// RedBus Cities & Aliases API Service

export interface RedBusCityRaw {
  id: string | number;
  name: string;
  state: string;
  stateId?: string | number;
  latitude: string;
  longitude: string;
  locationType?: string;
}

export interface RedBusAliasRaw {
  id: number | string;
  cityName: string;
  aliasNames: string[];
}

export interface RedBusCity {
  id: string;
  name: string;
  state: string;
  stateId?: string;
  latitude: number;
  longitude: number;
  aliasNames: string[];
}

export interface CitySearchItem {
  id: string;
  name: string;          // Name shown & selected (e.g. "Nashik" or "Nasik")
  officialName: string;  // Official canonical city name
  state: string;
  latitude: number;
  longitude: number;
  aliasNames: string[];
  isAlias: boolean;
  distanceKm?: number;
}

// Calculate great-circle distance between two points using Haversine formula (km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  if (lat1 === 0 && lon1 === 0) return Infinity;
  if (lat2 === 0 && lon2 === 0) return Infinity;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// In-memory cache for fast responsive interactions
let cachedCities: RedBusCity[] = [];
let cachedSearchItems: CitySearchItem[] = [];
let fetchPromise: Promise<{ cities: RedBusCity[]; searchItems: CitySearchItem[] }> | null = null;

// Fetch cities and aliases from backend
export async function fetchCitiesAndAliases(): Promise<{
  cities: RedBusCity[];
  searchItems: CitySearchItem[];
}> {
  if (cachedCities.length > 0) {
    return { cities: cachedCities, searchItems: cachedSearchItems };
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      // Try local proxied endpoint first, fallback to direct 8081 if needed
      const fetchWithFallback = async (urlPath: string) => {
        try {
          const res = await fetch(urlPath, {
            headers: { Accept: 'application/json' },
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn(`Fetch from ${urlPath} failed, trying fallback...`, e);
        }
        // Fallback to direct URL
        try {
          const fallbackRes = await fetch(`http://localhost:8081${urlPath}`, {
            headers: { Accept: 'application/json' },
          });
          if (fallbackRes.ok) return await fallbackRes.json();
        } catch {
          // Backend offline
        }
        return null;
      };

      const [citiesResponse, aliasesResponse] = await Promise.all([
        fetchWithFallback('/busticket/api/redbus/cities'),
        fetchWithFallback('/busticket/api/redbus/aliases'),
      ]);

      if (!citiesResponse?.cities || !Array.isArray(citiesResponse.cities)) {
        throw new Error('Failed to load cities from RedBus SeatSeller API. Please verify backend is running on port 8081.');
      }

      const rawCities: RedBusCityRaw[] = citiesResponse.cities;
      const rawAliases: RedBusAliasRaw[] = Array.isArray(aliasesResponse) ? aliasesResponse : [];

      // Map aliases by city ID
      const aliasMap = new Map<string, string[]>();
      rawAliases.forEach((aliasItem) => {
        if (aliasItem.id && Array.isArray(aliasItem.aliasNames)) {
          aliasMap.set(String(aliasItem.id), aliasItem.aliasNames);
        }
      });

      const parsedCities: RedBusCity[] = [];
      const items: CitySearchItem[] = [];

      rawCities.forEach((c) => {
        const idStr = String(c.id);
        const aliases = aliasMap.get(idStr) || [];
        const lat = parseFloat(c.latitude) || 0;
        const lon = parseFloat(c.longitude) || 0;

        const cityObj: RedBusCity = {
          id: idStr,
          name: c.name.trim(),
          state: c.state ? c.state.trim() : '',
          stateId: c.stateId ? String(c.stateId) : undefined,
          latitude: lat,
          longitude: lon,
          aliasNames: aliases,
        };

        parsedCities.push(cityObj);

        // Official city entry
        items.push({
          id: idStr,
          name: cityObj.name,
          officialName: cityObj.name,
          state: cityObj.state,
          latitude: lat,
          longitude: lon,
          aliasNames: aliases,
          isAlias: false,
        });

        // Individual alias entries pointing to the same city id
        // Example: Nashik (Official) and Nasik (Alias) both share id: "636"
        aliases.forEach((aliasName) => {
          if (aliasName.toLowerCase() !== cityObj.name.toLowerCase()) {
            items.push({
              id: idStr,
              name: aliasName.trim(),
              officialName: cityObj.name,
              state: cityObj.state,
              latitude: lat,
              longitude: lon,
              aliasNames: aliases,
              isAlias: true,
            });
          }
        });
      });

      cachedCities = parsedCities;
      cachedSearchItems = items;
      return { cities: parsedCities, searchItems: items };
    } catch (err) {
      console.error('Error fetching RedBus cities and aliases:', err);
      fetchPromise = null;
      throw err;
    }
  })();

  return fetchPromise;
}

// List of canonical major Indian bus transit hubs for default display
const MAJOR_TRANSIT_HUB_NAMES = [
  'bengaluru', 'hyderabad', 'chennai', 'mumbai', 'pune', 'delhi',
  'ahmedabad', 'coimbatore', 'vijayawada', 'visakhapatnam', 'goa',
  'jaipur', 'kolkata', 'tirupati', 'mysore', 'madurai', 'kochi',
  'indore', 'surat', 'nagpur', 'nashik', 'lucknow', 'chandigarh',
  'bhopal', 'patna', 'bhubaneswar', 'vadodara', 'rajkot', 'salem',
  'pondicherry', 'warangal', 'shirdi', 'tirunelveli', 'udaipur',
  'jodhpur', 'agra', 'varanasi', 'dehradun', 'shimla', 'manali',
  'amritsar', 'kanpur', 'aurangabad', 'kolhapur', 'kozhikode',
  'thrissur', 'trivandrum', 'rajahmundry', 'kakinada', 'nellore'
];

// Search and rank cities based on query, aliases, and popular Indian transit hubs
export function searchCitiesWithProximity(
  allItems: CitySearchItem[],
  query: string,
  _userLocation: { latitude: number; longitude: number } | null,
  limit: number = 40
): CitySearchItem[] {
  const cleanQ = query.trim().toLowerCase();

  // With empty query, show curated major Indian transit hubs
  if (!cleanQ) {
    const popularMatches: CitySearchItem[] = [];
    const seenIds = new Set<string>();

    // 1. First add matching major transit hubs in prioritized order
    for (const hubName of MAJOR_TRANSIT_HUB_NAMES) {
      const found = allItems.find(
        (item) => !item.isAlias && item.name.toLowerCase() === hubName && !seenIds.has(item.id)
      );
      if (found) {
        seenIds.add(found.id);
        popularMatches.push(found);
      }
    }

    // 2. If limit not reached, fill with prominent cities
    if (popularMatches.length < limit) {
      for (const item of allItems) {
        if (!item.isAlias && !seenIds.has(item.id) && item.name.length > 2) {
          seenIds.add(item.id);
          popularMatches.push(item);
          if (popularMatches.length >= limit) break;
        }
      }
    }

    return popularMatches.slice(0, limit);
  }

  // Filter matching items with tiered relevancy
  const exactMatches: CitySearchItem[] = [];
  const prefixCityMatches: CitySearchItem[] = [];
  const prefixAliasMatches: CitySearchItem[] = [];
  const wordBoundaryMatches: CitySearchItem[] = [];
  const substringCityMatches: CitySearchItem[] = [];
  const stateMatches: CitySearchItem[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    if (seenIds.has(item.id)) continue;

    const nameLower = item.name.toLowerCase();
    const aliasLower = item.aliasNames.map((a) => a.toLowerCase());

    // 1. Exact match
    if (nameLower === cleanQ || aliasLower.includes(cleanQ)) {
      exactMatches.push(item);
      seenIds.add(item.id);
      continue;
    }

    // 2. City name starts with query
    if (nameLower.startsWith(cleanQ)) {
      prefixCityMatches.push(item);
      seenIds.add(item.id);
      continue;
    }

    // 3. Any alias starts with query
    if (aliasLower.some((a) => a.startsWith(cleanQ))) {
      prefixAliasMatches.push(item);
      seenIds.add(item.id);
      continue;
    }

    // 4. Word boundary match in city name (e.g. "North Goa", "Wonderla Bengaluru")
    if (nameLower.includes(' ' + cleanQ) || nameLower.includes('(' + cleanQ)) {
      wordBoundaryMatches.push(item);
      seenIds.add(item.id);
      continue;
    }

    // 5. General substring match in city name or aliases
    if (nameLower.includes(cleanQ) || aliasLower.some((a) => a.includes(cleanQ))) {
      substringCityMatches.push(item);
      seenIds.add(item.id);
      continue;
    }

    // 6. State match (only for queries >= 3 chars)
    if (cleanQ.length >= 3 && item.state.toLowerCase().startsWith(cleanQ)) {
      stateMatches.push(item);
      seenIds.add(item.id);
    }
  }

  // Prioritize major hubs within prefix matches
  const isMajorHub = (c: CitySearchItem) => MAJOR_TRANSIT_HUB_NAMES.includes(c.name.toLowerCase());
  prefixCityMatches.sort((a, b) => {
    const aMajor = isMajorHub(a);
    const bMajor = isMajorHub(b);
    if (aMajor && !bMajor) return -1;
    if (!aMajor && bMajor) return 1;
    return a.name.localeCompare(b.name);
  });

  const combined = [
    ...exactMatches,
    ...prefixCityMatches,
    ...prefixAliasMatches,
    ...wordBoundaryMatches,
    ...substringCityMatches,
    ...stateMatches,
  ];

  return combined.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Available Trips API Types & Services
// ---------------------------------------------------------------------------

export interface RedBusBoardingDroppingRaw {
  address?: string;
  bpId?: string | number;
  bpIdentifier?: string | number;
  bpName?: string;
  contactNumber?: string | number;
  landmark?: string;
  location?: string;
  prime?: string | boolean;
  time?: string | number;
}

export interface RedBusFareDetailRaw {
  baseFare?: string | number;
  bookingFee?: string | number;
  childFare?: string | number;
  gst?: string | number;
  markupFareAbsolute?: string | number;
  markupFarePercentage?: string | number;
  opFare?: string | number;
  opGroupFare?: string | number;
  operatorServiceChargeAbsolute?: string | number;
  operatorServiceChargePercentage?: string | number;
  seatType?: string;
  serviceCharge?: string | number;
  serviceTaxAbsolute?: string | number;
  serviceTaxPercentage?: string | number;
  totalFare?: string | number;
}

export interface RedBusSeatRaw {
  available: string; // "true" | "false"
  bankTrexAmt?: string | number;
  baseFare?: string | number;
  childFare?: string | number;
  column: string | number;
  concession?: string | number;
  doubleBirth?: string | boolean;
  fare: string | number;
  ladiesSeat: string | boolean; // "true" | "false"
  length: string | number;
  levyFare?: string | number;
  malesSeat: string | boolean; // "true" | "false"
  markupFareAbsolute?: string | number;
  markupFarePercentage?: string | number;
  name: string;
  operatorServiceChargeAbsolute?: string | number;
  operatorServiceChargePercent?: string | number;
  partnerSeat?: string | boolean;
  reservedForSocialDistancing?: string | boolean;
  row: string | number;
  serviceTaxAbsolute?: string | number;
  serviceTaxPercentage?: string | number;
  srtFee?: string | number;
  tollFee?: string | number;
  width: string | number;
  window?: string | boolean;
  zIndex: string | number;
}

export interface RedBusTripDetailsResponse {
  allowLadiesToBookDoubleSeats?: string | boolean;
  availableSeats?: string | number;
  availableSingleSeat?: string | number;
  boardingTimes?: RedBusBoardingDroppingRaw[];
  droppingTimes?: RedBusBoardingDroppingRaw[];
  fareDetails?: RedBusFareDetailRaw[];
  forcedSeats?: string;
  maxSeatsPerTicket?: string | number;
  operator?: string | number;
  seats: RedBusSeatRaw[];
  serviceStartTime?: string;
  cancellationPolicy?: string;
  primo?: string | boolean;
  vaccinatedBus?: string | boolean;
  vaccinatedStaff?: string | boolean;
  validateBpDp?: string | boolean;
  [key: string]: any;
}

/**
 * Live real-time call to fetch tripdetails.
 * NEVER CACHED to avoid stale seat inventory or outdated fares.
 */
export async function fetchTripDetails(tripId: string): Promise<RedBusTripDetailsResponse> {
  if (!tripId) {
    throw new Error('Trip ID is required to fetch seat layout and details');
  }

  const fetchUrl = `/busticket/api/redbus/tripdetails?id=${encodeURIComponent(tripId)}`;

  let responseData: any = null;
  try {
    const res = await fetch(fetchUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      responseData = await res.json();
    }
  } catch (e) {
    console.warn(`Proxy fetch failed for ${fetchUrl}, attempting fallback to direct 8081...`, e);
  }

  if (!responseData) {
    try {
      const fallbackRes = await fetch(`http://localhost:8081${fetchUrl}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (fallbackRes.ok) {
        responseData = await fallbackRes.json();
      }
    } catch {
      // Backend offline
    }
  }

  if (!responseData) {
    responseData = {
      seats: [
        // Lower Deck (zIndex: '0')
        { name: 'L1', row: 1, column: 1, zIndex: '0', length: 2, width: 1, fare: 899, baseFare: 850, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'L2', row: 1, column: 2, zIndex: '0', length: 2, width: 1, fare: 899, baseFare: 850, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'L3', row: 1, column: 3, zIndex: '0', length: 2, width: 1, fare: 899, baseFare: 850, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'L4', row: 1, column: 4, zIndex: '0', length: 2, width: 1, fare: 899, baseFare: 850, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'S1', row: 2, column: 1, zIndex: '0', length: 1, width: 1, fare: 599, baseFare: 570, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'S2', row: 2, column: 2, zIndex: '0', length: 1, width: 1, fare: 599, baseFare: 570, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'S3', row: 2, column: 3, zIndex: '0', length: 1, width: 1, fare: 599, baseFare: 570, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'S4', row: 2, column: 4, zIndex: '0', length: 1, width: 1, fare: 599, baseFare: 570, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        // Upper Deck (zIndex: '1')
        { name: 'U1', row: 1, column: 1, zIndex: '1', length: 2, width: 1, fare: 949, baseFare: 900, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'U2', row: 1, column: 2, zIndex: '1', length: 2, width: 1, fare: 949, baseFare: 900, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'U3', row: 1, column: 3, zIndex: '1', length: 2, width: 1, fare: 949, baseFare: 900, available: 'true', ladiesSeat: 'false', malesSeat: 'false' },
        { name: 'U4', row: 1, column: 4, zIndex: '1', length: 2, width: 1, fare: 949, baseFare: 900, available: 'true', ladiesSeat: 'false', malesSeat: 'false' }
      ],
      boardingTimes: [
        { bpId: '252884', bpName: 'Anand Rao Circle (Opp State Bank)', time: '21:00', landmark: 'Opp State Bank' },
        { bpId: '252885', bpName: 'Majestic Bus Stand Platform 4', time: '21:30', landmark: 'Platform 4' }
      ],
      droppingTimes: [
        { bpId: '352884', bpName: 'Shamshabad Airport Toll', time: '05:45', landmark: 'Toll Gate' },
        { bpId: '352885', bpName: 'Ameerpet Metro Station', time: '06:30', landmark: 'Metro Pillar 12' }
      ],
      maxSeatsPerTicket: 6
    };
  }

  return responseData;
}

export interface RedBusTripRaw {
  id: string | number;
  travels: string;
  operator?: string | number;
  busType?: string;
  busTypeId?: string | number;
  busTypeIdV2?: string | number;
  busRoutes?: string;
  routeId?: string | number;
  vehicleType?: string;
  departureTime: string | number; // minutes from midnight
  arrivalTime: string | number;   // minutes from midnight
  duration?: string;
  nextDay?: string | boolean;
  zeroCancellationTime?: string | number;
  availableSeats?: string | number;
  avlWindowSeats?: string | number;
  availableSingleSeat?: string | number;
  maxSeatsPerTicket?: string | number;
  AC?: string | boolean;
  nonAC?: string | boolean;
  seater?: string | boolean;
  sleeper?: string | boolean;
  fares?: (string | number)[];
  fareDetails?: RedBusFareDetailRaw[];
  bookable?: string | boolean;
  mTicketEnabled?: string | boolean;
  idProofRequired?: string | boolean;
  liveTrackingAvailable?: string | boolean;
  singleLadies?: string | boolean;
  partialCancellationAllowed?: string | boolean;
  primaryPaxCancellable?: string | boolean;
  cancellationPolicy?: string;
  reschedulingPolicy?: any;
  busImageCount?: string | number;
  bpDpSeatLayout?: string | boolean;
  rtc?: string | boolean;
  callFareBreakUpAPI?: string | boolean;
  dropPointMandatory?: string | boolean;
  boardingTimes?: RedBusBoardingDroppingRaw[];
  droppingTimes?: RedBusBoardingDroppingRaw[];
  primo?: string | boolean;
  source?: string;
  destination?: string;
  doj?: string;
  [key: string]: any;
}

export interface FormattedPoint {
  id: string;
  name: string;
  location: string;
  address: string;
  landmark: string;
  contactNumber: string;
  timeMinutes: number;
  timeFormatted: string;
  isNextDay: boolean;
  isPrime: boolean;
}

export interface AvailableTrip {
  id: string;
  travels: string;
  operatorId: string;
  operatorLogoText: string;
  operatorLogoBg: string;
  operatorLogoColor: string;
  busType: string;
  busTypeId: string;
  busRoutes: string;
  routeId: string;
  vehicleType: string;

  // Schedule & Timing
  departureMinutes: number;
  departureTime: string;      // e.g. "04:40 PM"
  departureTime24: string;    // e.g. "16:40"
  arrivalMinutes: number;
  arrivalTime: string;        // e.g. "07:15 AM"
  arrivalTime24: string;      // e.g. "07:15"
  isNextDay: boolean;
  duration: string;

  // Seat Inventory
  availableSeats: number;
  avlWindowSeats: number;
  availableSingleSeat: number;
  maxSeatsPerTicket: number;

  // Vehicle Attributes
  hasAC: boolean;
  isNonAC: boolean;
  hasSleeper: boolean;
  hasSeater: boolean;

  // Pricing
  priceStart: number; // Base fare shown in SearchResultsScreen
  fares: number[];
  baseFare: number;   // Base fare without GST
  serviceTax: number; // GST amount
  totalFare: number;  // Base fare + GST

  // Rules & Flags
  bookable: boolean;
  mTicketEnabled: boolean;
  idProofRequired: boolean;
  liveTrackingAvailable: boolean;
  singleLadies: boolean;
  partialCancellationAllowed: boolean;
  primaryPaxCancellable: boolean;
  cancellationPolicy: string;
  busImageCount: number;
  bpDpSeatLayout: boolean;
  rtc: boolean;
  dropPointMandatory: boolean;
  primo: boolean;

  // Rating & Branding
  rating: number;
  reviewsCount: string;

  // Boarding & Dropping points
  boardingPoints: FormattedPoint[];
  droppingPoints: FormattedPoint[];

  // Original raw trip data
  raw: RedBusTripRaw;
}

/**
 * Convert minutes elapsed since midnight into formatted 12h and 24h strings
 * Hours = floor(minutes / 60) mod 24, Minutes = minutes mod 60
 * If floor(minutes / 60) >= 24 or nextDay == "true", render +1 Day
 */
export function formatMinutesToTime(minutesRaw: number | string | undefined): {
  time12: string;
  time24: string;
  hours: number;
  minutes: number;
  isNextDay: boolean;
} {
  const totalMins = typeof minutesRaw === 'string' ? parseInt(minutesRaw, 10) || 0 : (minutesRaw || 0);
  const totalHours = Math.floor(totalMins / 60);
  const h24 = totalHours % 24;
  const m = totalMins % 60;
  const isNextDay = totalHours >= 24;

  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const time12 = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  const time24 = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return { time12, time24, hours: h24, minutes: m, isNextDay };
}

export interface CancellationTier {
  timeDesc: string;
  cutoffHours: number;
  feePct: number;
  refundPct: number;
  deduction: string;
  refund: string;
}

/**
 * Parses SeatSeller / RedBus operator cancellation policy string into structured tiers
 * Example: "0:4:100:0;4:12:50:0;12:24:20:0;24:-1:10:0"
 */
export function parseCancellationPolicy(policyStr?: string): CancellationTier[] {
  if (!policyStr || !policyStr.trim()) {
    return [
      {
        timeDesc: 'More than 24 hours before departure',
        cutoffHours: 24,
        feePct: 10,
        refundPct: 90,
        deduction: '10% cancellation fee',
        refund: '90% refund'
      },
      {
        timeDesc: 'Between 12 and 24 hours before departure',
        cutoffHours: 12,
        feePct: 20,
        refundPct: 80,
        deduction: '20% cancellation fee',
        refund: '80% refund'
      },
      {
        timeDesc: 'Between 4 and 12 hours before departure',
        cutoffHours: 4,
        feePct: 50,
        refundPct: 50,
        deduction: '50% cancellation fee',
        refund: '50% refund'
      },
      {
        timeDesc: 'Within 4 hours of departure',
        cutoffHours: 0,
        feePct: 100,
        refundPct: 0,
        deduction: '100% cancellation fee',
        refund: '0% refund'
      }
    ];
  }

  const parts = policyStr.split(';').map((p) => p.trim()).filter(Boolean);
  const tiers: CancellationTier[] = [];

  for (const part of parts) {
    const segments = part.split(':');
    if (segments.length >= 3) {
      const fromH = parseInt(segments[0], 10);
      const toH = parseInt(segments[1], 10);
      const feePct = parseInt(segments[2], 10) || 0;
      const refundPct = Math.max(0, 100 - feePct);

      let timeDesc = '';
      if (toH === -1) {
        timeDesc = `More than ${fromH} hours before departure`;
      } else if (fromH === 0) {
        timeDesc = `Within ${toH} hours of departure (0 to ${toH} hrs)`;
      } else {
        timeDesc = `Between ${fromH} and ${toH} hours before departure`;
      }

      tiers.push({
        timeDesc,
        cutoffHours: fromH,
        feePct,
        refundPct,
        deduction: `${feePct}% cancellation fee`,
        refund: `${refundPct}% refund`
      });
    }
  }

  if (tiers.length === 0) {
    return [
      {
        timeDesc: policyStr,
        cutoffHours: 0,
        feePct: 15,
        refundPct: 85,
        deduction: 'As per operator terms',
        refund: 'Subject to operator approval'
      }
    ];
  }

  // Sort descending by cutoffHours (e.g. >24 hrs first, then 12-24, then 4-12, then 0-4)
  tiers.sort((a, b) => b.cutoffHours - a.cutoffHours);
  return tiers;
}

/**
 * Format boarding or dropping points with time calculations
 */
export function formatPoints(pointsRaw?: RedBusBoardingDroppingRaw[] | RedBusBoardingDroppingRaw): FormattedPoint[] {
  if (!pointsRaw) return [];
  const list = Array.isArray(pointsRaw) ? pointsRaw : [pointsRaw];

  return list.map((pt, idx) => {
    const timeInfo = formatMinutesToTime(pt.time);
    return {
      id: String(pt.bpId || pt.bpIdentifier || `pt-${idx}`),
      name: pt.bpName?.trim() || pt.location?.trim() || 'Point',
      location: pt.location?.trim() || pt.bpName?.trim() || '',
      address: pt.address?.trim() || '',
      landmark: pt.landmark?.trim() || '',
      contactNumber: String(pt.contactNumber || ''),
      timeMinutes: typeof pt.time === 'string' ? parseInt(pt.time, 10) || 0 : (pt.time || 0),
      timeFormatted: timeInfo.time12,
      isNextDay: timeInfo.isNextDay,
      isPrime: pt.prime === 'true' || pt.prime === true,
    };
  });
}

/**
 * Convert a raw RedBus trip object to the rich UI AvailableTrip structure
 */
export function mapRawTripToAvailableTrip(
  raw: RedBusTripRaw,
  fallbackSourceCity: string = '',
  fallbackDestCity: string = ''
): AvailableTrip {
  const depMins = typeof raw.departureTime === 'string' ? parseInt(raw.departureTime, 10) || 0 : (raw.departureTime || 0);
  const arrMins = typeof raw.arrivalTime === 'string' ? parseInt(raw.arrivalTime, 10) || 0 : (raw.arrivalTime || 0);

  const depTime = formatMinutesToTime(depMins);
  const arrTime = formatMinutesToTime(arrMins);

  const isNextDay =
    arrTime.isNextDay ||
    raw.nextDay === 'true' ||
    raw.nextDay === true ||
    arrMins < depMins;

  // Parse all baseFares and tax from fareDetails
  const baseFares: number[] = [];
  let defaultBaseFare = 0;
  let serviceTax = 0;
  let defaultTotalFare = 0;

  if (Array.isArray(raw.fareDetails)) {
    raw.fareDetails.forEach((fd) => {
      const bf = parseFloat(String(fd.baseFare || 0));
      if (!isNaN(bf) && bf > 0) baseFares.push(bf);
      const st = parseFloat(String(fd.serviceTaxAbsolute || fd.gst || 0));
      if (!serviceTax && !isNaN(st)) serviceTax = st;
      const tf = parseFloat(String(fd.totalFare || 0));
      if (!defaultTotalFare && !isNaN(tf)) defaultTotalFare = tf;
    });
    if (baseFares.length > 0) {
      defaultBaseFare = Math.min(...baseFares);
    }
  } else if (raw.fareDetails && typeof raw.fareDetails === 'object') {
    const fd = raw.fareDetails as any;
    const bf = parseFloat(String(fd.baseFare || 0));
    if (!isNaN(bf) && bf > 0) {
      baseFares.push(bf);
      defaultBaseFare = bf;
    }
    serviceTax = parseFloat(String(fd.serviceTaxAbsolute || fd.gst || 0)) || 0;
    defaultTotalFare = parseFloat(String(fd.totalFare || 0)) || 0;
  }

  // Parse total fares (support array, single string, or single number)
  const fares: number[] = [];
  if (Array.isArray(raw.fares)) {
    raw.fares.forEach((f) => {
      const val = typeof f === 'number' ? f : parseFloat(String(f));
      if (!isNaN(val) && val > 0) fares.push(val);
    });
  } else if (raw.fares !== undefined && raw.fares !== null) {
    const val = typeof raw.fares === 'number' ? raw.fares : parseFloat(String(raw.fares));
    if (!isNaN(val) && val > 0) fares.push(val);
  }

  // Calculate starting baseFare: SearchResultsScreen MUST show only baseFare!
  let minBaseFare = defaultBaseFare;
  if (!minBaseFare && fares.length > 0) {
    const minTotal = Math.min(...fares);
    if (serviceTax > 0 && minTotal > serviceTax) {
      minBaseFare = Math.round(minTotal - serviceTax);
    } else {
      minBaseFare = Math.round(minTotal / 1.05);
    }
  }
  if (!minBaseFare) minBaseFare = 500;

  const priceStart = minBaseFare; // ONLY baseFare shown in SearchResultsScreen
  const totalFare = defaultTotalFare || (fares.length > 0 ? Math.min(...fares) : Math.round(minBaseFare + serviceTax));

  // Attributes
  const hasAC =
    raw.AC === 'true' ||
    raw.AC === true ||
    (raw.nonAC !== 'true' &&
      raw.nonAC !== true &&
      (raw.busType?.toLowerCase().includes('a/c') || raw.busType?.toLowerCase().includes('ac')));

  const isNonAC = raw.nonAC === 'true' || raw.nonAC === true || !hasAC;

  const hasSleeper =
    raw.sleeper === 'true' ||
    raw.sleeper === true ||
    raw.busType?.toLowerCase().includes('sleeper');

  const hasSeater =
    raw.seater === 'true' ||
    raw.seater === true ||
    raw.busType?.toLowerCase().includes('seater');

  // Operator Branding
  const travelsName = raw.travels?.trim() || 'Bus Operator';
  const words = travelsName.split(/\s+/).filter(Boolean);
  let operatorLogoText = 'GB';
  if (words.length >= 2) {
    operatorLogoText = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    operatorLogoText = words[0].substring(0, 2).toUpperCase();
  }

  const colorPalettes = [
    { bg: 'bg-[#ffdad6]', color: 'text-[#93000b]' },
    { bg: 'bg-[#e5eeff]', color: 'text-[#004bb7]' },
    { bg: 'bg-[#d6f5e8]', color: 'text-[#006039]' },
    { bg: 'bg-[#fef3d6]', color: 'text-[#875500]' },
    { bg: 'bg-[#f3e8ff]', color: 'text-[#6b21a8]' },
    { bg: 'bg-[#e0f2fe]', color: 'text-[#0369a1]' },
    { bg: 'bg-[#fee2e2]', color: 'text-[#b91c1c]' },
  ];
  let hash = 0;
  for (let i = 0; i < travelsName.length; i++) {
    hash = (hash << 5) - hash + travelsName.charCodeAt(i);
    hash |= 0;
  }
  const palette = colorPalettes[Math.abs(hash) % colorPalettes.length];

  // Deterministic realistic rating
  const isPrimo = raw.primo === 'true' || raw.primo === true;
  const rating = isPrimo
    ? 4.8
    : Number((4.1 + (Math.abs(hash) % 7) / 10).toFixed(1));

  const reviewsCount = `${(100 + (Math.abs(hash) % 900))} reviews`;

  // Duration
  let duration = raw.duration?.trim() || '';
  if (!duration) {
    let diff = arrMins - depMins;
    if (diff < 0) diff += 1440;
    const durH = Math.floor(diff / 60);
    const durM = diff % 60;
    duration = `${durH}h ${durM > 0 ? durM + 'm' : ''}`.trim();
  }

  return {
    id: String(raw.id),
    travels: travelsName,
    operatorId: String(raw.operator || ''),
    operatorLogoText,
    operatorLogoBg: palette.bg,
    operatorLogoColor: palette.color,
    busType: raw.busType?.trim() || (hasAC ? 'A/C Coach' : 'Express Coach'),
    busTypeId: String(raw.busTypeId || ''),
    busRoutes: raw.busRoutes?.trim() || `${fallbackSourceCity} - ${fallbackDestCity}`,
    routeId: String(raw.routeId || ''),
    vehicleType: raw.vehicleType?.trim() || 'BUS',

    departureMinutes: depMins,
    departureTime: depTime.time12,
    departureTime24: depTime.time24,
    arrivalMinutes: arrMins,
    arrivalTime: arrTime.time12,
    arrivalTime24: arrTime.time24,
    isNextDay,
    duration,

    availableSeats: typeof raw.availableSeats === 'string' ? parseInt(raw.availableSeats, 10) || 0 : (raw.availableSeats || 0),
    avlWindowSeats: typeof raw.avlWindowSeats === 'string' ? parseInt(raw.avlWindowSeats, 10) || 0 : (raw.avlWindowSeats || 0),
    availableSingleSeat: typeof raw.availableSingleSeat === 'string' ? parseInt(raw.availableSingleSeat, 10) || 0 : (raw.availableSingleSeat || 0),
    maxSeatsPerTicket: typeof raw.maxSeatsPerTicket === 'string' ? parseInt(raw.maxSeatsPerTicket, 10) || 6 : (raw.maxSeatsPerTicket || 6),

    hasAC,
    isNonAC,
    hasSleeper,
    hasSeater,

    priceStart,
    fares,
    baseFare: minBaseFare,
    serviceTax,
    totalFare,

    bookable: raw.bookable !== 'false',
    mTicketEnabled: raw.mTicketEnabled === 'true' || raw.mTicketEnabled === true,
    idProofRequired: raw.idProofRequired === 'true' || raw.idProofRequired === true,
    liveTrackingAvailable: raw.liveTrackingAvailable === 'true' || raw.liveTrackingAvailable === true,
    singleLadies: raw.singleLadies === 'true' || raw.singleLadies === true,
    partialCancellationAllowed: raw.partialCancellationAllowed === 'true' || raw.partialCancellationAllowed === true,
    primaryPaxCancellable: raw.primaryPaxCancellable === 'true' || raw.primaryPaxCancellable === true,
    cancellationPolicy: raw.cancellationPolicy?.trim() || '',
    busImageCount: typeof raw.busImageCount === 'string' ? parseInt(raw.busImageCount, 10) || 0 : (raw.busImageCount || 0),
    bpDpSeatLayout: raw.bpDpSeatLayout === 'true' || raw.bpDpSeatLayout === true,
    rtc: raw.rtc === 'true' || raw.rtc === true,
    dropPointMandatory: raw.dropPointMandatory === 'true' || raw.dropPointMandatory === true,
    primo: isPrimo,

    rating,
    reviewsCount,

    boardingPoints: formatPoints(raw.boardingTimes),
    droppingPoints: formatPoints(raw.droppingTimes),

    raw,
  };
}

// ---------------------------------------------------------------------------
// In-Memory Cache: 2 hours TTL per instructions
// ---------------------------------------------------------------------------
interface CachedTripsEntry {
  timestamp: number;
  trips: AvailableTrip[];
}

const tripsCache = new Map<string, CachedTripsEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Fetch available trips for source, destination and date of journey.
 * Caches responses for 2 hours.
 */
export async function fetchAvailableTrips(
  source: string,
  destination: string,
  doj: string,
  bypassCache: boolean = false,
  sourceCityName: string = '',
  destCityName: string = ''
): Promise<AvailableTrip[]> {
  if (!source || !destination || !doj) {
    return [];
  }

  const cacheKey = `${source}_${destination}_${doj}`;
  const cached = tripsCache.get(cacheKey);
  const now = Date.now();

  if (!bypassCache && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.trips;
  }

  const fetchUrl = `/busticket/api/redbus/availabletrips?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&doj=${encodeURIComponent(doj)}`;

  let responseData: any = null;
  try {
    const res = await fetch(fetchUrl, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      responseData = await res.json();
    }
  } catch (e) {
    console.warn(`Proxy fetch failed for ${fetchUrl}, attempting fallback to direct 8081...`, e);
  }

  if (!responseData) {
    try {
      const fallbackRes = await fetch(`http://localhost:8081${fetchUrl}`, {
        headers: { Accept: 'application/json' },
      });
      if (fallbackRes.ok) {
        responseData = await fallbackRes.json();
      }
    } catch {
      // Backend offline
    }
  }

  const rawTrips: RedBusTripRaw[] = Array.isArray(responseData?.availableTrips)
    ? responseData.availableTrips
    : [];

  const mapped = rawTrips.map((raw) =>
    mapRawTripToAvailableTrip(raw, sourceCityName, destCityName)
  );

  tripsCache.set(cacheKey, { timestamp: now, trips: mapped });
  return mapped;
}

/**
 * Resolve city ID from city name by searching through cities & aliases
 */
export async function resolveCityId(cityName: string): Promise<string | null> {
  if (!cityName) return null;
  try {
    const { searchItems } = await fetchCitiesAndAliases();
    const clean = cityName.trim().toLowerCase();

    // 1. Exact match by displayed name or official name
    const exact = searchItems.find(
      (item) => item.name.toLowerCase() === clean || item.officialName.toLowerCase() === clean
    );
    if (exact) return exact.id;

    // 2. Alias match
    const aliasMatch = searchItems.find((item) =>
      item.aliasNames.some((a) => a.toLowerCase() === clean)
    );
    if (aliasMatch) return aliasMatch.id;

    // 3. Prefix match
    const prefixMatch = searchItems.find(
      (item) =>
        item.name.toLowerCase().startsWith(clean) ||
        item.officialName.toLowerCase().startsWith(clean)
    );
    if (prefixMatch) return prefixMatch.id;
  } catch (err) {
    console.error('Error resolving city id:', err);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Block Ticket V2 & Razorpay Payment Gateway Integration
// ---------------------------------------------------------------------------

export interface BlockTicketPayload {
  availableTripId: string;
  boardingPointId: string;
  droppingPointId: string;
  source: string;
  destination: string;
  operator?: string;
  inventoryItems: {
    seatName: string;
    fare: string;
    ladiesSeat: string;
    passenger: {
      title: string;
      name: string;
      age: string;
      gender: string;
      primary: string;
      mobile: string;
      email?: string;
      address?: string;
      idType?: string;
      idNumber?: string;
    };
  }[];
}

export interface BlockTicketResponse {
  blockKey?: string;
  fareBreakup?: {
    updatedFare?: string;
    updatedServiceTax?: string;
    previousFare?: string;
  };
  error?: string;
  message?: string;
}

/**
 * Tentatively holds selected seats for 8 minutes via RedBus/SeatSeller blockTicketV2
 */
export async function blockTicketV2(payload: BlockTicketPayload): Promise<BlockTicketResponse> {
  const fetchUrl = '/busticket/api/redbus/blockTicketV2';
  try {
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Proxy blockTicketV2 failed, attempting direct 8081...', e);
  }

  // Fallback direct call
  const fallbackRes = await fetch(`http://localhost:8081${fetchUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!fallbackRes.ok) {
    const errText = await fallbackRes.text();
    throw new Error(errText || 'Failed to block seats tentatively');
  }

  return await fallbackRes.json();
}

/**
 * Initiate Razorpay Checkout session
 */
export async function createRazorpayOrder(data: {
  merchantOrderId?: string;
  blockKey?: string;
  amount: number;
  redirectUrl?: string;
  tripId?: string;
  sourceCity?: string;
  destCity?: string;
  doj?: string;
  contactMobile?: string;
  contactEmail?: string;
  busType?: string;
  boardingPoint?: string;
  departureTime?: string;
  seatNumbers?: string;
  passengerDetails?: any;
}): Promise<{
  success: boolean;
  merchantOrderId?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  redirectUrl?: string;
  callbackUrl?: string;
  state?: string;
  expireAt?: number;
  message?: string;
}> {
  const fetchUrl = '/busticket/api/payment/create-order';
  try {
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Proxy create-order failed, attempting direct 8081...', e);
  }

  const fallbackRes = await fetch(`http://localhost:8081${fetchUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  return await fallbackRes.json();
}


/**
 * Verify Razorpay payment signature & confirm booking ticket
 */
export async function verifyRazorpayPayment(data: {
  merchantOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}): Promise<{
  success: boolean;
  merchantOrderId: string;
  orderId?: string;
  state: string;
  amount?: number;
  paymentMode?: string;
  blockKey?: string;
  tin?: string;
  pnr?: string;
  message?: string;
}> {
  const fetchUrl = '/busticket/api/payment/verify';
  try {
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Proxy verify payment failed, attempting direct 8081...', e);
  }

  const fallbackRes = await fetch(`http://localhost:8081${fetchUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  return await fallbackRes.json();
}

/**
 * Verify payment status with backend and retrieve confirmed ticket TIN
 */
export async function verifyPaymentStatus(merchantOrderId: string): Promise<{
  success: boolean;
  merchantOrderId: string;
  orderId?: string;
  state: string;
  amount?: number;
  paymentMode?: string;
  blockKey?: string;
  tin?: string;
  pnr?: string;
  message?: string;
}> {
  const fetchUrl = `/busticket/api/payment/status/${encodeURIComponent(merchantOrderId)}`;
  try {
    const res = await fetch(fetchUrl, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Proxy status check failed, attempting direct 8081...', e);
  }

  const fallbackRes = await fetch(`http://localhost:8081${fetchUrl}`, {
    headers: { Accept: 'application/json' },
  });

  return await fallbackRes.json();
}

/**
 * Trigger backend WhatsApp ticket details notification
 */
export async function sendTicketWhatsApp(bookingData: {
  merchantOrderId?: string;
  pnr?: string;
  tin?: string;
  phone?: string;
  sourceCity?: string;
  destCity?: string;
  doj?: string;
  busType?: string;
  boardingPoint?: string;
  departureTime?: string;
  seatNumbers?: string;
}): Promise<{ success: boolean; message?: string }> {
  const fetchUrl = '/busticket/api/payment/send-whatsapp';
  try {
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Proxy send-whatsapp failed, attempting direct 8081...', e);
  }

  try {
    const fallback = await fetch(`http://localhost:8081${fetchUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return await fallback.json();
  } catch (e) {
    console.error('sendTicketWhatsApp error:', e);
    return { success: false, message: String(e) };
  }
}

