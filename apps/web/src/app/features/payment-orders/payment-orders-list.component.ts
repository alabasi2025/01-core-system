import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface PaymentOrderItem {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

interface PaymentOrder {
  id: string;
  orderNumber: string;
  orderDate: Date;
  dueDate?: Date;
  payeeType: string;
  payeeId?: string;
  payeeName: string;
  payeeAccount?: string;
  payeeBankName?: string;
  paymentMethod: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  priority: string;
  description?: string;
  notes?: string;
  stationId?: string;
  stationName?: string;
  createdAt: Date;
  items?: PaymentOrderItem[];
}

interface PaymentOrderStatistics {
  totalOrders: number;
  draftOrders: number;
  pendingApprovalOrders: number;
  approvedOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueOrders: number;
  overdueAmount: number;
}

@Component({
  selector: 'app-payment-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    CalendarModule,
    InputNumberModule,
    InputTextareaModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    DividerModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold text-gray-800">أوامر الدفع</h1>
        <button pButton label="أمر دفع جديد" icon="pi pi-plus" (click)="openCreateDialog()"></button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <p-card styleClass="bg-blue-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ statistics()?.totalOrders || 0 }}</div>
            <div class="text-gray-600">إجمالي الأوامر</div>
          </div>
        </p-card>
        <p-card styleClass="bg-yellow-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-yellow-600">{{ statistics()?.pendingApprovalOrders || 0 }}</div>
            <div class="text-gray-600">بانتظار الاعتماد</div>
          </div>
        </p-card>
        <p-card styleClass="bg-green-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ formatCurrency(statistics()?.paidAmount || 0) }}</div>
            <div class="text-gray-600">المدفوع</div>
          </div>
        </p-card>
        <p-card styleClass="bg-red-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ formatCurrency(statistics()?.pendingAmount || 0) }}</div>
            <div class="text-gray-600">المتبقي</div>
          </div>
        </p-card>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <span class="p-input-icon-right w-full">
              <i class="pi pi-search"></i>
              <input pInputText type="text" [(ngModel)]="filters.search" placeholder="بحث..." 
                     class="w-full" (input)="loadOrders()">
            </span>
          </div>
          <div>
            <p-dropdown [options]="statusOptions" [(ngModel)]="filters.status" placeholder="الحالة"
                        [showClear]="true" class="w-full" (onChange)="loadOrders()"></p-dropdown>
          </div>
          <div>
            <p-dropdown [options]="payeeTypeOptions" [(ngModel)]="filters.payeeType" placeholder="نوع المستفيد"
                        [showClear]="true" class="w-full" (onChange)="loadOrders()"></p-dropdown>
          </div>
          <div>
            <p-calendar [(ngModel)]="filters.fromDate" placeholder="من تاريخ" dateFormat="yy-mm-dd"
                        [showIcon]="true" class="w-full" (onSelect)="loadOrders()"></p-calendar>
          </div>
          <div>
            <p-calendar [(ngModel)]="filters.toDate" placeholder="إلى تاريخ" dateFormat="yy-mm-dd"
                        [showIcon]="true" class="w-full" (onSelect)="loadOrders()"></p-calendar>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow">
        <p-table [value]="orders()" [loading]="loading()" [paginator]="true" [rows]="10"
                 [totalRecords]="totalRecords()" [lazy]="true" (onLazyLoad)="onLazyLoad($event)"
                 styleClass="p-datatable-sm" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th>رقم الأمر</th>
              <th>التاريخ</th>
              <th>المستفيد</th>
              <th>المبلغ</th>
              <th>المدفوع</th>
              <th>الحالة</th>
              <th>الأولوية</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-order>
            <tr>
              <td class="font-mono">{{ order.orderNumber }}</td>
              <td>{{ order.orderDate | date:'yyyy-MM-dd' }}</td>
              <td>
                <div>{{ order.payeeName }}</div>
                <small class="text-gray-500">{{ getPayeeTypeLabel(order.payeeType) }}</small>
              </td>
              <td class="font-mono">{{ formatCurrency(order.totalAmount) }}</td>
              <td class="font-mono">{{ formatCurrency(order.paidAmount) }}</td>
              <td>
                <p-tag [value]="getStatusLabel(order.status)" [severity]="getStatusSeverity(order.status)"></p-tag>
              </td>
              <td>
                <p-tag [value]="getPriorityLabel(order.priority)" [severity]="getPrioritySeverity(order.priority)"></p-tag>
              </td>
              <td>
                <div class="flex gap-1">
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" 
                          pTooltip="عرض" (click)="viewOrder(order)"></button>
                  @if (order.status === 'draft') {
                    <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" 
                            pTooltip="تعديل" (click)="editOrder(order)"></button>
                    <button pButton icon="pi pi-send" class="p-button-text p-button-sm p-button-success" 
                            pTooltip="تقديم للاعتماد" (click)="submitForApproval(order)"></button>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" 
                            pTooltip="حذف" (click)="deleteOrder(order)"></button>
                  }
                  @if (order.status === 'pending_approval') {
                    <button pButton icon="pi pi-check" class="p-button-text p-button-sm p-button-success" 
                            pTooltip="اعتماد" (click)="approveOrder(order)"></button>
                    <button pButton icon="pi pi-times" class="p-button-text p-button-sm p-button-danger" 
                            pTooltip="إلغاء" (click)="cancelOrder(order)"></button>
                  }
                  @if (order.status === 'approved' || order.status === 'partially_paid') {
                    <button pButton icon="pi pi-dollar" class="p-button-text p-button-sm p-button-info" 
                            pTooltip="تنفيذ دفع" (click)="openExecuteDialog(order)"></button>
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-8 text-gray-500">
                لا توجد أوامر دفع
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create/Edit Dialog -->
      <p-dialog [(visible)]="showDialog" [header]="editingOrder ? 'تعديل أمر الدفع' : 'أمر دفع جديد'" 
                [modal]="true" [style]="{width: '80vw'}" [draggable]="false" [resizable]="false">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">تاريخ الأمر *</label>
            <p-calendar [(ngModel)]="orderForm.orderDate" dateFormat="yy-mm-dd" [showIcon]="true" 
                        class="w-full"></p-calendar>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">تاريخ الاستحقاق</label>
            <p-calendar [(ngModel)]="orderForm.dueDate" dateFormat="yy-mm-dd" [showIcon]="true" 
                        class="w-full"></p-calendar>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">نوع المستفيد *</label>
            <p-dropdown [options]="payeeTypeOptions" [(ngModel)]="orderForm.payeeType" 
                        class="w-full"></p-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">اسم المستفيد *</label>
            <input pInputText [(ngModel)]="orderForm.payeeName" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">رقم حساب المستفيد</label>
            <input pInputText [(ngModel)]="orderForm.payeeAccount" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">اسم البنك</label>
            <input pInputText [(ngModel)]="orderForm.payeeBankName" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">طريقة الدفع</label>
            <p-dropdown [options]="paymentMethodOptions" [(ngModel)]="orderForm.paymentMethod" 
                        class="w-full"></p-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">الأولوية</label>
            <p-dropdown [options]="priorityOptions" [(ngModel)]="orderForm.priority" 
                        class="w-full"></p-dropdown>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1">الوصف</label>
            <textarea pInputTextarea [(ngModel)]="orderForm.description" rows="2" class="w-full"></textarea>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Items -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold">البنود</h3>
            <button pButton label="إضافة بند" icon="pi pi-plus" class="p-button-sm" 
                    (click)="addItem()"></button>
          </div>
          <p-table [value]="orderForm.items" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>الحساب</th>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>المبلغ</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item let-i="rowIndex">
              <tr>
                <td>
                  <p-dropdown [options]="accounts()" [(ngModel)]="item.accountId" optionLabel="name" 
                              optionValue="id" [filter]="true" filterBy="name,code" class="w-full"
                              placeholder="اختر الحساب"></p-dropdown>
                </td>
                <td>
                  <input pInputText [(ngModel)]="item.description" class="w-full">
                </td>
                <td>
                  <p-inputNumber [(ngModel)]="item.quantity" [min]="1" (onInput)="calculateItemTotal(item)" 
                                 class="w-full" inputStyleClass="w-full"></p-inputNumber>
                </td>
                <td>
                  <p-inputNumber [(ngModel)]="item.unitPrice" [min]="0" mode="decimal" 
                                 (onInput)="calculateItemTotal(item)" class="w-full" 
                                 inputStyleClass="w-full"></p-inputNumber>
                </td>
                <td class="font-mono">{{ formatCurrency(item.totalAmount || 0) }}</td>
                <td>
                  <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" 
                          (click)="removeItem(i)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr>
                <td colspan="4" class="text-left font-bold">الإجمالي:</td>
                <td class="font-mono font-bold">{{ formatCurrency(calculateTotal()) }}</td>
                <td></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="إلغاء" icon="pi pi-times" class="p-button-text" 
                  (click)="showDialog = false"></button>
          <button pButton label="حفظ" icon="pi pi-check" (click)="saveOrder()" 
                  [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Execute Payment Dialog -->
      <p-dialog [(visible)]="showExecuteDialog" header="تنفيذ الدفع" [modal]="true" 
                [style]="{width: '500px'}" [draggable]="false">
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">تاريخ التنفيذ *</label>
            <p-calendar [(ngModel)]="executeForm.executionDate" dateFormat="yy-mm-dd" 
                        [showIcon]="true" class="w-full"></p-calendar>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">المبلغ *</label>
            <p-inputNumber [(ngModel)]="executeForm.amount" [min]="0" 
                           [max]="selectedOrder?.remainingAmount || 0" mode="decimal" 
                           class="w-full" inputStyleClass="w-full"></p-inputNumber>
            <small class="text-gray-500">المتبقي: {{ formatCurrency(selectedOrder?.remainingAmount || 0) }}</small>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">طريقة الدفع *</label>
            <p-dropdown [options]="paymentMethodOptions" [(ngModel)]="executeForm.paymentMethod" 
                        class="w-full"></p-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">رقم المرجع</label>
            <input pInputText [(ngModel)]="executeForm.referenceNumber" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">ملاحظات</label>
            <textarea pInputTextarea [(ngModel)]="executeForm.notes" rows="2" class="w-full"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="إلغاء" icon="pi pi-times" class="p-button-text" 
                  (click)="showExecuteDialog = false"></button>
          <button pButton label="تنفيذ" icon="pi pi-check" (click)="executePayment()" 
                  [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- View Dialog -->
      <p-dialog [(visible)]="showViewDialog" header="تفاصيل أمر الدفع" [modal]="true" 
                [style]="{width: '70vw'}" [draggable]="false">
        @if (selectedOrder) {
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><strong>رقم الأمر:</strong> {{ selectedOrder.orderNumber }}</div>
            <div><strong>التاريخ:</strong> {{ selectedOrder.orderDate | date:'yyyy-MM-dd' }}</div>
            <div><strong>المستفيد:</strong> {{ selectedOrder.payeeName }}</div>
            <div><strong>نوع المستفيد:</strong> {{ getPayeeTypeLabel(selectedOrder.payeeType) }}</div>
            <div><strong>المبلغ الإجمالي:</strong> {{ formatCurrency(selectedOrder.totalAmount) }}</div>
            <div><strong>المدفوع:</strong> {{ formatCurrency(selectedOrder.paidAmount) }}</div>
            <div><strong>الحالة:</strong> 
              <p-tag [value]="getStatusLabel(selectedOrder.status)" [severity]="getStatusSeverity(selectedOrder.status)"></p-tag>
            </div>
            <div><strong>الأولوية:</strong> 
              <p-tag [value]="getPriorityLabel(selectedOrder.priority)" [severity]="getPrioritySeverity(selectedOrder.priority)"></p-tag>
            </div>
          </div>
          @if (selectedOrder.description) {
            <div class="mb-4">
              <strong>الوصف:</strong>
              <p>{{ selectedOrder.description }}</p>
            </div>
          }
          <p-divider></p-divider>
          <h3 class="font-bold mb-2">البنود</h3>
          <p-table [value]="selectedOrder.items || []" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>المبلغ</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>{{ item.description }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.unitPrice) }}</td>
                <td>{{ formatCurrency(item.totalAmount) }}</td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-dialog>

      <p-confirmDialog></p-confirmDialog>
      <p-toast></p-toast>
    </div>
  `,
})
export class PaymentOrdersListComponent implements OnInit {
  private api = inject(ApiService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  orders = signal<PaymentOrder[]>([]);
  statistics = signal<PaymentOrderStatistics | null>(null);
  accounts = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  totalRecords = signal(0);

  showDialog = false;
  showExecuteDialog = false;
  showViewDialog = false;
  editingOrder: PaymentOrder | null = null;
  selectedOrder: PaymentOrder | null = null;

  filters: any = {
    search: '',
    status: null,
    payeeType: null,
    fromDate: null,
    toDate: null,
    page: 1,
    limit: 10,
  };

  orderForm: any = this.getEmptyForm();
  executeForm: any = {
    executionDate: new Date(),
    amount: 0,
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  };

  statusOptions = [
    { label: 'مسودة', value: 'draft' },
    { label: 'بانتظار الاعتماد', value: 'pending_approval' },
    { label: 'معتمد', value: 'approved' },
    { label: 'مدفوع جزئياً', value: 'partially_paid' },
    { label: 'مدفوع', value: 'paid' },
    { label: 'ملغي', value: 'cancelled' },
  ];

  payeeTypeOptions = [
    { label: 'مورد', value: 'supplier' },
    { label: 'موظف', value: 'employee' },
    { label: 'مقاول', value: 'contractor' },
    { label: 'جهة حكومية', value: 'government' },
    { label: 'أخرى', value: 'other' },
  ];

  paymentMethodOptions = [
    { label: 'نقدي', value: 'cash' },
    { label: 'شيك', value: 'check' },
    { label: 'تحويل بنكي', value: 'bank_transfer' },
    { label: 'نقطة بيع', value: 'pos' },
    { label: 'دفع إلكتروني', value: 'mobile' },
  ];

  priorityOptions = [
    { label: 'منخفضة', value: 'low' },
    { label: 'عادية', value: 'normal' },
    { label: 'عالية', value: 'high' },
    { label: 'عاجلة', value: 'urgent' },
  ];

  ngOnInit() {
    this.loadOrders();
    this.loadStatistics();
    this.loadAccounts();
  }

  loadOrders() {
    this.loading.set(true);
    const params: any = { ...this.filters };
    if (params.fromDate) params.fromDate = this.formatDate(params.fromDate);
    if (params.toDate) params.toDate = this.formatDate(params.toDate);

    this.api.get<any>('/payment-orders', params).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.totalRecords.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل أوامر الدفع' });
      },
    });
  }

  loadStatistics() {
    this.api.get<PaymentOrderStatistics>('/payment-orders/statistics').subscribe({
      next: (res) => this.statistics.set(res),
    });
  }

  loadAccounts() {
    this.api.getAccounts({ leafOnly: true }).subscribe({
      next: (res) => this.accounts.set(res),
    });
  }

  onLazyLoad(event: any) {
    this.filters.page = Math.floor(event.first / event.rows) + 1;
    this.filters.limit = event.rows;
    this.loadOrders();
  }

  openCreateDialog() {
    this.editingOrder = null;
    this.orderForm = this.getEmptyForm();
    this.showDialog = true;
  }

  editOrder(order: PaymentOrder) {
    this.editingOrder = order;
    this.api.get<PaymentOrder>(`/payment-orders/${order.id}`).subscribe({
      next: (res) => {
        this.orderForm = {
          orderDate: new Date(res.orderDate),
          dueDate: res.dueDate ? new Date(res.dueDate) : null,
          payeeType: res.payeeType,
          payeeName: res.payeeName,
          payeeAccount: res.payeeAccount,
          payeeBankName: res.payeeBankName,
          paymentMethod: res.paymentMethod,
          priority: res.priority,
          description: res.description,
          notes: res.notes,
          items: res.items?.map(item => ({
            accountId: item.accountId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
          })) || [],
        };
        this.showDialog = true;
      },
    });
  }

  viewOrder(order: PaymentOrder) {
    this.api.get<PaymentOrder>(`/payment-orders/${order.id}`).subscribe({
      next: (res) => {
        this.selectedOrder = res;
        this.showViewDialog = true;
      },
    });
  }

  saveOrder() {
    if (!this.orderForm.orderDate || !this.orderForm.payeeType || !this.orderForm.payeeName) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    if (this.orderForm.items.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى إضافة بند واحد على الأقل' });
      return;
    }

    this.saving.set(true);
    const data = {
      ...this.orderForm,
      orderDate: this.formatDate(this.orderForm.orderDate),
      dueDate: this.orderForm.dueDate ? this.formatDate(this.orderForm.dueDate) : null,
    };

    const request = this.editingOrder
      ? this.api.put<PaymentOrder>(`/payment-orders/${this.editingOrder.id}`, data)
      : this.api.post<PaymentOrder>('/payment-orders', data);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ أمر الدفع بنجاح' });
        this.showDialog = false;
        this.loadOrders();
        this.loadStatistics();
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل حفظ أمر الدفع' });
        this.saving.set(false);
      },
    });
  }

  submitForApproval(order: PaymentOrder) {
    this.confirmationService.confirm({
      message: 'هل تريد تقديم أمر الدفع للاعتماد؟',
      accept: () => {
        this.api.post(`/payment-orders/${order.id}/submit`, {}).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تقديم أمر الدفع للاعتماد' });
            this.loadOrders();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل تقديم أمر الدفع' });
          },
        });
      },
    });
  }

  approveOrder(order: PaymentOrder) {
    this.confirmationService.confirm({
      message: 'هل تريد اعتماد أمر الدفع؟',
      accept: () => {
        this.api.post(`/payment-orders/${order.id}/approve`, {}).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم اعتماد أمر الدفع' });
            this.loadOrders();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل اعتماد أمر الدفع' });
          },
        });
      },
    });
  }

  openExecuteDialog(order: PaymentOrder) {
    this.selectedOrder = order;
    this.executeForm = {
      executionDate: new Date(),
      amount: order.remainingAmount,
      paymentMethod: order.paymentMethod,
      referenceNumber: '',
      notes: '',
    };
    this.showExecuteDialog = true;
  }

  executePayment() {
    if (!this.selectedOrder || !this.executeForm.amount) return;

    this.saving.set(true);
    const data = {
      ...this.executeForm,
      executionDate: this.formatDate(this.executeForm.executionDate),
    };

    this.api.post(`/payment-orders/${this.selectedOrder.id}/execute`, data).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تنفيذ الدفع بنجاح' });
        this.showExecuteDialog = false;
        this.loadOrders();
        this.loadStatistics();
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل تنفيذ الدفع' });
        this.saving.set(false);
      },
    });
  }

  cancelOrder(order: PaymentOrder) {
    this.confirmationService.confirm({
      message: 'هل تريد إلغاء أمر الدفع؟',
      accept: () => {
        this.api.post(`/payment-orders/${order.id}/cancel`, { reason: 'إلغاء من قبل المستخدم' }).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم إلغاء أمر الدفع' });
            this.loadOrders();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل إلغاء أمر الدفع' });
          },
        });
      },
    });
  }

  deleteOrder(order: PaymentOrder) {
    this.confirmationService.confirm({
      message: 'هل تريد حذف أمر الدفع؟',
      accept: () => {
        this.api.delete(`/payment-orders/${order.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف أمر الدفع' });
            this.loadOrders();
            this.loadStatistics();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل حذف أمر الدفع' });
          },
        });
      },
    });
  }

  addItem() {
    this.orderForm.items.push({
      accountId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxAmount: 0,
      totalAmount: 0,
    });
  }

  removeItem(index: number) {
    this.orderForm.items.splice(index, 1);
  }

  calculateItemTotal(item: any) {
    item.amount = (item.quantity || 0) * (item.unitPrice || 0);
    item.totalAmount = item.amount + (item.taxAmount || 0);
  }

  calculateTotal(): number {
    return this.orderForm.items.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
  }

  getEmptyForm() {
    return {
      orderDate: new Date(),
      dueDate: null,
      payeeType: 'supplier',
      payeeName: '',
      payeeAccount: '',
      payeeBankName: '',
      paymentMethod: 'cash',
      priority: 'normal',
      description: '',
      notes: '',
      items: [],
    };
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      draft: 'مسودة',
      pending_approval: 'بانتظار الاعتماد',
      approved: 'معتمد',
      partially_paid: 'مدفوع جزئياً',
      paid: 'مدفوع',
      cancelled: 'ملغي',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): any {
    const severities: any = {
      draft: 'secondary',
      pending_approval: 'warning',
      approved: 'info',
      partially_paid: 'warning',
      paid: 'success',
      cancelled: 'danger',
    };
    return severities[status] || 'info';
  }

  getPayeeTypeLabel(type: string): string {
    const labels: any = {
      supplier: 'مورد',
      employee: 'موظف',
      contractor: 'مقاول',
      government: 'جهة حكومية',
      other: 'أخرى',
    };
    return labels[type] || type;
  }

  getPriorityLabel(priority: string): string {
    const labels: any = {
      low: 'منخفضة',
      normal: 'عادية',
      high: 'عالية',
      urgent: 'عاجلة',
    };
    return labels[priority] || priority;
  }

  getPrioritySeverity(priority: string): any {
    const severities: any = {
      low: 'secondary',
      normal: 'info',
      high: 'warning',
      urgent: 'danger',
    };
    return severities[priority] || 'info';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-YE', { style: 'currency', currency: 'YER' }).format(amount);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
