import { Phase, PhaseStatus, PrerequisiteStatus, CertificateBadgeStatus, PlanOwner, parseDateDDMMYYYY, formatDateDDMMYYYY } from './plan.model';

export type DeliveryMode = 'Online / Self-Paced' | 'Instructor-Led / In-Person' | 'Blended' | 'Virtual Classroom';
export type PrerequisiteType = 'Previous Phase Completion' | 'Specific Course Completion' | 'Minimum Score Threshold' | 'None (Free Progression)';
export type TaskStatus = 'Pending' | 'In-Progress' | 'Completed' | 'Blocked';
export type TranscriptReleaseRule = 'On Phase Completion' | 'On Achieving Passing Grade' | 'Immediate Upon Enrollment';
export type TraineeAssignmentMode = 'Individual Trainees' | 'Batch / Cohort';

export interface PhaseTask {
  id: string;
  taskName: string;
  description?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  dueDate: string; // DD/MM/YYYY
  status: TaskStatus;
  isRequiredForUnlock: boolean; // Gating task: blocks phase completion/progression
}

export interface PhaseDeliverySession {
  id: string;
  sessionName: string;
  mode: DeliveryMode;
  sessionDate: string; // DD/MM/YYYY
  startTime?: string; // HH:mm e.g. "10:00 AM"
  durationMinutes: number;
  instructorName?: string;
  instructorEmail?: string;
  venueName?: string; // For in-person/hybrid
  meetingLink?: string; // For virtual classrooms
}

export interface PhasePrerequisiteConfig {
  type: PrerequisiteType;
  requiredPhaseId?: string;
  requiredPhaseName?: string;
  requiredCourseId?: string;
  requiredCourseTitle?: string;
  minScoreThreshold?: number; // e.g. 75 (%)
  gatedByPendingTasks: boolean;
  unlockDelayDays: number;
}

export interface PhaseTraineeAssignment {
  mode: TraineeAssignmentMode;
  assignedUserIds: string[];
  batchName?: string;
  departmentScope?: string;
}

export interface PhaseOutputCredentials {
  certificateTemplateId?: string;
  certificateTemplateName?: string;
  badgeTemplateId?: string;
  badgeTemplateName?: string;
  transcriptReleaseRule: TranscriptReleaseRule;
  minPassingScore: number;
}

export interface AssignedCourseItem {
  courseId: string;
  courseTitle: string;
  courseCode?: string;
  category: string;
  duration: string;
  lessonsCount: number;
  courseOwnerName?: string;
  courseOwnerEmail?: string;
}

export interface DetailedPhase extends Phase {
  description?: string;
  phaseOwner?: PlanOwner;
  coursesDetail?: AssignedCourseItem[];
  prerequisitesConfig?: PhasePrerequisiteConfig;
  tasksList?: PhaseTask[];
  deliverySessions?: PhaseDeliverySession[];
  traineeAssignment?: PhaseTraineeAssignment;
  outputsConfig?: PhaseOutputCredentials;
  creationStatus?: 'draft' | 'saved';
  createdAt?: string;
  updatedAt?: string;
}

export interface PhaseDraftPayload {
  id: string;
  planId: string;
  planName: string;
  currentStep: number;
  basicInfo: {
    name: string;
    description: string;
    sequence: number;
    startDate: string;
    endDate: string;
    owner: PlanOwner;
  };
  courses: AssignedCourseItem[];
  prerequisites: PhasePrerequisiteConfig;
  tasks: PhaseTask[];
  delivery: {
    mode: DeliveryMode;
    sessions: PhaseDeliverySession[];
  };
  trainees: PhaseTraineeAssignment;
  outputs: PhaseOutputCredentials;
  updatedAt: string;
}

/**
 * Validates phase start and end dates against the parent Plan's timeframe and existing sibling phases.
 */
export function validatePhaseDates(
  startDateStr: string,
  endDateStr: string,
  planStartDateStr: string,
  planEndDateStr: string,
  siblingPhases: Phase[],
  editingPhaseId?: string
): { isValid: boolean; error?: string } {
  const pStart = parseDateDDMMYYYY(planStartDateStr);
  const pEnd = parseDateDDMMYYYY(planEndDateStr);
  const phStart = parseDateDDMMYYYY(startDateStr);
  const phEnd = parseDateDDMMYYYY(endDateStr);

  if (!phStart || isNaN(phStart.getTime())) {
    return { isValid: false, error: 'Invalid Phase Start Date format (required: DD/MM/YYYY).' };
  }

  if (!phEnd || isNaN(phEnd.getTime())) {
    return { isValid: false, error: 'Invalid Phase End Date format (required: DD/MM/YYYY).' };
  }

  if (phStart.getTime() > phEnd.getTime()) {
    return { isValid: false, error: 'Phase Start Date cannot be after its End Date.' };
  }

  if (pStart && phStart.getTime() < pStart.getTime()) {
    return { 
      isValid: false, 
      error: `Phase Start Date (${startDateStr}) cannot be earlier than Plan Start Date (${planStartDateStr}).` 
    };
  }

  if (pEnd && phEnd.getTime() > pEnd.getTime()) {
    return { 
      isValid: false, 
      error: `Phase End Date (${endDateStr}) cannot exceed Plan End Date (${planEndDateStr}).` 
    };
  }

  // Check sibling phases overlap
  for (const sibling of siblingPhases) {
    if (editingPhaseId && sibling.id === editingPhaseId) {
      continue;
    }
    const sibStart = parseDateDDMMYYYY(sibling.startDate);
    const sibEnd = parseDateDDMMYYYY(sibling.endDate);

    if (sibStart && sibEnd) {
      // Overlap condition: max(start1, start2) <= min(end1, end2)
      const overlapStart = Math.max(phStart.getTime(), sibStart.getTime());
      const overlapEnd = Math.min(phEnd.getTime(), sibEnd.getTime());

      if (overlapStart <= overlapEnd) {
        return {
          isValid: false,
          error: `Phase timeframe (${startDateStr} – ${endDateStr}) overlaps with sibling phase "${sibling.name}" (${sibling.startDate} – ${sibling.endDate}).`
        };
      }
    }
  }

  return { isValid: true };
}
