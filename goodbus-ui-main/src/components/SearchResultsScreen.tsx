import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAvailableTrips,
  resolveCityId,
  AvailableTrip,
  FormattedPoint,
  parseCancellationPolicy
} from '../services/redbusService';
import { Seat } from '../types';
import { SeatLayout } from './SeatLayout';
import { FunnyBusLoader } from './FunnyBusLoader';

interface SearchResultsScreenProps {
  sourceCity: string;
  sourceCityId?: string;
  destinationCity: string;
  destinationCityId?: string;
  journeyDate: string;
  selectedBusId?: string | null;
  onSelectBus?: (busId: string | null) => void;
  onBackToHome: () => void;
  onProceedToBooking?: (
    bus: AvailableTrip,
    selectedSeats: Seat[],
    boardingPoints: FormattedPoint[],
    droppingPoints: FormattedPoint[]
  ) => void;
  onUpdateSearch?: (
    source: string,
    sourceId: string,
    dest: string,
    destId: string,
    date?: string
  ) => void;
}

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  sourceCity,
  sourceCityId,
  destinationCity,
  destinationCityId,
  journeyDate,
  selectedBusId,
  onSelectBus,
  onBackToHome,
  onProceedToBooking,
  onUpdateSearch
}) => {
  const [trips, setTrips] = useState<AvailableTrip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [effectiveSourceId, setEffectiveSourceId] = useState<string>(sourceCityId || '');
  const [effectiveDestId, setEffectiveDestId] = useState<string>(destinationCityId || '');

  // Expanded Trip Drawer ID
  const [expandedTripId, setExpandedTripId] = useState<string | null>(selectedBusId || null);

  // Sorting
  const [sortBy, setSortBy] = useState<'cheapest' | 'departure' | 'rating' | 'seats' | 'duration'>('cheapest');

  // Filters
  const [filterBusTypes, setFilterBusTypes] = useState<string[]>([]);
  const [filterDepartureTimes, setFilterDepartureTimes] = useState<string[]>([]);
  const [filterOperators, setFilterOperators] = useState<string[]>([]);
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);
  const [operatorSearchQuery, setOperatorSearchQuery] = useState<string>('');
  const [showAllOperators, setShowAllOperators] = useState<boolean>(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Fetch available trips dynamically from backend API
  const loadAvailableTrips = async (bypassCache: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Resolve source and destination city IDs if missing
      let srcId = effectiveSourceId;
      if (!srcId && sourceCity) {
        const resolved = await resolveCityId(sourceCity);
        if (resolved) {
          srcId = resolved;
          setEffectiveSourceId(resolved);
        }
      }

      let dstId = effectiveDestId;
      if (!dstId && destinationCity) {
        const resolved = await resolveCityId(destinationCity);
        if (resolved) {
          dstId = resolved;
          setEffectiveDestId(resolved);
        }
      }

      if (!srcId || !dstId) {
        setError(`Could not resolve city IDs for ${sourceCity || 'source'} or ${destinationCity || 'destination'}.`);
        setIsLoading(false);
        return;
      }

      const results = await fetchAvailableTrips(
        srcId,
        dstId,
        journeyDate,
        bypassCache,
        sourceCity,
        destinationCity
      );

      setTrips(results);
    } catch (err: any) {
      console.error('Error fetching available trips:', err);
      setError(
        err.message || 'Failed to fetch available trips. Please make sure the backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableTrips();
  }, [sourceCity, sourceCityId, destinationCity, destinationCityId, journeyDate]);

  // Synchronize expanded trip with external selectedBusId if supplied
  useEffect(() => {
    if (selectedBusId !== undefined) {
      setExpandedTripId(selectedBusId);
    }
  }, [selectedBusId]);

  const handleToggleExpand = (tripId: string) => {
    const nextId = expandedTripId === tripId ? null : tripId;
    setExpandedTripId(nextId);
    if (onSelectBus) {
      onSelectBus(nextId);
    }
  };

  // Extract all distinct operators with trip counts
  const operatorStats = useMemo(() => {
    const map = new Map<string, number>();
    trips.forEach((t) => {
      const op = t.travels;
      map.set(op, (map.get(op) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [trips]);

  // Filter operator list by search query inside sidebar
  const visibleOperators = useMemo(() => {
    if (!operatorSearchQuery.trim()) {
      return showAllOperators ? operatorStats : operatorStats.slice(0, 7);
    }
    const q = operatorSearchQuery.toLowerCase();
    return operatorStats.filter((op) => op.name.toLowerCase().includes(q));
  }, [operatorStats, operatorSearchQuery, showAllOperators]);

  // Calculate counts for bus types
  const typeCounts = useMemo(() => {
    let acCount = 0;
    let nonAcCount = 0;
    let sleeperCount = 0;
    let seaterCount = 0;

    trips.forEach((t) => {
      if (t.hasAC) acCount++;
      if (t.isNonAC) nonAcCount++;
      if (t.hasSleeper) sleeperCount++;
      if (t.hasSeater) seaterCount++;
    });

    return { acCount, nonAcCount, sleeperCount, seaterCount };
  }, [trips]);

  // Calculate counts for departure time buckets
  const timeCounts = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let night = 0;

    trips.forEach((t) => {
      const m = t.departureMinutes;
      if (m >= 360 && m < 720) morning++;
      else if (m >= 720 && m < 1080) afternoon++;
      else if (m >= 1080 && m < 1380) evening++;
      else night++;
    });

    return { morning, afternoon, evening, night };
  }, [trips]);

  // Toggle filter helper
  const toggleFilter = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const clearAllFilters = () => {
    setFilterBusTypes([]);
    setFilterDepartureTimes([]);
    setFilterOperators([]);
    setFilterAmenities([]);
    setOperatorSearchQuery('');
  };

  const activeFiltersCount =
    filterBusTypes.length +
    filterDepartureTimes.length +
    filterOperators.length +
    filterAmenities.length;

  // Apply filters
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // 1. Bus Type Filter
      if (filterBusTypes.length > 0) {
        const matchesAnyType = filterBusTypes.some((type) => {
          if (type === 'AC') return t.hasAC;
          if (type === 'Non-AC') return t.isNonAC;
          if (type === 'Sleeper') return t.hasSleeper;
          if (type === 'Seater') return t.hasSeater;
          return true;
        });
        if (!matchesAnyType) return false;
      }

      // 2. Departure Time Slots
      if (filterDepartureTimes.length > 0) {
        const m = t.departureMinutes;
        const matchesAnyTime = filterDepartureTimes.some((slot) => {
          if (slot === 'Morning') return m >= 360 && m < 720;
          if (slot === 'Afternoon') return m >= 720 && m < 1080;
          if (slot === 'Evening') return m >= 1080 && m < 1380;
          if (slot === 'Night') return (m >= 1380 && m < 1440) || (m >= 0 && m < 360);
          return true;
        });
        if (!matchesAnyTime) return false;
      }

      // 3. Operators Filter
      if (filterOperators.length > 0) {
        if (!filterOperators.includes(t.travels)) return false;
      }

      // 4. Amenities & Features Filter
      if (filterAmenities.length > 0) {
        if (filterAmenities.includes('GPS') && !t.liveTrackingAvailable && !t.mTicketEnabled) return false;
        if (filterAmenities.includes('Single Seats') && t.availableSingleSeat <= 0) return false;
      }

      return true;
    });
  }, [trips, filterBusTypes, filterDepartureTimes, filterOperators, filterAmenities]);

  // Apply sorting
  const sortedTrips = useMemo(() => {
    const list = [...filteredTrips];
    list.sort((a, b) => {
      if (sortBy === 'cheapest') return a.priceStart - b.priceStart;
      if (sortBy === 'departure') return a.departureMinutes - b.departureMinutes;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'seats') return b.availableSeats - a.availableSeats;
      if (sortBy === 'duration') {
        const durToMins = (dStr: string) => {
          const match = dStr.match(/(\d+):(\d+)/);
          if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          const matchH = dStr.match(/(\d+)\s*h/);
          const matchM = dStr.match(/(\d+)\s*m/);
          const h = matchH ? parseInt(matchH[1], 10) : 0;
          const m = matchM ? parseInt(matchM[1], 10) : 0;
          return h * 60 + m;
        };
        return durToMins(a.duration) - durToMins(b.duration);
      }
      return 0;
    });
    return list;
  }, [filteredTrips, sortBy]);

  const renderFilterContent = (showHeader = true) => (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-gray-900">tune</span>
            <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-[#d84e55] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#d84e55] hover:underline font-semibold cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>
      )}

      {/* Bus Type Filter */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
          Bus Type
        </h4>
        <div className="space-y-2.5 text-xs">
          {[
            { key: 'AC', label: 'AC Coach', count: typeCounts.acCount },
            { key: 'Non-AC', label: 'Non-AC', count: typeCounts.nonAcCount },
            { key: 'Sleeper', label: 'Sleeper', count: typeCounts.sleeperCount },
            { key: 'Seater', label: 'Seater', count: typeCounts.seaterCount }
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between cursor-pointer select-none text-gray-700 hover:text-gray-900 py-0.5"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterBusTypes.includes(item.key)}
                  onChange={() => toggleFilter(filterBusTypes, setFilterBusTypes, item.key)}
                  className="w-4 h-4 rounded border-gray-300 text-[#d84e55] focus:ring-[#d84e55] cursor-pointer"
                />
                <span>{item.label}</span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">({item.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Departure Time Slots */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
          Departure Time
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {[
            { label: 'Morning', time: '6am - 12pm', icon: 'wb_sunny', count: timeCounts.morning },
            { label: 'Afternoon', time: '12pm - 6pm', icon: 'wb_twilight', count: timeCounts.afternoon },
            { label: 'Evening', time: '6pm - 11pm', icon: 'nights_stay', count: timeCounts.evening },
            { label: 'Night', time: '11pm - 6am', icon: 'bedtime', count: timeCounts.night }
          ].map((slot) => {
            const active = filterDepartureTimes.includes(slot.label);
            return (
              <button
                key={slot.label}
                type="button"
                onClick={() => toggleFilter(filterDepartureTimes, setFilterDepartureTimes, slot.label)}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  active
                    ? 'bg-[#d84e55] text-white border-[#d84e55] shadow-xs'
                    : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] block mb-1">
                  {slot.icon}
                </span>
                <span className="font-semibold block">{slot.label}</span>
                <span className="text-[9px] opacity-80 block">{slot.time}</span>
                <span className="text-[10px] font-mono opacity-90 font-medium mt-0.5 block">
                  ({slot.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Operators Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Bus Operators
          </h4>
          <span className="text-[10px] text-gray-400 font-medium">
            {operatorStats.length} total
          </span>
        </div>

        {/* Search operator */}
        {operatorStats.length > 6 && (
          <div className="relative mb-2.5">
            <input
              type="text"
              placeholder="Search operator..."
              value={operatorSearchQuery}
              onChange={(e) => setOperatorSearchQuery(e.target.value)}
              className="w-full text-xs pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#d84e55]"
            />
            <span className="material-symbols-outlined absolute left-2 top-2 text-[14px] text-gray-400">
              search
            </span>
          </div>
        )}

        <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
          {visibleOperators.map((op) => (
            <label
              key={op.name}
              className="flex items-center justify-between cursor-pointer select-none text-gray-700 hover:text-gray-900 py-0.5"
            >
              <div className="flex items-center gap-2.5 truncate mr-2">
                <input
                  type="checkbox"
                  checked={filterOperators.includes(op.name)}
                  onChange={() => toggleFilter(filterOperators, setFilterOperators, op.name)}
                  className="w-4 h-4 rounded border-gray-300 text-[#d84e55] focus:ring-[#d84e55] cursor-pointer shrink-0"
                />
                <span className="truncate capitalize">{op.name.toLowerCase()}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                ({op.count})
              </span>
            </label>
          ))}

          {visibleOperators.length === 0 && (
            <p className="text-[11px] text-gray-400 italic py-1">No operators matching search</p>
          )}
        </div>

        {operatorStats.length > 7 && !operatorSearchQuery && (
          <button
            type="button"
            onClick={() => setShowAllOperators(!showAllOperators)}
            className="text-xs text-[#d84e55] hover:underline font-semibold mt-2.5 block cursor-pointer"
          >
            {showAllOperators ? 'Show Less' : `+ Show All (${operatorStats.length})`}
          </button>
        )}
      </div>

      {/* Amenities & Features */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
          Amenities &amp; Rules
        </h4>
        <div className="space-y-2.5 text-xs">
          {[
            { key: 'GPS', label: 'GPS Tracking', icon: 'gps_fixed' },
            { key: 'Single Seats', label: 'Single Seats Available', icon: 'airline_seat_recline_extra' }
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 cursor-pointer select-none text-gray-700 hover:text-gray-900"
            >
              <input
                type="checkbox"
                checked={filterAmenities.includes(item.key)}
                onChange={() => toggleFilter(filterAmenities, setFilterAmenities, item.key)}
                className="w-4 h-4 rounded border-gray-300 text-[#d84e55] focus:ring-[#d84e55] cursor-pointer"
              />
              <span className="material-symbols-outlined text-[15px] text-gray-400">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pt-20 pb-16 bg-[#F8F9FA]">
      {/* Sticky Search Context Bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-16 z-30 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Route & Journey Date Header */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-sm w-full sm:w-auto">
              <button
                type="button"
                onClick={onBackToHome}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Back to search"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Change Route</span>
              </button>

              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  {sourceCity || 'Source'}
                </span>
                <span className="material-symbols-outlined text-[#d84e55] text-[18px]">
                  trending_flat
                </span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  {destinationCity || 'Destination'}
                </span>
              </div>

              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

              <div className="flex items-center gap-1.5 text-gray-600 text-xs sm:text-sm font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-200/60">
                <span className="material-symbols-outlined text-[#d84e55] text-[16px]">
                  calendar_today
                </span>
                <span>{journeyDate}</span>
              </div>
            </div>

            {/* Total Results & Refresh */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <span className="w-3.5 h-3.5 border-2 border-[#d84e55] border-t-transparent rounded-full animate-spin"></span>
                    <span>Fetching live buses...</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100/80 px-3 py-1 rounded-full">
                    {sortedTrips.length} {sortedTrips.length === 1 ? 'Bus' : 'Buses'} Available
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => loadAvailableTrips(true)}
                title="Refresh live trips from RedBus API"
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span className="hidden md:inline text-xs font-medium">Refresh</span>
              </button>

              <button
                type="button"
                onClick={onBackToHome}
                className="px-4 py-1.5 bg-[#d84e55] hover:bg-[#c13a40] text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs"
              >
                Modify Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Filter Sidebar - Visible on Desktop */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/70 shadow-xs space-y-6 sticky top-32">
              {renderFilterContent(true)}
            </div>
          </aside>

          {/* Right Main Bus Results Column */}
          <div className="lg:col-span-9 space-y-4">
            {/* Mobile Collapsible Filters & Quick Toolbar */}
            <div className="lg:hidden space-y-2">
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-xs flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isMobileFiltersOpen || activeFiltersCount > 0
                      ? 'bg-[#d84e55] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">tune</span>
                  <span>{isMobileFiltersOpen ? 'Hide Filters' : 'Filters'}</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-white text-[#d84e55] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[17px]">
                    {isMobileFiltersOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs text-[#d84e55] font-semibold hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-xs font-bold text-gray-600 bg-gray-100/90 px-2.5 py-1 rounded-full">
                    {sortedTrips.length} {sortedTrips.length === 1 ? 'Bus' : 'Buses'}
                  </span>
                </div>
              </div>

              {/* Mobile Expanded Filters Panel */}
              {isMobileFiltersOpen && (
                <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-md space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-gray-900">tune</span>
                      <h3 className="font-bold text-gray-900 text-sm">Filter Results</h3>
                      {activeFiltersCount > 0 && (
                        <span className="bg-[#d84e55] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {activeFiltersCount} active
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="px-3.5 py-1.5 bg-[#d84e55] hover:bg-[#c13a40] text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
                    >
                      Apply &amp; View Buses
                    </button>
                  </div>
                  {renderFilterContent(false)}
                </div>
              )}
            </div>

            {/* Sort Bar */}
            <div className="bg-white p-3.5 rounded-3xl border border-gray-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Sort Buses By:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {[
                  { key: 'cheapest', label: 'Cheapest (₹)' },
                  { key: 'departure', label: 'Departure (Earliest)' },
                  { key: 'rating', label: 'Rating' },
                  { key: 'seats', label: 'Seats Left' },
                  { key: 'duration', label: 'Fastest' }
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSortBy(s.key as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      sortBy === s.key
                        ? 'bg-[#d84e55] text-white shadow-xs'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center shadow-xs">
                <span className="material-symbols-outlined text-[36px] text-red-500 mb-2">
                  error_outline
                </span>
                <h4 className="font-bold text-red-900 text-base mb-1">API Fetch Error</h4>
                <p className="text-xs text-red-700 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => loadAvailableTrips(true)}
                  className="px-5 py-2 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Retry API Call
                </button>
              </div>
            )}

            {/* Loading State - Delightful & Funny Bus Animation */}
            {isLoading && (
              <FunnyBusLoader
                sourceCity={sourceCity}
                destinationCity={destinationCity}
              />
            )}

            {/* Empty State */}
            {!isLoading && !error && sortedTrips.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/70 shadow-xs">
                <span className="material-symbols-outlined text-[52px] text-gray-300 mb-2">
                  directions_bus
                </span>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {trips.length === 0 ? 'No buses available for this route' : 'No buses match your filters'}
                </h3>
                <p className="text-xs text-gray-500 mb-5 font-normal max-w-md mx-auto">
                  {trips.length === 0
                    ? `No bus trips were returned by the RedBus API for ${sourceCity} to ${destinationCity} on ${journeyDate}. Try selecting an alternate travel date.`
                    : 'Try loosening your bus type, time slots, or operator filters to see available services.'}
                </p>
                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-[#d84e55] hover:bg-[#c13a40] text-white text-xs font-semibold rounded-full cursor-pointer transition-colors shadow-xs"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="px-6 py-2.5 bg-[#d84e55] hover:bg-[#c13a40] text-white text-xs font-semibold rounded-full cursor-pointer transition-colors shadow-xs"
                  >
                    Change Route or Date
                  </button>
                )}
              </div>
            )}

            {/* Live Trip Cards */}
            {!isLoading &&
              !error &&
              sortedTrips.map((trip) => {
                const isOpened = expandedTripId === trip.id;
                const cancellationTiers = parseCancellationPolicy(trip.cancellationPolicy);

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-3xl border border-gray-200/70 shadow-xs hover:shadow-md hover:border-red-200 transition-all overflow-hidden"
                  >
                    {/* Top Bus Overview */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Operator Info & Badges - Expanded to 41% for full operator names */}
                        <div className="flex items-start gap-3.5 lg:w-[41%] min-w-0">
                          <div
                            className={`w-12 h-12 rounded-2xl ${trip.operatorLogoBg} ${trip.operatorLogoColor} font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            {trip.operatorLogoText}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="font-bold text-gray-900 text-base capitalize cursor-default leading-snug"
                                title={trip.travels}
                              >
                                {trip.travels.toLowerCase()}
                              </h3>
                              <div className="flex items-center gap-1 bg-[#13805b] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                                <span>★</span>
                                <span>{trip.rating}</span>
                              </div>
                            </div>

                            <p
                              className="text-xs text-gray-500 mt-0.5 font-normal line-clamp-1 cursor-default"
                              title={trip.busType}
                            >
                              {trip.busType}
                            </p>

                            {/* Amenity / Feature tags */}
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500 flex-wrap">
                              {(trip.liveTrackingAvailable || trip.mTicketEnabled) && (
                                <span className="inline-flex items-center gap-1 text-[#13805b] font-medium" title="GPS Live Tracking">
                                  <span className="material-symbols-outlined text-[15px]">gps_fixed</span>
                                  <span>GPS</span>
                                </span>
                              )}
                              {trip.availableSingleSeat > 0 && (
                                <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
                                  <span className="material-symbols-outlined text-[14px]">airline_seat_recline_extra</span>
                                  {trip.availableSingleSeat} Single
                                </span>
                              )}
                              {trip.bpDpSeatLayout && (
                                <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                                  RTC Route
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timing, Duration & Route Connector - Compacted to 37% with reduced arrow */}
                        <div className="flex items-start justify-between sm:justify-center gap-2 sm:gap-4 py-2 lg:py-0 border-t border-b lg:border-0 border-gray-100 lg:w-[37%] shrink-0">
                          {/* Departure */}
                          <div className="w-[85px] sm:w-[95px] shrink-0 text-left">
                            <div className="text-base sm:text-lg font-bold text-gray-900 font-mono tracking-tight whitespace-nowrap h-7 flex items-center">
                              {trip.departureTime}
                            </div>
                            <div
                              className="text-[11px] text-gray-500 font-medium truncate h-5 flex items-center cursor-default"
                              title={sourceCity}
                            >
                              {sourceCity}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono whitespace-nowrap h-4 flex items-center">
                              ({trip.departureTime24})
                            </div>
                          </div>

                          {/* Reduced Duration Arrow */}
                          <div className="w-[50px] sm:w-[58px] shrink-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 whitespace-nowrap h-7 flex items-center">
                              {trip.duration}
                            </span>
                            <div className="w-full flex items-center gap-0.5 h-5 px-0.5">
                              <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0"></span>
                              <div className="flex-1 border-t border-dashed border-gray-300"></div>
                              <span className="material-symbols-outlined text-gray-400 text-[12px] shrink-0">
                                arrow_forward
                              </span>
                            </div>
                            <div className="h-4"></div>
                          </div>

                          {/* Arrival */}
                          <div className="w-[130px] sm:w-[145px] shrink-0 text-left">
                            <div className="flex items-center justify-start gap-1.5 whitespace-nowrap flex-nowrap h-7">
                              <span className="text-base sm:text-lg font-bold text-gray-900 font-mono tracking-tight whitespace-nowrap">
                                {trip.arrivalTime}
                              </span>
                              {trip.isNextDay && (
                                <span className="bg-red-100 text-[#d84e55] font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md shadow-xs whitespace-nowrap shrink-0">
                                  Next day
                                </span>
                              )}
                            </div>
                            <div
                              className="text-[11px] text-gray-500 font-medium truncate h-5 flex items-center cursor-default"
                              title={destinationCity}
                            >
                              {destinationCity}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono whitespace-nowrap h-4 flex items-center">
                              ({trip.arrivalTime24})
                            </div>
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-2 lg:pt-0 border-t lg:border-0 border-gray-100 lg:w-[22%] shrink-0">
                          <div className="text-left lg:text-right">
                            <div className="text-[11px] text-gray-400 font-normal">Starts from</div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 font-mono">
                              ₹{Math.round(trip.priceStart)}
                            </div>
                            <div
                              className={`text-[11px] font-semibold ${
                                trip.availableSeats <= 10 ? 'text-[#d84e55]' : 'text-gray-600'
                              }`}
                            >
                              {trip.availableSeats} seats left
                              {trip.avlWindowSeats > 0 && (
                                <span className="text-gray-400 font-normal"> ({trip.avlWindowSeats} window)</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleExpand(trip.id)}
                            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              isOpened
                                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                : 'bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] text-white hover:shadow-md'
                            }`}
                          >
                            <span>{isOpened ? 'Hide Details' : 'View Seats'}</span>
                            <span className="material-symbols-outlined text-[16px]">
                              {isOpened ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Live Seat Layout & Cancellation Policy */}
                    {isOpened && (
                      <div className="border-t border-gray-200/80 bg-gray-50/50 p-4 sm:p-6 transition-all animate-fadeIn">
                        <SeatLayout
                          bus={trip}
                          onProceedToBooking={onProceedToBooking}
                          onClose={() => handleToggleExpand(trip.id)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </main>
  );
};
