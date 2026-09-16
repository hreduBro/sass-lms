import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { InstructorCreateForm, InstructorProfile } from '../../../models/instructor.model';
import { PersonnelAttachment } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-instructor-create',
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './instructor-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  editInstructorId = signal<string | null>(null);

  // Avatar & Media Upload State
  avatarPreview = signal<string>('');
  attachments = signal<PersonnelAttachment[]>([]);
  isDraggingAttachments = signal<boolean>(false);
  isDraggingAvatar = signal<boolean>(false);
  previewModalAttachment = signal<PersonnelAttachment | null>(null);

  // Status options for custom select component
  statusOptions: SelectOption[] = [
    {
      value: 'Active',
      label: 'Active (Available for Course Delivery Layers)',
      sublabel: 'Ready for assignment to course delivery instances across organizations',
      icon: 'check_circle',
      badge: 'Active',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
    },
    {
      value: 'Inactive',
      label: 'Inactive (Draft / Staged Profile)',
      sublabel: 'Temporarily hidden from faculty selection lists',
      icon: 'pause_circle',
      badge: 'Inactive',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  ];

  attachmentCategoryOptions: { value: PersonnelAttachment['category']; label: string; icon: string }[] = [
    { value: 'CV / Resume', label: 'CV / Academic Resume', icon: 'badge' },
    { value: 'Certificate / Credential', label: 'Faculty Certificate / Credential', icon: 'verified' },
    { value: 'Portfolio / Sample', label: 'Sample Syllabus / Lecture Media', icon: 'folder_special' },
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

  formData: InstructorCreateForm = {
    name: '',
    email: '',
    contactNumber: '',
    title: '',
    department: '',
    specialization: '',
    bio: '',
    status: 'Active'
  };

  // Duplicate Person Detection State (§2.2)
  isCheckingPerson = signal<boolean>(false);
  existingPersonFound = signal<{
    found: boolean;
    name?: string;
    email?: string;
    avatar?: string;
    isAuthor?: boolean;
    authorId?: string;
    isInstructor?: boolean;
  } | null>(null);

  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    const email = this.route.snapshot.queryParamMap.get('email');

    let instructor = id ? this.lms.getInstructorById(id) : undefined;
    if (!instructor && email) {
      instructor = this.lms.getInstructorByEmail(email);
    }

    if (instructor) {
      this.isEditMode.set(true);
      this.editInstructorId.set(instructor.id);
      this.avatarPreview.set(instructor.avatar || '');
      this.attachments.set(instructor.attachments ? [...instructor.attachments] : []);
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
      this.lms.showToast('Instructor Profile loaded for editing. You can update documents, photo, and faculty credentials.', 'info', 3500, 'Instructor Profile');
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
        this.lms.showToast(`Completing Instructor profile for "${user.name}".`, 'info', 3500, 'Instructor Onboarding');
      }
    } else {
      this.lms.showToast(
        'Welcome to Instructor Profile Onboarding. Upload documents, certificates, or profile image.',
        'info',
        4000,
        'Instructor Onboarding'
      );
    }
  }

  dismissEnterAlert(): void {
    this.showEnterAlert.set(false);
  }

  dismissErrorAlert(): void {
    this.showErrorAlert.set(false);
  }

  dismissSuccessAlert(): void {
    this.showSuccessAlert.set(false);
  }

  onFieldInput(field: 'name' | 'email'): void {
    const current = { ...this.fieldErrors() };
    if (current[field]) {
      delete current[field];
      this.fieldErrors.set(current);
      if (Object.keys(current).length === 0) {
        this.showErrorAlert.set(false);
      }
    }
  }

  updateStatus(status: 'Active' | 'Inactive'): void {
    this.formData.status = status;
  }

  checkEmailForExistingPerson(): void {
    const cleanEmail = this.formData.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      this.existingPersonFound.set(null);
      return;
    }

    this.isCheckingPerson.set(true);
    const result = this.lms.findExistingPerson(cleanEmail);
    this.isCheckingPerson.set(false);

    if (result.found) {
      this.existingPersonFound.set(result);
      if (!this.formData.name && result.name) {
        this.formData.name = result.name;
      }
      if (!this.avatarPreview() && result.avatar) {
        this.avatarPreview.set(result.avatar);
      }
    } else {
      this.existingPersonFound.set(null);
    }
  }

  // =========================================================================
  // AVATAR / PROFILE PHOTO UPLOAD HANDLING
  // =========================================================================
  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.readAvatarFile(input.files[0]);
    }
  }

  onAvatarDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingAvatar.set(false);
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.readAvatarFile(file);
      } else {
        this.lms.showToast('Please upload a valid image file (PNG, JPG, SVG, WebP) for profile photo.', 'error', 3500, 'Invalid Photo');
      }
    }
  }

  private readAvatarFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.lms.showToast('Avatar image exceeds 10MB limit. Please choose a smaller image.', 'error', 3500, 'File Too Large');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.avatarPreview.set(result);
        this.formData.avatar = result;
        this.lms.showToast('Profile photo updated successfully.', 'success', 2500, 'Photo Uploaded');
      }
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview.set('');
    this.formData.avatar = undefined;
    this.lms.showToast('Profile photo cleared.', 'info', 2000);
  }

  generateRandomAvatar(): void {
    const randomSeed = Math.floor(Math.random() * 999999);
    const url = `https://images.unsplash.com/photo-${1500000000000 + randomSeed}?auto=format&fit=crop&w=240&q=80`;
    this.avatarPreview.set(url);
    this.formData.avatar = url;
    this.lms.showToast('Random avatar assigned.', 'success', 2000);
  }

  // =========================================================================
  // DOCUMENTS & MEDIA ATTACHMENTS UPLOAD HANDLING
  // =========================================================================
  onAttachmentsFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processIncomingFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  onAttachmentsDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingAttachments.set(false);
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.processIncomingFiles(Array.from(event.dataTransfer.files));
    }
  }

  private processIncomingFiles(files: File[]): void {
    const now = new Date();
    const formattedTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let uploadedCount = 0;
    for (const file of files) {
      const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(file.name);
      const isPdf = file.type.includes('pdf') || /\.pdf$/i.test(file.name);
      const isDoc = /\.(doc|docx|txt|rtf|odt)$/i.test(file.name) || file.type.includes('word');
      
      let defaultCategory: PersonnelAttachment['category'] = 'General Document';
      if (isPdf || isDoc) {
        if (/cv|resume|curriculum/i.test(file.name)) {
          defaultCategory = 'CV / Resume';
        } else if (/cert|award|degree|diploma|badge|faculty|phd/i.test(file.name)) {
          defaultCategory = 'Certificate / Credential';
        } else if (/id|passport|nid|license/i.test(file.name)) {
          defaultCategory = 'Identity / Government ID';
        }
      } else if (isImage) {
        defaultCategory = 'Portfolio / Sample';
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const url = (e.target?.result as string) || '';
        const attachment: PersonnelAttachment = {
          id: `att-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: file.name,
          size: file.size,
          sizeFormatted: this.formatFileSize(file.size),
          type: file.type || 'application/octet-stream',
          category: defaultCategory,
          url,
          uploadedAt: formattedTime,
          isImage
        };

        this.attachments.update(list => [...list, attachment]);
        uploadedCount++;
        if (uploadedCount === files.length) {
          this.lms.showToast(`${files.length} document/media file(s) attached successfully.`, 'success', 3000, 'Files Uploaded');
        }
      };

      reader.readAsDataURL(file);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

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

  removeAttachment(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    const target = this.attachments()[index];
    this.attachments.update(list => list.filter((_, i) => i !== index));
    if (this.previewModalAttachment()?.id === target?.id) {
      this.previewModalAttachment.set(null);
    }
    this.lms.showToast(`Removed "${target.name}".`, 'info', 2000);
  }

  updateAttachmentCategory(index: number, category: any): void {
    this.attachments.update(list => list.map((item, i) => i === index ? { ...item, category } : item));
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

  validateForm(): boolean {
    const errors: { name?: string; email?: string } = {};
    let firstErrorElementId: string | null = null;

    if (!this.formData.name.trim()) {
      errors.name = 'Full Name is required and cannot be empty.';
      if (!firstErrorElementId) firstErrorElementId = 'instructor-name';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.formData.email.trim()) {
      errors.email = 'Institutional Email is required as the unique Person identity key.';
      if (!firstErrorElementId) firstErrorElementId = 'instructor-email';
    } else if (!emailPattern.test(this.formData.email.trim())) {
      errors.email = 'Please provide a valid email format (e.g. name@brac.net).';
      if (!firstErrorElementId) firstErrorElementId = 'instructor-email';
    }

    this.fieldErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ');
      this.errorMessage.set(messages);
      this.showErrorAlert.set(true);
      this.lms.showToast('Please fix the highlighted required fields.', 'error', 4000, 'Validation Error');

      // Smooth scroll up to the first error field and focus it
      if (firstErrorElementId) {
        setTimeout(() => {
          const el = document.getElementById(firstErrorElementId!);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }, 50);
      }
      return false;
    }

    this.showErrorAlert.set(false);
    this.errorMessage.set('');
    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);
    const avatar = this.avatarPreview().trim() || undefined;
    const attachments = this.attachments();

    if (this.isEditMode() && this.editInstructorId()) {
      const specs = typeof this.formData.specialization === 'string'
        ? this.formData.specialization.split(',').map(s => s.trim()).filter(Boolean)
        : this.formData.specialization;

      const success = this.lms.updateInstructor(this.editInstructorId()!, {
        name: this.formData.name.trim(),
        email: this.formData.email.trim(),
        contactNumber: this.formData.contactNumber?.trim() || undefined,
        title: this.formData.title?.trim() || 'Senior Faculty Instructor',
        department: this.formData.department?.trim() || 'Academic & Faculty Division',
        specialization: specs.length > 0 ? specs : ['General Pedagogy'],
        bio: this.formData.bio?.trim() || undefined,
        status: this.formData.status,
        avatar: avatar || undefined,
        attachments
      });
      this.isSubmitting.set(false);

      if (success) {
        this.successMessage.set(`Instructor profile "${this.formData.name}" has been updated successfully with ${attachments.length} document/media attachment(s).`);
        this.showSuccessAlert.set(true);
        this.lms.showToast('Instructor profile updated successfully!', 'success', 3000, 'Changes Saved');
        setTimeout(() => {
          this.router.navigate(['/instructors', this.editInstructorId()]);
        }, 800);
      }
    } else {
      const result = this.lms.addInstructor({
        ...this.formData,
        avatar,
        attachments
      });
      this.isSubmitting.set(false);

      if (result.success) {
        this.successMessage.set(`Instructor profile for "${result.instructor.name}" has been created successfully with ${attachments.length} attached document(s).`);
        this.showSuccessAlert.set(true);
        this.lms.showToast('Instructor Profile Created Successfully!', 'success', 3000, 'Profile Saved');
        setTimeout(() => {
          this.router.navigate(['/instructors', result.instructor.id]);
        }, 800);
      }
    }
  }
}
