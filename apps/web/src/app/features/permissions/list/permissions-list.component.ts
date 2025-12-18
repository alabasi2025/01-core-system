import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Permission } from '../../../core/models';

interface GroupedPermissions {
  module: string;
  moduleAr: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-permissions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="permissions-page">
      <div class="page-header">
        <div class="header-content">
          <h1>إدارة الصلاحيات</h1>
          <p>عرض جميع صلاحيات النظام مصنفة حسب الوحدات</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="initializePermissions()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            تهيئة الصلاحيات الافتراضية
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>جاري تحميل الصلاحيات...</p>
        </div>
      } @else {
        <div class="permissions-grid">
          @for (group of groupedPermissions(); track group.module) {
            <div class="permission-card">
              <div class="card-header">
                <div class="module-icon" [style.background]="getModuleColor(group.module)">
                  <span [innerHTML]="getModuleIcon(group.module)"></span>
                </div>
                <div class="module-info">
                  <h3>{{ group.moduleAr }}</h3>
                  <span class="permission-count">{{ group.permissions.length }} صلاحية</span>
                </div>
              </div>
              <div class="card-body">
                <div class="permissions-list">
                  @for (permission of group.permissions; track permission.id) {
                    <div class="permission-item">
                      <div class="permission-icon" [class]="getActionClass(permission.action)">
                        <span [innerHTML]="getActionIcon(permission.action)"></span>
                      </div>
                      <div class="permission-details">
                        <span class="permission-name">{{ permission.nameAr || permission.name }}</span>
                        <span class="permission-code">{{ permission.name }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        @if (groupedPermissions().length === 0) {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h3>لا توجد صلاحيات</h3>
            <p>اضغط على زر "تهيئة الصلاحيات الافتراضية" لإنشاء صلاحيات النظام</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .permissions-page {
      padding: 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #1f2937;
    }

    .header-content p {
      margin: 0;
      color: #6b7280;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .permission-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.2s;
    }

    .permission-card:hover {
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .module-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .module-icon :deep(svg) {
      width: 24px;
      height: 24px;
    }

    .module-info h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      color: #1f2937;
    }

    .permission-count {
      font-size: 13px;
      color: #6b7280;
    }

    .card-body {
      padding: 16px 20px;
    }

    .permissions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .permission-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 10px;
      transition: background 0.2s;
    }

    .permission-item:hover {
      background: #f3f4f6;
    }

    .permission-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .permission-icon :deep(svg) {
      width: 16px;
      height: 16px;
    }

    .permission-icon.read {
      background: #dbeafe;
      color: #2563eb;
    }

    .permission-icon.create {
      background: #dcfce7;
      color: #16a34a;
    }

    .permission-icon.update {
      background: #fef3c7;
      color: #d97706;
    }

    .permission-icon.delete {
      background: #fee2e2;
      color: #dc2626;
    }

    .permission-icon.manage {
      background: #f3e8ff;
      color: #9333ea;
    }

    .permission-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .permission-name {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .permission-code {
      font-size: 12px;
      color: #9ca3af;
      font-family: monospace;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
      color: #6b7280;
    }

    .empty-state svg {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      max-width: 300px;
    }
  `]
})
export class PermissionsListComponent implements OnInit {
  loading = signal(true);
  permissions = signal<Permission[]>([]);
  groupedPermissions = signal<GroupedPermissions[]>([]);

  moduleNames: Record<string, string> = {
    'users': 'المستخدمين',
    'roles': 'الأدوار',
    'permissions': 'الصلاحيات',
    'stations': 'المحطات',
    'accounts': 'الحسابات',
    'journal-entries': 'القيود اليومية',
    'reports': 'التقارير',
    'settings': 'الإعدادات',
    'business': 'المجموعات'
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading.set(true);
    this.apiService.getPermissions().subscribe({
      next: (data: any) => {
        const perms = data.data || data || [];
        this.permissions.set(perms);
        this.groupPermissions(perms);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  groupPermissions(permissions: Permission[]): void {
    const groups: Record<string, Permission[]> = {};
    
    permissions.forEach(perm => {
      if (!groups[perm.module]) {
        groups[perm.module] = [];
      }
      groups[perm.module].push(perm);
    });

    const grouped = Object.entries(groups).map(([module, perms]) => ({
      module,
      moduleAr: this.moduleNames[module] || module,
      permissions: perms.sort((a, b) => this.getActionOrder(a.action) - this.getActionOrder(b.action))
    }));

    this.groupedPermissions.set(grouped);
  }

  getActionOrder(action: string): number {
    const order: Record<string, number> = {
      'read': 1,
      'create': 2,
      'update': 3,
      'delete': 4,
      'manage': 5
    };
    return order[action] || 99;
  }

  initializePermissions(): void {
    this.loading.set(true);
    this.apiService.initializePermissions().subscribe({
      next: () => {
        this.loadPermissions();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getModuleColor(module: string): string {
    const colors: Record<string, string> = {
      'users': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'roles': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'permissions': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'stations': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'accounts': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'journal-entries': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      'reports': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      'settings': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      'business': 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
    };
    return colors[module] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }

  getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      'users': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      'roles': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      'permissions': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
      'stations': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
      'accounts': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'journal-entries': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      'reports': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      'settings': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/></svg>',
      'business': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
    };
    return icons[module] || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  getActionClass(action: string): string {
    return action || 'read';
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'read': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      'create': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      'update': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      'delete': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
      'manage': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    };
    return icons[action] || icons['read'];
  }
}
