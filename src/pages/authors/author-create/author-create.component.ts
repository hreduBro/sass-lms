import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { AuthorProfile, AuthorCreateForm } from '../../../models/author.model';
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const author = this.lms.getAuthorById(id);
      if (author) {
        this.isEditMode.set(true);
        this.editAuthorId.set(author.id);
        this.form.set({
          name: author.name,
          email: author.email,
          contactNumber: author.contactNumber || '',
          specialization: author.specialization,
          bio: author.bio || '',
          status: author.status
        });
        this.lms.showToast('Editing existing author profile.', 'info', 3000, 'Author Profile');
      }
    } else {
      this.lms.showToast(
        'Welcome to Content Author Onboarding. Enter profile credentials to add to the organization repository.',
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
    this.isSubmitting.set(true);

    if (this.isEditMode() && this.editAuthorId()) {
      const success = this.lms.updateAuthor(this.editAuthorId()!, {
        name: data.name.trim(),
        email: data.email.trim(),
        contactNumber: data.contactNumber?.trim() || undefined,
        specialization: data.specialization.trim() || 'General Learning Content',
        bio: data.bio?.trim() || undefined,
        status: data.status
      });
      this.isSubmitting.set(false);
      if (success) {
        this.successMessage.set(`Author profile "${data.name}" has been updated successfully.`);
        this.showSuccessAlert.set(true);
        this.lms.showToast('Author profile updated successfully!', 'success', 3000, 'Changes Saved');
        setTimeout(() => {
          this.router.navigate(['/authors', this.editAuthorId()]);
        }, 800);
      }
    } else {
      const result = this.lms.addAuthor(data);
      this.isSubmitting.set(false);
      if (result.success) {
        this.successMessage.set(`Author "${result.author.name}" created successfully and added to the organization pool.`);
        this.showSuccessAlert.set(true);
        this.lms.showToast('New Author profile created successfully!', 'success', 3000, 'Author Onboarded');
        setTimeout(() => {
          this.router.navigate(['/authors', result.author.id]);
        }, 800);
      }
    }
  }
}
