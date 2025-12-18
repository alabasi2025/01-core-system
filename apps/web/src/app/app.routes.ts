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
      {
        path: 'users',
        loadComponent: () => import('./features/users/list/users-list.component').then(m => m.UsersListComponent),
        data: { permission: 'users:read' }
      },
      {
        path: 'stations',
        loadComponent: () => import('./features/stations/list/stations-list.component').then(m => m.StationsListComponent),
        data: { permission: 'stations:read' }
      },
      {
        path: 'journal-entries',
        loadComponent: () => import('./features/journal-entries/list/journal-entries-list.component').then(m => m.JournalEntriesListComponent),
        data: { permission: 'journal-entries:read' }
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
