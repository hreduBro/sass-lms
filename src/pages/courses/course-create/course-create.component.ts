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
  LAYER_LABEL_PRESETS,
  validateCourseEntity,
  summarizeCourseMetrics
} from '../../../models/course.model';
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
    { id: 4, shortTitle: 'Tagging', sublabel: 'Instructors & Authors', icon: 'group' },
    { id: 5, shortTitle: 'Reviews & Grading', sublabel: 'Feedback & Coverage', icon: 'rate_review' },
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

  // Tags state
  courseTags = signal<string[]>(['Curriculum', 'Core']);
  newTagInput = signal<string>('');

  // Step 2: Structure Configuration
  selectedLayerCount = signal<LayerCount>(3);
  layer1Label = signal<string>('Chapter');
  layer2Label = signal<string>('Topic');
  layer3Label = signal<string>('Lesson');

  layerLabelPresets = LAYER_LABEL_PRESETS;

  // Step 3: Tree Structure Data Model
  structureNodes = signal<CourseStructureNode[]>([]);

  // Step 4: Tagging Configuration
  instructorTaggedLayer = signal<1 | 2 | 3 | null>(null); // Which layer depth is chosen for tagging

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
    mediaUrl: ['']
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

    this.structureNodes.set(JSON.parse(JSON.stringify(course.structure)));
    this.reviewsConfig.set({ ...course.reviewsConfig });

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

  // Preset Layer Labels Selection
  applyLayerPreset(preset: typeof LAYER_LABEL_PRESETS[0]) {
    this.layer1Label.set(preset.labels[0] || 'Chapter');
    this.layer2Label.set(preset.labels[1] || 'Topic');
    this.layer3Label.set(preset.labels[2] || 'Lesson');
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
  }

  removeLayer1Node(nodeId: string) {
    if (this.structureNodes().length <= 1) {
      this.lmsService.showToast('A course must maintain at least one section.', 'warning', 3000, 'Structure Rule');
      return;
    }
    this.structureNodes.update(nodes => nodes.filter(n => n.nodeId !== nodeId));
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
  }

  removeChildNode(parentNode: CourseStructureNode, childId: string) {
    if (parentNode.children && parentNode.children.length <= 1) {
      this.lmsService.showToast('Sections require at least one child node.', 'warning', 3000, 'Structure Gate');
      return;
    }
    parentNode.children = parentNode.children?.filter(c => c.nodeId !== childId);
    this.structureNodes.set([...this.structureNodes()]);
  }

  // Content Modal Operations
  openAddContentModal(nodeId: string) {
    this.activeTargetNodeId.set(nodeId);
    this.activeEditContentId.set(null);
    this.contentForm.reset({
      title: '',
      family: 'learning',
      learningSubtype: 'video',
      assessmentSubtype: 'quiz',
      gradingMode: 'auto',
      durationMinutes: 15,
      passingScorePct: 80,
      instructions: '',
      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    });
    this.showContentModal.set(true);
  }

  openEditContentModal(nodeId: string, item: CourseContentItem) {
    this.activeTargetNodeId.set(nodeId);
    this.activeEditContentId.set(item.contentId);
    this.contentForm.patchValue({
      title: item.title,
      family: item.family,
      learningSubtype: item.learning?.subtype || 'video',
      assessmentSubtype: item.assessment?.subtype || 'quiz',
      gradingMode: item.assessment?.gradingMode || 'auto',
      durationMinutes: item.learning?.durationMinutes || item.assessment?.durationMinutes || 15,
      passingScorePct: item.assessment?.passingScorePercent || 80,
      instructions: item.assessment?.instructions || '',
      mediaUrl: item.learning?.mediaUrl || ''
    });
    this.showContentModal.set(true);
  }

  saveContentItem() {
    if (this.contentForm.invalid) return;
    const targetNodeId = this.activeTargetNodeId();
    if (!targetNodeId) return;

    const val = this.contentForm.value;
    const user = this.lmsService.activeUser();

    const contentItem: CourseContentItem = {
      contentId: this.activeEditContentId() || `cnt-${Date.now()}`,
      title: val.title.trim(),
      family: val.family,
      order: 1,
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
      authors: [{ personId: user.id, name: user.name, email: user.email, avatar: user.avatar, kind: 'both', source: 'instructor_mgmt' }]
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

  // Instructor Tagging (Rule Engine #2: Instructor Exclusivity)
  setInstructorTaggedLayer(layer: 1 | 2 | 3) {
    this.instructorTaggedLayer.set(layer);
    function cleanTags(nodes: CourseStructureNode[], currentDepth: 1 | 2 | 3) {
      for (const n of nodes) {
        if (currentDepth !== layer) {
          n.instructorTags = [];
        }
        if (n.children && currentDepth < 3) {
          cleanTags(n.children, (currentDepth + 1) as 2 | 3);
        }
      }
    }
    cleanTags(this.structureNodes(), 1);
    this.structureNodes.set([...this.structureNodes()]);
  }

  toggleInstructorTag(node: CourseStructureNode, instructor: InstructorRef) {
    if (!node.instructorTags) node.instructorTags = [];
    const exists = node.instructorTags.some(i => i.id === instructor.id);
    if (exists) {
      node.instructorTags = node.instructorTags.filter(i => i.id !== instructor.id);
    } else {
      node.instructorTags.push(instructor);
    }
    this.structureNodes.set([...this.structureNodes()]);
  }

  isInstructorTagged(node: CourseStructureNode, instructorId: string): boolean {
    return node.instructorTags?.some(i => i.id === instructorId) ?? false;
  }

  // Author Tagging for Leaf Content Items (BRD §4.4.2)
  setAuthorKind(item: CourseContentItem, authorIndex: number, kind: AuthorKind) {
    if (item.authors && item.authors[authorIndex]) {
      item.authors[authorIndex].kind = kind;
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
      4: 'Step 4 of 6: Tagging & Instructors',
      5: 'Step 5 of 6: Reviews & Grading',
      6: 'Step 6 of 6: Review & Publish'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 6 — Course Details: Define core identifiers, ownership, category, and visual identity.',
      2: 'Step 2 of 6 — Structure Setup: Select layer depth and configure hierarchical naming conventions.',
      3: 'Step 3 of 6 — Build Content: Assemble curriculum tree, learning modules, and attached assessments.',
      4: 'Step 4 of 6 — Tagging & Instructors: Configure instructor exclusivity and assign authors across tiers.',
      5: 'Step 5 of 6 — Reviews & Grading: Configure feedback collection and audit grading coverage.',
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
      this.lmsService.showToast('Step 3 (Build Content) saved. Proceeding to Step 4 of 6: Tagging & Instructors.', 'success', 4500, 'Step 3 Completed', 'STEP 4 / 6');
      this.scrollTop();
    } else if (step === 4) {
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(4);
        return next;
      });

      this.currentStep.set(5);
      this.lmsService.showToast('Step 4 (Tagging & Instructors) saved. Proceeding to Step 5 of 6: Reviews & Grading.', 'success', 4500, 'Step 4 Completed', 'STEP 5 / 6');
      this.scrollTop();
    } else if (step === 5) {
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(5);
        return next;
      });

      this.currentStep.set(6);
      this.lmsService.showToast('Step 5 (Reviews & Grading) saved. Proceeding to Step 6 of 6: Review & Publish.', 'success', 4500, 'Step 5 Completed', 'STEP 6 / 6');
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
