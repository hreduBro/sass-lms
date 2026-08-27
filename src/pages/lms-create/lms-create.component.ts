import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { TIMEZONE_OPTIONS, TimezoneOption } from '../../models/organization.model';
import { LmsBasicInfo, LmsResourceAllocation, LmsAdminInfo, LmsDraft, LmsType } from '../../models/lms-instance.model';

export type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-lms-create',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lms-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LmsCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Stepper State (Identical to Organization Create)
  currentStep = signal<WizardStep>(1);
  completedSteps = signal<Set<number>>(new Set<number>());

  // Organization Scope (Read-only, inherited from active tenant §0, §3.1)
  parentOrg = computed(() => this.lms.activeTenant());
  capacity = computed(() => this.lms.activeOrgCapacitySnapshot());

  // Existing LMS instances under this org (for uniqueness validation)
  existingOrgLms = computed(() => this.lms.activeOrgLmsInstances());

  // Step 1: Basic Information State
  lmsName = signal<string>('');
  programmeDepartment = signal<string>('');
  customDepartment = signal<string>('');
  isAddingNewDept = signal<boolean>(false);
  summary = signal<string>('');
  goal = signal<string>('');
  lmsType = signal<LmsType>('Private');
  urlDomain = signal<string>('');
  isUrlManuallyEdited = signal<boolean>(false);
  selectedTimezone = signal<string>('Asia/Dhaka');
  logoUrl = signal<string>('');
  logoFileName = signal<string>('');
  logoSizeKb = signal<number>(0);

  // Step 2: Resource Allocation State
  databaseSizeGb = signal<number | null>(null);
  fileStorageGb = signal<number | null>(null);
  usageAlertThresholdPct = signal<number | null>(80);

  // Step 3: Admin Assignment State
  adminName = signal<string>('');
  adminEmail = signal<string>('');
  adminContactNumber = signal<string>('');
  adminList = signal<LmsAdminInfo[]>([]);
  adminEmailSent = signal<boolean>(false);

  // Draft tracking
  draftId = signal<string | null>(null);

  // Validation errors map & Alert banner
  errors = signal<Record<string, string>>({});
  formErrorAlert = signal<string | null>(null);

  // Confirmation Modals
  showConfirmModal = signal<boolean>(false);
  showCancelModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Timezones list
  timezones = TIMEZONE_OPTIONS;
  timezoneSearch = signal<string>('');
  filteredTimezones = computed(() => {
    const q = this.timezoneSearch().toLowerCase().trim();
    if (!q) return this.timezones;
    return this.timezones.filter(tz => 
      tz.display.toLowerCase().includes(q) || tz.stored.toLowerCase().includes(q)
    );
  });

  // Dynamic departments for this org
  departments = computed(() => this.lms.getOrganizationDepartments());

  // Real-time capacity impact computation (§4.1.4)
  remainingOrgDbAvailable = computed(() => {
    const totalAvail = this.capacity().dbAvailableGb;
    const requested = this.databaseSizeGb() || 0;
    return totalAvail - requested;
  });

  remainingOrgFileAvailable = computed(() => {
    const totalAvail = this.capacity().fileAvailableGb;
    const requested = this.fileStorageGb() || 0;
    return totalAvail - requested;
  });

  ngOnInit() {
    this.ensureActiveTenantTheme();

    // Set default timezone from parent organization
    if (this.parentOrg().timezone) {
      this.selectedTimezone.set(this.parentOrg().timezone);
    }

    // Check if resuming draft from query params
    this.route.queryParams.subscribe(params => {
      const qDraftId = params['draftId'];
      if (qDraftId) {
        this.loadDraft(qDraftId);
      } else {
        // Pre-fill suggested default allocation based on available capacity
        this.initDefaultAllocations();
        this.showStepAlert(1, 'entered');
      }
    });
  }

  /**
   * Dispatches a prominent step alert mentioning the exact step number and description
   */
  private showStepAlert(step: WizardStep, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<WizardStep, string> = {
      1: 'Step 1 of 4: Basic Information',
      2: 'Step 2 of 4: Resource Allocation',
      3: 'Step 3 of 4: Admin Assignment',
      4: 'Step 4 of 4: Preview & Confirm'
    };

    const stepDescriptions: Record<WizardStep, string> = {
      1: 'Step 1 of 4 — LMS Basic Info: Configure LMS name, department, domain URL, and branding.',
      2: 'Step 2 of 4 — Resource Allocation: Allocate database and file storage from available capacity.',
      3: 'Step 3 of 4 — Admin Assignment: Assign primary administrator and dispatch invitation notification.',
      4: 'Step 4 of 4 — Preview & Finalize: Review LMS instance parameters before provisioning.'
    };

    const title = stepTitles[step];
    const badge = `STEP ${step} / 4`;

    let msg = stepDescriptions[step];
    if (action === 'completed') {
      const prev = (step - 1) as WizardStep;
      msg = `Step ${prev} completed successfully! Now on Step ${step} of 4.`;
    } else if (action === 'back') {
      msg = `Navigated back to Step ${step} of 4 (${stepTitles[step].split(': ')[1]}).`;
    } else if (action === 'jump') {
      msg = `Active: Step ${step} of 4 (${stepTitles[step].split(': ')[1]}).`;
    }

    this.lms.showToast(msg, 'info', 4000, title, badge);
  }

  private ensureActiveTenantTheme() {
    const active = this.lms.activeLms();
    if (active && active.branding) {
      this.lms.applyTenantTheme(
        active.branding.primaryColor,
        active.branding.accentColor,
        active.branding.faviconUrl,
        active.basicInfo.lmsName,
        active.branding.themePreset
      );
    }
  }

  private initDefaultAllocations() {
    const dbAvail = this.capacity().dbAvailableGb;
    const fileAvail = this.capacity().fileAvailableGb;
    if (dbAvail > 0 && !this.databaseSizeGb()) {
      this.databaseSizeGb.set(Math.min(50, dbAvail));
    }
    if (fileAvail > 0 && !this.fileStorageGb()) {
      this.fileStorageGb.set(Math.min(100, fileAvail));
    }
  }

  // Load draft data
  loadDraft(id: string) {
    const draft = this.lms.getLmsDraft(id);
    if (!draft) return;

    this.draftId.set(draft.id);

    // Basic Info
    if (draft.basicInfo) {
      this.lmsName.set(draft.basicInfo.lmsName || '');
      this.programmeDepartment.set(draft.basicInfo.programmeDepartment || '');
      this.summary.set(draft.basicInfo.summary || '');
      this.goal.set(draft.basicInfo.goal || '');
      this.lmsType.set(draft.basicInfo.lmsType || 'Private');
      this.urlDomain.set(draft.basicInfo.urlDomain || '');
      this.selectedTimezone.set(draft.basicInfo.timezone || this.parentOrg().timezone || 'Asia/Dhaka');
      if (draft.basicInfo.logo) {
        this.logoUrl.set(draft.basicInfo.logo.url || '');
        this.logoFileName.set(draft.basicInfo.logo.fileName || '');
      }
    }

    // Resources
    if (draft.resources) {
      this.databaseSizeGb.set(draft.resources.databaseSizeGb);
      this.fileStorageGb.set(draft.resources.fileStorageGb);
      this.usageAlertThresholdPct.set(draft.resources.usageAlertThresholdPct || 80);
    }

    // Admins
    if (draft.admins && draft.admins.length > 0) {
      this.adminList.set(JSON.parse(JSON.stringify(draft.admins)));
      this.adminName.set(draft.admins[0].name || '');
      this.adminEmail.set(draft.admins[0].email || '');
      this.adminContactNumber.set(draft.admins[0].contactNumber || '');
    }

    // Set step
    const stepVal = draft.lastCompletedStep as unknown;
    if (stepVal === 'basic-info' || stepVal === 1) {
      this.completedSteps.update(s => new Set([...s, 1]));
      this.currentStep.set(2);
    } else if (stepVal === 'resources' || stepVal === 2) {
      this.completedSteps.update(s => new Set([...s, 1, 2]));
      this.currentStep.set(3);
    } else if (stepVal === 'admin' || stepVal === 3) {
      this.completedSteps.update(s => new Set([...s, 1, 2, 3]));
      this.currentStep.set(4);
    }

    this.lms.showToast(`Loaded draft for "${draft.basicInfo?.lmsName || draft.id}" at Step ${this.currentStep()} of 4`, 'info', 4500, `Step ${this.currentStep()} Resumed`, `STEP ${this.currentStep()} / 4`);
  }

  // Stepper helper logic identical to Organization Create
  getStepState(step: number): 'current' | 'done' | 'disabled' {
    if (this.currentStep() === step) return 'current';
    if (this.completedSteps().has(step)) return 'done';
    return 'disabled';
  }

  isStepClickable(step: number): boolean {
    if (step === this.currentStep()) return true;
    if (this.completedSteps().has(step)) return true;
    if (step === 1) return true;
    if (step === 2 && this.completedSteps().has(1)) return true;
    if (step === 3 && this.completedSteps().has(2)) return true;
    if (step === 4 && this.completedSteps().has(3)) return true;
    return false;
  }

  jumpToStep(step: number) {
    if (this.isStepClickable(step)) {
      this.formErrorAlert.set(null);
      if (this.currentStep() !== step) {
        this.currentStep.set(step as WizardStep);
        this.showStepAlert(step as WizardStep, 'jump');
      }
      this.scrollTop();
    }
  }

  // Auto-generate suggested URL domain when LMS Name changes
  onLmsNameChange(val: string) {
    this.lmsName.set(val);
    if (!this.isUrlManuallyEdited()) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const orgDomain = this.parentOrg().domain || 'brac.net';
      if (slug) {
        this.urlDomain.set(`${slug}.${orgDomain}`);
      }
    }
  }

  onUrlChange(val: string) {
    this.urlDomain.set(val);
    this.isUrlManuallyEdited.set(true);
  }

  // Handle department selection / creation
  selectDepartment(dept: string) {
    if (dept === '__ADD_NEW__') {
      this.isAddingNewDept.set(true);
      this.programmeDepartment.set('');
    } else {
      this.isAddingNewDept.set(false);
      this.programmeDepartment.set(dept);
    }
  }

  saveCustomDepartment() {
    const trimmed = this.customDepartment().trim();
    if (trimmed) {
      this.lms.addOrganizationDepartment(trimmed);
      this.programmeDepartment.set(trimmed);
      this.isAddingNewDept.set(false);
      this.customDepartment.set('');
    }
  }

  // Logo file upload simulation
  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errors.update(e => ({ ...e, logo: 'Logo file size cannot exceed 5MB.' }));
        return;
      }
      this.logoFileName.set(file.name);
      this.logoSizeKb.set(Math.round(file.size / 1024));
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoUrl.set(e.target?.result as string);
        this.errors.update(e => {
          const copy = { ...e };
          delete copy.logo;
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.logoUrl.set('');
    this.logoFileName.set('');
    this.logoSizeKb.set(0);
  }

  // =========================================================================
  // STEP 1 VALIDATION & PROGRESSION
  // =========================================================================
  validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    const name = this.lmsName().trim();
    const dept = this.programmeDepartment().trim();
    const url = this.urlDomain().trim();
    const tz = this.selectedTimezone();

    if (!name) {
      newErrors['lmsName'] = 'LMS Name is mandatory.';
    } else if (name.length > 99) {
      newErrors['lmsName'] = 'LMS Name must not exceed 99 characters.';
    } else {
      const isDuplicate = this.existingOrgLms().some(
        l => l.basicInfo.lmsName.toLowerCase() === name.toLowerCase() && l.id !== this.draftId()
      );
      if (isDuplicate) {
        newErrors['lmsName'] = `An LMS named "${name}" already exists in ${this.parentOrg().name}. LMS Name must be unique within this Organization.`;
      }
    }

    if (!dept) {
      newErrors['programmeDepartment'] = 'Programme / Department is mandatory.';
    }

    if (!url) {
      newErrors['urlDomain'] = 'LMS URL / Domain is mandatory.';
    } else {
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!domainRegex.test(cleanUrl)) {
        newErrors['urlDomain'] = 'Please enter a valid domain format (e.g. lms-dept.brac.net).';
      }
    }

    if (!tz) {
      newErrors['timezone'] = 'Timezone is mandatory.';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      this.formErrorAlert.set('All mandatory fields are not filled up.');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  // =========================================================================
  // STEP 2 VALIDATION & PROGRESSION
  // =========================================================================
  validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    const db = this.databaseSizeGb();
    const file = this.fileStorageGb();
    const threshold = this.usageAlertThresholdPct();
    const cap = this.capacity();

    if (db === null || db === undefined || isNaN(db)) {
      newErrors['databaseSizeGb'] = 'Database Size is mandatory.';
    } else if (db <= 0) {
      newErrors['databaseSizeGb'] = 'Database Size must be greater than 0 GB.';
    } else if (db > cap.dbAvailableGb) {
      newErrors['databaseSizeGb'] = `Database Size (${db} GB) exceeds available Organization capacity (${cap.dbAvailableGb} GB).`;
    }

    if (file === null || file === undefined || isNaN(file)) {
      newErrors['fileStorageGb'] = 'File Storage is mandatory.';
    } else if (file <= 0) {
      newErrors['fileStorageGb'] = 'File Storage must be greater than 0 GB.';
    } else if (file > cap.fileAvailableGb) {
      newErrors['fileStorageGb'] = `File Storage (${file} GB) exceeds available Organization capacity (${cap.fileAvailableGb} GB).`;
    }

    if (threshold === null || threshold === undefined || isNaN(threshold)) {
      newErrors['usageAlertThresholdPct'] = 'Usage Alert Threshold is mandatory.';
    } else if (threshold < 1 || threshold > 100) {
      newErrors['usageAlertThresholdPct'] = 'Threshold must be between 1% and 100%.';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      this.formErrorAlert.set('Please fix resource allocation capacity errors.');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  // =========================================================================
  // STEP 3 VALIDATION & PROGRESSION
  // =========================================================================
  validateStep3(): boolean {
    const newErrors: Record<string, string> = {};
    const name = this.adminName().trim();
    const email = this.adminEmail().trim();
    const phone = this.adminContactNumber().trim();

    if (!name) {
      newErrors['adminName'] = 'LMS Admin Name is mandatory.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors['adminEmail'] = 'LMS Admin Email is mandatory.';
    } else if (!emailRegex.test(email)) {
      newErrors['adminEmail'] = 'Please enter a valid email address.';
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phone) {
      newErrors['adminContactNumber'] = 'Contact Number is mandatory.';
    } else if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      newErrors['adminContactNumber'] = 'Please enter an 11-digit phone number (e.g. 01711223344).';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      this.formErrorAlert.set('All mandatory admin fields are not filled up.');
      return false;
    }

    const primaryAdmin: LmsAdminInfo = {
      name,
      email,
      contactNumber: phone,
      role: 'LMS Admin',
      invitationStatus: 'pending'
    };

    if (this.adminList().length === 0) {
      this.adminList.set([primaryAdmin]);
    } else {
      this.adminList.update(list => {
        const copy = [...list];
        copy[0] = primaryAdmin;
        return copy;
      });
    }

    this.formErrorAlert.set(null);
    return true;
  }

  addAdditionalAdmin() {
    const name = prompt('Enter Additional LMS Admin Full Name:');
    if (!name?.trim()) return;
    const email = prompt('Enter Additional LMS Admin Email:');
    if (!email?.trim()) return;
    const phone = prompt('Enter Contact Number (01XXXXXXXXX):') || '01700000000';

    const newAdmin: LmsAdminInfo = {
      name: name.trim(),
      email: email.trim(),
      contactNumber: phone.trim(),
      role: 'LMS Admin',
      invitationStatus: 'pending'
    };

    this.adminList.update(list => [...list, newAdmin]);
  }

  removeAdmin(index: number) {
    if (index === 0) {
      alert('The primary LMS Administrator cannot be removed.');
      return;
    }
    this.adminList.update(list => list.filter((_, i) => i !== index));
  }

  triggerAdminNoticeEmail() {
    const adminEmail = this.adminEmail().trim();
    const adminName = this.adminName().trim() || 'LMS Admin';
    const lmsName = this.lmsName().trim() || 'New LMS Instance';

    if (!adminEmail) {
      this.formErrorAlert.set('Please provide a valid Admin Email address before sending notification.');
      return;
    }

    this.lms.sendLmsAdminNoticeEmail(adminEmail, adminName, lmsName);
    this.adminEmailSent.set(true);
    this.lms.showToast(`"LMS Setup In-Progress" notification dispatched to ${adminEmail}`, 'info', 4500, 'Step 3: Email Dispatched', 'STEP 3 / 4');
  }

  // =========================================================================
  // NAVIGATION ACTIONS (onNext, onBack, onReset, onCancel, onSaveAsDraft)
  // =========================================================================
  onNext() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      if (!this.validateStep1()) {
        this.lms.showToast('Step 1 Validation: All mandatory fields are not filled up.', 'error', 4500, 'Step 1 Error', 'STEP 1 / 4');
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });

      this.currentStep.set(2);
      this.lms.showToast('Step 1 (Basic Information) saved. Proceeding to Step 2 of 4: Resource Allocation.', 'success', 4500, 'Step 1 Completed', 'STEP 2 / 4');
      this.scrollTop();
    } else if (step === 2) {
      if (!this.validateStep2()) {
        this.lms.showToast('Step 2 Validation: Check storage quota limits.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(2);
        return next;
      });

      this.currentStep.set(3);
      this.lms.showToast('Step 2 (Resource Allocation) saved. Proceeding to Step 3 of 4: Admin Assignment.', 'success', 4500, 'Step 2 Completed', 'STEP 3 / 4');
      this.scrollTop();
    } else if (step === 3) {
      if (!this.validateStep3()) {
        this.lms.showToast('Step 3 Validation: All mandatory admin fields are not filled up.', 'error', 4500, 'Step 3 Error', 'STEP 3 / 4');
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(3);
        return next;
      });

      this.currentStep.set(4);
      this.lms.showToast('Step 3 (Admin Assignment) saved. Proceeding to Step 4 of 4: Preview & Confirm.', 'success', 4500, 'Step 3 Completed', 'STEP 4 / 4');
      this.scrollTop();
    }
  }

  onBack() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();
    if (step > 1) {
      const prevStep = (step - 1) as WizardStep;
      this.currentStep.set(prevStep);
      this.showStepAlert(prevStep, 'back');
      this.scrollTop();
    }
  }

  onReset() {
    const step = this.currentStep();
    if (step === 1) {
      this.lmsName.set('');
      this.programmeDepartment.set('');
      this.summary.set('');
      this.goal.set('');
      this.urlDomain.set('');
      this.logoUrl.set('');
      this.logoFileName.set('');
      this.logoSizeKb.set(0);
    } else if (step === 2) {
      this.databaseSizeGb.set(null);
      this.fileStorageGb.set(null);
      this.usageAlertThresholdPct.set(80);
    } else if (step === 3) {
      this.adminName.set('');
      this.adminEmail.set('');
      this.adminContactNumber.set('');
      this.adminList.set([]);
      this.adminEmailSent.set(false);
    }
    this.errors.set({});
    this.formErrorAlert.set(null);
    this.lms.showToast(`Step ${step} form fields have been reset.`, 'info', 4000, `Step ${step} Reset`, `STEP ${step} / 4`);
  }

  onCancel() {
    if (this.lmsName() || this.databaseSizeGb() || this.adminName()) {
      this.showCancelModal.set(true);
    } else {
      this.router.navigate(['/lms']);
    }
  }

  confirmCancel() {
    this.showCancelModal.set(false);
    this.router.navigate(['/lms']);
  }

  onSaveAsDraft() {
    const draftPayload: LmsDraft = {
      id: this.draftId() || `LMS-DRAFT-${this.parentOrg().numericId || 'ORG'}-${Math.floor(1000 + Math.random() * 9000)}`,
      organizationId: this.parentOrg().id,
      organizationName: this.parentOrg().name,
      status: 'In-Progress',
      isDraft: true,
      lastCompletedStep: this.currentStep() === 1 ? 'basic-info' : (this.currentStep() === 2 ? 'resources' : (this.currentStep() === 3 ? 'admin' : 'preview')),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      basicInfo: {
        lmsName: this.lmsName(),
        programmeDepartment: this.programmeDepartment(),
        summary: this.summary(),
        goal: this.goal(),
        lmsType: this.lmsType(),
        urlDomain: this.urlDomain(),
        timezone: this.selectedTimezone(),
        logo: this.logoUrl() ? { url: this.logoUrl(), fileName: this.logoFileName() } : undefined
      },
      resources: {
        databaseSizeGb: this.databaseSizeGb(),
        fileStorageGb: this.fileStorageGb(),
        usageAlertThresholdPct: this.usageAlertThresholdPct()
      },
      admins: this.adminList().length > 0 ? this.adminList() : (this.adminName() ? [{
        name: this.adminName(),
        email: this.adminEmail(),
        contactNumber: this.adminContactNumber(),
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }] : [])
    };

    this.lms.saveLmsDraft(draftPayload);
    this.lms.showToast(`Draft saved at Step ${this.currentStep()} of 4 for "${draftPayload.basicInfo?.lmsName || draftPayload.id}".`, 'success', 5000, `Step ${this.currentStep()} Draft Saved`, `STEP ${this.currentStep()} / 4`);
    this.router.navigate(['/lms']);
  }

  // Step 4 Terminal Action: Create LMS
  onCreateLms() {
    if (!this.validateStep1() || !this.validateStep2() || !this.validateStep3()) {
      this.formErrorAlert.set('Please complete all mandatory fields before creating the LMS.');
      return;
    }
    this.showConfirmModal.set(true);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
  }

  finalizeCreation() {
    this.isSubmitting.set(true);

    const draftPayload: LmsDraft = {
      id: this.draftId() || `LMS-${this.parentOrg().numericId || 'ORG'}-${Math.floor(10 + Math.random() * 90)}`,
      organizationId: this.parentOrg().id,
      organizationName: this.parentOrg().name,
      status: 'Under Processing',
      isDraft: false,
      lastCompletedStep: 'preview',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      basicInfo: {
        lmsName: this.lmsName(),
        programmeDepartment: this.programmeDepartment(),
        summary: this.summary(),
        goal: this.goal(),
        lmsType: this.lmsType(),
        urlDomain: this.urlDomain(),
        timezone: this.selectedTimezone(),
        logo: this.logoUrl() ? { url: this.logoUrl(), fileName: this.logoFileName() } : undefined
      },
      resources: {
        databaseSizeGb: this.databaseSizeGb() || 50,
        fileStorageGb: this.fileStorageGb() || 100,
        usageAlertThresholdPct: this.usageAlertThresholdPct() || 80
      },
      admins: this.adminList().length > 0 ? this.adminList() : [{
        name: this.adminName(),
        email: this.adminEmail(),
        contactNumber: this.adminContactNumber(),
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }]
    };

    // Simulate microservice creation latency
    setTimeout(() => {
      const createdLms = this.lms.createLmsFromWizard(draftPayload);

      if (createdLms.admins && createdLms.admins[0]) {
        this.lms.sendLmsAdminNoticeEmail(
          createdLms.admins[0].email,
          createdLms.admins[0].name,
          createdLms.basicInfo.lmsName
        );
      }

      this.isSubmitting.set(false);
      this.showConfirmModal.set(false);

      this.lms.showToast(
        `${createdLms.basicInfo.lmsName} has been successfully created and is under processing.`,
        'success',
        6000,
        'Step 4 Complete: LMS Created',
        'UNDER PROCESSING'
      );
      this.router.navigate(['/lms']);
    }, 700);
  }

  getTimezoneDisplay(storedValue: string): string {
    const match = this.timezones.find(t => t.stored === storedValue);
    return match ? match.display : storedValue;
  }

  private scrollTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
