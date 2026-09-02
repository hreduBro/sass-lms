import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';
import { CustomSelectComponent } from '../../../components/custom-select/custom-select.component';
import {
  CertificateTemplate,
  CanvasElement,
  CanvasElementKind,
  CertificateType,
  CertificateOrientation,
  CertificatePaperSize,
  CertificateSharingLevel,
  PlaceholderTokenDef,
  PLACEHOLDER_TOKENS,
  SUPPORTED_FONTS,
  CANVAS_SIZE_MAP
} from '../../../models/certificate-template.model';

export const SAMPLE_BACKGROUND_PRESETS = [
  {
    name: 'Executive Gold Parchment',
    url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80',
    type: 'Parchment with Classic Border'
  },
  {
    name: 'Modern Navy & Cyan Geo',
    url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1600&q=80',
    type: 'Contemporary Geometric'
  },
  {
    name: 'Emerald Botanical Resilience',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80',
    type: 'Eco & Community Certificate'
  },
  {
    name: 'Clean Academic Cream',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    type: 'Formal Academic Minimal'
  },
  {
    name: 'Silver Tech Grid',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
    type: 'Technical & Engineering'
  }
];

@Component({
  selector: 'app-certificate-template-create',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StepperComponent,
    CustomSelectComponent
  ],
  templateUrl: './template-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificateTemplateCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmModal = inject(ConfirmationModalService);

  // Stepper definition
  wizardSteps: StepperStep[] = [
    { id: 1, shortTitle: 'Details', title: 'Background & Details', sublabel: 'Identity & dimensions', icon: 'image' },
    { id: 2, shortTitle: 'Designer', title: 'Visual Designer', sublabel: 'Canvas & placeholders', icon: 'design_services' },
    { id: 3, shortTitle: 'Publish', title: 'Preview & Publish', sublabel: 'Review & activate', icon: 'verified' }
  ];

  currentStep = signal<number>(1);
  formErrorAlert = signal<string | null>(null);
  showWelcomeAlert = signal<boolean>(true);
  completedSteps = signal<Set<number>>(new Set<number>());
  errors = signal<Record<string, string>>({});

  credentialTypeOptions = [
    { value: 'Achievement', label: 'Certificate of Achievement', icon: 'workspace_premium' },
    { value: 'Completion', label: 'Certificate of Completion', icon: 'verified' },
    { value: 'Professional', label: 'Professional Accreditation', icon: 'card_membership' },
    { value: 'Merit', label: 'Honor & Merit Award', icon: 'stars' },
    { value: 'Participation', label: 'Participation & Attendance', icon: 'assignment_turned_in' },
    { value: 'Compliance', label: 'Regulatory Compliance', icon: 'gavel' }
  ];

  fontOptions = [
    { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display (Serif)', icon: 'font_download' },
    { value: "'Cinzel', serif", label: 'Cinzel (Formal Trajan)', icon: 'font_download' },
    { value: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta Sans', icon: 'font_download' },
    { value: "'Montserrat', sans-serif", label: 'Montserrat', icon: 'font_download' },
    { value: "'Inter', sans-serif", label: 'Inter (Modern Sans)', icon: 'font_download' },
    { value: "'Courier Prime', monospace", label: 'Courier Prime (Monospace)', icon: 'font_download' }
  ];

  isEditMode = signal<boolean>(false);
  templateIdToEdit = signal<string | null>(null);

  // Background Presets
  backgroundPresets = SAMPLE_BACKGROUND_PRESETS;
  tokensList: PlaceholderTokenDef[] = PLACEHOLDER_TOKENS;
  fontsList = SUPPORTED_FONTS;

  // Selected background image state
  backgroundUrl = signal<string>('https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1600&q=80');
  backgroundFileName = signal<string>('brac_gold_border_parchment.png');
  customBackgroundUrl = signal<string | null>(null);
  customBackgroundName = signal<string | null>(null);
  isDraggingFile = signal<boolean>(false);

  // Canvas elements state
  elements = signal<CanvasElement[]>([]);
  selectedElementId = signal<string | null>(null);

  // Undo / Redo history
  history = signal<CanvasElement[][]>([]);
  historyIndex = signal<number>(-1);

  // Canvas View Controls
  zoomLevel = signal<number>(100);
  showGrid = signal<boolean>(true);
  snapToGrid = signal<boolean>(true);
  previewSampleData = signal<boolean>(false); // in designer step

  // Step 3 preview toggle
  previewSampleDataStep3 = signal<boolean>(true);

  // Form for Step 1
  detailsForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(99)]],
    description: ['', [Validators.maxLength(255)]],
    type: ['Achievement', [Validators.required]],
    orientation: ['landscape', [Validators.required]],
    paperSize: ['A4', [Validators.required]],
    sharingLevel: ['lms', [Validators.required]]
  });

  // Selected element computed
  selectedElement = computed<CanvasElement | null>(() => {
    const id = this.selectedElementId();
    if (!id) return null;
    return this.elements().find(e => e.id === id) || null;
  });

  // Permissions
  permissions = this.lms.certificateTemplatePermissions;

  // Categories of tokens
  tokenCategories = computed(() => {
    const cats: Record<string, PlaceholderTokenDef[]> = {};
    for (const t of this.tokensList) {
      if (!cats[t.category]) cats[t.category] = [];
      cats[t.category].push(t);
    }
    return cats;
  });

  // Category Keys
  categoryKeys = computed(() => Object.keys(this.tokenCategories()));

  ngOnInit() {
    // Check if editing existing template
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const existing = this.lms.getCertificateTemplateById(id);
      if (existing) {
        this.isEditMode.set(true);
        this.templateIdToEdit.set(id);
        this.populateFromExisting(existing);
        this.completedSteps.set(new Set<number>([1]));
      } else {
        this.lms.showToast(`Template "${id}" not found. Starting new template.`, 'warning');
        this.initDefaultElements();
      }
    } else {
      this.initDefaultElements();
    }

    // Subscribe to form value changes to clear validation errors dynamically
    this.detailsForm.valueChanges.subscribe(() => {
      const currentErrors = { ...this.errors() };
      const name = this.detailsForm.get('name')?.value || '';
      const type = this.detailsForm.get('type')?.value || '';

      if (name && name.trim() && name.trim().length <= 99) {
        delete currentErrors['name'];
      }
      if (type) {
        delete currentErrors['type'];
      }
      this.errors.set(currentErrors);

      if (Object.keys(currentErrors).length === 0) {
        this.formErrorAlert.set(null);
      }
    });

    this.pushHistoryState();
    this.showStepAlert(1, 'entered');
  }

  private initDefaultElements() {
    const defaultElements: CanvasElement[] = [
      {
        id: 'el-title-01',
        kind: 'static-text',
        text: 'CERTIFICATE OF ACHIEVEMENT',
        x: 10,
        y: 20,
        w: 80,
        h: 7,
        z: 1,
        style: {
          fontFamily: 'Cinzel, serif',
          fontSizePt: 28,
          bold: true,
          italic: false,
          underline: false,
          color: '#1e293b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-sub-02',
        kind: 'static-text',
        text: 'THIS CREDENTIAL IS PROUDLY CONFERRED UPON',
        x: 15,
        y: 30,
        w: 70,
        h: 4,
        z: 2,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 12,
          bold: false,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-name-03',
        kind: 'placeholder',
        token: '{{trainee_name}}',
        x: 15,
        y: 36,
        w: 70,
        h: 11,
        z: 3,
        style: {
          fontFamily: 'Playfair Display, serif',
          fontSizePt: 36,
          bold: true,
          italic: false,
          underline: false,
          color: '#0f172a',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-for-04',
        kind: 'static-text',
        text: 'For successfully demonstrating operational mastery and fulfilling all requirements of',
        x: 15,
        y: 50,
        w: 70,
        h: 5,
        z: 4,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 12,
          bold: false,
          italic: false,
          underline: false,
          color: '#475569',
          align: 'center',
          overflow: 'wrap'
        }
      },
      {
        id: 'el-course-05',
        kind: 'placeholder',
        token: '{{course_name}}',
        x: 12,
        y: 57,
        w: 76,
        h: 9,
        z: 5,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 20,
          bold: true,
          italic: false,
          underline: false,
          color: '#0369a1',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-date-07',
        kind: 'placeholder',
        token: '{{issue_date}}',
        x: 10,
        y: 80,
        w: 25,
        h: 6,
        z: 6,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSizePt: 12,
          bold: true,
          italic: false,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-sig-08',
        kind: 'placeholder',
        token: '{{signatory_name}}',
        x: 65,
        y: 80,
        w: 25,
        h: 6,
        z: 7,
        style: {
          fontFamily: 'Playfair Display, serif',
          fontSizePt: 13,
          bold: true,
          italic: true,
          underline: false,
          color: '#334155',
          align: 'center',
          overflow: 'fit'
        }
      },
      {
        id: 'el-serial-09',
        kind: 'placeholder',
        token: '{{certificate_serial}}',
        x: 35,
        y: 88,
        w: 30,
        h: 4,
        z: 8,
        style: {
          fontFamily: 'Courier Prime, monospace',
          fontSizePt: 9,
          bold: false,
          italic: false,
          underline: false,
          color: '#64748b',
          align: 'center',
          overflow: 'fit'
        }
      }
    ];

    this.elements.set(defaultElements);
    this.selectedElementId.set('el-name-03');
  }

  private populateFromExisting(t: CertificateTemplate) {
    this.detailsForm.patchValue({
      name: t.name,
      description: t.description || '',
      type: t.type,
      orientation: t.orientation,
      paperSize: t.paperSize,
      sharingLevel: t.sharing.level
    });

    if (t.background?.fileUrl) {
      this.backgroundUrl.set(t.background.fileUrl);
      this.backgroundFileName.set(t.background.fileName || 'custom-background.png');
      const isPreset = SAMPLE_BACKGROUND_PRESETS.some(p => p.url === t.background?.fileUrl);
      if (!isPreset) {
        this.customBackgroundUrl.set(t.background.fileUrl);
        this.customBackgroundName.set(t.background.fileName || 'custom-background.png');
      }
    }

    if (t.elements && t.elements.length > 0) {
      this.elements.set(JSON.parse(JSON.stringify(t.elements)));
      this.selectedElementId.set(t.elements[0].id);
    }
  }

  // Preset background select
  selectPresetBackground(preset: { name: string; url: string; type: string }) {
    this.backgroundUrl.set(preset.url);
    this.backgroundFileName.set(`${preset.name.toLowerCase().replace(/\s+/g, '_')}.png`);
    this.lms.showToast(`Applied preset background: "${preset.name}"`, 'info');
  }

  // Custom background select
  selectCustomBackground() {
    const url = this.customBackgroundUrl();
    const name = this.customBackgroundName();
    if (url) {
      this.backgroundUrl.set(url);
      if (name) {
        this.backgroundFileName.set(name);
      }
      this.lms.showToast('Applied custom uploaded background', 'info');
    }
  }

  // File upload handlers
  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDraggingFile.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDraggingFile.set(false);
  }

  onDropFile(e: DragEvent) {
    e.preventDefault();
    this.isDraggingFile.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleUploadedFile(e.dataTransfer.files[0]);
    }
  }

  onFileInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleUploadedFile(target.files[0]);
    }
    target.value = '';
  }

  private handleUploadedFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.lms.showToast('Please upload a valid image file (PNG, JPG, SVG, WebP).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.lms.showToast('Image size exceeds 10MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        this.backgroundUrl.set(dataUrl);
        this.backgroundFileName.set(file.name);
        this.customBackgroundUrl.set(dataUrl);
        this.customBackgroundName.set(file.name);
        this.lms.showToast(`Uploaded background image "${file.name}"`, 'success');
      }
    };
    reader.readAsDataURL(file);
  }

  // Navigation between steps
  goToStep(stepId: number) {
    if (stepId > this.currentStep()) {
      // Validate up to the targeted step
      if (this.currentStep() === 1 && stepId > 1) {
        if (!this.validateStep1()) {
          this.formErrorAlert.set('Mandatory details are missing or invalid.');
          this.scrollToFirstError();
          return;
        }
      }
    }
    this.currentStep.set(stepId);
    this.formErrorAlert.set(null);
    this.scrollTop();
    this.showStepAlert(stepId, 'jump');
  }

  nextStep() {
    if (this.currentStep() === 1) {
      if (!this.validateStep1()) {
        this.formErrorAlert.set('Mandatory details are missing or invalid.');
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(set => {
        const copy = new Set(set);
        copy.add(1);
        return copy;
      });
      this.currentStep.set(2);
      this.formErrorAlert.set(null);
      this.scrollTop();
      this.showStepAlert(2, 'completed');
    } else if (this.currentStep() === 2) {
      this.completedSteps.update(set => {
        const copy = new Set(set);
        copy.add(1);
        copy.add(2);
        return copy;
      });
      this.currentStep.set(3);
      this.formErrorAlert.set(null);
      this.scrollTop();
      this.showStepAlert(3, 'completed');
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      const prev = this.currentStep() - 1;
      this.currentStep.set(prev);
      this.formErrorAlert.set(null);
      this.scrollTop();
      this.showStepAlert(prev, 'back');
    }
  }

  private validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    const name = this.detailsForm.get('name')?.value || '';
    const type = this.detailsForm.get('type')?.value || '';

    if (!name || !name.trim()) {
      newErrors['name'] = 'Template Name is mandatory.';
    } else if (name.trim().length > 99) {
      newErrors['name'] = 'Template Name must not exceed 99 characters.';
    }

    if (!type) {
      newErrors['type'] = 'Credential classification / type is mandatory.';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      this.detailsForm.markAllAsTouched();
      this.formErrorAlert.set('All mandatory fields are not filled up. Please correct the highlighted errors.');
      this.scrollToFirstError();
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
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
        'input.border-rose-500, select.border-rose-500, textarea.border-rose-500, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner, app-custom-select [data-error="true"]'
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

  private showStepAlert(step: number, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<number, string> = {
      1: 'Step 1 of 3: Background & Details',
      2: 'Step 2 of 3: Visual Designer',
      3: 'Step 3 of 3: Preview & Publish'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 3 — Background & Details: Set template name, paper standard, sharing level, and certificate artwork.',
      2: 'Step 2 of 3 — Visual Designer: Position placeholder tokens, custom text labels, and style typography on the canvas.',
      3: 'Step 3 of 3 — Preview & Publish: Review final rendering layout before activating across OneLMS.'
    };

    let title = stepTitles[step];
    let badge = `STEP ${step} / 3`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step];
    if (action === 'completed') {
      const prev = (step - 1);
      const prevName = stepTitles[prev].split(': ')[1];
      const nextName = stepTitles[step].split(': ')[1];
      title = `Step ${prev} Saved Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevName}) completed. Now on Step ${step} of 3: ${nextName}.`;
      type = 'success';
    } else if (action === 'back') {
      msg = `Navigated back to Step ${step} of 3 (${stepTitles[step].split(': ')[1]}).`;
      type = 'info';
    } else if (action === 'jump') {
      msg = `Active: Step ${step} of 3 (${stepTitles[step].split(': ')[1]}).`;
      type = 'info';
    }

    this.lms.showToast(msg, type, 4000, title, badge);
  }

  // =========================================================================
  // Canvas & Element Operations
  // =========================================================================
  addPlaceholderToken(token: PlaceholderTokenDef) {
    const newId = `el-token-${Date.now().toString().slice(-4)}`;
    const newElement: CanvasElement = {
      id: newId,
      kind: 'placeholder',
      token: token.key,
      x: 20,
      y: 40 + (this.elements().length % 5) * 6,
      w: 60,
      h: 8,
      z: this.elements().length + 1,
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSizePt: token.defaultStyle?.fontSizePt || 16,
        bold: token.defaultStyle?.bold ?? false,
        italic: false,
        underline: false,
        color: token.defaultStyle?.color || '#0f172a',
        align: token.defaultStyle?.align || 'center',
        overflow: 'fit'
      }
    };

    this.elements.update(list => [...list, newElement]);
    this.selectedElementId.set(newId);
    this.pushHistoryState();
    this.lms.showToast(`Added token ${token.key}`, 'info');
  }

  addStaticText() {
    const newId = `el-text-${Date.now().toString().slice(-4)}`;
    const newElement: CanvasElement = {
      id: newId,
      kind: 'static-text',
      text: 'Enter static certificate text here',
      x: 20,
      y: 45,
      w: 60,
      h: 6,
      z: this.elements().length + 1,
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSizePt: 14,
        bold: false,
        italic: false,
        underline: false,
        color: '#334155',
        align: 'center',
        overflow: 'wrap'
      }
    };

    this.elements.update(list => [...list, newElement]);
    this.selectedElementId.set(newId);
    this.pushHistoryState();
    this.lms.showToast('Added static text block', 'info');
  }

  selectElement(el: CanvasElement, e?: MouseEvent) {
    if (e) e.stopPropagation();
    this.selectedElementId.set(el.id);
  }

  deselectAll() {
    this.selectedElementId.set(null);
  }

  deleteSelectedElement() {
    const id = this.selectedElementId();
    if (!id) return;
    this.elements.update(list => list.filter(e => e.id !== id));
    this.selectedElementId.set(null);
    this.pushHistoryState();
    this.lms.showToast('Element removed', 'info');
  }

  deleteElementById(id: string, e: MouseEvent) {
    e.stopPropagation();
    this.elements.update(list => list.filter(el => el.id !== id));
    if (this.selectedElementId() === id) {
      this.selectedElementId.set(null);
    }
    this.pushHistoryState();
  }

  updateSelectedStyle(updates: Partial<CanvasElement['style']>) {
    const id = this.selectedElementId();
    if (!id) return;
    this.elements.update(list => list.map(e => {
      if (e.id === id) {
        return {
          ...e,
          style: { ...e.style, ...updates }
        };
      }
      return e;
    }));
    this.pushHistoryState();
  }

  updateSelectedPosition(prop: 'x' | 'y' | 'w' | 'h', val: number) {
    const id = this.selectedElementId();
    if (!id) return;
    const clamped = Math.max(1, Math.min(99, val));
    this.elements.update(list => list.map(e => {
      if (e.id === id) {
        return { ...e, [prop]: clamped };
      }
      return e;
    }));
    this.pushHistoryState();
  }

  updateSelectedText(newText: string) {
    const id = this.selectedElementId();
    if (!id) return;
    this.elements.update(list => list.map(e => {
      if (e.id === id) {
        return { ...e, text: newText };
      }
      return e;
    }));
    this.pushHistoryState();
  }

  // Z-Order Manipulation
  bringToFront() {
    const id = this.selectedElementId();
    if (!id) return;
    const maxZ = Math.max(...this.elements().map(e => e.z), 1);
    this.elements.update(list => list.map(e => e.id === id ? { ...e, z: maxZ + 1 } : e));
    this.pushHistoryState();
  }

  sendToBack() {
    const id = this.selectedElementId();
    if (!id) return;
    const minZ = Math.min(...this.elements().map(e => e.z), 1);
    this.elements.update(list => list.map(e => e.id === id ? { ...e, z: Math.max(0, minZ - 1) } : e));
    this.pushHistoryState();
  }

  alignCenterHorizontal() {
    const id = this.selectedElementId();
    if (!id) return;
    const current = this.selectedElement();
    if (!current) return;
    const newX = Math.round((100 - current.w) / 2);
    this.elements.update(list => list.map(e => e.id === id ? { ...e, x: newX } : e));
    this.pushHistoryState();
    this.lms.showToast('Aligned element to horizontal center', 'info');
  }

  alignCenterVertical() {
    const id = this.selectedElementId();
    if (!id) return;
    const current = this.selectedElement();
    if (!current) return;
    const newY = Math.round((100 - current.h) / 2);
    this.elements.update(list => list.map(e => e.id === id ? { ...e, y: newY } : e));
    this.pushHistoryState();
    this.lms.showToast('Aligned element to vertical center', 'info');
  }

  // Preset Layout Applications
  applyLayoutPreset(presetName: string) {
    if (presetName === 'executive') {
      this.initDefaultElements();
    } else if (presetName === 'minimal') {
      this.elements.set([
        {
          id: 'min-1',
          kind: 'static-text',
          text: 'CERTIFICATE OF COMPLETION',
          x: 20,
          y: 25,
          w: 60,
          h: 7,
          z: 1,
          style: { fontFamily: 'Montserrat, sans-serif', fontSizePt: 22, bold: true, italic: false, underline: false, color: '#0f172a', align: 'center', overflow: 'fit' }
        },
        {
          id: 'min-2',
          kind: 'placeholder',
          token: '{{trainee_name}}',
          x: 20,
          y: 42,
          w: 60,
          h: 10,
          z: 2,
          style: { fontFamily: 'Playfair Display, serif', fontSizePt: 34, bold: true, italic: false, underline: false, color: '#0369a1', align: 'center', overflow: 'fit' }
        },
        {
          id: 'min-3',
          kind: 'placeholder',
          token: '{{course_name}}',
          x: 15,
          y: 58,
          w: 70,
          h: 8,
          z: 3,
          style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSizePt: 16, bold: true, italic: false, underline: false, color: '#334155', align: 'center', overflow: 'fit' }
        },
        {
          id: 'min-4',
          kind: 'placeholder',
          token: '{{issue_date}}',
          x: 15,
          y: 80,
          w: 30,
          h: 6,
          z: 4,
          style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSizePt: 12, bold: false, italic: false, underline: false, color: '#64748b', align: 'center', overflow: 'fit' }
        },
        {
          id: 'min-5',
          kind: 'placeholder',
          token: '{{trainer_name}}',
          x: 55,
          y: 80,
          w: 30,
          h: 6,
          z: 5,
          style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSizePt: 12, bold: true, italic: false, underline: false, color: '#334155', align: 'center', overflow: 'fit' }
        }
      ]);
    }
    this.pushHistoryState();
    this.lms.showToast(`Applied ${presetName} layout preset`, 'success');
  }

  // Clear elements
  clearAllElements() {
    this.confirmModal.confirm({
      title: 'Clear All Elements?',
      message: 'Are you sure you want to remove all placeholders and text blocks from the canvas?',
      iconType: 'warning',
      confirmText: 'Clear Canvas'
    }).then(ok => {
      if (ok) {
        this.elements.set([]);
        this.selectedElementId.set(null);
        this.pushHistoryState();
        this.lms.showToast('Cleared all canvas elements', 'info');
      }
    });
  }

  // Undo / Redo
  private pushHistoryState() {
    const current = JSON.parse(JSON.stringify(this.elements()));
    const hist = this.history().slice(0, this.historyIndex() + 1);
    hist.push(current);
    this.history.set(hist);
    this.historyIndex.set(hist.length - 1);
  }

  undo() {
    if (this.historyIndex() > 0) {
      this.historyIndex.update(i => i - 1);
      this.elements.set(JSON.parse(JSON.stringify(this.history()[this.historyIndex()])));
    }
  }

  redo() {
    if (this.historyIndex() < this.history().length - 1) {
      this.historyIndex.update(i => i + 1);
      this.elements.set(JSON.parse(JSON.stringify(this.history()[this.historyIndex()])));
    }
  }

  // Render Token or Sample Text
  getDisplayText(element: CanvasElement, forceSample: boolean = false): string {
    if (element.kind === 'static-text') {
      return element.text || '';
    }
    if (element.kind === 'placeholder' && element.token) {
      if (this.previewSampleData() || forceSample) {
        const def = this.tokensList.find(t => t.key === element.token);
        return def?.sampleValue || element.token;
      }
      return element.token;
    }
    return '';
  }

  // Token definition lookup
  getTokenDef(tokenKey?: string): PlaceholderTokenDef | undefined {
    if (!tokenKey) return undefined;
    return this.tokensList.find(t => t.key === tokenKey);
  }

  // Dragging elements inside canvas
  dragState: { isDragging: boolean; elementId: string | null; startMouseX: number; startMouseY: number; startElX: number; startElY: number } = {
    isDragging: false,
    elementId: null,
    startMouseX: 0,
    startMouseY: 0,
    startElX: 0,
    startElY: 0
  };

  onElementMouseDown(el: CanvasElement, e: MouseEvent, canvasEl: HTMLElement) {
    e.stopPropagation();
    this.selectedElementId.set(el.id);
    const rect = canvasEl.getBoundingClientRect();

    this.dragState = {
      isDragging: true,
      elementId: el.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: el.x,
      startElY: el.y
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.dragState.isDragging || !this.dragState.elementId) return;
      const deltaXPx = moveEvent.clientX - this.dragState.startMouseX;
      const deltaYPx = moveEvent.clientY - this.dragState.startMouseY;

      let deltaXPct = (deltaXPx / rect.width) * 100;
      let deltaYPct = (deltaYPx / rect.height) * 100;

      let newX = this.dragState.startElX + deltaXPct;
      let newY = this.dragState.startElY + deltaYPct;

      if (this.snapToGrid()) {
        newX = Math.round(newX / 2) * 2;
        newY = Math.round(newY / 2) * 2;
      }

      newX = Math.max(0, Math.min(100 - el.w, newX));
      newY = Math.max(0, Math.min(100 - el.h, newY));

      this.elements.update(list => list.map(item => {
        if (item.id === this.dragState.elementId) {
          return { ...item, x: Math.round(newX), y: Math.round(newY) };
        }
        return item;
      }));
    };

    const onMouseUp = () => {
      this.dragState.isDragging = false;
      this.pushHistoryState();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.currentStep() !== 1) return;
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedElementId()) {
        this.deleteSelectedElement();
        event.preventDefault();
      }
    } else if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && this.selectedElement()) {
      this.updateSelectedPosition('x', this.selectedElement()!.x - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && this.selectedElement()) {
      this.updateSelectedPosition('x', this.selectedElement()!.x + 1);
      event.preventDefault();
    } else if (event.key === 'ArrowUp' && this.selectedElement()) {
      this.updateSelectedPosition('y', this.selectedElement()!.y - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowDown' && this.selectedElement()) {
      this.updateSelectedPosition('y', this.selectedElement()!.y + 1);
      event.preventDefault();
    }
  }

  // =========================================================================
  // Save Draft, Publish, Discard
  // =========================================================================
  saveAsDraftAndExit() {
    if (!this.detailsForm.value.name) {
      this.detailsForm.patchValue({ name: `Draft Certificate (${new Date().toLocaleDateString()})` });
    }

    const templateData = this.buildTemplatePayload('draft');

    if (this.isEditMode() && this.templateIdToEdit()) {
      this.lms.updateCertificateTemplate(this.templateIdToEdit()!, templateData);
    } else {
      this.lms.createCertificateTemplate(templateData);
    }

    this.lms.showToast('Template progress saved as draft.', 'info', 4000, 'Draft Saved');
    this.router.navigate(['/certificates/templates']);
  }

  saveDraftInPlace() {
    const templateData = this.buildTemplatePayload('draft');
    if (this.isEditMode() && this.templateIdToEdit()) {
      this.lms.updateCertificateTemplate(this.templateIdToEdit()!, templateData);
    } else {
      const created = this.lms.createCertificateTemplate(templateData);
      this.isEditMode.set(true);
      this.templateIdToEdit.set(created.id);
    }
    this.lms.showToast('Draft changes saved successfully.', 'success');
  }

  publishTemplate() {
    if (!this.validateStep1()) {
      this.goToStep(1);
      return;
    }

    this.confirmModal.confirm({
      title: 'Publish Certificate Template?',
      message: `Are you sure you want to publish "${this.detailsForm.value.name}"? Published templates are immediately selectable across curriculum phases and verifiable across OneLMS.`,
      iconType: 'success',
      confirmText: 'Publish Template'
    }).then(confirmed => {
      if (confirmed) {
        const payload = this.buildTemplatePayload('published');
        if (this.isEditMode() && this.templateIdToEdit()) {
          this.lms.updateCertificateTemplate(this.templateIdToEdit()!, payload);
          this.lms.publishCertificateTemplate(this.templateIdToEdit()!);
        } else {
          const created = this.lms.createCertificateTemplate(payload);
          this.lms.publishCertificateTemplate(created.id);
        }
        this.router.navigate(['/certificates/templates']);
      }
    });
  }

  discardChanges() {
    this.confirmModal.confirmDiscard({
      title: 'Discard Template Wizard?',
      message: 'You have active changes in this certificate authoring wizard. Would you like to save your progress as a draft to resume later?',
      draftText: 'Save as Draft & Exit',
      discardText: 'Discard & Exit',
      cancelText: 'Continue Editing',
      onDraft: () => this.saveAsDraftAndExit(),
      onDiscard: () => this.router.navigate(['/certificates/templates'])
    });
  }

  private buildTemplatePayload(status: 'draft' | 'published'): Partial<CertificateTemplate> {
    const raw = this.detailsForm.getRawValue();
    const paperSize = raw.paperSize as CertificatePaperSize;
    const orientation = raw.orientation as CertificateOrientation;
    const canvasConfig = CANVAS_SIZE_MAP[paperSize]?.[orientation] || { widthPx: 3508, heightPx: 2480 };

    const tenant = this.lms.activeTenant();
    const lmsInstance = this.lms.activeLms();

    return {
      name: raw.name.trim(),
      description: (raw.description || '').trim(),
      type: raw.type as CertificateType,
      orientation,
      paperSize,
      canvas: {
        widthPx: canvasConfig.widthPx,
        heightPx: canvasConfig.heightPx,
        referenceDpi: 300
      },
      background: {
        fileUrl: this.backgroundUrl(),
        fileName: this.backgroundFileName(),
        mime: 'image/png'
      },
      elements: this.elements(),
      sharing: {
        level: raw.sharingLevel as CertificateSharingLevel,
        organizationId: tenant.id,
        organizationName: tenant.name,
        lmsId: lmsInstance?.id,
        lmsName: lmsInstance?.basicInfo?.lmsName
      },
      status,
      creationStatus: status === 'published' ? 'saved' : 'draft',
      lastCompletedStep: this.currentStep() === 1 ? 'background-details' : this.currentStep() === 2 ? 'designer' : 'preview',
      previewThumbnail: this.backgroundUrl()
    };
  }
}
