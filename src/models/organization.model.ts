export type OrganizationStatus = 'Active' | 'In-Progress' | 'Suspended';
export type DataSharingMode = 'Yes – Shared' | 'No – Segregated' | 'Custom';

export interface TimezoneOption {
  display: string;
  stored: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { display: 'UTC (UTC+00:00)', stored: 'UTC' },
  { display: 'London (UTC+00:00)', stored: 'Europe/London' },
  { display: 'Dublin (UTC+00:00)', stored: 'Europe/Dublin' },
  { display: 'Lisbon (UTC+00:00)', stored: 'Europe/Lisbon' },
  { display: 'Paris (UTC+01:00)', stored: 'Europe/Paris' },
  { display: 'Berlin (UTC+01:00)', stored: 'Europe/Berlin' },
  { display: 'Amsterdam (UTC+01:00)', stored: 'Europe/Amsterdam' },
  { display: 'Brussels (UTC+01:00)', stored: 'Europe/Brussels' },
  { display: 'Rome (UTC+01:00)', stored: 'Europe/Rome' },
  { display: 'Madrid (UTC+01:00)', stored: 'Europe/Madrid' },
  { display: 'Athens (UTC+02:00)', stored: 'Europe/Athens' },
  { display: 'Cairo (UTC+02:00)', stored: 'Africa/Cairo' },
  { display: 'Helsinki (UTC+02:00)', stored: 'Europe/Helsinki' },
  { display: 'Istanbul (UTC+03:00)', stored: 'Europe/Istanbul' },
  { display: 'Moscow (UTC+03:00)', stored: 'Europe/Moscow' },
  { display: 'Riyadh (UTC+03:00)', stored: 'Asia/Riyadh' },
  { display: 'Dubai (UTC+04:00)', stored: 'Asia/Dubai' },
  { display: 'Abu Dhabi (UTC+04:00)', stored: 'Asia/Dubai' },
  { display: 'Karachi (UTC+05:00)', stored: 'Asia/Karachi' },
  { display: 'Dhaka (UTC+06:00)', stored: 'Asia/Dhaka' },
  { display: 'Almaty (UTC+05:00)', stored: 'Asia/Almaty' },
  { display: 'Kolkata (UTC+05:30)', stored: 'Asia/Kolkata' },
  { display: 'Kathmandu (UTC+05:45)', stored: 'Asia/Kathmandu' },
  { display: 'Yangon (UTC+06:30)', stored: 'Asia/Yangon' },
  { display: 'Bangkok (UTC+07:00)', stored: 'Asia/Bangkok' },
  { display: 'Jakarta (UTC+07:00)', stored: 'Asia/Jakarta' },
  { display: 'Singapore (UTC+08:00)', stored: 'Asia/Singapore' },
  { display: 'Kuala Lumpur (UTC+08:00)', stored: 'Asia/Kuala_Lumpur' },
  { display: 'Hong Kong (UTC+08:00)', stored: 'Asia/Hong_Kong' },
  { display: 'Beijing (UTC+08:00)', stored: 'Asia/Shanghai' },
  { display: 'Manila (UTC+08:00)', stored: 'Asia/Manila' },
  { display: 'Tokyo (UTC+09:00)', stored: 'Asia/Tokyo' },
  { display: 'Seoul (UTC+09:00)', stored: 'Asia/Seoul' },
  { display: 'Sydney (UTC+10:00)', stored: 'Australia/Sydney' },
  { display: 'Melbourne (UTC+10:00)', stored: 'Australia/Melbourne' },
  { display: 'Auckland (UTC+12:00)', stored: 'Pacific/Auckland' },
  { display: 'New York (UTC-05:00)', stored: 'America/New_York' },
  { display: 'Washington, D.C. (UTC-05:00)', stored: 'America/New_York' },
  { display: 'Toronto (UTC-05:00)', stored: 'America/Toronto' },
  { display: 'Chicago (UTC-06:00)', stored: 'America/Chicago' },
  { display: 'Houston (UTC-06:00)', stored: 'America/Chicago' },
  { display: 'Denver (UTC-07:00)', stored: 'America/Denver' },
  { display: 'Los Angeles (UTC-08:00)', stored: 'America/Los_Angeles' },
  { display: 'San Francisco (UTC-08:00)', stored: 'America/Los_Angeles' },
  { display: 'Mexico City (UTC-06:00)', stored: 'America/Mexico_City' },
  { display: 'São Paulo (UTC-03:00)', stored: 'America/Sao_Paulo' },
  { display: 'Buenos Aires (UTC-03:00)', stored: 'America/Argentina/Buenos_Aires' },
  { display: 'Johannesburg (UTC+02:00)', stored: 'Africa/Johannesburg' },
  { display: 'Nairobi (UTC+03:00)', stored: 'Africa/Nairobi' },
  { display: 'Lagos (UTC+01:00)', stored: 'Africa/Lagos' }
];

export const DIVISION_DISTRICTS_MAP: Record<string, string[]> = {
  'Barishal': ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  'Chattogram': ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  'Dhaka': ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  'Khulna': ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  'Mymensingh': ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  'Rajshahi': ['Bogura', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
  'Rangpur': ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  'Sylhet': ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet']
};

export const DIVISIONS_LIST: string[] = Object.keys(DIVISION_DISTRICTS_MAP);

export interface OrganizationLogo {
  fileName?: string;
  url?: string;
  mime?: string;
  sizeBytes?: number;
}

export interface OrganizationAddress {
  line1: string;
  line2?: string;
  division: string;
  district: string;
  postalCode: string;
}

export interface OrganizationAdminInfo {
  adminName: string;
  contactNumber: string;
  contactEmail: string;
}

export interface CustomDataSharingBatch {
  id: string;
  name: string;
  lmsInstanceIds: string[];
}

export interface OrganizationResourceAllocation {
  databaseSizeGb: number | null;
  fileStorageGb: number | null;
  usageAlertThresholdPct: number | null;
  dataSharingMode: DataSharingMode;
  customBatches?: CustomDataSharingBatch[];
}

export interface OrganizationBasicInfo {
  organizationName: string;
  organizationId: string; // 4-digit numeric unique read-only
  websiteUrl?: string;
  tagline?: string;
  description?: string;
  organizationEmail?: string;
  timezone?: string; // Stored IANA value e.g. 'Asia/Dhaka'
  logo?: OrganizationLogo;
  address: OrganizationAddress;
  admin: OrganizationAdminInfo;
}

export interface OrganizationDraft {
  id: string; // 4-digit
  status: OrganizationStatus;
  isDraft: boolean;
  lastCompletedStep: 'basic-info' | 'resources' | 'admin' | 'preview';
  basicInfo: OrganizationBasicInfo;
  resources: OrganizationResourceAllocation;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCapacity {
  dbTotalGb: number;      // YYYY hard-coded total infra capacity
  dbUsedGb: number;       // XXX sum from active organizations
  dbAvailableGb: number;  // YYYY - XXX
  fileTotalGb: number;    // YYYY hard-coded total infra capacity
  fileUsedGb: number;     // XXX sum from active organizations
  fileAvailableGb: number; // YYYY - XXX
}
