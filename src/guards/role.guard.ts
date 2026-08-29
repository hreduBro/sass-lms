import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LmsDataService } from '../services/lms-data.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const lms = inject(LmsDataService);
  const router = inject(Router);

  const requiredRealmRole = route.data?.['requiredRealmRole'] as string | undefined;
  const allowedRoles = (route.data?.['roles'] || []) as string[];

  // 1. Direct Realm Role Requirement (e.g. SYS_ADMIN for Org Creation, Grid, Edit, Dashboard)
  if (requiredRealmRole) {
    if (!lms.hasKeycloakRole(requiredRealmRole)) {
      const targetPath = route.routeConfig?.path || state.url;
      lms.showToast(
        `Access Denied: The "${requiredRealmRole}" realm role is required to access "/${targetPath}". Redirecting to Dashboard.`,
        'warning',
        4000,
        'Access Restricted',
        'GUARD'
      );
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  }

  // 2. Standard role list check
  if (allowedRoles.length > 0) {
    const isAllowed = lms.hasAccessToRole(allowedRoles);
    if (!isAllowed) {
      const targetPath = route.routeConfig?.path || state.url;
      lms.showToast(
        `Access Denied: Your account role does not have permission to access "/${targetPath}". Redirecting to Dashboard.`,
        'warning',
        4000,
        'Access Restricted',
        'GUARD'
      );
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};
