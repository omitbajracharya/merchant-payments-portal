import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'applications/new',
    loadComponent: () =>
      import('./features/application-wizard/application-wizard.component').then(
        (m) => m.ApplicationWizardComponent
      ),
    canActivate: [authGuard, roleGuard(['SALES', 'ADMIN'])],
  },
  {
    path: 'applications/:id/edit',
    loadComponent: () =>
      import('./features/application-wizard/application-wizard.component').then(
        (m) => m.ApplicationWizardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'applications/:id',
    loadComponent: () =>
      import('./features/application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'security-docs',
    loadComponent: () =>
      import('./features/security-docs/security-docs.component').then(
        (m) => m.SecurityDocsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./features/security-docs/security-docs.component').then(
        (m) => m.SecurityDocsComponent
      ),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
