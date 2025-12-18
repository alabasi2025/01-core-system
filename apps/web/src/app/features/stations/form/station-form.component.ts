import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-station-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ isEditMode() ? 'تعديل محطة' : 'إضافة محطة جديدة' }}</h1>
        <p>{{ isEditMode() ? 'تعديل بيانات المحطة' : 'إنشاء محطة جديدة في النظام' }}</p>
      </div>
      <a routerLink="/stations" class="btn btn-secondary">
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
                <label for="name">اسم المحطة <span class="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="formData.name"
                  name="name"
                  placeholder="أدخل اسم المحطة"
                  required
                  [disabled]="saving()"
                />
              </div>
              <div class="form-group">
                <label for="code">رمز المحطة <span class="required">*</span></label>
                <input
                  type="text"
                  id="code"
                  [(ngModel)]="formData.code"
                  name="code"
                  placeholder="مثال: ST001"
                  required
                  [disabled]="saving()"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="type">نوع المحطة <span class="required">*</span></label>
                <select
                  id="type"
                  [(ngModel)]="formData.type"
                  name="type"
                  required
                  [disabled]="saving()"
                >
                  <option value="">اختر نوع المحطة</option>
                  <option value="MAIN">محطة رئيسية</option>
                  <option value="SUB">محطة فرعية</option>
                  <option value="DISTRIBUTION">محطة توزيع</option>
                </select>
              </div>
              <div class="form-group">
                <label for="capacity">السعة (كيلوواط)</label>
                <input
                  type="number"
                  id="capacity"
                  [(ngModel)]="formData.capacity"
                  name="capacity"
                  placeholder="0"
                  min="0"
                  [disabled]="saving()"
                />
              </div>
            </div>

            <div class="form-row single">
              <div class="form-group">
                <label for="address">العنوان</label>
                <input
                  type="text"
                  id="address"
                  [(ngModel)]="formData.address"
                  name="address"
                  placeholder="أدخل عنوان المحطة"
                  [disabled]="saving()"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="latitude">خط العرض</label>
                <input
                  type="number"
                  id="latitude"
                  [(ngModel)]="formData.latitude"
                  name="latitude"
                  placeholder="0.000000"
                  step="0.000001"
                  [disabled]="saving()"
                />
              </div>
              <div class="form-group">
                <label for="longitude">خط الطول</label>
                <input
                  type="number"
                  id="longitude"
                  [(ngModel)]="formData.longitude"
                  name="longitude"
                  placeholder="0.000000"
                  step="0.000001"
                  [disabled]="saving()"
                />
              </div>
            </div>

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
                  المحطة نشطة
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/stations" [disabled]="saving()">
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
              {{ isEditMode() ? 'حفظ التعديلات' : 'إنشاء المحطة' }}
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

    .form-group input,
    .form-group select {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
      background: #f9fafb;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #f59e0b;
      background: white;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
    }

    .form-group input:disabled,
    .form-group select:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
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
export class StationFormComponent implements OnInit {
  isEditMode = signal(false);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  formData = {
    name: '',
    code: '',
    type: '',
    capacity: null as number | null,
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    isActive: true
  };

  private stationId: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.stationId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.stationId && this.stationId !== 'new');

    if (this.isEditMode()) {
      this.loadStation();
    } else {
      this.loading.set(false);
    }
  }

  isFormValid(): boolean {
    return !!this.formData.name && !!this.formData.code && !!this.formData.type;
  }

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.isFormValid()) {
      this.error.set('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.saving.set(true);

    const stationData: any = {
      name: this.formData.name,
      code: this.formData.code,
      type: this.formData.type,
      isActive: this.formData.isActive
    };

    if (this.formData.capacity) stationData.capacity = this.formData.capacity;
    if (this.formData.address) stationData.address = this.formData.address;
    if (this.formData.latitude) stationData.latitude = this.formData.latitude;
    if (this.formData.longitude) stationData.longitude = this.formData.longitude;

    const request = this.isEditMode()
      ? this.apiService.updateStation(this.stationId!, stationData)
      : this.apiService.createStation(stationData);

    request.subscribe({
      next: () => {
        this.success.set(this.isEditMode() ? 'تم تحديث المحطة بنجاح' : 'تم إنشاء المحطة بنجاح');
        this.saving.set(false);
        setTimeout(() => {
          this.router.navigate(['/stations']);
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'حدث خطأ أثناء الحفظ');
      }
    });
  }

  private loadStation(): void {
    this.apiService.getStation(this.stationId!).subscribe({
      next: (station) => {
        this.formData.name = station.name;
        this.formData.code = station.code;
        this.formData.type = station.type;
        this.formData.capacity = station.capacity || null;
        this.formData.address = station.address || '';
        this.formData.latitude = station.latitude || null;
        this.formData.longitude = station.longitude || null;
        this.formData.isActive = station.isActive;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('فشل في تحميل بيانات المحطة');
        this.loading.set(false);
      }
    });
  }
}
