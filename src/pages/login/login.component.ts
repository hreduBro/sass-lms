import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { LocalPersistenceRepository } from '../../services/local-persistence.repository';
import { UserRole } from '../../models/lms.model';
import { LoginBrandingConfig } from '../../models/login-branding.model';
import { SsoLogoComponent } from '../../components/sso-logo/sso-logo.component';
import { 
  Plan, 
  Phase, 
  RegistrationFormField, 
  MarketingEnrollmentConfig,
  DEFAULT_INTAKE_FORM_FIELDS 
} from '../../models/plan.model';

export interface MarketedProgramItem {
  type: 'plan' | 'phase';
  id: string;
  planId?: string;
  name: string;
  code: string;
  description: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  marketingConfig?: MarketingEnrollmentConfig;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterModule, FormsModule, SsoLogoComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  lms = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  username = signal<string>('Dumbledore');
  email = signal<string>('Dumbledore');
  password = signal<string>('Rubeas@Dum123');
  rememberMe = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  selectedLang = signal<string>('English');
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // =========================================================================
  // PUBLIC MARKETING & TRAINEE INTAKE ENROLLMENT STATE (§ Requirements)
  // =========================================================================
  showEnrollmentView = signal<boolean>(false);
  selectedProgram = signal<MarketedProgramItem | null>(null);
  enrollmentFormData = signal<Record<string, any>>({});
  enrollmentFormErrors = signal<Record<string, string>>({});
  isSubmittingEnrollment = signal<boolean>(false);
  enrollmentSubmitted = signal<boolean>(false);
  submissionResult = signal<{ referenceNo: string; message: string; targetName: string } | null>(null);

  // Derives all currently active marketed plans and phases in this LMS
  availableMarketedPrograms = computed<MarketedProgramItem[]>(() => {
    const list: MarketedProgramItem[] = [];
    const plans = this.lms.plans();

    plans.forEach(plan => {
      // Plan level marketing
      if (plan.marketingEnrollment && plan.marketingEnrollment.enabled !== false) {
        list.push({
          type: 'plan',
          id: plan.id,
          name: plan.marketingEnrollment.campaignTitle || plan.name,
          code: plan.planCode,
          description: plan.marketingEnrollment.campaignDescription || plan.description || 'Enterprise Learning Curriculum Plan',
          category: 'Curriculum Plan',
          startDate: plan.startDate,
          endDate: plan.endDate,
          marketingConfig: plan.marketingEnrollment
        });
      } else {
        // Fallback for primary plan
        list.push({
          type: 'plan',
          id: plan.id,
          name: plan.name,
          code: plan.planCode,
          description: plan.description || 'Open intake enterprise curriculum plan.',
          category: 'Curriculum Plan',
          startDate: plan.startDate,
          endDate: plan.endDate,
          marketingConfig: {
            enabled: true,
            marketingSlug: plan.planCode.toLowerCase(),
            publicLink: `/login?enrollType=plan&targetId=${plan.id}`,
            campaignTitle: plan.name,
            campaignDescription: plan.description,
            bannerHeadline: `Apply for ${plan.name}`,
            formTemplate: {
              formTitle: `${plan.name} Trainee Enrollment`,
              formDescription: 'Fill out this application to enroll as a candidate.',
              fields: DEFAULT_INTAKE_FORM_FIELDS
            }
          }
        });
      }

      // Phase level marketing
      if (plan.phases && plan.phases.length > 0) {
        plan.phases.forEach(phase => {
          if (phase.marketingEnrollment && phase.marketingEnrollment.enabled !== false) {
            list.push({
              type: 'phase',
              id: phase.id,
              planId: plan.id,
              name: phase.marketingEnrollment.campaignTitle || phase.name,
              code: `${plan.planCode}-PHS-${phase.sequence}`,
              description: phase.marketingEnrollment.campaignDescription || phase.description || `Learning phase in ${plan.name}`,
              category: `Phase of ${plan.name}`,
              startDate: phase.startDate,
              endDate: phase.endDate,
              marketingConfig: phase.marketingEnrollment
            });
          }
        });
      }
    });

    return list;
  });

  // Effective intake form fields configured by the planner for the selected program
  activeFormFields = computed<RegistrationFormField[]>(() => {
    const prog = this.selectedProgram();
    if (prog?.marketingConfig?.formTemplate?.fields && prog.marketingConfig.formTemplate.fields.length > 0) {
      return prog.marketingConfig.formTemplate.fields.filter(f => f.enabled !== false);
    }
    return DEFAULT_INTAKE_FORM_FIELDS.filter(f => f.enabled !== false);
  });

  branding = computed<LoginBrandingConfig>(() => {
    // Only published configuration is loaded for the public /login screen
    const cfg = { ...LocalPersistenceRepository.getPublishedLoginBranding() };
    if (cfg.copyrightText) {
      cfg.copyrightText = cfg.copyrightText.replace(/\s*&\s*BRAC\s*IT\s*Services/gi, '').replace(/\s*&\s*Brac\s*IT\s*Services/gi, '').trim();
    }
    return cfg;
  });

  demoAccounts = [
    { name: 'Albus Dumbledore', role: 'system_admin' as UserRole, email: 'Dumbledore', password: 'Rubeas@Dum123', label: 'Dumbledore (Super Admin)' },
    { name: 'Farhana Ahmed', role: 'system_admin' as UserRole, email: 'farhana.ahmed@brac.net', password: '••••••••••••', label: 'System Admin' },
    { name: 'David Miller', role: 'tenant_admin' as UserRole, email: 'david.miller@brac.net', password: '••••••••••••', label: 'Tenant Admin' },
    { name: 'Rahim Chowdhury', role: 'instructor' as UserRole, email: 'rahim.chowdhury@brac.net', password: '••••••••••••', label: 'Instructor' },
    { name: 'Nusrat Jahan', role: 'learner' as UserRole, email: 'nusrat.jahan@brac.net', password: '••••••••••••', label: 'Learner' }
  ];

  ngOnInit() {
    // Check if user navigated here with a marketing campaign link (?enrollType=plan/phase or ?enrollPlan=... etc.)
    this.route.queryParams.subscribe(params => {
      const enrollType = params['enrollType'];
      const targetId = params['targetId'] || params['enrollPlan'] || params['enrollPhase'] || params['planId'];
      const code = params['code'];

      if (enrollType || targetId || code) {
        this.showEnrollmentView.set(true);

        const all = this.availableMarketedPrograms();
        let matched = all.find(p => p.id === targetId);

        if (!matched && code) {
          matched = all.find(p => p.marketingConfig?.marketingSlug === code);
        }
        if (!matched && all.length > 0) {
          matched = all[0];
        }

        if (matched) {
          this.selectProgram(matched);
        }
      } else {
        // Default to first available program so it's ready when user opens enrollment view
        const all = this.availableMarketedPrograms();
        if (all.length > 0) {
          this.selectedProgram.set(all[0]);
          this.initFormData(all[0]);
        }
      }
    });
  }

  selectProgram(prog: MarketedProgramItem) {
    this.selectedProgram.set(prog);
    this.initFormData(prog);
  }

  initFormData(prog: MarketedProgramItem) {
    const initial: Record<string, any> = {
      fullName: 'Tahmina Akter',
      email: 'tahmina.akter@brac.net',
      phone: '+880 1715-998877',
      department: 'Microfinance Operations (Mymensingh)',
      pin: 'PIN-88421',
      designation: 'Senior Credit Officer',
      motivation: 'Aspiring to lead high-impact rural credit branches and scale community development.'
    };
    this.enrollmentFormData.set(initial);
    this.enrollmentFormErrors.set({});
  }

  openMarketEnrollmentView(program?: MarketedProgramItem) {
    this.showEnrollmentView.set(true);
    this.enrollmentSubmitted.set(false);
    this.submissionResult.set(null);
    if (program) {
      this.selectProgram(program);
    } else if (!this.selectedProgram() && this.availableMarketedPrograms().length > 0) {
      this.selectProgram(this.availableMarketedPrograms()[0]);
    }
  }

  closeMarketEnrollmentView() {
    this.showEnrollmentView.set(false);
    this.enrollmentSubmitted.set(false);
  }

  updateFormField(fieldName: string, value: any) {
    this.enrollmentFormData.update(data => ({
      ...data,
      [fieldName]: value
    }));
    // Clear error for field if any
    this.enrollmentFormErrors.update(errs => {
      const copy = { ...errs };
      delete copy[fieldName];
      return copy;
    });
  }

  submitEnrollment() {
    const prog = this.selectedProgram();
    if (!prog) return;

    // Validate mandatory configured fields
    const fields = this.activeFormFields();
    const data = this.enrollmentFormData();
    const errors: Record<string, string> = {};

    fields.forEach(f => {
      if (f.required) {
        const val = data[f.name];
        if (!val || (typeof val === 'string' && !val.trim())) {
          errors[f.name] = `${f.label} is required.`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      this.enrollmentFormErrors.set(errors);
      this.lms.showToast('Please fill out all mandatory questions configured for this program.', 'error', 4000);
      return;
    }

    this.isSubmittingEnrollment.set(true);

    setTimeout(() => {
      this.isSubmittingEnrollment.set(false);
      const res = this.lms.submitTraineeMarketEnrollment({
        targetType: prog.type,
        targetId: prog.id,
        targetName: prog.name,
        planId: prog.planId,
        formData: data
      });

      this.submissionResult.set({
        referenceNo: res.referenceNo,
        message: res.message,
        targetName: prog.name
      });
      this.enrollmentSubmitted.set(true);
    }, 900);
  }

  fillDemo(account: typeof this.demoAccounts[0]) {
    this.username.set(account.email);
    this.email.set(account.email);
    if (account.password) {
      this.password.set(account.password);
    }
    this.lms.switchRole(account.role);
    if (account.name.includes('Dumbledore')) {
      this.lms.setDumbledoreUser();
    }
    this.lms.showToast(`Selected credentials for ${account.name} (${account.label})`, 'info', 2500, 'Demo Filled');
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSignIn() {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    setTimeout(() => {
      this.isSubmitting.set(false);
      const uname = (this.username() || this.email() || '').trim();
      const pwd = (this.password() || '').trim();

      // Enforce the exact specified credentials:
      // Username: Dumbledore, Password: Rubeas@Dum123
      const isDumbledore = uname.toLowerCase() === 'dumbledore';
      const isValidPassword = pwd === 'Rubeas@Dum123';

      if (isDumbledore && isValidPassword) {
        const user = this.lms.setDumbledoreUser();
        LocalPersistenceRepository.setAuthSession({
          username: 'Dumbledore',
          name: user.name,
          role: 'system_admin',
          authenticated: true,
          loginTime: new Date().toISOString()
        });
        this.lms.showToast(`Welcome back, ${user.name}! Authentication verified.`, 'success', 3500, 'Logged In');
        this.router.navigate(['/dashboard']);
        return;
      }

      // Check fallback demo accounts with valid input
      if (uname && pwd && pwd !== '••••••••••••') {
        const foundDemo = this.demoAccounts.find(d => d.email.toLowerCase() === uname.toLowerCase() && d.password === pwd);
        if (foundDemo) {
          this.lms.switchRole(foundDemo.role);
          this.router.navigate(['/dashboard']);
          return;
        }
      }

      this.errorMessage.set('Invalid credentials. Use Username: Dumbledore and Password: Rubeas@Dum123');
      this.lms.showToast('Invalid credentials provided. Please check your username and password.', 'error', 4000, 'Sign In Failed');
    }, 400);
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
