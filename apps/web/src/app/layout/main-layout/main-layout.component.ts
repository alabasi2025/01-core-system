import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  permission?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

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
          @for (item of menuItems; track item.label) {
            @if (!item.permission || hasPermission(item.permission)) {
              @if (item.children && item.children.length > 0) {
                <!-- Menu with children -->
                <div class="nav-group">
                  <div class="nav-item nav-parent" 
                       [class.expanded]="item.expanded"
                       (click)="toggleMenu(item)">
                    <div class="nav-item-content">
                      <span class="nav-icon" [innerHTML]="item.icon"></span>
                      @if (!sidebarCollapsed()) {
                        <span class="nav-label">{{ item.label }}</span>
                      }
                    </div>
                    @if (!sidebarCollapsed()) {
                      <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    }
                  </div>
                  @if (item.expanded && !sidebarCollapsed()) {
                    <div class="nav-children">
                      @for (child of item.children; track child.label) {
                        @if (!child.permission || hasPermission(child.permission)) {
                          <a [routerLink]="child.route" 
                             routerLinkActive="active" 
                             class="nav-item nav-child">
                            <span class="nav-icon" [innerHTML]="child.icon"></span>
                            <span class="nav-label">{{ child.label }}</span>
                          </a>
                        }
                      }
                    </div>
                  }
                </div>
              } @else {
                <!-- Simple menu item -->
                <a [routerLink]="item.route" 
                   routerLinkActive="active" 
                   class="nav-item">
                  <span class="nav-icon" [innerHTML]="item.icon"></span>
                  @if (!sidebarCollapsed()) {
                    <span class="nav-label">{{ item.label }}</span>
                  }
                </a>
              }
            }
          }
        </nav>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          @if (!sidebarCollapsed()) {
            <div class="system-info">
              <span class="version">الإصدار 1.0.0</span>
            </div>
          }
        </div>
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
                  <a class="dropdown-item" routerLink="/profile">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    الملف الشخصي
                  </a>
                  <a class="dropdown-item" routerLink="/settings">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    الإعدادات
                  </a>
                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item text-danger" (click)="logout()">
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
      width: 280px;
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
      padding: 16px 12px;
      flex: 1;
      overflow-y: auto;
    }
    
    .nav-group {
      margin-bottom: 4px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      border-radius: 10px;
      margin-bottom: 4px;
      transition: all 0.2s;
      cursor: pointer;
    }
    
    .nav-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }
    
    .nav-icon :deep(svg) {
      width: 20px;
      height: 20px;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .nav-item.active {
      background: #f59e0b;
      color: white;
    }
    
    .nav-parent {
      font-weight: 600;
    }
    
    .nav-parent.expanded {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .arrow-icon {
      transition: transform 0.2s;
    }
    
    .nav-parent.expanded .arrow-icon {
      transform: rotate(180deg);
    }
    
    .nav-children {
      padding-right: 20px;
      margin-top: 4px;
    }
    
    .nav-child {
      font-size: 14px;
      padding: 10px 16px;
    }
    
    .nav-child::before {
      content: '';
      width: 6px;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      margin-left: 8px;
    }
    
    .nav-child.active::before {
      background: white;
    }
    
    .sidebar-collapsed .nav-item {
      justify-content: center;
      padding: 12px;
    }
    
    .sidebar-collapsed .nav-item-content {
      justify-content: center;
    }
    
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .system-info {
      text-align: center;
    }
    
    .version {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .main-content {
      flex: 1;
      margin-right: 280px;
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
      min-width: 200px;
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
    
    .dropdown-item.text-danger {
      color: #dc2626;
    }
    
    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 8px 0;
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

  menuItems: MenuItem[] = [
    {
      label: 'لوحة التحكم',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
      route: '/dashboard'
    },
    {
      label: 'إدارة المستخدمين',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      expanded: false,
      children: [
        {
          label: 'قائمة المستخدمين',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
          route: '/users',
          permission: 'users:read'
        },
        {
          label: 'إضافة مستخدم',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
          route: '/users/new',
          permission: 'users:create'
        }
      ]
    },
    {
      label: 'الأدوار والصلاحيات',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      expanded: false,
      children: [
        {
          label: 'قائمة الأدوار',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
          route: '/roles',
          permission: 'roles:read'
        },
        {
          label: 'إضافة دور',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>',
          route: '/roles/new',
          permission: 'roles:create'
        },
        {
          label: 'الصلاحيات',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
          route: '/permissions',
          permission: 'permissions:read'
        }
      ]
    },
    {
      label: 'الهيكل التنظيمي',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      expanded: false,
      children: [
        {
          label: 'المحطات',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
          route: '/stations',
          permission: 'stations:read'
        },
        {
          label: 'إضافة محطة',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
          route: '/stations/new',
          permission: 'stations:create'
        }
      ]
    },
    {
      label: 'النظام المالي',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      expanded: false,
      children: [
        {
          label: 'شجرة الحسابات',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
          route: '/accounts',
          permission: 'accounts:read'
        },
        {
          label: 'القيود اليومية',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
          route: '/journal-entries',
          permission: 'journal-entries:read'
        },
        {
          label: 'إضافة قيد',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
          route: '/journal-entries/new',
          permission: 'journal-entries:create'
        }
      ]
    },
    {
      label: 'أوامر الدفع',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
      route: '/payment-orders',
      permission: 'payment-orders:read'
    },
    {
      label: 'التقارير',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
      route: '/reports',
      permission: 'reports:read'
    },
    {
      label: 'الفترات المحاسبية',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      route: '/accounting-periods',
      permission: 'accounting-periods:read'
    },
    {
      label: 'استيراد البيانات',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      route: '/import',
      permission: 'import:create'
    },
    {
      label: 'جدولة التقارير',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      route: '/scheduled-reports',
      permission: 'reports:schedule'
    },
    {
      label: 'الإعدادات',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      route: '/settings'
    }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleMenu(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  hasPermission(permission: string): boolean {
    // For now, return true to show all menus
    // In production, check actual permissions
    return true;
    // return this.authService.hasPermission(permission);
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
