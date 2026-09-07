import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import {
  CourseEntity,
  CourseStructureNode,
  CourseContentItem,
  CourseReviewsConfig,
  InstructorRef,
  AuthorKind,
  LayerCount,
  LayerLabelPreset,
  LAYER_LABEL_PRESETS,
  validateCourseEntity,
  summarizeCourseMetrics
} from '../../../models/course.model';
import { Skill } from '../../../models/skill-mapping.model';
import { BadgeTemplate } from '../../../models/badge-template.model';
import { CertificateTemplate, CanvasElement, PLACEHOLDER_TOKENS } from '../../../models/certificate-template.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';

@Component({
  selector: 'app-course-create',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, CustomSelectComponent, StepperComponent],
  templateUrl: './course-create.component.html'
})
export class CourseCreateComponent implements OnInit {
  lmsService = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private confirmModal = inject(ConfirmationModalService);

  // Mode: creating new vs editing existing
  isEditMode = signal<boolean>(false);
  editCourseId = signal<string | null>(null);
  existingCourse = signal<CourseEntity | null>(null);

  // Active Wizard Step (1 to 6)
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set<number>());
  formErrorAlert = signal<string | null>(null);

  // Stepper Definition
  steps: StepperStep[] = [
    { id: 1, shortTitle: 'Course Details', sublabel: 'Identity & Taxonomy', icon: 'info' },
    { id: 2, shortTitle: 'Structure Setup', sublabel: 'Hierarchy & Tiers', icon: 'account_tree' },
    { id: 3, shortTitle: 'Build Content', sublabel: 'Curriculum Nodes', icon: 'format_list_bulleted' },
    { id: 4, shortTitle: 'Tagging', sublabel: 'Skills & Credentials', icon: 'military_tech' },
    { id: 5, shortTitle: 'Feedback and Grading', sublabel: 'Feedback & Coverage', icon: 'rate_review' },
    { id: 6, shortTitle: 'Review & Publish', sublabel: 'Audit & Activation', icon: 'verified' }
  ];

  // Forms
  detailsForm: FormGroup = this.fb.group({
    code: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    ownerId: ['', Validators.required],
    category: ['Compliance & Security', Validators.required],
    difficulty: ['Intermediate', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(5)]],
    coverImage: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80']
  });

  // Category Presets
  categories = [
    'Compliance & Security',
    'Enterprise Leadership',
    'Healthcare & Safety',
    'Financial Inclusion & Microfinance',
    'Climate & Humanitarian Action',
    'Digital Transformation',
    'Operations & Field Management',
    'Customer Experience'
  ];

  categoryOptions: SelectOption[] = this.categories.map(c => ({ value: c, label: c }));
  difficultyOptions: SelectOption[] = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' }
  ];
  ownerOptions = computed<SelectOption[]>(() => {
    return this.lmsService.tenantUsers().map(u => ({
      value: u.id,
      label: `${u.name} (${u.email}) — ${u.role}`
    }));
  });

  scaleOptions: SelectOption[] = [
    { value: '5-star-likert', label: '5-Star Likert Scale (Standard)', sublabel: '1 to 5 star rating model' },
    { value: 'csat-10', label: '10-Point CSAT Scale', sublabel: '1 to 10 customer satisfaction index' }
  ];

  familyOptions: SelectOption[] = [
    { value: 'learning', label: 'Learning Material', sublabel: 'Video, audio, documents, readings', icon: 'play_lesson' },
    { value: 'assessment', label: 'Assessment / Quiz', sublabel: 'Quizzes, assignments, evaluations', icon: 'quiz' }
  ];

  learningSubtypeOptions: SelectOption[] = [
    { value: 'video', label: 'Video Lecture', icon: 'smart_display' },
    { value: 'audio', label: 'Audio / Podcast', icon: 'headphones' },
    { value: 'document', label: 'Document / PDF', icon: 'description' },
    { value: 'reading', label: 'Reading Article', icon: 'article' },
    { value: 'interactive', label: 'Interactive Lab', icon: 'extension' }
  ];

  assessmentSubtypeOptions: SelectOption[] = [
    { value: 'quiz', label: 'Knowledge Quiz (Objective)', icon: 'quiz' },
    { value: 'assignment', label: 'Project / Assignment (Subjective)', icon: 'assignment' },
    { value: 'survey', label: 'Diagnostic Survey', icon: 'ballot' }
  ];

  gradingModeOptions: SelectOption[] = [
    { value: 'auto', label: 'Auto-Graded System', sublabel: 'Immediate automated scoring' },
    { value: 'manual', label: 'Manual Instructor Grading', sublabel: 'Requires faculty review' }
  ];

  // Cover Image Presets
  coverImagePresets = [
    { label: 'Workspace Tech', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Classroom Leadership', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' },
    { label: 'Healthcare & Science', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Community & Field', url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80' },
    { label: 'Finance & Growth', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' }
  ];

  coverPresetOptions: SelectOption[] = this.coverImagePresets.map(p => ({
    value: p.url,
    label: p.label
  }));

  // Local Image Uploader State
  uploadedImageFileName = signal<string>('');
  uploadedImageFileSize = signal<string>('');
  uploadedImageFileType = signal<string>('');
  isDraggingOver = signal<boolean>(false);
  customUploadedImage = signal<string | null>(null);
  imageUploadError = signal<string | null>(null);

  isPresetSelected(url: string): boolean {
    return this.detailsForm.get('coverImage')?.value === url;
  }

  isCustomImageActive = computed<boolean>(() => {
    const current = this.detailsForm.get('coverImage')?.value;
    if (!current) return false;
    return !this.coverImagePresets.some(p => p.url === current);
  });

  // Tags state
  courseTags = signal<string[]>(['Curriculum', 'Core']);
  newTagInput = signal<string>('');

  // Step 2: Structure Configuration
  selectedLayerCount = signal<LayerCount>(3);
  layer1Label = signal<string>('Chapter');
  layer2Label = signal<string>('Topic');
  layer3Label = signal<string>('Lesson');

  layerLabelPresets = LAYER_LABEL_PRESETS;
  selectedPresetValue = signal<string>('Standard 3-Tier (Chapter / Topic / Lesson)');

  presetOptions = computed<SelectOption[]>(() => {
    return this.layerLabelPresets.map(p => ({
      value: p.name,
      label: p.name,
      sublabel: `${p.labels.join(' → ')} → [Content]`,
      icon: p.icon,
      badge: p.badge || `${p.count} Tier${p.count > 1 ? 's' : ''}`,
      badgeClass: p.count === 3 
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60' 
        : p.count === 2 
          ? 'bg-tenant-100 text-tenant-700 dark:bg-tenant-950/60 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-800/60'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
    }));
  });

  currentTierPresets = computed(() => {
    return this.layerLabelPresets.filter(p => p.count === this.selectedLayerCount());
  });

  isPresetActive(preset: LayerLabelPreset): boolean {
    if (this.selectedLayerCount() !== preset.count) return false;
    if (this.layer1Label() !== (preset.labels[0] || '')) return false;
    if (preset.count >= 2 && this.layer2Label() !== (preset.labels[1] || '')) return false;
    if (preset.count >= 3 && this.layer3Label() !== (preset.labels[2] || '')) return false;
    return true;
  }

  // Step 3: Tree Structure Data Model
  structureNodes = signal<CourseStructureNode[]>([]);

  // Step 4: Tagging Configuration (Skills, Badges & Certificates)
  selectedSkillIds = signal<string[]>(['skl-001', 'skl-002']);
  selectedBadgeId = signal<string>('BDG-1001');
  selectedCertificateId = signal<string>('CERT-TMP-1972-01');
  skillCategoryFilter = signal<string>('all');
  certificatePreviewMode = signal<'sample' | 'tokens'>('sample');
  isCertPreviewModalOpen = signal<boolean>(false);

  // Skill Options from Skill Repository
  skillOptions = computed<SelectOption[]>(() => {
    return this.lmsService.skills().map(s => {
      let badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      if (s.category === 'Technical') {
        badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      } else if (s.category === 'Compliance') {
        badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      } else if (s.category === 'Leadership') {
        badgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      }
      return {
        value: s.skillId,
        label: s.name,
        sublabel: `${s.skillCode} • ${s.clusterName || s.category} • (${s.levels.join(', ')})`,
        badge: s.category,
        badgeClass,
        icon: 'psychology'
      };
    });
  });

  // Selected Skills computed array
  selectedSkills = computed<Skill[]>(() => {
    const ids = this.selectedSkillIds();
    const all = this.lmsService.skills();
    return ids.map(id => all.find(s => s.skillId === id)).filter((s): s is Skill => !!s);
  });

  // Badge Options from Badge Templates Repository
  badgeOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [
      { value: '', label: 'None (No milestone badge awarded)', sublabel: 'Complete course without issuing a badge', icon: 'block' }
    ];
    this.lmsService.badgeTemplates().forEach(b => {
      list.push({
        value: b.templateId,
        label: b.name,
        sublabel: `${b.category || 'Competency'} • ${b.earning?.level || 'Standard'} • ${b.earning?.issuerName || 'BRAC Learning'}`,
        badge: b.earning?.level || 'Badge',
        icon: b.emblem?.iconRef || 'military_tech'
      });
    });
    return list;
  });

  // Selected Badge computed
  selectedBadge = computed<BadgeTemplate | null>(() => {
    const id = this.selectedBadgeId();
    if (!id) return null;
    return this.lmsService.badgeTemplates().find(b => b.templateId === id) || null;
  });

  // Certificate Options from Certificate Templates Repository
  certificateOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [
      { value: '', label: 'None (No certificate generated)', sublabel: 'Learners complete course without an accredited certificate', icon: 'block' }
    ];
    this.lmsService.certificateTemplates().forEach(c => {
      list.push({
        value: c.id,
        label: c.name,
        sublabel: `${c.type} Credential • ${c.paperSize} (${c.orientation}) • ${c.sharing?.level || 'Organization'}`,
        badge: c.type,
        icon: 'workspace_premium'
      });
    });
    return list;
  });

  // Selected Certificate computed
  selectedCertificate = computed<CertificateTemplate | null>(() => {
    const id = this.selectedCertificateId();
    if (!id) return null;
    return this.lmsService.certificateTemplates().find(c => c.id === id) || null;
  });

  // Skill management helpers
  onSkillSelectionChange(value: any) {
    if (Array.isArray(value)) {
      this.selectedSkillIds.set(value);
    } else if (typeof value === 'string' && value) {
      const current = this.selectedSkillIds();
      if (!current.includes(value)) {
        this.selectedSkillIds.set([...current, value]);
      }
    }
  }

  addSkill(skillId: string) {
    if (!skillId) return;
    const current = this.selectedSkillIds();
    if (!current.includes(skillId)) {
      this.selectedSkillIds.set([...current, skillId]);
      const skill = this.lmsService.skills().find(s => s.skillId === skillId);
      this.lmsService.showToast(`Mapped competency skill "${skill?.name || skillId}" to curriculum.`, 'success', 2500);
    }
  }

  removeSkill(skillId: string) {
    const current = this.selectedSkillIds();
    this.selectedSkillIds.set(current.filter(id => id !== skillId));
  }

  toggleSkill(skillId: string) {
    const current = this.selectedSkillIds();
    if (current.includes(skillId)) {
      this.removeSkill(skillId);
    } else {
      this.addSkill(skillId);
    }
  }

  isSkillSelected(skillId: string): boolean {
    return this.selectedSkillIds().includes(skillId);
  }

  getSkillCategories(): string[] {
    const cats = new Set<string>();
    this.lmsService.skills().forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return ['all', ...Array.from(cats)];
  }

  getFilteredRepoSkills(): Skill[] {
    const filter = this.skillCategoryFilter();
    const skills = this.lmsService.skills();
    if (filter === 'all') return skills;
    return skills.filter(s => s.category === filter);
  }

  // Certificate Live Preview Token Rendering
  getCertDisplayText(element: CanvasElement): string {
    if (element.kind === 'static-text') {
      return element.text || '';
    }
    if (element.kind === 'placeholder' && element.token) {
      if (this.certificatePreviewMode() === 'tokens') {
        return element.token;
      }
      const token = element.token;
      const courseTitle = this.detailsForm.get('title')?.value?.trim() || 'Interactive Masterclass Course';
      const courseCode = this.detailsForm.get('code')?.value?.trim() || 'CRS-2026-01';
      const dateStr = '07/09/2026';

      if (token === '{{course_name}}' || token === '{{course_title}}' || token === '{{phase_name}}' || token === '{{module_name}}') return courseTitle;
      if (token === '{{course_code}}') return courseCode;
      if (token === '{{trainee_name}}') return 'Ayesha Rahman';
      if (token === '{{completion_date}}' || token === '{{date}}' || token === '{{issue_date}}') return dateStr;
      if (token === '{{certificate_id}}' || token === '{{serial_number}}') return 'BRAC-CERT-2026-98214';
      if (token === '{{grade}}') return '96.5% (Distinction)';
      if (token === '{{trainer_name}}') return 'Lead Faculty Instructor';
      if (token === '{{signatory_name}}') return 'Dr. Karim Rahman';
      if (token === '{{signatory_designation}}') return 'Director of Academic Affairs';
      if (token === '{{organization_name}}') return 'BRAC Learning Institute';
      if (token === '{{lms_name}}') return this.lmsService.activeLms()?.basicInfo?.lmsName || 'OneLMS Portal';

      const def = PLACEHOLDER_TOKENS.find(t => t.key === token);
      return def?.sampleValue || token;
    }
    return '';
  }

  openCertPreviewModal() {
    this.isCertPreviewModalOpen.set(true);
  }

  closeCertPreviewModal() {
    this.isCertPreviewModalOpen.set(false);
  }

  // Instructor attribution backward compatibility
  instructorTaggedLayer = signal<1 | 2 | 3>(1); // Which layer depth is chosen for tagging

  getInstructorAssignedLayerName(): string {
    const layer = this.instructorTaggedLayer();
    if (layer === 1) return this.layer1Label();
    if (layer === 2) return this.layer2Label();
    if (layer === 3) return this.layer3Label();
    return this.layer1Label() || 'Chapter';
  }

  // Step 5: Reviews Configuration
  reviewsConfig = signal<CourseReviewsConfig>({
    contentReviewsEnabled: true,
    instructorReviewsEnabled: true,
    scale: '5-star-likert'
  });

  // Modal / Drawer state for adding / editing Content Item
  showContentModal = signal<boolean>(false);
  activeTargetNodeId = signal<string | null>(null);
  activeEditContentId = signal<string | null>(null);

  contentForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    family: ['learning', Validators.required],
    learningSubtype: ['video'],
    assessmentSubtype: ['quiz'],
    gradingMode: ['auto'],
    durationMinutes: [15, [Validators.required, Validators.min(1)]],
    passingScorePct: [80],
    instructions: [''],
    mediaUrl: [''],
    instructorId: ['__topic__']
  });

  contentModalInstructorOptions = computed<SelectOption[]>(() => {
    const targetNodeId = this.activeTargetNodeId();
    let topicInstName = 'Unassigned';
    if (targetNodeId) {
      const node = this.findNodeById(this.structureNodes(), targetNodeId);
      if (node) {
        const inst = this.getNodeInstructor(node);
        if (inst) topicInstName = inst.name;
      }
    }

    return [
      { value: '__topic__', label: `Use Topic Default (${topicInstName})`, icon: 'sync' },
      { value: '', label: 'None (Unassigned)', icon: 'person_off' },
      ...this.lmsService.instructorsRepo().map(inst => ({
        value: inst.id,
        label: `${inst.name} (${inst.title})`,
        sublabel: `${inst.department || ''} • ${inst.email}`,
        icon: 'person'
      }))
    ];
  });

  // Template extract modal state
  showSaveAsTemplateModal = signal<boolean>(false);
  tplName = signal<string>('');
  tplScope = signal<'lms' | 'organization'>('lms');

  scopeOptions: SelectOption[] = [
    { value: 'lms', label: 'Current LMS Instance Only', sublabel: 'Available only within this LMS' },
    { value: 'organization', label: 'Entire Organization', sublabel: 'Accessible to all LMS portals under org' }
  ];

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.isEditMode.set(true);
      this.editCourseId.set(courseId);
      this.loadExistingCourse(courseId);
    } else {
      this.initDefaultCourse();
      this.showStepAlert(1, 'entered');
    }
  }

  initDefaultCourse() {
    const user = this.lmsService.activeUser();
    const autoCode = this.lmsService.generateCourseCode('New Course', 'Compliance & Security');

    this.detailsForm.patchValue({
      code: autoCode,
      title: '',
      description: '',
      ownerId: user.id,
      category: 'Compliance & Security',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      coverImage: this.coverImagePresets[0].url
    });

    // Default 3-tier structure with 1 node & 1 lesson
    this.selectedLayerCount.set(3);
    this.layer1Label.set('Chapter');
    this.layer2Label.set('Topic');
    this.layer3Label.set('Lesson');

    // Default Step 4 Skills & Credentials
    this.selectedSkillIds.set(['skl-001', 'skl-002']);
    this.selectedBadgeId.set('BDG-1001');
    this.selectedCertificateId.set('CERT-TMP-1972-01');

    const defaultInst = this.lmsService.instructorsRepo()[0] || {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      title: 'Senior Faculty Lead',
      department: 'Instructional Design',
      specialization: ['Compliance']
    };

    const initialStructure: CourseStructureNode[] = [
      {
        nodeId: `node-${Date.now()}-1`,
        title: 'Foundations & Overview',
        layer: 1,
        order: 1,
        instructorTags: [defaultInst],
        children: [
          {
            nodeId: `node-${Date.now()}-2`,
            title: 'Core Fundamentals',
            layer: 2,
            order: 1,
            instructorTags: [],
            children: [
              {
                nodeId: `node-${Date.now()}-3`,
                title: 'Introduction & Standards',
                layer: 3,
                order: 1,
                instructorTags: [],
                content: [
                  {
                    contentId: `cnt-${Date.now()}-1`,
                    title: 'Welcome & Curriculum Overview',
                    family: 'learning',
                    order: 1,
                    learning: {
                      subtype: 'video',
                      durationMinutes: 10,
                      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
                    },
                    authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
                  },
                  {
                    contentId: `cnt-${Date.now()}-2`,
                    title: 'Knowledge Check Quiz',
                    family: 'assessment',
                    order: 2,
                    assessment: {
                      subtype: 'quiz',
                      gradingMode: 'auto',
                      passingScorePercent: 80,
                      durationMinutes: 15
                    },
                    authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    this.structureNodes.set(initialStructure);
    this.instructorTaggedLayer.set(1);
  }

  loadExistingCourse(courseId: string) {
    const course = this.lmsService.getCourseEntityById(courseId);
    if (!course) {
      this.lmsService.showToast(`Course with ID ${courseId} not found.`, 'error', 3000, 'Error');
      this.router.navigate(['/courses']);
      return;
    }

    this.existingCourse.set(course);

    this.detailsForm.patchValue({
      code: course.code,
      title: course.title,
      description: course.description,
      ownerId: course.ownerId,
      category: course.category,
      difficulty: course.difficulty,
      durationMinutes: course.durationMinutes,
      coverImage: course.coverImage
    });

    this.courseTags.set([...course.tags]);
    this.selectedLayerCount.set(course.structureConfig.layerCount);
    this.layer1Label.set(course.structureConfig.layerLabels[0] || 'Chapter');
    this.layer2Label.set(course.structureConfig.layerLabels[1] || 'Topic');
    this.layer3Label.set(course.structureConfig.layerLabels[2] || 'Lesson');

    const matchingPreset = this.layerLabelPresets.find(p => 
      p.count === course.structureConfig.layerCount &&
      p.labels[0] === course.structureConfig.layerLabels[0] &&
      (p.count < 2 || p.labels[1] === course.structureConfig.layerLabels[1]) &&
      (p.count < 3 || p.labels[2] === course.structureConfig.layerLabels[2])
    );
    if (matchingPreset) {
      this.selectedPresetValue.set(matchingPreset.name);
    }

    this.structureNodes.set(JSON.parse(JSON.stringify(course.structure)));
    this.reviewsConfig.set({ ...course.reviewsConfig });

    // Step 4: Skills, Badge and Certificate credentials
    if (course.skills && course.skills.length > 0) {
      this.selectedSkillIds.set([...course.skills]);
    } else {
      this.selectedSkillIds.set(['skl-001', 'skl-002']);
    }
    if (course.badgeTemplateId !== undefined) {
      this.selectedBadgeId.set(course.badgeTemplateId);
    }
    if (course.certificateTemplateId !== undefined) {
      this.selectedCertificateId.set(course.certificateTemplateId);
    }

    // Determine instructor tagged layer
    this.detectInstructorTaggedLayer();
  }

  detectInstructorTaggedLayer() {
    let taggedDepth: 1 | 2 | 3 | null = null;
    function check(nodes: CourseStructureNode[], depth: 1 | 2 | 3) {
      for (const n of nodes) {
        if (n.instructorTags && n.instructorTags.length > 0) {
          taggedDepth = depth;
          return;
        }
        if (n.children && depth < 3) {
          check(n.children, (depth + 1) as 2 | 3);
        }
      }
    }
    check(this.structureNodes(), 1);
    this.instructorTaggedLayer.set(taggedDepth || 1);
  }

  // Tags Management
  addTag() {
    const val = this.newTagInput().trim();
    if (val && !this.courseTags().includes(val)) {
      this.courseTags.update(t => [...t, val]);
      this.newTagInput.set('');
    }
  }

  removeTag(tag: string) {
    this.courseTags.update(t => t.filter(x => x !== tag));
  }

  // Cover Image & Local File Uploader
  selectCoverPreset(preset: { label: string; url: string }) {
    this.detailsForm.patchValue({ coverImage: preset.url });
    this.imageUploadError.set(null);
  }

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      this.processImageFile(input.files[0]);
    }
  }

  onImageDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(true);
  }

  onImageDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
  }

  onImageDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.processImageFile(event.dataTransfer.files[0]);
    }
  }

  processImageFile(file: File) {
    this.imageUploadError.set(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      const errorMsg = 'Please upload a valid image file (PNG, JPG, WebP, or SVG).';
      this.imageUploadError.set(errorMsg);
      this.lmsService.showToast(errorMsg, 'error', 3500, 'Invalid File Type');
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = `Image size (${this.formatFileSize(file.size)}) exceeds the 5MB limit. Please choose a smaller image.`;
      this.imageUploadError.set(errorMsg);
      this.lmsService.showToast(errorMsg, 'error', 3500, 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        this.uploadedImageFileName.set(file.name);
        this.uploadedImageFileSize.set(this.formatFileSize(file.size));
        this.uploadedImageFileType.set(file.type.replace('image/', '').toUpperCase());
        this.customUploadedImage.set(result);
        this.detailsForm.patchValue({ coverImage: result });
        this.lmsService.showToast(`Uploaded banner "${file.name}" formatted for Course Library!`, 'success', 3000, 'Image Uploaded');
      }
    };
    reader.onerror = () => {
      this.imageUploadError.set('Failed to read image file from local device.');
      this.lmsService.showToast('Failed to read image file.', 'error', 3000, 'Upload Error');
    };
    reader.readAsDataURL(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  clearUploadedImage() {
    this.customUploadedImage.set(null);
    this.uploadedImageFileName.set('');
    this.uploadedImageFileSize.set('');
    this.uploadedImageFileType.set('');
    this.imageUploadError.set(null);
    this.detailsForm.patchValue({ coverImage: this.coverImagePresets[0].url });
    this.lmsService.showToast('Reset cover image to default preset.', 'info', 2000, 'Image Reset');
  }

  // Preset Layer Labels Selection
  applyLayerPreset(preset: LayerLabelPreset) {
    if (this.selectedLayerCount() !== preset.count) {
      this.changeLayerCount(preset.count);
    }
    this.layer1Label.set(preset.labels[0] || 'Chapter');
    this.layer2Label.set(preset.labels[1] || 'Topic');
    this.layer3Label.set(preset.labels[2] || 'Lesson');
    this.selectedPresetValue.set(preset.name);
  }

  onPresetDropdownChange(presetName: string) {
    if (!presetName) return;
    const found = this.layerLabelPresets.find(p => p.name === presetName || p.presetKey === presetName);
    if (found) {
      this.applyLayerPreset(found);
    }
  }

  // Update Layer Count
  changeLayerCount(count: LayerCount) {
    if (this.selectedLayerCount() === count) return;
    this.selectedLayerCount.set(count);
    this.adaptTreeToLayerCount(count);
  }

  adaptTreeToLayerCount(count: LayerCount) {
    const current = this.structureNodes();
    const user = this.lmsService.activeUser();

    if (count === 1) {
      const adapted: CourseStructureNode[] = current.map((n1, idx) => {
        const collectedContent: CourseContentItem[] = [];
        function extractContent(node: CourseStructureNode) {
          if (node.content) collectedContent.push(...node.content);
          if (node.children) node.children.forEach(extractContent);
        }
        extractContent(n1);

        return {
          nodeId: n1.nodeId,
          title: n1.title,
          layer: 1,
          order: idx + 1,
          instructorTags: n1.instructorTags || [],
          content: collectedContent.length > 0 ? collectedContent : [
            {
              contentId: `cnt-${Date.now()}-${idx + 1}`,
              title: `${n1.title} Lesson Item`,
              family: 'learning',
              order: 1,
              learning: { subtype: 'video', durationMinutes: 15 },
              authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
            }
          ]
        };
      });
      this.structureNodes.set(adapted);
    } else if (count === 2) {
      const adapted: CourseStructureNode[] = current.map((n1, idx1) => {
        const ch2: CourseStructureNode[] = (n1.children && n1.children.length > 0) ? n1.children.map((n2, idx2) => {
          const collectedContent: CourseContentItem[] = [];
          function extractContent(node: CourseStructureNode) {
            if (node.content) collectedContent.push(...node.content);
            if (node.children) node.children.forEach(extractContent);
          }
          extractContent(n2);
          return {
            nodeId: n2.nodeId,
            title: n2.title,
            layer: 2,
            order: idx2 + 1,
            instructorTags: n2.instructorTags || [],
            content: collectedContent.length > 0 ? collectedContent : [
              {
                contentId: `cnt-${Date.now()}-${idx1 + 1}-${idx2 + 1}`,
                title: `${n2.title} Lesson`,
                family: 'learning',
                order: 1,
                learning: { subtype: 'reading', durationMinutes: 10 },
                authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
              }
            ]
          };
        }) : [
          {
            nodeId: `node-${Date.now()}-${idx1 + 1}-sub`,
            title: `${n1.title} Core Section`,
            layer: 2,
            order: 1,
            instructorTags: [],
            content: n1.content || [
              {
                contentId: `cnt-${Date.now()}-def`,
                title: 'Overview Lesson',
                family: 'learning',
                order: 1,
                learning: { subtype: 'video', durationMinutes: 15 },
                authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
              }
            ]
          }
        ];

        return {
          nodeId: n1.nodeId,
          title: n1.title,
          layer: 1,
          order: idx1 + 1,
          instructorTags: n1.instructorTags || [],
          children: ch2
        };
      });
      this.structureNodes.set(adapted);
    } else {
      // 3 Layers
      const adapted: CourseStructureNode[] = current.map((n1, idx1) => {
        const ch2: CourseStructureNode[] = (n1.children && n1.children.length > 0) ? n1.children.map((n2, idx2) => {
          const ch3: CourseStructureNode[] = (n2.children && n2.children.length > 0) ? n2.children : [
            {
              nodeId: `node-${Date.now()}-${idx1 + 1}-${idx2 + 1}-3`,
              title: `${n2.title} Detailed Unit`,
              layer: 3,
              order: 1,
              instructorTags: [],
              content: n2.content || [
                {
                  contentId: `cnt-${Date.now()}-3-def`,
                  title: 'Core Unit Lesson',
                  family: 'learning',
                  order: 1,
                  learning: { subtype: 'video', durationMinutes: 15 },
                  authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
                }
              ]
            }
          ];
          return {
            nodeId: n2.nodeId,
            title: n2.title,
            layer: 2,
            order: idx2 + 1,
            instructorTags: n2.instructorTags || [],
            children: ch3
          };
        }) : [
          {
            nodeId: `node-${Date.now()}-${idx1 + 1}-sub`,
            title: `${n1.title} Topic Section`,
            layer: 2,
            order: 1,
            instructorTags: [],
            children: [
              {
                nodeId: `node-${Date.now()}-${idx1 + 1}-sub-leaf`,
                title: `${n1.title} Detailed Unit`,
                layer: 3,
                order: 1,
                instructorTags: [],
                content: n1.content || [
                  {
                    contentId: `cnt-${Date.now()}-def3`,
                    title: 'Core Unit Lesson',
                    family: 'learning',
                    order: 1,
                    learning: { subtype: 'video', durationMinutes: 15 },
                    authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
                  }
                ]
              }
            ]
          }
        ];

        return {
          nodeId: n1.nodeId,
          title: n1.title,
          layer: 1,
          order: idx1 + 1,
          instructorTags: n1.instructorTags || [],
          children: ch2
        };
      });
      this.structureNodes.set(adapted);
    }
  }

  // Tree Nodes Manipulation
  recentlyAddedNodeId = signal<string | null>(null);

  addLayer1Node() {
    const idx = this.structureNodes().length + 1;
    const count = this.selectedLayerCount();
    const label = this.layer1Label();
    const user = this.lmsService.activeUser();

    const newNode: CourseStructureNode = {
      nodeId: `node-${Date.now()}-${idx}`,
      title: `${label} ${idx}: Untitled Section`,
      layer: 1,
      order: idx,
      instructorTags: [],
      children: count > 1 ? [
        {
          nodeId: `node-${Date.now()}-${idx}-ch`,
          title: `${this.layer2Label()} ${idx}.1: Core Topic`,
          layer: 2,
          order: 1,
          instructorTags: [],
          children: count === 3 ? [
            {
              nodeId: `node-${Date.now()}-${idx}-ch-leaf`,
              title: `${this.layer3Label()} ${idx}.1.1: Introduction Unit`,
              layer: 3,
              order: 1,
              instructorTags: [],
              content: [
                {
                  contentId: `cnt-${Date.now()}-${idx}-init`,
                  title: 'Core Concept Video',
                  family: 'learning',
                  order: 1,
                  learning: { subtype: 'video', durationMinutes: 15 },
                  authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
                }
              ]
            }
          ] : undefined,
          content: count === 2 ? [
            {
              contentId: `cnt-${Date.now()}-${idx}-init`,
              title: 'Core Concept Video',
              family: 'learning',
              order: 1,
              learning: { subtype: 'video', durationMinutes: 15 },
              authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
            }
          ] : undefined
        }
      ] : undefined,
      content: count === 1 ? [
        {
          contentId: `cnt-${Date.now()}-${idx}-init`,
          title: 'Core Concept Video',
          family: 'learning',
          order: 1,
          learning: { subtype: 'video', durationMinutes: 15 },
          authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
        }
      ] : undefined
    };

    this.structureNodes.update(nodes => [...nodes, newNode]);
    this.recentlyAddedNodeId.set(newNode.nodeId);

    // Show alert notification when user adds a chapter
    this.lmsService.showToast(
      `New ${label} "${newNode.title}" added to course structure.`,
      'success',
      4000,
      `${label} Added`
    );

    setTimeout(() => {
      if (this.recentlyAddedNodeId() === newNode.nodeId) {
        this.recentlyAddedNodeId.set(null);
      }
    }, 4500);
  }

  removeLayer1Node(nodeId: string) {
    if (this.structureNodes().length <= 1) {
      this.lmsService.showToast('A course must maintain at least one section.', 'warning', 3000, 'Structure Rule');
      return;
    }
    const label = this.layer1Label();
    this.structureNodes.update(nodes => nodes.filter(n => n.nodeId !== nodeId));
    this.lmsService.showToast(`${label} removed from course structure.`, 'info', 2500, `${label} Removed`);
  }

  addChildNode(parentNode: CourseStructureNode) {
    const nextLayer = ((parentNode.layer || 1) + 1) as 2 | 3;
    const count = this.selectedLayerCount();
    const childIdx = (parentNode.children?.length || 0) + 1;
    const label = nextLayer === 2 ? this.layer2Label() : this.layer3Label();
    const user = this.lmsService.activeUser();

    const newChild: CourseStructureNode = {
      nodeId: `node-${Date.now()}-${childIdx}`,
      title: `${label} ${childIdx}: New Section`,
      layer: nextLayer,
      order: childIdx,
      instructorTags: [],
      children: (nextLayer === 2 && count === 3) ? [
        {
          nodeId: `node-${Date.now()}-${childIdx}-leaf`,
          title: `${this.layer3Label()} ${childIdx}.1: Lesson`,
          layer: 3,
          order: 1,
          instructorTags: [],
          content: [
            {
              contentId: `cnt-${Date.now()}-def`,
              title: 'Instructional Reading',
              family: 'learning',
              order: 1,
              learning: { subtype: 'reading', durationMinutes: 10 },
              authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
            }
          ]
        }
      ] : undefined,
      content: (nextLayer === count) ? [
        {
          contentId: `cnt-${Date.now()}-def`,
          title: 'Instructional Reading',
          family: 'learning',
          order: 1,
          learning: { subtype: 'reading', durationMinutes: 10 },
          authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
        }
      ] : undefined
    };

    if (!parentNode.children) parentNode.children = [];
    parentNode.children.push(newChild);
    this.structureNodes.set([...this.structureNodes()]);
    this.recentlyAddedNodeId.set(newChild.nodeId);

    this.lmsService.showToast(
      `New ${label} "${newChild.title}" added under "${parentNode.title}".`,
      'success',
      3500,
      `${label} Added`
    );

    setTimeout(() => {
      if (this.recentlyAddedNodeId() === newChild.nodeId) {
        this.recentlyAddedNodeId.set(null);
      }
    }, 4500);
  }

  removeChildNode(parentNode: CourseStructureNode, childId: string) {
    if (parentNode.children && parentNode.children.length <= 1) {
      this.lmsService.showToast('Sections require at least one child node.', 'warning', 3000, 'Structure Gate');
      return;
    }
    parentNode.children = parentNode.children?.filter(c => c.nodeId !== childId);
    this.structureNodes.set([...this.structureNodes()]);
    this.lmsService.showToast('Section removed from course structure.', 'info', 2500, 'Section Removed');
  }

  // --- Step 3: Topic-wise and Content-wise Instructor Operations ---
  findNodeById(nodes: CourseStructureNode[], nodeId: string): CourseStructureNode | null {
    for (const n of nodes) {
      if (n.nodeId === nodeId) return n;
      if (n.children) {
        const found = this.findNodeById(n.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  findParentNode(nodes: CourseStructureNode[], targetNodeId: string, parent: CourseStructureNode | null = null): CourseStructureNode | null {
    for (const n of nodes) {
      if (n.nodeId === targetNodeId) return parent;
      if (n.children) {
        const found = this.findParentNode(n.children, targetNodeId, n);
        if (found !== null) return found;
      }
    }
    return null;
  }

  getNodeInstructor(node: CourseStructureNode): InstructorRef | null {
    if (node.instructorTags && node.instructorTags.length > 0) {
      if (node.instructorTags[0].id === '__none__') return null;
      return node.instructorTags[0];
    }
    return null;
  }

  getEffectiveNodeInstructor(node: CourseStructureNode): InstructorRef | null {
    if (node.instructorTags && node.instructorTags.length > 0) {
      if (node.instructorTags[0].id === '__none__') return null;
      return node.instructorTags[0];
    }
    const parent = this.findParentNode(this.structureNodes(), node.nodeId);
    if (parent) {
      return this.getEffectiveNodeInstructor(parent);
    }
    return null;
  }

  getParentNodeInstructor(node: CourseStructureNode): InstructorRef | null {
    const parent = this.findParentNode(this.structureNodes(), node.nodeId);
    if (!parent) return null;
    return this.getEffectiveNodeInstructor(parent);
  }

  // Batch instructor state and options
  batchAssignInstructorId = signal<string>('');

  batchInstructorOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'Choose Instructor...', icon: 'person_search' },
      ...this.lmsService.instructorsRepo().map(inst => ({
        value: inst.id,
        label: `${inst.name} (${inst.title})`,
        sublabel: `${inst.department || ''} • ${inst.email}`,
        avatar: inst.avatar,
        icon: 'person'
      }))
    ];
  });

  onBatchAssignChange(instructorId: string) {
    this.batchAssignInstructorId.set(instructorId);
    if (instructorId) {
      this.applyInstructorToAllTopics(instructorId);
    }
  }

  getTopicInstructorOptions(node: CourseStructureNode): SelectOption[] {
    const options: SelectOption[] = [];
    if (node.layer > 1) {
      const parentInst = this.getParentNodeInstructor(node);
      options.push({
        value: '__inherit__',
        label: parentInst ? `Inherit from Parent (${parentInst.name})` : 'Inherit from Parent (Unassigned)',
        avatar: parentInst?.avatar,
        icon: 'sync'
      });
    }
    options.push({
      value: '__none__',
      label: '— None (Unassigned) —',
      icon: 'person_off'
    });
    for (const inst of this.lmsService.instructorsRepo()) {
      options.push({
        value: inst.id,
        label: `${inst.name} (${inst.title})`,
        sublabel: `${inst.department || ''} • ${inst.email}`,
        avatar: inst.avatar,
        icon: 'person'
      });
    }
    return options;
  }

  getContentInstructorOptions(parentNode: CourseStructureNode): SelectOption[] {
    const eff = this.getEffectiveNodeInstructor(parentNode);
    const topicName = eff ? eff.name : 'Unassigned';
    return [
      { value: '__topic__', label: `Inherit from Topic (${topicName})`, avatar: eff?.avatar, icon: 'sync' },
      { value: '__none__', label: '— None (Unassigned) —', icon: 'person_off' },
      ...this.lmsService.instructorsRepo().map(inst => ({
        value: inst.id,
        label: `${inst.name} (${inst.title})`,
        sublabel: `${inst.department || ''} • ${inst.email}`,
        avatar: inst.avatar,
        icon: 'person'
      }))
    ];
  }

  contributorRoleOptions: SelectOption[] = [
    { value: 'authorOnly', label: 'Author', icon: 'edit_note' },
    { value: 'instructor', label: 'Instructor', icon: 'school' },
    { value: 'both', label: 'Both', icon: 'verified_user' }
  ];

  addContributorOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'Add Contributor...', icon: 'person_add' },
      ...this.lmsService.instructorsRepo().map(inst => ({
        value: inst.id,
        label: `${inst.name} (${inst.title})`,
        sublabel: `${inst.department || ''} • ${inst.email}`,
        avatar: inst.avatar,
        icon: 'person'
      }))
    ];
  });

  getNodeInstructorId(node: CourseStructureNode): string {
    if (!node.instructorTags || node.instructorTags.length === 0) {
      return node.layer === 1 ? '__none__' : '__inherit__';
    }
    if (node.instructorTags[0].id === '__none__') {
      return '__none__';
    }
    return node.instructorTags[0].id;
  }

  isNodeInstructorExplicit(node: CourseStructureNode): boolean {
    return !!(node.instructorTags && node.instructorTags.length > 0 && node.instructorTags[0].id !== '__none__');
  }

  // Topic-wise instructor assignment (Independent per topic/chapter)
  assignTopicInstructor(node: CourseStructureNode, instructorId: string) {
    const layerName = node.layer === 1 ? this.layer1Label() : (node.layer === 2 ? this.layer2Label() : this.layer3Label());

    if (!instructorId || instructorId === '__inherit__') {
      node.instructorTags = [];
      this.structureNodes.set([...this.structureNodes()]);
      const eff = this.getEffectiveNodeInstructor(node);
      this.lmsService.showToast(
        eff 
          ? `${layerName} "${node.title || 'Topic'}" will inherit instructor (${eff.name}).`
          : `Cleared instructor for ${layerName} "${node.title || 'Topic'}".`,
        'info',
        2500,
        'Topic Instructor Updated'
      );
      return;
    }

    if (instructorId === '__none__') {
      node.instructorTags = [{
        id: '__none__',
        name: 'Unassigned',
        email: '',
        avatar: '',
        title: '',
        department: '',
        specialization: []
      }];
      this.structureNodes.set([...this.structureNodes()]);
      this.lmsService.showToast(
        `Set ${layerName} "${node.title || 'Topic'}" to unassigned.`,
        'info',
        2500,
        'Topic Instructor Updated'
      );
      return;
    }

    const inst = this.lmsService.instructorsRepo().find(i => i.id === instructorId) || null;
    node.instructorTags = inst ? [inst] : [];
    this.structureNodes.set([...this.structureNodes()]);

    if (inst) {
      this.lmsService.showToast(
        `Instructor "${inst.name}" assigned to ${layerName} "${node.title || 'Topic'}".`,
        'success',
        3000,
        'Topic Instructor Assigned'
      );
    }
  }

  // Content-wise instructor getters and setters (Independent per lesson/content item)
  getContentInstructor(parentNode: CourseStructureNode, item: CourseContentItem): InstructorRef | null {
    if (item.instructorTags && item.instructorTags.length > 0) {
      if (item.instructorTags[0].id === '__none__') {
        return null;
      }
      return item.instructorTags[0];
    }
    return this.getEffectiveNodeInstructor(parentNode);
  }

  getContentInstructorId(parentNode: CourseStructureNode, item: CourseContentItem): string {
    if (!item.instructorTags || item.instructorTags.length === 0) {
      return '__topic__';
    }
    if (item.instructorTags[0].id === '__none__') {
      return '__none__';
    }
    return item.instructorTags[0].id;
  }

  isContentInstructorCustom(parentNode: CourseStructureNode, item: CourseContentItem): boolean {
    return !!(item.instructorTags && item.instructorTags.length > 0);
  }

  assignContentInstructor(parentNode: CourseStructureNode, item: CourseContentItem, instructorId: string) {
    if (instructorId === '__topic__') {
      this.resetContentInstructorToTopic(parentNode, item);
      return;
    }

    if (!instructorId || instructorId === '__none__') {
      item.instructorTags = [{
        id: '__none__',
        name: 'Unassigned',
        email: '',
        avatar: '',
        title: '',
        department: '',
        specialization: []
      }];
      this.structureNodes.set([...this.structureNodes()]);
      this.lmsService.showToast(
        `Instructor set to unassigned for lesson "${item.title}".`,
        'info',
        2500,
        'Lesson Instructor Updated'
      );
      return;
    }

    const inst = this.lmsService.instructorsRepo().find(i => i.id === instructorId);
    if (!inst) return;

    item.instructorTags = [inst];
    if (!item.authors) item.authors = [];
    if (!item.authors.some(a => a.personId === inst.id)) {
      item.authors.push({
        personId: inst.id,
        name: inst.name,
        email: inst.email,
        avatar: inst.avatar,
        kind: 'instructor',
        source: 'instructor_mgmt'
      });
    }

    this.structureNodes.set([...this.structureNodes()]);
    this.lmsService.showToast(
      `Assigned instructor "${inst.name}" to lesson "${item.title}".`,
      'success',
      3000,
      'Lesson Instructor Assigned'
    );
  }

  resetContentInstructorToTopic(parentNode: CourseStructureNode, item: CourseContentItem) {
    item.instructorTags = [];
    this.structureNodes.set([...this.structureNodes()]);
    const parentInst = this.getEffectiveNodeInstructor(parentNode);
    this.lmsService.showToast(
      parentInst 
        ? `Reset "${item.title}" to inherit from topic (${parentInst.name}).`
        : `Reset "${item.title}" to inherit from topic (currently unassigned).`,
      'info',
      2500,
      'Reset to Topic Default'
    );
  }

  // Batch helpers for user convenience
  applyInstructorToAllTopics(instructorId: string) {
    const inst = this.lmsService.instructorsRepo().find(i => i.id === instructorId) || null;
    const applyToNodes = (nodes: CourseStructureNode[]) => {
      for (const n of nodes) {
        n.instructorTags = inst ? [inst] : [];
        if (n.children) applyToNodes(n.children);
      }
    };
    applyToNodes(this.structureNodes());
    this.structureNodes.set([...this.structureNodes()]);
    if (inst) {
      this.lmsService.showToast(`Applied instructor "${inst.name}" to all topics.`, 'success', 3000, 'Batch Assigned');
    } else {
      this.lmsService.showToast('Cleared instructors across all topics.', 'info', 2500, 'Instructors Cleared');
    }
  }

  resetAllLessonsToInherited() {
    const resetNodes = (nodes: CourseStructureNode[]) => {
      for (const n of nodes) {
        if (n.content) {
          for (const item of n.content) {
            item.instructorTags = [];
          }
        }
        if (n.children) resetNodes(n.children);
      }
    };
    resetNodes(this.structureNodes());
    this.structureNodes.set([...this.structureNodes()]);
    this.lmsService.showToast('All lessons are now set to inherit from their respective topic.', 'info', 3000, 'Inherited Reset');
  }

  onContentInstructorSelectChange(parentNode: CourseStructureNode, item: CourseContentItem, selectedValue: string) {
    if (selectedValue === '__topic__') {
      this.resetContentInstructorToTopic(parentNode, item);
    } else {
      this.assignContentInstructor(parentNode, item, selectedValue);
    }
  }

  // Content Modal Operations
  openAddContentModal(nodeId: string) {
    this.activeTargetNodeId.set(nodeId);
    this.activeEditContentId.set(null);
    const targetNode = this.findNodeById(this.structureNodes(), nodeId);
    const topicInst = targetNode ? this.getNodeInstructor(targetNode) : null;

    this.contentForm.reset({
      title: '',
      family: 'learning',
      learningSubtype: 'video',
      assessmentSubtype: 'quiz',
      gradingMode: 'auto',
      durationMinutes: 15,
      passingScorePct: 80,
      instructions: '',
      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      instructorId: topicInst ? '__topic__' : ''
    });
    this.showContentModal.set(true);
  }

  openEditContentModal(nodeId: string, item: CourseContentItem) {
    this.activeTargetNodeId.set(nodeId);
    this.activeEditContentId.set(item.contentId);
    const parentNode = this.findNodeById(this.structureNodes(), nodeId);
    const instId = item.instructorTags && item.instructorTags.length > 0
      ? item.instructorTags[0].id
      : (parentNode && this.getNodeInstructor(parentNode) ? '__topic__' : '');

    this.contentForm.patchValue({
      title: item.title,
      family: item.family,
      learningSubtype: item.learning?.subtype || 'video',
      assessmentSubtype: item.assessment?.subtype || 'quiz',
      gradingMode: item.assessment?.gradingMode || 'auto',
      durationMinutes: item.learning?.durationMinutes || item.assessment?.durationMinutes || 15,
      passingScorePct: item.assessment?.passingScorePercent || 80,
      instructions: item.assessment?.instructions || '',
      mediaUrl: item.learning?.mediaUrl || '',
      instructorId: instId
    });
    this.showContentModal.set(true);
  }

  saveContentItem() {
    if (this.contentForm.invalid) return;
    const targetNodeId = this.activeTargetNodeId();
    if (!targetNodeId) return;

    const val = this.contentForm.value;
    const user = this.lmsService.activeUser();

    // Determine instructor for content item
    const targetNode = this.findNodeById(this.structureNodes(), targetNodeId);
    let itemInstructors: InstructorRef[] = [];
    if (val.instructorId === '__topic__' && targetNode) {
      const topicInst = this.getNodeInstructor(targetNode);
      if (topicInst) itemInstructors = [topicInst];
    } else if (val.instructorId) {
      const foundInst = this.lmsService.instructorsRepo().find(i => i.id === val.instructorId);
      if (foundInst) itemInstructors = [foundInst];
    }

    const contentItem: CourseContentItem = {
      contentId: this.activeEditContentId() || `cnt-${Date.now()}`,
      title: val.title.trim(),
      family: val.family,
      order: 1,
      instructorTags: itemInstructors,
      learning: val.family === 'learning' ? {
        subtype: val.learningSubtype,
        durationMinutes: val.durationMinutes,
        mediaUrl: val.mediaUrl
      } : undefined,
      assessment: val.family === 'assessment' ? {
        subtype: val.assessmentSubtype,
        gradingMode: val.gradingMode,
        passingScorePercent: val.passingScorePct,
        durationMinutes: val.durationMinutes,
        instructions: val.instructions
      } : undefined,
      authors: [
        { personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' },
        ...(itemInstructors.length > 0 && itemInstructors[0].id !== user.id ? [{
          personId: itemInstructors[0].id,
          name: itemInstructors[0].name,
          email: itemInstructors[0].email,
          avatar: itemInstructors[0].avatar,
          kind: 'instructor' as AuthorKind,
          source: 'instructor_mgmt' as const
        }] : [])
      ]
    };

    function attach(nodes: CourseStructureNode[]) {
      for (const n of nodes) {
        if (n.nodeId === targetNodeId) {
          if (!n.content) n.content = [];
          const idx = n.content.findIndex(c => c.contentId === contentItem.contentId);
          if (idx >= 0) {
            contentItem.order = n.content[idx].order || 1;
            n.content[idx] = contentItem;
          } else {
            contentItem.order = n.content.length + 1;
            n.content.push(contentItem);
          }
          return;
        }
        if (n.children) attach(n.children);
      }
    }

    attach(this.structureNodes());
    this.structureNodes.set([...this.structureNodes()]);
    this.showContentModal.set(false);
  }

  deleteContentItem(targetNodeId: string, contentId: string) {
    function del(nodes: CourseStructureNode[]) {
      for (const n of nodes) {
        if (n.nodeId === targetNodeId && n.content) {
          n.content = n.content.filter(c => c.contentId !== contentId);
          return;
        }
        if (n.children) del(n.children);
      }
    }
    del(this.structureNodes());
    this.structureNodes.set([...this.structureNodes()]);
  }

  // Topic Filter / Active View helper
  setInstructorTaggedLayer(layer: 1 | 2 | 3) {
    this.instructorTaggedLayer.set(layer);
  }

  toggleInstructorTag(node: CourseStructureNode, instructor: InstructorRef) {
    if (!node.instructorTags) node.instructorTags = [];
    const exists = node.instructorTags.some(i => i.id === instructor.id);
    if (exists) {
      node.instructorTags = [];
    } else {
      node.instructorTags = [instructor];
    }
    this.structureNodes.set([...this.structureNodes()]);
  }

  isInstructorTagged(node: CourseStructureNode, instructorId: string): boolean {
    return node.instructorTags?.some(i => i.id === instructorId) ?? false;
  }

  // Flattens all topics and sections across all layers for Step 4 & management
  getAllTopicsList(): Array<{ node: CourseStructureNode, layerName: string, path: string, layer: number }> {
    const results: Array<{ node: CourseStructureNode, layerName: string, path: string, layer: number }> = [];
    const traverse = (nodes: CourseStructureNode[], parentPath: string) => {
      for (const n of nodes) {
        const layerName = n.layer === 1 ? this.layer1Label() : (n.layer === 2 ? this.layer2Label() : this.layer3Label());
        const currentPath = parentPath ? `${parentPath} > ${n.title || layerName}` : (n.title || layerName);
        results.push({ node: n, layerName, path: currentPath, layer: n.layer });
        if (n.children && n.children.length > 0) {
          traverse(n.children, currentPath);
        }
      }
    };
    traverse(this.structureNodes(), '');
    return results;
  }

  // Author Tagging for Leaf Content Items (BRD §4.4.2)
  setAuthorKind(item: CourseContentItem, authorIndex: number, kind: AuthorKind) {
    if (item.authors && item.authors[authorIndex]) {
      item.authors[authorIndex].kind = kind;
      this.structureNodes.set([...this.structureNodes()]);
    }
  }

  getAllLeafContentItems(): Array<{ item: CourseContentItem, parentNode: CourseStructureNode, path: string }> {
    const results: Array<{ item: CourseContentItem, parentNode: CourseStructureNode, path: string }> = [];
    const traverse = (nodes: CourseStructureNode[], parentPath: string) => {
      for (const n of nodes) {
        const currentPath = parentPath ? `${parentPath} > ${n.title}` : n.title;
        if (n.content && n.content.length > 0) {
          for (const item of n.content) {
            results.push({ item, parentNode: n, path: currentPath });
          }
        }
        if (n.children && n.children.length > 0) {
          traverse(n.children, currentPath);
        }
      }
    };
    traverse(this.structureNodes(), '');
    return results;
  }

  // Step 4 filters & author attribution helpers
  step4TopicFilter = signal<'all' | number>('all');
  step4ContentFilter = signal<'all' | 'learning' | 'assessment'>('all');

  getFilteredTopicsList() {
    const list = this.getAllTopicsList();
    const filter = this.step4TopicFilter();
    if (filter === 'all') return list;
    return list.filter(item => item.layer === filter);
  }

  getFilteredLeafContentItems() {
    const list = this.getAllLeafContentItems();
    const filter = this.step4ContentFilter();
    if (filter === 'all') return list;
    return list.filter(entry => entry.item.family === filter);
  }

  addAuthorToContentItem(item: CourseContentItem, instructorId: string) {
    if (!instructorId) return;
    const inst = this.lmsService.instructorsRepo().find(i => i.id === instructorId);
    if (!inst) return;
    if (!item.authors) item.authors = [];
    if (!item.authors.some(a => a.personId === inst.id)) {
      item.authors.push({
        personId: inst.id,
        name: inst.name,
        email: inst.email,
        avatar: inst.avatar,
        kind: 'authorOnly',
        source: 'instructor_mgmt'
      });
      this.structureNodes.set([...this.structureNodes()]);
      this.lmsService.showToast(`Added ${inst.name} as contributor to "${item.title}".`, 'success', 2500);
    }
  }

  removeAuthorFromContentItem(item: CourseContentItem, authorIndex: number) {
    if (item.authors && item.authors.length > authorIndex) {
      item.authors.splice(authorIndex, 1);
      this.structureNodes.set([...this.structureNodes()]);
    }
  }

  // Step 6: Live Validation Check (Rule Engines 1, 2, 3, 4)
  courseEntitySnapshot = computed<CourseEntity>(() => {
    const dVal = this.detailsForm.value;
    const tenant = this.lmsService.activeTenant();
    const lms = this.lmsService.activeLms();
    const user = this.lmsService.activeUser();

    return {
      courseId: this.editCourseId() || 'crs-draft',
      code: dVal.code,
      title: dVal.title,
      description: dVal.description,
      ownerId: dVal.ownerId,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerAvatar: user.avatar,
      category: dVal.category,
      tags: this.courseTags(),
      difficulty: dVal.difficulty,
      durationMinutes: dVal.durationMinutes,
      coverImage: dVal.coverImage,
      lmsId: lms?.id || 'LMS-1972-01',
      lmsName: lms?.basicInfo?.lmsName || 'Current LMS',
      tenantId: tenant.id,
      structureConfig: {
        layerCount: this.selectedLayerCount(),
        layerLabels: [this.layer1Label(), this.layer2Label(), this.layer3Label()]
      },
      structure: this.structureNodes(),
      reviewsConfig: this.reviewsConfig(),
      skills: this.selectedSkillIds(),
      badgeTemplateId: this.selectedBadgeId(),
      badgeTemplateName: this.selectedBadge()?.name || '',
      certificateTemplateId: this.selectedCertificateId(),
      certificateTemplateName: this.selectedCertificate()?.name || '',
      version: {
        versionNumber: 1,
        label: 'v1.0-draft',
        state: 'draft',
        lockedInPhasesCount: 0
      },
      versionHistory: [],
      status: 'draft',
      usedInPlansCount: 0,
      usedInPhasesCount: 0,
      createdBy: user.name,
      createdById: user.id,
      createdAt: '01/09/2026',
      updatedAt: '01/09/2026'
    };
  });

  validationResult = computed(() => {
    return validateCourseEntity(this.courseEntitySnapshot());
  });

  courseMetrics = computed(() => {
    return summarizeCourseMetrics(this.courseEntitySnapshot());
  });

  // Helper for field validation
  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  /**
   * Dispatches a prominent step alert mentioning the exact step number and description, matching Organization Create
   */
  private showStepAlert(step: number, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<number, string> = {
      1: 'Step 1 of 6: Course Details',
      2: 'Step 2 of 6: Structure Setup',
      3: 'Step 3 of 6: Build Content',
      4: 'Step 4 of 6: Tagging & Credentials',
      5: 'Step 5 of 6: Feedback and Grading',
      6: 'Step 6 of 6: Review & Publish'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 6 — Course Details: Define core identifiers, ownership, category, and visual identity.',
      2: 'Step 2 of 6 — Structure Setup: Select layer depth and configure hierarchical naming conventions.',
      3: 'Step 3 of 6 — Build Content: Assemble curriculum tree, learning modules, and attached assessments.',
      4: 'Step 4 of 6 — Tagging: Map competency skills from repository, award milestone badges and configure certificate templates with live preview.',
      5: 'Step 5 of 6 — Feedback and Grading: Configure feedback collection and audit grading coverage.',
      6: 'Step 6 of 6 — Review & Publish: Audit compliance gates and publish course to catalog.'
    };

    let title = stepTitles[step] || `Step ${step} of 6`;
    let badge = `STEP ${step} / 6`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step] || `Active: Step ${step} of 6`;
    if (action === 'completed') {
      const prev = step - 1;
      const prevName = stepTitles[prev]?.split(': ')[1] || `Step ${prev}`;
      const nextName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevName}) saved. Now on Step ${step} of 6: ${nextName}.`;
      type = 'success';
    } else if (action === 'back') {
      msg = `Navigated back to Step ${step} of 6 (${stepTitles[step]?.split(': ')[1] || ''}).`;
      type = 'info';
    } else if (action === 'jump') {
      msg = `Active: Step ${step} of 6 (${stepTitles[step]?.split(': ')[1] || ''}).`;
      type = 'info';
    }

    this.lmsService.showToast(msg, type, 4000, title, badge);
  }

  // Navigation between steps
  jumpToStep(stepId: number) {
    if (stepId > this.currentStep() && this.currentStep() === 1 && this.detailsForm.invalid) {
      this.markFormGroupTouched(this.detailsForm);
      this.formErrorAlert.set('All mandatory fields are not filled up.');
      this.lmsService.showToast('Step 1 Validation: All mandatory fields are not filled up before proceeding.', 'error', 4500, 'Step 1 Error', 'STEP 1 / 6');
      this.scrollToFirstError();
      return;
    }
    this.formErrorAlert.set(null);

    // Track completed steps
    this.completedSteps.update(set => {
      const next = new Set(set);
      if (this.currentStep() === 1 && this.detailsForm.valid) {
        next.add(1);
      } else if (this.currentStep() > 1) {
        next.add(this.currentStep());
      }
      return next;
    });

    this.currentStep.set(stepId);
    this.showStepAlert(stepId, 'jump');
    this.scrollTop();
  }

  nextStep() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      if (this.detailsForm.invalid) {
        this.markFormGroupTouched(this.detailsForm);
        this.formErrorAlert.set('All mandatory fields are not filled up.');
        this.lmsService.showToast('Step 1 Validation: All mandatory fields are not filled up.', 'error', 4500, 'Step 1 Error', 'STEP 1 / 6');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });

      this.currentStep.set(2);
      this.lmsService.showToast('Step 1 (Course Details) saved. Proceeding to Step 2 of 6: Structure Setup.', 'success', 4500, 'Step 1 Completed', 'STEP 2 / 6');
      this.scrollTop();
    } else if (step === 2) {
      if (!this.layer1Label()?.trim() || (this.selectedLayerCount() >= 2 && !this.layer2Label()?.trim()) || (this.selectedLayerCount() === 3 && !this.layer3Label()?.trim())) {
        this.formErrorAlert.set('Layer label names cannot be empty.');
        this.lmsService.showToast('Step 2 Validation: Layer labels cannot be empty.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 6');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(2);
        return next;
      });

      this.currentStep.set(3);
      this.lmsService.showToast('Step 2 (Structure Setup) saved. Proceeding to Step 3 of 6: Build Content.', 'success', 4500, 'Step 2 Completed', 'STEP 3 / 6');
      this.scrollTop();
    } else if (step === 3) {
      if (!this.structureNodes() || this.structureNodes().length === 0) {
        this.formErrorAlert.set('At least one curriculum section/chapter is required.');
        this.lmsService.showToast('Step 3 Validation: Add at least one curriculum chapter before proceeding.', 'error', 4500, 'Step 3 Error', 'STEP 3 / 6');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(3);
        return next;
      });

      this.currentStep.set(4);
      this.lmsService.showToast('Step 3 (Build Content) saved. Proceeding to Step 4 of 6: Tagging & Credentials.', 'success', 4500, 'Step 3 Completed', 'STEP 4 / 6');
      this.scrollTop();
    } else if (step === 4) {
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(4);
        return next;
      });

      this.currentStep.set(5);
      this.lmsService.showToast('Step 4 (Tagging & Credentials) saved. Proceeding to Step 5 of 6: Feedback and Grading.', 'success', 4500, 'Step 4 Completed', 'STEP 5 / 6');
      this.scrollTop();
    } else if (step === 5) {
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(5);
        return next;
      });

      this.currentStep.set(6);
      this.lmsService.showToast('Step 5 (Feedback and Grading) saved. Proceeding to Step 6 of 6: Review & Publish.', 'success', 4500, 'Step 5 Completed', 'STEP 6 / 6');
      this.scrollTop();
    }
  }

  prevStep() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();
    if (step > 1) {
      const prevStep = step - 1;
      this.currentStep.set(prevStep);
      this.showStepAlert(prevStep, 'back');
      this.scrollTop();
    }
  }

  onCancel() {
    this.confirmModal.confirmDiscard({
      title: 'Discard Course Changes?',
      message: 'Are you sure you want to discard your course progress? You can save as a draft to resume later.',
      onDraft: () => this.saveAsDraft(),
      onDiscard: () => this.router.navigate(['/courses'])
    });
  }

  onReset() {
    this.initDefaultCourse();
    this.formErrorAlert.set(null);
    this.completedSteps.set(new Set<number>());
    this.lmsService.showToast('Step 1 form fields have been reset to default state.', 'info', 4000, 'Step 1 Reset', 'STEP 1 / 6');
  }

  // Save / Publish Actions
  saveAsDraft() {
    const entity = this.courseEntitySnapshot();
    if (this.isEditMode() && this.editCourseId()) {
      this.lmsService.updateCourseEntity(this.editCourseId()!, entity, true);
    } else {
      this.lmsService.addCourseEntity(entity);
    }
    const title = this.detailsForm.value.title || 'Untitled Course';
    this.lmsService.showToast(`Draft saved at Step ${this.currentStep()} of 6 for "${title}". You can resume anytime from the course library.`, 'success', 5000, `Step ${this.currentStep()} Draft Saved`, `STEP ${this.currentStep()} / 6`);
    this.router.navigate(['/courses']);
  }

  publishCourse() {
    const val = this.validationResult();
    if (!val.publishable) {
      const err = val.warnings[0] || val.missingMandatoryFields[0] || 'Course failed validation gates.';
      this.formErrorAlert.set(err);
      this.lmsService.showToast('Publish Validation Failed: ' + err, 'error', 5000, 'Publish Gate Blocked', 'STEP 6 / 6');
      this.scrollToFirstError();
      return;
    }

    let targetId = this.editCourseId();
    if (!this.isEditMode() || !targetId) {
      const newCourse = this.lmsService.addCourseEntity(this.courseEntitySnapshot());
      targetId = newCourse.courseId;
    } else {
      this.lmsService.updateCourseEntity(targetId, this.courseEntitySnapshot(), true);
    }

    const pub = this.lmsService.publishCourseEntity(targetId);
    if (pub.success) {
      this.lmsService.showToast(`Course "${this.detailsForm.value.title}" has been published and activated successfully!`, 'success', 5000, 'Course Published', 'LIVE');
      this.router.navigate(['/courses']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
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
        'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, app-custom-select.ng-invalid, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
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

  // Extract Course Structure as Template Blueprint (§8.3)
  openSaveAsTemplateModal() {
    this.tplName.set(`${this.detailsForm.value.title || 'Course'} Blueprint Template`);
    this.showSaveAsTemplateModal.set(true);
  }

  confirmSaveAsTemplate() {
    const name = this.tplName().trim();
    if (!name) return;

    let targetId = this.editCourseId();
    if (!targetId) {
      const draft = this.lmsService.addCourseEntity(this.courseEntitySnapshot());
      targetId = draft.courseId;
    }

    const res = this.lmsService.saveCourseStructureAsTemplate(targetId, {
      name,
      scope: this.tplScope()
    });

    if (res.success) {
      this.showSaveAsTemplateModal.set(false);
    }
  }
}
