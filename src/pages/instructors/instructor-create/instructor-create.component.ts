import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { InstructorCreateForm } from '../../../models/instructor.model';
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
    this.lms.showToast(
      'Welcome to Instructor Profile Onboarding. Complete profile to add faculty to the central pool.',
      'info',
      4000,
      'Instructor Onboarding'
    );
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
    } else {
      this.existingPersonFound.set(null);
    }
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

    const result = this.lms.addInstructor(this.formData);
    this.isSubmitting.set(false);

    if (result.success) {
      this.successMessage.set(`Instructor profile for "${result.instructor.name}" has been created successfully.`);
      this.showSuccessAlert.set(true);
      this.lms.showToast('Instructor Profile Created Successfully!', 'success', 3000, 'Profile Saved');
      setTimeout(() => {
        this.router.navigate(['/instructors', result.instructor.id]);
      }, 800);
    }
  }
}
