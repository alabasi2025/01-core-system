import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  level: number;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceReport {
  periodStart: string;
  periodEnd: string;
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

interface IncomeStatementReport {
  periodStart: string;
  periodEnd: string;
  revenue: { total: number; accounts: AccountBalance[] };
  expenses: { total: number; accounts: AccountBalance[] };
  netIncome: number;
}

interface BalanceSheetReport {
  asOfDate: string;
  assets: { total: number; accounts: AccountBalance[] };
  liabilities: { total: number; accounts: AccountBalance[] };
  equity: { total: number; accounts: AccountBalance[] };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="reports-container">
      <!-- Header -->
      <div class="page-header">
        <h1>التقارير المالية</h1>
        <p class="subtitle">عرض وتصدير التقارير المالية للنظام</p>
      </div>

      <!-- Report Type Selection -->
      <div class="report-types">
        <button 
          class="report-type-btn" 
          [class.active]="activeReport() === 'trial-balance'"
          (click)="selectReport('trial-balance')">
          <i class="icon">📊</i>
          <span>ميزان المراجعة</span>
        </button>
        <button 
          class="report-type-btn" 
          [class.active]="activeReport() === 'income-statement'"
          (click)="selectReport('income-statement')">
          <i class="icon">📈</i>
          <span>قائمة الدخل</span>
        </button>
        <button 
          class="report-type-btn" 
          [class.active]="activeReport() === 'balance-sheet'"
          (click)="selectReport('balance-sheet')">
          <i class="icon">📋</i>
          <span>الميزانية العمومية</span>
        </button>
        <button 
          class="report-type-btn" 
          [class.active]="activeReport() === 'journal-book'"
          (click)="selectReport('journal-book')">
          <i class="icon">📖</i>
          <span>دفتر اليومية</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          @if (activeReport() !== 'balance-sheet') {
            <div class="filter-group">
              <label>من تاريخ</label>
              <input type="date" [(ngModel)]="startDate" class="form-input">
            </div>
            <div class="filter-group">
              <label>إلى تاريخ</label>
              <input type="date" [(ngModel)]="endDate" class="form-input">
            </div>
          } @else {
            <div class="filter-group">
              <label>حتى تاريخ</label>
              <input type="date" [(ngModel)]="asOfDate" class="form-input">
            </div>
          }
          <div class="filter-actions">
            <button class="btn btn-primary" (click)="loadReport()" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
              }
              عرض التقرير
            </button>
            <button class="btn btn-secondary" (click)="exportReport()">
              تصدير PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Report Content -->
      <div class="report-content" [class.loading]="loading()">
        @if (loading()) {
          <div class="loading-overlay">
            <div class="spinner-large"></div>
            <p>جاري تحميل التقرير...</p>
          </div>
        }

        @if (error()) {
          <div class="error-message">
            <p>{{ error() }}</p>
            <button class="btn btn-secondary" (click)="loadReport()">إعادة المحاولة</button>
          </div>
        }

        <!-- Trial Balance Report -->
        @if (activeReport() === 'trial-balance' && trialBalance()) {
          <div class="report-card">
            <div class="report-header">
              <h2>ميزان المراجعة</h2>
              <p>من {{ trialBalance()!.periodStart | date:'yyyy/MM/dd' }} إلى {{ trialBalance()!.periodEnd | date:'yyyy/MM/dd' }}</p>
            </div>
            
            <table class="report-table">
              <thead>
                <tr>
                  <th>كود الحساب</th>
                  <th>اسم الحساب</th>
                  <th>مدين</th>
                  <th>دائن</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                @for (account of trialBalance()!.accounts; track account.accountId) {
                  <tr>
                    <td>{{ account.code }}</td>
                    <td>{{ account.name }}</td>
                    <td class="number">{{ account.debit | number:'1.2-2' }}</td>
                    <td class="number">{{ account.credit | number:'1.2-2' }}</td>
                    <td class="number" [class.positive]="account.balance > 0" [class.negative]="account.balance < 0">
                      {{ account.balance | number:'1.2-2' }}
                    </td>
                  </tr>
                }
                @empty {
                  <tr>
                    <td colspan="5" class="empty-row">لا توجد حركات في هذه الفترة</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="totals-row">
                  <td colspan="2"><strong>الإجمالي</strong></td>
                  <td class="number"><strong>{{ trialBalance()!.totalDebit | number:'1.2-2' }}</strong></td>
                  <td class="number"><strong>{{ trialBalance()!.totalCredit | number:'1.2-2' }}</strong></td>
                  <td class="number">
                    <span class="balance-status" [class.balanced]="trialBalance()!.isBalanced" [class.unbalanced]="!trialBalance()!.isBalanced">
                      {{ trialBalance()!.isBalanced ? 'متوازن ✓' : 'غير متوازن ✗' }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        }

        <!-- Income Statement Report -->
        @if (activeReport() === 'income-statement' && incomeStatement()) {
          <div class="report-card">
            <div class="report-header">
              <h2>قائمة الدخل</h2>
              <p>من {{ incomeStatement()!.periodStart | date:'yyyy/MM/dd' }} إلى {{ incomeStatement()!.periodEnd | date:'yyyy/MM/dd' }}</p>
            </div>
            
            <!-- Revenue Section -->
            <div class="report-section">
              <h3>الإيرادات</h3>
              <table class="report-table">
                <tbody>
                  @for (account of incomeStatement()!.revenue.accounts; track account.accountId) {
                    <tr>
                      <td>{{ account.code }}</td>
                      <td>{{ account.name }}</td>
                      <td class="number positive">{{ account.balance | number:'1.2-2' }}</td>
                    </tr>
                  }
                  @empty {
                    <tr>
                      <td colspan="3" class="empty-row">لا توجد إيرادات</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="subtotal-row">
                    <td colspan="2"><strong>إجمالي الإيرادات</strong></td>
                    <td class="number positive"><strong>{{ incomeStatement()!.revenue.total | number:'1.2-2' }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Expenses Section -->
            <div class="report-section">
              <h3>المصروفات</h3>
              <table class="report-table">
                <tbody>
                  @for (account of incomeStatement()!.expenses.accounts; track account.accountId) {
                    <tr>
                      <td>{{ account.code }}</td>
                      <td>{{ account.name }}</td>
                      <td class="number negative">{{ account.balance | number:'1.2-2' }}</td>
                    </tr>
                  }
                  @empty {
                    <tr>
                      <td colspan="3" class="empty-row">لا توجد مصروفات</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="subtotal-row">
                    <td colspan="2"><strong>إجمالي المصروفات</strong></td>
                    <td class="number negative"><strong>{{ incomeStatement()!.expenses.total | number:'1.2-2' }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Net Income -->
            <div class="net-income-section">
              <div class="net-income-card" [class.profit]="incomeStatement()!.netIncome >= 0" [class.loss]="incomeStatement()!.netIncome < 0">
                <span class="label">{{ incomeStatement()!.netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة' }}</span>
                <span class="value">{{ incomeStatement()!.netIncome | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Balance Sheet Report -->
        @if (activeReport() === 'balance-sheet' && balanceSheet()) {
          <div class="report-card">
            <div class="report-header">
              <h2>الميزانية العمومية</h2>
              <p>حتى تاريخ {{ balanceSheet()!.asOfDate | date:'yyyy/MM/dd' }}</p>
            </div>
            
            <div class="balance-sheet-grid">
              <!-- Assets -->
              <div class="bs-section">
                <h3>الأصول</h3>
                <table class="report-table">
                  <tbody>
                    @for (account of balanceSheet()!.assets.accounts; track account.accountId) {
                      <tr>
                        <td>{{ account.code }}</td>
                        <td>{{ account.name }}</td>
                        <td class="number">{{ account.balance | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="subtotal-row">
                      <td colspan="2"><strong>إجمالي الأصول</strong></td>
                      <td class="number"><strong>{{ balanceSheet()!.assets.total | number:'1.2-2' }}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Liabilities & Equity -->
              <div class="bs-section">
                <h3>الخصوم</h3>
                <table class="report-table">
                  <tbody>
                    @for (account of balanceSheet()!.liabilities.accounts; track account.accountId) {
                      <tr>
                        <td>{{ account.code }}</td>
                        <td>{{ account.name }}</td>
                        <td class="number">{{ account.balance | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="subtotal-row">
                      <td colspan="2"><strong>إجمالي الخصوم</strong></td>
                      <td class="number"><strong>{{ balanceSheet()!.liabilities.total | number:'1.2-2' }}</strong></td>
                    </tr>
                  </tfoot>
                </table>

                <h3>حقوق الملكية</h3>
                <table class="report-table">
                  <tbody>
                    @for (account of balanceSheet()!.equity.accounts; track account.accountId) {
                      <tr>
                        <td>{{ account.code }}</td>
                        <td>{{ account.name }}</td>
                        <td class="number">{{ account.balance | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="subtotal-row">
                      <td colspan="2"><strong>إجمالي حقوق الملكية</strong></td>
                      <td class="number"><strong>{{ balanceSheet()!.equity.total | number:'1.2-2' }}</strong></td>
                    </tr>
                    <tr class="totals-row">
                      <td colspan="2"><strong>إجمالي الخصوم وحقوق الملكية</strong></td>
                      <td class="number"><strong>{{ balanceSheet()!.totalLiabilitiesAndEquity | number:'1.2-2' }}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="balance-status-bar" [class.balanced]="balanceSheet()!.isBalanced" [class.unbalanced]="!balanceSheet()!.isBalanced">
              {{ balanceSheet()!.isBalanced ? 'الميزانية متوازنة ✓' : 'الميزانية غير متوازنة ✗' }}
            </div>
          </div>
        }

        <!-- Journal Book -->
        @if (activeReport() === 'journal-book' && journalBook()) {
          <div class="report-card">
            <div class="report-header">
              <h2>دفتر اليومية</h2>
              <p>من {{ journalBook()!.periodStart | date:'yyyy/MM/dd' }} إلى {{ journalBook()!.periodEnd | date:'yyyy/MM/dd' }}</p>
            </div>
            
            @for (entry of journalBook()!.entries; track entry.id) {
              <div class="journal-entry-card">
                <div class="entry-header">
                  <span class="entry-number">{{ entry.entryNumber }}</span>
                  <span class="entry-date">{{ entry.entryDate | date:'yyyy/MM/dd' }}</span>
                  <span class="entry-description">{{ entry.description }}</span>
                </div>
                <table class="entry-lines-table">
                  <thead>
                    <tr>
                      <th>الحساب</th>
                      <th>البيان</th>
                      <th>مدين</th>
                      <th>دائن</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of entry.lines; track $index) {
                      <tr>
                        <td>{{ line.accountCode }} - {{ line.accountName }}</td>
                        <td>{{ line.description }}</td>
                        <td class="number">{{ line.debit > 0 ? (line.debit | number:'1.2-2') : '' }}</td>
                        <td class="number">{{ line.credit > 0 ? (line.credit | number:'1.2-2') : '' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            @empty {
              <div class="empty-state">
                <p>لا توجد قيود في هذه الفترة</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #64748b;
      margin: 0;
    }

    .report-types {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .report-type-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
      color: #475569;
    }

    .report-type-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .report-type-btn.active {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
    }

    .report-type-btn .icon {
      font-size: 20px;
    }

    .filters-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
    }

    .form-input {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      min-width: 160px;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-right: auto;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .report-content {
      position: relative;
      min-height: 400px;
    }

    .report-content.loading {
      opacity: 0.5;
    }

    .loading-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 10;
    }

    .spinner, .spinner-large {
      display: inline-block;
      border: 2px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner {
      width: 16px;
      height: 16px;
    }

    .spinner-large {
      width: 40px;
      height: 40px;
      border-width: 3px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      text-align: center;
      padding: 40px;
      color: #ef4444;
    }

    .report-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .report-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .report-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .report-header p {
      color: #64748b;
      margin: 0;
      font-size: 14px;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
    }

    .report-table th,
    .report-table td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid #f1f5f9;
    }

    .report-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 13px;
    }

    .report-table td {
      font-size: 14px;
      color: #334155;
    }

    .report-table .number {
      text-align: left;
      font-family: 'Courier New', monospace;
      direction: ltr;
    }

    .report-table .positive {
      color: #10b981;
    }

    .report-table .negative {
      color: #ef4444;
    }

    .empty-row {
      text-align: center !important;
      color: #94a3b8;
      font-style: italic;
    }

    .totals-row {
      background: #f8fafc;
    }

    .subtotal-row {
      background: #fafafa;
    }

    .balance-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .balance-status.balanced {
      background: #dcfce7;
      color: #166534;
    }

    .balance-status.unbalanced {
      background: #fee2e2;
      color: #991b1b;
    }

    .report-section {
      margin-bottom: 24px;
    }

    .report-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .net-income-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
    }

    .net-income-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
    }

    .net-income-card.profit {
      background: #dcfce7;
      color: #166534;
    }

    .net-income-card.loss {
      background: #fee2e2;
      color: #991b1b;
    }

    .balance-sheet-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .balance-sheet-grid {
        grid-template-columns: 1fr;
      }
    }

    .bs-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin: 16px 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .bs-section h3:first-child {
      margin-top: 0;
    }

    .balance-status-bar {
      margin-top: 24px;
      padding: 16px;
      text-align: center;
      border-radius: 8px;
      font-weight: 600;
    }

    .balance-status-bar.balanced {
      background: #dcfce7;
      color: #166534;
    }

    .balance-status-bar.unbalanced {
      background: #fee2e2;
      color: #991b1b;
    }

    .journal-entry-card {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .entry-header {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    .entry-number {
      font-weight: 600;
      color: #3b82f6;
    }

    .entry-date {
      color: #64748b;
    }

    .entry-description {
      color: #334155;
      flex: 1;
    }

    .entry-lines-table {
      width: 100%;
      border-collapse: collapse;
    }

    .entry-lines-table th,
    .entry-lines-table td {
      padding: 10px 16px;
      text-align: right;
      font-size: 13px;
    }

    .entry-lines-table th {
      background: #fafafa;
      font-weight: 500;
      color: #64748b;
    }

    .entry-lines-table td {
      border-top: 1px solid #f1f5f9;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);

  activeReport = signal<'trial-balance' | 'income-statement' | 'balance-sheet' | 'journal-book'>('trial-balance');
  loading = signal(false);
  error = signal<string | null>(null);

  startDate = '';
  endDate = '';
  asOfDate = '';

  trialBalance = signal<TrialBalanceReport | null>(null);
  incomeStatement = signal<IncomeStatementReport | null>(null);
  balanceSheet = signal<BalanceSheetReport | null>(null);
  journalBook = signal<any | null>(null);

  ngOnInit() {
    // Set default dates
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    this.startDate = this.formatDate(startOfYear);
    this.endDate = this.formatDate(today);
    this.asOfDate = this.formatDate(today);

    this.loadReport();
  }

  selectReport(type: 'trial-balance' | 'income-statement' | 'balance-sheet' | 'journal-book') {
    this.activeReport.set(type);
    this.error.set(null);
    this.loadReport();
  }

  async loadReport() {
    this.loading.set(true);
    this.error.set(null);

    try {
      switch (this.activeReport()) {
        case 'trial-balance':
          const tb = await this.api.get<TrialBalanceReport>(
            `reports/trial-balance?startDate=${this.startDate}&endDate=${this.endDate}`
          ).toPromise();
          this.trialBalance.set(tb || null);
          break;

        case 'income-statement':
          const is = await this.api.get<IncomeStatementReport>(
            `reports/income-statement?startDate=${this.startDate}&endDate=${this.endDate}`
          ).toPromise();
          this.incomeStatement.set(is || null);
          break;

        case 'balance-sheet':
          const bs = await this.api.get<BalanceSheetReport>(
            `reports/balance-sheet?asOfDate=${this.asOfDate}`
          ).toPromise();
          this.balanceSheet.set(bs || null);
          break;

        case 'journal-book':
          const jb = await this.api.get<any>(
            `reports/journal-book?startDate=${this.startDate}&endDate=${this.endDate}`
          ).toPromise();
          this.journalBook.set(jb || null);
          break;
      }
    } catch (err: any) {
      this.error.set(err.message || 'حدث خطأ أثناء تحميل التقرير');
    } finally {
      this.loading.set(false);
    }
  }

  exportReport() {
    // TODO: Implement PDF export
    alert('سيتم إضافة ميزة التصدير قريباً');
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
