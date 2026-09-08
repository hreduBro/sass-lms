import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';
import { TIMEZONE_OPTIONS, TimezoneOption } from '../../models/organization.model';
import { LmsBasicInfo, LmsResourceAllocation, LmsAdminInfo, LmsDraft, LmsType, LmsInstance } from '../../models/lms-instance.model';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';
import { StepperComponent, StepperStep } from '../../components/stepper/stepper.component';

export type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-lms-create',
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent, StepperComponent],
  templateUrl: './lms-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LmsCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  modalService = inject(ConfirmationModalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Stepper State (Identical to Organization Create)
  currentStep = signal<WizardStep>(1);
  completedSteps = signal<Set<number>>(new Set<number>());

  // Reusable Stepper Configuration
  steps: StepperStep[] = [
    { id: 1, key: 'basic', title: 'Basic Information', shortTitle: 'Basic Info', sublabel: 'Identity & Scope', icon: 'school' },
    { id: 2, key: 'resources', title: 'Resource Allocation', shortTitle: 'Resources', sublabel: 'Storage & Capacity', icon: 'database' },
    { id: 3, key: 'admin', title: 'Administrator Assignment', shortTitle: 'Admin Setup', sublabel: 'Admins & Scope', icon: 'manage_accounts' },
    { id: 4, key: 'preview', title: 'Preview & Confirm', shortTitle: 'Preview', sublabel: 'Review & Launch', icon: 'rate_review' }
  ];

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
  commonEmail = signal<string>('');
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
  usageAlertThresholdPct = signal<number | null>(null);

  // Step 3: Admin Assignment State (Multi-Administrator List)
  adminsList = signal<Array<{ id: string; name: string; contactNumber: string; email: string }>>([
    { id: 'admin-1', name: '', contactNumber: '', email: '' }
  ]);
  adminErrors = signal<Record<string, string>>({});

  // Draft & Edit tracking
  draftId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  editingLmsId = signal<string | null>(null);

  // Validation errors map & Alert banner
  errors = signal<Record<string, string>>({});
  formErrorAlert = signal<string | null>(null);

  // Confirmation Modals
  showConfirmModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Timezones list
  timezones = TIMEZONE_OPTIONS;
  timezoneSearch = signal<string>('');
  filteredTimezones = computed(() => {
    const q = (this.timezoneSearch() || '').toLowerCase().trim();
    if (!q) return this.timezones;
    return this.timezones.filter(tz => 
      (tz?.display || '').toLowerCase().includes(q) || (tz?.stored || '').toLowerCase().includes(q)
    );
  });

  // Dynamic departments for this org
  departments = computed(() => this.lms.getOrganizationDepartments());

  departmentOptions = computed(() => {
    const list = this.departments().map(d => ({
      value: d,
      label: d,
      icon: 'corporate_fare'
    }));
    return [
      ...list,
      { value: '__ADD_NEW__', label: '+ Add New Programme / Department', icon: 'add_circle', badge: 'Custom', badgeClass: 'bg-tenant-500/10 text-tenant-600 dark:text-tenant-400' }
    ];
  });

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

    // Check if editing an existing LMS instance via route param /lms/edit/:id
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadLmsForEdit(id);
      }
    });

    // Check if editing an existing LMS instance or resuming draft from query params
    this.route.queryParams.subscribe(params => {
      const qEditId = params['editLmsId'] || params['editId'] || (!this.route.snapshot.paramMap.get('id') ? params['id'] : null);
      const qDraftId = params['draftId'];
      if (qEditId) {
        this.loadLmsForEdit(qEditId);
      } else if (qDraftId) {
        this.loadDraft(qDraftId);
      } else if (!this.route.snapshot.paramMap.get('id')) {
        // Set default timezone from parent organization
        if (this.parentOrg().timezone) {
          this.selectedTimezone.set(this.parentOrg().timezone);
        }
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
      3: 'Step 3 of 4 — Admin Assignment: Configure one or more administrators for this LMS instance.',
      4: 'Step 4 of 4 — Preview & Finalize: Review LMS instance parameters before provisioning.'
    };

    let title = stepTitles[step];
    let badge = `STEP ${step} / 4`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step];
    if (action === 'completed') {
      const prev = (step - 1) as WizardStep;
      const prevName = stepTitles[prev].split(': ')[1];
      const nextName = stepTitles[step].split(': ')[1];
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevName}) saved. Now on Step ${step} of 4: ${nextName}.`;
      type = 'success';
    } else if (action === 'back') {
      msg = `Navigated back to Step ${step} of 4 (${stepTitles[step].split(': ')[1]}).`;
      type = 'info';
    } else if (action === 'jump') {
      msg = `Active: Step ${step} of 4 (${stepTitles[step].split(': ')[1]}).`;
      type = 'info';
    }

    this.lms.showToast(msg, type, 4000, title, badge);
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

  // Multi-Administrator Management Actions
  addAdmin() {
    const newId = `admin-${Date.now()}`;
    this.adminsList.update(list => [
      ...list,
      { id: newId, name: '', contactNumber: '', email: '' }
    ]);
    this.lms.showToast(`Added Administrator #${this.adminsList().length}`, 'info', 2500);
  }

  removeAdmin(index: number) {
    if (this.adminsList().length <= 1) {
      this.adminsList.set([
        { id: `admin-${Date.now()}`, name: '', contactNumber: '', email: '' }
      ]);
      this.adminErrors.set({});
      this.lms.showToast('Administrator fields reset', 'info', 2500);
      return;
    }
    const target = this.adminsList()[index];
    this.adminsList.update(list => list.filter((_, i) => i !== index));
    this.adminErrors.set({});
    this.lms.showToast(`Removed Administrator "${target?.name || '#' + (index + 1)}"`, 'info', 2500);
  }

  updateAdminField(index: number, field: 'name' | 'contactNumber' | 'email', value: string) {
    this.adminsList.update(list => {
      const updated = [...list];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });

    const errKey = `${field}_${index}`;
    if (this.adminErrors()[errKey]) {
      this.adminErrors.update(errs => {
        const copy = { ...errs };
        delete copy[errKey];
        return copy;
      });
    }
  }

  // Load LMS Instance for editing
  loadLmsForEdit(lmsId: string) {
    const instance = this.lms.lmsInstances().find(l => l.id === lmsId);
    if (!instance) {
      this.lms.showToast(`LMS instance "${lmsId}" not found.`, 'warning', 4000);
      return;
    }

    this.isEditMode.set(true);
    this.editingLmsId.set(instance.id);

    // If the instance belongs to another organization, ensure parent org is active
    if (instance.organizationId && instance.organizationId !== this.parentOrg().id) {
      this.lms.activeTenantId.set(instance.organizationId);
    }

    // Basic Info
    if (instance.basicInfo) {
      this.lmsName.set(instance.basicInfo.lmsName || '');
      this.programmeDepartment.set(instance.basicInfo.programmeDepartment || '');
      this.commonEmail.set(instance.basicInfo.commonEmail || '');
      this.summary.set(instance.basicInfo.summary || '');
      this.goal.set(instance.basicInfo.goal || '');
      this.lmsType.set(instance.basicInfo.lmsType || 'Private');
      this.urlDomain.set(instance.basicInfo.urlDomain || '');
      this.selectedTimezone.set(instance.basicInfo.timezone || this.parentOrg().timezone || 'Asia/Dhaka');
      if (instance.basicInfo.logo) {
        this.logoUrl.set(instance.basicInfo.logo.url || '');
        this.logoFileName.set(instance.basicInfo.logo.fileName || '');
      }
    }

    // Resources
    if (instance.resources) {
      this.databaseSizeGb.set(instance.resources.databaseSizeGb);
      this.fileStorageGb.set(instance.resources.fileStorageGb);
      this.usageAlertThresholdPct.set(instance.resources.usageAlertThresholdPct || 80);
    }

    // Admins
    if (instance.admins && instance.admins.length > 0) {
      this.adminsList.set(instance.admins.map((a, idx) => ({
        id: `admin-${idx + 1}-${Date.now()}`,
        name: a.name || '',
        contactNumber: a.contactNumber || '',
        email: a.email || ''
      })));
    } else {
      this.adminsList.set([{
        id: 'admin-1',
        name: '',
        contactNumber: '',
        email: ''
      }]);
    }

    // Enable navigation across all steps
    this.completedSteps.set(new Set([1, 2, 3]));

    this.lms.showToast(
      `Loaded details for "${instance.basicInfo.lmsName}". You can modify parameters across all steps.`,
      'info',
      4500,
      'Edit LMS Mode',
      'EDIT MODE'
    );
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
      this.commonEmail.set(draft.basicInfo.commonEmail || '');
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
      this.adminsList.set(draft.admins.map((a, idx) => ({
        id: `admin-${idx + 1}-${Date.now()}`,
        name: a.name || '',
        contactNumber: a.contactNumber || '',
        email: a.email || ''
      })));
    } else {
      this.adminsList.set([{
        id: 'admin-1',
        name: '',
        contactNumber: '',
        email: ''
      }]);
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
    this.lmsName.set(val || '');
    if (!this.isUrlManuallyEdited()) {
      const slug = (val || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const orgDomain = this.parentOrg()?.domain || 'brac.net';
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
    const trimmed = (this.customDepartment() || '').trim();
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
    const name = (this.lmsName() || '').trim();
    const dept = (this.programmeDepartment() || '').trim();
    const url = (this.urlDomain() || '').trim();
    const tz = this.selectedTimezone();

    if (!name) {
      newErrors['lmsName'] = 'LMS Name is mandatory.';
    } else if (name.length > 99) {
      newErrors['lmsName'] = 'LMS Name must not exceed 99 characters.';
    } else {
      const isDuplicate = this.existingOrgLms().some(
        l => (l?.basicInfo?.lmsName || '').toLowerCase() === name.toLowerCase() && l?.id !== this.draftId()
      );
      if (isDuplicate) {
        newErrors['lmsName'] = `An LMS named "${name}" already exists in ${this.parentOrg()?.name || 'this Organization'}. LMS Name must be unique within this Organization.`;
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

    const commonEmailVal = (this.commonEmail() || '').trim();
    if (commonEmailVal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(commonEmailVal)) {
        newErrors['commonEmail'] = 'Please enter a valid email address ending with domain extension (.com, .org, etc).';
      }
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
    const errors: Record<string, string> = {};
    const list = this.adminsList();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    const contactRegex = /^01[3-9]\d{8}$/;
    const seenEmails = new Set<string>();

    if (list.length === 0) {
      errors['general'] = 'At least one Administrator is required.';
    }

    list.forEach((adm, idx) => {
      const name = (adm?.name || '').trim();
      const email = (adm?.email || '').trim().toLowerCase();
      const contact = (adm?.contactNumber || '').trim();

      // Name validation
      if (!name) {
        errors[`name_${idx}`] = 'Admin Full Name is required.';
      } else if (name.length < 2) {
        errors[`name_${idx}`] = 'Name must be at least 2 characters.';
      } else if (name.length > 99) {
        errors[`name_${idx}`] = 'Name cannot exceed 99 characters.';
      }

      // Contact validation
      if (!contact) {
        errors[`contactNumber_${idx}`] = 'Contact number is required.';
      } else if (!contactRegex.test(contact) && !/^\+?[0-9\s-]{7,15}$/.test(contact)) {
        errors[`contactNumber_${idx}`] = 'Must be 11 digits (013–019) or valid phone number.';
      }

      // Email validation
      if (!email) {
        errors[`email_${idx}`] = 'Admin Email is required.';
      } else if (!emailRegex.test(email)) {
        errors[`email_${idx}`] = 'Please enter a valid email address.';
      } else if (seenEmails.has(email)) {
        errors[`email_${idx}`] = 'This email is duplicate across administrators.';
      } else {
        seenEmails.add(email);
      }
    });

    this.adminErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      this.formErrorAlert.set(`Please complete all administrator required fields: ${firstError}`);
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  getAllAdmins(): LmsAdminInfo[] {
    return this.adminsList()
      .filter(a => (a?.name || '').trim() || (a?.email || '').trim())
      .map(a => ({
        name: (a?.name || '').trim() || 'LMS Admin',
        email: (a?.email || '').trim(),
        contactNumber: (a?.contactNumber || '').trim() || 'N/A',
        role: 'LMS Admin',
        invitationStatus: 'pending'
      }));
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
        this.scrollToFirstError();
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
        this.scrollToFirstError();
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
        this.scrollToFirstError();
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
      this.commonEmail.set('');
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
      this.adminsList.set([
        { id: `admin-${Date.now()}`, name: '', contactNumber: '', email: '' }
      ]);
      this.adminErrors.set({});
    }
    this.errors.set({});
    this.formErrorAlert.set(null);
    this.lms.showToast(`Step ${step} form fields have been reset.`, 'info', 4000, `Step ${step} Reset`, `STEP ${step} / 4`);
  }

  async onCancel() {
    const res = await this.modalService.confirmDiscard({
      title: 'Discard LMS Creation?',
      message: 'You have unsaved changes in this wizard. You can save your progress as a draft to resume later.'
    });
    if (res === 'draft') {
      this.onSaveAsDraft();
    } else if (res === 'discard') {
      this.router.navigate(['/lms']);
    }
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
        commonEmail: this.commonEmail() || undefined,
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
      admins: this.getAllAdmins()
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

    if (this.isEditMode() && this.editingLmsId()) {
      const updateData: Partial<LmsInstance> = {
        basicInfo: {
          lmsName: this.lmsName(),
          programmeDepartment: this.programmeDepartment(),
          commonEmail: this.commonEmail() || undefined,
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
        admins: this.getAllAdmins()
      };

      setTimeout(() => {
        const result = this.lms.updateLmsInstance(this.editingLmsId()!, updateData);
        this.isSubmitting.set(false);
        this.showConfirmModal.set(false);

        if (result.success) {
          this.lms.showToast(
            `LMS "${this.lmsName()}" has been updated successfully!`,
            'success',
            5000,
            'Step 4 Complete: LMS Updated',
            'SAVED'
          );
          this.router.navigate(['/lms']);
        } else {
          this.formErrorAlert.set(result.error || 'Failed to update LMS instance.');
          this.lms.showToast(result.error || 'Failed to update LMS instance.', 'warning', 5000);
        }
      }, 500);
      return;
    }

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
        commonEmail: this.commonEmail() || undefined,
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
      admins: this.getAllAdmins()
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

  private scrollToFirstError() {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        'input.border-rose-500, select.border-rose-500, textarea.border-rose-500, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
      );
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ((errorEl as HTMLElement).focus && typeof (errorEl as HTMLElement).focus === 'function') {
          (errorEl as HTMLElement).focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  }
}
