import { Component, signal, computed, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Signatory, SignatoryStatus, SignatoryTemplateLink } from '../../../models/signatory.model';
import { CertificateTemplate } from '../../../models/certificate-template.model';

@Component({
  selector: 'app-signatory-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './signatory-grid.component.html'
})
export class SignatoryGridComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Search & Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all'); // all | active | inactive | draft
  selectedDepartment = signal<string>('all');
  selectedLinkedFilter = signal<string>('all'); // all | linked | unlinked
  createdFromDate = signal<string>('');
  createdToDate = signal<string>('');

  // Active Tab / View
  activeTab = signal<'all' | 'active' | 'inactive' | 'unlinked'>('all');

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
    signatory: Signatory | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
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

  ngOnInit() {
    this.initForms();

    // Check query params
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'unlinked') {
        this.selectedLinkedFilter.set('unlinked');
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
  unlinkedSignatoriesCount = computed(() => this.lmsData.signatories().filter(s => s.linkedTemplateCount === 0).length);

  // Distinct Departments list
  availableDepartments = computed(() => {
    const deps = new Set<string>();
    this.lmsData.signatories().forEach(s => {
      if (s.department) deps.add(s.department);
    });
    return Array.from(deps);
  });

  // Available Certificate Templates for linking
  availableCertificateTemplates = computed(() => this.lmsData.certificateTemplates());

  // Filtered signatories
  filteredSignatories = computed(() => {
    let list = this.lmsData.signatories();

    // Search query
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.designation.toLowerCase().includes(q) || 
        (s.department && s.department.toLowerCase().includes(q))
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

    return list;
  });

  // Empty state type detection
  hasAppliedFilters = computed(() => {
    return this.selectedStatus() !== 'all' || 
           this.selectedDepartment() !== 'all' || 
           this.selectedLinkedFilter() !== 'all' ||
           !!this.createdFromDate() || 
           !!this.createdToDate();
  });

  // Open Create Modal
  openCreateModal() {
    this.isEditMode.set(false);
    this.editingSignatory.set(null);
    this.uploadedSignatureImage.set(null);
    this.formSubmitted.set(false);
    this.formErrorAlert.set(null);

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
      this.formErrorAlert.set('All mandatory fields are not filled up.');
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
    }

    this.closeCreateEditModal();
  }

  // View Details Modal
  openViewDetails(signatory: Signatory) {
    this.viewingSignatory.set(signatory);
    this.isViewDetailsModalOpen.set(true);
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
    this.confirmDialog.set({
      isOpen: true,
      title: 'Deactivate Signatory',
      message: `Are you sure to deactivate this signatory (${signatory.name})? Inactive signatories cannot be newly linked to certificate templates.`,
      action: 'deactivate',
      signatory
    });
  }

  confirmReactivate(signatory: Signatory) {
    this.confirmDialog.set({
      isOpen: true,
      title: 'Reactivate Signatory',
      message: `Are you sure to reactivate this signatory (${signatory.name})? Active signatories can be linked across certificate templates.`,
      action: 'reactivate',
      signatory
    });
  }

  confirmDelete(signatory: Signatory) {
    if (signatory.linkedTemplateCount > 0) {
      this.lmsData.showToast(`This signatory is linked to ${signatory.linkedTemplateCount} certificate template(s) and cannot be deleted. Unlink or deactivate it first.`, 'error', 5000, 'Deletion Blocked');
      return;
    }

    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Signatory',
      message: `Are you sure to delete this signatory (${signatory.name})? This action is permanent and cannot be undone.`,
      action: 'delete',
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

  // Reset Filters & Search
  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedDepartment.set('all');
    this.selectedLinkedFilter.set('all');
    this.createdFromDate.set('');
    this.createdToDate.set('');
  }
}
