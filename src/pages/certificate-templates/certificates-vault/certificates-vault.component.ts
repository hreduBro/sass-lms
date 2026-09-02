import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';
import { CertificateTemplate } from '../../../models/certificate-template.model';

export interface IssuedCertificate {
  serialNumber: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  phaseTitle: string;
  templateId: string;
  templateName: string;
  issueDate: string;
  status: 'valid' | 'revoked' | 'expired';
  grade?: string;
  verificationUrl: string;
}

@Component({
  selector: 'app-certificates-vault',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  templateUrl: './certificates-vault.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificatesVaultComponent {
  lms = inject(LmsDataService);

  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedCourse = signal<string>('all');
  isFilterOpen = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Preview Modal
  activeIssuedCert = signal<IssuedCertificate | null>(null);

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'valid', label: 'Valid & Verified', icon: 'verified' },
    { value: 'revoked', label: 'Revoked', icon: 'block' },
    { value: 'expired', label: 'Expired', icon: 'event_busy' }
  ];

  courseOptions = computed<SelectOption[]>(() => {
    const set = new Set<string>();
    this.issuedCertificates().forEach(c => set.add(c.courseTitle));
    return [
      { value: 'all', label: 'All Courses' },
      ...Array.from(set).map(title => ({ value: title, label: title, icon: 'school' }))
    ];
  });

  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedCourse() !== 'all') count++;
    return count;
  });

  // Issued records seeded with rich data
  issuedCertificates = signal<IssuedCertificate[]>([
    {
      serialNumber: 'BRAC-CERT-2026-9812',
      studentName: 'Farhan Rahman',
      studentEmail: 'farhan.r@bracit.edu.bd',
      courseTitle: 'Full-Stack Cloud Engineering Bootcamp',
      phaseTitle: 'Phase 4: Microservices Architecture',
      templateId: 'CERT-TMP-1972-01',
      templateName: 'Standard BRAC IT Achievement Certificate',
      issueDate: '15 Feb 2026',
      status: 'valid',
      grade: 'Distinction (94%)',
      verificationUrl: 'https://verify.bracit.net/BRAC-CERT-2026-9812'
    },
    {
      serialNumber: 'BRAC-CERT-2026-9813',
      studentName: 'Nusrat Jahan',
      studentEmail: 'nusrat.j@bracit.edu.bd',
      courseTitle: 'Full-Stack Cloud Engineering Bootcamp',
      phaseTitle: 'Phase 4: Microservices Architecture',
      templateId: 'CERT-TMP-1972-01',
      templateName: 'Standard BRAC IT Achievement Certificate',
      issueDate: '15 Feb 2026',
      status: 'valid',
      grade: 'Merit (88%)',
      verificationUrl: 'https://verify.bracit.net/BRAC-CERT-2026-9813'
    },
    {
      serialNumber: 'BRAC-CERT-2026-9401',
      studentName: 'Tahmidul Islam',
      studentEmail: 'tahmid.i@bracit.edu.bd',
      courseTitle: 'Enterprise Kubernetes & DevOps Mastery',
      phaseTitle: 'Phase 3: CI/CD Pipeline Automation',
      templateId: 'CERT-TMP-1972-02',
      templateName: 'Executive Professional Excellence Credential',
      issueDate: '28 Jan 2026',
      status: 'valid',
      grade: 'Distinction (98%)',
      verificationUrl: 'https://verify.bracit.net/BRAC-CERT-2026-9401'
    },
    {
      serialNumber: 'BRAC-CERT-2026-8910',
      studentName: 'Ayesha Siddiqua',
      studentEmail: 'ayesha.s@bracit.edu.bd',
      courseTitle: 'Data Science & Machine Learning Foundations',
      phaseTitle: 'Phase 2: Deep Learning Models',
      templateId: 'CERT-TMP-1972-01',
      templateName: 'Standard BRAC IT Achievement Certificate',
      issueDate: '10 Jan 2026',
      status: 'valid',
      grade: 'Pass (79%)',
      verificationUrl: 'https://verify.bracit.net/BRAC-CERT-2026-8910'
    },
    {
      serialNumber: 'BRAC-CERT-2025-7721',
      studentName: 'Zubair Hossain',
      studentEmail: 'zubair.h@bracit.edu.bd',
      courseTitle: 'Cybersecurity Incident Response Specialist',
      phaseTitle: 'Phase 1: Threat Hunting',
      templateId: 'CERT-TMP-1972-03',
      templateName: 'Merit Award for Technical Distinction',
      issueDate: '12 Dec 2025',
      status: 'revoked',
      grade: 'Revoked (Non-compliance)',
      verificationUrl: 'https://verify.bracit.net/BRAC-CERT-2025-7721'
    }
  ]);

  filteredRecords = computed<IssuedCertificate[]>(() => {
    let list = this.issuedCertificates();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const course = this.selectedCourse();

    if (query) {
      list = list.filter(c => 
        c.studentName.toLowerCase().includes(query) ||
        c.studentEmail.toLowerCase().includes(query) ||
        c.serialNumber.toLowerCase().includes(query) ||
        c.courseTitle.toLowerCase().includes(query) ||
        c.phaseTitle.toLowerCase().includes(query)
      );
    }

    if (status !== 'all') {
      list = list.filter(c => c.status === status);
    }

    if (course !== 'all') {
      list = list.filter(c => c.courseTitle === course);
    }

    return list;
  });

  paginatedRecords = computed<IssuedCertificate[]>(() => {
    const list = this.filteredRecords();
    const page = this.currentPage();
    const size = this.pageSize();
    return list.slice((page - 1) * size, page * size);
  });

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredRecords().length > 0) return 'none';
    if (this.issuedCertificates().length === 0) return 'true_empty';
    if (this.searchQuery().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedCourse.set('all');
    this.currentPage.set(1);
  }

  copyVerificationUrl(cert: IssuedCertificate) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(cert.verificationUrl);
      this.lms.showToast('Verification URL copied to clipboard!', 'success');
    }
  }

  viewCertificate(cert: IssuedCertificate) {
    this.activeIssuedCert.set(cert);
  }

  closeCertificateModal() {
    this.activeIssuedCert.set(null);
  }
}
