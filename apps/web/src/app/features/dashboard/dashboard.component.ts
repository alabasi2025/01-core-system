import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BusinessStatistics } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="welcome-section">
        <h2>مرحباً، {{ authService.currentUser()?.name }}</h2>
        <p>لوحة التحكم الرئيسية - نظام إدارة الكهرباء</p>
      </div>
      
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon users">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalUsers || 0 }}</span>
              <span class="stat-label">المستخدمين</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon stations">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalStations || 0 }}</span>
              <span class="stat-label">المحطات</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon accounts">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalAccounts || 0 }}</span>
              <span class="stat-label">الحسابات</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon entries">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalJournalEntries || 0 }}</span>
              <span class="stat-label">القيود اليومية</span>
            </div>
          </div>
        </div>
        
        <div class="cards-grid">
          <div class="info-card">
            <h3>القيود المالية</h3>
            <div class="info-stats">
              <div class="info-stat">
                <span class="info-value draft">{{ stats()?.draftEntries || 0 }}</span>
                <span class="info-label">مسودة</span>
              </div>
              <div class="info-stat">
                <span class="info-value posted">{{ stats()?.postedEntries || 0 }}</span>
                <span class="info-label">مرحّل</span>
              </div>
            </div>
          </div>
          
          <div class="info-card">
            <h3>روابط سريعة</h3>
            <div class="quick-links">
              @if (hasPermission('journal-entries:create')) {
                <a routerLink="/journal-entries/new" class="quick-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  قيد جديد
                </a>
              }
              @if (hasPermission('users:create')) {
                <a routerLink="/users/new" class="quick-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  مستخدم جديد
                </a>
              }
              @if (hasPermission('stations:create')) {
                <a routerLink="/stations/new" class="quick-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  محطة جديدة
                </a>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .welcome-section {
      margin-bottom: 32px;
    }
    
    .welcome-section h2 {
      margin: 0 0 8px;
      font-size: 28px;
      color: #1f2937;
    }
    
    .welcome-section p {
      margin: 0;
      color: #6b7280;
    }
    
    .loading {
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
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-icon.users {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }
    
    .stat-icon.stations {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .stat-icon.accounts {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    .stat-icon.entries {
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      color: white;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .info-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .info-card h3 {
      margin: 0 0 20px;
      font-size: 18px;
      color: #1f2937;
    }
    
    .info-stats {
      display: flex;
      gap: 32px;
    }
    
    .info-stat {
      display: flex;
      flex-direction: column;
    }
    
    .info-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }
    
    .info-value.draft {
      color: #f59e0b;
    }
    
    .info-value.posted {
      color: #10b981;
    }
    
    .info-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .quick-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f3f4f6;
      border-radius: 10px;
      color: #374151;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .quick-link:hover {
      background: #1e3a5f;
      color: white;
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<BusinessStatistics | null>(null);
  loading = signal(true);

  constructor(
    private apiService: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  private loadStatistics(): void {
    this.apiService.getBusinessStatistics().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
