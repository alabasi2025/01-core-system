import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface Collector {
  id: string;
  code: string;
  name: string;
  phone?: string;
  currentBalance: number;
  maxCollectionLimit?: number;
  isActive: boolean;
  user?: { id: string; name: string; email: string };
  cashBox?: { id: string; name: string; code: string };
  _count?: { collections: number };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CashBox {
  id: string;
  name: string;
  code: string;
}

@Component({
  selector: 'app-collectors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">إدارة المتحصلين</h1>
        <p-button label="إضافة متحصل" icon="pi pi-plus" (onClick)="openDialog()"></p-button>
      </div>

      <!-- Collectors Table -->
      <p-card>
        <p-table
          [value]="collectors()"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords}"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>الكود</th>
              <th>الاسم</th>
              <th>المستخدم</th>
              <th>الهاتف</th>
              <th>الصندوق</th>
              <th>الرصيد الحالي</th>
              <th>الحد الأقصى</th>
              <th>التحصيلات</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-collector>
            <tr>
              <td>{{ collector.code }}</td>
              <td>{{ collector.name }}</td>
              <td>{{ collector.user?.name || '-' }}</td>
              <td>{{ collector.phone || '-' }}</td>
              <td>{{ collector.cashBox?.name || '-' }}</td>
              <td class="font-bold" [class.text-green-600]="collector.currentBalance > 0">
                {{ collector.currentBalance | number }} ر.ي
              </td>
              <td>{{ collector.maxCollectionLimit ? (collector.maxCollectionLimit | number) + ' ر.ي' : '-' }}</td>
              <td>{{ collector._count?.collections || 0 }}</td>
              <td>
                <p-tag [severity]="collector.isActive ? 'success' : 'danger'" [value]="collector.isActive ? 'نشط' : 'معطل'"></p-tag>
              </td>
              <td>
                <div class="flex gap-2">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewDetails(collector)"></p-button>
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="editCollector(collector)"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="10" class="text-center py-4 text-gray-500">لا يوجد متحصلين</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Add/Edit Dialog -->
    <p-dialog
      [(visible)]="showDialog"
      [header]="isEdit ? 'تعديل متحصل' : 'إضافة متحصل'"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="grid gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">الكود *</label>
          <input pInputText [(ngModel)]="formData.code" class="w-full" [disabled]="isEdit" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">الاسم *</label>
          <input pInputText [(ngModel)]="formData.name" class="w-full" />
        </div>
        <div *ngIf="!isEdit">
          <label class="block text-sm font-medium mb-1">المستخدم *</label>
          <p-select
            [(ngModel)]="formData.userId"
            [options]="users()"
            optionLabel="name"
            optionValue="id"
            placeholder="اختر المستخدم"
            styleClass="w-full"
          ></p-select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">صندوق التحصيل</label>
          <p-select
            [(ngModel)]="formData.cashBoxId"
            [options]="cashBoxes()"
            optionLabel="name"
            optionValue="id"
            placeholder="اختر الصندوق"
            [showClear]="true"
            styleClass="w-full"
          ></p-select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">الهاتف</label>
          <input pInputText [(ngModel)]="formData.phone" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">الحد الأقصى للتحصيل</label>
          <p-inputNumber [(ngModel)]="formData.maxCollectionLimit" mode="decimal" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" severity="secondary" (onClick)="showDialog = false"></p-button>
        <p-button [label]="isEdit ? 'تحديث' : 'حفظ'" (onClick)="save()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class CollectorsComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);

  collectors = signal<Collector[]>([]);
  users = signal<User[]>([]);
  cashBoxes = signal<CashBox[]>([]);
  showDialog = false;
  isEdit = false;
  selectedId = '';

  formData = {
    code: '',
    name: '',
    userId: '',
    cashBoxId: '',
    phone: '',
    maxCollectionLimit: null as number | null,
  };

  ngOnInit() {
    this.loadData();
    this.loadUsers();
    this.loadCashBoxes();
  }

  loadData() {
    this.api.get<Collector[]>('cash-box/collectors').subscribe({
      next: (data) => this.collectors.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل البيانات' }),
    });
  }

  loadUsers() {
    this.api.get<{ data: User[] }>('users').subscribe({
      next: (res) => this.users.set(res.data || []),
    });
  }

  loadCashBoxes() {
    this.api.get<CashBox[]>('cash-box/boxes').subscribe({
      next: (data) => this.cashBoxes.set(data),
    });
  }

  openDialog() {
    this.isEdit = false;
    this.formData = { code: '', name: '', userId: '', cashBoxId: '', phone: '', maxCollectionLimit: null };
    this.showDialog = true;
  }

  editCollector(collector: Collector) {
    this.isEdit = true;
    this.selectedId = collector.id;
    this.formData = {
      code: collector.code,
      name: collector.name,
      userId: collector.user?.id || '',
      cashBoxId: collector.cashBox?.id || '',
      phone: collector.phone || '',
      maxCollectionLimit: collector.maxCollectionLimit || null,
    };
    this.showDialog = true;
  }

  save() {
    if (!this.formData.code || !this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    if (!this.isEdit && !this.formData.userId) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى اختيار المستخدم' });
      return;
    }

    const payload: any = { ...this.formData };
    if (!payload.cashBoxId) delete payload.cashBoxId;
    if (!payload.maxCollectionLimit) delete payload.maxCollectionLimit;

    const request = this.isEdit
      ? this.api.put(`cash-box/collectors/\${this.selectedId}`, payload)
      : this.api.post('cash-box/collectors', payload);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: this.isEdit ? 'تم التحديث' : 'تم الإضافة' });
        this.showDialog = false;
        this.loadData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشلت العملية' }),
    });
  }

  viewDetails(collector: Collector) {
    console.log('View details:', collector.id);
  }
}
