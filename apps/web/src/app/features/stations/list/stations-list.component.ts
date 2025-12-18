import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Station } from '../../../core/models';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>إدارة المحطات</h1>
        <p>عرض وإدارة محطات الكهرباء</p>
      </div>
      @if (hasPermission('stations:create')) {
        <a routerLink="/stations/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          محطة جديدة
        </a>
      }
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="بحث بالاسم..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        </div>
      </div>
      
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="stations-grid">
          @for (station of stations(); track station.id) {
            <div class="station-card">
              <div class="station-header">
                <div class="station-icon" [class]="station.type">
                  @if (station.type === 'MAIN') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  } @else if (station.type === 'SUB') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    </svg>
                  }
                </div>
                <span class="station-status" [class.active]="station.isActive">
                  {{ station.isActive ? 'نشطة' : 'غير نشطة' }}
                </span>
              </div>
              
              <h3 class="station-name">{{ station.name }}</h3>
              <p class="station-code">{{ station.code }}</p>
              
              <div class="station-type-badge" [class]="station.type">
                {{ getStationTypeLabel(station.type) }}
              </div>
              
              @if (station.address) {
                <div class="station-location">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ station.address }}
                </div>
              }
              
              @if (station.capacity) {
                <div class="station-capacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  {{ station.capacity }} كيلوواط
                </div>
              }
              
              <div class="station-actions">
                @if (hasPermission('stations:update')) {
                  <a [routerLink]="['/stations', station.id]" class="btn-action">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    تعديل
                  </a>
                }
                @if (hasPermission('stations:delete')) {
                  <button class="btn-action danger" (click)="deleteStation(station)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    حذف
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <h3>لا توجد محطات</h3>
              <p>قم بإضافة محطة جديدة للبدء</p>
            </div>
          }
        </div>
      }
    </div>
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
    
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .card-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .search-box {
      position: relative;
      max-width: 400px;
    }
    
    .search-box svg {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }
    
    .search-box input {
      width: 100%;
      padding: 12px 44px 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .search-box input:focus {
      outline: none;
      border-color: #f59e0b;
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
    
    .stations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    
    .station-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }
    
    .station-card:hover {
      background: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .station-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .station-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .station-icon.MAIN {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
    
    .station-icon.SUB {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    
    .station-icon.DISTRIBUTION {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }
    
    .station-status {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: #fef2f2;
      color: #dc2626;
    }
    
    .station-status.active {
      background: #f0fdf4;
      color: #16a34a;
    }
    
    .station-name {
      margin: 0 0 4px;
      font-size: 18px;
      color: #1f2937;
    }
    
    .station-code {
      margin: 0 0 12px;
      font-size: 13px;
      color: #9ca3af;
    }
    
    .station-type-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .station-type-badge.MAIN {
      background: #fef3c7;
      color: #d97706;
    }
    
    .station-type-badge.SUB {
      background: #d1fae5;
      color: #059669;
    }
    
    .station-type-badge.DISTRIBUTION {
      background: #dbeafe;
      color: #1d4ed8;
    }
    
    .station-location,
    .station-capacity {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .station-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      background: #f3f4f6;
      color: #374151;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .btn-action:hover {
      background: #e5e7eb;
    }
    
    .btn-action.danger:hover {
      background: #fef2f2;
      color: #dc2626;
    }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
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
      margin: 0;
      color: #6b7280;
    }
  `]
})
export class StationsListComponent implements OnInit {
  stations = signal<Station[]>([]);
  loading = signal(true);
  searchQuery = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStations();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  getStationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'MAIN': 'محطة رئيسية',
      'SUB': 'محطة فرعية',
      'DISTRIBUTION': 'محطة توزيع'
    };
    return labels[type] || type;
  }

  onSearch(): void {
    this.loadStations();
  }

  deleteStation(station: Station): void {
    if (confirm(`هل أنت متأكد من حذف المحطة "${station.name}"؟`)) {
      this.apiService.deleteStation(station.id).subscribe({
        next: () => this.loadStations(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الحذف')
      });
    }
  }

  private loadStations(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.searchQuery) {
      params.search = this.searchQuery;
    }
    
    this.apiService.getStations(params).subscribe({
      next: (response) => {
        this.stations.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
