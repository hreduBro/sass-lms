import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { Certificate } from '../../models/lms.model';

@Component({
  selector: 'app-certificates',
  imports: [CommonModule, FormsModule],
  templateUrl: './certificates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatesComponent {
  lms = inject(LmsDataService);

  searchQuery = signal<string>('');
  verificationCodeInput = signal<string>('');
  verificationResult = signal<Certificate | null | 'not_found'>(null);
  selectedCert = signal<Certificate | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  // Filtered certificates
  filteredCertificates = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const certs = this.lms.tenantCertificates();

    // If learner role, only show their own certificates
    const isLearner = this.lms.isLearner();
    const user = this.lms.activeUser();

    const list = isLearner ? certs.filter(c => c.userId === user.id) : certs;

    return list.filter(c => 
      c.userName.toLowerCase().includes(q) || 
      c.courseTitle.toLowerCase().includes(q) || 
      c.verificationCode.toLowerCase().includes(q)
    );
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredCertificates().length / this.pageSize()));
  });

  paginatedCertificates = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCertificates().slice(start, start + this.pageSize());
  });

  pagesList = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  verifyCertificate() {
    const code = this.verificationCodeInput().trim().toUpperCase();
    if (!code) return;

    const cert = this.lms.certificates().find(c => c.verificationCode.toUpperCase() === code);
    if (cert) {
      this.verificationResult.set(cert);
    } else {
      this.verificationResult.set('not_found');
    }
  }

  viewCertificate(cert: Certificate) {
    this.selectedCert.set(cert);
  }

  printCertificate() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
