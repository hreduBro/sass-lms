import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import {
  TIMEZONE_OPTIONS,
  DIVISION_DISTRICTS_MAP,
  DIVISIONS_LIST,
  OrganizationDraft,
  DataSharingMode,
  CustomDataSharingBatch
} from '../../models/organization.model';

export type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-organization-create',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './organization-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  lms = inject(LmsDataService);

  // Stepper State
  currentStep = signal<WizardStep>(1);
  completedSteps = signal<Set<number>>(new Set<number>());

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
  selectedDivision = signal<string>('');
  
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
  logoError = signal<string | null>(null);

  // Form error alerts
  formErrorAlert = signal<string | null>(null);
  successAlert = signal<string | null>(null);

  // Admin notification email test status
  adminEmailSent = signal<boolean>(false);

  // Draft mode tracking
  activeDraftId = signal<string | null>(null);

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
    
    // Check if resuming an existing draft via query param ?draftId=...
    this.route.queryParams.subscribe(params => {
      if (params['draftId']) {
        this.loadDraft(params['draftId']);
      } else {
        // Generate new random 4-digit unique numeric ID
        const generatedId = this.lms.generateUniqueOrgId();
        this.basicInfoForm.patchValue({
          organizationId: generatedId
        });
      }
    });
  }

  ngOnDestroy() {
    // Keep active tenant theme persistent
  }

  /**
   * Applies the current active LMS organization's theme preset & colors
   */
  private ensureActiveTenantTheme() {
    const active = this.lms.activeTenant();
    if (active && active.branding) {
      this.lms.applyTenantTheme(
        active.branding.primaryColor,
        active.branding.accentColor,
        active.branding.faviconUrl,
        active.name,
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
      organizationEmail: ['', [Validators.pattern(emailRegex)]],
      timezone: ['Asia/Dhaka'], // Default suggested: Dhaka (UTC+06:00)
      
      // Organization Location / Address (§3.2)
      line1: ['', [Validators.required, Validators.maxLength(150)]],
      line2: ['', [Validators.maxLength(150)]],
      division: ['', [Validators.required]],
      district: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(postalRegex)]],

      // Organization Admin Information (§3.3)
      adminName: ['', [Validators.required, Validators.maxLength(99)]],
      contactNumber: ['', [Validators.required, Validators.pattern(contactNumRegex)]],
      contactEmail: ['', [Validators.required, Validators.pattern(emailRegex)]]
    });

    // When division changes, update selectedDivision signal and reset district selection
    this.basicInfoForm.get('division')?.valueChanges.subscribe((divVal) => {
      this.selectedDivision.set(divVal || '');
    });

    // Step 2: Resources Form (§4.2)
    this.resourcesForm = this.fb.group({
      databaseSizeGb: [250, [Validators.required, Validators.min(1)]],
      fileStorageGb: [500, [Validators.required, Validators.min(1)]],
      usageAlertThresholdPct: [80, [Validators.required, Validators.min(1), Validators.max(100)]],
      dataSharingMode: ['Yes – Shared' as DataSharingMode, [Validators.required]]
    });
  }

  onDivisionChange(divisionName: string) {
    this.selectedDivision.set(divisionName);
    this.basicInfoForm.patchValue({
      division: divisionName,
      district: ''
    });
    this.basicInfoForm.get('district')?.markAsUntouched();
  }

  loadDraft(draftId: string) {
    const draft = this.lms.getOrganizationDraft(draftId);
    if (!draft) return;

    this.activeDraftId.set(draft.id);

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
      organizationEmail: draft.basicInfo.organizationEmail || '',
      timezone: draft.basicInfo.timezone || 'Asia/Dhaka',
      line1: draft.basicInfo.address?.line1 || '',
      line2: draft.basicInfo.address?.line2 || '',
      division: draft.basicInfo.address?.division || '',
      district: draft.basicInfo.address?.district || '',
      postalCode: draft.basicInfo.address?.postalCode || '',
      adminName: draft.basicInfo.admin?.adminName || '',
      contactNumber: draft.basicInfo.admin?.contactNumber || '',
      contactEmail: draft.basicInfo.admin?.contactEmail || ''
    });

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
    } else if (draft.lastCompletedStep === 'resources') {
      completed.add(1);
      completed.add(2);
    } else if (draft.lastCompletedStep === 'admin') {
      completed.add(1);
      completed.add(2);
      completed.add(3);
    }
    this.completedSteps.set(completed);

    this.lms.showToast(`Resumed draft for "${draft.basicInfo.organizationName || 'Organization'}"`, 'info');
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
      this.currentStep.set(stepNum as WizardStep);
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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.logoError.set('Invalid format. Allowed formats: PNG, JPG, JPEG, SVG, WebP.');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      this.logoError.set('File size exceeds 5 MB limit.');
      return;
    }

    this.logoFileName.set(file.name);
    this.logoSizeKb.set(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
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

  removeCustomBatch(id: string) {
    if (this.customBatches().length <= 1) return;
    this.customBatches.update(list => list.filter(b => b.id !== id));
  }

  toggleNodeInBatch(batchId: string, nodeId: string) {
    this.customBatches.update(list => list.map(batch => {
      if (batch.id === batchId) {
        const exists = batch.lmsInstanceIds.includes(nodeId);
        const updated = exists 
          ? batch.lmsInstanceIds.filter(id => id !== nodeId)
          : [...batch.lmsInstanceIds, nodeId];
        return { ...batch, lmsInstanceIds: updated };
      }
      return batch;
    }));
  }

  // Button Actions per Step (§3.4, §4.3, §5.2, §6.2)

  // 1. Cancel -> Redirect to All Organization grid (no save)
  onCancel() {
    this.router.navigate(['/tenants']);
  }

  // 2. Reset -> Clear inputs on current step, stay on UI
  onReset() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();
    if (step === 1) {
      const currentOrgId = this.basicInfoForm.get('organizationId')?.value;
      this.basicInfoForm.reset({
        organizationId: currentOrgId,
        timezone: 'Asia/Dhaka'
      });
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
      this.adminEmailSent.set(false);
    }
  }

  // 3. Save as draft -> Save all inputs as draft, redirect to All Organization grid (§3.4, §4.3, §5.2, §6.2)
  onSaveAsDraft() {
    const draft = this.constructDraftObject();
    this.lms.saveOrganizationDraft(draft);
    this.lms.showToast(`Draft for "${draft.basicInfo.organizationName || 'Organization ID: ' + draft.id}" saved successfully. You can resume anytime from the organization directory.`, 'success');
    this.router.navigate(['/tenants']);
  }

  // 4. Next Step Validation & Advancement
  onNext() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      // Step 1 validation (§3.4)
      if (this.basicInfoForm.invalid) {
        this.markFormGroupTouched(this.basicInfoForm);
        this.formErrorAlert.set('All mandatory fields are not filled up.');
        return;
      }

      // Mark step 1 done & advance
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });

      this.currentStep.set(2);
      this.lms.showToast('Organization Details have been saved successfully.', 'success');
      this.scrollTop();
    } 
    else if (step === 2) {
      // Step 2 validation (§4.3)
      if (this.resourcesForm.invalid) {
        this.markFormGroupTouched(this.resourcesForm);
        this.formErrorAlert.set('All mandatory fields are not filled up.');
        return;
      }

      const dbSize = Number(this.resourcesForm.get('databaseSizeGb')?.value);
      const fileSize = Number(this.resourcesForm.get('fileStorageGb')?.value);
      const capacity = this.lms.platformCapacity();

      if (dbSize > capacity.dbAvailableGb) {
        this.formErrorAlert.set(`Database Size cannot exceed available DB capacity (${capacity.dbAvailableGb} GB).`);
        return;
      }

      if (fileSize > capacity.fileAvailableGb) {
        this.formErrorAlert.set(`File Storage cannot exceed available storage capacity (${capacity.fileAvailableGb} GB).`);
        return;
      }

      // Mark step 2 done & advance
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(2);
        return next;
      });

      this.currentStep.set(3);
      this.lms.showToast('Resource Allocation has been saved successfully.', 'success');
      this.scrollTop();
    }
    else if (step === 3) {
      // Mark step 3 done & advance to preview (§5.2)
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(3);
        return next;
      });

      this.currentStep.set(4);
      this.lms.showToast('Admin Setup has been saved successfully.', 'success');
      this.scrollTop();
    }
  }

  // 5. Back Button (§4.3, §5.2, §6.2)
  onBack() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();
    if (step > 1) {
      this.currentStep.set((step - 1) as WizardStep);
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
    this.lms.showToast(`"Organization Setup In-Progress" notification dispatched to ${adminEmail}`, 'info');
  }

  // 7. Step 4 Terminal Action: Create Organization (§6.2)
  onCreateOrganization() {
    const draft = this.constructDraftObject();
    const createdTenant = this.lms.createOrganizationFromWizard(draft);

    // Redirect to All Organization grid and show exact alert from §7.1:
    // "Organization has been successfully created, and under in-progress status"
    this.lms.showToast('Organization has been successfully created, and under in-progress status', 'success', 5000);
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
        organizationEmail: bValues.organizationEmail || undefined,
        timezone: bValues.timezone || 'Asia/Dhaka',
        logo: this.logoPreview() ? {
          url: this.logoPreview()!,
          fileName: this.logoFileName() || 'logo.png',
          sizeBytes: this.logoSizeKb() * 1024
        } : undefined,
        address: {
          line1: bValues.line1 || '',
          line2: bValues.line2 || '',
          division: bValues.division || '',
          district: bValues.district || '',
          postalCode: bValues.postalCode || ''
        },
        admin: {
          adminName: bValues.adminName || '',
          contactNumber: bValues.contactNumber || '',
          contactEmail: bValues.contactEmail || ''
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
}
