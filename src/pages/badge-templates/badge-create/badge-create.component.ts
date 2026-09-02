import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import {
  BadgeTemplate,
  BadgeCategory,
  BadgeLevel,
  BadgeBaseShape,
  BadgeSharingLevel,
  BadgeElement,
  BADGE_PLACEHOLDER_TOKENS,
  BadgePlaceholderToken
} from '../../../models/badge-template.model';

@Component({
  selector: 'app-badge-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StepperComponent, CustomSelectComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './badge-create.component.html',
  styleUrls: ['./badge-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeCreateComponent implements OnInit {
  dataService = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // Stepper state: 1 = Emblem & Details, 2 = Designer, 3 = Preview & Publish
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set<number>());
  editingBadgeId = signal<string | null>(null);

  // Stepper Step Definitions
  steps: StepperStep[] = [
    { id: 1, key: 'emblem', title: 'Emblem & Details', shortTitle: '1. Emblem & Details', sublabel: 'Badge Info & Emblem Art', icon: 'military_tech' },
    { id: 2, key: 'designer', title: 'Designer Canvas', shortTitle: '2. Designer', sublabel: 'Labels & Placeholders', icon: 'palette' },
    { id: 3, key: 'preview', title: 'Preview & Publish', shortTitle: '3. Preview & Publish', sublabel: 'Review & Publish', icon: 'visibility' }
  ];

  // Step 1 Form State
  badgeName = signal<string>('');
  templateId = signal<string>('');
  description = signal<string>('');
  category = signal<BadgeCategory>('Skill');

  // Emblem State
  emblemSource = signal<'upload' | 'base-shape'>('base-shape');
  uploadedArtUrl = signal<string>('');
  baseShape = signal<BadgeBaseShape>('Shield');
  fillColor = signal<string>('#0d9488');
  accentColor = signal<string>('#f59e0b');
  iconRef = signal<string>('verified');

  // Earning Metadata State
  criteria = signal<string>('');
  level = signal<BadgeLevel | ''>('Gold');
  tagInput = signal<string>('');
  skillTags = signal<string[]>(['Data Analysis', 'Problem Solving']);
  expires = signal<boolean>(false);
  expiryAmount = signal<number>(1);
  expiryUnit = signal<'days' | 'months' | 'years'>('years');
  issuerName = signal<string>('BRAC Learning Institute');

  // Sharing Policy State
  sharingLevel = signal<BadgeSharingLevel>('lms');

  // Step 2 Canvas Elements
  elements = signal<BadgeElement[]>([]);
  selectedElementId = signal<string | null>(null);

  // Step 3 Sample Data Toggle
  previewSampleData = signal<boolean>(true);

  // Available Tokens & Options
  readonly tokenCatalog = BADGE_PLACEHOLDER_TOKENS;
  readonly categories: BadgeCategory[] = ['Skill', 'Achievement', 'Participation', 'Milestone', 'Certification'];
  readonly levels: BadgeLevel[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
  readonly shapes: BadgeBaseShape[] = ['Circle', 'Shield', 'Hexagon', 'Star', 'Ribbon', 'Rosette', 'Square'];
  readonly availableIcons = ['verified', 'analytics', 'security', 'groups', 'payments', 'nature', 'school', 'emoji_events', 'stars', 'military_tech', 'psychology', 'workspace_premium'];

  // Select Options for Custom Select
  categoryOptions = computed<SelectOption[]>(() => {
    return this.categories.map(cat => ({
      value: cat,
      label: cat,
      icon: 'category'
    }));
  });

  shapeOptions = computed<SelectOption[]>(() => {
    return this.shapes.map(s => ({
      value: s,
      label: s,
      icon: 'crop_square'
    }));
  });

  iconOptions = computed<SelectOption[]>(() => {
    return this.availableIcons.map(ic => ({
      value: ic,
      label: ic,
      icon: ic
    }));
  });

  levelOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'None / Unassigned' },
      ...this.levels.map(lvl => ({
        value: lvl,
        label: lvl,
        icon: 'military_tech'
      }))
    ];
  });

  expiryUnitOptions: SelectOption[] = [
    { value: 'days', label: 'Days' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' }
  ];

  // Selected Canvas Element Computed
  selectedElement = computed<BadgeElement | null>(() => {
    const id = this.selectedElementId();
    if (!id) return null;
    return this.elements().find(e => e.id === id) || null;
  });

  // Capability object
  permissions = this.dataService.badgePermissions;

  ngOnInit() {
    // Generate unique Badge ID
    this.templateId.set(`BDG-${Math.floor(1000 + Math.random() * 9000)}`);

    // Check query params for edit mode
    this.route.queryParams.subscribe(params => {
      const editId = params['edit'];
      if (editId) {
        this.editingBadgeId.set(editId);
        this.loadBadgeForEditing(editId);
      }
    });
  }

  loadBadgeForEditing(badgeId: string) {
    const existing = this.dataService.badgeTemplates().find(b => b.templateId === badgeId);
    if (!existing) return;

    this.templateId.set(existing.templateId);
    this.badgeName.set(existing.name);
    this.description.set(existing.description || '');
    if (existing.category) this.category.set(existing.category);

    this.emblemSource.set(existing.emblem.source);
    if (existing.emblem.artUrl) this.uploadedArtUrl.set(existing.emblem.artUrl);
    if (existing.emblem.baseShape) this.baseShape.set(existing.emblem.baseShape);
    if (existing.emblem.fillColor) this.fillColor.set(existing.emblem.fillColor);
    if (existing.emblem.accentColor) this.accentColor.set(existing.emblem.accentColor);
    if (existing.emblem.iconRef) this.iconRef.set(existing.emblem.iconRef);

    if (existing.earning) {
      this.criteria.set(existing.earning.criteria || '');
      this.level.set((existing.earning.level as BadgeLevel) || '');
      this.skillTags.set(existing.earning.skillTags || []);
      this.expires.set(existing.earning.expires || false);
      if (existing.earning.validity) {
        this.expiryAmount.set(existing.earning.validity.amount || 1);
        this.expiryUnit.set(existing.earning.validity.unit || 'years');
      }
      if (existing.earning.issuerName) this.issuerName.set(existing.earning.issuerName);
    }

    if (existing.sharing) {
      this.sharingLevel.set(existing.sharing.level);
    }

    this.elements.set(existing.elements ? JSON.parse(JSON.stringify(existing.elements)) : []);
    
    // Set completed steps based on loaded badge status
    const completed = new Set<number>();
    if (existing.status === 'published' || existing.lastCompletedStep === 'preview') {
      completed.add(1);
      completed.add(2);
      completed.add(3);
    } else if (existing.lastCompletedStep === 'designer') {
      completed.add(1);
      completed.add(2);
    } else if (existing.lastCompletedStep === 'emblem-details') {
      completed.add(1);
    }
    this.completedSteps.set(completed);
  }

  // Skill Tag Management
  addSkillTag() {
    const val = this.tagInput().trim();
    if (val && !this.skillTags().includes(val)) {
      this.skillTags.update(tags => [...tags, val]);
      this.tagInput.set('');
    }
  }

  removeSkillTag(tag: string) {
    this.skillTags.update(tags => tags.filter(t => t !== tag));
  }

  // File Upload Handler
  onFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.dataService.showToast('File size exceeds maximum 5MB limit.', 'error', 4000, 'Upload Error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedArtUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Canvas Actions (Step 2)
  addTokenToCanvas(token: BadgePlaceholderToken) {
    const newEl: BadgeElement = {
      id: `el_bdg_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      kind: 'placeholder',
      token: token.key,
      x: 10,
      y: 70 + (this.elements().length * 6) % 20,
      w: 80,
      h: 12,
      z: this.elements().length + 1,
      style: {
        fontFamily: 'Inter',
        fontSizePt: token.defaultStyle.fontSizePt,
        bold: token.defaultStyle.bold,
        italic: false,
        underline: false,
        color: token.defaultStyle.color,
        align: token.defaultStyle.align,
        overflow: 'fit'
      }
    };

    this.elements.update(els => [...els, newEl]);
    this.selectedElementId.set(newEl.id);
  }

  addStaticTextToCanvas() {
    const newEl: BadgeElement = {
      id: `el_bdg_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      kind: 'static-text',
      text: 'EXCELLENCE AWARD',
      x: 15,
      y: 75,
      w: 70,
      h: 10,
      z: this.elements().length + 1,
      style: {
        fontFamily: 'Inter',
        fontSizePt: 12,
        bold: true,
        italic: false,
        underline: false,
        color: '#ffffff',
        align: 'center',
        overflow: 'fit'
      }
    };

    this.elements.update(els => [...els, newEl]);
    this.selectedElementId.set(newEl.id);
  }

  removeSelectedElement() {
    const id = this.selectedElementId();
    if (!id) return;
    this.elements.update(els => els.filter(e => e.id !== id));
    this.selectedElementId.set(null);
  }

  resetCanvasElements() {
    this.elements.set([]);
    this.selectedElementId.set(null);
  }

  // Navigation & Step Validation
  onStepClicked(step: StepperStep) {
    this.goToStep(step.id);
  }

  goToStep(step: number) {
    if (step === 2 && this.currentStep() === 1) {
      if (!this.validateStep1()) return;
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });
      this.dataService.showToast('Badge details have been saved successfully.', 'success', 3000, 'Step 1 Complete');
    }
    if (step === 3 && this.currentStep() === 2) {
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        next.add(2);
        return next;
      });
      this.dataService.showToast('Badge design has been saved successfully.', 'success', 3000, 'Step 2 Complete');
    }
    if (step === 3 && this.currentStep() === 1) {
      if (!this.validateStep1()) return;
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });
    }
    this.currentStep.set(step);
  }

  validateStep1(): boolean {
    if (!this.badgeName().trim() || !this.criteria().trim()) {
      this.dataService.showToast('All mandatory fields are not filled up.', 'error', 4000, 'Validation Error');
      return false;
    }
    return true;
  }

  saveDraftAndExit() {
    this.saveOrUpdateBadge('draft');
    this.router.navigate(['/certificates/badges']);
  }

  publishBadge() {
    if (!this.validateStep1()) {
      this.goToStep(1);
      return;
    }

    this.saveOrUpdateBadge('published');
    this.dataService.showToast('Badge has been published successfully.', 'success', 3500, 'Badge Published');
    this.router.navigate(['/certificates/badges']);
  }

  saveOrUpdateBadge(status: 'draft' | 'published') {
    const activeUser = this.dataService.activeUser();
    const today = new Date().toLocaleDateString('en-GB');

    const badgeObj: BadgeTemplate = {
      templateId: this.templateId(),
      templateKind: 'badge',
      name: this.badgeName().trim() || 'Untitled Badge',
      description: this.description().trim(),
      category: this.category(),
      emblem: {
        source: this.emblemSource(),
        artUrl: this.uploadedArtUrl(),
        baseShape: this.baseShape(),
        fillColor: this.fillColor(),
        accentColor: this.accentColor(),
        iconRef: this.iconRef()
      },
      canvas: { widthPx: 512, heightPx: 512 },
      earning: {
        criteria: this.criteria().trim(),
        level: this.level() || undefined,
        skillTags: this.skillTags(),
        expires: this.expires(),
        validity: this.expires() ? { amount: this.expiryAmount(), unit: this.expiryUnit() } : undefined,
        issuerName: this.issuerName()
      },
      elements: this.elements(),
      sharing: {
        level: this.sharingLevel()
      },
      status,
      version: 1,
      creationStatus: status === 'published' ? 'saved' : 'draft',
      lastCompletedStep: this.currentStep() === 3 ? 'preview' : (this.currentStep() === 2 ? 'designer' : 'emblem-details'),
      createdBy: activeUser?.name || 'LMS Admin',
      createdAt: today,
      updatedAt: `${today} ${new Date().toLocaleTimeString('en-GB')}`,
      usageCount: 0
    };

    if (this.editingBadgeId()) {
      this.dataService.updateBadgeTemplate(this.editingBadgeId()!, badgeObj);
    } else {
      this.dataService.createBadgeTemplate(badgeObj);
    }
  }

  cancelAndExit() {
    this.router.navigate(['/certificates/badges']);
  }

  // Token sample resolution helper
  resolveTokenValue(tokenKey: string): string {
    if (!this.previewSampleData()) return tokenKey;
    if (tokenKey === '{{badge_name}}') return this.badgeName() || 'Data Analyst Gold';
    if (tokenKey === '{{badge_level}}') return this.level() || 'GOLD TIER';
    if (tokenKey === '{{issuer_name}}') return this.issuerName() || 'BRAC Learning Institute';
    const tokenDef = BADGE_PLACEHOLDER_TOKENS.find(t => t.key === tokenKey);
    return tokenDef ? tokenDef.sampleValue : tokenKey;
  }
}
