import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashBalance: number;
  receivables: number;
  payables: number;
}

interface CollectionStats {
  todayCollections: number;
  weekCollections: number;
  monthCollections: number;
  pendingCollections: number;
  totalCollectors: number;
  activeCollectors: number;
}

interface DashboardAlert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  link?: string;
}

interface RecentTransaction {
  id: string;
  number: string;
  date: Date;
  description: string;
  amount: number;
  type: string;
}

interface DashboardData {
  financialSummary: FinancialSummary;
  revenueChart: any;
  collectionStats: CollectionStats;
  pendingReconciliations: any[];
  alerts: DashboardAlert[];
  recentTransactions: RecentTransaction[];
  paymentOrdersStats: {
    pending: number;
    approved: number;
    overdue: number;
    totalPending: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="welcome-section">
        <div>
          <h2>مرحباً، {{ authService.currentUser()?.name }}</h2>
          <p>لوحة التحكم المالية - نظام إدارة الكهرباء</p>
        </div>
        <div class="header-date">
          {{ today | date:'EEEE, d MMMM yyyy':'':'ar' }}
        </div>
      </div>
      
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      } @else {
        <!-- Alerts Section -->
        @if (data()?.alerts && data()!.alerts.length > 0) {
          <div class="alerts-section">
            @for (alert of data()!.alerts; track alert.id) {
              <div class="alert" [class]="'alert-' + alert.type">
                <div class="alert-icon">
                  @switch (alert.type) {
                    @case ('danger') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    }
                    @case ('warning') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    }
                    @default {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    }
                  }
                </div>
                <div class="alert-content">
                  <strong>{{ alert.title }}</strong>
                  <span>{{ alert.message }}</span>
                </div>
                @if (alert.link) {
                  <a [routerLink]="alert.link" class="alert-action">عرض</a>
                }
              </div>
            }
          </div>
        }

        <!-- Financial Summary Cards -->
        <div class="section-title">الملخص المالي</div>
        <div class="financial-grid">
          <div class="financial-card cash">
            <div class="card-header">
              <span class="card-title">الرصيد النقدي</span>
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
            </div>
            <div class="card-value">{{ formatCurrency(data()?.financialSummary?.cashBalance || 0) }}</div>
            <div class="card-subtitle">متاح للاستخدام</div>
          </div>

          <div class="financial-card revenue">
            <div class="card-header">
              <span class="card-title">إجمالي الإيرادات</span>
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
            <div class="card-value">{{ formatCurrency(data()?.financialSummary?.totalRevenue || 0) }}</div>
            <div class="card-subtitle">منذ بداية الفترة</div>
          </div>

          <div class="financial-card expenses">
            <div class="card-header">
              <span class="card-title">إجمالي المصروفات</span>
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
                </svg>
              </div>
            </div>
            <div class="card-value">{{ formatCurrency(data()?.financialSummary?.totalExpenses || 0) }}</div>
            <div class="card-subtitle">منذ بداية الفترة</div>
          </div>

          <div class="financial-card profit" [class.loss]="(data()?.financialSummary?.netIncome || 0) < 0">
            <div class="card-header">
              <span class="card-title">صافي الربح</span>
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <div class="card-value">{{ formatCurrency(data()?.financialSummary?.netIncome || 0) }}</div>
            <div class="card-subtitle">{{ (data()?.financialSummary?.netIncome || 0) >= 0 ? 'ربح' : 'خسارة' }}</div>
          </div>
        </div>

        <!-- Secondary Stats -->
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-label">الذمم المدينة</div>
            <div class="stat-value receivable">{{ formatCurrency(data()?.financialSummary?.receivables || 0) }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">الذمم الدائنة</div>
            <div class="stat-value payable">{{ formatCurrency(data()?.financialSummary?.payables || 0) }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">إجمالي الأصول</div>
            <div class="stat-value">{{ formatCurrency(data()?.financialSummary?.totalAssets || 0) }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">إجمالي الالتزامات</div>
            <div class="stat-value">{{ formatCurrency(data()?.financialSummary?.totalLiabilities || 0) }}</div>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="two-columns">
          <!-- Collection Stats -->
          <div class="panel">
            <div class="panel-header">
              <h3>إحصائيات التحصيل</h3>
              <a routerLink="/collections" class="panel-link">عرض الكل</a>
            </div>
            <div class="collection-stats">
              <div class="collection-stat">
                <div class="collection-icon today">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="collection-info">
                  <span class="collection-label">تحصيل اليوم</span>
                  <span class="collection-value">{{ formatCurrency(data()?.collectionStats?.todayCollections || 0) }}</span>
                </div>
              </div>
              <div class="collection-stat">
                <div class="collection-icon week">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div class="collection-info">
                  <span class="collection-label">تحصيل الأسبوع</span>
                  <span class="collection-value">{{ formatCurrency(data()?.collectionStats?.weekCollections || 0) }}</span>
                </div>
              </div>
              <div class="collection-stat">
                <div class="collection-icon month">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>
                  </svg>
                </div>
                <div class="collection-info">
                  <span class="collection-label">تحصيل الشهر</span>
                  <span class="collection-value">{{ formatCurrency(data()?.collectionStats?.monthCollections || 0) }}</span>
                </div>
              </div>
              <div class="collection-stat">
                <div class="collection-icon pending">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div class="collection-info">
                  <span class="collection-label">معلق</span>
                  <span class="collection-value pending-value">{{ formatCurrency(data()?.collectionStats?.pendingCollections || 0) }}</span>
                </div>
              </div>
            </div>
            <div class="collectors-info">
              <span>المتحصلين النشطين: <strong>{{ data()?.collectionStats?.activeCollectors || 0 }}</strong> من {{ data()?.collectionStats?.totalCollectors || 0 }}</span>
            </div>
          </div>

          <!-- Payment Orders Stats -->
          <div class="panel">
            <div class="panel-header">
              <h3>أوامر الدفع</h3>
              <a routerLink="/payment-orders" class="panel-link">عرض الكل</a>
            </div>
            <div class="payment-stats">
              <div class="payment-stat-row">
                <div class="payment-stat">
                  <span class="payment-count warning">{{ data()?.paymentOrdersStats?.pending || 0 }}</span>
                  <span class="payment-label">بانتظار الاعتماد</span>
                </div>
                <div class="payment-stat">
                  <span class="payment-count info">{{ data()?.paymentOrdersStats?.approved || 0 }}</span>
                  <span class="payment-label">معتمد</span>
                </div>
                <div class="payment-stat">
                  <span class="payment-count danger">{{ data()?.paymentOrdersStats?.overdue || 0 }}</span>
                  <span class="payment-label">متأخر</span>
                </div>
              </div>
              <div class="payment-total">
                <span class="payment-total-label">إجمالي المبالغ المعلقة</span>
                <span class="payment-total-value">{{ formatCurrency(data()?.paymentOrdersStats?.totalPending || 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions & Quick Links -->
        <div class="two-columns">
          <!-- Recent Transactions -->
          <div class="panel">
            <div class="panel-header">
              <h3>آخر المعاملات</h3>
              <a routerLink="/journal-entries" class="panel-link">عرض الكل</a>
            </div>
            <div class="transactions-list">
              @for (tx of data()?.recentTransactions || []; track tx.id) {
                <div class="transaction-item">
                  <div class="transaction-info">
                    <span class="transaction-number">{{ tx.number }}</span>
                    <span class="transaction-desc">{{ tx.description || 'بدون وصف' }}</span>
                  </div>
                  <div class="transaction-meta">
                    <span class="transaction-amount">{{ formatCurrency(tx.amount) }}</span>
                    <span class="transaction-date">{{ tx.date | date:'MM/dd' }}</span>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">لا توجد معاملات حديثة</div>
              }
            </div>
          </div>

          <!-- Quick Links -->
          <div class="panel">
            <div class="panel-header">
              <h3>روابط سريعة</h3>
            </div>
            <div class="quick-links-grid">
              @if (hasPermission('journal-entries:create')) {
                <a routerLink="/journal-entries/new" class="quick-link-card">
                  <div class="ql-icon journal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                    </svg>
                  </div>
                  <span>قيد جديد</span>
                </a>
              }
              @if (hasPermission('payment-orders:create')) {
                <a routerLink="/payment-orders" class="quick-link-card">
                  <div class="ql-icon payment">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <span>أمر دفع</span>
                </a>
              }
              <a routerLink="/reports" class="quick-link-card">
                <div class="ql-icon reports">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
                  </svg>
                </div>
                <span>التقارير</span>
              </a>
              <a routerLink="/accounts" class="quick-link-card">
                <div class="ql-icon accounts">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <span>الحسابات</span>
              </a>
              <a routerLink="/reconciliation" class="quick-link-card">
                <div class="ql-icon reconciliation">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <span>التسوية</span>
              </a>
              <a routerLink="/services" class="quick-link-card">
                <div class="ql-icon services">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <span>الخدمات</span>
              </a>
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
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    
    .welcome-section h2 {
      margin: 0 0 4px;
      font-size: 24px;
      color: #1f2937;
    }
    
    .welcome-section p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .header-date {
      color: #6b7280;
      font-size: 14px;
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

    /* Alerts */
    .alerts-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
    }

    .alert-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .alert-icon {
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-content strong {
      font-weight: 600;
    }

    .alert-content span {
      opacity: 0.8;
    }

    .alert-action {
      padding: 6px 12px;
      background: rgba(0,0,0,0.1);
      border-radius: 6px;
      text-decoration: none;
      color: inherit;
      font-weight: 500;
      transition: background 0.2s;
    }

    .alert-action:hover {
      background: rgba(0,0,0,0.15);
    }

    /* Section Title */
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
    }

    /* Financial Cards */
    .financial-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 1200px) {
      .financial-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .financial-grid {
        grid-template-columns: 1fr;
      }
    }

    .financial-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .financial-card.cash {
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
    }

    .financial-card.revenue {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
    }

    .financial-card.expenses {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
    }

    .financial-card.profit {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .financial-card.profit.loss {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .card-title {
      font-size: 14px;
      opacity: 0.9;
    }

    .card-icon {
      opacity: 0.7;
    }

    .card-value {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .card-subtitle {
      font-size: 12px;
      opacity: 0.7;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-box {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-value.receivable {
      color: #059669;
    }

    .stat-value.payable {
      color: #dc2626;
    }

    /* Two Columns */
    .two-columns {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .two-columns {
        grid-template-columns: 1fr;
      }
    }

    /* Panel */
    .panel {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      color: #1f2937;
    }

    .panel-link {
      font-size: 13px;
      color: #f59e0b;
      text-decoration: none;
      font-weight: 500;
    }

    .panel-link:hover {
      text-decoration: underline;
    }

    /* Collection Stats */
    .collection-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .collection-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 10px;
    }

    .collection-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .collection-icon.today { background: #3b82f6; }
    .collection-icon.week { background: #8b5cf6; }
    .collection-icon.month { background: #10b981; }
    .collection-icon.pending { background: #f59e0b; }

    .collection-info {
      display: flex;
      flex-direction: column;
    }

    .collection-label {
      font-size: 12px;
      color: #6b7280;
    }

    .collection-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .collection-value.pending-value {
      color: #f59e0b;
    }

    .collectors-info {
      font-size: 13px;
      color: #6b7280;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    /* Payment Stats */
    .payment-stats {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .payment-stat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .payment-stat {
      text-align: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 10px;
    }

    .payment-count {
      display: block;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .payment-count.warning { color: #f59e0b; }
    .payment-count.info { color: #3b82f6; }
    .payment-count.danger { color: #ef4444; }

    .payment-label {
      font-size: 12px;
      color: #6b7280;
    }

    .payment-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fef3c7;
      border-radius: 10px;
    }

    .payment-total-label {
      font-size: 14px;
      color: #92400e;
    }

    .payment-total-value {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
    }

    /* Transactions */
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .transaction-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .transaction-number {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      font-family: monospace;
    }

    .transaction-desc {
      font-size: 12px;
      color: #6b7280;
    }

    .transaction-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .transaction-amount {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .transaction-date {
      font-size: 11px;
      color: #9ca3af;
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: #9ca3af;
      font-size: 14px;
    }

    /* Quick Links */
    .quick-links-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .quick-link-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      text-decoration: none;
      color: #374151;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .quick-link-card:hover {
      background: #1e3a5f;
      color: white;
    }

    .quick-link-card:hover .ql-icon {
      background: rgba(255,255,255,0.2);
    }

    .ql-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .ql-icon.journal { background: #dbeafe; color: #2563eb; }
    .ql-icon.payment { background: #fef3c7; color: #d97706; }
    .ql-icon.reports { background: #f3e8ff; color: #7c3aed; }
    .ql-icon.accounts { background: #d1fae5; color: #059669; }
    .ql-icon.reconciliation { background: #fce7f3; color: #db2777; }
    .ql-icon.services { background: #e0e7ff; color: #4f46e5; }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  today = new Date();

  ngOnInit(): void {
    this.loadDashboard();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-YE', { 
      style: 'currency', 
      currency: 'YER',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private loadDashboard(): void {
    this.api.get<DashboardData>('/dashboard').subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
