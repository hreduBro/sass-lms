import { TimezoneOption } from './organization.model';

export type LmsStatus = 'Active' | 'Under Processing' | 'Drafted' | 'Deactivated' | 'Suspended' | 'In-Progress';
export type LmsType = 'Public' | 'Private';

export interface LmsLogo {
  fileName?: string;
  url?: string;
  mime?: string;
  sizeBytes?: number;
}

export interface LmsAdminInfo {
  name: string;
  email: string;
  contactNumber: string;
  role: string; // 'LMS Admin'
  invitationStatus?: 'pending' | 'sent' | 'accepted';
}

export interface LmsBasicInfo {
  lmsName: string;
  programmeDepartment: string;
  summary?: string;
  goal?: string;
  lmsType: LmsType;
  urlDomain: string;
  timezone: string; // stored IANA e.g. 'Asia/Dhaka'
  logo?: LmsLogo;
}

export interface LmsResourceAllocation {
  databaseSizeGb: number | null;
  fileStorageGb: number | null;
  usageAlertThresholdPct: number | null;
}

export interface LmsInstance {
  id: string; // system-generated unique ID e.g. 'LMS-7419'
  organizationId: string; // tenant ID e.g. 'tenant-brac'
  organizationNumericId?: string; // 4-digit org numeric ID e.g. '1972'
  organizationName: string;
  status: LmsStatus;
  isDraft: boolean;
  basicInfo: LmsBasicInfo;
  resources: LmsResourceAllocation;
  admins: LmsAdminInfo[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  provisioningProgress?: number; // 0-100% for under-processing status display
}

export interface LmsGridFilters {
  status: LmsStatus[];
  programmeDepartment: string[];
  lmsAdmin: string;
  createdDateFrom: string | null;
  createdDateTo: string | null;
}

export interface LmsDetailsPermissions {
  canEditLmsName: boolean;
  canEditProgrammeDepartment: boolean;
  canEditDomain: boolean;
  canEditLmsType: boolean;
  canManageResources: boolean;
}

export interface LmsDraft {
  id: string;
  organizationId: string;
  organizationName: string;
  status: LmsStatus;
  isDraft: boolean;
  lastCompletedStep: 'basic-info' | 'resources' | 'admin' | 'preview';
  basicInfo: Partial<LmsBasicInfo>;
  resources: Partial<LmsResourceAllocation>;
  admins: LmsAdminInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationCapacitySnapshot {
  dbTotalGb: number;      // YYYY — org's own allocated total
  dbUsedGb: number;       // XXX — summed from this org's existing LMS
  dbAvailableGb: number;  // dbTotalGb - dbUsedGb
  fileTotalGb: number;    // YYYY — org's own allocated total
  fileUsedGb: number;     // XXX — summed from this org's existing LMS
  fileAvailableGb: number;// fileTotalGb - fileUsedGb
}
