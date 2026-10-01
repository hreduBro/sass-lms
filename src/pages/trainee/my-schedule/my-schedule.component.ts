import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TraineePlanService } from '../../../services/trainee-plan.service';
import { TraineeScheduleItem, TRAINEE_PERSONAS } from '../../../models/trainee-plan.model';

@Component({
  selector: 'app-my-schedule',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- Persona Simulator Switcher -->
      <div class="p-4 sm:p-5 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-xl">calendar_month</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Schedule Persona Simulator</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {{ activePersona().name }}
                </span>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                Switch personas to preview individual timetables, classroom attendance status, and exam windows.
              </p>
            </div>
          </div>

          <!-- Persona Selector Chips -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            @for (p of personas; track p.id) {
              <button 
                type="button" 
                (click)="switchPersona(p.id)"
                [class.bg-amber-600]="activePersona().id === p.id"
                [class.text-white]="activePersona().id === p.id"
                [class.shadow-xs]="activePersona().id === p.id"
                [class.bg-base-200]="activePersona().id !== p.id"
                [class.text-text-secondary]="activePersona().id !== p.id"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer hover:border-amber-400 border border-transparent">
                <img [src]="p.avatar" [alt]="p.name" class="w-5 h-5 rounded-full object-cover" />
                <span>{{ p.name }}</span>
                <span class="text-[10px] opacity-80 font-normal">({{ p.tag.split(' ')[0] }})</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Top Header & Dual Views Switcher -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-text-primary flex items-center gap-2.5">
            <span class="material-symbols-outlined text-2xl text-amber-500">calendar_month</span>
            My Schedule & Classroom Sessions
          </h1>
          <p class="text-xs text-text-secondary mt-1">
            Chronological timetable of dated in-person laboratory sessions, venue details, and timed evaluation windows.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- View Toggle: List vs Calendar -->
          <div class="flex items-center p-1 bg-base-200 dark:bg-base-300 rounded-xl border border-base-300 dark:border-slate-800">
            <button 
              type="button" 
              (click)="viewMode.set('list')"
              [class.bg-base-100]="viewMode() === 'list'"
              [class.dark:bg-base-200]="viewMode() === 'list'"
              [class.text-tenant-600]="viewMode() === 'list'"
              [class.shadow-xs]="viewMode() === 'list'"
              [class.text-text-secondary]="viewMode() !== 'list'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-sm">view_agenda</span>
              <span>List View</span>
            </button>
            <button 
              type="button" 
              (click)="viewMode.set('calendar')"
              [class.bg-base-100]="viewMode() === 'calendar'"
              [class.dark:bg-base-200]="viewMode() === 'calendar'"
              [class.text-tenant-600]="viewMode() === 'calendar'"
              [class.shadow-xs]="viewMode() === 'calendar'"
              [class.text-text-secondary]="viewMode() !== 'calendar'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-sm">calendar_view_month</span>
              <span>Calendar View</span>
            </button>
          </div>

          <a 
            routerLink="/my-plans" 
            class="px-4 py-2 rounded-xl border border-base-300 dark:border-slate-800 text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 bg-base-100 dark:bg-base-200">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Plans</span>
          </a>
        </div>
      </div>

      <!-- Filters Strip -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 text-xs">
        
        <!-- Type Filter Chips -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          @for (f of typeFilters; track f.key) {
            <button 
              type="button" 
              (click)="selectedType.set(f.key)"
              [class.bg-tenant-600]="selectedType() === f.key"
              [class.text-white]="selectedType() === f.key"
              [class.bg-base-200]="selectedType() !== f.key"
              [class.text-text-secondary]="selectedType() !== f.key"
              class="px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap">
              {{ f.label }}
            </button>
          }
        </div>

        <div class="text-xs text-text-secondary font-medium">
          Showing <strong>{{ filteredSchedule().length }}</strong> scheduled session(s) & event(s)
        </div>
      </div>

      <!-- LIST VIEW -->
      @if (viewMode() === 'list') {
        <div class="space-y-4">
          @for (item of filteredSchedule(); track item.id) {
            <div class="p-6 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm hover:border-tenant-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div class="flex items-start gap-4">
                
                <!-- Date Chip Box -->
                <div class="w-16 h-16 rounded-2xl bg-base-200 dark:bg-base-300 border border-base-300 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                  <span class="text-[10px] uppercase font-bold text-tenant-600 dark:text-tenant-400">Date</span>
                  <span class="text-base font-black text-text-primary">{{ item.date.split('/')[0] }}</span>
                  <span class="text-[10px] text-text-secondary">{{ item.date.split('/')[1] }}/{{ item.date.split('/')[2] }}</span>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span 
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      [class.bg-amber-100]="item.type === 'class_session'"
                      [class.text-amber-900]="item.type === 'class_session'"
                      [class.bg-rose-100]="item.type === 'exam'"
                      [class.text-rose-900]="item.type === 'exam'"
                      [class.bg-indigo-100]="item.type === 'phase_window'"
                      [class.text-indigo-900]="item.type === 'phase_window'">
                      {{ item.type === 'class_session' ? 'In-Person Class' : (item.type === 'exam' ? 'Timed Evaluation' : 'Phase Window') }}
                    </span>

                    <span class="font-bold text-xs text-text-secondary">• {{ item.planName }}</span>

                    @if (item.type === 'class_session') {
                      <span 
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                        [class.bg-emerald-100]="item.status === 'Attended'"
                        [class.text-emerald-800]="item.status === 'Attended'"
                        [class.bg-rose-100]="item.status === 'Missed'"
                        [class.text-rose-800]="item.status === 'Missed'"
                        [class.bg-base-200]="item.status === 'Upcoming'"
                        [class.text-text-secondary]="item.status === 'Upcoming'">
                        <span class="material-symbols-outlined text-xs">
                          {{ item.status === 'Attended' ? 'check_circle' : (item.status === 'Missed' ? 'cancel' : 'pending') }}
                        </span>
                        {{ item.status }}
                      </span>
                    }
                  </div>

                  <h3 class="text-base font-bold text-text-primary">{{ item.title }}</h3>

                  <!-- Metadata -->
                  <div class="flex items-center gap-4 text-xs text-text-secondary flex-wrap pt-0.5">
                    @if (item.time) {
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm text-slate-500">schedule</span>
                        {{ item.time }} ({{ item.duration }})
                      </span>
                    }
                    @if (item.venue) {
                      <span class="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                        <span class="material-symbols-outlined text-sm text-amber-500">pin_drop</span>
                        {{ item.venue }} @if (item.room) { • {{ item.room }} }
                      </span>
                    }
                    @if (item.instructor) {
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm text-slate-500">school</span>
                        Trainer: <strong>{{ item.instructor }}</strong>
                      </span>
                    }
                  </div>
                </div>

              </div>

              <!-- Right Actions -->
              <div class="flex items-center gap-2.5 shrink-0">
                @if (item.type === 'class_session') {
                  <button 
                    type="button" 
                    (click)="toggleAttendance(item.id)"
                    class="px-3.5 py-2 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-bold hover:bg-base-200 transition-colors cursor-pointer flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-tenant-600">how_to_reg</span>
                    <span>{{ item.status === 'Attended' ? 'Mark as Upcoming' : 'Confirm Attended' }}</span>
                  </button>
                }

                <a 
                  [routerLink]="['/my-plans', item.planId]"
                  class="px-4 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs">
                  <span>Go to Plan</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

            </div>
          }

          @if (filteredSchedule().length === 0) {
            <div class="p-12 text-center rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 space-y-3">
              <span class="material-symbols-outlined text-3xl text-text-secondary">event_busy</span>
              <h3 class="text-base font-bold text-text-primary">No Scheduled Sessions Found</h3>
              <p class="text-xs text-text-secondary">Try switching the event category filter or active persona.</p>
            </div>
          }
        </div>
      }

      <!-- CALENDAR VIEW -->
      @if (viewMode() === 'calendar') {
        <div class="p-6 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm space-y-5">
          
          <!-- Month Bar -->
          <div class="flex items-center justify-between pb-4 border-b border-base-300 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <button 
                type="button" 
                (click)="prevMonth()"
                class="w-8 h-8 rounded-xl border border-base-300 dark:border-slate-700 flex items-center justify-center hover:bg-base-200 cursor-pointer">
                <span class="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <h3 class="font-bold text-base text-text-primary">{{ currentMonthName() }} {{ currentYear() }}</h3>

              <button 
                type="button" 
                (click)="nextMonth()"
                class="w-8 h-8 rounded-xl border border-base-300 dark:border-slate-700 flex items-center justify-center hover:bg-base-200 cursor-pointer">
                <span class="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <span class="text-xs text-text-secondary">
              {{ currentMonthEvents().length }} Event(s) this month
            </span>
          </div>

          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-2.5 text-center text-xs">
            @for (dayName of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; track dayName) {
              <div class="font-bold text-text-secondary py-1 text-[11px] uppercase tracking-wider">{{ dayName }}</div>
            }

            @for (slot of dynamicCalendarDays(); track slot.day) {
              <div 
                class="min-h-28 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all"
                [class.bg-base-100]="slot.events.length === 0"
                [class.dark:bg-base-200]="slot.events.length === 0"
                [class.border-base-300]="slot.events.length === 0"
                [class.dark:border-slate-800]="slot.events.length === 0"
                [class.bg-tenant-50/30]="slot.events.length > 0"
                [class.dark:bg-tenant-950/20]="slot.events.length > 0"
                [class.border-tenant-300]="slot.events.length > 0"
                [class.dark:border-tenant-800]="slot.events.length > 0">
                
                <div class="flex items-center justify-between">
                  <span class="text-[12px] font-black" [class.text-tenant-600]="slot.events.length > 0" [class.text-text-secondary]="slot.events.length === 0">
                    {{ slot.day }}
                  </span>
                  @if (slot.events.length > 0) {
                    <span class="w-2 h-2 rounded-full bg-tenant-500"></span>
                  }
                </div>

                <div class="space-y-1 mt-1.5 overflow-hidden">
                  @for (ev of slot.events; track ev.id) {
                    <div 
                      (click)="toggleAttendance(ev.id)"
                      class="p-1.5 rounded-lg text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] shadow-2xs"
                      [class.bg-amber-100]="ev.type === 'class_session'"
                      [class.text-amber-900]="ev.type === 'class_session'"
                      [class.border-l-2]="ev.type === 'class_session'"
                      [class.border-amber-600]="ev.type === 'class_session'"
                      [class.bg-rose-100]="ev.type === 'exam'"
                      [class.text-rose-900]="ev.type === 'exam'"
                      [class.border-rose-600]="ev.type === 'exam'"
                      [class.bg-indigo-100]="ev.type === 'phase_window'"
                      [class.text-indigo-900]="ev.type === 'phase_window'"
                      [class.border-indigo-600]="ev.type === 'phase_window'"
                      [title]="ev.title + ' (' + (ev.venue || 'Online') + ')'">
                      <div class="truncate">{{ ev.title }}</div>
                      <div class="text-[9px] opacity-75 font-normal truncate">{{ ev.time }}</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `
})
export class MyScheduleComponent {
  private traineeService = inject(TraineePlanService);

  personas = TRAINEE_PERSONAS;
  activePersona = this.traineeService.activePersona;

  viewMode = signal<'list' | 'calendar'>('list');
  selectedType = signal<string>('all');

  currentMonthIndex = signal<number>(2); // March = 2 (0-indexed)
  currentYear = signal<number>(2026);

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  currentMonthName = computed(() => this.monthNames[this.currentMonthIndex()]);

  typeFilters = [
    { key: 'all', label: 'All Scheduled Events' },
    { key: 'class_session', label: 'In-Person Classes' },
    { key: 'exam', label: 'Timed Evaluations' },
    { key: 'phase_window', label: 'Phase Deadlines' }
  ];

  scheduleItems = computed<TraineeScheduleItem[]>(() => {
    return this.traineeService.getScheduleItems(this.activePersona());
  });

  filteredSchedule = computed<TraineeScheduleItem[]>(() => {
    const list = this.scheduleItems();
    const type = this.selectedType();
    if (type === 'all') return list;
    return list.filter(i => i.type === type);
  });

  currentMonthEvents = computed(() => {
    const mStr = String(this.currentMonthIndex() + 1).padStart(2, '0');
    const yStr = String(this.currentYear());
    return this.scheduleItems().filter(item => {
      const parts = item.date.split('/');
      return parts[1] === mStr && parts[2] === yStr;
    });
  });

  dynamicCalendarDays = computed(() => {
    const mIndex = this.currentMonthIndex();
    const year = this.currentYear();
    const daysInMonth = new Date(year, mIndex + 1, 0).getDate();
    const mStr = String(mIndex + 1).padStart(2, '0');
    const yStr = String(year);

    const items = this.scheduleItems();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dStr = String(day).padStart(2, '0');
      const formatted = `${dStr}/${mStr}/${yStr}`;
      const events = items.filter(item => item.date === formatted || item.date.startsWith(`${dStr}/${mStr}`));
      return { day, formatted, events };
    });
  });

  toggleAttendance(sessionId: string) {
    this.traineeService.toggleSessionAttendanceState(sessionId);
  }

  switchPersona(id: string) {
    this.traineeService.setPersona(id);
  }

  prevMonth() {
    if (this.currentMonthIndex() > 0) {
      this.currentMonthIndex.update(m => m - 1);
    }
  }

  nextMonth() {
    if (this.currentMonthIndex() < 11) {
      this.currentMonthIndex.update(m => m + 1);
    }
  }
}
