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
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface Collection {
  id: string;
  receiptNumber: string;
  collectionDate: string;
  amount: number;
  paymentMethod: string;
  customerName?: string;
  status: string;
  notes?: string;
  collector?: { id: string; name: string; code: string };
}

interface Collector {
  id: string;
  name: string;
  code: string;
}

@Component({
  selector: 'app-collections',
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
    DatePickerModule,
    TagModule,
    ToastModule,
    CheckboxModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">إدارة التحصيلات</h1>
        <div class="flex gap-2">
          <p-button
            label="إيداع المحدد"
            icon="pi pi-upload"
            severity="success"
            [disabled]="selectedCollections.length === 0"
            (onClick)="openDepositDialog()"
          ></p-button>
          <p-button label="تحصيل جديد" icon="pi pi-plus" (onClick)="openDialog()"></p-button>
        </div>
      </div>

      <!-- Filters -->
      <p-card styleClass="mb-4">
        <div class="flex gap-4 flex-wrap">
          <div>
            <label class="block text-sm font-medium mb-1">المتحصل</label>
            <p-select
              [(ngModel)]="filterCollectorId"
              [options]="collectors()"
              optionLabel="name"
              optionValue="id"
              placeholder="الكل"
              [showClear]="true"
              (onChange)="loadData()"
              styleClass="w-48"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">الحالة</label>
            <p-select
              [(ngModel)]="filterStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="الكل"
              [showClear]="true"
              (onChange)="loadData()"
              styleClass="w-48"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">من تاريخ</label>
            <p-datepicker [(ngModel)]="filterDateFrom" dateFormat="yy-mm-dd" (onSelect)="loadData()" styleClass="w-40"></p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">إلى تاريخ</label>
            <p-datepicker [(ngModel)]="filterDateTo" dateFormat="yy-mm-dd" (onSelect)="loadData()" styleClass="w-40"></p-datepicker>
          </div>
        </div>
      </p-card>

      <!-- Collections Table -->
      <p-card>
        <p-table
          [value]="collections()"
          [(selection)]="selectedCollections"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords}"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <p-checkbox [(ngModel)]="selectAll" [binary]="true" (onChange)="toggleSelectAll()"></p-checkbox>
              </th>
              <th>رقم الإيصال</th>
              <th>التاريخ</th>
              <th>المتحصل</th>
              <th>العميل</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-collection>
            <tr>
              <td>
                <p-checkbox
                  [(ngModel)]="collection.selected"
                  [binary]="true"
                  [disabled]="collection.status !== 'confirmed'"
                  (onChange)="updateSelection()"
                ></p-checkbox>
              </td>
              <td>{{ collection.receiptNumber }}</td>
              <td>{{ collection.collectionDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ collection.collector?.name || '-' }}</td>
              <td>{{ collection.customerName || '-' }}</td>
              <td class="font-bold text-green-600">{{ collection.amount | number }} ر.ي</td>
              <td>{{ getPaymentMethodLabel(collection.paymentMethod) }}</td>
              <td>
                <p-tag [severity]="getStatusSeverity(collection.status)" [value]="getStatusLabel(collection.status)"></p-tag>
              </td>
              <td>
                <div class="flex gap-2">
                  <p-button
                    icon="pi pi-check"
                    [rounded]="true"
                    [text]="true"
                    severity="success"
                    pTooltip="تأكيد"
                    *ngIf="collection.status === 'pending'"
                    (onClick)="confirmCollection(collection)"
                  ></p-button>
                  <p-button
                    icon="pi pi-times"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="إلغاء"
                    *ngIf="collection.status === 'pending'"
                    (onClick)="cancelCollection(collection)"
                  ></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" class="text-center py-4 text-gray-500">لا توجد تحصيلات</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Add Collection Dialog -->
    <p-dialog
      [(visible)]="showDialog"
      header="تحصيل جديد"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="grid gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">المتحصل *</label>
          <p-select
            [(ngModel)]="formData.collectorId"
            [options]="collectors()"
            optionLabel="name"
            optionValue="id"
            placeholder="اختر المتحصل"
            styleClass="w-full"
          ></p-select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">رقم الإيصال *</label>
          <input pInputText [(ngModel)]="formData.receiptNumber" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">تاريخ التحصيل *</label>
          <p-datepicker [(ngModel)]="formData.collectionDate" dateFormat="yy-mm-dd" styleClass="w-full"></p-datepicker>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">المبلغ *</label>
          <p-inputNumber [(ngModel)]="formData.amount" mode="decimal" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">طريقة الدفع</label>
          <p-select
            [(ngModel)]="formData.paymentMethod"
            [options]="paymentMethods"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
          ></p-select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">اسم العميل</label>
          <input pInputText [(ngModel)]="formData.customerName" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">ملاحظات</label>
          <input pInputText [(ngModel)]="formData.notes" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" severity="secondary" (onClick)="showDialog = false"></p-button>
        <p-button label="حفظ" (onClick)="save()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- Deposit Dialog -->
    <p-dialog
      [(visible)]="showDepositDialog"
      header="إيداع التحصيلات"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      <div class="grid gap-4">
        <div class="text-center mb-4">
          <div class="text-2xl font-bold text-green-600">{{ getTotalSelected() | number }} ر.ي</div>
          <div class="text-gray-600">إجمالي {{ selectedCollections.length }} تحصيل</div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">مرجع الإيداع *</label>
          <input pInputText [(ngModel)]="depositReference" class="w-full" placeholder="رقم الإيداع البنكي" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" severity="secondary" (onClick)="showDepositDialog = false"></p-button>
        <p-button label="إيداع" severity="success" (onClick)="deposit()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class CollectionsComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);

  collections = signal<Collection[]>([]);
  collectors = signal<Collector[]>([]);
  selectedCollections: Collection[] = [];
  selectAll = false;
  showDialog = false;
  showDepositDialog = false;
  depositReference = '';

  filterCollectorId = '';
  filterStatus = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;

  statusOptions = [
    { label: 'معلق', value: 'pending' },
    { label: 'مؤكد', value: 'confirmed' },
    { label: 'تم الإيداع', value: 'deposited' },
    { label: 'ملغي', value: 'cancelled' },
  ];

  paymentMethods = [
    { label: 'نقدي', value: 'cash' },
    { label: 'شيك', value: 'check' },
    { label: 'تحويل بنكي', value: 'bank_transfer' },
    { label: 'نقطة بيع', value: 'pos' },
    { label: 'دفع إلكتروني', value: 'mobile' },
  ];

  formData = {
    collectorId: '',
    receiptNumber: '',
    collectionDate: new Date(),
    amount: 0,
    paymentMethod: 'cash',
    customerName: '',
    notes: '',
  };

  ngOnInit() {
    this.loadData();
    this.loadCollectors();
  }

  loadData() {
    const params: any = {};
    if (this.filterCollectorId) params.collectorId = this.filterCollectorId;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom.toISOString().split('T')[0];
    if (this.filterDateTo) params.dateTo = this.filterDateTo.toISOString().split('T')[0];

    const queryString = new URLSearchParams(params).toString();
    this.api.get<{ data: Collection[] }>(`cash-box/collections?\${queryString}`).subscribe({
      next: (res) => this.collections.set(res.data || []),
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل البيانات' }),
    });
  }

  loadCollectors() {
    this.api.get<Collector[]>('cash-box/collectors').subscribe({
      next: (data) => this.collectors.set(data),
    });
  }

  openDialog() {
    this.formData = {
      collectorId: '',
      receiptNumber: '',
      collectionDate: new Date(),
      amount: 0,
      paymentMethod: 'cash',
      customerName: '',
      notes: '',
    };
    this.showDialog = true;
  }

  save() {
    if (!this.formData.collectorId || !this.formData.receiptNumber || !this.formData.amount) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    const payload = {
      ...this.formData,
      collectionDate: this.formData.collectionDate.toISOString().split('T')[0],
    };

    this.api.post('cash-box/collections', payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة التحصيل' });
        this.showDialog = false;
        this.loadData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشلت العملية' }),
    });
  }

  toggleSelectAll() {
    const confirmed = this.collections().filter(c => c.status === 'confirmed');
    confirmed.forEach(c => (c as any).selected = this.selectAll);
    this.updateSelection();
  }

  updateSelection() {
    this.selectedCollections = this.collections().filter(c => (c as any).selected);
  }

  getTotalSelected(): number {
    return this.selectedCollections.reduce((sum, c) => sum + c.amount, 0);
  }

  openDepositDialog() {
    this.depositReference = '';
    this.showDepositDialog = true;
  }

  deposit() {
    if (!this.depositReference) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى إدخال مرجع الإيداع' });
      return;
    }

    this.api.post('cash-box/collections/deposit', {
      collectionIds: this.selectedCollections.map(c => c.id),
      depositReference: this.depositReference,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم الإيداع بنجاح' });
        this.showDepositDialog = false;
        this.selectedCollections = [];
        this.loadData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل الإيداع' }),
    });
  }

  confirmCollection(collection: Collection) {
    // TODO: Implement confirm endpoint
    this.messageService.add({ severity: 'info', summary: 'معلومة', detail: 'سيتم تنفيذ التأكيد' });
  }

  cancelCollection(collection: Collection) {
    // TODO: Implement cancel endpoint
    this.messageService.add({ severity: 'info', summary: 'معلومة', detail: 'سيتم تنفيذ الإلغاء' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'معلق',
      confirmed: 'مؤكد',
      deposited: 'تم الإيداع',
      cancelled: 'ملغي',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      pending: 'warn',
      confirmed: 'info',
      deposited: 'success',
      cancelled: 'danger',
    };
    return severities[status] || 'secondary';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'نقدي',
      check: 'شيك',
      bank_transfer: 'تحويل بنكي',
      pos: 'نقطة بيع',
      mobile: 'دفع إلكتروني',
    };
    return labels[method] || method;
  }
}
