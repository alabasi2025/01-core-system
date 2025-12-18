import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ChipsModule } from 'primeng/chips';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService, ConfirmationService } from 'primeng/api';

interface Schedule {
  id: string;
  templateId: string;
  template: {
    id: string;
    name: string;
    type: string;
  };
  frequency: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  time: string;
  recipients: string[];
  nextRun: Date;
  lastRun?: Date;
  isActive: boolean;
}

interface Template {
  id: string;
  name: string;
  type: string;
}

@Component({
  selector: 'app-scheduled-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ChipsModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    CardModule,
    TooltipModule,
    InputSwitchModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="p-4">
      <!-- العنوان -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">جدولة التقارير</h1>
          <p class="text-gray-500">إعداد التقارير الدورية التلقائية</p>
        </div>
        <button
          pButton
          label="جدول جديد"
          icon="pi pi-plus"
          class="p-button-primary"
          (click)="openNewDialog()"
        ></button>
      </div>

      <!-- جدول الجداول -->
      <p-card>
        <p-table
          [value]="schedules"
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>التقرير</th>
              <th>التكرار</th>
              <th>الوقت</th>
              <th>المستلمين</th>
              <th>التشغيل التالي</th>
              <th>آخر تشغيل</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-schedule>
            <tr>
              <td>
                <span class="font-semibold">{{ schedule.template?.name }}</span>
              </td>
              <td>{{ getFrequencyLabel(schedule.frequency) }}</td>
              <td>{{ schedule.time }}</td>
              <td>
                <span class="text-sm">{{ schedule.recipients?.length || 0 }} مستلم</span>
              </td>
              <td>{{ schedule.nextRun | date:'yyyy-MM-dd HH:mm' }}</td>
              <td>{{ schedule.lastRun ? (schedule.lastRun | date:'yyyy-MM-dd HH:mm') : '-' }}</td>
              <td>
                <p-tag
                  [value]="schedule.isActive ? 'نشط' : 'معطل'"
                  [severity]="schedule.isActive ? 'success' : 'secondary'"
                ></p-tag>
              </td>
              <td>
                <div class="flex gap-1">
                  <button
                    pButton
                    icon="pi pi-play"
                    class="p-button-text p-button-success p-button-sm"
                    pTooltip="تشغيل الآن"
                    (click)="runNow(schedule)"
                    [loading]="runningId === schedule.id"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-pencil"
                    class="p-button-text p-button-sm"
                    pTooltip="تعديل"
                    (click)="editSchedule(schedule)"
                  ></button>
                  <button
                    pButton
                    [icon]="schedule.isActive ? 'pi pi-pause' : 'pi pi-play'"
                    class="p-button-text p-button-warning p-button-sm"
                    [pTooltip]="schedule.isActive ? 'تعطيل' : 'تفعيل'"
                    (click)="toggleActive(schedule)"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    pTooltip="حذف"
                    (click)="confirmDelete(schedule)"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-8">
                <i class="pi pi-clock text-4xl text-gray-300 mb-2"></i>
                <p class="text-gray-500">لا توجد جداول تقارير</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- نافذة إنشاء/تعديل جدول -->
      <p-dialog
        [(visible)]="showDialog"
        [header]="editMode ? 'تعديل جدول التقرير' : 'إنشاء جدول تقرير جديد'"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">قالب التقرير *</label>
            <p-dropdown
              [(ngModel)]="scheduleForm.templateId"
              [options]="templates"
              optionLabel="name"
              optionValue="id"
              placeholder="اختر قالب التقرير"
              styleClass="w-full"
              [disabled]="editMode"
            ></p-dropdown>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">التكرار *</label>
              <p-dropdown
                [(ngModel)]="scheduleForm.frequency"
                [options]="frequencyOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="اختر التكرار"
                styleClass="w-full"
              ></p-dropdown>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">الوقت *</label>
              <input
                type="time"
                pInputText
                [(ngModel)]="scheduleForm.time"
                class="w-full"
              />
            </div>
          </div>

          <div *ngIf="scheduleForm.frequency === 'weekly'">
            <label class="block text-sm font-medium text-gray-700 mb-1">يوم الأسبوع *</label>
            <p-dropdown
              [(ngModel)]="scheduleForm.dayOfWeek"
              [options]="daysOfWeek"
              optionLabel="label"
              optionValue="value"
              placeholder="اختر اليوم"
              styleClass="w-full"
            ></p-dropdown>
          </div>

          <div *ngIf="['monthly', 'quarterly', 'yearly'].includes(scheduleForm.frequency)">
            <label class="block text-sm font-medium text-gray-700 mb-1">يوم الشهر *</label>
            <p-dropdown
              [(ngModel)]="scheduleForm.dayOfMonth"
              [options]="daysOfMonth"
              optionLabel="label"
              optionValue="value"
              placeholder="اختر اليوم"
              styleClass="w-full"
            ></p-dropdown>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">المستلمين (البريد الإلكتروني) *</label>
            <p-chips
              [(ngModel)]="scheduleForm.recipients"
              placeholder="أدخل البريد الإلكتروني واضغط Enter"
              styleClass="w-full"
            ></p-chips>
            <small class="text-gray-500">أدخل عناوين البريد الإلكتروني واضغط Enter بعد كل عنوان</small>
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
            (click)="saveSchedule()"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class ScheduledReportsComponent implements OnInit {
  schedules: Schedule[] = [];
  templates: Template[] = [];
  loading = false;
  saving = false;
  runningId: string | null = null;

  showDialog = false;
  editMode = false;

  scheduleForm = {
    id: '',
    templateId: '',
    frequency: 'monthly',
    dayOfMonth: 1,
    dayOfWeek: 0,
    time: '08:00',
    recipients: [] as string[],
  };

  frequencyOptions = [
    { label: 'يومي', value: 'daily' },
    { label: 'أسبوعي', value: 'weekly' },
    { label: 'شهري', value: 'monthly' },
    { label: 'ربع سنوي', value: 'quarterly' },
    { label: 'سنوي', value: 'yearly' },
  ];

  daysOfWeek = [
    { label: 'الأحد', value: 0 },
    { label: 'الاثنين', value: 1 },
    { label: 'الثلاثاء', value: 2 },
    { label: 'الأربعاء', value: 3 },
    { label: 'الخميس', value: 4 },
    { label: 'الجمعة', value: 5 },
    { label: 'السبت', value: 6 },
  ];

  daysOfMonth = Array.from({ length: 28 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));

  private apiUrl = '/api/v1/scheduled-reports';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadSchedules();
    this.loadTemplates();
  }

  loadSchedules() {
    this.loading = true;
    this.http.get<Schedule[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.schedules = data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في تحميل الجداول',
        });
        this.loading = false;
      },
    });
  }

  loadTemplates() {
    this.http.get<Template[]>(`${this.apiUrl}/templates`).subscribe({
      next: (data) => {
        this.templates = data;
      },
    });
  }

  getFrequencyLabel(frequency: string): string {
    const option = this.frequencyOptions.find(o => o.value === frequency);
    return option?.label || frequency;
  }

  openNewDialog() {
    this.editMode = false;
    this.scheduleForm = {
      id: '',
      templateId: '',
      frequency: 'monthly',
      dayOfMonth: 1,
      dayOfWeek: 0,
      time: '08:00',
      recipients: [],
    };
    this.showDialog = true;
  }

  editSchedule(schedule: Schedule) {
    this.editMode = true;
    this.scheduleForm = {
      id: schedule.id,
      templateId: schedule.templateId,
      frequency: schedule.frequency,
      dayOfMonth: schedule.dayOfMonth || 1,
      dayOfWeek: schedule.dayOfWeek || 0,
      time: schedule.time,
      recipients: [...schedule.recipients],
    };
    this.showDialog = true;
  }

  saveSchedule() {
    if (!this.scheduleForm.templateId || !this.scheduleForm.time || this.scheduleForm.recipients.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    this.saving = true;
    const payload: any = {
      templateId: this.scheduleForm.templateId,
      frequency: this.scheduleForm.frequency,
      time: this.scheduleForm.time,
      recipients: this.scheduleForm.recipients,
    };

    if (this.scheduleForm.frequency === 'weekly') {
      payload.dayOfWeek = this.scheduleForm.dayOfWeek;
    }
    if (['monthly', 'quarterly', 'yearly'].includes(this.scheduleForm.frequency)) {
      payload.dayOfMonth = this.scheduleForm.dayOfMonth;
    }

    const request = this.editMode
      ? this.http.put(`${this.apiUrl}/${this.scheduleForm.id}`, payload)
      : this.http.post(this.apiUrl, payload);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: this.editMode ? 'تم تحديث الجدول بنجاح' : 'تم إنشاء الجدول بنجاح',
        });
        this.showDialog = false;
        this.saving = false;
        this.loadSchedules();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في حفظ الجدول',
        });
        this.saving = false;
      },
    });
  }

  toggleActive(schedule: Schedule) {
    this.http.post(`${this.apiUrl}/${schedule.id}/toggle`, {}).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: schedule.isActive ? 'تم تعطيل الجدول' : 'تم تفعيل الجدول',
        });
        this.loadSchedules();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في تغيير حالة الجدول',
        });
      },
    });
  }

  runNow(schedule: Schedule) {
    this.runningId = schedule.id;
    this.http.post(`${this.apiUrl}/${schedule.id}/run`, {}).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم تشغيل التقرير بنجاح',
        });
        this.runningId = null;
        this.loadSchedules();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في تشغيل التقرير',
        });
        this.runningId = null;
      },
    });
  }

  confirmDelete(schedule: Schedule) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف جدول "${schedule.template?.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-trash',
      acceptLabel: 'حذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${this.apiUrl}/${schedule.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم حذف الجدول بنجاح',
            });
            this.loadSchedules();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: 'فشل في حذف الجدول',
            });
          },
        });
      },
    });
  }
}
