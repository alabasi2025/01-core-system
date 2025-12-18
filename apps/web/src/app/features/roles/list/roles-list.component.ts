import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>إدارة الأدوار</h1>
        <p>إنشاء وإدارة أدوار المستخدمين وصلاحياتهم</p>
      </div>
      @if (hasPermission('roles:create')) {
        <a routerLink="/roles/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          دور جديد
        </a>
      }
    </div>

    @if (loading()) {
      <div class="loading">
        <div class="spinner"></div>
      </div>
    } @else {
      <div class="roles-grid">
        @for (role of roles(); track role.id) {
          <div class="role-card" [class.system]="role.isSystem">
            <div class="role-header">
              <div class="role-info">
                <h3>{{ role.name }}</h3>
                @if (role.isSystem) {
                  <span class="badge system">نظامي</span>
                }
              </div>
              <div class="role-actions">
                @if (hasPermission('roles:update') && !role.isSystem) {
                  <a [routerLink]="['/roles', role.id]" class="btn-icon" title="تعديل">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </a>
                }
                @if (hasPermission('roles:delete') && !role.isSystem) {
                  <button class="btn-icon danger" (click)="deleteRole(role)" title="حذف">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
            
            @if (role.description) {
              <p class="role-description">{{ role.description }}</p>
            }
            
            <div class="role-stats">
              <div class="stat">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>{{ role.permissions?.length || 0 }} صلاحية</span>
              </div>
              <div class="stat">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>{{ role._count?.users || 0 }} مستخدم</span>
              </div>
            </div>
            
            @if (role.permissions && role.permissions.length > 0) {
              <div class="permissions-preview">
                <h4>الصلاحيات:</h4>
                <div class="permissions-tags">
                  @for (perm of role.permissions.slice(0, 5); track perm.id) {
                    <span class="permission-tag">{{ perm.nameAr || perm.name }}</span>
                  }
                  @if (role.permissions.length > 5) {
                    <span class="permission-tag more">+{{ role.permissions.length - 5 }} أخرى</span>
                  }
                </div>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h3>لا توجد أدوار</h3>
            <p>ابدأ بإنشاء دور جديد لتنظيم صلاحيات المستخدمين</p>
            @if (hasPermission('roles:create')) {
              <a routerLink="/roles/new" class="btn btn-primary">إنشاء دور جديد</a>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .header-content h1 {
      margin: 0 0 4px;
      font-size: 24px;
      color: #1f2937;
    }
    
    .header-content p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(30, 58, 95, 0.3);
    }
    
    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .role-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
      border: 2px solid transparent;
    }
    
    .role-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .role-card.system {
      border-color: #e0e7ff;
      background: linear-gradient(to bottom right, #f5f3ff, white);
    }
    
    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .role-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .role-info h3 {
      margin: 0;
      font-size: 18px;
      color: #1f2937;
    }
    
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .badge.system {
      background: #e0e7ff;
      color: #4338ca;
    }
    
    .role-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      width: 36px;
      height: 36px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s;
      text-decoration: none;
    }
    
    .btn-icon:hover {
      background: #e5e7eb;
      color: #374151;
    }
    
    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .role-description {
      margin: 0 0 16px;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .role-stats {
      display: flex;
      gap: 20px;
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
    }
    
    .stat svg {
      color: #9ca3af;
    }
    
    .permissions-preview h4 {
      margin: 0 0 10px;
      font-size: 13px;
      color: #6b7280;
      font-weight: 600;
    }
    
    .permissions-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .permission-tag {
      padding: 4px 10px;
      background: #f3f4f6;
      color: #4b5563;
      border-radius: 6px;
      font-size: 12px;
    }
    
    .permission-tag.more {
      background: #fef3c7;
      color: #d97706;
    }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .empty-state svg {
      color: #d1d5db;
      margin-bottom: 16px;
    }
    
    .empty-state h3 {
      margin: 0 0 8px;
      color: #374151;
    }
    
    .empty-state p {
      margin: 0 0 20px;
      color: #6b7280;
    }
  `]
})
export class RolesListComponent implements OnInit {
  roles = signal<Role[]>([]);
  loading = signal(true);

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  deleteRole(role: Role): void {
    if (confirm(`هل أنت متأكد من حذف الدور "${role.name}"؟`)) {
      this.apiService.deleteRole(role.id).subscribe({
        next: () => this.loadRoles(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الحذف')
      });
    }
  }

  private loadRoles(): void {
    this.loading.set(true);
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
