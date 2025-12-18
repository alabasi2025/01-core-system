import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Account } from '../../../core/models';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="form-page">
      <div class="page-header">
        <a routerLink="/accounts" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          العودة لشجرة الحسابات
        </a>
        <h1>{{ isEditMode() ? 'تعديل حساب' : 'إضافة حساب جديد' }}</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      } @else {
        <form class="form-container" (ngSubmit)="onSubmit()">
          <div class="form-card">
            <h2>معلومات الحساب</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="code">رمز الحساب <span class="required">*</span></label>
                <input type="text" id="code" [(ngModel)]="formData.code" name="code" 
                       placeholder="مثال: 1101" required>
              </div>
              
              <div class="form-group">
                <label for="type">نوع الحساب <span class="required">*</span></label>
                <select id="type" [(ngModel)]="formData.type" name="type" required>
                  <option value="">اختر النوع</option>
                  <option value="ASSET">أصول</option>
                  <option value="LIABILITY">خصوم</option>
                  <option value="EQUITY">حقوق ملكية</option>
                  <option value="REVENUE">إيرادات</option>
                  <option value="EXPENSE">مصروفات</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="name">اسم الحساب (إنجليزي) <span class="required">*</span></label>
                <input type="text" id="name" [(ngModel)]="formData.name" name="name" 
                       placeholder="Account Name" required>
              </div>
              
              <div class="form-group">
                <label for="nameAr">اسم الحساب (عربي) <span class="required">*</span></label>
                <input type="text" id="nameAr" [(ngModel)]="formData.nameAr" name="nameAr" 
                       placeholder="اسم الحساب" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="parentId">الحساب الأب</label>
                <select id="parentId" [(ngModel)]="formData.parentId" name="parentId">
                  <option value="">بدون (حساب رئيسي)</option>
                  @for (account of parentAccounts(); track account.id) {
                    <option [value]="account.id">{{ account.code }} - {{ account.nameAr || account.name }}</option>
                  }
                </select>
              </div>
              
              <div class="form-group">
                <label for="nature">طبيعة الحساب</label>
                <select id="nature" [(ngModel)]="formData.nature" name="nature">
                  <option value="DEBIT">مدين</option>
                  <option value="CREDIT">دائن</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="description">الوصف</label>
              <textarea id="description" [(ngModel)]="formData.description" name="description" 
                        rows="3" placeholder="وصف الحساب (اختياري)"></textarea>
            </div>

            <div class="form-row checkboxes">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isActive" name="isActive">
                <span class="checkbox-text">حساب نشط</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" routerLink="/accounts">إلغاء</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              @if (saving()) {
                <div class="btn-spinner"></div>
                جاري الحفظ...
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {{ isEditMode() ? 'حفظ التغييرات' : 'إضافة الحساب' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 16px;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #374151;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      color: #1f2937;
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
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-card h2 {
      margin: 0 0 24px 0;
      font-size: 18px;
      color: #1f2937;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-row.checkboxes {
      display: flex;
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .required {
      color: #dc2626;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #10b981;
    }

    .checkbox-text {
      font-size: 14px;
      color: #374151;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AccountFormComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  accountId = signal<string | null>(null);
  parentAccounts = signal<Account[]>([]);

  formData = {
    code: '',
    name: '',
    nameAr: '',
    type: '',
    nature: 'DEBIT',
    parentId: '',
    description: '',
    isActive: true
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadParentAccounts();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.accountId.set(id);
      this.isEditMode.set(true);
      this.loadAccount(id);
    }
  }

  loadParentAccounts(): void {
    this.apiService.getAccounts().subscribe({
      next: (data: any) => {
        const accounts = data.data || data || [];
        this.parentAccounts.set(accounts.filter((a: Account) => a.id !== this.accountId()));
      }
    });
  }

  loadAccount(id: string): void {
    this.loading.set(true);
    this.apiService.getAccount(id).subscribe({
      next: (account: any) => {
        const acc = account.data || account;
        this.formData = {
          code: acc.code || '',
          name: acc.name || '',
          nameAr: acc.nameAr || '',
          type: acc.type || '',
          nature: acc.nature || 'DEBIT',
          parentId: acc.parentId || '',
          description: acc.description || '',
          isActive: acc.isActive !== false
        };
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/accounts']);
      }
    });
  }

  onSubmit(): void {
    if (!this.formData.code || !this.formData.name || !this.formData.nameAr || !this.formData.type) {
      return;
    }

    this.saving.set(true);
    const data: Partial<Account> = {
      code: this.formData.code,
      name: this.formData.name,
      nameAr: this.formData.nameAr,
      type: this.formData.type as Account['type'],
      nature: this.formData.nature as Account['nature'],
      description: this.formData.description,
      isActive: this.formData.isActive,
      parentId: this.formData.parentId || null
    };

    const request = this.isEditMode()
      ? this.apiService.updateAccount(this.accountId()!, data)
      : this.apiService.createAccount(data);

    request.subscribe({
      next: () => {
        this.router.navigate(['/accounts']);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
