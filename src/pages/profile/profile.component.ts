import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../services/lms-data.service';
import { ThemeService } from '../../services/theme.service';
import { Certificate, Course, CourseEnrollment, User } from '../../models/lms.model';
import { CustomAvatarComponent } from '../../components/custom-avatar/custom-avatar.component';

interface ProfileTab {
  id: 'overview' | 'learning' | 'certificates' | 'badges' | 'security';
  label: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule, CustomAvatarComponent],
  template: `
    <div class="space-y-6 pb-16 animate-in fade-in duration-200">
      
      <!-- Top Banner & Profile Header Card -->
      <div class="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden relative">
        <!-- Brand Gradient Banner -->
        <div class="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-r from-tenant-600 via-tenant-500 to-indigo-600">
          <div class="absolute inset-0 bg-black/15"></div>
          
          <!-- Abstract Background Shapes -->
          <div class="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div class="absolute left-1/4 top-0 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
          
          <!-- Tenant / Org Tag on Banner -->
          <div class="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold shadow-lg">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{{ lms.activeTenant().name }}</span>
            <span class="text-white/60 font-mono text-[10px]">({{ lms.activeTenant().plan }})</span>
          </div>
        </div>

        <!-- User Identity Row (Avatar + Details + Actions) -->
        <div class="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            
            <!-- Avatar & Name Info -->
            <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
              
              <!-- Avatar with Ring & Upload/Change Trigger -->
              <div class="relative group shrink-0">
                <app-custom-avatar 
                  [imageUrl]="activeUser().avatar" 
                  [name]="activeUser().name" 
                  size="2xl" 
                  shape="squircle"
                  status="online"
                  class="[&_img]:w-28 [&_img]:h-28 sm:[&_img]:w-36 sm:[&_img]:h-36 [&_div]:w-28 [&_div]:h-28 sm:[&_div]:w-36 sm:[&_div]:h-36 shadow-xl">
                </app-custom-avatar>

                <!-- Avatar Edit Overlay -->
                <button 
                  type="button"
                  (click)="showAvatarPicker.set(true)"
                  class="absolute inset-0 bg-black/50 backdrop-blur-xs rounded-[30%] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium gap-1 shadow-inner cursor-pointer"
                  title="Change profile avatar">
                  <span class="material-symbols-outlined text-2xl">photo_camera</span>
                  <span>Change</span>
                </button>
              </div>

              <!-- Names & Badges -->
              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 class="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    {{ activeUser().name }}
                  </h1>
                  
                  <!-- Role Pill -->
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-tenant-100 text-tenant-700 dark:bg-tenant-950/80 dark:text-tenant-200 border border-tenant-500/30 shadow-2xs">
                    {{ activeUser().role.replace('_', ' ') }}
                  </span>

                  <!-- Compliance Status Pill -->
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    [class]="activeUser().complianceStatus === 'Compliant' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-500/30' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-500/30'">
                    <span class="material-symbols-outlined text-xs">
                      {{ activeUser().complianceStatus === 'Compliant' ? 'verified' : 'warning' }}
                    </span>
                    {{ activeUser().complianceStatus }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-3 text-xs text-text-secondary font-medium">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-text-secondary">mail</span>
                    {{ activeUser().email }}
                  </span>
                  <span class="hidden sm:inline text-base-300">•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-text-secondary">business</span>
                    {{ activeUser().department }}
                  </span>
                  <span class="hidden sm:inline text-base-300">•</span>
                  <span class="flex items-center gap-1 font-mono text-[11px]">
                    <span class="material-symbols-outlined text-sm text-text-secondary">badge</span>
                    ID: {{ activeUser().id }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Top Action Buttons -->
            <div class="flex items-center justify-center sm:justify-end gap-2.5 pt-2 md:pt-0">
              <button 
                type="button"
                (click)="isEditing.set(!isEditing())"
                class="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
                [class]="isEditing() ? 'bg-tenant-500 text-white border-tenant-600' : 'bg-base-200 hover:bg-base-300 text-text-primary border-base-300'">
                <span class="material-symbols-outlined text-base">{{ isEditing() ? 'close' : 'edit' }}</span>
                <span>{{ isEditing() ? 'Cancel Edit' : 'Edit Profile' }}</span>
              </button>

              <button 
                type="button"
                (click)="downloadTranscript()"
                class="px-4 py-2.5 rounded-xl bg-tenant-500/10 hover:bg-tenant-500/20 text-tenant-700 dark:text-tenant-200 border border-tenant-500/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs">
                <span class="material-symbols-outlined text-base">download</span>
                <span class="hidden sm:inline">Learning Transcript</span>
              </button>
            </div>

          </div>

          <!-- Quick Metrics Bar (XP Points, Courses, Certs, Completion) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-base-300/80">
            <div class="p-3.5 rounded-2xl bg-base-200/70 border border-base-300/60 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">stars</span>
              </div>
              <div class="min-w-0">
                <span class="text-[11px] text-text-secondary block font-medium">Mastery Points</span>
                <span class="text-base sm:text-lg font-black text-text-primary">{{ activeUser().points }} <span class="text-xs font-semibold text-amber-500">XP</span></span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-base-200/70 border border-base-300/60 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-tenant-500/15 text-tenant-600 dark:text-tenant-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">school</span>
              </div>
              <div class="min-w-0">
                <span class="text-[11px] text-text-secondary block font-medium">Enrolled Courses</span>
                <span class="text-base sm:text-lg font-black text-text-primary">{{ enrolledCoursesList().length }}</span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-base-200/70 border border-base-300/60 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div class="min-w-0">
                <span class="text-[11px] text-text-secondary block font-medium">Certificates</span>
                <span class="text-base sm:text-lg font-black text-text-primary">{{ userCertificates().length }}</span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-base-200/70 border border-base-300/60 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">military_tech</span>
              </div>
              <div class="min-w-0">
                <span class="text-[11px] text-text-secondary block font-medium">Earned Badges</span>
                <span class="text-base sm:text-lg font-black text-text-primary">{{ (activeUser().badges || []).length }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-base-300">
        @for (tab of tabs; track tab.id) {
          <button 
            type="button"
            (click)="activeTab.set(tab.id)"
            class="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all select-none"
            [class]="activeTab() === tab.id 
              ? 'bg-tenant-500 text-white shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-base-200'">
            <span class="material-symbols-outlined text-base">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
            @if (tab.id === 'certificates' && userCertificates().length > 0) {
              <span class="px-1.5 py-0.2 text-[10px] rounded-full" [class]="activeTab() === tab.id ? 'bg-white/20 text-white' : 'bg-base-300 text-text-secondary'">
                {{ userCertificates().length }}
              </span>
            }
          </button>
        }
      </div>

      <!-- TAB 1: OVERVIEW & PERSONAL DETAILS -->
      @if (activeTab() === 'overview') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Editable Personal Info Form -->
          <div class="lg:col-span-2 bg-base-100 rounded-3xl border border-base-300 p-6 shadow-sm space-y-6">
            <div class="flex items-center justify-between border-b border-base-300 pb-4">
              <div>
                <h3 class="font-bold text-base text-text-primary">Personal & Account Details</h3>
                <p class="text-xs text-text-secondary">Update your contact information, bio, and enterprise department</p>
              </div>
              @if (isEditing()) {
                <span class="text-xs font-bold text-tenant-600 dark:text-tenant-400 bg-tenant-50 dark:bg-tenant-500/15 px-2.5 py-1 rounded-lg border border-tenant-500/30">
                  Editing Mode
                </span>
              }
            </div>

            @if (saveSuccessMessage()) {
              <div class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  <span>{{ saveSuccessMessage() }}</span>
                </div>
                <button (click)="saveSuccessMessage.set('')" class="text-emerald-700 hover:text-emerald-900">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            }

            <form (submit)="saveProfile($event)" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-text-primary mb-1">Full Name</label>
                  <input 
                    type="text" 
                    [(ngModel)]="editForm.name" 
                    name="userName"
                    [disabled]="!isEditing()"
                    required
                    class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-text-primary mb-1">Work Email</label>
                  <input 
                    type="email" 
                    [(ngModel)]="editForm.email" 
                    name="userEmail"
                    [disabled]="!isEditing()"
                    required
                    class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-text-primary mb-1">Department</label>
                  <select 
                    [(ngModel)]="editForm.department" 
                    name="userDept"
                    [disabled]="!isEditing()"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed">
                    @for (dept of lms.activeTenant().departments; track dept) {
                      <option [value]="dept">{{ dept }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-text-primary mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    [(ngModel)]="editForm.phone" 
                    name="userPhone"
                    placeholder="+880 1713 000000"
                    [disabled]="!isEditing()"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-text-primary mb-1">Job Title / Designation</label>
                  <input 
                    type="text" 
                    [(ngModel)]="editForm.title" 
                    name="userTitle"
                    placeholder="e.g. Senior Microfinance Officer"
                    [disabled]="!isEditing()"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-text-primary mb-1">Timezone</label>
                  <select 
                    [(ngModel)]="editForm.timezone" 
                    name="userTimezone"
                    [disabled]="!isEditing()"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed font-mono text-xs">
                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1">Bio / Professional Summary</label>
                <textarea 
                  [(ngModel)]="editForm.bio" 
                  name="userBio"
                  rows="3"
                  placeholder="Tell your team about your learning goals and specialization..."
                  [disabled]="!isEditing()"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm focus:outline-none focus:border-tenant-500 disabled:opacity-75 disabled:cursor-not-allowed"></textarea>
              </div>

              @if (isEditing()) {
                <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-base-300">
                  <button 
                    type="button" 
                    (click)="cancelEditing()"
                    class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-secondary text-xs font-semibold transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    class="px-5 py-2 rounded-xl bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
                    <span class="material-symbols-outlined text-sm">save</span>
                    Save Changes
                  </button>
                </div>
              }
            </form>
          </div>

          <!-- Right Col: Organization Context & Skill Tags -->
          <div class="space-y-6">
            
            <!-- Organization Affiliation Card -->
            <div class="bg-base-100 rounded-3xl border border-base-300 p-5 shadow-sm space-y-4">
              <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Assigned Workspace</span>
              
              <div class="flex items-center gap-3 p-3 rounded-2xl bg-base-200 border border-base-300/80">
                <div class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-base-300 shadow-2xs flex items-center justify-center shrink-0">
                  @if (lms.activeTenant().branding.logoUrl) {
                    <img [src]="lms.activeTenant().branding.logoUrl" class="w-full h-full object-contain" referrerpolicy="no-referrer" />
                  } @else {
                    <span class="material-symbols-outlined text-tenant-600">domain</span>
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="font-bold text-xs text-text-primary truncate">{{ lms.activeTenant().name }}</h4>
                  <span class="text-[10px] text-text-secondary font-mono block truncate">{{ lms.activeTenant().domain }}</span>
                </div>
              </div>

              <div class="space-y-2 text-xs divide-y divide-base-300/60">
                <div class="flex items-center justify-between pt-1">
                  <span class="text-text-secondary">Subscription Plan</span>
                  <span class="font-semibold text-tenant-600 dark:text-tenant-400">{{ lms.activeTenant().plan }}</span>
                </div>
                <div class="flex items-center justify-between pt-2">
                  <span class="text-text-secondary">SSO Identity Provider</span>
                  <span class="font-semibold text-text-primary">{{ lms.activeTenant().branding.ssoProvider }}</span>
                </div>
                <div class="flex items-center justify-between pt-2">
                  <span class="text-text-secondary">Assigned Role</span>
                  <span class="font-semibold text-text-primary capitalize">{{ activeUser().role.replace('_', ' ') }}</span>
                </div>
                <div class="flex items-center justify-between pt-2">
                  <span class="text-text-secondary">Last Active</span>
                  <span class="font-medium text-text-secondary">{{ activeUser().lastActive }}</span>
                </div>
              </div>
            </div>

            <!-- Skills & Competencies Card -->
            <div class="bg-base-100 rounded-3xl border border-base-300 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Skills & Competencies</span>
                <span class="text-[10px] text-tenant-600 dark:text-tenant-400 font-bold font-mono">{{ skillsList().length }} active</span>
              </div>

              <div class="flex flex-wrap gap-1.5">
                @for (skill of skillsList(); track skill) {
                  <span class="px-2.5 py-1 rounded-xl bg-base-200 border border-base-300 text-xs text-text-primary font-medium flex items-center gap-1.5 group">
                    <span>{{ skill }}</span>
                    @if (isEditing()) {
                      <button (click)="removeSkill(skill)" class="text-text-secondary hover:text-rose-500 transition-colors">
                        <span class="material-symbols-outlined text-xs">close</span>
                      </button>
                    }
                  </span>
                }
              </div>

              @if (isEditing()) {
                <div class="flex items-center gap-2 pt-2">
                  <input 
                    type="text" 
                    [(ngModel)]="newSkillInput" 
                    (keydown.enter)="addSkill($event)"
                    placeholder="Add skill (e.g. Anti-Fraud)"
                    class="flex-1 px-3 py-1.5 rounded-xl bg-base-200 border border-base-300 text-xs focus:outline-none focus:ring-1 focus:ring-tenant-500" />
                  <button 
                    type="button" 
                    (click)="addSkill()"
                    class="px-3 py-1.5 rounded-xl bg-tenant-500 text-white text-xs font-semibold hover:bg-tenant-600">
                    Add
                  </button>
                </div>
              }
            </div>

          </div>
        </div>
      }

      <!-- TAB 2: LEARNING JOURNEY & ENROLLED COURSES -->
      @if (activeTab() === 'learning') {
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-5 rounded-3xl border border-base-300 shadow-sm">
            <div>
              <h3 class="font-bold text-base text-text-primary">Enrolled Courseware & Progress</h3>
              <p class="text-xs text-text-secondary">Track completed modules, quiz mastery, and pending compliance deadlines</p>
            </div>
            <a 
              routerLink="/courses" 
              class="px-4 py-2 rounded-xl bg-tenant-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-tenant-600 self-start sm:self-auto shadow-xs">
              <span class="material-symbols-outlined text-sm">explore</span>
              Browse Catalog
            </a>
          </div>

          @if (enrolledCoursesList().length === 0) {
            <div class="text-center py-16 bg-base-100 rounded-3xl border border-base-300 p-8 space-y-3">
              <span class="material-symbols-outlined text-5xl text-text-secondary">school</span>
              <h4 class="font-bold text-base text-text-primary">No Active Enrollments</h4>
              <p class="text-xs text-text-secondary max-w-sm mx-auto">You have not enrolled in any courses for this organization yet. Browse the catalog to start learning.</p>
              <a routerLink="/courses" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tenant-500 text-white text-xs font-semibold mt-2">
                Explore Courses
              </a>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (item of enrolledCoursesList(); track item.course.id) {
                <div class="bg-base-100 rounded-3xl border border-base-300 p-5 shadow-sm space-y-4 hover:border-tenant-500/40 transition-all flex flex-col justify-between">
                  <div class="space-y-3">
                    <div class="flex items-start gap-3.5">
                      <img 
                        [src]="item.course.coverImage" 
                        [alt]="item.course.title" 
                        class="w-16 h-16 rounded-2xl object-cover shrink-0 border border-base-300"
                        referrerpolicy="no-referrer" />
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap mb-1">
                          <span class="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-tenant-100 text-tenant-800 dark:bg-tenant-950/80 dark:text-tenant-200">
                            {{ item.course.category }}
                          </span>
                          @if (item.course.isMandatory) {
                            <span class="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200">
                              Mandatory
                            </span>
                          }
                        </div>
                        <h4 class="font-bold text-sm text-text-primary line-clamp-2 leading-snug">{{ item.course.title }}</h4>
                      </div>
                    </div>

                    <!-- Progress Bar & Status -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-xs font-semibold">
                        <span class="text-text-secondary">{{ item.enrollment.status === 'completed' ? 'Completed' : 'In Progress' }}</span>
                        <span class="text-tenant-600 dark:text-tenant-300 font-bold">{{ item.enrollment.progressPercent }}%</span>
                      </div>
                      <div class="w-full h-2.5 rounded-full bg-base-200 overflow-hidden">
                        <div 
                          class="h-full rounded-full transition-all duration-500"
                          [class]="item.enrollment.progressPercent === 100 ? 'bg-emerald-500' : 'bg-tenant-500'"
                          [style.width.%]="item.enrollment.progressPercent"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Card Action Footer -->
                  <div class="flex items-center justify-between pt-3 border-t border-base-300/80 text-xs">
                    <span class="text-[11px] text-text-secondary flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">person</span>
                      {{ item.course.instructorName }}
                    </span>
                    <a 
                      [routerLink]="['/courses', item.course.id, 'learn']" 
                      class="px-3.5 py-1.5 rounded-xl bg-tenant-500 text-white font-semibold flex items-center gap-1 hover:bg-tenant-600 transition-colors shadow-2xs">
                      <span class="material-symbols-outlined text-sm">
                        {{ item.enrollment.progressPercent === 100 ? 'replay' : 'play_arrow' }}
                      </span>
                      <span>{{ item.enrollment.progressPercent === 100 ? 'Review' : 'Continue' }}</span>
                    </a>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- TAB 3: VERIFIED CERTIFICATES VAULT -->
      @if (activeTab() === 'certificates') {
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-base-100 p-5 rounded-3xl border border-base-300 shadow-sm">
            <div>
              <h3 class="font-bold text-base text-text-primary">Verified Credentials & Accreditations</h3>
              <p class="text-xs text-text-secondary">Tamper-proof digital credentials verified under {{ lms.activeTenant().name }}</p>
            </div>
            <a 
              routerLink="/certificates" 
              class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary text-xs font-semibold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">open_in_new</span>
              Full Vault
            </a>
          </div>

          @if (userCertificates().length === 0) {
            <div class="text-center py-16 bg-base-100 rounded-3xl border border-base-300 p-8 space-y-3">
              <span class="material-symbols-outlined text-5xl text-amber-500">military_tech</span>
              <h4 class="font-bold text-base text-text-primary">No Certificates Earned Yet</h4>
              <p class="text-xs text-text-secondary max-w-sm mx-auto">Complete your enrolled mandatory compliance and operational courses to 100% to earn official verified certificates.</p>
              <button (click)="activeTab.set('learning')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tenant-500 text-white text-xs font-semibold mt-2">
                Resume Courses
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (cert of userCertificates(); track cert.id) {
                <div class="bg-base-100 rounded-3xl border border-base-300 p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                  <div class="absolute top-0 right-0 w-24 h-24 bg-tenant-500/10 rounded-bl-full pointer-events-none"></div>

                  <div class="space-y-3 relative">
                    <div class="flex items-center justify-between">
                      <div class="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 p-1 border border-base-300 shadow-2xs flex items-center justify-center">
                        @if (cert.tenantLogo) {
                          <img [src]="cert.tenantLogo" class="w-full h-full object-contain" referrerpolicy="no-referrer" />
                        } @else {
                          <span class="material-symbols-outlined text-tenant-600">verified</span>
                        }
                      </div>
                      <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200">
                        Score: {{ cert.gradeScore }}%
                      </span>
                    </div>

                    <div>
                      <h4 class="font-bold text-sm text-text-primary line-clamp-2">{{ cert.courseTitle }}</h4>
                      <span class="text-[11px] text-text-secondary block mt-0.5 font-medium">{{ cert.category }}</span>
                    </div>

                    <div class="p-2.5 rounded-xl bg-base-200 font-mono text-[10px] text-text-secondary space-y-1">
                      <div class="flex justify-between">
                        <span>Code:</span>
                        <span class="font-bold text-text-primary">{{ cert.verificationCode }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Issued:</span>
                        <span>{{ cert.issuedDate }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-2 border-t border-base-300/80">
                    <a 
                      routerLink="/certificates" 
                      class="flex-1 py-1.5 px-3 rounded-xl bg-tenant-500/15 hover:bg-tenant-500/25 text-tenant-700 dark:text-tenant-200 text-center text-xs font-semibold transition-colors">
                      View Document
                    </a>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- TAB 4: GAMIFICATION & BADGES -->
      @if (activeTab() === 'badges') {
        <div class="space-y-6">
          <div class="bg-base-100 p-5 rounded-3xl border border-base-300 shadow-sm flex items-center justify-between">
            <div>
              <h3 class="font-bold text-base text-text-primary">Skills Mastery & Badges Showcase</h3>
              <p class="text-xs text-text-secondary">Milestone badges earned through quiz perfection and learning streaks</p>
            </div>
            <div class="flex items-center gap-2 bg-amber-500/10 px-3.5 py-1.5 rounded-2xl border border-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs">
              <span class="material-symbols-outlined text-base">emoji_events</span>
              <span>Level 4 Scholar</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (badge of allAvailableBadges; track badge.name) {
              <div 
                class="p-5 rounded-3xl border text-center space-y-3 transition-all flex flex-col items-center justify-between"
                [class]="hasBadge(badge.name) 
                  ? 'bg-base-100 border-tenant-500/40 shadow-sm' 
                  : 'bg-base-200/50 border-base-300/60 opacity-60 grayscale'">
                
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                     [class]="hasBadge(badge.name) ? badge.bgClass : 'bg-base-300 text-text-secondary'">
                  <span class="material-symbols-outlined text-3xl">{{ badge.icon }}</span>
                </div>

                <div>
                  <h4 class="font-bold text-xs text-text-primary">{{ badge.name }}</h4>
                  <p class="text-[10px] text-text-secondary mt-1 leading-snug">{{ badge.description }}</p>
                </div>

                <span 
                  class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  [class]="hasBadge(badge.name) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-base-300 text-text-secondary'">
                  {{ hasBadge(badge.name) ? 'Unlocked' : 'Locked' }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 5: SECURITY & PREFERENCES -->
      @if (activeTab() === 'security') {
        <div class="space-y-6">
          <div class="bg-base-100 rounded-3xl border border-base-300 p-6 shadow-sm space-y-6">
            <div class="border-b border-base-300 pb-4">
              <h3 class="font-bold text-base text-text-primary">Enterprise Security & Sign-in Protocols</h3>
              <p class="text-xs text-text-secondary">Multi-tenant identity protection, SSO bindings, and session controls</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- SSO & Multi-Factor Auth Card -->
              <div class="space-y-4 p-5 rounded-2xl bg-base-200/70 border border-base-300/80">
                <h4 class="font-bold text-xs uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-tenant-600">lock</span>
                  Identity & MFA Authentication
                </h4>

                <div class="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-300/70">
                  <div>
                    <span class="font-bold text-xs text-text-primary block">Two-Factor Authentication (2FA)</span>
                    <span class="text-[11px] text-text-secondary">TOTP Authenticator app or hardware token</span>
                  </div>
                  <button 
                    type="button"
                    (click)="twoFactorEnabled.set(!twoFactorEnabled())"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    [class]="twoFactorEnabled() ? 'bg-tenant-500' : 'bg-base-300'">
                    <span 
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      [class.translate-x-5]="twoFactorEnabled()"
                      [class.translate-x-0]="!twoFactorEnabled()"></span>
                  </button>
                </div>

                <div class="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-300/70">
                  <div>
                    <span class="font-bold text-xs text-text-primary block">Enterprise Single Sign-On (SSO)</span>
                    <span class="text-[11px] text-text-secondary">Connected via {{ lms.activeTenant().branding.ssoProvider }}</span>
                  </div>
                  <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    Active
                  </span>
                </div>
              </div>

              <!-- Notification Preferences -->
              <div class="space-y-4 p-5 rounded-2xl bg-base-200/70 border border-base-300/80">
                <h4 class="font-bold text-xs uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-indigo-500">notifications</span>
                  Communication & Alerts
                </h4>

                <div class="space-y-2.5">
                  <label class="flex items-center justify-between p-2.5 rounded-xl bg-base-100 border border-base-300/70 cursor-pointer">
                    <span class="text-xs text-text-primary font-medium">Mandatory Compliance Deadline Reminders</span>
                    <input type="checkbox" [(ngModel)]="notifCompliance" class="checkbox checkbox-sm accent-tenant-500" />
                  </label>

                  <label class="flex items-center justify-between p-2.5 rounded-xl bg-base-100 border border-base-300/70 cursor-pointer">
                    <span class="text-xs text-text-primary font-medium">Live Webinar & Classroom Invites</span>
                    <input type="checkbox" [(ngModel)]="notifWebinars" class="checkbox checkbox-sm accent-tenant-500" />
                  </label>

                  <label class="flex items-center justify-between p-2.5 rounded-xl bg-base-100 border border-base-300/70 cursor-pointer">
                    <span class="text-xs text-text-primary font-medium">Course Completion Certificate Issuance</span>
                    <input type="checkbox" [(ngModel)]="notifCerts" class="checkbox checkbox-sm accent-tenant-500" />
                  </label>
                </div>
              </div>

            </div>

            <!-- Active Sessions List -->
            <div class="space-y-3 pt-4 border-t border-base-300">
              <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Active Login Sessions</span>
              
              <div class="p-3.5 rounded-2xl bg-base-200/60 border border-base-300 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-2xl text-emerald-500">laptop_mac</span>
                  <div>
                    <div class="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <span>Chrome / MacOS (Current Session)</span>
                      <span class="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">This Device</span>
                    </div>
                    <div class="text-[10px] text-text-secondary font-mono">IP: 192.168.1.104 &bull; Dhaka, Bangladesh &bull; Active Now</div>
                  </div>
                </div>
                <button 
                  type="button"
                  (click)="lms.openSignOutModal()"
                  class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer">
                  Sign Out
                </button>
              </div>
            </div>

          </div>
        </div>
      }

    </div>

    <!-- Avatar Picker Modal -->
    @if (showAvatarPicker()) {
      <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
        <div class="bg-base-100 rounded-3xl border border-base-300 shadow-2xl w-full max-w-md p-6 animate-modal-card space-y-4">
          <div class="flex items-center justify-between border-b border-base-300 pb-3">
            <h3 class="font-bold text-base text-text-primary">Choose Profile Avatar</h3>
            <button (click)="showAvatarPicker.set(false)" class="text-text-secondary hover:text-text-primary p-1 rounded-lg">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div class="grid grid-cols-4 gap-3 py-2">
            @for (av of presetAvatars; track av) {
              <button 
                type="button"
                (click)="selectPresetAvatar(av)"
                class="p-1 rounded-2xl border-2 transition-all hover:scale-105 focus:outline-none focus:ring-0 outline-none"
                [class]="activeUser().avatar === av ? 'border-2 border-tenant-500 shadow-sm' : 'border border-base-300 hover:border-tenant-300'">
                <img [src]="av" class="w-full h-16 rounded-xl object-cover" referrerpolicy="no-referrer" />
              </button>
            }
          </div>

          <div class="space-y-1.5 pt-2 border-t border-base-300">
            <label class="block text-xs font-semibold text-text-secondary">Or Custom Image URL</label>
            <div class="flex items-center gap-2">
              <input 
                type="url" 
                [(ngModel)]="customAvatarUrl" 
                placeholder="https://..." 
                class="flex-1 px-3 py-2 rounded-xl bg-base-200 border border-base-300 text-xs focus:outline-none focus:border-tenant-500" />
              <button 
                type="button" 
                [disabled]="!customAvatarUrl.trim()"
                (click)="applyCustomAvatar()"
                class="px-3.5 py-2 rounded-xl bg-tenant-500 disabled:opacity-50 text-white text-xs font-semibold">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  lms = inject(LmsDataService);
  themeService = inject(ThemeService);

  activeTab = signal<'overview' | 'learning' | 'certificates' | 'badges' | 'security'>('overview');
  isEditing = signal<boolean>(false);
  saveSuccessMessage = signal<string>('');
  showAvatarPicker = signal<boolean>(false);
  customAvatarUrl = '';
  newSkillInput = '';

  twoFactorEnabled = signal<boolean>(true);
  notifCompliance = true;
  notifWebinars = true;
  notifCerts = true;

  tabs: ProfileTab[] = [
    { id: 'overview', label: 'Profile Overview', icon: 'person' },
    { id: 'learning', label: 'Learning Portfolio', icon: 'school' },
    { id: 'certificates', label: 'Verified Certificates', icon: 'verified' },
    { id: 'badges', label: 'Badges & Mastery', icon: 'military_tech' },
    { id: 'security', label: 'Security & SSO', icon: 'shield' },
  ];

  presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  ];

  allAvailableBadges = [
    { name: 'Security Champion', icon: 'security', description: 'Scored 100% on Cybersecurity & Zero Trust assessments.', bgClass: 'bg-emerald-500 text-white' },
    { name: 'Tenant Admin Ace', icon: 'admin_panel_settings', description: 'Configured and launched enterprise LMS workflows.', bgClass: 'bg-indigo-500 text-white' },
    { name: 'Cloud Architect', icon: 'cloud_done', description: 'Completed Multi-Cloud & DevOps Architecture curriculum.', bgClass: 'bg-cyan-500 text-white' },
    { name: 'Client Protection Specialist', icon: 'handshake', description: 'Certified in BRAC microfinance ethical lending covenants.', bgClass: 'bg-tenant-500 text-white' },
    { name: 'Speed Learner', icon: 'bolt', description: 'Completed a 3-module certification within 48 hours.', bgClass: 'bg-amber-500 text-white' },
    { name: 'Early Finisher', icon: 'timer_off', description: 'Submitted all compliance modules 7 days ahead of deadline.', bgClass: 'bg-purple-500 text-white' },
    { name: 'Patient Guardian', icon: 'health_and_safety', description: 'Mastered HIPAA data privacy and clinical EHR workflows.', bgClass: 'bg-teal-500 text-white' },
    { name: 'Master Instructor', icon: 'co_present', description: 'Hosted 5+ live virtual classrooms with 4.9+ rating.', bgClass: 'bg-rose-500 text-white' }
  ];

  activeUser = computed<User>(() => this.lms.activeUser());

  editForm = {
    name: '',
    email: '',
    department: '',
    phone: '+880 1713 000000',
    title: 'Enterprise Learning Lead',
    timezone: 'Asia/Dhaka',
    bio: 'Dedicated to organizational skill progression, microfinance governance, and digital learning transformation.'
  };

  constructor() {
    this.initForm();
  }

  initForm() {
    const u = this.activeUser();
    this.editForm = {
      name: u.name || '',
      email: u.email || '',
      department: u.department || this.lms.activeTenant().departments[0] || 'Operations',
      phone: u.phone || '+880 1713 000000',
      title: u.title || (u.role === 'system_admin' || (u.role as any) === 'super_admin' ? 'Chief System Architect & Platform Director' : u.role === 'lms_admin' || (u.role as any) === 'tenant_admin' ? 'LMS Learning Operations Director' : 'Senior Specialist'),
      timezone: u.timezone || 'Asia/Dhaka',
      bio: u.bio || 'Dedicated to organizational skill progression, microfinance governance, and digital learning transformation.'
    };
  }

  skillsList = computed<string[]>(() => {
    const u = this.activeUser();
    if (u.skills && u.skills.length > 0) return u.skills;
    return ['Microfinance Operations', 'Client Protection Standards', 'Smart Campaign', 'Risk Compliance', 'Financial Inclusion'];
  });

  enrolledCoursesList = computed<{ course: Course; enrollment: CourseEnrollment }[]>(() => {
    const user = this.activeUser();
    const courses = this.lms.courses();
    const enrollments = this.lms.enrollments().filter(e => e.userId === user.id);

    return enrollments.map(enr => {
      const course = courses.find(c => c.id === enr.courseId) || courses[0];
      return { course, enrollment: enr };
    });
  });

  userCertificates = computed<Certificate[]>(() => {
    const user = this.activeUser();
    return this.lms.certificates().filter(c => c.userId === user.id || c.userEmail === user.email);
  });

  hasBadge(badgeName: string): boolean {
    const badges = this.activeUser().badges || [];
    return badges.includes(badgeName);
  }

  saveProfile(event?: Event) {
    event?.preventDefault();
    if (!this.editForm.name.trim() || !this.editForm.email.trim()) return;

    this.lms.updateActiveUserProfile({
      name: this.editForm.name,
      email: this.editForm.email,
      department: this.editForm.department,
      phone: this.editForm.phone,
      title: this.editForm.title,
      timezone: this.editForm.timezone,
      bio: this.editForm.bio
    });

    this.isEditing.set(false);
    this.saveSuccessMessage.set('Profile successfully updated and synced across workspace.');
    setTimeout(() => this.saveSuccessMessage.set(''), 4000);
  }

  cancelEditing() {
    this.initForm();
    this.isEditing.set(false);
  }

  selectPresetAvatar(url: string) {
    this.lms.updateActiveUserProfile({ avatar: url });
    this.showAvatarPicker.set(false);
  }

  applyCustomAvatar() {
    if (!this.customAvatarUrl.trim()) return;
    this.lms.updateActiveUserProfile({ avatar: this.customAvatarUrl.trim() });
    this.customAvatarUrl = '';
    this.showAvatarPicker.set(false);
  }

  addSkill(event?: Event) {
    event?.preventDefault();
    if (!this.newSkillInput.trim()) return;
    const current = [...this.skillsList()];
    if (!current.includes(this.newSkillInput.trim())) {
      current.push(this.newSkillInput.trim());
      this.lms.updateActiveUserProfile({ skills: current });
    }
    this.newSkillInput = '';
  }

  removeSkill(skill: string) {
    const current = this.skillsList().filter(s => s !== skill);
    this.lms.updateActiveUserProfile({ skills: current });
  }

  downloadTranscript() {
    const user = this.activeUser();
    const tenant = this.lms.activeTenant();
    const content = `OFFICIAL LMS LEARNING TRANSCRIPT\n` +
      `====================================\n` +
      `Learner Name: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `Organization: ${tenant.name} (${tenant.domain})\n` +
      `Department: ${user.department}\n` +
      `Role: ${user.role}\n` +
      `Compliance Status: ${user.complianceStatus}\n` +
      `Total XP Points: ${user.points}\n` +
      `Certificates Earned: ${this.userCertificates().length}\n` +
      `Generated Date: ${new Date().toUTCString()}\n` +
      `====================================\n` +
      `Course Enrolments:\n` +
      this.enrolledCoursesList().map(i => `- ${i.course.title}: ${i.enrollment.progressPercent}% (${i.enrollment.status})`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcript_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.lms.logAction('Transcript Exported', `Exported learning transcript dossier for ${user.name}`, 'info');
  }
}
