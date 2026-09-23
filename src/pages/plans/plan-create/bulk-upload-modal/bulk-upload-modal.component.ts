import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  PlanOnboardedUser, 
  OnboardingScope, 
  OnboardingIdentifierType 
} from '../../../../models/plan.model';
import { LmsDataService } from '../../../../services/lms-data.service';

interface ParsedRow {
  identifierType: OnboardingIdentifierType;
  bracPin: string;
  email: string;
  fullName: string;
  designation: string;
  department: string;
  notes: string;
  isValid: boolean;
  errorMessage?: string;
}

@Component({
  selector: 'app-bulk-upload-modal',
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-header {
      padding: 1.25rem 1.5rem !important;
      flex-shrink: 0 !important;
    }
  `],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        (click)="onClose()">
        
        <div 
          class="bg-base-100 rounded-3xl shadow-2xl border border-base-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          aria-label="Bulk Upload Trainees">
          
          <!-- Header -->
          <div class="modal-header px-6 py-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between gap-4 bg-base-100 dark:bg-slate-900 shrink-0">
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <div class="w-11 h-11 rounded-2xl bg-tenant-500/10 text-tenant-600 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">upload_file</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-xs font-bold text-tenant-600 uppercase tracking-wider">Bulk Onboarding</span>
                  <span class="text-xs font-medium text-text-secondary truncate">
                    Target Scope: <strong class="text-text-primary font-semibold">{{ getScopeDisplayName(targetScope()) }}</strong>
                  </span>
                </div>
                <h2 class="text-base sm:text-lg font-bold text-text-primary leading-tight truncate">
                  Upload Trainee Roster (.CSV)
                </h2>
              </div>
            </div>

            <button 
              type="button" 
              (click)="onClose()"
              class="w-9 h-9 rounded-xl bg-base-200 hover:bg-base-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close Modal"
              title="Close Modal">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">

            <!-- Step 1: Download Standard Template Box -->
            <div class="p-4 rounded-2xl bg-tenant-50/50 dark:bg-tenant-950/20 border border-tenant-200 dark:border-tenant-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="text-xs font-bold text-tenant-800 dark:text-tenant-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">download</span>
                  <span>Step 1: Download Standard CSV Template</span>
                </h3>
                <p class="text-xs text-text-secondary mt-1">
                  Includes formatted columns: <code>Identifier Type, BRAC PIN, Email, Full Name, Designation, Notes</code>
                </p>
              </div>

              <button 
                type="button"
                (click)="downloadTemplate()"
                class="px-4 py-2 rounded-xl bg-base-100 hover:bg-base-200 text-tenant-700 dark:text-tenant-300 border border-tenant-300 dark:border-tenant-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0">
                <span class="material-symbols-outlined text-base">file_download</span>
                <span>Download Template (.csv)</span>
              </button>
            </div>

            <!-- Step 2: Upload Area -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm text-tenant-500">cloud_upload</span>
                <span>Step 2: Select or Drag & Drop File</span>
              </h3>

              <div 
                class="border-2 border-dashed border-base-300 rounded-2xl p-8 text-center hover:border-tenant-500 transition-colors bg-base-200/30 flex flex-col items-center justify-center cursor-pointer relative"
                (click)="fileInput.click()">
                <input 
                  #fileInput
                  type="file" 
                  accept=".csv,.txt"
                  (change)="onFileSelected($event)" 
                  class="hidden" />

                <div class="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center text-tenant-600 mb-2">
                  <span class="material-symbols-outlined text-2xl">table_rows</span>
                </div>
                <p class="text-xs font-bold text-text-primary">Click to browse or drop your CSV file here</p>
                <p class="text-[11px] text-text-secondary mt-0.5">Supports CSV files up to 5MB</p>
              </div>
            </div>

            <!-- Step 3: Parsed Results & Live Validation -->
            @if (parsedRows().length > 0) {
              <div class="space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Parsing Summary</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-base-200 text-text-primary">
                      {{ parsedRows().length }} Total Rows
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {{ validRowsCount() }} Ready to Commit
                    </span>
                    @if (errorRowsCount() > 0) {
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        {{ errorRowsCount() }} Errors
                      </span>
                    }
                  </div>

                  @if (errorRowsCount() > 0) {
                    <button 
                      type="button"
                      (click)="downloadErrorRows()"
                      class="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-sm">download</span>
                      <span>Download Error Rows</span>
                    </button>
                  }
                </div>

                <!-- Table Preview -->
                <div class="border border-base-300 rounded-2xl overflow-hidden text-xs max-h-72 overflow-y-auto">
                  <table class="w-full text-left">
                    <thead class="bg-base-200/70 text-[11px] font-semibold text-text-secondary border-b border-base-300 sticky top-0">
                      <tr>
                        <th class="p-2.5">Status</th>
                        <th class="p-2.5">Identifier</th>
                        <th class="p-2.5">Full Name</th>
                        <th class="p-2.5">Designation</th>
                        <th class="p-2.5">Notes / Validation</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-base-300 bg-base-100">
                      @for (row of parsedRows(); track row.bracPin || row.email) {
                        <tr [class.bg-rose-50/40]="!row.isValid">
                          <td class="p-2.5">
                            @if (row.isValid) {
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                                <span class="material-symbols-outlined text-[12px]">check</span> Valid
                              </span>
                            } @else {
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                                <span class="material-symbols-outlined text-[12px]">close</span> Error
                              </span>
                            }
                          </td>
                          <td class="p-2.5 font-mono text-[11px] font-bold">
                            {{ row.identifierType === 'BRAC PIN' ? row.bracPin : row.email }}
                            <span class="text-[10px] text-text-secondary block font-sans font-normal">{{ row.identifierType }}</span>
                          </td>
                          <td class="p-2.5 font-medium text-text-primary">{{ row.fullName }}</td>
                          <td class="p-2.5 text-text-secondary">{{ row.designation }}</td>
                          <td class="p-2.5">
                            @if (row.isValid) {
                              <span class="text-text-secondary">{{ row.notes || 'Verified in directory' }}</span>
                            } @else {
                              <span class="text-rose-600 font-medium">{{ row.errorMessage }}</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 border-t border-base-300 bg-base-100/90 flex items-center justify-between gap-3">
            <button 
              type="button"
              (click)="onClose()"
              class="px-4 py-2.5 rounded-xl border border-base-300 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-base-200 transition-colors cursor-pointer">
              Cancel
            </button>

            <button 
              type="button"
              (click)="commitValidRows()"
              [disabled]="validRowsCount() === 0"
              class="px-5 py-2.5 rounded-xl bg-tenant-500 hover:bg-tenant-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer">
              <span class="material-symbols-outlined text-base">check_circle</span>
              <span>Commit {{ validRowsCount() }} Valid Users</span>
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class BulkUploadModalComponent {
  private lmsData = inject(LmsDataService);

  isOpen = input<boolean>(false);
  targetScope = input<OnboardingScope>('Whole Plan');
  existingUsers = input<PlanOnboardedUser[]>([]);

  close = output<void>();
  commit = output<PlanOnboardedUser[]>();

  parsedRows = signal<ParsedRow[]>([]);

  validRowsCount = computed<number>(() => {
    return this.parsedRows().filter(r => r.isValid).length;
  });

  errorRowsCount = computed<number>(() => {
    return this.parsedRows().filter(r => !r.isValid).length;
  });

  getScopeDisplayName(scope: OnboardingScope): string {
    return scope === 'Whole Plan' ? 'Whole Plan Cohort' : `Phase Scoped (${scope})`;
  }

  downloadTemplate() {
    const csvContent = 
      'Identifier Type,BRAC PIN,Email,Full Name,Designation,Notes\n' +
      'BRAC PIN,PIN-10492,tahmina.akter@brac.net,Tahmina Akter,Junior Field Officer,Batch 2026 recruit\n' +
      'BRAC PIN,PIN-10493,shofiul.islam@brac.net,Md. Shofiul Islam,Junior Field Officer,Batch 2026 recruit\n' +
      'Email,,partner.advisor@brac-ngo.org,Nasir Uddin,External Technical Advisor,Partner organization';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Trainee_Onboarding_Template.csv');
    link.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result as string;
      this.parseCsvContent(text);
    };
    reader.readAsText(file);
  }

  parseCsvContent(text: string) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      this.lmsData.showToast('Uploaded CSV file has no data rows.', 'warning');
      return;
    }

    const rows: ParsedRow[] = [];
    const seenIdentifiers = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const rawType = (parts[0] || 'BRAC PIN').toUpperCase().includes('EMAIL') ? 'Email' : 'BRAC PIN';
      const pin = parts[1] || '';
      const email = parts[2] || '';
      const name = parts[3] || 'Trainee';
      const designation = parts[4] || 'Field Trainee';
      const notes = parts[5] || '';

      const idKey = rawType === 'BRAC PIN' ? pin : email.toLowerCase();
      let isValid = true;
      let errorMsg: string | undefined = undefined;

      if (rawType === 'BRAC PIN') {
        if (!pin || pin.length < 3) {
          isValid = false;
          errorMsg = 'Missing or invalid BRAC PIN.';
        } else if (pin.includes('99999')) {
          isValid = false;
          errorMsg = 'PIN not recognized in staff directory.';
        }
      } else {
        if (!email || !email.includes('@')) {
          isValid = false;
          errorMsg = 'Invalid email address format.';
        }
      }

      if (isValid) {
        if (seenIdentifiers.has(idKey)) {
          isValid = false;
          errorMsg = 'Duplicate entry within this file.';
        } else {
          seenIdentifiers.add(idKey);
        }
      }

      if (isValid) {
        const alreadyInScope = this.existingUsers().some(u => 
          (u.identifierType === 'BRAC PIN' && u.bracPin === pin) ||
          (u.identifierType === 'Email' && u.email.toLowerCase() === email.toLowerCase())
        );
        if (alreadyInScope) {
          isValid = false;
          errorMsg = 'User already onboarded to this Plan.';
        }
      }

      rows.push({
        identifierType: rawType,
        bracPin: pin,
        email: email || `${pin.toLowerCase()}@brac.net`,
        fullName: name,
        designation,
        department: 'Microfinance Field Staff',
        notes,
        isValid,
        errorMessage: errorMsg
      });
    }

    this.parsedRows.set(rows);
    this.lmsData.showToast(`Parsed ${rows.length} rows (${this.validRowsCount()} valid).`, 'info');
  }

  downloadErrorRows() {
    const errorRows = this.parsedRows().filter(r => !r.isValid);
    if (errorRows.length === 0) return;

    let content = 'Identifier Type,BRAC PIN,Email,Full Name,Designation,Error Reason\n';
    errorRows.forEach(r => {
      content += `${r.identifierType},${r.bracPin},${r.email},"${r.fullName}","${r.designation}","${r.errorMessage}"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Onboarding_Error_Rows.csv');
    link.click();
    URL.revokeObjectURL(url);
  }

  commitValidRows() {
    const validOnes = this.parsedRows().filter(r => r.isValid);
    if (validOnes.length === 0) return;

    const dateToday = '01/01/2026';
    const newUsers: PlanOnboardedUser[] = validOnes.map((r, i) => ({
      id: `usr-bulk-${Date.now()}-${i}`,
      scope: this.targetScope(),
      identifierType: r.identifierType,
      bracPin: r.bracPin,
      email: r.email,
      fullName: r.fullName,
      designation: r.designation,
      department: r.department,
      notes: r.notes,
      status: 'Ready',
      dateAdded: dateToday,
      source: 'Bulk Upload'
    }));

    this.commit.emit(newUsers);
    this.parsedRows.set([]);
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }
}
