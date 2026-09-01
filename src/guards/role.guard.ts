import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LmsDataService } from '../services/lms-data.service';
import { UserRole } from '../models/lms.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const lms = inject(LmsDataService);
  const router = inject(Router);
  const activeRole = lms.activeRole();
  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;

  // If no roles specified, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Check role match (including super_admin alias for system_admin and tenant_admin for org_admin)
  const isAllowed = allowedRoles.includes(activeRole) ||
    (activeRole === 'super_admin' && allowedRoles.includes('system_admin')) ||
    (activeRole === 'system_admin' && allowedRoles.includes('super_admin'));

  if (isAllowed) {
    return true;
  }

  const roleNameMap: Record<UserRole, string> = {
    system_admin: 'System Admin',
    super_admin: 'System Admin',
    tenant_admin: 'Org Admin',
    lms_admin: 'LMS Admin',
    instructor: 'Instructor',
    learner: 'Learner'
  };

  const currentRoleName = roleNameMap[activeRole] || activeRole;
  const targetPath = route.routeConfig?.path || state.url;

  lms.showToast(
    `Access Denied: The "${currentRoleName}" role does not have permission to access "/${targetPath}". Redirecting to Dashboard.`,
    'warning',
    4000,
    'Access Restricted',
    'GUARD'
  );

  return router.createUrlTree(['/dashboard']);
};
