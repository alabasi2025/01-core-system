import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, PaginatedResponse } from '../../../core/models';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>إدارة المستخدمين</h1>
        <p>عرض وإدارة مستخدمي النظام</p>
      </div>
      @if (hasPermission('users:create')) {
        <a routerLink="/users/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          مستخدم جديد
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
          <input type="text" placeholder="بحث بالاسم أو البريد..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        </div>
      </div>
      
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الأدوار</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ getInitials(user.name) }}</div>
                      <span>{{ user.name }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.phone || '-' }}</td>
                  <td>
                    <div class="roles-badges">
                      @for (role of user.roles; track role.id) {
                        <span class="badge">{{ role.name }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="status" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                      {{ user.isActive ? 'نشط' : 'غير نشط' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      @if (hasPermission('users:update')) {
                        <a [routerLink]="['/users', user.id]" class="btn-icon" title="تعديل">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </a>
                      }
                      @if (hasPermission('users:delete')) {
                        <button class="btn-icon danger" (click)="deleteUser(user)" title="حذف">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <p>لا يوجد مستخدمين</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="btn-page" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
              السابق
            </button>
            <span class="page-info">صفحة {{ currentPage() }} من {{ totalPages() }}</span>
            <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
              التالي
            </button>
          </div>
        }
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
    
    .table-container {
      overflow-x: auto;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th,
    .data-table td {
      padding: 16px 20px;
      text-align: right;
    }
    
    .data-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table td {
      border-bottom: 1px solid #e5e7eb;
      color: #4b5563;
      font-size: 14px;
    }
    
    .data-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 12px;
    }
    
    .roles-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .badge {
      padding: 4px 10px;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status.active {
      background: #d1fae5;
      color: #059669;
    }
    
    .status.inactive {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      width: 36px;
      height: 36px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s;
      text-decoration: none;
    }
    
    .btn-icon:hover {
      background: #e5e7eb;
      color: #374151;
    }
    
    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px !important;
      color: #9ca3af;
    }
    
    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .empty-state p {
      margin: 0;
      font-size: 16px;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn-page {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .btn-page:hover:not(:disabled) {
      background: #f3f4f6;
    }
    
    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-info {
      color: #6b7280;
      font-size: 14px;
    }
  `]
})
export class UsersListComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  searchQuery = '';
  currentPage = signal(1);
  totalPages = signal(1);
  private searchTimeout: any;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadUsers();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  deleteUser(user: User): void {
    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الحذف')
      });
    }
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.apiService.getUsers({
      search: this.searchQuery,
      page: this.currentPage(),
      limit: 10
    }).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
