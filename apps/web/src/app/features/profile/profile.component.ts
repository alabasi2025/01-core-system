import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>الملف الشخصي</h1>
        <p>عرض وتعديل بياناتك الشخصية</p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    } @else {
      <div class="profile-container">
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

        <div class="profile-grid">
          <!-- User Info Card -->
          <div class="card user-info-card">
            <div class="card-header">
              <h2>المعلومات الأساسية</h2>
            </div>
            <div class="card-body">
              <div class="avatar-section">
                <div class="avatar">
                  {{ getInitials() }}
                </div>
                <div class="user-meta">
                  <h3>{{ user()?.name }}</h3>
                  <p>{{ user()?.email }}</p>
                </div>
              </div>

              <div class="info-list">
                <div class="info-item">
                  <span class="label">رقم الهاتف</span>
                  <span class="value">{{ user()?.phone || 'غير محدد' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">المسمى الوظيفي</span>
                  <span class="value">{{ user()?.jobTitle || 'غير محدد' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">نطاق العمل</span>
                  <span class="value">{{ user()?.scope === 'business' ? 'المجموعة' : 'محطة محددة' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">الحالة</span>
                  <span class="value status" [class.active]="user()?.isActive">
                    {{ user()?.isActive ? 'نشط' : 'غير نشط' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Roles Card -->
          <div class="card roles-card">
            <div class="card-header">
              <h2>الأدوار والصلاحيات</h2>
            </div>
            <div class="card-body">
              <div class="roles-list">
                @for (role of user()?.roles || []; track role.id) {
                  <div class="role-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    {{ role.name }}
                  </div>
                }
              </div>
              
              <div class="permissions-summary">
                <h4>ملخص الصلاحيات</h4>
                <p class="permissions-count">{{ user()?.permissions?.length || 0 }} صلاحية</p>
              </div>
            </div>
          </div>

          <!-- Edit Profile Card -->
          <div class="card edit-card">
            <div class="card-header">
              <h2>تعديل البيانات</h2>
            </div>
            <div class="card-body">
              <form (ngSubmit)="updateProfile()">
                <div class="form-group">
                  <label for="name">الاسم الكامل</label>
                  <input
                    type="text"
                    id="name"
                    [(ngModel)]="formData.name"
                    name="name"
                    [disabled]="saving()"
                  />
                </div>

                <div class="form-group">
                  <label for="phone">رقم الهاتف</label>
                  <input
                    type="tel"
                    id="phone"
                    [(ngModel)]="formData.phone"
                    name="phone"
                    placeholder="+967..."
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

                <button type="submit" class="btn btn-primary" [disabled]="saving()">
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
              </form>
            </div>
          </div>

          <!-- Change Password Card -->
          <div class="card password-card">
            <div class="card-header">
              <h2>تغيير كلمة المرور</h2>
            </div>
            <div class="card-body">
              <form (ngSubmit)="changePassword()">
                <div class="form-group">
                  <label for="currentPassword">كلمة المرور الحالية</label>
                  <input
                    type="password"
                    id="currentPassword"
                    [(ngModel)]="passwordData.currentPassword"
                    name="currentPassword"
                    [disabled]="changingPassword()"
                  />
                </div>

                <div class="form-group">
                  <label for="newPassword">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    id="newPassword"
                    [(ngModel)]="passwordData.newPassword"
                    name="newPassword"
                    [disabled]="changingPassword()"
                  />
                  <small class="hint">يجب أن تحتوي على 8 أحرف على الأقل</small>
                </div>

                <div class="form-group">
                  <label for="confirmPassword">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    [(ngModel)]="passwordData.confirmPassword"
                    name="confirmPassword"
                    [disabled]="changingPassword()"
                  />
                </div>

                <button type="submit" class="btn btn-warning" [disabled]="changingPassword() || !isPasswordValid()">
                  @if (changingPassword()) {
                    <span class="spinner-small"></span>
                    جاري التغيير...
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    تغيير كلمة المرور
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header {
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

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
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

    .user-info-card {
      grid-column: 1;
      grid-row: 1;
    }

    .roles-card {
      grid-column: 2;
      grid-row: 1;
    }

    .edit-card {
      grid-column: 1;
      grid-row: 2;
    }

    .password-card {
      grid-column: 2;
      grid-row: 2;
    }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 600;
    }

    .user-meta h3 {
      margin: 0 0 4px;
      font-size: 20px;
      color: #1f2937;
    }

    .user-meta p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item .label {
      color: #6b7280;
      font-size: 14px;
    }

    .info-item .value {
      color: #1f2937;
      font-weight: 500;
    }

    .info-item .status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      background: #fef2f2;
      color: #dc2626;
    }

    .info-item .status.active {
      background: #f0fdf4;
      color: #16a34a;
    }

    .roles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .permissions-summary {
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .permissions-summary h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #6b7280;
    }

    .permissions-count {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #f59e0b;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
    }

    .form-group input:disabled {
      background: #f9fafb;
      cursor: not-allowed;
    }

    .hint {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #9ca3af;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
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

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 1024px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }

      .user-info-card,
      .roles-card,
      .edit-card,
      .password-card {
        grid-column: 1;
        grid-row: auto;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  changingPassword = signal(false);
  error = signal('');
  success = signal('');

  user = signal<any>(null);

  formData = {
    name: '',
    phone: '',
    jobTitle: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  getInitials(): string {
    const name = this.user()?.name || '';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
  }

  isPasswordValid(): boolean {
    return this.passwordData.currentPassword.length > 0 &&
           this.passwordData.newPassword.length >= 8 &&
           this.passwordData.newPassword === this.passwordData.confirmPassword;
  }

  updateProfile(): void {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const userId = this.user()?.id;
    if (!userId) return;

    this.apiService.updateUser(userId, {
      name: this.formData.name,
      phone: this.formData.phone || undefined,
      jobTitle: this.formData.jobTitle || undefined
    }).subscribe({
      next: (updatedUser) => {
        this.saving.set(false);
        this.success.set('تم تحديث البيانات بنجاح');
        this.user.set({ ...this.user(), ...updatedUser });
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'حدث خطأ أثناء التحديث');
      }
    });
  }

  changePassword(): void {
    if (!this.isPasswordValid()) return;

    this.changingPassword.set(true);
    this.error.set('');
    this.success.set('');

    this.authService.changePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.success.set('تم تغيير كلمة المرور بنجاح');
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.error.set(err.error?.message || 'كلمة المرور الحالية غير صحيحة');
      }
    });
  }

  private loadProfile(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.user.set(currentUser);
      this.formData = {
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        jobTitle: currentUser.jobTitle || ''
      };
      this.loading.set(false);
    } else {
      this.loading.set(false);
      this.error.set('لم يتم العثور على بيانات المستخدم');
    }
  }
}
