import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Role, PermissionGroup, Permission } from '../../../core/models';

@Component({
  selector: 'app-permissions-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>مصفوفة الصلاحيات</h1>
        <p>عرض وإدارة صلاحيات جميع الأدوار في مكان واحد</p>
      </div>
      <a routerLink="/roles" class="btn btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        رجوع للأدوار
      </a>
    </div>

    @if (loading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    } @else {
      @if (error()) {
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ error() }}
        </div>
      }

      @if (success()) {
        <div class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {{ success() }}
        </div>
      }

      <div class="matrix-container">
        <div class="matrix-wrapper">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="module-header">الوحدة</th>
                <th class="permission-header">الصلاحية</th>
                @for (role of roles(); track role.id) {
                  <th class="role-header" [class.system-role]="role.isSystem">
                    <div class="role-name">{{ role.name }}</div>
                    @if (role.isSystem) {
                      <span class="system-badge">نظام</span>
                    }
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (group of permissionGroups(); track group.module) {
                @for (perm of group.permissions; track perm.id; let first = $first) {
                  <tr [class.group-first]="first">
                    @if (first) {
                      <td class="module-cell" [attr.rowspan]="group.permissions.length">
                        <div class="module-info">
                          <span class="module-name">{{ group.moduleName }}</span>
                          <span class="module-count">{{ group.permissions.length }} صلاحية</span>
                        </div>
                      </td>
                    }
                    <td class="permission-cell">
                      <div class="permission-info">
                        <span class="permission-name">{{ perm.name }}</span>
                        @if (perm.description) {
                          <span class="permission-desc">{{ perm.description }}</span>
                        }
                      </div>
                    </td>
                    @for (role of roles(); track role.id) {
                      <td class="checkbox-cell" [class.system-role]="role.isSystem">
                        <label class="checkbox-wrapper">
                          <input
                            type="checkbox"
                            [checked]="hasPermission(role.id, perm.id)"
                            (change)="togglePermission(role.id, perm.id)"
                            [disabled]="saving() || role.isSystem"
                          />
                          <span class="checkmark" [class.checked]="hasPermission(role.id, perm.id)">
                            @if (hasPermission(role.id, perm.id)) {
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            }
                          </span>
                        </label>
                      </td>
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (hasChanges()) {
        <div class="floating-actions">
          <button type="button" class="btn btn-secondary" (click)="resetChanges()" [disabled]="saving()">
            إلغاء التغييرات
          </button>
          <button type="button" class="btn btn-primary" (click)="saveChanges()" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner-small"></span>
              جاري الحفظ...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              حفظ التغييرات
            }
          </button>
        </div>
      }
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

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(30, 58, 95, 0.3);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert {
      padding: 16px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    .matrix-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .matrix-wrapper {
      overflow-x: auto;
      max-height: calc(100vh - 250px);
      overflow-y: auto;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .matrix-table th,
    .matrix-table td {
      padding: 12px 16px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }

    .matrix-table thead th {
      background: #f9fafb;
      position: sticky;
      top: 0;
      z-index: 10;
      font-weight: 600;
      color: #374151;
    }

    .module-header,
    .permission-header {
      text-align: right !important;
      min-width: 150px;
    }

    .role-header {
      min-width: 100px;
      max-width: 150px;
    }

    .role-header.system-role {
      background: #fef3c7 !important;
    }

    .role-name {
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .system-badge {
      display: inline-block;
      font-size: 10px;
      padding: 2px 6px;
      background: #f59e0b;
      color: white;
      border-radius: 4px;
      margin-top: 4px;
    }

    .module-cell {
      background: #f9fafb;
      text-align: right !important;
      vertical-align: top;
      border-left: 3px solid #f59e0b;
    }

    .module-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .module-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }

    .module-count {
      font-size: 12px;
      color: #6b7280;
    }

    .permission-cell {
      text-align: right !important;
      background: white;
    }

    .permission-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .permission-name {
      font-size: 13px;
      color: #374151;
    }

    .permission-desc {
      font-size: 11px;
      color: #9ca3af;
    }

    .checkbox-cell {
      background: white;
    }

    .checkbox-cell.system-role {
      background: #fffbeb;
    }

    .checkbox-wrapper {
      display: flex;
      justify-content: center;
      cursor: pointer;
    }

    .checkbox-wrapper input {
      display: none;
    }

    .checkmark {
      width: 24px;
      height: 24px;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      background: white;
    }

    .checkmark.checked {
      background: #10b981;
      border-color: #10b981;
      color: white;
    }

    .checkbox-wrapper:hover .checkmark:not(.checked) {
      border-color: #9ca3af;
    }

    .checkbox-wrapper input:disabled + .checkmark {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .group-first td {
      border-top: 2px solid #e5e7eb;
    }

    .floating-actions {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      z-index: 100;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .floating-actions {
        left: 16px;
        right: 16px;
        transform: none;
        flex-direction: column;
      }
    }
  `]
})
export class PermissionsMatrixComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  roles = signal<Role[]>([]);
  permissionGroups = signal<PermissionGroup[]>([]);
  
  // Track role permissions: roleId -> Set of permissionIds
  private rolePermissions = new Map<string, Set<string>>();
  private originalRolePermissions = new Map<string, Set<string>>();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  hasPermission(roleId: string, permissionId: string): boolean {
    return this.rolePermissions.get(roleId)?.has(permissionId) || false;
  }

  togglePermission(roleId: string, permissionId: string): void {
    const perms = this.rolePermissions.get(roleId);
    if (perms) {
      if (perms.has(permissionId)) {
        perms.delete(permissionId);
      } else {
        perms.add(permissionId);
      }
    }
  }

  hasChanges(): boolean {
    for (const [roleId, perms] of this.rolePermissions) {
      const original = this.originalRolePermissions.get(roleId);
      if (!original) continue;
      
      if (perms.size !== original.size) return true;
      for (const permId of perms) {
        if (!original.has(permId)) return true;
      }
    }
    return false;
  }

  resetChanges(): void {
    this.rolePermissions.clear();
    for (const [roleId, perms] of this.originalRolePermissions) {
      this.rolePermissions.set(roleId, new Set(perms));
    }
  }

  saveChanges(): void {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const changedRoles: { roleId: string; permissionIds: string[] }[] = [];

    for (const [roleId, perms] of this.rolePermissions) {
      const original = this.originalRolePermissions.get(roleId);
      if (!original) continue;

      const role = this.roles().find(r => r.id === roleId);
      if (role?.isSystem) continue;

      let hasChange = perms.size !== original.size;
      if (!hasChange) {
        for (const permId of perms) {
          if (!original.has(permId)) {
            hasChange = true;
            break;
          }
        }
      }

      if (hasChange) {
        changedRoles.push({
          roleId,
          permissionIds: Array.from(perms)
        });
      }
    }

    if (changedRoles.length === 0) {
      this.saving.set(false);
      return;
    }

    // Save changes sequentially
    let completed = 0;
    const saveNext = () => {
      if (completed >= changedRoles.length) {
        this.saving.set(false);
        this.success.set('تم حفظ التغييرات بنجاح');
        // Update original state
        this.originalRolePermissions.clear();
        for (const [roleId, perms] of this.rolePermissions) {
          this.originalRolePermissions.set(roleId, new Set(perms));
        }
        setTimeout(() => this.success.set(''), 3000);
        return;
      }

      const change = changedRoles[completed];
      this.apiService.assignRolePermissions(change.roleId, change.permissionIds).subscribe({
        next: () => {
          completed++;
          saveNext();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'حدث خطأ أثناء الحفظ');
        }
      });
    };

    saveNext();
  }

  private loadData(): void {
    this.loading.set(true);

    // Load roles first
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        
        // Initialize permission maps
        roles.forEach(role => {
          const permIds = new Set(role.permissions?.map(p => p.id) || []);
          this.rolePermissions.set(role.id, permIds);
          this.originalRolePermissions.set(role.id, new Set(permIds));
        });

        // Load permissions grouped
        this.apiService.getPermissionsGrouped().subscribe({
          next: (groups) => {
            this.permissionGroups.set(groups);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('فشل في تحميل الصلاحيات');
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.error.set('فشل في تحميل الأدوار');
        this.loading.set(false);
      }
    });
  }
}
