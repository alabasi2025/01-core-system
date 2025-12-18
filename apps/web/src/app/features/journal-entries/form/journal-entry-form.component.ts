import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Account } from '../../../core/models';

interface EntryLine {
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description: string;
}

@Component({
  selector: 'app-journal-entry-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="form-page">
      <div class="page-header">
        <a routerLink="/journal-entries" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          العودة للقيود اليومية
        </a>
        <h1>{{ isEditMode() ? 'تعديل قيد يومي' : 'إضافة قيد يومي جديد' }}</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      } @else {
        <form class="form-container" (ngSubmit)="onSubmit()">
          <!-- Entry Header -->
          <div class="form-card">
            <h2>معلومات القيد</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="entryDate">تاريخ القيد <span class="required">*</span></label>
                <input type="date" id="entryDate" [(ngModel)]="formData.entryDate" name="entryDate" required>
              </div>
              
              <div class="form-group">
                <label for="reference">المرجع</label>
                <input type="text" id="reference" [(ngModel)]="formData.reference" name="reference" 
                       placeholder="رقم الفاتورة أو المرجع">
              </div>
            </div>

            <div class="form-group">
              <label for="description">وصف القيد <span class="required">*</span></label>
              <textarea id="description" [(ngModel)]="formData.description" name="description" 
                        rows="2" placeholder="وصف القيد اليومي" required></textarea>
            </div>
          </div>

          <!-- Entry Lines -->
          <div class="form-card">
            <div class="card-header-row">
              <h2>بنود القيد</h2>
              <button type="button" class="btn btn-sm btn-primary" (click)="addLine()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                إضافة بند
              </button>
            </div>

            <div class="lines-table">
              <div class="table-header">
                <div class="col-account">الحساب</div>
                <div class="col-debit">مدين</div>
                <div class="col-credit">دائن</div>
                <div class="col-desc">البيان</div>
                <div class="col-actions"></div>
              </div>
              
              @for (line of lines(); track $index; let i = $index) {
                <div class="table-row">
                  <div class="col-account">
                    <select [(ngModel)]="line.accountId" [name]="'account_' + i" required>
                      <option value="">اختر الحساب</option>
                      @for (account of accounts(); track account.id) {
                        <option [value]="account.id">{{ account.code }} - {{ account.nameAr || account.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-debit">
                    <input type="number" [(ngModel)]="line.debit" [name]="'debit_' + i" 
                           min="0" step="0.01" placeholder="0.00"
                           (input)="onDebitChange(line)">
                  </div>
                  <div class="col-credit">
                    <input type="number" [(ngModel)]="line.credit" [name]="'credit_' + i" 
                           min="0" step="0.01" placeholder="0.00"
                           (input)="onCreditChange(line)">
                  </div>
                  <div class="col-desc">
                    <input type="text" [(ngModel)]="line.description" [name]="'desc_' + i" 
                           placeholder="البيان">
                  </div>
                  <div class="col-actions">
                    @if (lines().length > 2) {
                      <button type="button" class="btn-icon danger" (click)="removeLine(i)" title="حذف">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Totals Row -->
              <div class="table-row totals">
                <div class="col-account">
                  <strong>الإجمالي</strong>
                </div>
                <div class="col-debit">
                  <strong [class.error]="!isBalanced()">{{ totalDebit() | number:'1.2-2' }}</strong>
                </div>
                <div class="col-credit">
                  <strong [class.error]="!isBalanced()">{{ totalCredit() | number:'1.2-2' }}</strong>
                </div>
                <div class="col-desc">
                  @if (!isBalanced()) {
                    <span class="balance-error">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      القيد غير متوازن
                    </span>
                  } @else {
                    <span class="balance-ok">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      القيد متوازن
                    </span>
                  }
                </div>
                <div class="col-actions"></div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" routerLink="/journal-entries">إلغاء</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving() || !isBalanced() || !isValid()">
              @if (saving()) {
                <div class="btn-spinner"></div>
                جاري الحفظ...
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {{ isEditMode() ? 'حفظ التغييرات' : 'إضافة القيد' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-page {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 16px;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #374151;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      color: #1f2937;
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
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-card h2 {
      margin: 0 0 24px 0;
      font-size: 18px;
      color: #1f2937;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header-row h2 {
      margin: 0;
      padding: 0;
      border: none;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .required {
      color: #dc2626;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .lines-table {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr 50px;
      gap: 12px;
      padding: 12px 16px;
      background: #f9fafb;
      font-weight: 600;
      font-size: 13px;
      color: #6b7280;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr 50px;
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      align-items: center;
    }

    .table-row.totals {
      background: #f9fafb;
      font-size: 15px;
    }

    .table-row select,
    .table-row input {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      width: 100%;
    }

    .table-row select:focus,
    .table-row input:focus {
      outline: none;
      border-color: #6366f1;
    }

    .table-row input[type="number"] {
      text-align: left;
      direction: ltr;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: #f3f4f6;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .balance-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #dc2626;
      font-size: 13px;
    }

    .balance-ok {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #16a34a;
      font-size: 13px;
    }

    .error {
      color: #dc2626;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-sm {
      padding: 8px 16px;
      font-size: 13px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .table-header > div:not(:first-child) {
        display: none;
      }
    }
  `]
})
export class JournalEntryFormComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  entryId = signal<string | null>(null);
  accounts = signal<Account[]>([]);
  lines = signal<EntryLine[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' }
  ]);

  formData = {
    entryDate: new Date().toISOString().split('T')[0],
    reference: '',
    description: ''
  };

  totalDebit = computed(() => {
    return this.lines().reduce((sum, line) => sum + (line.debit || 0), 0);
  });

  totalCredit = computed(() => {
    return this.lines().reduce((sum, line) => sum + (line.credit || 0), 0);
  });

  isBalanced = computed(() => {
    return Math.abs(this.totalDebit() - this.totalCredit()) < 0.01 && this.totalDebit() > 0;
  });

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.entryId.set(id);
      this.isEditMode.set(true);
      this.loadEntry(id);
    }
  }

  loadAccounts(): void {
    this.apiService.getAccounts().subscribe({
      next: (data: any) => {
        const accounts = data.data || data || [];
        // Filter only leaf accounts (accounts that can have transactions)
        this.accounts.set(accounts);
      }
    });
  }

  loadEntry(id: string): void {
    this.loading.set(true);
    this.apiService.getJournalEntry(id).subscribe({
      next: (entry: any) => {
        const e = entry.data || entry;
        this.formData = {
          entryDate: e.entryDate ? e.entryDate.split('T')[0] : '',
          reference: e.reference || '',
          description: e.description || ''
        };
        
        if (e.lines && e.lines.length > 0) {
          this.lines.set(e.lines.map((l: any) => ({
            accountId: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            description: l.description || ''
          })));
        }
        
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/journal-entries']);
      }
    });
  }

  addLine(): void {
    this.lines.update(lines => [...lines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  }

  removeLine(index: number): void {
    if (this.lines().length > 2) {
      this.lines.update(lines => lines.filter((_, i) => i !== index));
    }
  }

  onDebitChange(line: EntryLine): void {
    if (line.debit > 0) {
      line.credit = 0;
    }
  }

  onCreditChange(line: EntryLine): void {
    if (line.credit > 0) {
      line.debit = 0;
    }
  }

  isValid(): boolean {
    if (!this.formData.entryDate || !this.formData.description) {
      return false;
    }
    
    const validLines = this.lines().filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    return validLines.length >= 2;
  }

  onSubmit(): void {
    if (!this.isValid() || !this.isBalanced()) {
      return;
    }

    this.saving.set(true);
    
    const validLines = this.lines()
      .filter(l => l.accountId && (l.debit > 0 || l.credit > 0))
      .map(l => ({
        accountId: l.accountId,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || ''
      }));

    const data = {
      entryDate: this.formData.entryDate,
      reference: this.formData.reference || null,
      description: this.formData.description,
      lines: validLines
    };

    const request = this.isEditMode()
      ? this.apiService.updateJournalEntry(this.entryId()!, data)
      : this.apiService.createJournalEntry(data);

    request.subscribe({
      next: () => {
        this.router.navigate(['/journal-entries']);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
