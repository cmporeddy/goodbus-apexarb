import React, { useState, useRef, useEffect, useMemo } from 'react';
import { POPULAR_ROUTES } from '../data/busData';
import {
  fetchCitiesAndAliases,
  searchCitiesWithProximity,
  CitySearchItem,
  RedBusCity
} from '../services/redbusService';

interface HomeScreenProps {
  sourceCity: string;
  sourceCityId?: string;
  destinationCity: string;
  destinationCityId?: string;
  journeyDate: string;
  setSourceCity: (val: string, id?: string) => void;
  setDestinationCity: (val: string, id?: string) => void;
  setJourneyDate: (val: string) => void;
  onSearch: () => void;
  onSelectPopularRoute: (from: string, to: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  sourceCity,
  sourceCityId,
  destinationCity,
  destinationCityId,
  journeyDate,
  setSourceCity,
  setDestinationCity,
  setJourneyDate,
  onSearch,
  onSelectPopularRoute
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | 'date' | null>(null);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  // API Cities and Aliases state
  const [searchItems, setSearchItems] = useState<CitySearchItem[]>([]);
  const [, setCitiesList] = useState<RedBusCity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [, setLoadError] = useState<string | null>(null);
  const [userGeoLocation, setUserGeoLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch cities and aliases on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCities(true);
    fetchCitiesAndAliases()
      .then((res) => {
        if (isMounted) {
          setSearchItems(res.searchItems);
          setCitiesList(res.cities);
          setIsLoadingCities(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load cities:', err);
          setLoadError('Failed to load cities. Please ensure backend is running.');
          setIsLoadingCities(false);
        }
      });

    // Request browser geolocation for departure proximity
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isMounted) {
            setUserGeoLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        },
        (err) => {
          console.log('Browser geolocation notice:', err.message);
        },
        { timeout: 8000 }
      );
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Calendar month view state
  const [calendarDate, setCalendarDate] = useState(() => {
    if (journeyDate) {
      const parts = journeyDate.split('-').map(Number);
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    return new Date();
  });

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const isAutoScrollingRef = useRef(false);

  // Smoothly move the search section to top (just below navbar) without hiding any content
  const moveToTop = () => {
    if (searchBoxRef.current) {
      const navbarHeight = 64;
      const rect = searchBoxRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - navbarHeight - 20;
      
      // If already at target position, no scroll needed
      if (Math.abs(scrollTop - targetY) < 8) return;

      isAutoScrollingRef.current = true;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });

      // Clear programmatic scroll lock after smooth scroll finishes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 700);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when user manually scrolls the page (ignoring moveToTop smooth scroll)
  useEffect(() => {
    const handleScroll = () => {
      if (!isAutoScrollingRef.current) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on user wheel action outside the dropdown
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.city-dropdown-list')) {
        return; // Allow scrolling inside dropdown list
      }
      if (!isAutoScrollingRef.current && Math.abs(e.deltaY) > 5) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleSwapCities = () => {
    moveToTop();
    setValidationError(null);
    const tempCity = sourceCity;
    const tempId = sourceCityId;
    setSourceCity(destinationCity, destinationCityId);
    setDestinationCity(tempCity, tempId);
  };

  const setDateOffset = (offsetDays: number) => {
    moveToTop();
    setValidationError(null);
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    setJourneyDate(dateStr);
    setCalendarDate(new Date(yyyy, d.getMonth(), 1));
  };

  const isToday = () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return journeyDate === today;
  };

  const isTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return journeyDate === tomorrow;
  };

  // Date display and calendar formatting helpers
  const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL_MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const monthName = MONTH_SHORT_NAMES[m - 1] || '';
    return `${String(d).padStart(2, '0')} ${monthName} ${y}`;
  };

  const formatDayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return '';
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return DAYS_OF_WEEK[d.getDay()] || '';
  };

  const canGoPrevMonth = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    return (
      calendarDate.getFullYear() > currentYear ||
      (calendarDate.getFullYear() === currentYear && calendarDate.getMonth() > currentMonth)
    );
  };

  const handlePrevMonth = () => {
    if (!canGoPrevMonth()) return;
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (dateStr: string) => {
    setJourneyDate(dateStr);
    setValidationError(null);
    setActiveDropdown(null);
  };

  // Generate days for currently viewed calendar month
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(calYear, calMonth, 1).getDay();

  const nowObj = new Date();
  const todayDateStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;

  const calendarDays: Array<{
    dayNum: number;
    dateStr: string;
    isPast: boolean;
    isSelected: boolean;
    isCurrentToday: boolean;
  } | null> = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }

  for (let dayNumber = 1; dayNumber <= daysInCalMonth; dayNumber++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    calendarDays.push({
      dayNum: dayNumber,
      dateStr,
      isPast: dateStr < todayDateStr,
      isSelected: dateStr === journeyDate,
      isCurrentToday: dateStr === todayDateStr,
    });
  }

  // Filter cities dynamically from RedBus API using proximity and alias matching
  const filteredFromCities = useMemo(() => {
    return searchCitiesWithProximity(searchItems, fromQuery, userGeoLocation, 40);
  }, [searchItems, fromQuery, userGeoLocation]);

  // Reference location for destination: departure city lat/long if selected, else user geo
  const departureCityItem = useMemo(() => {
    if (!sourceCity) return null;
    return (
      searchItems.find((c) =>
        sourceCityId ? c.id === sourceCityId : c.name.toLowerCase() === sourceCity.toLowerCase()
      ) || null
    );
  }, [sourceCity, sourceCityId, searchItems]);

  const destinationReferenceLocation = useMemo(() => {
    if (departureCityItem && departureCityItem.latitude && departureCityItem.longitude) {
      return { latitude: departureCityItem.latitude, longitude: departureCityItem.longitude };
    }
    return userGeoLocation;
  }, [departureCityItem, userGeoLocation]);

  const filteredToCities = useMemo(() => {
    return searchCitiesWithProximity(searchItems, toQuery, destinationReferenceLocation, 40);
  }, [searchItems, toQuery, destinationReferenceLocation]);

  // Selection handlers with same-city prevention validation
  const handleSelectFromCity = (item: CitySearchItem) => {
    // Check if same city as destination
    const isSame =
      (destinationCityId && item.id === destinationCityId) ||
      (destinationCity && item.name.toLowerCase() === destinationCity.toLowerCase()) ||
      (destinationCity && item.officialName.toLowerCase() === destinationCity.toLowerCase());

    if (isSame) {
      setValidationError('Departure city cannot be the same as Destination city.');
      return;
    }

    setValidationError(null);
    setSourceCity(item.name, item.id);
    setFromQuery('');
    setActiveDropdown('to');
    setTimeout(() => toInputRef.current?.focus(), 50);
  };

  const handleSelectToCity = (item: CitySearchItem) => {
    // Check if same city as departure
    const isSame =
      (sourceCityId && item.id === sourceCityId) ||
      (sourceCity && item.name.toLowerCase() === sourceCity.toLowerCase()) ||
      (sourceCity && item.officialName.toLowerCase() === sourceCity.toLowerCase());

    if (isSame) {
      setValidationError('Destination city cannot be the same as Departure city.');
      return;
    }

    setValidationError(null);
    setDestinationCity(item.name, item.id);
    setToQuery('');
    setActiveDropdown(null);
  };

  // Comprehensive Search validation
  const handleSearchSubmit = () => {
    moveToTop();
    if (!sourceCity.trim()) {
      setValidationError('Please select or enter a departure city (From City).');
      setActiveDropdown('from');
      fromInputRef.current?.focus();
      return;
    }

    if (!destinationCity.trim()) {
      setValidationError('Please select or enter a destination city (To Destination).');
      setActiveDropdown('to');
      toInputRef.current?.focus();
      return;
    }

    const isSame =
      (sourceCityId && destinationCityId && sourceCityId === destinationCityId) ||
      sourceCity.trim().toLowerCase() === destinationCity.trim().toLowerCase();

    if (isSame) {
      setValidationError('Both From City and To Destination cannot be the same city. Please select different cities.');
      return;
    }

    if (!journeyDate) {
      setValidationError('Please select a journey date.');
      setActiveDropdown('date');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (journeyDate < todayStr) {
      setValidationError('Journey date cannot be in the past. Please choose today or a future date.');
      setActiveDropdown('date');
      return;
    }

    setValidationError(null);
    onSearch();
  };

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Content is never hidden, stays naturally in place */}
        <section className="text-center max-w-6xl mx-auto mb-14">
          {/* Guaranteed Lowest Fares Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200/90 rounded-full text-xs text-gray-700 mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-[#d84e55]">local_offer</span>
            <span className="font-medium text-gray-800">
              Guaranteed Lowest Fares <span className="text-gray-400 font-normal">•</span> Up to 15% Extra Savings
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-light text-gray-900 tracking-tight mb-4 leading-tight max-w-4xl mx-auto">
            Book Bus Tickets Across India with{' '}
            <span className="font-normal text-[#d84e55]">
              Unbeatable Discounts
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Zero hidden fees, instant zero-login booking, and exclusive fleet discounts on sleeper &amp; Volvo coaches.
          </p>

          {/* Search Box - Expansive redBus-style Connected Search Bar */}
          <div
            ref={searchBoxRef}
            className="bg-white p-3 sm:p-4 lg:p-5 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 text-left"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* From City */}
              <div className="md:col-span-3 lg:col-span-3 relative">
                <div
                  onClick={() => {
                    moveToTop();
                    setActiveDropdown('from');
                    fromInputRef.current?.focus();
                  }}
                  className={`p-3 bg-gray-50/70 hover:bg-white focus-within:bg-white rounded-2xl border transition-all cursor-text ${
                    activeDropdown === 'from'
                      ? 'border-[#d84e55] ring-1 ring-[#d84e55] bg-white'
                      : 'border-gray-200/90'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    From City
                  </span>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-[#d84e55] text-[20px] mr-2 shrink-0">
                      directions_bus
                    </span>
                    <input
                      ref={fromInputRef}
                      type="text"
                      value={sourceCity}
                      onChange={(e) => {
                        setSourceCity(e.target.value);
                        setFromQuery(e.target.value);
                        setValidationError(null);
                        setActiveDropdown('from');
                        moveToTop();
                      }}
                      onFocus={() => {
                        setActiveDropdown('from');
                        setFromQuery('');
                        moveToTop();
                      }}
                      placeholder="Departure city (e.g. Bengaluru)"
                      className="w-full bg-transparent font-semibold text-gray-900 text-sm focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
                    />
                    {sourceCity && activeDropdown === 'from' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSourceCity('');
                          setFromQuery('');
                          setValidationError(null);
                          fromInputRef.current?.focus();
                        }}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full shrink-0 cursor-pointer"
                        title="Clear city"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Floating Dropdown for From City */}
                {activeDropdown === 'from' && (
                  <div
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute top-[calc(100%+8px)] left-0 w-full sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[#d84e55] text-[16px] shrink-0">directions_bus</span>
                        <span className="truncate">Departure Cities</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal shrink-0">
                        {isLoadingCities ? 'Loading...' : 'Select city'}
                      </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 scrollbar-thin scrollbar-thumb-gray-200 city-dropdown-list">
                      {isLoadingCities ? (
                        <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-[#d84e55] text-[24px]">sync</span>
                          <span>Loading Indian cities &amp; routes...</span>
                        </div>
                      ) : filteredFromCities.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">
                          No cities matching "{fromQuery}"
                        </div>
                      ) : (
                        filteredFromCities.map((cityItem) => {
                          const isSameAsDest = Boolean(
                            (destinationCityId && cityItem.id === destinationCityId) ||
                            (destinationCity && cityItem.name.toLowerCase() === destinationCity.toLowerCase()) ||
                            (destinationCity && cityItem.officialName.toLowerCase() === destinationCity.toLowerCase())
                          );

                          return (
                            <div
                              key={`${cityItem.id}-${cityItem.name}-${cityItem.isAlias ? 'alias' : 'main'}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (isSameAsDest) {
                                  setValidationError('Departure city cannot be the same as Destination city.');
                                  return;
                                }
                                handleSelectFromCity(cityItem);
                              }}
                              className={`p-3 transition-colors flex items-center justify-between group ${
                                isSameAsDest
                                  ? 'opacity-40 cursor-not-allowed bg-gray-50'
                                  : 'hover:bg-red-50/50 cursor-pointer'
                              } ${
                                sourceCity.toLowerCase() === cityItem.name.toLowerCase() ? 'bg-red-50/40' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isSameAsDest
                                      ? 'bg-gray-200 text-gray-400'
                                      : 'bg-gray-100 text-gray-500 group-hover:bg-[#d84e55] group-hover:text-white'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">directions_bus</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-[#d84e55] transition-colors truncate">
                                  {cityItem.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 group-hover:bg-red-100 group-hover:text-[#d84e55] px-2 py-0.5 rounded-full shrink-0 ml-2">
                                {cityItem.state || 'India'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2 md:my-0 md:col-span-1 lg:col-span-1">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-red-50 text-gray-500 hover:text-[#d84e55] hover:border-red-200 shadow-sm flex items-center justify-center transition-all hover:rotate-180 duration-200 active:scale-95 cursor-pointer"
                  title="Swap departure and destination cities"
                  aria-label="Swap cities"
                >
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </button>
              </div>

              {/* To Destination */}
              <div className="md:col-span-3 lg:col-span-3 relative">
                <div
                  onClick={() => {
                    moveToTop();
                    setActiveDropdown('to');
                    toInputRef.current?.focus();
                  }}
                  className={`p-3 bg-gray-50/70 hover:bg-white focus-within:bg-white rounded-2xl border transition-all cursor-text ${
                    activeDropdown === 'to'
                      ? 'border-[#d84e55] ring-1 ring-[#d84e55] bg-white'
                      : 'border-gray-200/90'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    To Destination
                  </span>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-[#d84e55] text-[20px] mr-2 shrink-0">
                      location_on
                    </span>
                    <input
                      ref={toInputRef}
                      type="text"
                      value={destinationCity}
                      onChange={(e) => {
                        moveToTop();
                        setDestinationCity(e.target.value);
                        setToQuery(e.target.value);
                        setValidationError(null);
                        setActiveDropdown('to');
                      }}
                      onFocus={() => {
                        moveToTop();
                        setActiveDropdown('to');
                        setToQuery('');
                      }}
                      placeholder="Destination city (e.g. Chennai)"
                      className="w-full bg-transparent font-semibold text-gray-900 text-sm focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
                    />
                    {destinationCity && activeDropdown === 'to' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDestinationCity('');
                          setToQuery('');
                          setValidationError(null);
                          toInputRef.current?.focus();
                        }}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full shrink-0 cursor-pointer"
                        title="Clear city"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Floating Dropdown for To Destination */}
                {activeDropdown === 'to' && (
                  <div
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute top-[calc(100%+8px)] left-0 w-full sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[#d84e55] text-[16px] shrink-0">location_on</span>
                        <span className="truncate">Destination Cities</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal shrink-0">
                        {isLoadingCities ? 'Loading...' : 'Select city'}
                      </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 scrollbar-thin scrollbar-thumb-gray-200 city-dropdown-list">
                      {isLoadingCities ? (
                        <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-[#d84e55] text-[24px]">sync</span>
                          <span>Loading Indian cities &amp; routes...</span>
                        </div>
                      ) : filteredToCities.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">
                          No cities matching "{toQuery}"
                        </div>
                      ) : (
                        filteredToCities.map((cityItem) => {
                          const isSameAsSource = Boolean(
                            (sourceCityId && cityItem.id === sourceCityId) ||
                            (sourceCity && cityItem.name.toLowerCase() === sourceCity.toLowerCase()) ||
                            (sourceCity && cityItem.officialName.toLowerCase() === sourceCity.toLowerCase())
                          );

                          return (
                            <div
                              key={`${cityItem.id}-${cityItem.name}-${cityItem.isAlias ? 'alias' : 'main'}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (isSameAsSource) {
                                  setValidationError('Destination city cannot be the same as Departure city.');
                                  return;
                                }
                                handleSelectToCity(cityItem);
                              }}
                              className={`p-3 transition-colors flex items-center justify-between group ${
                                isSameAsSource
                                  ? 'opacity-40 cursor-not-allowed bg-gray-50'
                                  : 'hover:bg-red-50/50 cursor-pointer'
                              } ${
                                destinationCity.toLowerCase() === cityItem.name.toLowerCase() ? 'bg-red-50/40' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isSameAsSource
                                      ? 'bg-gray-200 text-gray-400'
                                      : 'bg-gray-100 text-gray-500 group-hover:bg-[#d84e55] group-hover:text-white'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-[#d84e55] transition-colors truncate">
                                  {cityItem.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 group-hover:bg-red-100 group-hover:text-[#d84e55] px-2 py-0.5 rounded-full shrink-0 ml-2">
                                {cityItem.state || 'India'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Journey Date */}
              <div className="md:col-span-3 lg:col-span-3 relative">
                <div
                  onClick={() => {
                    moveToTop();
                    setActiveDropdown((prev) => (prev === 'date' ? null : 'date'));
                  }}
                  className={`p-3 bg-gray-50/70 hover:bg-white rounded-2xl border transition-all cursor-pointer select-none ${
                    activeDropdown === 'date'
                      ? 'border-[#d84e55] ring-1 ring-[#d84e55] bg-white shadow-sm'
                      : 'border-gray-200/90 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Journey Date
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateOffset(0);
                        }}
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          isToday()
                            ? 'bg-[#d84e55] text-white'
                            : 'bg-gray-200/70 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateOffset(1);
                        }}
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          isTomorrow()
                            ? 'bg-[#d84e55] text-white'
                            : 'bg-gray-200/70 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>

                  {/* Clean Non-editable Custom Date Display */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[#d84e55] text-[20px] shrink-0">
                        calendar_today
                      </span>
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className="text-sm font-bold text-gray-900 tracking-tight">
                          {formatDisplayDate(journeyDate)}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDayOfWeek(journeyDate)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-gray-400 text-[18px] transition-transform duration-200 ${
                        activeDropdown === 'date' ? 'rotate-180 text-[#d84e55]' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Custom redBus-style Interactive Calendar Dropdown */}
                {activeDropdown === 'date' && (
                  <div
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute top-[calc(100%+8px)] right-0 sm:left-auto w-full sm:w-[330px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4 animate-in fade-in slide-in-from-top-1 duration-150 city-dropdown-list"
                  >
                    {/* Month Header Navigation */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevMonth();
                        }}
                        disabled={!canGoPrevMonth()}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          canGoPrevMonth()
                            ? 'text-gray-700 hover:bg-gray-100 cursor-pointer active:scale-95'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Previous month"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>

                      <div className="text-sm font-bold text-gray-900 tracking-tight">
                        {FULL_MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextMonth();
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 cursor-pointer active:scale-95 transition-all"
                        title="Next month"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>

                    {/* Day Names Row */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
                        <div
                          key={day}
                          className={`text-[11px] font-semibold py-1 ${
                            idx === 0 || idx === 6 ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {calendarDays.map((dayItem, idx) => {
                        if (!dayItem) {
                          return <div key={`empty-${idx}`} className="h-9" />;
                        }
                        const { dayNum, dateStr, isPast, isSelected, isCurrentToday } = dayItem;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            disabled={isPast}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDate(dateStr);
                            }}
                            className={`h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all relative ${
                              isSelected
                                ? 'bg-[#d84e55] text-white shadow-md shadow-red-200 font-bold scale-105'
                                : isPast
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-red-50 hover:text-[#d84e55] cursor-pointer'
                            }`}
                          >
                            <span>{dayNum}</span>
                            {isCurrentToday && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d84e55] mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Quick Bar */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#d84e55]" />
                        <span>Selected</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300 ml-1.5" />
                        <span className="text-gray-400">Past</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateOffset(0);
                          setActiveDropdown(null);
                        }}
                        className="text-[#d84e55] font-semibold hover:underline cursor-pointer"
                      >
                        Select Today
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Buses Button */}
              <div className="md:col-span-2 lg:col-span-2">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full h-full min-h-[58px] py-3.5 px-4 bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  <span>SEARCH BUSES</span>
                </button>
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="mt-4 p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[20px] text-[#d84e55] shrink-0">
                    error
                  </span>
                  <span className="font-medium text-xs sm:text-sm truncate">
                    {validationError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-full cursor-pointer shrink-0 transition-colors"
                  title="Dismiss error"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Popular Intercity Bus Routes */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
                Popular Intercity Bus Routes
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">
                Fast connections across top Indian metro corridors with high sleeper frequency
              </p>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-[#d84e55] bg-[#fef2f2] border border-red-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Express Routes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_ROUTES.map((route) => (
              <div
                key={route.id}
                onClick={() => onSelectPopularRoute(route.from, route.to)}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer flex flex-col"
              >
                <div className="h-40 relative overflow-hidden bg-gray-100">
                  <img
                    src={route.image}
                    alt={`${route.from} to ${route.to}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                    {route.frequency}
                  </span>
                  <div className="absolute bottom-3 left-3 text-white">
                    <h4 className="text-base font-medium leading-tight">
                      {route.from} → {route.to}
                    </h4>
                    <span className="text-[11px] text-white/80 font-light">{route.via}</span>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between text-xs bg-white">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                    {route.tag}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d84e55] bg-[#fef2f2] border border-red-100 px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">directions_bus</span>
                    Book Now
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
