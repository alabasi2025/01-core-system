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
      {
        path: 'permissions-matrix',
        loadComponent: () => import('./features/roles/permissions-matrix/permissions-matrix.component').then(m => m.PermissionsMatrixComponent),
        data: { permission: 'roles:assign-permissions' }
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
      // Reports
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        data: { permission: 'reports:read' }
      },
      // Clearing Accounts
      {
        path: 'clearing-accounts',
        loadComponent: () => import('./features/clearing/clearing-accounts.component').then(m => m.ClearingAccountsComponent),
        data: { permission: 'accounts:read' }
      },
      // Reconciliation Center
      {
        path: 'reconciliation',
        loadComponent: () => import('./features/reconciliation/reconciliation-center.component').then(m => m.ReconciliationCenterComponent),
        data: { permission: 'reconciliation:read' }
      },
      // Services Catalog
      {
        path: 'services',
        loadComponent: () => import('./features/services/services-list.component').then(m => m.ServicesListComponent),
        data: { permission: 'services:read' }
      },
      // Accounting Periods
      {
        path: 'accounting-periods',
        loadComponent: () => import('./features/accounting-periods/accounting-periods.component').then(m => m.AccountingPeriodsComponent),
        data: { permission: 'accounting-periods:read' }
      },
      // Import Data
      {
        path: 'import',
        loadComponent: () => import('./features/import/import-wizard.component').then(m => m.ImportWizardComponent),
        data: { permission: 'import:create' }
      },
      // Scheduled Reports
      {
        path: 'scheduled-reports',
        loadComponent: () => import('./features/scheduled-reports/scheduled-reports.component').then(m => m.ScheduledReportsComponent),
        data: { permission: 'reports:schedule' }
      },
      // Payment Orders
      {
        path: 'payment-orders',
        loadComponent: () => import('./features/payment-orders/payment-orders-list.component').then(m => m.PaymentOrdersListComponent),
        data: { permission: 'payment-orders:read' }
      },
      // Cash Box Management
      {
        path: 'cash-boxes',
        loadComponent: () => import('./features/cash-box/cash-boxes.component').then(m => m.CashBoxesComponent),
        data: { permission: 'cash-box:read' }
      },
      {
        path: 'collectors',
        loadComponent: () => import('./features/cash-box/collectors.component').then(m => m.CollectorsComponent),
        data: { permission: 'collectors:read' }
      },
      {
        path: 'collections',
        loadComponent: () => import('./features/cash-box/collections.component').then(m => m.CollectionsComponent),
        data: { permission: 'collections:read' }
      },
      // Profile
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
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
