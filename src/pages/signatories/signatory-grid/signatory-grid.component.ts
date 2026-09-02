import { Component, signal, computed, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Signatory, SignatoryStatus, SignatoryTemplateLink } from '../../../models/signatory.model';
import { CertificateTemplate } from '../../../models/certificate-template.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';

@Component({
  selector: 'app-signatory-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './signatory-grid.component.html'
})
export class SignatoryGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Permissions
  permissions = this.lmsData.certificateTemplatePermissions;

  // View Mode: Grid vs Table
  viewMode = signal<'grid' | 'table'>('grid');

  // Filter Drawer Open State
  isFilterPanelOpen = signal<boolean>(false);

  // Search & Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all'); // all | active | inactive | draft
  selectedDepartment = signal<string>('all');
  selectedLinkedFilter = signal<string>('all'); // all | linked | unlinked
  sortBy = signal<string>('newest'); // newest | oldest | name_asc | name_desc | most_linked
  createdFromDate = signal<string>('');
  createdToDate = signal<string>('');

  // Dropdown action menu ID for 3-dot menus
  openActionMenuId = signal<string | null>(null);

  // Modals state
  isCreateEditModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingSignatory = signal<Signatory | null>(null);

  isViewDetailsModalOpen = signal<boolean>(false);
  viewingSignatory = signal<Signatory | null>(null);

  isLinkModalOpen = signal<boolean>(false);
  linkingSignatory = signal<Signatory | null>(null);

  // Confirmation dialog state
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'deactivate' | 'reactivate' | 'delete' | null;
    confirmBtnLabel?: string;
    signatory: Signatory | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmBtnLabel: 'Yes, Proceed',
    signatory: null
  });

  // Forms
  signatoryForm!: FormGroup;
  linkForm!: FormGroup;

  // Image Upload preview & error state
  uploadedSignatureImage = signal<{
    fileUrl: string;
    fileName: string;
    mime: string;
    sizeBytes: number;
  } | null>(null);
  formSubmitted = signal<boolean>(false);
  formErrorAlert = signal<string | null>(null);
  isDragOver = signal<boolean>(false);

  // Status Filter Options for CustomSelect
  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Status: All', icon: 'filter_list' },
    { value: 'active', label: 'Active', icon: 'verified', badge: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { value: 'inactive', label: 'Inactive', icon: 'pause_circle', badge: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
    { value: 'draft', label: 'Draft', icon: 'edit_note', badge: 'Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' }
  ];

  // Linkage Filter Options for CustomSelect
  linkageOptions: SelectOption[] = [
    { value: 'all', label: 'Linkage: All', icon: 'link' },
    { value: 'linked', label: 'Linked (≥1 template)', icon: 'check_circle', badge: 'Linked', badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
    { value: 'unlinked', label: 'Unlinked (0 templates)', icon: 'link_off', badge: 'Unlinked', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' }
  ];

  // Sort Options for CustomSelect
  sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Newest First', icon: 'schedule' },
    { value: 'oldest', label: 'Oldest First', icon: 'history' },
    { value: 'name_asc', label: 'Name (A to Z)', icon: 'sort_by_alpha' },
    { value: 'name_desc', label: 'Name (Z to A)', icon: 'sort_by_alpha' },
    { value: 'most_linked', label: 'Most Linked Templates', icon: 'stacked_bar_chart' }
  ];

  // Status Form Options for Create/Edit Modal
  modalStatusOptions: SelectOption[] = [
    { value: 'active', label: 'Active', icon: 'verified', badge: 'Ready', badgeClass: 'bg-emerald-50 text-emerald-700' },
    { value: 'inactive', label: 'Inactive', icon: 'pause_circle', badge: 'Disabled', badgeClass: 'bg-rose-50 text-rose-700' },
    { value: 'draft', label: 'Draft', icon: 'edit_note', badge: 'Draft', badgeClass: 'bg-amber-50 text-amber-700' }
  ];

  ngOnInit() {
    this.initForms();

    // Check query params
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'unlinked') {
        this.selectedLinkedFilter.set('unlinked');
        this.isFilterPanelOpen.set(true);
      }
    });
  }

  private initForms() {
    this.signatoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(99)]],
      designation: ['', [Validators.required, Validators.maxLength(99)]],
      department: ['', [Validators.maxLength(99)]],
      status: ['active', [Validators.required]]
    });

    this.linkForm = this.fb.group({
      certificateTemplateId: ['', [Validators.required]],
      slotLabel: [''],
      slotRequired: [false]
    });
  }

  // Telemetry KPIs
  totalSignatoriesCount = computed(() => this.lmsData.signatories().length);
  activeSignatoriesCount = computed(() => this.lmsData.signatories().filter(s => s.status === 'active').length);
  inactiveSignatoriesCount = computed(() => this.lmsData.signatories().filter(s => s.status === 'inactive').length);
  linkedSignatoriesCount = computed(() => this.lmsData.signatories().filter(s => s.linkedTemplateCount > 0).length);
  unlinkedSignatoriesCount = computed(() => this.lmsData.signatories().filter(s => s.linkedTemplateCount === 0).length);

  // Distinct Departments list
  availableDepartments = computed(() => {
    const deps = new Set<string>();
    this.lmsData.signatories().forEach(s => {
      if (s.department) deps.add(s.department);
    });
    return Array.from(deps);
  });

  // Department Options for CustomSelect
  departmentOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: 'Department: All', icon: 'domain' },
    ...this.availableDepartments().map(dep => ({
      value: dep,
      label: dep,
      icon: 'corporate_fare'
    }))
  ]);

  // Available Certificate Templates for linking
  availableCertificateTemplates = computed(() => this.lmsData.certificateTemplates());

  // Template Options for Link CustomSelect
  templateOptions = computed<SelectOption[]>(() => [
    { value: '', label: '-- Choose Certificate Template --', icon: 'workspace_premium' },
    ...this.availableCertificateTemplates().map(t => ({
      value: t.id,
      label: t.name,
      sublabel: `${t.type} • ${t.orientation}`,
      icon: 'workspace_premium'
    }))
  ]);

  // Filtered and Sorted signatories
  filteredSignatories = computed(() => {
    let list = [...this.lmsData.signatories()];

    // Search query
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.designation.toLowerCase().includes(q) || 
        (s.department && s.department.toLowerCase().includes(q)) ||
        s.signatoryId.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.selectedStatus() !== 'all') {
      list = list.filter(s => s.status === this.selectedStatus());
    }

    // Department filter
    if (this.selectedDepartment() !== 'all') {
      list = list.filter(s => s.department === this.selectedDepartment());
    }

    // Linked status filter
    if (this.selectedLinkedFilter() === 'linked') {
      list = list.filter(s => s.linkedTemplateCount > 0);
    } else if (this.selectedLinkedFilter() === 'unlinked') {
      list = list.filter(s => s.linkedTemplateCount === 0);
    }

    // Date Range Filter
    if (this.createdFromDate()) {
      const from = new Date(this.createdFromDate()).getTime();
      if (!isNaN(from)) {
        list = list.filter(s => {
          if (!s.createdAt) return true;
          const parts = s.createdAt.split('/');
          if (parts.length === 3) {
            const d = new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
            return d >= from;
          }
          return new Date(s.createdAt).getTime() >= from;
        });
      }
    }

    if (this.createdToDate()) {
      const to = new Date(this.createdToDate()).getTime();
      if (!isNaN(to)) {
        list = list.filter(s => {
          if (!s.createdAt) return true;
          const parts = s.createdAt.split('/');
          if (parts.length === 3) {
            const d = new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
            return d <= to;
          }
          return new Date(s.createdAt).getTime() <= to;
        });
      }
    }

    // Sorting
    const sort = this.sortBy();
    if (sort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === 'most_linked') {
      list.sort((a, b) => (b.linkedTemplateCount || 0) - (a.linkedTemplateCount || 0));
    } else if (sort === 'oldest') {
      list.sort((a, b) => a.signatoryId.localeCompare(b.signatoryId));
    } else {
      // Default: newest first
      list.sort((a, b) => b.signatoryId.localeCompare(a.signatoryId));
    }

    return list;
  });

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(9);

  paginatedSignatories = computed(() => {
    const list = this.filteredSignatories();
    const page = this.currentPage();
    const size = this.pageSize();
    return list.slice((page - 1) * size, page * size);
  });

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredSignatories().length > 0) return 'none';
    if (this.lmsData.signatories().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  // Active Filter Count
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedDepartment() !== 'all') count++;
    if (this.selectedLinkedFilter() !== 'all') count++;
    if (this.sortBy() !== 'newest') count++;
    if (this.createdFromDate()) count++;
    if (this.createdToDate()) count++;
    return count;
  });

  // Has Applied Filters flag
  hasAppliedFilters = computed(() => {
    return this.activeFilterCount() > 0 || !!this.searchQuery();
  });

  toggleFilterPanel() {
    this.isFilterPanelOpen.update(v => !v);
  }

  toggleActionMenu(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.openActionMenuId.update(current => current === id ? null : id);
  }

  closeActionMenu() {
    this.openActionMenuId.set(null);
  }

  // Clear all filters
  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedDepartment.set('all');
    this.selectedLinkedFilter.set('all');
    this.sortBy.set('newest');
    this.createdFromDate.set('');
    this.createdToDate.set('');
  }

  // Open Create Modal
  openCreateModal() {
    this.isEditMode.set(false);
    this.editingSignatory.set(null);
    this.uploadedSignatureImage.set(null);
    this.formSubmitted.set(false);
    this.formErrorAlert.set(null);
    this.closeActionMenu();

    this.signatoryForm.reset({
      name: '',
      designation: '',
      department: '',
      status: 'active'
    });

    this.isCreateEditModalOpen.set(true);
  }

  // Open Edit Modal
  openEditModal(signatory: Signatory) {
    this.isEditMode.set(true);
    this.editingSignatory.set(signatory);
    this.formSubmitted.set(false);
    this.formErrorAlert.set(null);
    this.closeActionMenu();

    this.uploadedSignatureImage.set({
      fileUrl: signatory.signatureImage.fileUrl,
      fileName: signatory.signatureImage.fileName || 'signature.svg',
      mime: signatory.signatureImage.mime || 'image/png',
      sizeBytes: signatory.signatureImage.sizeBytes || 15000
    });

    this.signatoryForm.patchValue({
      name: signatory.name,
      designation: signatory.designation,
      department: signatory.department || '',
      status: signatory.status
    });

    this.isCreateEditModalOpen.set(true);
  }

  closeCreateEditModal() {
    this.isCreateEditModalOpen.set(false);
    this.editingSignatory.set(null);
    this.uploadedSignatureImage.set(null);
  }

  // File Upload Handlers (Drag & Drop + Input)
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDropFile(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
    input.value = '';
  }

  private processFile(file: File) {
    if (!file.type.includes('image')) {
      this.formErrorAlert.set('Invalid file type. Please upload a PNG, SVG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.formErrorAlert.set('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadedSignatureImage.set({
        fileUrl: e.target.result,
        fileName: file.name,
        mime: file.type,
        sizeBytes: file.size
      });
      this.formErrorAlert.set(null);
    };
    reader.readAsDataURL(file);
  }

  removeUploadedSignature() {
    this.uploadedSignatureImage.set(null);
  }

  // Save Signatory
  saveSignatory() {
    this.formSubmitted.set(true);
    this.formErrorAlert.set(null);

    if (this.signatoryForm.invalid || !this.uploadedSignatureImage()) {
      this.formErrorAlert.set('All mandatory fields and digital signature artwork are required.');
      return;
    }

    const val = this.signatoryForm.value;
    const sigImage = this.uploadedSignatureImage()!;

    if (this.isEditMode() && this.editingSignatory()) {
      const sigId = this.editingSignatory()!.signatoryId;
      this.lmsData.updateSignatory(sigId, {
        name: val.name,
        designation: val.designation,
        department: val.department,
        status: val.status as SignatoryStatus,
        signatureImage: {
          fileUrl: sigImage.fileUrl,
          fileName: sigImage.fileName,
          mime: sigImage.mime,
          sizeBytes: sigImage.sizeBytes
        }
      });
      this.lmsData.showToast(`Signatory "${val.name}" updated successfully.`, 'success');
    } else {
      this.lmsData.createSignatory({
        name: val.name,
        designation: val.designation,
        department: val.department,
        status: val.status as SignatoryStatus,
        signatureImage: {
          fileUrl: sigImage.fileUrl,
          fileName: sigImage.fileName,
          mime: sigImage.mime,
          sizeBytes: sigImage.sizeBytes
        }
      });
      this.lmsData.showToast(`Signatory "${val.name}" registered successfully.`, 'success');
    }

    this.closeCreateEditModal();
  }

  // View Details Modal
  openViewDetails(signatory: Signatory) {
    this.viewingSignatory.set(signatory);
    this.isViewDetailsModalOpen.set(true);
    this.closeActionMenu();
  }

  closeViewDetailsModal() {
    this.isViewDetailsModalOpen.set(false);
    this.viewingSignatory.set(null);
  }

  getLinkedTemplatesForViewing() {
    const sig = this.viewingSignatory();
    if (!sig) return [];
    return this.lmsData.getLinkedTemplatesForSignatory(sig.signatoryId);
  }

  // Link to Template Modal
  openLinkModal(signatory: Signatory) {
    this.linkingSignatory.set(signatory);
    this.linkForm.reset({
      certificateTemplateId: '',
      slotLabel: signatory.designation,
      slotRequired: false
    });
    this.isLinkModalOpen.set(true);
    this.closeActionMenu();
  }

  closeLinkModal() {
    this.isLinkModalOpen.set(false);
    this.linkingSignatory.set(null);
  }

  submitLinkTemplate() {
    if (this.linkForm.invalid || !this.linkingSignatory()) return;

    const sigId = this.linkingSignatory()!.signatoryId;
    const val = this.linkForm.value;

    const success = this.lmsData.linkSignatoryToTemplate(
      sigId, 
      val.certificateTemplateId, 
      val.slotLabel, 
      val.slotRequired
    );

    if (success) {
      this.closeLinkModal();
    }
  }

  unlinkTemplate(signatoryId: string, templateId: string) {
    this.lmsData.unlinkSignatoryFromTemplate(signatoryId, templateId);
  }

  // Confirmation Dialog Actions
  confirmDeactivate(signatory: Signatory) {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Signatory',
      message: `Are you sure you want to deactivate ${signatory.name}? Inactive signatories will remain on already-issued certificates but cannot be chosen for new certificate templates.`,
      action: 'deactivate',
      confirmBtnLabel: 'Deactivate',
      signatory
    });
  }

  confirmReactivate(signatory: Signatory) {
    this.closeActionMenu();
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Signatory',
      message: `Are you sure you want to reactivate ${signatory.name}? Active signatories will immediately be available for linking across certificate templates.`,
      action: 'reactivate',
      confirmBtnLabel: 'Reactivate',
      signatory
    });
  }

  confirmDelete(signatory: Signatory) {
    this.closeActionMenu();
    if (signatory.linkedTemplateCount > 0) {
      this.lmsData.showToast(`This signatory is linked to ${signatory.linkedTemplateCount} certificate template(s) and cannot be deleted. Unlink or deactivate it first.`, 'error', 5000, 'Deletion Blocked');
      return;
    }

    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Signatory',
      message: `Are you sure you want to delete ${signatory.name} (${signatory.signatoryId})? This action is permanent and cannot be undone.`,
      action: 'delete',
      confirmBtnLabel: 'Delete Signatory',
      signatory
    });
  }

  closeConfirmDialog() {
    this.confirmDialog.update(d => ({ ...d, isOpen: false, action: null, signatory: null }));
  }

  executeConfirmAction() {
    const dialog = this.confirmDialog();
    if (!dialog.signatory || !dialog.action) return;

    const sigId = dialog.signatory.signatoryId;

    if (dialog.action === 'deactivate') {
      this.lmsData.deactivateSignatory(sigId);
    } else if (dialog.action === 'reactivate') {
      this.lmsData.reactivateSignatory(sigId);
    } else if (dialog.action === 'delete') {
      this.lmsData.deleteSignatory(sigId);
    }

    this.closeConfirmDialog();
  }
}

