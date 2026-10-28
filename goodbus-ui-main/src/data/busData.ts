import { BusTrip, Seat, BookingDetails } from '../types';

export const POPULAR_ROUTES = [
  {
    id: 'blr-hyd',
    from: 'Bengaluru',
    to: 'Hyderabad',
    via: 'Via NH 44 • 8h 30m avg',
    tag: 'Sleeper • AC • Semi',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8WWbiCEHLcGqVL9-0eUrGJV796HJYUHezW1ieVVu6jxeESqHIzzvzJPdxQzCBg7rvdvWkoqKg0FMjSu9L4id7ZPkd-VTJC1-GalbHmrNhsEsOVBOpc1rn8t7T-0ncqFgYXchz8Os5Y3yAK-at6CKJkQSxGZy1wVUm-MVCZ-Lqfz2vCq9tlPRrpS17RP9XJrfwGxasACXsg05QLN2x_BEO6x-7O7XM3zoTZelh3iIeMPT7Np1DhD3y',
    frequency: 'Daily Buses',
    price: '₹899'
  },
  {
    id: 'bom-pnq',
    from: 'Mumbai',
    to: 'Pune',
    via: 'Via Expressway • 3h 15m avg',
    tag: 'Departs every 15 mins',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlOIKLdJ4LDmV1IDSYIrmG34ynQLpGdJV8mFX__fose8JxXlMHQNINr_E8wbS963NUUcg4GSTtaPADJGmHGy-FRVdMmWvuXHOxQ7PywSgFqX-SIhOZAkMR3TfYEdPPj-SbdXlyStrWA7XfEgVz5XD3l55ob9eEdTux1wYLxDQPbn5SZArs142cjheo87W8lNkaSr6kcv9h8k6gPylk_yYEDFEmgLuhxvcgJS9NLFz_NFh69OFbG2aX',
    frequency: 'Daily Buses',
    price: '₹349'
  },
  {
    id: 'del-jai',
    from: 'Delhi',
    to: 'Jaipur',
    via: 'Via Delhi-Mumbai Expy • 4h 45m',
    tag: 'Free Wi-Fi • Charging Point',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1cO208bwr6RQDLtOC1QhE2ioYdNkYgqi6Dy4q3Qq1tt18u36dlMhtghUZdDpOX6zwLF2fPn8_fxTWhQnt-uXw8ObzcM59pHx_gNJdmqd9EKHTE5qRo3z-GM6TFW6ZfWvhTDPdqHJri86nvOSHbhEu_qTge8V5PqHAdLInhyU0-N82XU-JaYgvrQilSH71BqW22sYRAlMbw70v_jdKcCts-ggLJyyfzK0VoWKKiRL5lrpsf07Hp6Eb',
    frequency: 'Daily Buses',
    price: '₹420'
  },
  {
    id: 'maa-cjb',
    from: 'Chennai',
    to: 'Coimbatore',
    via: 'Via NH 544 • 8h 15m avg',
    tag: 'Luxury Sleepers Available',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm8HIyG4BWciT3ijbF0-ykxorJf5J_9k8U5dm8r9hxstrvB1vLnp9x681aLgrzBR7H0yzSSWpnn-rYfSTCSs8hkxKvMTuEK5DA85SbOUj24OkO2epoe8yGD-AZko75gskbPtk1jeR7s2S92nrFfzVTOLUXgVeXCqoKi-J0zhVvQyj4nAj_pQCJCrbTdTtaNOHSEb3v587wG48WTPuPKs3DD2jXUpmTAizpACTvRJDYyCCXmIF2jAuf',
    frequency: 'Daily Buses',
    price: '₹550'
  }
];

export const FLEET_OPERATORS = [
  { code: 'VRL', name: 'VRL Logistics', rating: '4.8', fleetCount: 'Premium Comfort', bg: 'bg-[#e5eeff]', color: 'text-[#bb0112]' },
  { code: 'OT', name: 'Orange Tours', rating: '4.7', fleetCount: 'On-Time Service', bg: 'bg-[#ffdad6]', color: 'text-[#93000b]' },
  { code: 'ZB', name: 'Zingbus', rating: '4.9', fleetCount: 'Clean Fleet', bg: 'bg-[#00301e]', color: 'text-[#6ffbbe]' },
  { code: 'IC', name: 'IntrCity SmartBus', rating: '4.7', fleetCount: 'Clean Washrooms', bg: 'bg-[#d8e3fb]', color: 'text-[#091426]' },
  { code: 'FB', name: 'FlixBus', rating: '4.8', fleetCount: 'Global Network', bg: 'bg-[#d3e4fe]', color: 'text-[#091426]' },
  { code: 'RT', name: 'Rajesh Transport', rating: '4.7', fleetCount: 'Safe & Reliable', bg: 'bg-[#e5eeff]', color: 'text-[#091426]' }
];

export const DEFAULT_SEATS: Seat[] = [
  // Lower Deck Sleeper Row 1
  { id: 'L2', number: 'L2', deck: 'lower', type: 'sleeper', price: 899, isBooked: true, bookedGender: 'Male' },
  { id: 'L5', number: 'L5', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L8', number: 'L8', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L11', number: 'L11', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L14', number: 'L14', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L17', number: 'L17', deck: 'lower', type: 'sleeper', price: 899 },

  // Lower Deck Sleeper Row 2
  { id: 'L3', number: 'L3', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L6', number: 'L6', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L9', number: 'L9', deck: 'lower', type: 'sleeper', price: 899, isBooked: true, bookedGender: 'Female' },
  { id: 'L12', number: 'L12', deck: 'lower', type: 'sleeper', price: 899 },
  { id: 'L15', number: 'L15', deck: 'lower', type: 'sleeper', price: 899, isBooked: true, bookedGender: 'Male' },
  { id: 'L18', number: 'L18', deck: 'lower', type: 'sleeper', price: 899 },

  // Lower Deck Seater Row
  { id: 'S1', number: 'S1', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S2', number: 'S2', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S3', number: 'S3', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S4', number: 'S4', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S5', number: 'S5', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S6', number: 'S6', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S7', number: 'S7', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S8', number: 'S8', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S9', number: 'S9', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S10', number: 'S10', deck: 'lower', type: 'seater', price: 599 },
  { id: 'S11', number: 'S11', deck: 'lower', type: 'seater', price: 599, isBooked: true, bookedGender: 'Male' },
  { id: 'S12', number: 'S12', deck: 'lower', type: 'seater', price: 599, isBooked: true, bookedGender: 'Male' },

  // Upper Deck Row 1
  { id: 'U2', number: 'U2', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U5', number: 'U5', deck: 'upper', type: 'sleeper', price: 949, isBooked: true, bookedGender: 'Male' },
  { id: 'U8', number: 'U8', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U11', number: 'U11', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U14', number: 'U14', deck: 'upper', type: 'sleeper', price: 949, isBooked: true, bookedGender: 'Female' },
  { id: 'U17', number: 'U17', deck: 'upper', type: 'sleeper', price: 949 },

  // Upper Deck Row 2
  { id: 'U3', number: 'U3', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U6', number: 'U6', deck: 'upper', type: 'sleeper', price: 949, isBooked: true, bookedGender: 'Male' },
  { id: 'U9', number: 'U9', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U12', number: 'U12', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U15', number: 'U15', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U18', number: 'U18', deck: 'upper', type: 'sleeper', price: 949, isBooked: true, bookedGender: 'Male' },

  // Upper Deck Row 3
  { id: 'U1', number: 'U1', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U4', number: 'U4', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U7', number: 'U7', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U10', number: 'U10', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U13', number: 'U13', deck: 'upper', type: 'sleeper', price: 949 },
  { id: 'U16', number: 'U16', deck: 'upper', type: 'sleeper', price: 949, isBooked: true, bookedGender: 'Male' }
];

export const SAMPLE_BOARDING_POINTS = [
  {
    id: 'bp-1',
    name: 'Anand Rao Circle',
    landmark: 'Opp. State Bank ATM',
    time: '21:00',
    isPickup: true
  },
  {
    id: 'bp-2',
    name: 'Majestic Bus Stand',
    landmark: 'Platform 21, Subhash Nagar',
    time: '21:30',
    isBoardingStop: true
  },
  {
    id: 'bp-3',
    name: 'Hebbal Flyover',
    landmark: 'Near Esteem Mall Entry',
    time: '22:00',
    isPickup: true
  },
  {
    id: 'bp-4',
    name: 'Silk Board Junction',
    landmark: 'Silk Board Flyover Entry',
    time: '22:30',
    isPickup: true
  }
];

export const SAMPLE_DROPPING_POINTS = [
  {
    id: 'dp-1',
    name: 'Shamshabad Toll Gate',
    landmark: 'Airport Highway Exit',
    time: '05:45',
    isDropoff: true
  },
  {
    id: 'dp-2',
    name: 'Ameerpet Metro Junction',
    landmark: 'Opp. Big Bazaar',
    time: '06:15',
    isDropoff: true
  },
  {
    id: 'dp-3',
    name: 'MGBS Platform 3',
    landmark: 'Imlibun Central Bus Terminal',
    time: '06:30',
    isFinalTerminus: true
  },
  {
    id: 'dp-4',
    name: 'Miyapur Allwyn X Road',
    landmark: 'Opp. Metro Pillar 12',
    time: '07:00',
    isDropoff: true
  }
];

export const SAMPLE_BUS_TRIPS: BusTrip[] = [
  {
    id: 'bus-orange-1',
    operator: 'Orange Tours & Travels',
    operatorLogoText: 'OT',
    operatorLogoBg: 'bg-[#ffdad6]',
    operatorLogoColor: 'text-[#93000b]',
    busType: 'BharatBenz AC Seater + Sleeper (2+1)',
    rating: 4.8,
    reviewsCount: '1.4k',
    sourceCity: 'Bengaluru',
    destinationCity: 'Hyderabad',
    departureTime: '21:00',
    arrivalTime: '06:30',
    duration: '9h 30m',
    routeVia: 'Via NH 44',
    priceStart: 899,
    seatsLeft: 14,
    isLiveTracking: true,
    hasAC: true,
    hasSleeper: true,
    hasCharging: true,
    hasWifi: true,
    hasBlanket: true,
    hasWater: false,
    cancellationPolicy: '0:4:100:0;4:12:50:0;12:24:20:0;24:-1:10:0',
    partialCancellationAllowed: true,
    boardingPoints: SAMPLE_BOARDING_POINTS,
    droppingPoints: SAMPLE_DROPPING_POINTS,
    seats: DEFAULT_SEATS
  },
  {
    id: 'bus-intrcity-2',
    operator: 'IntrCity SmartBus',
    operatorLogoText: 'IC',
    operatorLogoBg: 'bg-[#d8e3fb]',
    operatorLogoColor: 'text-[#091426]',
    busType: 'Multi-Axle Volvo AC Sleeper (2+1)',
    rating: 4.7,
    reviewsCount: '980',
    sourceCity: 'Bengaluru',
    destinationCity: 'Hyderabad',
    departureTime: '21:00',
    arrivalTime: '06:30',
    duration: '9h 30m',
    routeVia: 'Via NH 44',
    priceStart: 1049,
    seatsLeft: 8,
    isLiveTracking: true,
    hasAC: true,
    hasSleeper: true,
    hasCharging: true,
    hasWifi: true,
    hasBlanket: true,
    hasWater: false,
    cancellationPolicy: '0:2:100:0;2:8:40:0;8:24:20:0;24:-1:10:0',
    partialCancellationAllowed: true,
    boardingPoints: SAMPLE_BOARDING_POINTS,
    droppingPoints: SAMPLE_DROPPING_POINTS,
    seats: DEFAULT_SEATS.map(s => ({ ...s, price: Math.round(s.price * 1.15) }))
  },
  {
    id: 'bus-vrl-3',
    operator: 'VRL Travels',
    operatorLogoText: 'VRL',
    operatorLogoBg: 'bg-[#e5eeff]',
    operatorLogoColor: 'text-[#bb0112]',
    busType: 'I-Shift AC Semi-Sleeper (2+2)',
    rating: 4.6,
    reviewsCount: '2.1k',
    sourceCity: 'Bengaluru',
    destinationCity: 'Hyderabad',
    departureTime: '21:00',
    arrivalTime: '06:30',
    duration: '9h 30m',
    routeVia: 'Via NH 44',
    priceStart: 749,
    seatsLeft: 21,
    isLiveTracking: true,
    hasAC: true,
    hasSleeper: false,
    hasCharging: true,
    hasWifi: false,
    hasBlanket: true,
    hasWater: false,
    cancellationPolicy: '0:6:100:0;6:12:50:0;12:24:25:0;24:-1:10:0',
    partialCancellationAllowed: false,
    boardingPoints: SAMPLE_BOARDING_POINTS,
    droppingPoints: SAMPLE_DROPPING_POINTS,
    seats: DEFAULT_SEATS.map(s => ({ ...s, price: Math.round(s.price * 0.85) }))
  },
  {
    id: 'bus-zingbus-4',
    operator: 'Zingbus Plus',
    operatorLogoText: 'ZB',
    operatorLogoBg: 'bg-[#00301e]',
    operatorLogoColor: 'text-[#6ffbbe]',
    busType: 'Volvo 9600 Multi-Axle Diamond Sleeper',
    rating: 4.9,
    reviewsCount: '850',
    sourceCity: 'Bengaluru',
    destinationCity: 'Hyderabad',
    departureTime: '22:15',
    arrivalTime: '07:45',
    duration: '9h 30m',
    routeVia: 'Via NH 44',
    priceStart: 999,
    seatsLeft: 11,
    isLiveTracking: true,
    hasAC: true,
    hasSleeper: true,
    hasCharging: true,
    hasWifi: true,
    hasBlanket: true,
    hasWater: false,
    cancellationPolicy: '0:4:100:0;4:12:50:0;12:24:15:0;24:-1:10:0',
    partialCancellationAllowed: true,
    boardingPoints: SAMPLE_BOARDING_POINTS,
    droppingPoints: SAMPLE_DROPPING_POINTS,
    seats: DEFAULT_SEATS.map(s => ({ ...s, price: Math.round(s.price * 1.1) }))
  }
];

export const DEFAULT_CONFIRMED_BOOKING: BookingDetails = {
  tin: 'GB-2024-BLR-89241',
  pnr: 'ORG-HYD-55102',
  bus: SAMPLE_BUS_TRIPS[0],
  selectedSeats: [
    { id: 'L3', number: 'L3', deck: 'lower', type: 'sleeper', price: 899 },
    { id: 'U4', number: 'U4', deck: 'upper', type: 'sleeper', price: 949 }
  ],
  boardingPoint: SAMPLE_BOARDING_POINTS[1], // Majestic
  droppingPoint: SAMPLE_DROPPING_POINTS[2], // MGBS
  passengers: [
    {
      id: 'p-1',
      seatId: 'L3',
      seatDeckText: 'L3 (Lower)',
      name: 'Vikram Aditya Malhotra',
      age: 29,
      gender: 'Male',
      isPrimary: true
    },
    {
      id: 'p-2',
      seatId: 'U4',
      seatDeckText: 'U4 (Upper)',
      name: 'Pooja Malhotra',
      age: 27,
      gender: 'Female'
    }
  ],
  contactMobile: '9876543210',
  contactEmail: 'vikram.m@gmail.com',
  whatsappAlerts: true,
  journeyDate: 'Friday, 25 Oct 2024',
  bookingTimestamp: '24 Oct 2024, 18:42 IST',
  baseFare: 1550,
  gstAmount: 150,
  discountAmount: 0,
  totalPaid: 1700,
  paymentMethod: 'Google Pay UPI (Txn: UPI/429810294711)',
  status: 'CONFIRMED',
  txnId: 'UPI/429810294711',
  cancellationPolicy: '0:4:100:0;4:12:50:0;12:24:20:0;24:-1:10:0',
  partialCancellationAllowed: true
};


