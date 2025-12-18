import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            @if (!sidebarCollapsed()) {
              <span>نظام الكهرباء</span>
            }
          </div>
          <button class="toggle-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            @if (!sidebarCollapsed()) {
              <span>لوحة التحكم</span>
            }
          </a>
          
          @if (hasPermission('users:read')) {
            <a routerLink="/users" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              @if (!sidebarCollapsed()) {
                <span>المستخدمين</span>
              }
            </a>
          }
          
          @if (hasPermission('roles:read')) {
            <a routerLink="/roles" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              @if (!sidebarCollapsed()) {
                <span>الأدوار</span>
              }
            </a>
          }
          
          @if (hasPermission('stations:read')) {
            <a routerLink="/stations" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
              @if (!sidebarCollapsed()) {
                <span>المحطات</span>
              }
            </a>
          }
          
          @if (hasPermission('accounts:read')) {
            <a routerLink="/accounts" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              @if (!sidebarCollapsed()) {
                <span>شجرة الحسابات</span>
              }
            </a>
          }
          
          @if (hasPermission('journal-entries:read')) {
            <a routerLink="/journal-entries" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              @if (!sidebarCollapsed()) {
                <span>القيود اليومية</span>
              }
            </a>
          }
        </nav>
      </aside>
      
      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <header class="header">
          <div class="header-title">
            <h1>{{ pageTitle() }}</h1>
          </div>
          
          <div class="header-actions">
            <div class="user-menu" (click)="userMenuOpen.set(!userMenuOpen())">
              <div class="user-avatar">
                {{ getUserInitials() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.name }}</span>
                <span class="user-role">{{ authService.currentUser()?.roles?.[0]?.name || 'مستخدم' }}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              
              @if (userMenuOpen()) {
                <div class="dropdown-menu">
                  <a class="dropdown-item" (click)="logout()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    تسجيل الخروج
                  </a>
                </div>
              }
            </div>
          </div>
        </header>
        
        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      direction: rtl;
    }
    
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }
    
    .sidebar-collapsed .sidebar {
      width: 70px;
    }
    
    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 16px;
    }
    
    .logo svg {
      color: #f59e0b;
    }
    
    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .sidebar-nav {
      padding: 20px 12px;
      flex: 1;
      overflow-y: auto;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      border-radius: 10px;
      margin-bottom: 4px;
      transition: all 0.2s;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .nav-item.active {
      background: #f59e0b;
      color: white;
    }
    
    .sidebar-collapsed .nav-item {
      justify-content: center;
      padding: 12px;
    }
    
    .main-content {
      flex: 1;
      margin-right: 260px;
      transition: margin 0.3s ease;
      background: #f3f4f6;
      min-height: 100vh;
    }
    
    .sidebar-collapsed .main-content {
      margin-right: 70px;
    }
    
    .header {
      background: white;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    
    .header-title h1 {
      margin: 0;
      font-size: 20px;
      color: #1f2937;
    }
    
    .user-menu {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 10px;
      transition: background 0.2s;
      position: relative;
    }
    
    .user-menu:hover {
      background: #f3f4f6;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
    }
    
    .user-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }
    
    .user-role {
      font-size: 12px;
      color: #6b7280;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      min-width: 180px;
      padding: 8px;
      margin-top: 8px;
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: #374151;
      text-decoration: none;
      border-radius: 8px;
      transition: background 0.2s;
      cursor: pointer;
    }
    
    .dropdown-item:hover {
      background: #f3f4f6;
    }
    
    .page-content {
      padding: 24px;
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  userMenuOpen = signal(false);
  pageTitle = signal('لوحة التحكم');

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
