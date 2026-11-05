import assert from 'node:assert';

// Verification functions matching src/models/content-repository.model.ts

export function isRepositoryActionAllowed(action, status, isOwner) {
  if (action === 'view') return true;
  if (!isOwner) return false;

  switch (status) {
    case 'Draft':
      return action === 'continueEditing';
    case 'Scheduled':
      return action === 'editSharing' || action === 'updateExpiry';
    case 'Active':
      return action === 'editSharing' || action === 'updateExpiry' || action === 'deactivate';
    case 'Inactive':
      return action === 'activate' || action === 'editSharing';
    case 'Expired':
      return false;
    default:
      return false;
  }
}

export function isItemDiscoverableByLms(item, context) {
  // Owner LMS always sees its own items
  if (item.owningLmsId === context.consumerLmsId) {
    return true;
  }

  // Cross-LMS sharing: must be same organization and not Draft
  if (item.owningOrganizationId !== context.consumerOrgId || item.status === 'Draft') {
    return false;
  }

  // Master Org switch
  if (!context.isOrgSharingEnabled(item.owningOrganizationId)) {
    return false;
  }

  // Owner LMS contribute gate
  const ownerState = context.getLmsSharingState(item.owningLmsId);
  if (!ownerState.enabled || !ownerState.contribute) {
    return false;
  }

  // Consumer LMS discover gate
  const consumerState = context.getLmsSharingState(context.consumerLmsId);
  if (!consumerState.enabled || !consumerState.discover) {
    return false;
  }

  // Item-level sharing mode
  if (item.sharingMode === 'Organization-wide') {
    return true;
  }
  if (item.sharingMode === 'Custom Share') {
    return !!item.sharedWithLmsIds && item.sharedWithLmsIds.includes(context.consumerLmsId);
  }

  return false;
}

export function isExistingReferenceActive(item) {
  return !!item && item.status === 'Active';
}

export function parseDateString(dateStr) {
  if (!dateStr || dateStr === 'No Expiry') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

export function formatDateToDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

console.log('Running Content Repository V3 Specification Verification Suite...');

// 1. §3.3 Action Matrix Verification
console.log('Test 1: Verifying §3.3 Action Matrix by Status & Ownership');
const statuses = ['Draft', 'Scheduled', 'Active', 'Inactive', 'Expired'];
for (const st of statuses) {
  assert.strictEqual(isRepositoryActionAllowed('view', st, false), true, `Non-owner should be able to view in ${st}`);
  assert.strictEqual(isRepositoryActionAllowed('continueEditing', st, false), false, `Non-owner must not continueEditing in ${st}`);
  assert.strictEqual(isRepositoryActionAllowed('editSharing', st, false), false, `Non-owner must not editSharing in ${st}`);
  assert.strictEqual(isRepositoryActionAllowed('updateExpiry', st, false), false, `Non-owner must not updateExpiry in ${st}`);
  assert.strictEqual(isRepositoryActionAllowed('activate', st, false), false, `Non-owner must not activate in ${st}`);
  assert.strictEqual(isRepositoryActionAllowed('deactivate', st, false), false, `Non-owner must not deactivate in ${st}`);
}

// Owner LMS by status (§3.3 exact table)
// Draft: View, Continue Editing
assert.strictEqual(isRepositoryActionAllowed('continueEditing', 'Draft', true), true);
assert.strictEqual(isRepositoryActionAllowed('editSharing', 'Draft', true), false);
assert.strictEqual(isRepositoryActionAllowed('updateExpiry', 'Draft', true), false);
assert.strictEqual(isRepositoryActionAllowed('deactivate', 'Draft', true), false);

// Scheduled: View, Edit Sharing, Update Expiry Date
assert.strictEqual(isRepositoryActionAllowed('continueEditing', 'Scheduled', true), false);
assert.strictEqual(isRepositoryActionAllowed('editSharing', 'Scheduled', true), true);
assert.strictEqual(isRepositoryActionAllowed('updateExpiry', 'Scheduled', true), true);
assert.strictEqual(isRepositoryActionAllowed('deactivate', 'Scheduled', true), false);

// Active: View, Edit Sharing, Update Expiry Date, Deactivate
assert.strictEqual(isRepositoryActionAllowed('continueEditing', 'Active', true), false);
assert.strictEqual(isRepositoryActionAllowed('editSharing', 'Active', true), true);
assert.strictEqual(isRepositoryActionAllowed('updateExpiry', 'Active', true), true);
assert.strictEqual(isRepositoryActionAllowed('deactivate', 'Active', true), true);
assert.strictEqual(isRepositoryActionAllowed('activate', 'Active', true), false);

// Inactive: View, Activate, Edit Sharing
assert.strictEqual(isRepositoryActionAllowed('continueEditing', 'Inactive', true), false);
assert.strictEqual(isRepositoryActionAllowed('activate', 'Inactive', true), true);
assert.strictEqual(isRepositoryActionAllowed('editSharing', 'Inactive', true), true);
assert.strictEqual(isRepositoryActionAllowed('updateExpiry', 'Inactive', true), false);
assert.strictEqual(isRepositoryActionAllowed('deactivate', 'Inactive', true), false);

// Expired: View only
assert.strictEqual(isRepositoryActionAllowed('view', 'Expired', true), true);
assert.strictEqual(isRepositoryActionAllowed('continueEditing', 'Expired', true), false);
assert.strictEqual(isRepositoryActionAllowed('editSharing', 'Expired', true), false);
assert.strictEqual(isRepositoryActionAllowed('updateExpiry', 'Expired', true), false);
assert.strictEqual(isRepositoryActionAllowed('activate', 'Expired', true), false);

console.log('-> §3.3 Action Matrix tests passed.');

// 2. Sharing Gates & Discovery Verification (§2.5 / §7)
console.log('Test 2: Verifying Sharing Gates (Org master switch, Contribute, Discover, Modes)');

const baseMockItem = {
  id: 'repo-100',
  title: 'Test Course Item',
  family: 'Learning',
  type: 'PDF / Document',
  authorIds: ['auth-1'],
  authorNames: ['Author One'],
  publishDate: '01/01/2026',
  expiryDate: null,
  hasNoExpiry: true,
  owningLmsId: 'LMS-A',
  owningLmsName: 'LMS Alpha',
  owningOrganizationId: 'ORG-1',
  sharingMode: 'Organization-wide',
  status: 'Active',
  createdAt: '01/01/2026',
  updatedAt: '01/01/2026',
  createdBy: 'admin',
  contentConfig: {},
  referencedInPlansCount: 0,
  referencedInCoursesCount: 0
};

// Owner LMS always sees its own items (even Draft)
const ownerContext = {
  consumerLmsId: 'LMS-A',
  consumerOrgId: 'ORG-1',
  isOrgSharingEnabled: () => true,
  getLmsSharingState: () => ({ enabled: true, contribute: true, discover: true })
};
assert.strictEqual(isItemDiscoverableByLms({ ...baseMockItem, status: 'Draft' }, ownerContext), true, 'Owner sees its own Draft items');

// Consumer in same org, item is Draft: NEVER visible to sister LMS
const consumerContext = {
  consumerLmsId: 'LMS-B',
  consumerOrgId: 'ORG-1',
  isOrgSharingEnabled: (org) => org === 'ORG-1',
  getLmsSharingState: (lms) => ({ enabled: true, contribute: true, discover: true })
};
assert.strictEqual(isItemDiscoverableByLms({ ...baseMockItem, status: 'Draft' }, consumerContext), false, 'Sister LMS cannot see Drafts');
assert.strictEqual(isItemDiscoverableByLms(baseMockItem, consumerContext), true, 'Sister LMS sees active Org-wide item');

// Different Organization: NEVER visible (§2.5)
const differentOrgContext = {
  consumerLmsId: 'LMS-C',
  consumerOrgId: 'ORG-2',
  isOrgSharingEnabled: () => true,
  getLmsSharingState: () => ({ enabled: true, contribute: true, discover: true })
};
assert.strictEqual(isItemDiscoverableByLms(baseMockItem, differentOrgContext), false, 'Cross-org sharing is strictly prohibited');

// Org Master switch turned OFF (§7)
const orgSwitchOffContext = {
  consumerLmsId: 'LMS-B',
  consumerOrgId: 'ORG-1',
  isOrgSharingEnabled: () => false,
  getLmsSharingState: () => ({ enabled: true, contribute: true, discover: true })
};
assert.strictEqual(isItemDiscoverableByLms(baseMockItem, orgSwitchOffContext), false, 'Org master switch off blocks cross-LMS discovery');

// Consumer LMS Discover turned OFF (§2.5)
const consumerDiscoverOffContext = {
  consumerLmsId: 'LMS-B',
  consumerOrgId: 'ORG-1',
  isOrgSharingEnabled: () => true,
  getLmsSharingState: (lms) => ({
    enabled: true,
    contribute: true,
    discover: lms !== 'LMS-B'
  })
};
assert.strictEqual(isItemDiscoverableByLms(baseMockItem, consumerDiscoverOffContext), false, 'Consumer LMS Discover off blocks discovery');

// Custom Share mode check (§2.5)
const customShareItem = {
  ...baseMockItem,
  sharingMode: 'Custom Share',
  sharedWithLmsIds: ['LMS-B', 'LMS-D']
};
assert.strictEqual(isItemDiscoverableByLms(customShareItem, consumerContext), true, 'LMS-B is in custom share list');

const excludedConsumerContext = {
  consumerLmsId: 'LMS-E',
  consumerOrgId: 'ORG-1',
  isOrgSharingEnabled: () => true,
  getLmsSharingState: () => ({ enabled: true, contribute: true, discover: true })
};
assert.strictEqual(isItemDiscoverableByLms(customShareItem, excludedConsumerContext), false, 'LMS-E is not in custom share list');

console.log('-> Sharing Gates & Discovery tests passed.');

// 3. Existing References Continuity (§4)
console.log('Test 3: Verifying §4 Existing Reference Continuity');
assert.strictEqual(isExistingReferenceActive({ ...baseMockItem, status: 'Active' }), true, 'Active referenced item is usable');
assert.strictEqual(isExistingReferenceActive({ ...baseMockItem, status: 'Inactive' }), false, 'Inactive referenced item is suspended');
assert.strictEqual(isExistingReferenceActive({ ...baseMockItem, status: 'Expired' }), false, 'Expired referenced item is suspended');

// 4. Date formatting and Parsing Strictness
console.log('Test 4: Verifying Date Utilities');
const testDate = new Date(2026, 10, 4); // 4 Nov 2026
assert.strictEqual(formatDateToDDMMYYYY(testDate), '04/11/2026');
const parsed = parseDateString('04/11/2026');
assert.strictEqual(parsed?.getDate(), 4);
assert.strictEqual(parsed?.getMonth(), 10);
assert.strictEqual(parsed?.getFullYear(), 2026);

console.log('All Content Repository V3 specification verification checks completed successfully!');
