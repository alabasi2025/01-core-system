import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Permission } from '../../../core/models';

interface PermissionGroup {
  module: string;
  moduleAr: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ isEditMode() ? 'تعديل دور' : 'إنشاء دور جديد' }}</h1>
        <p>{{ isEditMode() ? 'تعديل بيانات الدور وصلاحياته' : 'إنشاء دور جديد وتعيين الصلاحيات' }}</p>
      </div>
      <a routerLink="/roles" class="btn btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        رجوع للقائمة
      </a>
    </div>

    @if (loading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="form-container">
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

        <div class="card">
          <div class="card-header">
            <h2>بيانات الدور</h2>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label for="name">اسم الدور <span class="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="formData.name"
                  name="name"
                  placeholder="مثال: مدير المحطة"
                  required
                  [disabled]="saving()"
                />
              </div>
              <div class="form-group">
                <label for="description">الوصف</label>
                <input
                  type="text"
                  id="description"
                  [(ngModel)]="formData.description"
                  name="description"
                  placeholder="وصف مختصر للدور"
                  [disabled]="saving()"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="header-with-actions">
              <h2>الصلاحيات</h2>
              <div class="quick-actions">
                <button type="button" class="btn-link" (click)="selectAll()">تحديد الكل</button>
                <span class="divider">|</span>
                <button type="button" class="btn-link" (click)="deselectAll()">إلغاء الكل</button>
              </div>
            </div>
            <p class="selected-count">{{ selectedPermissionIds.length }} صلاحية محددة</p>
          </div>
          <div class="card-body">
            @if (permissionsLoading()) {
              <div class="loading-inline">
                <div class="spinner-small"></div>
                <span>جاري تحميل الصلاحيات...</span>
              </div>
            } @else {
              <div class="permissions-container">
                @for (group of permissionGroups(); track group.module) {
                  <div class="permission-group">
                    <div class="group-header">
                      <label class="group-checkbox">
                        <input
                          type="checkbox"
                          [checked]="isGroupSelected(group)"
                          [indeterminate]="isGroupIndeterminate(group)"
                          (change)="toggleGroup(group)"
                          [disabled]="saving()"
                        />
                        <span class="checkmark"></span>
                        <span class="group-name">{{ group.moduleAr }}</span>
                        <span class="group-count">({{ group.permissions.length }})</span>
                      </label>
                    </div>
                    <div class="group-permissions">
                      @for (perm of group.permissions; track perm.id) {
                        <label class="permission-item" [class.selected]="isPermissionSelected(perm.id)">
                          <input
                            type="checkbox"
                            [checked]="isPermissionSelected(perm.id)"
                            (change)="togglePermission(perm.id)"
                            [disabled]="saving()"
                          />
                          <span class="checkmark"></span>
                          <div class="permission-info">
                            <span class="permission-name">{{ perm.nameAr || perm.name }}</span>
                            @if (perm.description) {
                              <span class="permission-desc">{{ perm.description }}</span>
                            }
                          </div>
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/roles" [disabled]="saving()">
            إلغاء
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="saving() || !formData.name">
            @if (saving()) {
              <span class="spinner-small"></span>
              جاري الحفظ...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {{ isEditMode() ? 'حفظ التعديلات' : 'إنشاء الدور' }}
            }
          </button>
        </div>
      </form>
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

    .btn-link {
      background: none;
      border: none;
      color: #f59e0b;
      cursor: pointer;
      font-size: 13px;
      padding: 0;
    }

    .btn-link:hover {
      text-decoration: underline;
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

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .alert {
      padding: 16px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
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

    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h2 {
      margin: 0;
      font-size: 18px;
      color: #1f2937;
    }

    .header-with-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .quick-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .divider {
      color: #d1d5db;
    }

    .selected-count {
      margin: 8px 0 0;
      font-size: 13px;
      color: #6b7280;
    }

    .card-body {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .required {
      color: #dc2626;
    }

    .form-group input[type="text"] {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
      background: #f9fafb;
    }

    .form-group input:focus {
      outline: none;
      border-color: #f59e0b;
      background: white;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
    }

    .form-group input:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }

    .loading-inline {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      color: #6b7280;
    }

    .loading-inline .spinner-small {
      border-color: #e5e7eb;
      border-top-color: #f59e0b;
    }

    .permissions-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .permission-group {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }

    .group-header {
      background: #f9fafb;
      padding: 14px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .group-checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: 600;
      color: #374151;
    }

    .group-checkbox input {
      width: 18px;
      height: 18px;
      accent-color: #f59e0b;
    }

    .group-name {
      font-size: 15px;
    }

    .group-count {
      font-size: 13px;
      color: #9ca3af;
      font-weight: normal;
    }

    .group-permissions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 8px;
      padding: 16px;
    }

    .permission-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .permission-item:hover {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .permission-item.selected {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .permission-item input {
      width: 16px;
      height: 16px;
      margin-top: 2px;
      accent-color: #f59e0b;
    }

    .permission-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .permission-name {
      font-size: 14px;
      color: #374151;
    }

    .permission-desc {
      font-size: 12px;
      color: #9ca3af;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .group-permissions {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  `]
})
export class RoleFormComponent implements OnInit {
  isEditMode = signal(false);
  loading = signal(true);
  saving = signal(false);
  permissionsLoading = signal(true);
  error = signal('');
  success = signal('');

  formData = {
    name: '',
    description: ''
  };

  selectedPermissionIds: string[] = [];
  permissionGroups = signal<PermissionGroup[]>([]);
  private roleId: string | null = null;

  private moduleNames: { [key: string]: string } = {
    'users': 'المستخدمين',
    'roles': 'الأدوار',
    'permissions': 'الصلاحيات',
    'stations': 'المحطات',
    'accounts': 'الحسابات',
    'journal-entries': 'القيود اليومية',
    'business': 'المجموعة',
    'settings': 'الإعدادات',
    'reports': 'التقارير'
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.roleId && this.roleId !== 'new');

    this.loadPermissions();

    if (this.isEditMode()) {
      this.loadRole();
    } else {
      this.loading.set(false);
    }
  }

  isPermissionSelected(permId: string): boolean {
    return this.selectedPermissionIds.includes(permId);
  }

  togglePermission(permId: string): void {
    const index = this.selectedPermissionIds.indexOf(permId);
    if (index > -1) {
      this.selectedPermissionIds.splice(index, 1);
    } else {
      this.selectedPermissionIds.push(permId);
    }
  }

  isGroupSelected(group: PermissionGroup): boolean {
    return group.permissions.every(p => this.selectedPermissionIds.includes(p.id));
  }

  isGroupIndeterminate(group: PermissionGroup): boolean {
    const selectedCount = group.permissions.filter(p => this.selectedPermissionIds.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < group.permissions.length;
  }

  toggleGroup(group: PermissionGroup): void {
    const allSelected = this.isGroupSelected(group);
    if (allSelected) {
      // Deselect all in group
      group.permissions.forEach(p => {
        const index = this.selectedPermissionIds.indexOf(p.id);
        if (index > -1) {
          this.selectedPermissionIds.splice(index, 1);
        }
      });
    } else {
      // Select all in group
      group.permissions.forEach(p => {
        if (!this.selectedPermissionIds.includes(p.id)) {
          this.selectedPermissionIds.push(p.id);
        }
      });
    }
  }

  selectAll(): void {
    this.permissionGroups().forEach(group => {
      group.permissions.forEach(p => {
        if (!this.selectedPermissionIds.includes(p.id)) {
          this.selectedPermissionIds.push(p.id);
        }
      });
    });
  }

  deselectAll(): void {
    this.selectedPermissionIds = [];
  }

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.formData.name) {
      this.error.set('يرجى إدخال اسم الدور');
      return;
    }

    this.saving.set(true);

    const roleData = {
      name: this.formData.name,
      description: this.formData.description || undefined,
      permissionIds: this.selectedPermissionIds
    };

    const request = this.isEditMode()
      ? this.apiService.updateRole(this.roleId!, roleData)
      : this.apiService.createRole(roleData);

    request.subscribe({
      next: () => {
        this.success.set(this.isEditMode() ? 'تم تحديث الدور بنجاح' : 'تم إنشاء الدور بنجاح');
        this.saving.set(false);
        setTimeout(() => {
          this.router.navigate(['/roles']);
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'حدث خطأ أثناء الحفظ');
      }
    });
  }

  private loadRole(): void {
    this.apiService.getRole(this.roleId!).subscribe({
      next: (role) => {
        this.formData.name = role.name;
        this.formData.description = role.description || '';
        this.selectedPermissionIds = role.permissions?.map((p: any) => p.id) || [];
        this.loading.set(false);
      },
      error: () => {
        this.error.set('فشل في تحميل بيانات الدور');
        this.loading.set(false);
      }
    });
  }

  private loadPermissions(): void {
    this.permissionsLoading.set(true);
    this.apiService.getPermissions().subscribe({
      next: (permissions) => {
        // Group permissions by module
        const groups: { [key: string]: Permission[] } = {};
        permissions.forEach(perm => {
          const module = perm.module || perm.name.split(':')[0];
          if (!groups[module]) {
            groups[module] = [];
          }
          groups[module].push(perm);
        });

        // Convert to array
        const groupsArray: PermissionGroup[] = Object.keys(groups).map(module => ({
          module,
          moduleAr: this.moduleNames[module] || module,
          permissions: groups[module]
        }));

        this.permissionGroups.set(groupsArray);
        this.permissionsLoading.set(false);
      },
      error: () => {
        this.permissionsLoading.set(false);
      }
    });
  }
}
