import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface ClearingAccount {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  type: string;
  linkedAccountId?: string;
  linkedAccount?: { name: string; code: string };
  balance: number;
  pendingCount: number;
  pendingAmount: number;
  isActive: boolean;
}

interface ClearingEntry {
  id: string;
  clearingAccountId: string;
  entryDate: string;
  referenceNumber: string;
  description: string;
  amount: number;
  status: string;
  sourceSystem?: string;
  createdAt: string;
}

@Component({
  selector: 'app-clearing-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">الحسابات الوسيطة</h1>
          <p class="text-gray-600">إدارة الحسابات الوسيطة ومتابعة الأرصدة</p>
        </div>
        <div class="flex gap-2">
          <p-button
            label="تحديث"
            icon="pi pi-refresh"
            severity="secondary"
            (onClick)="loadData()"
          ></p-button>
          <p-button
            label="إضافة حساب"
            icon="pi pi-plus"
            (onClick)="openNewDialog()"
          ></p-button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card styleClass="bg-blue-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ statistics()?.totals?.totalAccounts || 0 }}</div>
            <div class="text-gray-600">إجمالي الحسابات</div>
          </div>
        </p-card>
        <p-card styleClass="bg-orange-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ statistics()?.totals?.totalPendingEntries || 0 }}</div>
            <div class="text-gray-600">قيود معلقة</div>
          </div>
        </p-card>
        <p-card styleClass="bg-green-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ formatCurrency(statistics()?.totals?.totalPendingAmount || 0) }}</div>
            <div class="text-gray-600">إجمالي المعلق</div>
          </div>
        </p-card>
        <p-card styleClass="bg-purple-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ activeAccountsCount() }}</div>
            <div class="text-gray-600">حسابات نشطة</div>
          </div>
        </p-card>
      </div>

      <!-- Accounts Table -->
      <p-card>
        <p-table
          [value]="accounts()"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} حساب"
          [rowsPerPageOptions]="[10, 25, 50]"
          styleClass="p-datatable-sm"
          [loading]="loading()"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>الكود</th>
              <th>الاسم</th>
              <th>النوع</th>
              <th>الرصيد</th>
              <th>قيود معلقة</th>
              <th>مبلغ معلق</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-account>
            <tr>
              <td class="font-mono">{{ account.code }}</td>
              <td>
                <div>{{ account.name }}</div>
                <div class="text-xs text-gray-500" *ngIf="account.nameEn">{{ account.nameEn }}</div>
              </td>
              <td>
                <p-tag [value]="getTypeLabel(account.type)" [severity]="getTypeSeverity(account.type)"></p-tag>
              </td>
              <td class="font-mono" [class.text-red-600]="account.balance < 0" [class.text-green-600]="account.balance > 0">
                {{ formatCurrency(account.balance) }}
              </td>
              <td class="text-center">
                <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                  {{ account.pendingCount }}
                </span>
              </td>
              <td class="font-mono">{{ formatCurrency(account.pendingAmount) }}</td>
              <td>
                <p-tag [value]="account.isActive ? 'نشط' : 'معطل'" [severity]="account.isActive ? 'success' : 'danger'"></p-tag>
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="عرض القيود"
                    (onClick)="viewEntries(account)"
                  ></p-button>
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    pTooltip="تعديل"
                    (onClick)="editAccount(account)"
                  ></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-8 text-gray-500">
                لا توجد حسابات وسيطة
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Account Dialog -->
      <p-dialog
        [(visible)]="showDialog"
        [header]="editMode ? 'تعديل حساب وسيط' : 'إضافة حساب وسيط'"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">الكود *</label>
            <input pInputText [(ngModel)]="formData.code" class="w-full" [disabled]="editMode" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">الاسم *</label>
            <input pInputText [(ngModel)]="formData.name" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">الاسم (إنجليزي)</label>
            <input pInputText [(ngModel)]="formData.nameEn" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">النوع *</label>
            <p-select
              [(ngModel)]="formData.type"
              [options]="accountTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="اختر النوع"
              styleClass="w-full"
            ></p-select>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="إلغاء" severity="secondary" (onClick)="showDialog = false"></p-button>
          <p-button [label]="editMode ? 'تحديث' : 'إضافة'" (onClick)="saveAccount()"></p-button>
        </ng-template>
      </p-dialog>

      <!-- Entries Dialog -->
      <p-dialog
        [(visible)]="showEntriesDialog"
        [header]="'قيود حساب: ' + selectedAccount?.name"
        [modal]="true"
        [style]="{ width: '900px' }"
      >
        <p-table
          [value]="entries()"
          [paginator]="true"
          [rows]="10"
          styleClass="p-datatable-sm"
          [loading]="entriesLoading()"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>التاريخ</th>
              <th>المرجع</th>
              <th>الوصف</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>المصدر</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-entry>
            <tr>
              <td>{{ entry.entryDate | date:'yyyy-MM-dd' }}</td>
              <td class="font-mono">{{ entry.referenceNumber }}</td>
              <td>{{ entry.description }}</td>
              <td class="font-mono" [class.text-red-600]="entry.amount < 0" [class.text-green-600]="entry.amount > 0">
                {{ formatCurrency(entry.amount) }}
              </td>
              <td>
                <p-tag [value]="getStatusLabel(entry.status)" [severity]="getStatusSeverity(entry.status)"></p-tag>
              </td>
              <td>{{ entry.sourceSystem || '-' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-4 text-gray-500">
                لا توجد قيود
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>
    </div>
  `,
})
export class ClearingAccountsComponent implements OnInit {
  accounts = signal<ClearingAccount[]>([]);
  entries = signal<ClearingEntry[]>([]);
  statistics = signal<any>(null);
  loading = signal(false);
  entriesLoading = signal(false);

  showDialog = false;
  showEntriesDialog = false;
  editMode = false;
  selectedAccount: ClearingAccount | null = null;

  formData = {
    code: '',
    name: '',
    nameEn: '',
    type: 'bank',
  };

  accountTypes = [
    { label: 'بنك', value: 'bank' },
    { label: 'إيرادات', value: 'revenue' },
    { label: 'مصروفات', value: 'expense' },
    { label: 'ذمم', value: 'receivable' },
  ];

  activeAccountsCount = computed(() => this.accounts().filter(a => a.isActive).length);

  constructor(
    private api: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.get<any>('clearing/statistics').subscribe({
      next: (data) => {
        this.statistics.set(data);
        this.accounts.set(data.accounts || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في تحميل البيانات',
        });
        this.loading.set(false);
      },
    });
  }

  openNewDialog() {
    this.editMode = false;
    this.formData = { code: '', name: '', nameEn: '', type: 'bank' };
    this.showDialog = true;
  }

  editAccount(account: ClearingAccount) {
    this.editMode = true;
    this.selectedAccount = account;
    this.formData = {
      code: account.code,
      name: account.name,
      nameEn: account.nameEn || '',
      type: account.type,
    };
    this.showDialog = true;
  }

  saveAccount() {
    if (!this.formData.code || !this.formData.name || !this.formData.type) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    const endpoint = this.editMode
      ? `clearing/accounts/${this.selectedAccount?.id}`
      : 'clearing/accounts';
    const method = this.editMode ? 'put' : 'post';

    this.api[method]<any>(endpoint, this.formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: this.editMode ? 'تم تحديث الحساب' : 'تم إضافة الحساب',
        });
        this.showDialog = false;
        this.loadData();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في حفظ الحساب',
        });
      },
    });
  }

  viewEntries(account: ClearingAccount) {
    this.selectedAccount = account;
    this.showEntriesDialog = true;
    this.loadEntries(account.id);
  }

  loadEntries(accountId: string) {
    this.entriesLoading.set(true);
    this.api.get<any>(`clearing/accounts/${accountId}`).subscribe({
      next: (data) => {
        this.entries.set(data.entries || []);
        this.entriesLoading.set(false);
      },
      error: () => {
        this.entriesLoading.set(false);
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-YE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      bank: 'بنك',
      revenue: 'إيرادات',
      expense: 'مصروفات',
      receivable: 'ذمم',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      bank: 'info',
      revenue: 'success',
      expense: 'danger',
      receivable: 'warn',
    };
    return severities[type] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'معلق',
      matched: 'مطابق',
      allocated: 'موزع',
      cancelled: 'ملغي',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      pending: 'warn',
      matched: 'success',
      allocated: 'info',
      cancelled: 'danger',
    };
    return severities[status] || 'secondary';
  }
}
