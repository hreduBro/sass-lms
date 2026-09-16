import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { AuthorProfile, AuthorCreateForm, PersonnelAttachment } from '../../../models/author.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

@Component({
  selector: 'app-author-create',
  imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './author-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorCreateComponent implements OnInit {
  lms = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  editAuthorId = signal<string | null>(null);

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
      label: 'Active (Available for Content Tagging)',
      sublabel: 'Available for lesson, quiz, simulation & media credits',
      icon: 'check_circle',
      badge: 'Active',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
    },
    {
      value: 'Inactive',
      label: 'Inactive (Draft / Staged)',
      sublabel: 'Temporarily disabled from new media credit selection',
      icon: 'pause_circle',
      badge: 'Inactive',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  ];

  attachmentCategoryOptions: { value: PersonnelAttachment['category']; label: string; icon: string }[] = [
    { value: 'CV / Resume', label: 'CV / Resume', icon: 'badge' },
    { value: 'Certificate / Credential', label: 'Certificate / Credential', icon: 'verified' },
    { value: 'Portfolio / Sample', label: 'Portfolio / Sample Content', icon: 'folder_special' },
    { value: 'Identity / Government ID', label: 'Identity / ID Verification', icon: 'id_card' },
    { value: 'General Document', label: 'General Document / Notes', icon: 'description' },
    { value: 'Other Media', label: 'Other Media / Assets', icon: 'perm_media' }
  ];

  // In-page Alerts State
  showEnterAlert = signal<boolean>(true);
  showErrorAlert = signal<boolean>(false);
  showSuccessAlert = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Field-specific validation errors
  fieldErrors = signal<{ name?: string; email?: string }>({});

  form = signal<AuthorCreateForm>({
    name: '',
    email: '',
    contactNumber: '',
    specialization: '',
    bio: '',
    status: 'Active'
  });

  // Common specialization suggestions
  specializationSuggestions = [
    'Video Scripting & Interactive Media',
    'Pedagogical Case Studies & Field Scenarios',
    'Microfinance SOPs & Credit Risk Rubrics',
    'Instructional Design & Diagnostic Quizzes',
    'Technical Curriculum & Sandbox Labs',
    'Compliance Directives & Audit Simulations'
  ];

  // Live duplicate guard inspection
  existingPersonMatch = computed(() => {
    if (this.isEditMode()) return null;
    const email = this.form().email.trim();
    if (!email || !email.includes('@')) return null;
    const check = this.lms.findExistingPerson(email);
    return check.found ? check : null;
  });

  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    const email = this.route.snapshot.queryParamMap.get('email');
    
    let author = id ? this.lms.getAuthorById(id) : undefined;
    if (!author && email) {
      author = this.lms.getAuthorByEmail(email);
    }

    if (author) {
      this.isEditMode.set(true);
      this.editAuthorId.set(author.id);
      this.avatarPreview.set(author.avatar || '');
      this.attachments.set(author.attachments ? [...author.attachments] : []);
      this.form.set({
        name: author.name,
        email: author.email,
        contactNumber: author.contactNumber || '',
        specialization: author.specialization,
        bio: author.bio || '',
        status: author.status,
        avatar: author.avatar
      });
      this.lms.showToast('Author profile loaded for editing. You can update documents, images, and credentials.', 'info', 3500, 'Author Profile');
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
        this.lms.showToast(`Completing Author profile for "${user.name}".`, 'info', 3500, 'Author Onboarding');
      }
    } else {
      this.lms.showToast(
        'Welcome to Content Author Onboarding. Upload documents, profile photo, or media files.',
        'info',
        4000,
        'Author Onboarding'
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

  updateFormField(field: keyof AuthorCreateForm, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    // Clear field-level error as user edits
    if (field === 'name' || field === 'email') {
      const current = { ...this.fieldErrors() };
      delete current[field];
      this.fieldErrors.set(current);
      if (Object.keys(current).length === 0) {
        this.showErrorAlert.set(false);
      }
    }
  }

  selectSuggestion(sug: string): void {
    this.updateFormField('specialization', sug);
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
        this.form.update(f => ({ ...f, avatar: result }));
        this.lms.showToast('Profile photo updated successfully.', 'success', 2500, 'Photo Uploaded');
      }
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview.set('');
    this.form.update(f => ({ ...f, avatar: undefined }));
    this.lms.showToast('Profile photo cleared.', 'info', 2000);
  }

  generateRandomAvatar(): void {
    const randomSeed = Math.floor(Math.random() * 999999);
    const url = `https://images.unsplash.com/photo-${1500000000000 + randomSeed}?auto=format&fit=crop&w=240&q=80`;
    this.avatarPreview.set(url);
    this.form.update(f => ({ ...f, avatar: url }));
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
        } else if (/cert|award|degree|diploma|badge/i.test(file.name)) {
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
    const data = this.form();
    let firstErrorElementId: string | null = null;

    if (!data.name.trim()) {
      errors.name = 'Full Name is required and cannot be blank.';
      if (!firstErrorElementId) firstErrorElementId = 'author-fullname';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
      errors.email = 'Email Address is required as the unique person identifier.';
      if (!firstErrorElementId) firstErrorElementId = 'author-email';
    } else if (!emailPattern.test(data.email.trim())) {
      errors.email = 'Please provide a valid email format (e.g. name@domain.com).';
      if (!firstErrorElementId) firstErrorElementId = 'author-email';
    }

    this.fieldErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      const messages = Object.values(errors).join(' ');
      this.errorMessage.set(messages);
      this.showErrorAlert.set(true);
      this.lms.showToast('Please correct the highlighted form errors before proceeding.', 'error', 4000, 'Validation Error');

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

    const data = this.form();
    const avatar = this.avatarPreview().trim() || undefined;
    const attachments = this.attachments();
    this.isSubmitting.set(true);

    if (this.isEditMode() && this.editAuthorId()) {
      const success = this.lms.updateAuthor(this.editAuthorId()!, {
        name: data.name.trim(),
        email: data.email.trim(),
        contactNumber: data.contactNumber?.trim() || undefined,
        specialization: data.specialization.trim() || 'General Learning Content',
        bio: data.bio?.trim() || undefined,
        status: data.status,
        avatar: avatar || undefined,
        attachments
      });
      this.isSubmitting.set(false);
      if (success) {
        this.successMessage.set(`Author profile "${data.name}" has been updated successfully with ${attachments.length} document/media attachment(s).`);
        this.showSuccessAlert.set(true);
        this.lms.showToast('Author profile updated successfully!', 'success', 3000, 'Changes Saved');
        setTimeout(() => {
          this.router.navigate(['/authors', this.editAuthorId()]);
        }, 800);
      }
    } else {
      const result = this.lms.addAuthor({
        ...data,
        avatar,
        attachments
      });
      this.isSubmitting.set(false);
      if (result.success) {
        this.successMessage.set(`Author "${result.author.name}" created successfully with ${attachments.length} attached document(s) and added to the organization pool.`);
        this.showSuccessAlert.set(true);
        this.lms.showToast('New Author profile created successfully!', 'success', 3000, 'Author Onboarded');
        setTimeout(() => {
          this.router.navigate(['/authors', result.author.id]);
        }, 800);
      }
    }
  }
}
