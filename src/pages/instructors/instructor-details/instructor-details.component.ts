import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  InstructorProfile,
  InstructorAssignmentRecord,
  InstructorDeactivationResolution
} from '../../../models/instructor.model';
import { PersonnelAttachment } from '../../../models/author.model';
import { ComposeEmailModalComponent, EmailRecipientInfo } from '../../../components/compose-email-modal/compose-email-modal.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-instructor-details',
  imports: [CommonModule, FormsModule, RouterModule, ComposeEmailModalComponent, CustomSelectComponent],
  templateUrl: './instructor-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDetailsComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  lms = inject(LmsDataService);

  instructorId = signal<string>('');
  previewModalAttachment = signal<PersonnelAttachment | null>(null);

  statusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active (Available for Assignment)', icon: 'check_circle' },
    { value: 'Inactive', label: 'Inactive (Deactivated)', icon: 'cancel' }
  ];

  getFileIcon(attachment: PersonnelAttachment): string {
    const ext = attachment.name.split('.').pop()?.toLowerCase() || '';
    if (attachment.isImage || attachment.type.startsWith('image/')) return 'image';
    if (attachment.type.includes('pdf') || ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || attachment.type.includes('word')) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext) || attachment.type.includes('sheet')) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext) || attachment.type.includes('presentation')) return 'slideshow';
    if (attachment.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video_file';
    if (attachment.type.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(ext)) return 'audio_file';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || attachment.type.includes('zip')) return 'folder_zip';
    return 'draft';
  }

  openPreview(att: PersonnelAttachment): void {
    this.previewModalAttachment.set(att);
  }

  closePreview(): void {
    this.previewModalAttachment.set(null);
  }

  downloadAttachment(att: PersonnelAttachment): void {
    if (!att.url) return;
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.lms.showToast(`Downloading "${att.name}"...`, 'info', 2000);
  }

  // Email Modal State (§5)
  showEmailModal = signal<boolean>(false);
  emailRecipient = signal<EmailRecipientInfo | null>(null);

  // Blocked Deactivation Modal State (§3.4)
  showBlockedModal = signal<boolean>(false);
  blockedActiveRecords = signal<InstructorAssignmentRecord[]>([]);
  reassignmentSelections = signal<Record<string, string>>({});

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.instructorId.set(id);
      }
    });
  }

  instructor = computed<InstructorProfile | null>(() => {
    const id = this.instructorId();
    if (!id) return null;
    return this.lms.getInstructorById(id) || null;
  });

  assignmentHistory = computed<InstructorAssignmentRecord[]>(() => {
    const inst = this.instructor();
    if (!inst) return [];
    return this.lms.getInstructorAssignments(inst.id);
  });

  // Candidate replacement instructors for deactivation block modal
  replacementInstructors = computed(() => {
    const inst = this.instructor();
    if (!inst) return this.lms.activeInstructors();
    return this.lms.activeInstructors().filter(i => i.id !== inst.id);
  });

  resolutionOptions = computed<SelectOption[]>(() => {
    const options: SelectOption[] = [
      { value: 'remove', label: 'Remove Tag from this Layer', icon: 'delete' }
    ];
    for (const rep of this.replacementInstructors()) {
      options.push({
        value: rep.id,
        label: `Reassign to: ${rep.name}`,
        sublabel: `${rep.email} • ${rep.specialization.join(', ')}`,
        avatar: rep.avatar
      });
    }
    return options;
  });

  openEmailModal(): void {
    const inst = this.instructor();
    if (!inst) return;
    this.emailRecipient.set({
      id: inst.id,
      name: inst.name,
      email: inst.email,
      avatar: inst.avatar,
      role: 'Instructor'
    });
    this.showEmailModal.set(true);
  }

  openEditModal(): void {
    const inst = this.instructor();
    if (!inst) return;
    this.router.navigate(['/instructors/edit', inst.id]);
  }

  toggleStatus(): void {
    const inst = this.instructor();
    if (!inst) return;

    if (inst.status === 'Inactive') {
      this.lms.activateInstructor(inst.id);
    } else {
      const blockCheck = this.lms.checkInstructorDeactivationBlocked(inst.id);
      if (blockCheck.isBlocked) {
        this.blockedActiveRecords.set(blockCheck.activeRecords);
        this.reassignmentSelections.set({});
        this.showBlockedModal.set(true);
      } else {
        this.lms.deactivateInstructor(inst.id);
      }
    }
  }

  setResolutionAction(assignmentId: string, actionOrId: string): void {
    this.reassignmentSelections.update(map => ({
      ...map,
      [assignmentId]: actionOrId
    }));
  }

  resolveAndDeactivate(): void {
    const inst = this.instructor();
    if (!inst) return;

    const records = this.blockedActiveRecords();
    const selections = this.reassignmentSelections();

    let allResolved = true;
    for (const rec of records) {
      const selected = selections[rec.id];
      if (selected === 'remove') {
        this.lms.resolveInstructorAssignment({
          assignmentId: rec.id,
          courseId: rec.courseId,
          layer: rec.layer,
          action: 'remove'
        });
      } else if (selected && selected !== '') {
        this.lms.resolveInstructorAssignment({
          assignmentId: rec.id,
          courseId: rec.courseId,
          layer: rec.layer,
          action: 'reassign',
          replacementInstructorId: selected
        });
      } else {
        allResolved = false;
      }
    }

    if (!allResolved) {
      this.lms.showToast('Please specify an action for each active assignment before deactivating.', 'error', 4000, 'Action Required');
      return;
    }

    this.lms.deactivateInstructor(inst.id, true);
    this.showBlockedModal.set(false);
  }
}
