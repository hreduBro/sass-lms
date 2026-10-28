import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { LocalPersistenceRepository } from '../../services/local-persistence.repository';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  lms = inject(LmsDataService);
  router = inject(Router);

  // Credentials signals initialized empty
  username = signal<string>('');
  password = signal<string>('');
  rememberMe = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  readonly bracLogoIcon = 'https://freelogopng.com/images/all_img/1679820004brac-icon.png';
  readonly bracLogoTextLight = 'assets/bracit-logo-light.png';
  readonly bracLogoTextDark = 'assets/bracit-logo-dark.png';

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSignIn() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    setTimeout(() => {
      this.isSubmitting.set(false);
      const uname = (this.username() || '').trim().toLowerCase();
      const pwd = (this.password() || '').trim();

      // Enforce credentials: Username: admin, Password: admin
      if (uname === 'admin' && pwd === 'admin') {
        const user = this.lms.setAdminUser();
        LocalPersistenceRepository.setAuthSession({
          username: 'admin',
          name: user.name,
          role: 'system_admin',
          authenticated: true,
          loginTime: new Date().toISOString()
        });
        LocalPersistenceRepository.setAdminPortalSession(true);

        this.lms.showToast(
          'Welcome, Administrator! Authenticated with System Admin & Org Admin access.',
          'success',
          3500,
          'Admin Verified'
        );
        this.router.navigate(['/dashboard']);
        return;
      }

      this.errorMessage.set('Invalid credentials. Please enter a valid admin username and password.');
      this.lms.showToast(
        'Invalid credentials provided.',
        'error',
        4000,
        'Authentication Failed'
      );
    }, 350);
  }
}
