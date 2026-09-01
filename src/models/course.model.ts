import { UserRole } from './lms.model';

export type LayerCount = 1 | 2 | 3;
export type ContentFamily = 'learning' | 'assessment';
export type LearningSubtype = 'video' | 'audio' | 'document' | 'slides' | 'reading' | 'interactive';
export type AssessmentSubtype = 'quiz' | 'assignment' | 'questionnaire';
export type GradingMode = 'auto' | 'manual';
export type AuthorKind = 'authorOnly' | 'instructor' | 'both';
export type CourseStatus = 'draft' | 'published' | 'inactive';
export type VersionState = 'draft' | 'published-current' | 'published-superseded';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface InstructorRef {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  department: string;
  specialization: string[];
  rating?: number;
}

export interface CreatorRef {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  department: string;
  role: string;
}

export interface ContentAuthor {
  personId: string;
  name: string;
  email: string;
  avatar: string;
  kind: AuthorKind; // authorOnly | instructor | both (BRD §4.4.2)
  source: 'instructor_mgmt' | 'creator_mgmt';
}

export interface LearningPayload {
  subtype: LearningSubtype;
  mediaUrl?: string;
  durationMinutes: number;
  summary?: string;
  contentHtml?: string;
  attachmentName?: string;
  attachmentSize?: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}

export interface AssessmentPayload {
  subtype: AssessmentSubtype; // quiz | assignment | questionnaire
  gradingMode: GradingMode;   // auto | manual (feeds Rule Engine #3 mandatory instructor rule)
  passingScorePercent?: number;
  durationMinutes: number;
  instructions?: string;
  rubricCriteria?: string[];
  questions?: AssessmentQuestion[];
}

export interface CourseContentItem {
  contentId: string;
  title: string;
  family: ContentFamily; // learning | assessment
  learning?: LearningPayload | null;
  assessment?: AssessmentPayload | null;
  authors: ContentAuthor[]; // Authors tagged at content level (BRD §4.4.2)
  order: number;
}

export interface CourseStructureNode {
  nodeId: string;
  layer: number; // 1, 2, or 3
  title: string;
  description?: string;
  order: number;
  instructorTags: InstructorRef[]; // Tagged on structural layers (Rule Engine #2 exclusivity)
  children?: CourseStructureNode[]; // Layer 2 or Layer 3 child nodes
  content?: CourseContentItem[];    // Leaf content (ONLY under lowest selected layer)
}

export interface CourseStructureConfig {
  layerCount: LayerCount; // 1 | 2 | 3
  layerLabels: string[];   // e.g. ["Chapter", "Topic", "Lesson"]
}

export interface CourseReviewsConfig {
  contentReviewsEnabled: boolean;
  instructorReviewsEnabled: boolean;
  scale?: string; // finalized at SRS (e.g. "5-star-likert", "csat-10")
  allowComments?: boolean;
}

export interface CourseVersionInfo {
  versionNumber: number;
  label: string; // e.g. "v1.0", "v2.0"
  state: VersionState; // draft | published-current | published-superseded
  publishedAt?: string;
  publishedBy?: string;
  changeSummary?: string;
  lockedInPhasesCount: number;
  lockedPhaseNames?: string[];
}

export interface CourseVersionSnapshot {
  versionNumber: number;
  label: string;
  publishedAt: string;
  publishedBy: string;
  changeSummary: string;
  structure: CourseStructureNode[];
  structureConfig: CourseStructureConfig;
  lockedInPhases: { phaseId: string; phaseName: string; planName: string; lockedAt: string }[];
}

export interface CourseValidationResult {
  hasMinStructure: boolean;            // Rule Engine #1: >=1 layer + >=1 content item
  instructorExclusivityOk: boolean;    // Rule Engine #2: higher layer tag blocks lower layer tags
  highestTaggedLayer: number | null;   // null if none, 1, 2, or 3
  manualGradingCovered: boolean;       // Rule Engine #3: all manual assessments have instructor above them
  uncoveredManualAssessments: { contentId: string; title: string; nodeTitle: string }[];
  missingMandatoryFields: string[];    // Title, Owner, etc.
  publishable: boolean;
  warnings: string[];
}

export interface CoursePermissions {
  canViewFeature: boolean;
  canCreateCourse: boolean;
  canEditCourse: boolean;
  canPublishCourse: boolean;
  canVersionCourse: boolean;
  canDeactivateCourse: boolean;
  canTagInstructors: boolean;
  canTagAuthors: boolean;
  canConfigureReviews: boolean;
  canConfigureLayerLabels: boolean;
  canManageDashboardStudio: boolean;
}

export interface CourseEntity {
  courseId: string;
  code: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerAvatar: string;
  category: string;
  tags: string[];
  difficulty: DifficultyLevel;
  durationMinutes: number;
  coverImage: string;
  
  lmsId: string;
  lmsName: string;
  tenantId: string;
  
  structureConfig: CourseStructureConfig;
  structure: CourseStructureNode[]; // Tree with nodes and leaf content
  
  reviewsConfig: CourseReviewsConfig;
  
  version: CourseVersionInfo;
  versionHistory: CourseVersionSnapshot[];
  
  status: CourseStatus; // draft | published | inactive
  
  usedInPlansCount: number;
  usedInPhasesCount: number;
  
  createdFromTemplateId?: string;
  createdFromTemplateName?: string;
  
  createdBy: string;
  createdById: string;
  createdAt: string; // DD/MM/YYYY
  updatedAt: string; // DD/MM/YYYY
}

// Preset structure configurations
export const LAYER_LABEL_PRESETS: { name: string; count: LayerCount; labels: string[] }[] = [
  { name: 'Standard 3-Tier (Chapter / Topic / Lesson)', count: 3, labels: ['Chapter', 'Topic', 'Lesson'] },
  { name: 'Academic 3-Tier (Module / Section / Unit)', count: 3, labels: ['Module', 'Section', 'Unit'] },
  { name: 'Corporate 3-Tier (Stage / Milestone / Activity)', count: 3, labels: ['Stage', 'Milestone', 'Activity'] },
  { name: 'Streamlined 2-Tier (Module / Lesson)', count: 2, labels: ['Module', 'Lesson'] },
  { name: 'Sprint 2-Tier (Track / Session)', count: 2, labels: ['Track', 'Session'] },
  { name: 'Simple 1-Tier (Module with Content)', count: 1, labels: ['Module'] },
  { name: 'Workshop 1-Tier (Session with Content)', count: 1, labels: ['Session'] }
];

// Mock repository for Instructor Management (Interface/Mock for §7 and §8)
export const MOCK_INSTRUCTORS_REPO: InstructorRef[] = [
  {
    id: 'inst-tanvir',
    name: 'Tanvir Hossain',
    email: 'tanvir.hossain@brac.net',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    title: 'Lead Microfinance Master Instructor',
    department: 'Microfinance & Financial Inclusion',
    specialization: ['Responsible Lending', 'Credit Risk', 'Client Protection'],
    rating: 4.95
  },
  {
    id: 'inst-farhana',
    name: 'Farhana Ahmed',
    email: 'farhana.ahmed@brac.net',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    title: 'Principal Compliance & Operations Specialist',
    department: 'Learning & People Division',
    specialization: ['Regulatory Frameworks', 'Anti-Money Laundering', 'Operational Audit'],
    rating: 4.98
  },
  {
    id: 'inst-nusrat',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@brac.net',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    title: 'Ultra-Poor Graduation Program Lead',
    department: 'Ultra-Poor Graduation',
    specialization: ['Livelihood Coaching', 'Asset Transfer', 'Household Mentorship'],
    rating: 4.92
  },
  {
    id: 'inst-shakil',
    name: 'Shakil Anwar',
    email: 'shakil.anwar@brac.net',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    title: 'Climate Resilience & Disaster Hub Director',
    department: 'Climate Change & Disaster Management',
    specialization: ['Early Warning Systems', 'Emergency Logistics', 'Needs Assessment'],
    rating: 4.88
  },
  {
    id: 'inst-sadia',
    name: 'Sadia Rahman',
    email: 'sadia.rahman@brac.net',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    title: 'Digital Pedagogy & Assessment Lead',
    department: 'Education & Youth Skills (BEP)',
    specialization: ['Curriculum Design', 'Instructional Assessment', 'Interactive Media'],
    rating: 4.91
  }
];

// Mock repository for Creator Management (Interface/Mock for §8)
export const MOCK_CREATORS_REPO: CreatorRef[] = [
  {
    id: 'creator-1',
    name: 'Mahbubur Rahman',
    email: 'mahbubur.r@brac.net',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    title: 'Senior Instructional Media Designer',
    department: 'Digital Learning Lab',
    role: 'Course Author & Interactive Media Producer'
  },
  {
    id: 'creator-2',
    name: 'Ayesha Siddiqua',
    email: 'ayesha.s@brac.net',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    title: 'Field Research & Case Study Author',
    department: 'Research & Evaluation Division',
    role: 'Pedagogical Content Creator'
  },
  {
    id: 'creator-3',
    name: 'Kamrul Hasan',
    email: 'kamrul.h@brac.net',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    title: 'Technical Curriculum Architect',
    department: 'IT & Digital Transformation',
    role: 'Interactive Simulator & Assessment Author'
  }
];

// =========================================================================
// RULE ENGINES & VALIDATION (BRD §4.4)
// =========================================================================

/**
 * Validates a Course Entity according to the 4 hard rule engines:
 * 1. Min Structure (>=1 layer + >=1 content item)
 * 2. Instructor Exclusivity (tagging at higher layer blocks lower layers)
 * 3. Mandatory Instructor for Manual Grading (blocks publish if manual grading lacks instructor above it)
 * 4. Mandatory Metadata fields
 */
export function validateCourseEntity(course: CourseEntity): CourseValidationResult {
  const missingMandatoryFields: string[] = [];
  const warnings: string[] = [];

  if (!course.title?.trim()) {
    missingMandatoryFields.push('Course Title');
  }
  if (!course.ownerId?.trim()) {
    missingMandatoryFields.push('Course Owner');
  }
  if (!course.category?.trim()) {
    missingMandatoryFields.push('Category');
  }

  // Count structure nodes and leaf content items
  let totalLayerNodes = 0;
  let totalContentItems = 0;
  const taggedLayers = new Set<number>();

  interface NodeInspection {
    node: CourseStructureNode;
    parentInstructorTags: InstructorRef[];
  }

  const uncoveredManualAssessments: { contentId: string; title: string; nodeTitle: string }[] = [];

  function inspectNodes(
    nodes: CourseStructureNode[], 
    currentLayer: number, 
    inheritedInstructorTags: InstructorRef[]
  ) {
    for (const node of nodes) {
      totalLayerNodes++;
      
      const nodeInstructors = node.instructorTags || [];
      if (nodeInstructors.length > 0) {
        taggedLayers.add(node.layer);
      }

      const effectiveInstructors = nodeInstructors.length > 0 
        ? nodeInstructors 
        : inheritedInstructorTags;

      // Inspect child nodes
      if (node.children && node.children.length > 0) {
        inspectNodes(node.children, currentLayer + 1, effectiveInstructors);
      }

      // Inspect leaf content
      if (node.content && node.content.length > 0) {
        for (const item of node.content) {
          totalContentItems++;
          
          // Check Rule Engine #3: Manual Grading mandatory instructor
          if (item.family === 'assessment' && item.assessment?.gradingMode === 'manual') {
            if (effectiveInstructors.length === 0) {
              uncoveredManualAssessments.push({
                contentId: item.contentId,
                title: item.title,
                nodeTitle: node.title
              });
            }
          }
        }
      }
    }
  }

  if (course.structure && course.structure.length > 0) {
    inspectNodes(course.structure, 1, []);
  }

  // Rule Engine #1: Min structure
  const hasMinStructure = totalLayerNodes >= 1 && totalContentItems >= 1;
  if (!hasMinStructure) {
    warnings.push('A course needs at least one layer and at least one content item.');
  }

  // Rule Engine #2: Instructor Exclusivity
  // If instructors are tagged at a higher level, instructors must not be tagged at lower levels.
  // Effectively, there can only be ONE active instructor-tagging layer across the entire course.
  const taggedLayerArray = Array.from(taggedLayers).sort((a, b) => a - b);
  let instructorExclusivityOk = true;
  let highestTaggedLayer: number | null = null;

  if (taggedLayerArray.length > 0) {
    highestTaggedLayer = taggedLayerArray[0];
    if (taggedLayerArray.length > 1) {
      instructorExclusivityOk = false;
      warnings.push(`Instructors are tagged at multiple levels (Layers: ${taggedLayerArray.join(', ')}). Exclusivity requires tagging at a single layer depth.`);
    }
  }

  // Rule Engine #3: Mandatory Instructor for Manual Grading
  const manualGradingCovered = uncoveredManualAssessments.length === 0;
  if (!manualGradingCovered) {
    warnings.push(`Publishing is blocked: ${uncoveredManualAssessments.length} manual-graded assessment(s) have no responsible instructor tagged above them.`);
  }

  const publishable = 
    missingMandatoryFields.length === 0 && 
    hasMinStructure && 
    instructorExclusivityOk && 
    manualGradingCovered;

  return {
    hasMinStructure,
    instructorExclusivityOk,
    highestTaggedLayer,
    manualGradingCovered,
    uncoveredManualAssessments,
    missingMandatoryFields,
    publishable,
    warnings
  };
}

/**
 * Counts total content items, learning vs assessment, and manual grading count in a course
 */
export function summarizeCourseMetrics(course: CourseEntity) {
  let totalNodes = 0;
  let totalContent = 0;
  let learningCount = 0;
  let assessmentCount = 0;
  let manualGradingCount = 0;
  let autoGradingCount = 0;
  let totalAuthorsCount = 0;
  const taggedInstructorsMap = new Map<string, InstructorRef>();
  const authorsMap = new Map<string, ContentAuthor>();

  function traverse(nodes: CourseStructureNode[]) {
    for (const node of nodes) {
      totalNodes++;
      for (const inst of node.instructorTags || []) {
        taggedInstructorsMap.set(inst.id, inst);
      }
      if (node.children) traverse(node.children);
      if (node.content) {
        for (const item of node.content) {
          totalContent++;
          if (item.family === 'learning') learningCount++;
          if (item.family === 'assessment') {
            assessmentCount++;
            if (item.assessment?.gradingMode === 'manual') {
              manualGradingCount++;
            } else {
              autoGradingCount++;
            }
          }
          for (const auth of item.authors || []) {
            totalAuthorsCount++;
            authorsMap.set(auth.personId, auth);
          }
        }
      }
    }
  }

  if (course.structure) traverse(course.structure);

  return {
    totalNodes,
    totalContent,
    learningCount,
    assessmentCount,
    manualGradingCount,
    autoGradingCount,
    uniqueInstructors: Array.from(taggedInstructorsMap.values()),
    uniqueAuthors: Array.from(authorsMap.values()),
    totalAuthorsCount
  };
}
