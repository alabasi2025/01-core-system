import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-bell" (click)="toggleDropdown()">
      <span class="bell-icon">🔔</span>
      <span class="badge" *ngIf="unreadCount > 0">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>

      <!-- Dropdown -->
      <div class="dropdown" *ngIf="showDropdown" (click)="$event.stopPropagation()">
        <div class="dropdown-header">
          <h4>الإشعارات</h4>
          <button 
            class="mark-all-btn"
            *ngIf="unreadCount > 0"
            (click)="markAllAsRead()"
          >
            تحديد الكل كمقروء
          </button>
        </div>

        <div class="dropdown-body">
          <div class="loading" *ngIf="loading">
            جاري التحميل...
          </div>

          <div class="empty" *ngIf="!loading && recentNotifications.length === 0">
            لا توجد إشعارات جديدة
          </div>

          <div 
            class="notification-item"
            *ngFor="let notification of recentNotifications"
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
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ truncate(notification.message, 60) }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
          </div>
        </div>

        <div class="dropdown-footer">
          <a routerLink="/notifications" (click)="showDropdown = false">
            عرض جميع الإشعارات
          </a>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div 
      class="backdrop" 
      *ngIf="showDropdown"
      (click)="showDropdown = false"
    ></div>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      cursor: pointer;
      padding: 8px;
    }

    .bell-icon {
      font-size: 20px;
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #e53e3e;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 360px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .dropdown-header h4 {
      margin: 0;
      font-size: 16px;
      color: #2d3748;
    }

    .mark-all-btn {
      background: none;
      border: none;
      color: #4472C4;
      cursor: pointer;
      font-size: 13px;
    }

    .mark-all-btn:hover {
      text-decoration: underline;
    }

    .dropdown-body {
      max-height: 400px;
      overflow-y: auto;
    }

    .loading, .empty {
      padding: 32px;
      text-align: center;
      color: #718096;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
    }

    .notification-item:hover {
      background: #f7fafc;
    }

    .notification-item.unread {
      background: #f0f7ff;
    }

    .notification-item.type-success { border-right: 3px solid #38a169; }
    .notification-item.type-warning { border-right: 3px solid #dd6b20; }
    .notification-item.type-error { border-right: 3px solid #e53e3e; }
    .notification-item.type-info { border-right: 3px solid #3182ce; }

    .notification-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 500;
      color: #2d3748;
      margin-bottom: 2px;
    }

    .notification-message {
      font-size: 13px;
      color: #718096;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 11px;
      color: #a0aec0;
    }

    .dropdown-footer {
      padding: 12px 16px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .dropdown-footer a {
      color: #4472C4;
      text-decoration: none;
      font-size: 14px;
    }

    .dropdown-footer a:hover {
      text-decoration: underline;
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  recentNotifications: Notification[] = [];
  showDropdown = false;
  loading = false;

  private destroy$ = new Subject<void>();
  private apiUrl = '/api/v1/notifications';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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

  loadUnreadCount(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`)
      .subscribe(res => {
        this.unreadCount = res.count;
      });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadRecentNotifications();
    }
  }

  loadRecentNotifications(): void {
    this.loading = true;
    this.http.get<{ data: Notification[] }>(`${this.apiUrl}?limit=5`)
      .subscribe({
        next: (res) => {
          this.recentNotifications = res.data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  openNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.http.post(`${this.apiUrl}/${notification.id}/read`, {})
        .subscribe(() => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        });
    }

    this.showDropdown = false;

    if (notification.link) {
      window.location.href = notification.link;
    }
  }

  markAllAsRead(): void {
    this.http.post(`${this.apiUrl}/read-all`, {})
      .subscribe(() => {
        this.recentNotifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      });
  }

  truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
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
