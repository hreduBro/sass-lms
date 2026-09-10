import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { UserRole } from '../../models/lms.model';
import { LoginBrandingConfig } from '../../models/login-branding.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  email = signal<string>('farhana.ahmed@brac.net');
  password = signal<string>('••••••••••••');
  rememberMe = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  selectedLang = signal<string>('English');
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  branding = computed<LoginBrandingConfig>(() => this.lms.loginBranding());

  demoAccounts = [
    { name: 'Farhana Ahmed', role: 'system_admin' as UserRole, email: 'farhana.ahmed@brac.net', label: 'System Admin' },
    { name: 'David Miller', role: 'tenant_admin' as UserRole, email: 'david.miller@brac.net', label: 'Tenant Admin' },
    { name: 'Rahim Chowdhury', role: 'instructor' as UserRole, email: 'rahim.chowdhury@brac.net', label: 'Instructor' },
    { name: 'Nusrat Jahan', role: 'learner' as UserRole, email: 'nusrat.jahan@brac.net', label: 'Learner' }
  ];

  fillDemo(account: typeof this.demoAccounts[0]) {
    this.email.set(account.email);
    this.lms.switchRole(account.role);
    this.lms.showToast(`Selected demo credentials for ${account.name} (${account.label})`, 'info', 2500, 'Demo Filled');
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSignIn() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.lms.showToast(`Welcome back, ${this.lms.activeUser()?.name || 'User'}! Authentication verified.`, 'success', 3500, 'Logged In');
      this.router.navigate(['/dashboard']);
    }, 1000);
  }

  onSsoSignIn(provider: string) {
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.lms.showToast(`Authenticated via ${provider} SSO Token Exchange`, 'success', 3500, 'SSO Success');
      this.router.navigate(['/dashboard']);
    }, 1200);
  }
}
