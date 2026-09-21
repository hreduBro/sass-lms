import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Uppy from '@uppy/core';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import { LmsDataService } from '../../services/lms-data.service';
import {
  TIMEZONE_OPTIONS,
  DIVISION_DISTRICTS_MAP,
  DIVISIONS_LIST,
  COUNTRIES_LIST,
  OrganizationDraft,
  DataSharingMode,
  CustomDataSharingBatch
} from '../../models/organization.model';

import { ConfirmationModalService } from '../../services/confirmation-modal.service';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';
import { StepperComponent, StepperStep } from '../../components/stepper/stepper.component';

export type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-organization-create',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CustomSelectComponent, StepperComponent],
  templateUrl: './organization-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  lms = inject(LmsDataService);
  modalService = inject(ConfirmationModalService);

  // Stepper State
  currentStep = signal<WizardStep>(1);
  completedSteps = signal<Set<number>>(new Set<number>());

  // Reusable Stepper Configuration
  steps: StepperStep[] = [
    { id: 1, key: 'basic', title: 'Basic Information', shortTitle: 'Basic Info', sublabel: 'Identity & Location', icon: 'corporate_fare' },
    { id: 2, key: 'resources', title: 'Resource Allocation', shortTitle: 'Resources', sublabel: 'Storage & Capacity', icon: 'database' },
    { id: 3, key: 'admin', title: 'Administrator Setup', shortTitle: 'Admin Setup', sublabel: 'Super Admin & Access', icon: 'admin_panel_settings' },
    { id: 4, key: 'preview', title: 'Preview & Confirm', shortTitle: 'Preview', sublabel: 'Review & Confirm', icon: 'preview' }
  ];

  // Step 1: Basic Info Form
  basicInfoForm!: FormGroup;
  
  // Step 2: Resources Form
  resourcesForm!: FormGroup;

  // Custom data sharing batches for Custom mode
  customBatches = signal<CustomDataSharingBatch[]>([
    { id: 'batch-1', name: 'Batch 1: Primary Campus Nodes', lmsInstanceIds: ['LMS-Core-01', 'LMS-Branch-02'] }
  ]);

  // Dropdown options & reactive cascading location partition
  timezoneOptions = TIMEZONE_OPTIONS;
  divisionsList = DIVISIONS_LIST;
  countriesList = COUNTRIES_LIST;
  selectedCountry = signal<string>('Bangladesh');
  selectedDivision = signal<string>('');
  
  dataSharingOptions = [
    { value: 'Yes – Shared', label: 'Yes – Shared', sublabel: 'Repository shared across all LMS under this org', icon: 'share' },
    { value: 'No – Segregated', label: 'No – Segregated', sublabel: 'Data segregated across any LMS under this org', icon: 'lock' },
    { value: 'Custom', label: 'Custom', sublabel: 'Configure custom data sharing batches & groups', icon: 'hub' }
  ];
  
  districtsList = computed(() => {
    const div = this.selectedDivision();
    if (!div || !DIVISION_DISTRICTS_MAP[div]) {
      return [];
    }
    return DIVISION_DISTRICTS_MAP[div];
  });

  // Timezone search
  timezoneSearch = signal<string>('');
  filteredTimezones = computed(() => {
    const q = this.timezoneSearch().toLowerCase().trim();
    if (!q) return this.timezoneOptions;
    return this.timezoneOptions.filter(t => 
      t.display.toLowerCase().includes(q) || t.stored.toLowerCase().includes(q)
    );
  });

  // Logo upload state
  logoPreview = signal<string | null>(null);
  logoFileName = signal<string | null>(null);
  logoSizeKb = signal<number>(0);
  isDraggingLogo = signal<boolean>(false);
  logoTouched = signal<boolean>(false);
  logoError = signal<string | null>(null);

  // Step 3: Admin Setup State (Multi-Administrator List)
  adminsList = signal<Array<{ id: string; adminName: string; contactNumber: string; contactEmail: string }>>([
    { id: 'admin-1', adminName: '', contactNumber: '', contactEmail: '' }
  ]);
  adminErrors = signal<Record<string, string>>({});

  // Form error alerts
  formErrorAlert = signal<string | null>(null);
  successAlert = signal<string | null>(null);

  // Admin notification email test status
  adminEmailSent = signal<boolean>(false);

  // Draft & Edit mode tracking
  activeDraftId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  editingOrgId = signal<string | null>(null);

  // Uppy Core uploader instance
  private uppy!: Uppy;

  // Available LMS Instances for Custom batching
  availableLmsNodes = [
    { id: 'LMS-Core-01', name: 'LMS Main Campus (Core)' },
    { id: 'LMS-Branch-02', name: 'LMS Medical & Health Faculty' },
    { id: 'LMS-Branch-03', name: 'LMS Engineering & CS Node' },
    { id: 'LMS-Branch-04', name: 'LMS Executive Business Lab' }
  ];

  ngOnInit() {
    this.ensureActiveTenantTheme();
    this.initForms();
    this.initUppy();
    
    // Check if editing an existing organization or resuming a draft via query params
    this.route.queryParams.subscribe(params => {
      const qEditId = params['editOrgId'] || params['editId'];
      const qDraftId = params['draftId'];
      if (qEditId) {
        this.loadOrganizationForEdit(qEditId);
      } else if (qDraftId) {
        this.loadDraft(qDraftId);
      } else {
        // Generate new random 4-digit unique numeric ID
        const generatedId = this.lms.generateUniqueOrgId();
        this.basicInfoForm.patchValue({
          organizationId: generatedId
        });
        this.showStepAlert(1, 'entered');
      }
    });
  }

  ngOnDestroy() {
    if (this.uppy) {
      this.uppy.destroy();
    }
  }

  /**
   * Initializes Uppy Core file uploader with Thumbnail Generator and file restrictions
   */
  private initUppy() {
    this.uppy = new Uppy({
      id: 'organization-logo-uploader',
      autoProceed: true,
      restrictions: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
        allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', '.png', '.jpg', '.jpeg', '.svg', '.webp']
      }
    });

    this.uppy.use(ThumbnailGenerator, {
      thumbnailWidth: 400,
      thumbnailHeight: 400
    });

    this.uppy.on('file-added', (file) => {
      this.logoTouched.set(true);
      this.logoError.set(null);
      this.logoFileName.set(file.name);
      this.logoSizeKb.set(Math.round((file.size || 0) / 1024));

      // Read file binary as data URL fallback if thumbnail not yet ready
      if (file.data instanceof Blob || file.data instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!this.logoPreview()) {
            this.logoPreview.set(e.target?.result as string);
          }
        };
        reader.readAsDataURL(file.data);
      }
    });

    this.uppy.on('thumbnail:generated', (file, preview) => {
      if (preview) {
        this.logoPreview.set(preview);
      }
    });

    this.uppy.on('restriction-failed', (file, error) => {
      this.logoTouched.set(true);
      this.logoError.set(error?.message || 'File violates upload restrictions (Max 5MB; PNG, JPG, SVG, WebP only).');
    });

    this.uppy.on('error', (error) => {
      this.logoError.set(error?.message || 'An error occurred during file upload processing.');
    });
  }

  /**
   * Dispatches a prominent step alert mentioning the exact step number and description
   */
  private showStepAlert(step: WizardStep, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<WizardStep, string> = {
      1: 'Step 1 of 4: Basic Information',
      2: 'Step 2 of 4: Resource Allocation',
      3: 'Step 3 of 4: Admin Setup',
      4: 'Step 4 of 4: Preview & Confirm'
    };

    const stepDescriptions: Record<WizardStep, string> = {
      1: 'Step 1 of 4 — Organization Details: Enter name, ID, address, and admin contact details.',
      2: 'Step 2 of 4 — Resource Allocation: Allocate storage quota and configure data sharing mode.',
      3: 'Step 3 of 4 — Admin Setup: Review administrator credentials and dispatch invitation notification.',
      4: 'Step 4 of 4 — Preview & Finalize: Review organization parameters before provisioning.'
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

  /**
   * Applies the current active LMS theme preset & colors
   */
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

  private initForms() {
    // Website URL regex: starts with http:// or https://, no spaces, <= 99 chars
    const websiteRegex = /^(https?:\/\/)[^\s]{1,93}$/;
    // Email regex: contains @ and ends with dot domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    // Contact Number regex: 11 digits, starts with 013, 014, 015, 016, 017, 018, 019
    const contactNumRegex = /^01[3-9]\d{8}$/;
    // Postal code: numeric only, <= 10 digits
    const postalRegex = /^\d{1,10}$/;

    this.basicInfoForm = this.fb.group({
      // Organization Details (§3.1)
      organizationName: ['', [Validators.required, Validators.maxLength(99)]],
      organizationId: [{ value: '', disabled: true }, [Validators.required]],
      websiteUrl: ['', [Validators.maxLength(99), Validators.pattern(websiteRegex)]],
      tagline: ['', [Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(255)]],
      officialEmail: ['', [Validators.pattern(emailRegex)]],
      commonEmail: ['', [Validators.pattern(emailRegex)]],
      organizationEmail: ['', [Validators.pattern(emailRegex)]],
      timezone: ['Asia/Dhaka'], // Default suggested: Dhaka (UTC+06:00)
      
      // Organization Location / Address (§3.2)
      country: ['Bangladesh', [Validators.required]],
      line1: ['', [Validators.required, Validators.maxLength(150)]],
      line2: ['', [Validators.maxLength(150)]],
      division: ['', [Validators.required]],
      district: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(postalRegex)]],

      // Organization Admin Information (§3.3)
      adminName: ['', [Validators.maxLength(99)]],
      contactNumber: ['', [Validators.pattern(contactNumRegex)]],
      contactEmail: ['', [Validators.pattern(emailRegex)]]
    });

    // When division changes, update selectedDivision signal and reset district selection
    this.basicInfoForm.get('division')?.valueChanges.subscribe((divVal) => {
      this.selectedDivision.set(divVal || '');
    });

    // When country changes, update selectedCountry signal
    this.basicInfoForm.get('country')?.valueChanges.subscribe((countryVal) => {
      this.selectedCountry.set(countryVal || 'Bangladesh');
    });

    // Step 2: Resources Form (§4.2)
    this.resourcesForm = this.fb.group({
      databaseSizeGb: [250, [Validators.min(1)]],
      fileStorageGb: [null, [Validators.required, Validators.min(1)]],
      usageAlertThresholdPct: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      dataSharingMode: ['', [Validators.required]]
    });
  }

  onCountryChange(countryName: string) {
    this.selectedCountry.set(countryName || 'Bangladesh');
    this.basicInfoForm.patchValue({ country: countryName });
    if (countryName === 'Bangladesh') {
      this.basicInfoForm.patchValue({
        division: '',
        district: ''
      });
      this.selectedDivision.set('');
    }
  }

  onDivisionChange(divisionName: string) {
    this.selectedDivision.set(divisionName);
    this.basicInfoForm.patchValue({
      division: divisionName,
      district: ''
    });
    this.basicInfoForm.get('district')?.markAsUntouched();
  }

  // Admin Management Handlers
  addAdmin() {
    const newId = `admin-${Date.now()}`;
    this.adminsList.update(list => [...list, { id: newId, adminName: '', contactNumber: '', contactEmail: '' }]);
  }

  removeAdmin(index: number) {
    if (this.adminsList().length <= 1) return;
    this.adminsList.update(list => list.filter((_, idx) => idx !== index));
    this.validateAdmins();
  }

  updateAdminField(index: number, field: 'adminName' | 'contactNumber' | 'contactEmail', value: string) {
    this.adminsList.update(list => {
      const copy = [...list];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });

    if (index === 0) {
      if (field === 'adminName') this.basicInfoForm.patchValue({ adminName: value });
      if (field === 'contactNumber') this.basicInfoForm.patchValue({ contactNumber: value });
      if (field === 'contactEmail') this.basicInfoForm.patchValue({ contactEmail: value });
    }

    this.adminErrors.update(errs => {
      const next = { ...errs };
      delete next[`${field}_${index}`];
      return next;
    });
  }

  getAllAdmins() {
    return this.adminsList();
  }

  validateAdmins(): boolean {
    const errs: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    const contactNumRegex = /^01[3-9]\d{8}$/;

    this.adminsList().forEach((adm, idx) => {
      if (!adm.adminName || !adm.adminName.trim()) {
        errs[`adminName_${idx}`] = 'Admin Full Name is required';
      }
      if (!adm.contactNumber || !adm.contactNumber.trim()) {
        errs[`contactNumber_${idx}`] = 'Contact Number is required';
      } else if (this.selectedCountry() === 'Bangladesh' && !contactNumRegex.test(adm.contactNumber.trim())) {
        errs[`contactNumber_${idx}`] = 'Must be 11 digits starting with 013–019';
      }
      if (!adm.contactEmail || !adm.contactEmail.trim()) {
        errs[`contactEmail_${idx}`] = 'Admin Email is required';
      } else if (!emailRegex.test(adm.contactEmail.trim())) {
        errs[`contactEmail_${idx}`] = 'Valid email is required (.com, .org, etc.)';
      }
    });

    this.adminErrors.set(errs);
    return Object.keys(errs).length === 0;
  }

  loadOrganizationForEdit(orgId: string) {
    const org = this.lms.tenants().find(t => t.id === orgId || t.numericId === orgId);
    if (!org) {
      this.lms.showToast(`Organization with ID "${orgId}" not found.`, 'warning', 4000);
      return;
    }

    this.isEditMode.set(true);
    this.editingOrgId.set(org.id);

    const country = org.address?.country || 'Bangladesh';
    this.selectedCountry.set(country);

    if (org.address?.division) {
      this.selectedDivision.set(org.address.division);
    }

    // Patch basic info
    this.basicInfoForm.patchValue({
      organizationName: org.name,
      organizationId: org.numericId || org.id,
      websiteUrl: org.websiteUrl || '',
      tagline: org.branding?.tagline || '',
      description: org.description || '',
      officialEmail: org.officialEmail || org.adminEmail || '',
      commonEmail: org.commonEmail || '',
      organizationEmail: org.officialEmail || org.adminEmail || '',
      timezone: org.timezone || 'Asia/Dhaka',
      country: country,
      line1: org.address?.line1 || '',
      line2: org.address?.line2 || '',
      division: org.address?.division || '',
      district: org.address?.district || '',
      postalCode: org.address?.postalCode || '',
      adminName: org.adminInfo?.adminName || '',
      contactNumber: org.adminInfo?.contactNumber || '',
      contactEmail: org.adminInfo?.contactEmail || org.adminEmail || ''
    });

    this.adminsList.set([
      {
        id: 'admin-1',
        adminName: org.adminInfo?.adminName || 'Super Administrator',
        contactNumber: org.adminInfo?.contactNumber || '01712345678',
        contactEmail: org.adminInfo?.contactEmail || org.adminEmail || 'admin@organization.org'
      }
    ]);

    if (org.branding?.logoUrl) {
      this.logoPreview.set(org.branding.logoUrl);
      this.logoFileName.set('organization-logo.png');
    }

    // Patch resources
    if (org.resourceAllocation) {
      this.resourcesForm.patchValue({
        databaseSizeGb: org.resourceAllocation.databaseSizeGb || 250,
        fileStorageGb: org.resourceAllocation.fileStorageGb || 500,
        usageAlertThresholdPct: org.resourceAllocation.usageAlertThresholdPct || 80,
        dataSharingMode: org.resourceAllocation.dataSharingMode || 'Yes – Shared'
      });
    }

    // Mark all steps as accessible in edit mode
    this.completedSteps.set(new Set([1, 2, 3]));

    this.lms.showToast(
      `Loaded details for "${org.name}". You can modify parameters across all steps.`,
      'info',
      4500,
      'Edit Organization Mode',
      'EDIT MODE'
    );
  }

  loadDraft(draftId: string) {
    const draft = this.lms.getOrganizationDraft(draftId);
    if (!draft) return;

    this.activeDraftId.set(draft.id);

    const country = draft.basicInfo.address?.country || 'Bangladesh';
    this.selectedCountry.set(country);

    if (draft.basicInfo.address?.division) {
      this.selectedDivision.set(draft.basicInfo.address.division);
    }

    // Patch basic info
    this.basicInfoForm.patchValue({
      organizationName: draft.basicInfo.organizationName,
      organizationId: draft.basicInfo.organizationId || draft.id,
      websiteUrl: draft.basicInfo.websiteUrl || '',
      tagline: draft.basicInfo.tagline || '',
      description: draft.basicInfo.description || '',
      officialEmail: draft.basicInfo.officialEmail || draft.basicInfo.organizationEmail || '',
      commonEmail: draft.basicInfo.commonEmail || '',
      organizationEmail: draft.basicInfo.officialEmail || draft.basicInfo.organizationEmail || '',
      timezone: draft.basicInfo.timezone || 'Asia/Dhaka',
      country: country,
      line1: draft.basicInfo.address?.line1 || '',
      line2: draft.basicInfo.address?.line2 || '',
      division: draft.basicInfo.address?.division || '',
      district: draft.basicInfo.address?.district || '',
      postalCode: draft.basicInfo.address?.postalCode || '',
      adminName: draft.basicInfo.admin?.adminName || '',
      contactNumber: draft.basicInfo.admin?.contactNumber || '',
      contactEmail: draft.basicInfo.admin?.contactEmail || ''
    });

    if (draft.basicInfo.admin?.adminName || draft.basicInfo.admin?.contactEmail) {
      this.adminsList.set([
        {
          id: 'admin-1',
          adminName: draft.basicInfo.admin?.adminName || '',
          contactNumber: draft.basicInfo.admin?.contactNumber || '',
          contactEmail: draft.basicInfo.admin?.contactEmail || ''
        }
      ]);
    }

    if (draft.basicInfo.logo?.url) {
      this.logoPreview.set(draft.basicInfo.logo.url);
      this.logoFileName.set(draft.basicInfo.logo.fileName || 'logo.png');
    }

    // Patch resources
    if (draft.resources) {
      this.resourcesForm.patchValue({
        databaseSizeGb: draft.resources.databaseSizeGb || 250,
        fileStorageGb: draft.resources.fileStorageGb || 500,
        usageAlertThresholdPct: draft.resources.usageAlertThresholdPct || 80,
        dataSharingMode: draft.resources.dataSharingMode || 'Yes – Shared'
      });

      if (draft.resources.customBatches && draft.resources.customBatches.length > 0) {
        this.customBatches.set(draft.resources.customBatches);
      }
    }

    // Update completed steps
    const completed = new Set<number>();
    if (draft.lastCompletedStep === 'basic-info') {
      completed.add(1);
      this.currentStep.set(2);
    } else if (draft.lastCompletedStep === 'resources') {
      completed.add(1);
      completed.add(2);
      this.currentStep.set(3);
    } else if (draft.lastCompletedStep === 'admin') {
      completed.add(1);
      completed.add(2);
      completed.add(3);
      this.currentStep.set(4);
    }
    this.completedSteps.set(completed);

    this.lms.showToast(`Resumed draft for "${draft.basicInfo.organizationName || 'Organization'}" at Step ${this.currentStep()} of 4`, 'info', 4500, `Step ${this.currentStep()} Resumed`, `STEP ${this.currentStep()} / 4`);
  }

  // Stepper State helpers (§2)
  getStepState(stepNum: number): 'done' | 'current' | 'disabled' {
    const current = this.currentStep();
    if (stepNum === current) return 'current';
    if (this.completedSteps().has(stepNum)) return 'done';
    return 'disabled';
  }

  isStepClickable(stepNum: number): boolean {
    return this.completedSteps().has(stepNum) || stepNum === this.currentStep();
  }

  jumpToStep(stepNum: number) {
    if (this.isStepClickable(stepNum)) {
      this.formErrorAlert.set(null);
      if (this.currentStep() !== stepNum) {
        this.currentStep.set(stepNum as WizardStep);
        this.showStepAlert(stepNum as WizardStep, 'jump');
      }
    }
  }

  // Logo Upload & Drag & Drop Handling (§3.1.2)
  onLogoDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo.set(true);
  }

  onLogoDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo.set(false);
  }

  onLogoDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingLogo.set(false);
    this.logoError.set(null);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processLogoFile(files[0]);
    }
  }

  onLogoFileSelected(event: Event) {
    this.logoError.set(null);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processLogoFile(input.files[0]);
    }
  }

  private processLogoFile(file: File) {
    this.logoTouched.set(true);
    this.logoError.set(null);

    if (!this.uppy) {
      this.initUppy();
    }

    try {
      // Clear existing files from Uppy queue for single logo replacement
      const currentFiles = this.uppy.getFiles();
      currentFiles.forEach(f => this.uppy.removeFile(f.id));

      this.uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
        source: 'Local File'
      });
    } catch (err: any) {
      this.logoError.set(err?.message || 'Invalid logo file or restriction failed.');
    }
  }

  removeLogo() {
    if (this.uppy) {
      const currentFiles = this.uppy.getFiles();
      currentFiles.forEach(f => this.uppy.removeFile(f.id));
    }
    this.logoPreview.set(null);
    this.logoFileName.set(null);
    this.logoSizeKb.set(0);
    this.logoError.set(null);
  }

  // Custom batching logic for Data Sharing (§4.2.2)
  addCustomBatch() {
    const count = this.customBatches().length + 1;
    const newBatch: CustomDataSharingBatch = {
      id: `batch-${Date.now()}`,
      name: `Batch ${count}: Branch Cohort`,
      lmsInstanceIds: ['LMS-Core-01']
    };
    this.customBatches.update(list => [...list, newBatch]);
  }

  removeCustomBatch(batchIdxOrId: number | string) {
    if (this.customBatches().length <= 1) return;
    if (typeof batchIdxOrId === 'number') {
      this.customBatches.update(list => list.filter((_, idx) => idx !== batchIdxOrId));
    } else {
      this.customBatches.update(list => list.filter(b => b.id !== batchIdxOrId));
    }
  }

  toggleNodeInBatch(batchIdxOrId: number | string, nodeId: string) {
    this.customBatches.update(list => list.map((batch, idx) => {
      const match = typeof batchIdxOrId === 'number' ? idx === batchIdxOrId : batch.id === batchIdxOrId;
      if (match) {
        const exists = batch.lmsInstanceIds.includes(nodeId);
        const updated = exists 
          ? batch.lmsInstanceIds.filter(id => id !== nodeId)
          : [...batch.lmsInstanceIds, nodeId];
        return { ...batch, lmsInstanceIds: updated };
      }
      return batch;
    }));
  }

  isNodeInBatch(batchIdxOrId: number | string, nodeId: string): boolean {
    const batch = typeof batchIdxOrId === 'number' 
      ? this.customBatches()[batchIdxOrId] 
      : this.customBatches().find(b => b.id === batchIdxOrId);
    return batch ? batch.lmsInstanceIds.includes(nodeId) : false;
  }

  // Button Actions per Step (§3.4, §4.3, §5.2, §6.2)

  // 1. Cancel -> Prompt via ConfirmationModalService
  async onCancel() {
    const res = await this.modalService.confirmDiscard({
      title: 'Discard Organization Creation?',
      message: 'You have unsaved changes in this wizard. You can save your progress as a draft to resume later.'
    });
    if (res === 'draft') {
      this.onSaveAsDraft();
    } else if (res === 'discard') {
      this.router.navigate(['/tenants']);
    }
  }

  // 2. Reset -> Clear inputs on current step, stay on UI
  onReset() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();
    if (step === 1) {
      const currentOrgId = this.basicInfoForm.get('organizationId')?.value;
      this.basicInfoForm.reset({
        organizationId: currentOrgId,
        timezone: 'Asia/Dhaka',
        country: 'Bangladesh'
      });
      this.selectedCountry.set('Bangladesh');
      this.selectedDivision.set('');
      this.logoTouched.set(false);
      this.removeLogo();
    } else if (step === 2) {
      this.resourcesForm.reset({
        databaseSizeGb: 250,
        fileStorageGb: 500,
        usageAlertThresholdPct: 80,
        dataSharingMode: 'Yes – Shared'
      });
      this.customBatches.set([
        { id: 'batch-1', name: 'Batch 1: Primary Campus Nodes', lmsInstanceIds: ['LMS-Core-01', 'LMS-Branch-02'] }
      ]);
    } else if (step === 3) {
      this.adminsList.set([{ id: 'admin-1', adminName: this.basicInfoForm.get('adminName')?.value || '', contactNumber: this.basicInfoForm.get('contactNumber')?.value || '', contactEmail: this.basicInfoForm.get('contactEmail')?.value || '' }]);
      this.adminErrors.set({});
      this.adminEmailSent.set(false);
    }
    this.lms.showToast(`Step ${step} form fields have been reset.`, 'info', 4000, `Step ${step} Reset`, `STEP ${step} / 4`);
  }

  // 3. Save as draft -> Save all inputs as draft, redirect to All Organization grid (§3.4, §4.3, §5.2, §6.2)
  onSaveAsDraft() {
    const draft = this.constructDraftObject();
    this.lms.saveOrganizationDraft(draft);
    this.lms.showToast(`Draft saved at Step ${this.currentStep()} of 4 for "${draft.basicInfo.organizationName || 'Organization ID: ' + draft.id}". You can resume anytime from the organization directory.`, 'success', 5000, `Step ${this.currentStep()} Draft Saved`, `STEP ${this.currentStep()} / 4`);
    this.router.navigate(['/tenants']);
  }

  // 4. Next Step Validation & Advancement
  onNext() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      // Step 1 validation (§3.4)
      this.logoTouched.set(true);
      if (this.basicInfoForm.invalid || !this.logoPreview()) {
        this.markFormGroupTouched(this.basicInfoForm);
        this.formErrorAlert.set('All mandatory fields are not filled up. Please upload a logo and complete all required fields.');
        this.lms.showToast('Step 1 Validation: All mandatory fields are not filled up.', 'error', 4500, 'Step 1 Error', 'STEP 1 / 4');
        this.scrollToFirstError();
        return;
      }

      // Sync first admin into adminsList if adminsList has empty first item
      const bVals = this.basicInfoForm.getRawValue();
      this.adminsList.update(list => {
        const copy = [...list];
        if (copy.length > 0) {
          copy[0] = {
            ...copy[0],
            adminName: copy[0].adminName || bVals.adminName || '',
            contactNumber: copy[0].contactNumber || bVals.contactNumber || '',
            contactEmail: copy[0].contactEmail || bVals.contactEmail || ''
          };
        }
        return copy;
      });

      // Mark step 1 done & advance
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });

      this.currentStep.set(2);
      this.lms.showToast('Step 1 (Basic Information) saved. Proceeding to Step 2 of 4: Resource Allocation.', 'success', 4500, 'Step 1 Completed', 'STEP 2 / 4');
      this.scrollTop();
    } 
    else if (step === 2) {
      // Step 2 validation (§4.3)
      if (this.resourcesForm.invalid) {
        this.markFormGroupTouched(this.resourcesForm);
        this.formErrorAlert.set('All mandatory fields are not filled up.');
        this.lms.showToast('Step 2 Validation: All mandatory fields are not filled up.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      const dbSize = Number(this.resourcesForm.get('databaseSizeGb')?.value);
      const fileSize = Number(this.resourcesForm.get('fileStorageGb')?.value);
      const capacity = this.lms.platformCapacity();

      if (dbSize > capacity.dbAvailableGb) {
        this.formErrorAlert.set(`Database Size cannot exceed available DB capacity (${capacity.dbAvailableGb} GB).`);
        this.lms.showToast(`Step 2 Validation: DB Size exceeds available capacity (${capacity.dbAvailableGb} GB).`, 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      if (fileSize > capacity.fileAvailableGb) {
        this.formErrorAlert.set(`File Storage cannot exceed available storage capacity (${capacity.fileAvailableGb} GB).`);
        this.lms.showToast(`Step 2 Validation: File Storage exceeds available capacity (${capacity.fileAvailableGb} GB).`, 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      // Mark step 2 done & advance
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(2);
        return next;
      });

      this.currentStep.set(3);
      this.lms.showToast('Step 2 (Resource Allocation) saved. Proceeding to Step 3 of 4: Admin Setup.', 'success', 4500, 'Step 2 Completed', 'STEP 3 / 4');
      this.scrollTop();
    }
    else if (step === 3) {
      if (!this.validateAdmins()) {
        this.formErrorAlert.set('Please fill in all mandatory administrator fields correctly.');
        this.lms.showToast('Step 3 Validation: Invalid administrator details.', 'error', 4500, 'Step 3 Error', 'STEP 3 / 4');
        return;
      }

      // Mark step 3 done & advance to preview (§5.2)
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(3);
        return next;
      });

      this.currentStep.set(4);
      this.lms.showToast('Step 3 (Admin Setup) saved. Proceeding to Step 4 of 4: Preview & Confirm.', 'success', 4500, 'Step 3 Completed', 'STEP 4 / 4');
      this.scrollTop();
    }
  }

  // 5. Back Button (§4.3, §5.2, §6.2)
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

  // 6. Send email trigger in Admin step (§5.1, §3.3.1)
  triggerAdminNoticeEmail() {
    const adminEmail = this.basicInfoForm.get('contactEmail')?.value;
    const adminName = this.basicInfoForm.get('adminName')?.value || 'Admin';
    const orgName = this.basicInfoForm.get('organizationName')?.value || 'New Organization';
    const orgId = this.basicInfoForm.get('organizationId')?.value;

    this.lms.sendAdminSetupNoticeEmail(adminEmail, adminName, orgName);
    this.adminEmailSent.set(true);
    this.lms.showToast(`"Organization Setup In-Progress" notification dispatched to ${adminEmail}`, 'info', 4500, 'Step 3: Email Dispatched', 'STEP 3 / 4');
  }

  // 7. Step 4 Terminal Action: Create or Update Organization (§6.2)
  onCreateOrganization() {
    if (this.isEditMode() && this.editingOrgId()) {
      const existing = this.lms.tenants().find(t => t.id === this.editingOrgId());
      if (existing) {
        const bValues = this.basicInfoForm.getRawValue();
        const rValues = this.resourcesForm.getRawValue();

        const updatedTenant = {
          ...existing,
          name: bValues.organizationName || existing.name,
          websiteUrl: bValues.websiteUrl || existing.websiteUrl,
          officialEmail: bValues.officialEmail || bValues.organizationEmail || existing.officialEmail,
          commonEmail: bValues.commonEmail || existing.commonEmail,
          adminEmail: bValues.contactEmail || bValues.officialEmail || bValues.organizationEmail || existing.adminEmail,
          timezone: bValues.timezone || existing.timezone,
          description: bValues.description || existing.description,
          address: {
            country: bValues.country || this.selectedCountry() || 'Bangladesh',
            line1: bValues.line1 || existing.address?.line1 || '',
            line2: bValues.line2 || existing.address?.line2 || '',
            division: bValues.division || existing.address?.division || '',
            district: bValues.district || existing.address?.district || '',
            postalCode: bValues.postalCode || existing.address?.postalCode || ''
          },
          adminInfo: {
            adminName: this.adminsList()[0]?.adminName || bValues.adminName || existing.adminInfo?.adminName || '',
            contactNumber: this.adminsList()[0]?.contactNumber || bValues.contactNumber || existing.adminInfo?.contactNumber || '',
            contactEmail: this.adminsList()[0]?.contactEmail || bValues.contactEmail || existing.adminInfo?.contactEmail || ''
          },
          resourceAllocation: {
            databaseSizeGb: Number(rValues.databaseSizeGb) || existing.resourceAllocation?.databaseSizeGb || 250,
            fileStorageGb: Number(rValues.fileStorageGb) || existing.resourceAllocation?.fileStorageGb || 500,
            usageAlertThresholdPct: Number(rValues.usageAlertThresholdPct) || existing.resourceAllocation?.usageAlertThresholdPct || 80,
            dataSharingMode: rValues.dataSharingMode || existing.resourceAllocation?.dataSharingMode || 'Yes – Shared'
          },
          branding: {
            ...existing.branding,
            tagline: bValues.tagline || existing.branding.tagline,
            logoUrl: this.logoPreview() || existing.branding.logoUrl
          }
        };

        this.lms.updateTenant(updatedTenant);
        this.lms.showToast(`Organization "${updatedTenant.name}" has been updated successfully!`, 'success', 5000, 'Step 4 Complete: Organization Updated', 'SAVED');
        this.router.navigate(['/tenants']);
        return;
      }
    }

    const draft = this.constructDraftObject();
    const createdTenant = this.lms.createOrganizationFromWizard(draft);

    // Redirect to All Organization grid and show exact alert from §7.1:
    // "Organization has been successfully created, and under in-progress status"
    this.lms.showToast('Organization has been successfully created, and under in-progress status', 'success', 5000, 'Step 4 Complete: Organization Created', 'PROVISIONING');
    this.router.navigate(['/tenants']);
  }

  private constructDraftObject(): OrganizationDraft {
    const bValues = this.basicInfoForm.getRawValue();
    const rValues = this.resourcesForm.getRawValue();
    const orgId = bValues.organizationId || this.activeDraftId() || this.lms.generateUniqueOrgId();

    const lastStep: 'basic-info' | 'resources' | 'admin' | 'preview' = 
      this.currentStep() === 1 ? 'basic-info' :
      this.currentStep() === 2 ? 'resources' :
      this.currentStep() === 3 ? 'admin' : 'preview';

    return {
      id: orgId,
      status: 'In-Progress',
      isDraft: true,
      lastCompletedStep: lastStep,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      basicInfo: {
        organizationName: bValues.organizationName || '',
        organizationId: orgId,
        websiteUrl: bValues.websiteUrl || undefined,
        tagline: bValues.tagline || undefined,
        description: bValues.description || undefined,
        organizationEmail: bValues.officialEmail || bValues.organizationEmail || undefined,
        officialEmail: bValues.officialEmail || undefined,
        commonEmail: bValues.commonEmail || undefined,
        timezone: bValues.timezone || 'Asia/Dhaka',
        logo: this.logoPreview() ? {
          url: this.logoPreview()!,
          fileName: this.logoFileName() || 'logo.png',
          sizeBytes: this.logoSizeKb() * 1024
        } : undefined,
        address: {
          country: bValues.country || this.selectedCountry() || 'Bangladesh',
          line1: bValues.line1 || '',
          line2: bValues.line2 || '',
          division: bValues.division || '',
          district: bValues.district || '',
          postalCode: bValues.postalCode || ''
        },
        admin: {
          adminName: this.adminsList()[0]?.adminName || bValues.adminName || '',
          contactNumber: this.adminsList()[0]?.contactNumber || bValues.contactNumber || '',
          contactEmail: this.adminsList()[0]?.contactEmail || bValues.contactEmail || ''
        }
      },
      resources: {
        databaseSizeGb: rValues.databaseSizeGb || 250,
        fileStorageGb: rValues.fileStorageGb || 500,
        usageAlertThresholdPct: rValues.usageAlertThresholdPct || 80,
        dataSharingMode: rValues.dataSharingMode || 'Yes – Shared',
        customBatches: rValues.dataSharingMode === 'Custom' ? this.customBatches() : undefined
      }
    };
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  getTimezoneDisplay(storedValue: string): string {
    const match = this.timezoneOptions.find(t => t.stored === storedValue);
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
        'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
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
