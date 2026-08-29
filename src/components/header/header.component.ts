import { Component, ChangeDetectionStrategy, inject, output, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { LmsDataService } from '../../services/lms-data.service';
import { LmsApiService } from '../../services/lms-api.service';
import { ThemeService } from '../../services/theme.service';
import { UserRole } from '../../models/lms.model';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  lms = inject(LmsDataService);
  api = inject(LmsApiService);
  themeService = inject(ThemeService);
  router = inject(Router);
  elementRef = inject(ElementRef);
  toggleSidebar = output<void>();

  showTenantDropdown = computed(() => this.lms.isNavDropdownOpen('header-tenant'));
  showLmsDropdown = computed(() => this.lms.isNavDropdownOpen('header-lms'));
  showUserDropdown = computed(() => this.lms.isNavDropdownOpen('header-user'));
  showNotificationMenu = computed(() => this.lms.isNavDropdownOpen('header-notifications'));
  showThemeMenu = computed(() => this.lms.isNavDropdownOpen('header-theme'));

  showNewTenantModal = signal(false);

  tenantSearch = signal('');
  lmsSearch = signal('');

  filteredTenants = computed(() => {
    const q = this.tenantSearch().trim().toLowerCase();
    const tenants = this.lms.tenants();
    if (!q) return tenants;
    return tenants.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.domain.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q)
    );
  });

  filteredLmsList = computed(() => {
    const q = this.lmsSearch().trim().toLowerCase();
    // LMS Admin is strictly scoped to their Organization's LMS instances
    const list = this.lms.isSystemAdmin() ? this.lms.lmsInstances() : this.lms.activeOrgLmsInstances();
    if (!q) return list;
    return list.filter(l => 
      l.basicInfo.lmsName.toLowerCase().includes(q) || 
      l.basicInfo.programmeDepartment.toLowerCase().includes(q) ||
      l.organizationName.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q)
    );
  });

  constructor() {
    // Auto-close any open header dropdowns whenever the route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeAllDropdowns();
    });
  }

  closeAllDropdowns() {
    this.lms.closeNavDropdown();
    this.tenantSearch.set('');
    this.lmsSearch.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // If click is outside the header component, close all dropdown menus
    if (!this.elementRef.nativeElement.contains(target)) {
      if (this.lms.activeNavDropdown()?.startsWith('header-')) {
        this.closeAllDropdowns();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.closeAllDropdowns();
  }

  toggleTenantDropdown(event?: Event) {
    if (!this.lms.isSystemAdmin()) return;
    event?.stopPropagation();
    this.lms.toggleNavDropdown('header-tenant');
  }

  toggleLmsDropdown(event?: Event) {
    event?.stopPropagation();
    this.lms.toggleNavDropdown('header-lms');
  }

  toggleUserDropdown(event?: Event) {
    event?.stopPropagation();
    this.lms.toggleNavDropdown('header-user');
  }

  toggleNotificationMenu(event?: Event) {
    event?.stopPropagation();
    this.lms.toggleNavDropdown('header-notifications');
  }

  toggleThemeMenu(event?: Event) {
    event?.stopPropagation();
    this.lms.toggleNavDropdown('header-theme');
  }

  setTheme(mode: 'system' | 'light' | 'dark') {
    this.themeService.setThemeMode(mode);
    this.lms.closeNavDropdown('header-theme');
  }

  // New tenant form model
  newOrg = {
    name: '',
    slug: '',
    plan: 'Enterprise' as const,
    primaryColor: '#EC008C', // BRAC Standard Pantone Magenta
    accentColor: '#C40072',  // BRAC Deep Magenta Accent
    adminEmail: '',
    tagline: ''
  };

  selectTenant(id: string) {
    if (!this.lms.isSystemAdmin()) return;
    this.lms.switchTenant(id);
    this.closeAllDropdowns();
  }

  selectLms(id: string) {
    this.lms.switchLms(id);
    this.closeAllDropdowns();
  }

  openNewTenantModal() {
    this.newOrg = {
      name: '',
      slug: '',
      plan: 'Enterprise',
      primaryColor: '#4f46e5',
      accentColor: '#06b6d4',
      adminEmail: '',
      tagline: ''
    };
    this.closeAllDropdowns();
    this.showNewTenantModal.set(true);
  }

  handleSignOut() {
    this.closeAllDropdowns();
    this.lms.openSignOutModal();
  }

  createTenant() {
    if (!this.newOrg.name.trim()) return;
    const slug = this.newOrg.slug.trim() || this.newOrg.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    this.lms.addTenant({
      name: this.newOrg.name,
      slug,
      plan: this.newOrg.plan,
      adminEmail: this.newOrg.adminEmail || `admin@${slug}.io`,
      branding: {
        primaryColor: this.newOrg.primaryColor,
        accentColor: this.newOrg.accentColor,
        tagline: this.newOrg.tagline || 'Next Generation Learning Management System',
        bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        customCssEnabled: true,
        ssoProvider: 'None'
      }
    });
    this.showNewTenantModal.set(false);
  }
}

