import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { JournalEntry } from '../../../core/models';

@Component({
  selector: 'app-journal-entries-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>القيود اليومية</h1>
        <p>عرض وإدارة القيود المحاسبية</p>
      </div>
      @if (hasPermission('journal-entries:create')) {
        <a routerLink="/journal-entries/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          قيد جديد
        </a>
      }
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="filters">
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="بحث برقم القيد..." [(ngModel)]="searchQuery" (input)="onSearch()" />
          </div>
          
          <select [(ngModel)]="statusFilter" (change)="loadEntries()" class="filter-select">
            <option value="">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="posted">مرحّل</option>
            <option value="voided">ملغي</option>
          </select>
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
                <th>رقم القيد</th>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>المدين</th>
                <th>الدائن</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.id) {
                <tr>
                  <td class="entry-number">{{ entry.entryNumber }}</td>
                  <td>{{ formatDate(entry.entryDate) }}</td>
                  <td>{{ entry.description || '-' }}</td>
                  <td class="amount debit">{{ formatAmount(entry.totalDebit) }}</td>
                  <td class="amount credit">{{ formatAmount(entry.totalCredit) }}</td>
                  <td>
                    <span class="status" [class]="entry.status">
                      {{ getStatusLabel(entry.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/journal-entries', entry.id]" class="btn-icon" title="عرض">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </a>
                      
                      @if (entry.status === 'draft' && hasPermission('journal-entries:post')) {
                        <button class="btn-icon success" (click)="postEntry(entry)" title="ترحيل">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                      }
                      
                      @if (entry.status === 'posted' && hasPermission('journal-entries:void')) {
                        <button class="btn-icon warning" (click)="voidEntry(entry)" title="إلغاء">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </button>
                      }
                      
                      @if (entry.status === 'draft' && hasPermission('journal-entries:delete')) {
                        <button class="btn-icon danger" (click)="deleteEntry(entry)" title="حذف">
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
                  <td colspan="7" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>لا توجد قيود</p>
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
    
    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
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
    
    .filter-select {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      min-width: 150px;
    }
    
    .filter-select:focus {
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
    
    .entry-number {
      font-family: monospace;
      font-weight: 600;
      color: #1e3a5f;
    }
    
    .amount {
      font-family: monospace;
      font-weight: 600;
    }
    
    .amount.debit {
      color: #dc2626;
    }
    
    .amount.credit {
      color: #059669;
    }
    
    .status {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status.draft {
      background: #fef3c7;
      color: #d97706;
    }
    
    .status.posted {
      background: #d1fae5;
      color: #059669;
    }
    
    .status.voided {
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
    
    .btn-icon.success:hover {
      background: #d1fae5;
      color: #059669;
    }
    
    .btn-icon.warning:hover {
      background: #fef3c7;
      color: #d97706;
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
export class JournalEntriesListComponent implements OnInit {
  entries = signal<JournalEntry[]>([]);
  loading = signal(true);
  searchQuery = '';
  statusFilter = '';
  currentPage = signal(1);
  totalPages = signal(1);
  private searchTimeout: any;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'مسودة',
      'posted': 'مرحّل',
      'voided': 'ملغي'
    };
    return labels[status] || status;
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadEntries();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadEntries();
  }

  postEntry(entry: JournalEntry): void {
    if (confirm(`هل أنت متأكد من ترحيل القيد "${entry.entryNumber}"؟`)) {
      this.apiService.postJournalEntry(entry.id).subscribe({
        next: () => this.loadEntries(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الترحيل')
      });
    }
  }

  voidEntry(entry: JournalEntry): void {
    if (confirm(`هل أنت متأكد من إلغاء القيد "${entry.entryNumber}"؟`)) {
      this.apiService.voidJournalEntry(entry.id).subscribe({
        next: () => this.loadEntries(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الإلغاء')
      });
    }
  }

  deleteEntry(entry: JournalEntry): void {
    if (confirm(`هل أنت متأكد من حذف القيد "${entry.entryNumber}"؟`)) {
      this.apiService.deleteJournalEntry(entry.id).subscribe({
        next: () => this.loadEntries(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الحذف')
      });
    }
  }

  loadEntries(): void {
    this.loading.set(true);
    this.apiService.getJournalEntries({
      search: this.searchQuery,
      status: this.statusFilter,
      page: this.currentPage(),
      limit: 10
    }).subscribe({
      next: (response) => {
        this.entries.set(response.data);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
