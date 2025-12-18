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
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';

import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface Reconciliation {
  id: string;
  type: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  totalAmount: number;
  matchedAmount: number;
  createdAt: string;
}

interface ReconciliationRule {
  id: string;
  name: string;
  nameEn?: string;
  priority: number;
  matchFields: string[];
  tolerance?: { amount?: number; dateDays?: number };
  isActive: boolean;
}

@Component({
  selector: 'app-reconciliation-center',
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
    DatePickerModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,

    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">مركز التسوية</h1>
          <p class="text-gray-600">إدارة عمليات التسوية والمطابقة</p>
        </div>
        <div class="flex gap-2">
          <p-button
            label="تحديث"
            icon="pi pi-refresh"
            severity="secondary"
            (onClick)="loadData()"
          ></p-button>
          <p-button
            label="تسوية جديدة"
            icon="pi pi-plus"
            (onClick)="openNewReconciliation()"
          ></p-button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <p-card styleClass="bg-blue-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ statistics()?.total || 0 }}</div>
            <div class="text-gray-600">إجمالي التسويات</div>
          </div>
        </p-card>
        <p-card styleClass="bg-yellow-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-yellow-600">{{ statistics()?.byStatus?.draft || 0 }}</div>
            <div class="text-gray-600">مسودة</div>
          </div>
        </p-card>
        <p-card styleClass="bg-orange-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ statistics()?.byStatus?.in_progress || 0 }}</div>
            <div class="text-gray-600">قيد التنفيذ</div>
          </div>
        </p-card>
        <p-card styleClass="bg-purple-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ statistics()?.byStatus?.pending_review || 0 }}</div>
            <div class="text-gray-600">في انتظار المراجعة</div>
          </div>
        </p-card>
        <p-card styleClass="bg-green-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ statistics()?.byStatus?.finalized || 0 }}</div>
            <div class="text-gray-600">مكتملة</div>
          </div>
        </p-card>
      </div>

      <!-- Tabs -->
      <p-tabs value="0">
        <!-- التسويات -->
        <p-tabpanel value="0" header="التسويات">
          <p-card>
            <!-- Filters -->
            <div class="flex gap-4 mb-4">
              <p-select
                [(ngModel)]="filterType"
                [options]="reconciliationTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="النوع"
                [showClear]="true"
                (onChange)="loadReconciliations()"
              ></p-select>
              <p-select
                [(ngModel)]="filterStatus"
                [options]="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="الحالة"
                [showClear]="true"
                (onChange)="loadReconciliations()"
              ></p-select>
            </div>

            <p-table
              [value]="reconciliations()"
              [paginator]="true"
              [rows]="10"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} تسوية"
              styleClass="p-datatable-sm"
              [loading]="loading()"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>الفترة</th>
                  <th>الحالة</th>
                  <th>التقدم</th>
                  <th>المبلغ</th>
                  <th>الإجراءات</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-rec>
                <tr>
                  <td>{{ rec.name }}</td>
                  <td>
                    <p-tag [value]="getTypeLabel(rec.type)" [severity]="getTypeSeverity(rec.type)"></p-tag>
                  </td>
                  <td>
                    <div class="text-sm">
                      {{ rec.periodStart | date:'yyyy-MM-dd' }} - {{ rec.periodEnd | date:'yyyy-MM-dd' }}
                    </div>
                  </td>
                  <td>
                    <p-tag [value]="getStatusLabel(rec.status)" [severity]="getStatusSeverity(rec.status)"></p-tag>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-green-500 h-2 rounded-full"
                          [style.width.%]="getProgress(rec)"
                        ></div>
                      </div>
                      <span class="text-sm">{{ rec.matchedItems }}/{{ rec.totalItems }}</span>
                    </div>
                  </td>
                  <td class="font-mono">{{ formatCurrency(rec.totalAmount) }}</td>
                  <td>
                    <div class="flex gap-1">
                      <p-button
                        icon="pi pi-eye"
                        [rounded]="true"
                        [text]="true"
                        severity="info"
                        pTooltip="عرض التفاصيل"
                        (onClick)="viewReconciliation(rec)"
                      ></p-button>
                      <p-button
                        icon="pi pi-play"
                        [rounded]="true"
                        [text]="true"
                        severity="success"
                        pTooltip="تشغيل المطابقة التلقائية"
                        [disabled]="rec.status === 'finalized'"
                        (onClick)="runAutoMatch(rec)"
                      ></p-button>
                      <p-button
                        icon="pi pi-check-circle"
                        [rounded]="true"
                        [text]="true"
                        severity="warn"
                        pTooltip="إنهاء التسوية"
                        [disabled]="rec.status === 'finalized'"
                        (onClick)="finalizeReconciliation(rec)"
                      ></p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="7" class="text-center py-8 text-gray-500">
                    لا توجد تسويات
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </p-tabpanel>

        <!-- قواعد التسوية -->
        <p-tabpanel value="1" header="قواعد التسوية">
          <p-card>
            <div class="flex justify-end mb-4">
              <p-button
                label="إضافة قاعدة"
                icon="pi pi-plus"
                (onClick)="openNewRule()"
              ></p-button>
            </div>

            <p-table
              [value]="rules()"
              styleClass="p-datatable-sm"
              [loading]="rulesLoading()"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>الأولوية</th>
                  <th>الاسم</th>
                  <th>حقول المطابقة</th>
                  <th>التسامح</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-rule>
                <tr>
                  <td class="text-center">
                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{{ rule.priority }}</span>
                  </td>
                  <td>
                    <div>{{ rule.name }}</div>
                    <div class="text-xs text-gray-500" *ngIf="rule.nameEn">{{ rule.nameEn }}</div>
                  </td>
                  <td>
                    <div class="flex gap-1 flex-wrap">
                      <span *ngFor="let field of rule.matchFields" class="bg-gray-100 px-2 py-1 rounded text-sm">
                        {{ getFieldLabel(field) }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div *ngIf="rule.tolerance">
                      <div *ngIf="rule.tolerance.amount">مبلغ: {{ rule.tolerance.amount }}</div>
                      <div *ngIf="rule.tolerance.dateDays">أيام: {{ rule.tolerance.dateDays }}</div>
                    </div>
                    <span *ngIf="!rule.tolerance">-</span>
                  </td>
                  <td>
                    <p-tag [value]="rule.isActive ? 'نشط' : 'معطل'" [severity]="rule.isActive ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <p-button
                        icon="pi pi-pencil"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        (onClick)="editRule(rule)"
                      ></p-button>
                      <p-button
                        icon="pi pi-trash"
                        [rounded]="true"
                        [text]="true"
                        severity="danger"
                        (onClick)="deleteRule(rule)"
                      ></p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="text-center py-8 text-gray-500">
                    لا توجد قواعد تسوية
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </p-tabpanel>
      </p-tabs>

      <!-- New Reconciliation Dialog -->
      <p-dialog
        [(visible)]="showReconciliationDialog"
        header="تسوية جديدة"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">الاسم *</label>
            <input pInputText [(ngModel)]="reconciliationForm.name" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">النوع *</label>
            <p-select
              [(ngModel)]="reconciliationForm.type"
              [options]="reconciliationTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="اختر النوع"
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">من تاريخ *</label>
              <p-datepicker
                [(ngModel)]="reconciliationForm.periodStart"
                dateFormat="yy-mm-dd"
                styleClass="w-full"
              ></p-datepicker>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">إلى تاريخ *</label>
              <p-datepicker
                [(ngModel)]="reconciliationForm.periodEnd"
                dateFormat="yy-mm-dd"
                styleClass="w-full"
              ></p-datepicker>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="إلغاء" severity="secondary" (onClick)="showReconciliationDialog = false"></p-button>
          <p-button label="إنشاء" (onClick)="createReconciliation()"></p-button>
        </ng-template>
      </p-dialog>

      <!-- Rule Dialog -->
      <p-dialog
        [(visible)]="showRuleDialog"
        [header]="editRuleMode ? 'تعديل قاعدة' : 'إضافة قاعدة'"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">الاسم *</label>
            <input pInputText [(ngModel)]="ruleForm.name" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">الاسم (إنجليزي)</label>
            <input pInputText [(ngModel)]="ruleForm.nameEn" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">الأولوية</label>
            <p-select
              [(ngModel)]="ruleForm.priority"
              [options]="[1,2,3,4,5]"
              styleClass="w-full"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">حقول المطابقة *</label>
            <div class="flex flex-col gap-2">
              <div *ngFor="let field of matchFieldOptions" class="flex items-center gap-2">
                <p-checkbox
                  [(ngModel)]="ruleForm.matchFields"
                  [value]="field.value"
                  [inputId]="field.value"
                ></p-checkbox>
                <label [for]="field.value">{{ field.label }}</label>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">تسامح المبلغ</label>
              <input pInputText type="number" [(ngModel)]="ruleForm.toleranceAmount" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">تسامح الأيام</label>
              <input pInputText type="number" [(ngModel)]="ruleForm.toleranceDays" class="w-full" />
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="إلغاء" severity="secondary" (onClick)="showRuleDialog = false"></p-button>
          <p-button [label]="editRuleMode ? 'تحديث' : 'إضافة'" (onClick)="saveRule()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class ReconciliationCenterComponent implements OnInit {
  reconciliations = signal<Reconciliation[]>([]);
  rules = signal<ReconciliationRule[]>([]);
  statistics = signal<any>(null);
  loading = signal(false);
  rulesLoading = signal(false);

  showReconciliationDialog = false;
  showRuleDialog = false;
  editRuleMode = false;
  selectedRule: ReconciliationRule | null = null;

  filterType: string | null = null;
  filterStatus: string | null = null;

  reconciliationForm = {
    name: '',
    type: 'bank',
    periodStart: null as Date | null,
    periodEnd: null as Date | null,
  };

  ruleForm = {
    name: '',
    nameEn: '',
    priority: 1,
    matchFields: [] as string[],
    toleranceAmount: 0,
    toleranceDays: 0,
  };

  reconciliationTypes = [
    { label: 'تسوية البنك', value: 'bank' },
    { label: 'تسوية الإيرادات', value: 'revenue' },
    { label: 'تسوية المصروفات', value: 'expense' },
    { label: 'تسوية الذمم', value: 'receivable' },
  ];

  statusOptions = [
    { label: 'مسودة', value: 'draft' },
    { label: 'قيد التنفيذ', value: 'in_progress' },
    { label: 'في انتظار المراجعة', value: 'pending_review' },
    { label: 'مكتملة', value: 'finalized' },
    { label: 'ملغاة', value: 'cancelled' },
  ];

  matchFieldOptions = [
    { label: 'رقم المرجع', value: 'reference_number' },
    { label: 'المبلغ', value: 'amount' },
    { label: 'التاريخ', value: 'date' },
    { label: 'الوصف', value: 'description' },
  ];

  constructor(
    private api: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadStatistics();
    this.loadReconciliations();
    this.loadRules();
  }

  loadStatistics() {
    this.api.get<any>('reconciliation/statistics').subscribe({
      next: (data) => this.statistics.set(data),
      error: () => {},
    });
  }

  loadReconciliations() {
    this.loading.set(true);
    let url = 'reconciliation';
    const params: string[] = [];
    if (this.filterType) params.push(`type=${this.filterType}`);
    if (this.filterStatus) params.push(`status=${this.filterStatus}`);
    if (params.length > 0) url += '?' + params.join('&');

    this.api.get<any>(url).subscribe({
      next: (data) => {
        this.reconciliations.set(data.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadRules() {
    this.rulesLoading.set(true);
    this.api.get<any>('reconciliation/rules/list').subscribe({
      next: (data) => {
        this.rules.set(data || []);
        this.rulesLoading.set(false);
      },
      error: () => {
        this.rulesLoading.set(false);
      },
    });
  }

  openNewReconciliation() {
    this.reconciliationForm = {
      name: '',
      type: 'bank',
      periodStart: null,
      periodEnd: null,
    };
    this.showReconciliationDialog = true;
  }

  createReconciliation() {
    if (!this.reconciliationForm.name || !this.reconciliationForm.type ||
        !this.reconciliationForm.periodStart || !this.reconciliationForm.periodEnd) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    const payload = {
      name: this.reconciliationForm.name,
      type: this.reconciliationForm.type,
      periodStart: this.formatDate(this.reconciliationForm.periodStart),
      periodEnd: this.formatDate(this.reconciliationForm.periodEnd),
    };

    this.api.post<any>('reconciliation', payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم إنشاء التسوية بنجاح',
        });
        this.showReconciliationDialog = false;
        this.loadData();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في إنشاء التسوية',
        });
      },
    });
  }

  viewReconciliation(rec: Reconciliation) {
    // TODO: Navigate to reconciliation details page
    this.messageService.add({
      severity: 'info',
      summary: 'معلومات',
      detail: 'سيتم إضافة صفحة التفاصيل قريباً',
    });
  }

  runAutoMatch(rec: Reconciliation) {
    this.confirmationService.confirm({
      message: 'هل تريد تشغيل المطابقة التلقائية؟',
      header: 'تأكيد',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.post<any>('reconciliation/auto-match', { reconciliationId: rec.id }).subscribe({
          next: (result) => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: `تم مطابقة ${result.matchedCount} عنصر`,
            });
            this.loadReconciliations();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: err.error?.message || 'فشل في تشغيل المطابقة',
            });
          },
        });
      },
    });
  }

  finalizeReconciliation(rec: Reconciliation) {
    this.confirmationService.confirm({
      message: 'هل تريد إنهاء هذه التسوية؟ لن يمكن التعديل عليها بعد ذلك.',
      header: 'تأكيد الإنهاء',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.post<any>(`reconciliation/${rec.id}/finalize`, {}).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم إنهاء التسوية بنجاح',
            });
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: err.error?.message || 'فشل في إنهاء التسوية',
            });
          },
        });
      },
    });
  }

  openNewRule() {
    this.editRuleMode = false;
    this.ruleForm = {
      name: '',
      nameEn: '',
      priority: 1,
      matchFields: [],
      toleranceAmount: 0,
      toleranceDays: 0,
    };
    this.showRuleDialog = true;
  }

  editRule(rule: ReconciliationRule) {
    this.editRuleMode = true;
    this.selectedRule = rule;
    this.ruleForm = {
      name: rule.name,
      nameEn: rule.nameEn || '',
      priority: rule.priority,
      matchFields: [...rule.matchFields],
      toleranceAmount: rule.tolerance?.amount || 0,
      toleranceDays: rule.tolerance?.dateDays || 0,
    };
    this.showRuleDialog = true;
  }

  saveRule() {
    if (!this.ruleForm.name || this.ruleForm.matchFields.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء الاسم واختيار حقل مطابقة واحد على الأقل',
      });
      return;
    }

    const payload = {
      name: this.ruleForm.name,
      nameEn: this.ruleForm.nameEn || undefined,
      priority: this.ruleForm.priority,
      matchFields: this.ruleForm.matchFields,
      tolerance: {
        amount: this.ruleForm.toleranceAmount || undefined,
        dateDays: this.ruleForm.toleranceDays || undefined,
      },
    };

    const endpoint = this.editRuleMode
      ? `reconciliation/rules/${this.selectedRule?.id}`
      : 'reconciliation/rules';
    const method = this.editRuleMode ? 'put' : 'post';

    this.api[method]<any>(endpoint, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: this.editRuleMode ? 'تم تحديث القاعدة' : 'تم إضافة القاعدة',
        });
        this.showRuleDialog = false;
        this.loadRules();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في حفظ القاعدة',
        });
      },
    });
  }

  deleteRule(rule: ReconciliationRule) {
    this.confirmationService.confirm({
      message: `هل تريد حذف قاعدة "${rule.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete<any>(`reconciliation/rules/${rule.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم حذف القاعدة',
            });
            this.loadRules();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: err.error?.message || 'فشل في حذف القاعدة',
            });
          },
        });
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

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getProgress(rec: Reconciliation): number {
    if (rec.totalItems === 0) return 0;
    return (rec.matchedItems / rec.totalItems) * 100;
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
      draft: 'مسودة',
      in_progress: 'قيد التنفيذ',
      pending_review: 'في انتظار المراجعة',
      finalized: 'مكتملة',
      cancelled: 'ملغاة',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      draft: 'secondary',
      in_progress: 'info',
      pending_review: 'warn',
      finalized: 'success',
      cancelled: 'danger',
    };
    return severities[status] || 'secondary';
  }

  getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      reference_number: 'رقم المرجع',
      amount: 'المبلغ',
      date: 'التاريخ',
      description: 'الوصف',
    };
    return labels[field] || field;
  }
}
