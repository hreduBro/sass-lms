import { Injectable, inject } from '@angular/core';
import { LmsDataService } from './lms-data.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private lms = inject(LmsDataService);

  // Compatible signals
  tenants = this.lms.tenants;
  activeTenant = this.lms.activeTenant;
  activeRole = this.lms.activeRole;
  courses = this.lms.courses;
  users = this.lms.users;
  enrollments = this.lms.enrollments;
  certificates = this.lms.certificates;
  auditLogs = this.lms.auditLogs;
  webinars = this.lms.webinars;
}
