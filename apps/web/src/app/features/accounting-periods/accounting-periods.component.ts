import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

interface AccountingPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  closedAt?: Date;
  entriesCount?: number;
  postedEntriesCount?: number;
  draftEntriesCount?: number;
}

interface PeriodStatistics {
  total: number;
  open: number;
  closed: number;
  currentPeriod: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  } | null;
}

@Component({
  selector: 'app-accounting-periods',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CalendarModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    CardModule,
    ProgressBarModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="p-4">
      <!-- العنوان -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">الفترات المحاسبية</h1>
          <p class="text-gray-500">إدارة الفترات المحاسبية وإغلاقها</p>
        </div>
        <button
          pButton
          label="فترة جديدة"
          icon="pi pi-plus"
          class="p-button-primary"
          (click)="openNewDialog()"
        ></button>
      </div>

      <!-- الإحصائيات -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card styleClass="shadow-sm">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ statistics?.total || 0 }}</div>
            <div class="text-gray-500 mt-1">إجمالي الفترات</div>
          </div>
        </p-card>

        <p-card styleClass="shadow-sm">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ statistics?.open || 0 }}</div>
            <div class="text-gray-500 mt-1">فترات مفتوحة</div>
          </div>
        </p-card>

        <p-card styleClass="shadow-sm">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-600">{{ statistics?.closed || 0 }}</div>
            <div class="text-gray-500 mt-1">فترات مغلقة</div>
          </div>
        </p-card>

        <p-card styleClass="shadow-sm">
          <div class="text-center">
            <div class="text-lg font-bold text-purple-600">
              {{ statistics?.currentPeriod?.name || 'لا توجد' }}
            </div>
            <div class="text-gray-500 mt-1">الفترة الحالية</div>
          </div>
        </p-card>
      </div>

      <!-- جدول الفترات -->
      <p-card>
        <p-table
          [value]="periods"
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} فترة"
          [rowsPerPageOptions]="[10, 25, 50]"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>اسم الفترة</th>
              <th>تاريخ البداية</th>
              <th>تاريخ النهاية</th>
              <th>عدد القيود</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-period>
            <tr>
              <td>
                <span class="font-semibold">{{ period.name }}</span>
              </td>
              <td>{{ period.startDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ period.endDate | date:'yyyy-MM-dd' }}</td>
              <td>
                <div class="flex flex-col">
                  <span>{{ period.entriesCount || 0 }} قيد</span>
                  <small class="text-gray-500">
                    {{ period.postedEntriesCount || 0 }} مرحل |
                    {{ period.draftEntriesCount || 0 }} مسودة
                  </small>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="period.isClosed ? 'مغلقة' : 'مفتوحة'"
                  [severity]="period.isClosed ? 'secondary' : 'success'"
                ></p-tag>
              </td>
              <td>
                <div class="flex gap-1">
                  <button
                    pButton
                    icon="pi pi-eye"
                    class="p-button-text p-button-sm"
                    pTooltip="عرض التفاصيل"
                    (click)="viewDetails(period)"
                  ></button>
                  <button
                    *ngIf="!period.isClosed"
                    pButton
                    icon="pi pi-pencil"
                    class="p-button-text p-button-sm"
                    pTooltip="تعديل"
                    (click)="editPeriod(period)"
                  ></button>
                  <button
                    *ngIf="!period.isClosed"
                    pButton
                    icon="pi pi-lock"
                    class="p-button-text p-button-warning p-button-sm"
                    pTooltip="إغلاق الفترة"
                    (click)="confirmClose(period)"
                  ></button>
                  <button
                    *ngIf="period.isClosed"
                    pButton
                    icon="pi pi-lock-open"
                    class="p-button-text p-button-info p-button-sm"
                    pTooltip="إعادة فتح"
                    (click)="confirmReopen(period)"
                  ></button>
                  <button
                    *ngIf="!period.isClosed && period.entriesCount === 0"
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    pTooltip="حذف"
                    (click)="confirmDelete(period)"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-8">
                <i class="pi pi-calendar text-4xl text-gray-300 mb-2"></i>
                <p class="text-gray-500">لا توجد فترات محاسبية</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- نافذة إنشاء/تعديل فترة -->
      <p-dialog
        [(visible)]="showDialog"
        [header]="editMode ? 'تعديل فترة محاسبية' : 'إنشاء فترة محاسبية جديدة'"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">اسم الفترة *</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="periodForm.name"
              class="w-full"
              placeholder="مثال: الربع الأول 2025"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية *</label>
              <p-calendar
                [(ngModel)]="periodForm.startDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                styleClass="w-full"
              ></p-calendar>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">تاريخ النهاية *</label>
              <p-calendar
                [(ngModel)]="periodForm.endDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                styleClass="w-full"
              ></p-calendar>
            </div>
          </div>

          <!-- اختصارات سريعة -->
          <div *ngIf="!editMode">
            <label class="block text-sm font-medium text-gray-700 mb-2">اختصارات سريعة</label>
            <div class="flex gap-2 flex-wrap">
              <button
                pButton
                label="شهر"
                class="p-button-outlined p-button-sm"
                (click)="setQuickPeriod('month')"
              ></button>
              <button
                pButton
                label="ربع سنة"
                class="p-button-outlined p-button-sm"
                (click)="setQuickPeriod('quarter')"
              ></button>
              <button
                pButton
                label="نصف سنة"
                class="p-button-outlined p-button-sm"
                (click)="setQuickPeriod('half')"
              ></button>
              <button
                pButton
                label="سنة كاملة"
                class="p-button-outlined p-button-sm"
                (click)="setQuickPeriod('year')"
              ></button>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button
            pButton
            label="إلغاء"
            icon="pi pi-times"
            class="p-button-text"
            (click)="showDialog = false"
          ></button>
          <button
            pButton
            [label]="editMode ? 'حفظ التعديلات' : 'إنشاء'"
            icon="pi pi-check"
            class="p-button-primary"
            [loading]="saving"
            (click)="savePeriod()"
          ></button>
        </ng-template>
      </p-dialog>

      <!-- نافذة تفاصيل الفترة -->
      <p-dialog
        [(visible)]="showDetailsDialog"
        header="تفاصيل الفترة المحاسبية"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div *ngIf="selectedPeriod" class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-500">اسم الفترة</label>
              <p class="font-semibold">{{ selectedPeriod.name }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">الحالة</label>
              <p>
                <p-tag
                  [value]="selectedPeriod.isClosed ? 'مغلقة' : 'مفتوحة'"
                  [severity]="selectedPeriod.isClosed ? 'secondary' : 'success'"
                ></p-tag>
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500">تاريخ البداية</label>
              <p class="font-semibold">{{ selectedPeriod.startDate | date:'yyyy-MM-dd' }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500">تاريخ النهاية</label>
              <p class="font-semibold">{{ selectedPeriod.endDate | date:'yyyy-MM-dd' }}</p>
            </div>
          </div>

          <hr />

          <div *ngIf="periodDetails">
            <h4 class="font-semibold mb-3">إحصائيات الفترة</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-3 rounded">
                <div class="text-2xl font-bold text-blue-600">
                  {{ periodDetails.statistics?.entriesCount || 0 }}
                </div>
                <div class="text-sm text-gray-600">إجمالي القيود</div>
              </div>
              <div class="bg-green-50 p-3 rounded">
                <div class="text-2xl font-bold text-green-600">
                  {{ periodDetails.statistics?.postedEntriesCount || 0 }}
                </div>
                <div class="text-sm text-gray-600">قيود مرحلة</div>
              </div>
              <div class="bg-yellow-50 p-3 rounded">
                <div class="text-2xl font-bold text-yellow-600">
                  {{ periodDetails.statistics?.draftEntriesCount || 0 }}
                </div>
                <div class="text-sm text-gray-600">قيود مسودة</div>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <div class="text-2xl font-bold text-purple-600">
                  {{ periodDetails.statistics?.totalDebit | number:'1.2-2' }}
                </div>
                <div class="text-sm text-gray-600">إجمالي المدين</div>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button
            pButton
            label="إغلاق"
            icon="pi pi-times"
            class="p-button-text"
            (click)="showDetailsDialog = false"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class AccountingPeriodsComponent implements OnInit {
  periods: AccountingPeriod[] = [];
  statistics: PeriodStatistics | null = null;
  loading = false;
  saving = false;

  showDialog = false;
  showDetailsDialog = false;
  editMode = false;

  selectedPeriod: AccountingPeriod | null = null;
  periodDetails: any = null;

  periodForm = {
    id: '',
    name: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  };

  private apiUrl = '/api/v1/accounting-periods';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadPeriods();
    this.loadStatistics();
  }

  loadPeriods() {
    this.loading = true;
    this.http.get<AccountingPeriod[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.periods = data;
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في تحميل الفترات المحاسبية',
        });
        this.loading = false;
      },
    });
  }

  loadStatistics() {
    this.http.get<PeriodStatistics>(`${this.apiUrl}/statistics`).subscribe({
      next: (data) => {
        this.statistics = data;
      },
    });
  }

  openNewDialog() {
    this.editMode = false;
    this.periodForm = {
      id: '',
      name: '',
      startDate: null,
      endDate: null,
    };
    this.showDialog = true;
  }

  editPeriod(period: AccountingPeriod) {
    this.editMode = true;
    this.periodForm = {
      id: period.id,
      name: period.name,
      startDate: new Date(period.startDate),
      endDate: new Date(period.endDate),
    };
    this.showDialog = true;
  }

  setQuickPeriod(type: 'month' | 'quarter' | 'half' | 'year') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (type) {
      case 'month':
        this.periodForm.startDate = new Date(year, month, 1);
        this.periodForm.endDate = new Date(year, month + 1, 0);
        this.periodForm.name = `${this.getMonthName(month)} ${year}`;
        break;
      case 'quarter':
        const quarter = Math.floor(month / 3);
        this.periodForm.startDate = new Date(year, quarter * 3, 1);
        this.periodForm.endDate = new Date(year, quarter * 3 + 3, 0);
        this.periodForm.name = `الربع ${this.getQuarterName(quarter)} ${year}`;
        break;
      case 'half':
        const half = month < 6 ? 0 : 1;
        this.periodForm.startDate = new Date(year, half * 6, 1);
        this.periodForm.endDate = new Date(year, half * 6 + 6, 0);
        this.periodForm.name = `النصف ${half === 0 ? 'الأول' : 'الثاني'} ${year}`;
        break;
      case 'year':
        this.periodForm.startDate = new Date(year, 0, 1);
        this.periodForm.endDate = new Date(year, 11, 31);
        this.periodForm.name = `السنة المالية ${year}`;
        break;
    }
  }

  private getMonthName(month: number): string {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[month];
  }

  private getQuarterName(quarter: number): string {
    const quarters = ['الأول', 'الثاني', 'الثالث', 'الرابع'];
    return quarters[quarter];
  }

  savePeriod() {
    if (!this.periodForm.name || !this.periodForm.startDate || !this.periodForm.endDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    this.saving = true;
    const payload = {
      name: this.periodForm.name,
      startDate: this.periodForm.startDate,
      endDate: this.periodForm.endDate,
    };

    const request = this.editMode
      ? this.http.put(`${this.apiUrl}/${this.periodForm.id}`, payload)
      : this.http.post(this.apiUrl, payload);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: this.editMode ? 'تم تحديث الفترة بنجاح' : 'تم إنشاء الفترة بنجاح',
        });
        this.showDialog = false;
        this.saving = false;
        this.loadPeriods();
        this.loadStatistics();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في حفظ الفترة',
        });
        this.saving = false;
      },
    });
  }

  viewDetails(period: AccountingPeriod) {
    this.selectedPeriod = period;
    this.periodDetails = null;
    this.showDetailsDialog = true;

    this.http.get(`${this.apiUrl}/${period.id}`).subscribe({
      next: (data) => {
        this.periodDetails = data;
      },
    });
  }

  confirmClose(period: AccountingPeriod) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من إغلاق الفترة "${period.name}"؟ لن تتمكن من إضافة قيود جديدة في هذه الفترة.`,
      header: 'تأكيد الإغلاق',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'إغلاق',
      rejectLabel: 'إلغاء',
      accept: () => {
        this.http.post(`${this.apiUrl}/${period.id}/close`, {}).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم إغلاق الفترة بنجاح',
            });
            this.loadPeriods();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: err.error?.message || 'فشل في إغلاق الفترة',
            });
          },
        });
      },
    });
  }

  confirmReopen(period: AccountingPeriod) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من إعادة فتح الفترة "${period.name}"؟`,
      header: 'تأكيد إعادة الفتح',
      icon: 'pi pi-question-circle',
      acceptLabel: 'إعادة فتح',
      rejectLabel: 'إلغاء',
      accept: () => {
        this.http.post(`${this.apiUrl}/${period.id}/reopen`, {}).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم إعادة فتح الفترة بنجاح',
            });
            this.loadPeriods();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: err.error?.message || 'فشل في إعادة فتح الفترة',
            });
          },
        });
      },
    });
  }

  confirmDelete(period: AccountingPeriod) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف الفترة "${period.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-trash',
      acceptLabel: 'حذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${this.apiUrl}/${period.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم حذف الفترة بنجاح',
            });
            this.loadPeriods();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: err.error?.message || 'فشل في حذف الفترة',
            });
          },
        });
      },
    });
  }
}
