import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { User, Role } from '../../../core/models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ isEditMode() ? 'تعديل مستخدم' : 'إضافة مستخدم جديد' }}</h1>
        <p>{{ isEditMode() ? 'تعديل بيانات المستخدم' : 'إنشاء حساب مستخدم جديد في النظام' }}</p>
      </div>
      <a routerLink="/users" class="btn btn-secondary">
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
            <h2>البيانات الأساسية</h2>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label for="name">الاسم الكامل <span class="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="formData.name"
                  name="name"
                  placeholder="أدخل الاسم الكامل"
                  required
                  [disabled]="saving()"
                />
              </div>
              <div class="form-group">
                <label for="email">البريد الإلكتروني <span class="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  placeholder="example@domain.com"
                  required
                  [disabled]="saving()"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="phone">رقم الهاتف</label>
                <input
                  type="tel"
                  id="phone"
                  [(ngModel)]="formData.phone"
                  name="phone"
                  placeholder="05xxxxxxxx"
                  [disabled]="saving()"
                />
              </div>
              <div class="form-group">
                <label for="jobTitle">المسمى الوظيفي</label>
                <input
                  type="text"
                  id="jobTitle"
                  [(ngModel)]="formData.jobTitle"
                  name="jobTitle"
                  placeholder="مثال: محاسب"
                  [disabled]="saving()"
                />
              </div>
            </div>

            @if (!isEditMode()) {
              <div class="form-row">
                <div class="form-group">
                  <label for="password">كلمة المرور <span class="required">*</span></label>
                  <div class="password-input">
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      id="password"
                      [(ngModel)]="formData.password"
                      name="password"
                      placeholder="أدخل كلمة المرور"
                      required
                      [disabled]="saving()"
                    />
                    <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
                      @if (showPassword()) {
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      }
                    </button>
                  </div>
                  <small class="hint">يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز</small>
                </div>
                <div class="form-group">
                  <label for="confirmPassword">تأكيد كلمة المرور <span class="required">*</span></label>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="confirmPassword"
                    [(ngModel)]="formData.confirmPassword"
                    name="confirmPassword"
                    placeholder="أعد إدخال كلمة المرور"
                    required
                    [disabled]="saving()"
                  />
                </div>
              </div>
            }

            <div class="form-row single">
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    [(ngModel)]="formData.isActive"
                    name="isActive"
                    [disabled]="saving()"
                  />
                  <span class="checkmark"></span>
                  المستخدم نشط
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>الأدوار والصلاحيات</h2>
          </div>
          <div class="card-body">
            @if (rolesLoading()) {
              <div class="loading-inline">
                <div class="spinner-small"></div>
                <span>جاري تحميل الأدوار...</span>
              </div>
            } @else if (availableRoles().length === 0) {
              <div class="empty-roles">
                <p>لا توجد أدوار متاحة. يرجى إنشاء أدوار أولاً.</p>
                <a routerLink="/roles/new" class="btn btn-secondary">إنشاء دور جديد</a>
              </div>
            } @else {
              <div class="roles-grid">
                @for (role of availableRoles(); track role.id) {
                  <label class="role-card" [class.selected]="isRoleSelected(role.id)">
                    <input
                      type="checkbox"
                      [checked]="isRoleSelected(role.id)"
                      (change)="toggleRole(role.id)"
                      [disabled]="saving() || role.isSystem"
                    />
                    <div class="role-content">
                      <div class="role-header">
                        <span class="role-name">{{ role.name }}</span>
                        @if (role.isSystem) {
                          <span class="badge system">نظامي</span>
                        }
                      </div>
                      @if (role.description) {
                        <p class="role-description">{{ role.description }}</p>
                      }
                      <div class="role-permissions">
                        <span class="permissions-count">{{ role.permissions?.length || 0 }} صلاحية</span>
                      </div>
                    </div>
                  </label>
                }
              </div>
            }
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/users" [disabled]="saving()">
            إلغاء
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="saving() || !isFormValid()">
            @if (saving()) {
              <span class="spinner-small"></span>
              جاري الحفظ...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {{ isEditMode() ? 'حفظ التعديلات' : 'إنشاء المستخدم' }}
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

    .card-body {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-row.single {
      grid-template-columns: 1fr;
    }

    .form-row:last-child {
      margin-bottom: 0;
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

    .form-group input[type="text"],
    .form-group input[type="email"],
    .form-group input[type="tel"],
    .form-group input[type="password"] {
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

    .password-input {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input input {
      width: 100%;
      padding-left: 44px;
    }

    .toggle-password {
      position: absolute;
      left: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      display: flex;
    }

    .toggle-password:hover {
      color: #6b7280;
    }

    .hint {
      margin-top: 6px;
      font-size: 12px;
      color: #9ca3af;
    }

    .checkbox-group {
      flex-direction: row;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #f59e0b;
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

    .empty-roles {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .empty-roles p {
      margin: 0 0 16px;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .role-card {
      display: block;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .role-card:hover {
      border-color: #f59e0b;
    }

    .role-card.selected {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .role-card input {
      display: none;
    }

    .role-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .role-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .role-name {
      font-weight: 600;
      color: #1f2937;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge.system {
      background: #e0e7ff;
      color: #4338ca;
    }

    .role-description {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    .role-permissions {
      margin-top: 4px;
    }

    .permissions-count {
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

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  `]
})
export class UserFormComponent implements OnInit {
  isEditMode = signal(false);
  loading = signal(true);
  saving = signal(false);
  rolesLoading = signal(true);
  error = signal('');
  success = signal('');
  showPassword = signal(false);

  formData = {
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    password: '',
    confirmPassword: '',
    isActive: true
  };

  selectedRoleIds: string[] = [];
  availableRoles = signal<Role[]>([]);
  private userId: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.userId && this.userId !== 'new');

    this.loadRoles();

    if (this.isEditMode()) {
      this.loadUser();
    } else {
      this.loading.set(false);
    }
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoleIds.includes(roleId);
  }

  toggleRole(roleId: string): void {
    const index = this.selectedRoleIds.indexOf(roleId);
    if (index > -1) {
      this.selectedRoleIds.splice(index, 1);
    } else {
      this.selectedRoleIds.push(roleId);
    }
  }

  isFormValid(): boolean {
    if (!this.formData.name || !this.formData.email) {
      return false;
    }

    if (!this.isEditMode()) {
      if (!this.formData.password || !this.formData.confirmPassword) {
        return false;
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        return false;
      }
    }

    return true;
  }

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.isFormValid()) {
      this.error.set('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    if (!this.isEditMode() && this.formData.password !== this.formData.confirmPassword) {
      this.error.set('كلمة المرور وتأكيدها غير متطابقتين');
      return;
    }

    this.saving.set(true);

    const userData: any = {
      name: this.formData.name,
      email: this.formData.email,
      phone: this.formData.phone || undefined,
      jobTitle: this.formData.jobTitle || undefined,
      isActive: this.formData.isActive,
      roleIds: this.selectedRoleIds
    };

    if (!this.isEditMode()) {
      userData.password = this.formData.password;
    }

    const request = this.isEditMode()
      ? this.apiService.updateUser(this.userId!, userData)
      : this.apiService.createUser(userData);

    request.subscribe({
      next: () => {
        this.success.set(this.isEditMode() ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح');
        this.saving.set(false);
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'حدث خطأ أثناء الحفظ');
      }
    });
  }

  private loadUser(): void {
    this.apiService.getUser(this.userId!).subscribe({
      next: (user) => {
        this.formData.name = user.name;
        this.formData.email = user.email;
        this.formData.phone = user.phone || '';
        this.formData.jobTitle = user.jobTitle || '';
        this.formData.isActive = user.isActive;
        this.selectedRoleIds = user.roles?.map((r: any) => r.id) || [];
        this.loading.set(false);
      },
      error: () => {
        this.error.set('فشل في تحميل بيانات المستخدم');
        this.loading.set(false);
      }
    });
  }

  private loadRoles(): void {
    this.rolesLoading.set(true);
    this.apiService.getRoles().subscribe({
      next: (response) => {
        this.availableRoles.set(Array.isArray(response) ? response : (response as any).data || []);
        this.rolesLoading.set(false);
      },
      error: () => {
        this.rolesLoading.set(false);
      }
    });
  }
}
