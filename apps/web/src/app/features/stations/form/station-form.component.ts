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

        <!-- البيانات الأساسية -->
        <div class="card">
          <div class="card-header">
            <h2>البيانات الأساسية</h2>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label for="name">اسم المحطة <span class="required">*</span></label>
                <input type="text" id="name" [(ngModel)]="formData.name" name="name"
                  placeholder="أدخل اسم المحطة" required [disabled]="saving()" />
              </div>
              <div class="form-group">
                <label for="nameEn">الاسم بالإنجليزية</label>
                <input type="text" id="nameEn" [(ngModel)]="formData.nameEn" name="nameEn"
                  placeholder="Station Name" [disabled]="saving()" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="code">رمز المحطة</label>
                <input type="text" id="code" [(ngModel)]="formData.code" name="code"
                  placeholder="مثال: ST001" [disabled]="saving()" />
              </div>
              <div class="form-group">
                <label for="type">نوع المحطة <span class="required">*</span></label>
                <select id="type" [(ngModel)]="formData.type" name="type" required [disabled]="saving()">
                  <option value="">اختر نوع المحطة</option>
                  <option value="generation_distribution">توليد وتوزيع</option>
                  <option value="solar">طاقة شمسية</option>
                  <option value="distribution_only">توزيع فقط</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="parentId">المحطة الأم (للفروع)</label>
                <select id="parentId" [(ngModel)]="formData.parentId" name="parentId" [disabled]="saving()">
                  <option value="">-- محطة رئيسية --</option>
                  @for (station of parentStations(); track station.id) {
                    <option [value]="station.id">{{ station.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="location">الموقع</label>
                <input type="text" id="location" [(ngModel)]="formData.location" name="location"
                  placeholder="مثال: المنطقة الصناعية" [disabled]="saving()" />
              </div>
            </div>

            <div class="form-row single">
              <div class="form-group">
                <label for="address">العنوان التفصيلي</label>
                <textarea id="address" [(ngModel)]="formData.address" name="address" rows="2"
                  placeholder="أدخل العنوان التفصيلي للمحطة" [disabled]="saving()"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="latitude">خط العرض</label>
                <input type="number" id="latitude" [(ngModel)]="formData.latitude" name="latitude"
                  placeholder="15.369445" step="0.000001" [disabled]="saving()" />
              </div>
              <div class="form-group">
                <label for="longitude">خط الطول</label>
                <input type="number" id="longitude" [(ngModel)]="formData.longitude" name="longitude"
                  placeholder="44.191006" step="0.000001" [disabled]="saving()" />
              </div>
            </div>
          </div>
        </div>

        <!-- بيانات الطاقة -->
        <div class="card">
          <div class="card-header">
            <h2>بيانات الطاقة</h2>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.hasGenerators" name="hasGenerators" [disabled]="saving()" />
                  <span class="checkmark"></span>
                  تحتوي على مولدات
                </label>
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.hasSolar" name="hasSolar" [disabled]="saving()" />
                  <span class="checkmark"></span>
                  تحتوي على طاقة شمسية
                </label>
              </div>
            </div>

            @if (formData.hasGenerators) {
              <div class="form-row single">
                <div class="form-group">
                  <label for="generatorCapacity">سعة المولدات (كيلوواط)</label>
                  <input type="number" id="generatorCapacity" [(ngModel)]="formData.generatorCapacity"
                    name="generatorCapacity" placeholder="500" min="0" [disabled]="saving()" />
                </div>
              </div>
            }

            @if (formData.hasSolar) {
              <div class="form-row single">
                <div class="form-group">
                  <label for="solarCapacity">سعة الطاقة الشمسية (كيلوواط)</label>
                  <input type="number" id="solarCapacity" [(ngModel)]="formData.solarCapacity"
                    name="solarCapacity" placeholder="100" min="0" [disabled]="saving()" />
                </div>
              </div>
            }
          </div>
        </div>

        <!-- بيانات الاتصال -->
        <div class="card">
          <div class="card-header">
            <h2>بيانات الاتصال</h2>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label for="managerName">اسم مدير المحطة</label>
                <input type="text" id="managerName" [(ngModel)]="formData.managerName" name="managerName"
                  placeholder="أدخل اسم المدير" [disabled]="saving()" />
              </div>
              <div class="form-group">
                <label for="managerPhone">هاتف المدير</label>
                <input type="tel" id="managerPhone" [(ngModel)]="formData.managerPhone" name="managerPhone"
                  placeholder="777123456" [disabled]="saving()" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="contactPhone">هاتف المحطة</label>
                <input type="tel" id="contactPhone" [(ngModel)]="formData.contactPhone" name="contactPhone"
                  placeholder="01234567" [disabled]="saving()" />
              </div>
              <div class="form-group">
                <label for="contactEmail">البريد الإلكتروني</label>
                <input type="email" id="contactEmail" [(ngModel)]="formData.contactEmail" name="contactEmail"
                  placeholder="station@example.com" [disabled]="saving()" />
              </div>
            </div>

            <div class="form-row single">
              <div class="form-group">
                <label for="workingHours">ساعات العمل</label>
                <input type="text" id="workingHours" [(ngModel)]="formData.workingHours" name="workingHours"
                  placeholder="08:00 - 17:00" [disabled]="saving()" />
              </div>
            </div>
          </div>
        </div>

        <!-- الحالة -->
        <div class="card">
          <div class="card-body">
            <div class="form-row single">
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.isActive" name="isActive" [disabled]="saving()" />
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
    .header-content h1 { margin: 0 0 4px; font-size: 24px; color: #1f2937; }
    .header-content p { margin: 0; color: #6b7280; font-size: 14px; }
    
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
    .btn-secondary { background: #f3f4f6; color: #374151; }
    .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    
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
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .form-container { display: flex; flex-direction: column; gap: 24px; }
    
    .alert {
      padding: 16px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }
    .alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .card-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .card-header h2 { margin: 0; font-size: 18px; color: #1f2937; }
    .card-body { padding: 24px; }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .form-row.single { grid-template-columns: 1fr; }
    .form-row:last-child { margin-bottom: 0; }
    
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
    .required { color: #dc2626; }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
      background: white;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #f59e0b;
    }
    .form-group input:disabled,
    .form-group select:disabled,
    .form-group textarea:disabled {
      background: #f9fafb;
      cursor: not-allowed;
    }
    
    .checkbox-group { flex-direction: row; align-items: center; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-weight: 500;
    }
    .checkbox-label input[type="checkbox"] {
      width: 20px;
      height: 20px;
      accent-color: #f59e0b;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; align-items: stretch; }
    }
  `]
})
export class StationFormComponent implements OnInit {
  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal('');
  parentStations = signal<any[]>([]);
  
  formData = {
    name: '',
    nameEn: '',
    code: '',
    type: '',
    parentId: '',
    location: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    hasGenerators: false,
    hasSolar: false,
    generatorCapacity: null as number | null,
    solarCapacity: null as number | null,
    managerName: '',
    managerPhone: '',
    contactPhone: '',
    contactEmail: '',
    workingHours: '',
    isActive: true
  };
  
  private stationId: string | null = null;
  
  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    this.loadParentStations();
    
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.stationId = params['id'];
        this.isEditMode.set(true);
        this.loadStation();
      }
    });
  }
  
  loadParentStations() {
    this.api.get<any>('/stations', { limit: 100 }).subscribe({
      next: (res) => {
        // Filter out current station if editing
        const stations = res.data || [];
        this.parentStations.set(
          this.stationId 
            ? stations.filter((s: any) => s.id !== this.stationId)
            : stations
        );
      }
    });
  }
  
  loadStation() {
    if (!this.stationId) return;
    
    this.loading.set(true);
    this.api.get<any>(`/stations/${this.stationId}`).subscribe({
      next: (station) => {
        this.formData = {
          name: station.name || '',
          nameEn: station.nameEn || '',
          code: station.code || '',
          type: station.type || '',
          parentId: station.parentId || '',
          location: station.location || '',
          address: station.address || '',
          latitude: station.latitude,
          longitude: station.longitude,
          hasGenerators: station.hasGenerators || false,
          hasSolar: station.hasSolar || false,
          generatorCapacity: station.generatorCapacity,
          solarCapacity: station.solarCapacity,
          managerName: station.managerName || '',
          managerPhone: station.managerPhone || '',
          contactPhone: station.contactPhone || '',
          contactEmail: station.contactEmail || '',
          workingHours: station.workingHours || '',
          isActive: station.isActive !== false
        };
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false);
      }
    });
  }
  
  isFormValid(): boolean {
    return !!(this.formData.name && this.formData.type);
  }
  
  onSubmit() {
    if (!this.isFormValid()) return;
    
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    
    const data: any = {
      name: this.formData.name,
      type: this.formData.type,
      isActive: this.formData.isActive
    };
    
    // Add optional fields
    if (this.formData.nameEn) data.nameEn = this.formData.nameEn;
    if (this.formData.code) data.code = this.formData.code;
    if (this.formData.parentId) data.parentId = this.formData.parentId;
    if (this.formData.location) data.location = this.formData.location;
    if (this.formData.address) data.address = this.formData.address;
    if (this.formData.latitude) data.latitude = this.formData.latitude;
    if (this.formData.longitude) data.longitude = this.formData.longitude;
    if (this.formData.hasGenerators) data.hasGenerators = true;
    if (this.formData.hasSolar) data.hasSolar = true;
    if (this.formData.generatorCapacity) data.generatorCapacity = this.formData.generatorCapacity;
    if (this.formData.solarCapacity) data.solarCapacity = this.formData.solarCapacity;
    if (this.formData.managerName) data.managerName = this.formData.managerName;
    if (this.formData.managerPhone) data.managerPhone = this.formData.managerPhone;
    if (this.formData.contactPhone) data.contactPhone = this.formData.contactPhone;
    if (this.formData.contactEmail) data.contactEmail = this.formData.contactEmail;
    if (this.formData.workingHours) data.workingHours = this.formData.workingHours;
    
    const request = this.isEditMode()
      ? this.api.put(`/stations/${this.stationId}`, data)
      : this.api.post('/stations', data);
    
    request.subscribe({
      next: () => {
        this.success.set(this.isEditMode() ? 'تم تحديث المحطة بنجاح' : 'تم إنشاء المحطة بنجاح');
        this.saving.set(false);
        setTimeout(() => this.router.navigate(['/stations']), 1500);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'حدث خطأ أثناء الحفظ');
        this.saving.set(false);
      }
    });
  }
}
