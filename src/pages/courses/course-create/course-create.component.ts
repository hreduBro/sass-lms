import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
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

@Component({
  selector: 'app-course-create',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './course-create.component.html'
})
export class CourseCreateComponent implements OnInit {
  lmsService = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Mode: creating new vs editing existing
  isEditMode = signal<boolean>(false);
  editCourseId = signal<string | null>(null);
  existingCourse = signal<CourseEntity | null>(null);

  // Active Wizard Step (1 to 6)
  currentStep = signal<number>(1);

  // Stepper Definition
  steps = [
    { number: 1, label: 'Course Details', icon: 'info' },
    { number: 2, label: 'Structure Setup', icon: 'account_tree' },
    { number: 3, label: 'Build Content', icon: 'format_list_bulleted' },
    { number: 4, label: 'Tagging & Authors', icon: 'group' },
    { number: 5, label: 'Reviews & Grading', icon: 'rate_review' },
    { number: 6, label: 'Review & Publish', icon: 'verified' }
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

  // Cover Image Presets
  coverImagePresets = [
    { label: 'Workspace Tech', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Classroom Leadership', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' },
    { label: 'Healthcare & Science', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Community & Field', url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80' },
    { label: 'Finance & Growth', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' }
  ];

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

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.isEditMode.set(true);
      this.editCourseId.set(courseId);
      this.loadExistingCourse(courseId);
    } else {
      this.initDefaultCourse();
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

  // Navigation between steps
  goToStep(stepNum: number) {
    if (stepNum > this.currentStep() && this.currentStep() === 1 && this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      this.lmsService.showToast('Please complete mandatory course details before proceeding.', 'warning', 3500, 'Required Fields');
      return;
    }
    this.currentStep.set(stepNum);
  }

  nextStep() {
    if (this.currentStep() < 6) {
      this.goToStep(this.currentStep() + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.goToStep(this.currentStep() - 1);
    }
  }

  // Save / Publish Actions
  saveAsDraft() {
    const entity = this.courseEntitySnapshot();
    if (this.isEditMode() && this.editCourseId()) {
      this.lmsService.updateCourseEntity(this.editCourseId()!, entity, true);
    } else {
      this.lmsService.addCourseEntity(entity);
    }
    this.router.navigate(['/courses']);
  }

  publishCourse() {
    const val = this.validationResult();
    if (!val.publishable) {
      const err = val.warnings[0] || val.missingMandatoryFields[0] || 'Course failed validation gates.';
      this.lmsService.showToast(err, 'error', 4500, 'Publish Gate Blocked');
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
      this.router.navigate(['/courses']);
    }
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
