export type VenueType = 'physical';
export type VenueStatus = 'active' | 'inactive';
export type RoomStatus = 'active' | 'inactive';
export type SeatingLayout = 'theatre' | 'classroom' | 'uShape' | 'boardroom' | 'banquet' | 'cluster';

export interface VenueAddress {
  line1: string;
  city: string;
  postcode: string;
  country: string;
  formatted?: string;
}

export interface VenueGeo {
  lat: number | null;
  lng: number | null;
  mapUrl?: string;
}

export interface VenueFacilities {
  internet: boolean;
  parking: boolean;
  accessibility: boolean;
  cafeteria?: boolean;
  securityPersonnel?: boolean;
  powerBackup?: boolean;
  otherTags: string[];
}

export interface RoomEquipment {
  projector: boolean;
  soundSystem: boolean;
  microphone: boolean;
  displayScreen: boolean;
  whiteboard?: boolean;
  videoConferencing?: boolean;
  airConditioning?: boolean;
  otherTags: string[];
}

export interface Room {
  roomId: string;
  venueId: string;
  venueName?: string;
  name: string;
  capacity: number; // Max trainees
  equipment: RoomEquipment;
  seatingLayouts: SeatingLayout[];
  status: RoomStatus;
  usedInClassesCount?: number;
  floorLevel?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Venue {
  venueId: string;
  code: string;
  name: string;
  type: VenueType; // BRD §4.11: Physical
  address: VenueAddress;
  geo?: VenueGeo;
  facilities: VenueFacilities;
  organizationId: string;
  organizationName?: string;
  lmsId: string;
  lmsName?: string;
  status: VenueStatus;
  rooms: Room[];
  usedInClassesCount?: number;
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
  };
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VenuePermissions {
  canViewFeature: boolean;
  canCreateVenue: boolean;
  canEditVenue: boolean;
  canDeactivateVenue: boolean;
  canManageRooms: boolean;
  canTagVenueInDelivery: boolean;
  canManageDashboardStudio: boolean;
}

export const DEFAULT_VENUE_PERMISSIONS: VenuePermissions = {
  canViewFeature: true,
  canCreateVenue: true,
  canEditVenue: true,
  canDeactivateVenue: true,
  canManageRooms: true,
  canTagVenueInDelivery: true,
  canManageDashboardStudio: true
};

export const INITIAL_VENUES: Venue[] = [
  {
    venueId: 'venue-001',
    code: 'DHK-CENTRAL',
    name: 'Dhaka Executive Learning Center',
    type: 'physical',
    address: {
      line1: 'Plot 75, Bir Uttam Mir Shawkat Sarak, Gulshan-1',
      city: 'Dhaka',
      postcode: '1212',
      country: 'Bangladesh',
      formatted: 'Plot 75, Gulshan-1, Dhaka 1212'
    },
    geo: {
      lat: 23.777176,
      lng: 90.417381,
      mapUrl: 'https://maps.google.com/?q=23.777176,90.417381'
    },
    facilities: {
      internet: true,
      parking: true,
      accessibility: true,
      cafeteria: true,
      powerBackup: true,
      securityPersonnel: true,
      otherTags: ['High-speed Fiber WiFi', 'EV Charging Station', 'Wheelchair Ramp', 'Cafeteria']
    },
    organizationId: 'org-01',
    organizationName: 'Grameenphone Corporate Academy',
    lmsId: 'lms-01',
    lmsName: 'Enterprise Leadership Portal',
    status: 'active',
    usedInClassesCount: 14,
    contactPerson: {
      name: 'Farhan Kabir',
      email: 'farhan.kabir@grameenphone.com',
      phone: '+880 1711-223344'
    },
    createdBy: 'LMS Academic Operations',
    createdAt: '10/01/2026 09:30:00',
    updatedAt: '12/03/2026 14:15:00',
    rooms: [
      {
        roomId: 'room-101',
        venueId: 'venue-001',
        venueName: 'Dhaka Executive Learning Center',
        name: 'Hall A (Grand Auditorium)',
        capacity: 65,
        equipment: {
          projector: true,
          soundSystem: true,
          microphone: true,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: true,
          airConditioning: true,
          otherTags: ['Dual 4K Projectors', 'Wireless Lavalier Mics', 'Polycom Studio']
        },
        seatingLayouts: ['theatre', 'classroom', 'banquet'],
        status: 'active',
        usedInClassesCount: 8,
        floorLevel: '1st Floor - North Wing',
        createdAt: '10/01/2026 10:00:00'
      },
      {
        roomId: 'room-102',
        venueId: 'venue-001',
        venueName: 'Dhaka Executive Learning Center',
        name: 'Room 201 (Collaborative Studio)',
        capacity: 32,
        equipment: {
          projector: false,
          soundSystem: true,
          microphone: true,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: true,
          airConditioning: true,
          otherTags: ['85" Interactive Touch Display', 'Ceiling Array Mic']
        },
        seatingLayouts: ['classroom', 'uShape', 'cluster'],
        status: 'active',
        usedInClassesCount: 4,
        floorLevel: '2nd Floor - East Wing',
        createdAt: '10/01/2026 10:30:00'
      },
      {
        roomId: 'room-103',
        venueId: 'venue-001',
        venueName: 'Dhaka Executive Learning Center',
        name: 'Room 202 (Executive Boardroom)',
        capacity: 20,
        equipment: {
          projector: false,
          soundSystem: true,
          microphone: true,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: true,
          airConditioning: true,
          otherTags: ['Executive Ergonomic Chairs', 'Video Soundbar']
        },
        seatingLayouts: ['boardroom', 'uShape'],
        status: 'active',
        usedInClassesCount: 2,
        floorLevel: '2nd Floor - South Wing',
        createdAt: '10/01/2026 11:00:00'
      }
    ]
  },
  {
    venueId: 'venue-002',
    code: 'CTG-PORT',
    name: 'Chittagong Coastal Training Institute',
    type: 'physical',
    address: {
      line1: 'Agrabad Commercial Area, Sheikh Mujib Road',
      city: 'Chittagong',
      postcode: '4100',
      country: 'Bangladesh',
      formatted: 'Agrabad Commercial Area, Chittagong 4100'
    },
    geo: {
      lat: 22.327663,
      lng: 91.812423,
      mapUrl: 'https://maps.google.com/?q=22.327663,91.812423'
    },
    facilities: {
      internet: true,
      parking: true,
      accessibility: true,
      cafeteria: true,
      powerBackup: true,
      securityPersonnel: true,
      otherTags: ['Dedicated Parking', 'High-Speed Broadband', 'Catering Lounge']
    },
    organizationId: 'org-01',
    organizationName: 'Grameenphone Corporate Academy',
    lmsId: 'lms-01',
    lmsName: 'Enterprise Leadership Portal',
    status: 'active',
    usedInClassesCount: 9,
    contactPerson: {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@grameenphone.com',
      phone: '+880 1819-334455'
    },
    createdBy: 'Regional LMS Admin',
    createdAt: '15/01/2026 11:00:00',
    updatedAt: '05/03/2026 16:40:00',
    rooms: [
      {
        roomId: 'room-201',
        venueId: 'venue-002',
        venueName: 'Chittagong Coastal Training Institute',
        name: 'Bay of Bengal Lecture Hall',
        capacity: 45,
        equipment: {
          projector: true,
          soundSystem: true,
          microphone: true,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: true,
          airConditioning: true,
          otherTags: ['Laser Projector', 'Boundary Microphones']
        },
        seatingLayouts: ['theatre', 'classroom', 'uShape'],
        status: 'active',
        usedInClassesCount: 6,
        floorLevel: 'Ground Floor',
        createdAt: '15/01/2026 11:30:00'
      },
      {
        roomId: 'room-202',
        venueId: 'venue-002',
        venueName: 'Chittagong Coastal Training Institute',
        name: 'Karnaphuli Skills Lab',
        capacity: 25,
        equipment: {
          projector: false,
          soundSystem: false,
          microphone: false,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: false,
          airConditioning: true,
          otherTags: ['Computer Terminals', 'Smart Whiteboard']
        },
        seatingLayouts: ['classroom', 'cluster'],
        status: 'active',
        usedInClassesCount: 3,
        floorLevel: '1st Floor',
        createdAt: '15/01/2026 12:00:00'
      }
    ]
  },
  {
    venueId: 'venue-003',
    code: 'SYL-HUB',
    name: 'Sylhet Highlands Innovation & Learning Hub',
    type: 'physical',
    address: {
      line1: 'Subidbazar VIP Road, Airport Junction',
      city: 'Sylhet',
      postcode: '3100',
      country: 'Bangladesh',
      formatted: 'Subidbazar VIP Road, Sylhet 3100'
    },
    geo: {
      lat: 24.89493,
      lng: 91.868706,
      mapUrl: 'https://maps.google.com/?q=24.894930,91.868706'
    },
    facilities: {
      internet: true,
      parking: false,
      accessibility: true,
      cafeteria: false,
      powerBackup: true,
      securityPersonnel: true,
      otherTags: ['Elevator Access', 'Quiet Zone']
    },
    organizationId: 'org-02',
    organizationName: 'BRAC Social Development Network',
    lmsId: 'lms-02',
    lmsName: 'Field Capacity & Social Impact LMS',
    status: 'active',
    usedInClassesCount: 5,
    contactPerson: {
      name: 'Tariqul Islam',
      email: 'tariqul.i@brac.net',
      phone: '+880 1722-667788'
    },
    createdBy: 'Field Ops Lead',
    createdAt: '22/01/2026 14:00:00',
    updatedAt: '28/02/2026 10:20:00',
    rooms: [
      {
        roomId: 'room-301',
        venueId: 'venue-003',
        venueName: 'Sylhet Highlands Innovation & Learning Hub',
        name: 'Surma Seminar Hall',
        capacity: 35,
        equipment: {
          projector: true,
          soundSystem: true,
          microphone: true,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: true,
          airConditioning: true,
          otherTags: ['Audio Visual Pod', 'Wireless Presentation']
        },
        seatingLayouts: ['theatre', 'classroom'],
        status: 'active',
        usedInClassesCount: 5,
        floorLevel: '3rd Floor',
        createdAt: '22/01/2026 14:30:00'
      }
    ]
  },
  {
    venueId: 'venue-004',
    code: 'RAJ-TECH',
    name: 'Rajshahi Tech & Agritech Academy',
    type: 'physical',
    address: {
      line1: 'Biman Crossing, Nawdapara',
      city: 'Rajshahi',
      postcode: '6203',
      country: 'Bangladesh',
      formatted: 'Biman Crossing, Nawdapara, Rajshahi 6203'
    },
    geo: {
      lat: 24.3745,
      lng: 88.6042,
      mapUrl: 'https://maps.google.com/?q=24.3745,88.6042'
    },
    facilities: {
      internet: true,
      parking: true,
      accessibility: false,
      cafeteria: true,
      powerBackup: true,
      securityPersonnel: true,
      otherTags: ['Large Garden Area', 'Solar Powered']
    },
    organizationId: 'org-02',
    organizationName: 'BRAC Social Development Network',
    lmsId: 'lms-02',
    lmsName: 'Field Capacity & Social Impact LMS',
    status: 'inactive', // Deactivated venue example
    usedInClassesCount: 3,
    contactPerson: {
      name: 'Sabrina Mostafa',
      email: 'sabrina.m@brac.net',
      phone: '+880 1733-445566'
    },
    createdBy: 'System Operations',
    createdAt: '01/02/2026 08:00:00',
    updatedAt: '01/03/2026 09:00:00',
    rooms: [
      {
        roomId: 'room-401',
        venueId: 'venue-004',
        venueName: 'Rajshahi Tech & Agritech Academy',
        name: 'Padma Practical Workshop',
        capacity: 28,
        equipment: {
          projector: true,
          soundSystem: false,
          microphone: false,
          displayScreen: true,
          whiteboard: true,
          videoConferencing: false,
          airConditioning: true,
          otherTags: ['Demonstration Benches']
        },
        seatingLayouts: ['classroom', 'cluster'],
        status: 'inactive',
        usedInClassesCount: 3,
        floorLevel: 'Annex Building',
        createdAt: '01/02/2026 08:30:00'
      }
    ]
  }
];

export function calculateVenueTotalCapacity(venue: Venue): number {
  if (!venue.rooms || venue.rooms.length === 0) return 0;
  return venue.rooms
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + (r.capacity || 0), 0);
}

export function getActiveRoomsCount(venue: Venue): number {
  if (!venue.rooms) return 0;
  return venue.rooms.filter(r => r.status === 'active').length;
}
