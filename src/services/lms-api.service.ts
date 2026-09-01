import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { Tenant, Course, User, AuditLog, DashboardWidget } from '../models/lms.model';

export interface BackendHealth {
  status: string;
  environment: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    tenantsCount: number;
    coursesCount: number;
    learnersCount: number;
    auditLogsCount: number;
  };
  aiEnabled: boolean;
}

export interface AiCourseCurriculum {
  title: string;
  description: string;
  estimatedMinutes: number;
  level: string;
  category: string;
  learningObjectives: string[];
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{
      title: string;
      type: string;
      durationMinutes: number;
      summary: string;
    }>;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class LmsApiService {
  private http = inject(HttpClient);

  // Backend connection status signal
  isConnected = signal<boolean>(false);
  serverHealth = signal<BackendHealth | null>(null);
  lastLatencyMs = signal<number>(0);
  isGeneratingAi = signal<boolean>(false);

  constructor() {
    this.pingHealth();
  }

  // Ping backend health
  pingHealth(): Observable<BackendHealth | null> {
    const start = performance.now();
    return this.http.get<BackendHealth>('/api/health').pipe(
      tap((res) => {
        const latency = Math.round(performance.now() - start);
        this.lastLatencyMs.set(latency);
        this.isConnected.set(true);
        this.serverHealth.set(res);
      }),
      catchError((err) => {
        this.isConnected.set(false);
        return of(null);
      })
    );
  }

  // Tenants API
  getTenants(search?: string, plan?: string): Observable<Tenant[]> {
    let params: any = {};
    if (search) params.search = search;
    if (plan) params.plan = plan;

    return this.http.get<{ success: boolean; data: Tenant[] }>('/api/tenants', { params }).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );
  }

  getTenantById(id: string): Observable<Tenant | null> {
    return this.http.get<{ success: boolean; data: Tenant }>(`/api/tenants/${id}`).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  createTenant(tenant: Partial<Tenant>): Observable<Tenant | null> {
    return this.http.post<{ success: boolean; data: Tenant }>('/api/tenants', tenant).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  updateTenant(id: string, tenant: Partial<Tenant>): Observable<Tenant | null> {
    return this.http.put<{ success: boolean; data: Tenant }>(`/api/tenants/${id}`, tenant).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  deleteTenant(id: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`/api/tenants/${id}`).pipe(
      map(res => res.success),
      catchError(() => of(false))
    );
  }

  // Courses API
  getCourses(tenantId?: string, category?: string): Observable<Course[]> {
    let params: any = {};
    if (tenantId) params.tenantId = tenantId;
    if (category) params.category = category;

    return this.http.get<{ success: boolean; data: Course[] }>('/api/courses', { params }).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );
  }

  createCourse(course: Partial<Course>): Observable<Course | null> {
    return this.http.post<{ success: boolean; data: Course }>('/api/courses', course).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  updateCourse(id: string, course: Partial<Course>): Observable<Course | null> {
    return this.http.put<{ success: boolean; data: Course }>(`/api/courses/${id}`, course).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  deleteCourse(id: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`/api/courses/${id}`).pipe(
      map(res => res.success),
      catchError(() => of(false))
    );
  }

  // Learners API
  getLearners(tenantId?: string, department?: string): Observable<any[]> {
    let params: any = {};
    if (tenantId) params.tenantId = tenantId;
    if (department) params.department = department;

    return this.http.get<{ success: boolean; data: any[] }>('/api/learners', { params }).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );
  }

  recordProgress(learnerId: string, courseId: string, completed: boolean = false, timeSpentMinutes: number = 15): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`/api/learners/${learnerId}/progress`, {
      courseId,
      completed,
      timeSpentMinutes
    }).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  // Custom Dashboard Layout API
  getDashboardLayout(tenantId: string): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(`/api/dashboards/${tenantId}`).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  saveDashboardLayout(tenantId: string, widgets: any[], updatedBy: string = 'Administrator'): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`/api/dashboards/${tenantId}`, {
      widgets,
      updatedBy
    }).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  // Server-Side AI Course Generation (Gemini 3.7 Flash)
  generateAiCourse(topic: string, audience: string = 'Enterprise Workforce', category: string = 'Compliance & Security', difficulty: string = 'Intermediate'): Observable<{ success: boolean; data?: AiCourseCurriculum; error?: string }> {
    this.isGeneratingAi.set(true);
    return this.http.post<{ success: boolean; data: AiCourseCurriculum; error?: string }>('/api/ai/generate-course', {
      topic,
      audience,
      category,
      difficulty
    }).pipe(
      tap(() => this.isGeneratingAi.set(false)),
      catchError((err) => {
        this.isGeneratingAi.set(false);
        return of({ success: false, error: err.message || 'API request failed' });
      })
    );
  }

  // Audit Logs API
  getAuditLogs(tenantId?: string): Observable<AuditLog[]> {
    let params: any = {};
    if (tenantId) params.tenantId = tenantId;

    return this.http.get<{ success: boolean; data: AuditLog[] }>('/api/audit-logs', { params }).pipe(
      map(res => res.data),
      catchError(() => of([]))
    );
  }

  // Export Manifest
  getScormDownloadUrl(courseId: string): string {
    return `/api/export/scorm/${courseId}`;
  }
}
