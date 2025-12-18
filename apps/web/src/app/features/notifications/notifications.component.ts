import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <div class="notifications-header">
        <h1>الإشعارات</h1>
        <div class="header-actions">
          <span class="unread-badge" *ngIf="unreadCount > 0">
            {{ unreadCount }} غير مقروء
          </span>
          <button 
            class="btn-secondary" 
            (click)="markAllAsRead()"
            [disabled]="unreadCount === 0"
          >
            تحديد الكل كمقروء
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <button 
          class="filter-btn" 
          [class.active]="currentFilter === 'all'"
          (click)="setFilter('all')"
        >
          الكل
        </button>
        <button 
          class="filter-btn" 
          [class.active]="currentFilter === 'unread'"
          (click)="setFilter('unread')"
        >
          غير مقروء
        </button>
        <button 
          class="filter-btn info" 
          [class.active]="currentFilter === 'info'"
          (click)="setFilter('info')"
        >
          معلومات
        </button>
        <button 
          class="filter-btn success" 
          [class.active]="currentFilter === 'success'"
          (click)="setFilter('success')"
        >
          نجاح
        </button>
        <button 
          class="filter-btn warning" 
          [class.active]="currentFilter === 'warning'"
          (click)="setFilter('warning')"
        >
          تحذير
        </button>
        <button 
          class="filter-btn error" 
          [class.active]="currentFilter === 'error'"
          (click)="setFilter('error')"
        >
          خطأ
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <span>جاري التحميل...</span>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && notifications.length === 0">
        <div class="empty-icon">🔔</div>
        <h3>لا توجد إشعارات</h3>
        <p>ستظهر الإشعارات الجديدة هنا</p>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list" *ngIf="!loading && notifications.length > 0">
        <div 
          class="notification-item"
          *ngFor="let notification of notifications"
          [class.unread]="!notification.isRead"
          [class]="'type-' + notification.type"
          (click)="openNotification(notification)"
        >
          <div class="notification-icon">
            <span *ngIf="notification.type === 'info'">ℹ️</span>
            <span *ngIf="notification.type === 'success'">✅</span>
            <span *ngIf="notification.type === 'warning'">⚠️</span>
            <span *ngIf="notification.type === 'error'">❌</span>
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <h4>{{ notification.title }}</h4>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
          </div>

          <div class="notification-actions">
            <button 
              class="action-btn"
              *ngIf="!notification.isRead"
              (click)="markAsRead(notification, $event)"
              title="تحديد كمقروء"
            >
              ✓
            </button>
            <button 
              class="action-btn delete"
              (click)="deleteNotification(notification, $event)"
              title="حذف"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button 
          class="page-btn"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)"
        >
          السابق
        </button>
        <span class="page-info">
          صفحة {{ currentPage }} من {{ totalPages }}
        </span>
        <button 
          class="page-btn"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          التالي
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .notifications-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1a365d;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .unread-badge {
      background: #e53e3e;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
    }

    .btn-secondary {
      padding: 8px 16px;
      border: 1px solid #cbd5e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f7fafc;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .filters {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .filter-btn:hover {
      background: #f7fafc;
    }

    .filter-btn.active {
      background: #4472C4;
      color: white;
      border-color: #4472C4;
    }

    .filter-btn.info.active { background: #3182ce; border-color: #3182ce; }
    .filter-btn.success.active { background: #38a169; border-color: #38a169; }
    .filter-btn.warning.active { background: #dd6b20; border-color: #dd6b20; }
    .filter-btn.error.active { background: #e53e3e; border-color: #e53e3e; }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #718096;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #4472C4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: #718096;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: #4a5568;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .notification-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .notification-item.unread {
      background: #f0f7ff;
      border-color: #90cdf4;
    }

    .notification-item.type-success { border-right: 4px solid #38a169; }
    .notification-item.type-warning { border-right: 4px solid #dd6b20; }
    .notification-item.type-error { border-right: 4px solid #e53e3e; }
    .notification-item.type-info { border-right: 4px solid #3182ce; }

    .notification-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .notification-header h4 {
      margin: 0;
      font-size: 15px;
      color: #2d3748;
    }

    .notification-time {
      font-size: 12px;
      color: #a0aec0;
      flex-shrink: 0;
    }

    .notification-message {
      margin: 0;
      font-size: 14px;
      color: #718096;
      line-height: 1.5;
    }

    .notification-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f7fafc;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #e2e8f0;
    }

    .action-btn.delete:hover {
      background: #fed7d7;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    .page-btn {
      padding: 8px 16px;
      border: 1px solid #cbd5e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f7fafc;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #718096;
      font-size: 14px;
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  currentFilter = 'all';
  currentPage = 1;
  totalPages = 1;
  limit = 20;

  private destroy$ = new Subject<void>();
  private apiUrl = '/api/v1/notifications';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(
        takeUntil(this.destroy$),
        startWith(0),
        switchMap(() => this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`))
      )
      .subscribe(res => {
        this.unreadCount = res.count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loading = true;
    
    let params: any = {
      page: this.currentPage,
      limit: this.limit,
    };

    if (this.currentFilter === 'unread') {
      params.isRead = 'false';
    } else if (['info', 'success', 'warning', 'error'].includes(this.currentFilter)) {
      params.type = this.currentFilter;
    }

    this.http.get<NotificationsResponse>(this.apiUrl, { params })
      .subscribe({
        next: (res) => {
          this.notifications = res.data;
          this.totalPages = Math.ceil(res.total / this.limit);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  loadUnreadCount(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`)
      .subscribe(res => {
        this.unreadCount = res.count;
      });
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.loadNotifications();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  openNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    if (notification.link) {
      window.location.href = notification.link;
    }
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.http.post(`${this.apiUrl}/${notification.id}/read`, {})
      .subscribe(() => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
  }

  markAllAsRead(): void {
    this.http.post(`${this.apiUrl}/read-all`, {})
      .subscribe(() => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      this.http.delete(`${this.apiUrl}/${notification.id}`)
        .subscribe(() => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          if (!notification.isRead) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        });
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-YE');
  }
}
