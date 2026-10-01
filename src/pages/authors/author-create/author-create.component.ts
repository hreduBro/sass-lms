import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { AuthorProfile, AuthorCreateForm, PersonnelAttachment } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

export type PersonnelRoleOption = 'author' | 'instructor' | 'both';

@Component({
  selector: 'app-author-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './author-create.component.html',
})
export class AuthorCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  editAuthorId = signal<string | null>(null);

  // Unified Role Selection: author, instructor, or both
  roleSelection = signal<PersonnelRoleOption>('author');

  roleOptions: SelectOption[] = [
    {
      value: 'author',
      label: 'Author Only',
      sublabel: 'Dedicated to curriculum design, question banks, and content authoring',
      icon: 'edit_document',
      badge: 'Author',
      badgeClass: 'bg-tenant-100 text-tenant-800 dark:bg-tenant-900/40 dark:text-tenant-300'
    },
    {
      value: 'instructor',
      label: 'Instructor Only',
      sublabel: 'Dedicated to live instruction, module delivery, and grading',
      icon: 'school',
      badge: 'Instructor',
      badgeClass: 'bg-tenant-100 text-tenant-800 dark:bg-tenant-900/40 dark:text-tenant-300'
    },
    {
      value: 'both',
      label: 'Both (Instructor & Content Author)',
      sublabel: 'Full dual-role credentials for delivery and curriculum creation',
      icon: 'verified',
      badge: 'Dual Role',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    }
  ];

  avatarPreview = signal<string>('');
  attachments = signal<PersonnelAttachment[]>([]);
  isDraggingAttachments = signal<boolean>(false);
  isDraggingAvatar = signal<boolean>(false);

  statusOptions: SelectOption[] = [
    {
      value: 'Active',
      label: 'Active (Available for Tagging)',
      sublabel: 'Available for lesson, quiz, simulation & media credits',
      icon: 'check_circle',
      badge: 'Active',
      badgeClass: 'bg-emerald-100 text-emerald-700'
    },
    {
      value: 'Inactive',
      label: 'Inactive (Draft / Staged)',
      sublabel: 'Temporarily disabled from new media credit selection',
      icon: 'pause_circle',
      badge: 'Inactive',
      badgeClass: 'bg-slate-100 text-slate-700'
    }
  ];

  showErrorAlert = signal<boolean>(false);
  errorMessage = signal<string>('');
  fieldErrors = signal<{ name?: string; email?: string }>({});

  submitButtonLabel = computed<string>(() => {
    if (this.isEditMode()) {
      return 'Save Author Changes';
    }
    const role = this.roleSelection();
    if (role === 'both') return 'Create Author & Instructor';
    if (role === 'instructor') return 'Create Instructor';
    return 'Create Author';
  });

  form = signal<AuthorCreateForm & { title?: string; department?: string; teachingSpecialization?: string }>({
    name: '',
    email: '',
    contactNumber: '',
    specialization: '',
    title: '',
    department: '',
    teachingSpecialization: '',
    bio: '',
    status: 'Active'
  });

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
    
    let author = id ? this.lms.getAuthorById(id) : undefined;
    if (!author && email) {
      author = this.lms.getAuthorByEmail(email);
    }

    if (author) {
      this.isEditMode.set(true);
      this.editAuthorId.set(author.id);
      this.avatarPreview.set(author.avatar || '');
      this.attachments.set(author.attachments ? [...author.attachments] : []);
      this.roleSelection.set(author.isInstructor ? 'both' : 'author');
      this.form.set({
        name: author.name,
        email: author.email,
        contactNumber: author.contactNumber || '',
        specialization: author.specialization,
        bio: author.bio || '',
        status: author.status,
        avatar: author.avatar
      });
      this.lms.showToast('Author profile loaded for editing.', 'info', 3000);
    } else if (email) {
      const user = this.lms.users().find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        if (user.avatar) {
          this.avatarPreview.set(user.avatar);
        }
        this.form.update(f => ({
          ...f,
          name: user.name,
          email: user.email,
          contactNumber: user.phone || '',
          bio: user.bio || '',
          avatar: user.avatar
        }));
      }
    }
  }

  checkDuplicatePerson(): void {
    if (this.isEditMode()) return;
    const current = this.form();
    const email = current.email.trim();
    const name = current.name.trim();
    const contact = current.contactNumber?.trim();

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

    this.form.update(f => ({
      ...f,
      name: match.name,
      email: match.email,
      contactNumber: match.contactNumber || f.contactNumber,
      avatar: match.avatar || f.avatar
    }));
    if (match.avatar) {
      this.avatarPreview.set(match.avatar);
    }
    this.roleSelection.set('both');
    this.duplicateAlert.set(null);
    this.lms.showToast(`Linked with ${match.name}. Upgraded to dual-role (Both).`, 'success', 3500);
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.avatarPreview.set(result);
        this.form.update(f => ({ ...f, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    this.avatarPreview.set('');
    this.form.update(f => ({ ...f, avatar: '' }));
  }

  onAvatarDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingAvatar.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        this.lms.showToast('Please upload a valid image file (PNG, JPG, WebP).', 'error', 3000);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.avatarPreview.set(result);
        this.form.update(f => ({ ...f, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  onAttachmentsDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingAttachments.set(false);
    if (event.dataTransfer?.files) {
      this.handleAttachmentFiles(Array.from(event.dataTransfer.files));
    }
  }

  onAttachmentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleAttachmentFiles(Array.from(input.files));
    }
  }

  handleAttachmentFiles(files: File[]): void {
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
    const current = this.form();
    const cleanName = current.name.trim();
    const cleanEmail = current.email.trim();

    const errors: { name?: string; email?: string } = {};
    if (!cleanName) errors.name = 'Full Name is required.';
    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    }

    this.fieldErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      this.errorMessage.set('Please fill in required fields correctly.');
      this.showErrorAlert.set(true);
      return;
    }

    this.isSubmitting.set(true);
    const role = this.roleSelection();
    const attachments = this.attachments();
    const avatar = this.avatarPreview() || current.avatar;

    if (this.isEditMode() && this.editAuthorId()) {
      const authorId = this.editAuthorId()!;
      this.lms.updateAuthor(authorId, {
        name: cleanName,
        email: cleanEmail,
        contactNumber: current.contactNumber,
        specialization: current.specialization,
        bio: current.bio,
        status: current.status,
        avatar,
        attachments
      });

      if (role === 'both') {
        this.lms.tagAuthorAsInstructor(authorId, {
          title: current.title || 'Senior Faculty Instructor',
          department: current.department || 'Academic Division',
          specialization: current.specialization ? [current.specialization] : undefined
        });
      }

      this.isSubmitting.set(false);
      this.router.navigate(['/authors', authorId]);
      return;
    }

    if (role === 'author') {
      const res = this.lms.addAuthor({
        name: cleanName,
        email: cleanEmail,
        contactNumber: current.contactNumber,
        specialization: current.specialization || 'Instructional Content Design',
        bio: current.bio,
        status: current.status,
        avatar,
        attachments
      });
      this.isSubmitting.set(false);
      if (res.success) {
        this.router.navigate(['/authors', res.author.id]);
      }
    } else if (role === 'instructor') {
      const res = this.lms.addInstructor({
        name: cleanName,
        email: cleanEmail,
        contactNumber: current.contactNumber,
        title: current.title || 'Senior Course Instructor',
        department: current.department || 'Academic Faculty Division',
        specialization: current.specialization || 'Curriculum Pedagogy',
        bio: current.bio,
        status: current.status,
        avatar,
        attachments
      });
      this.isSubmitting.set(false);
      if (res.success) {
        this.router.navigate(['/instructors', res.instructor.id]);
      }
    } else if (role === 'both') {
      const authorRes = this.lms.addAuthor({
        name: cleanName,
        email: cleanEmail,
        contactNumber: current.contactNumber,
        specialization: current.specialization || 'Instructional Content Design',
        bio: current.bio,
        status: current.status,
        avatar,
        attachments
      });

      if (authorRes.success) {
        this.lms.tagAuthorAsInstructor(authorRes.author.id, {
          title: current.title || 'Senior Faculty Instructor',
          department: current.department || 'Academic Faculty Division',
          specialization: current.specialization ? [current.specialization] : undefined
        });
        this.isSubmitting.set(false);
        this.router.navigate(['/authors', authorRes.author.id]);
      } else {
        this.isSubmitting.set(false);
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/authors']);
  }
}
