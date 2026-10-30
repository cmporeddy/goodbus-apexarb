export type DeckType = 'lower' | 'upper';

export type SeatType = 'seater' | 'sleeper';

export interface Seat {
  id: string; // e.g., 'L3', 'S5', 'U4'
  number: string;
  deck: DeckType;
  type: SeatType;
  price: number; // Base fare shown in search & seat selection
  baseFare?: number;
  gst?: number;
  totalFare?: number;
  isLadies?: boolean;
  isBooked?: boolean;
  bookedGender?: 'Male' | 'Female';
  isLadiesBooked?: boolean;
  row?: number;
  col?: number;
  title?: string;
}

export interface BoardingPoint {
  id: string;
  name: string;
  landmark: string;
  time: string;
  isPickup?: boolean;
  isBoardingStop?: boolean;
}

export interface DroppingPoint {
  id: string;
  name: string;
  landmark: string;
  time: string;
  isDropoff?: boolean;
  isFinalTerminus?: boolean;
}

export interface BusTrip {
  id: string;
  operator: string;
  operatorLogoText: string;
  operatorLogoBg: string;
  operatorLogoColor: string;
  busType: string;
  rating: number;
  reviewsCount: string;
  sourceCity: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  routeVia: string;
  priceStart: number;
  seatsLeft: number;
  isLiveTracking: boolean;
  hasAC: boolean;
  hasSleeper: boolean;
  hasCharging: boolean;
  hasWifi: boolean;
  hasBlanket: boolean;
  hasWater: boolean;
  badgeText?: string;
  cancellationPolicy?: string;
  partialCancellationAllowed?: boolean;
  boardingPoints: BoardingPoint[];
  droppingPoints: DroppingPoint[];
  seats: Seat[];
}

export interface Passenger {
  id: string;
  seatId: string;
  seatDeckText: string;
  name: string;
  age: number | string;
  gender: 'Male' | 'Female';
  isPrimary?: boolean;
}

export interface BookingDetails {
  tin: string; // Ticket Identification Number
  pnr: string;
  bus: BusTrip;
  selectedSeats: Seat[];
  boardingPoint: BoardingPoint;
  droppingPoint: DroppingPoint;
  passengers: Passenger[];
  contactMobile: string;
  contactEmail: string;
  whatsappAlerts: boolean;
  journeyDate: string;
  bookingTimestamp: string;
  baseFare: number;
  gstAmount: number;
  discountAmount: number;
  totalPaid: number;
  paymentMethod: string;
  status: 'CONFIRMED' | 'CANCELLED';
  txnId: string;
  cancellationPolicy?: string;
  partialCancellationAllowed?: boolean;
}

export interface FilterState {
  busTypes: string[];
  departureTimes: string[];
  boardingPoints: string[];
  droppingPoints: string[];
  operators: string[];
  amenities: string[];
}
