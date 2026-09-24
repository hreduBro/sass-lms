import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { InstructorCreateForm, InstructorProfile } from '../../../models/instructor.model';
import { PersonnelAttachment } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

export type PersonnelRoleOption = 'instructor' | 'author' | 'both';

@Component({
  selector: 'app-instructor-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './instructor-create.component.html',
})
export class InstructorCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  editInstructorId = signal<string | null>(null);

  // Unified Role Selection: instructor, author, or both
  roleSelection = signal<PersonnelRoleOption>('instructor');

  roleOptions: SelectOption[] = [
    {
      value: 'instructor',
      label: 'Instructor Only',
      sublabel: 'Dedicated to live instruction, module delivery, and grading',
      icon: 'school',
      badge: 'Instructor',
      badgeClass: 'bg-blue-100 text-blue-800'
    },
    {
      value: 'author',
      label: 'Author Only',
      sublabel: 'Dedicated to curriculum design, question banks, and content authoring',
      icon: 'edit_document',
      badge: 'Author',
      badgeClass: 'bg-purple-100 text-purple-800'
    },
    {
      value: 'both',
      label: 'Both (Instructor & Content Author)',
      sublabel: 'Full dual-role credentials for delivery and curriculum creation',
      icon: 'verified',
      badge: 'Dual Role',
      badgeClass: 'bg-emerald-100 text-emerald-800'
    }
  ];

  // Avatar & Media Upload State
  avatarPreview = signal<string>('');
  attachments = signal<PersonnelAttachment[]>([]);
  isDraggingAttachments = signal<boolean>(false);
  isDraggingAvatar = signal<boolean>(false);
  previewModalAttachment = signal<PersonnelAttachment | null>(null);

  statusOptions: SelectOption[] = [
    {
      value: 'Active',
      label: 'Active (Available for Assignment)',
      sublabel: 'Ready for course delivery and content tagging',
      icon: 'check_circle',
      badge: 'Active',
      badgeClass: 'bg-emerald-100 text-emerald-700'
    },
    {
      value: 'Inactive',
      label: 'Inactive (Draft / Staged Profile)',
      sublabel: 'Temporarily hidden from selection lists',
      icon: 'pause_circle',
      badge: 'Inactive',
      badgeClass: 'bg-slate-100 text-slate-700'
    }
  ];

  attachmentCategoryOptions: { value: PersonnelAttachment['category']; label: string; icon: string }[] = [
    { value: 'CV / Resume', label: 'CV / Academic Resume', icon: 'badge' },
    { value: 'Certificate / Credential', label: 'Teaching Certificate / Credential', icon: 'verified' },
    { value: 'Portfolio / Sample', label: 'Sample Syllabus / Content', icon: 'folder_special' },
    { value: 'Identity / Government ID', label: 'Identity / Verification Doc', icon: 'id_card' },
    { value: 'General Document', label: 'General Document / Notes', icon: 'description' },
    { value: 'Other Media', label: 'Other Media Assets', icon: 'perm_media' }
  ];

  // In-page Alerts State
  showEnterAlert = signal<boolean>(true);
  showErrorAlert = signal<boolean>(false);
  showSuccessAlert = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Field-specific validation errors
  fieldErrors = signal<{ name?: string; email?: string }>({});

  submitButtonLabel = computed<string>(() => {
    if (this.isEditMode()) {
      return 'Save Instructor Changes';
    }
    const role = this.roleSelection();
    if (role === 'both') return 'Create Author & Instructor';
    if (role === 'author') return 'Create Author';
    return 'Create Instructor';
  });

  formData: InstructorCreateForm & { contentSpecialization?: string } = {
    name: '',
    email: '',
    contactNumber: '',
    title: '',
    department: '',
    specialization: '',
    contentSpecialization: '',
    bio: '',
    status: 'Active'
  };

  // Duplicate Person Detection State (Name + Email + Contact)
  duplicateAlert = signal<{
    isDuplicate: boolean;
    reason?: string;
    matchedPerson?: {
      name: string;
      email: string;
      contactNumber?: string;
      avatar?: string;
      isAuthor: boolean;
      isInstructor: boolean;
      authorId?: string;
      instructorId?: string;
      source: string;
    };
    similarityScore: number;
  } | null>(null);

  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    const email = this.route.snapshot.queryParamMap.get('email');
    const defaultRole = this.route.snapshot.queryParamMap.get('role') as PersonnelRoleOption | null;

    if (defaultRole && ['instructor', 'author', 'both'].includes(defaultRole)) {
      this.roleSelection.set(defaultRole);
    }

    let instructor = id ? this.lms.getInstructorById(id) : undefined;
    if (!instructor && email) {
      instructor = this.lms.getInstructorByEmail(email);
    }

    if (instructor) {
      this.isEditMode.set(true);
      this.editInstructorId.set(instructor.id);
      this.avatarPreview.set(instructor.avatar || '');
      this.attachments.set(instructor.attachments ? [...instructor.attachments] : []);
      this.roleSelection.set(instructor.isAuthor ? 'both' : 'instructor');
      this.formData = {
        name: instructor.name,
        email: instructor.email,
        contactNumber: instructor.contactNumber || '',
        title: instructor.title || '',
        department: instructor.department || '',
        specialization: Array.isArray(instructor.specialization) ? instructor.specialization.join(', ') : instructor.specialization,
        bio: instructor.bio || '',
        status: instructor.status,
        avatar: instructor.avatar
      };
      this.lms.showToast('Profile loaded for editing. You can update documents, credentials, and role permissions.', 'info', 3500);
    } else if (email) {
      const user = this.lms.users().find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        if (user.avatar) {
          this.avatarPreview.set(user.avatar);
        }
        this.formData.name = user.name;
        this.formData.email = user.email;
        this.formData.contactNumber = user.phone || '';
        this.formData.bio = user.bio || '';
        this.formData.department = user.department || '';
        this.formData.title = user.title || '';
        this.formData.avatar = user.avatar;
      }
    }
  }

  // Trigger duplicate checks whenever email, name, or contact changes
  checkDuplicatePerson(): void {
    if (this.isEditMode()) return;

    const email = this.formData.email.trim();
    const name = this.formData.name.trim();
    const contact = this.formData.contactNumber?.trim();

    if (email || (name && name.length >= 3) || (contact && contact.length >= 7)) {
      const dup = this.lms.detectDuplicates({
        name,
        email,
        contactNumber: contact
      });

      if (dup.isDuplicate) {
        this.duplicateAlert.set(dup);
      } else {
        this.duplicateAlert.set(null);
      }
    } else {
      this.duplicateAlert.set(null);
    }
  }

  linkWithExistingPerson(): void {
    const dup = this.duplicateAlert();
    if (!dup || !dup.matchedPerson) return;
    const match = dup.matchedPerson;

    this.formData.name = match.name;
    this.formData.email = match.email;
    if (match.contactNumber) {
      this.formData.contactNumber = match.contactNumber;
    }
    if (match.avatar) {
      this.avatarPreview.set(match.avatar);
      this.formData.avatar = match.avatar;
    }
    this.roleSelection.set('both');
    this.duplicateAlert.set(null);
    this.lms.showToast(`Linked with existing record for ${match.name}. Role updated to Both.`, 'success', 3500);
  }

  dismissDuplicateAlert(): void {
    this.duplicateAlert.set(null);
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.lms.showToast('Please upload a valid image file (PNG, JPG, WebP).', 'error', 3000);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.avatarPreview.set(result);
        this.formData.avatar = result;
      };
      reader.readAsDataURL(file);
    }
  }

  onAttachmentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processAttachmentFiles(Array.from(input.files));
    }
  }

  private processAttachmentFiles(files: File[]): void {
    for (const file of files) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const isImg = file.type.startsWith('image/');
      const newAtt: PersonnelAttachment = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: file.name,
        size: file.size,
        sizeFormatted: `${sizeMb} MB`,
        type: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toLocaleDateString(),
        category: isImg ? 'Portfolio / Sample' : 'CV / Resume',
        isImage: isImg
      };
      this.attachments.update(list => [...list, newAtt]);
    }
  }

  removeAttachment(id: string): void {
    this.attachments.update(list => list.filter(a => a.id !== id));
  }

  onSubmit(): void {
    const cleanName = this.formData.name.trim();
    const cleanEmail = this.formData.email.trim();

    const errors: { name?: string; email?: string } = {};
    if (!cleanName) errors.name = 'Full Name is required.';
    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    }

    this.fieldErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      this.errorMessage.set('Please correct the highlighted form errors before proceeding.');
      this.showErrorAlert.set(true);
      return;
    }

    this.isSubmitting.set(true);
    const role = this.roleSelection();
    const attachments = this.attachments();
    const avatar = this.avatarPreview() || this.formData.avatar;

    if (this.isEditMode() && this.editInstructorId()) {
      const instructorId = this.editInstructorId()!;
      const specs = typeof this.formData.specialization === 'string'
        ? this.formData.specialization.split(',').map(s => s.trim()).filter(Boolean)
        : (this.formData.specialization || []);

      this.lms.updateInstructor(instructorId, {
        name: cleanName,
        email: cleanEmail,
        contactNumber: this.formData.contactNumber,
        title: this.formData.title,
        department: this.formData.department,
        specialization: specs,
        bio: this.formData.bio,
        status: this.formData.status,
        avatar,
        attachments
      });

      if (role === 'both') {
        this.lms.tagInstructorAsAuthor(instructorId, {
          specialization: this.formData.contentSpecialization || specs[0],
          bio: this.formData.bio
        });
      }

      this.isSubmitting.set(false);
      this.router.navigate(['/instructors', instructorId]);
      return;
    }

    // New Creation Flow
    if (role === 'instructor') {
      const res = this.lms.addInstructor({
        ...this.formData,
        avatar,
        attachments
      });
      this.isSubmitting.set(false);
      if (res.success) {
        this.router.navigate(['/instructors', res.instructor.id]);
      }
    } else if (role === 'author') {
      const res = this.lms.addAuthor({
        name: cleanName,
        email: cleanEmail,
        contactNumber: this.formData.contactNumber,
        specialization: this.formData.contentSpecialization || (typeof this.formData.specialization === 'string' ? this.formData.specialization : 'Curriculum Design'),
        bio: this.formData.bio,
        status: this.formData.status,
        avatar,
        attachments
      });
      this.isSubmitting.set(false);
      if (res.success) {
        this.router.navigate(['/authors', res.author.id]);
      }
    } else if (role === 'both') {
      // Create both profiles and cross-link
      const instRes = this.lms.addInstructor({
        ...this.formData,
        avatar,
        attachments
      });

      if (instRes.success) {
        this.lms.tagInstructorAsAuthor(instRes.instructor.id, {
          specialization: this.formData.contentSpecialization || (typeof this.formData.specialization === 'string' ? this.formData.specialization : 'Curriculum Design'),
          bio: this.formData.bio
        });
        this.isSubmitting.set(false);
        this.router.navigate(['/instructors', instRes.instructor.id]);
      } else {
        this.isSubmitting.set(false);
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/instructors']);
  }
}
