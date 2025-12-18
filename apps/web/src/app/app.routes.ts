import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      // Users Management
      {
        path: 'users',
        loadComponent: () => import('./features/users/list/users-list.component').then(m => m.UsersListComponent),
        data: { permission: 'users:read' }
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/form/user-form.component').then(m => m.UserFormComponent),
        data: { permission: 'users:create' }
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./features/users/form/user-form.component').then(m => m.UserFormComponent),
        data: { permission: 'users:update' }
      },
      // Roles Management
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/list/roles-list.component').then(m => m.RolesListComponent),
        data: { permission: 'roles:read' }
      },
      {
        path: 'roles/new',
        loadComponent: () => import('./features/roles/form/role-form.component').then(m => m.RoleFormComponent),
        data: { permission: 'roles:create' }
      },
      {
        path: 'roles/:id',
        loadComponent: () => import('./features/roles/form/role-form.component').then(m => m.RoleFormComponent),
        data: { permission: 'roles:update' }
      },
      // Permissions Management
      {
        path: 'permissions',
        loadComponent: () => import('./features/permissions/list/permissions-list.component').then(m => m.PermissionsListComponent),
        data: { permission: 'permissions:read' }
      },
      // Stations Management
      {
        path: 'stations',
        loadComponent: () => import('./features/stations/list/stations-list.component').then(m => m.StationsListComponent),
        data: { permission: 'stations:read' }
      },
      {
        path: 'stations/new',
        loadComponent: () => import('./features/stations/form/station-form.component').then(m => m.StationFormComponent),
        data: { permission: 'stations:create' }
      },
      {
        path: 'stations/:id',
        loadComponent: () => import('./features/stations/form/station-form.component').then(m => m.StationFormComponent),
        data: { permission: 'stations:update' }
      },
      // Accounts Management
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/list/accounts-list.component').then(m => m.AccountsListComponent),
        data: { permission: 'accounts:read' }
      },
      {
        path: 'accounts/new',
        loadComponent: () => import('./features/accounts/form/account-form.component').then(m => m.AccountFormComponent),
        data: { permission: 'accounts:create' }
      },
      {
        path: 'accounts/:id',
        loadComponent: () => import('./features/accounts/form/account-form.component').then(m => m.AccountFormComponent),
        data: { permission: 'accounts:update' }
      },
      // Journal Entries Management
      {
        path: 'journal-entries',
        loadComponent: () => import('./features/journal-entries/list/journal-entries-list.component').then(m => m.JournalEntriesListComponent),
        data: { permission: 'journal-entries:read' }
      },
      {
        path: 'journal-entries/new',
        loadComponent: () => import('./features/journal-entries/form/journal-entry-form.component').then(m => m.JournalEntryFormComponent),
        data: { permission: 'journal-entries:create' }
      },
      {
        path: 'journal-entries/:id',
        loadComponent: () => import('./features/journal-entries/form/journal-entry-form.component').then(m => m.JournalEntryFormComponent),
        data: { permission: 'journal-entries:update' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
