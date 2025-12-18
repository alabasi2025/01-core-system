import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface CashBox {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  currentBalance: number;
  openingBalance: number;
  maxLimit?: number;
  isActive: boolean;
  collectors?: any[];
  _count?: { transactions: number; sessions: number };
}

interface Statistics {
  cashBoxes: { count: number; totalBalance: number };
  collectors: { count: number; totalBalance: number };
  pendingCollections: { count: number; totalAmount: number };
  todayCollections: { count: number; totalAmount: number };
}

@Component({
  selector: 'app-cash-boxes',
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
        <h1 class="text-2xl font-bold">إدارة صناديق التحصيل</h1>
        <p-button label="إضافة صندوق" icon="pi pi-plus" (onClick)="openDialog()"></p-button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card styleClass="bg-blue-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ statistics()?.cashBoxes?.count || 0 }}</div>
            <div class="text-gray-600">صناديق التحصيل</div>
            <div class="text-sm text-blue-500 mt-1">{{ statistics()?.cashBoxes?.totalBalance || 0 | number }} ر.ي</div>
          </div>
        </p-card>
        <p-card styleClass="bg-green-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ statistics()?.collectors?.count || 0 }}</div>
            <div class="text-gray-600">المتحصلين</div>
            <div class="text-sm text-green-500 mt-1">{{ statistics()?.collectors?.totalBalance || 0 | number }} ر.ي</div>
          </div>
        </p-card>
        <p-card styleClass="bg-yellow-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-yellow-600">{{ statistics()?.pendingCollections?.count || 0 }}</div>
            <div class="text-gray-600">تحصيلات معلقة</div>
            <div class="text-sm text-yellow-500 mt-1">{{ statistics()?.pendingCollections?.totalAmount || 0 | number }} ر.ي</div>
          </div>
        </p-card>
        <p-card styleClass="bg-purple-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ statistics()?.todayCollections?.count || 0 }}</div>
            <div class="text-gray-600">تحصيلات اليوم</div>
            <div class="text-sm text-purple-500 mt-1">{{ statistics()?.todayCollections?.totalAmount || 0 | number }} ر.ي</div>
          </div>
        </p-card>
      </div>

      <!-- Cash Boxes Table -->
      <p-card>
        <p-table
          [value]="cashBoxes()"
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
              <th>الرصيد الحالي</th>
              <th>الحد الأقصى</th>
              <th>المتحصلين</th>
              <th>الحركات</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-box>
            <tr>
              <td>{{ box.code }}</td>
              <td>{{ box.name }}</td>
              <td class="font-bold" [class.text-green-600]="box.currentBalance > 0">
                {{ box.currentBalance | number }} ر.ي
              </td>
              <td>{{ box.maxLimit ? (box.maxLimit | number) + ' ر.ي' : '-' }}</td>
              <td>{{ box.collectors?.length || 0 }}</td>
              <td>{{ box._count?.transactions || 0 }}</td>
              <td>
                <p-tag [severity]="box.isActive ? 'success' : 'danger'" [value]="box.isActive ? 'نشط' : 'معطل'"></p-tag>
              </td>
              <td>
                <div class="flex gap-2">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewDetails(box)"></p-button>
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="editCashBox(box)"></p-button>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDelete(box)"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-4 text-gray-500">لا توجد صناديق تحصيل</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Add/Edit Dialog -->
    <p-dialog
      [(visible)]="showDialog"
      [header]="isEdit ? 'تعديل صندوق التحصيل' : 'إضافة صندوق تحصيل'"
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
        <div>
          <label class="block text-sm font-medium mb-1">الاسم بالإنجليزية</label>
          <input pInputText [(ngModel)]="formData.nameEn" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">الرصيد الافتتاحي</label>
          <p-inputNumber [(ngModel)]="formData.openingBalance" mode="decimal" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">الحد الأقصى</label>
          <p-inputNumber [(ngModel)]="formData.maxLimit" mode="decimal" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" severity="secondary" (onClick)="showDialog = false"></p-button>
        <p-button [label]="isEdit ? 'تحديث' : 'حفظ'" (onClick)="save()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class CashBoxesComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  cashBoxes = signal<CashBox[]>([]);
  statistics = signal<Statistics | null>(null);
  showDialog = false;
  isEdit = false;
  selectedId = '';

  formData = {
    code: '',
    name: '',
    nameEn: '',
    openingBalance: 0,
    maxLimit: null as number | null,
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.get<CashBox[]>('cash-box/boxes').subscribe({
      next: (data) => this.cashBoxes.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل البيانات' }),
    });

    this.api.get<Statistics>('cash-box/statistics').subscribe({
      next: (data) => this.statistics.set(data),
    });
  }

  openDialog() {
    this.isEdit = false;
    this.formData = { code: '', name: '', nameEn: '', openingBalance: 0, maxLimit: null };
    this.showDialog = true;
  }

  editCashBox(box: CashBox) {
    this.isEdit = true;
    this.selectedId = box.id;
    this.formData = {
      code: box.code,
      name: box.name,
      nameEn: box.nameEn || '',
      openingBalance: box.openingBalance,
      maxLimit: box.maxLimit || null,
    };
    this.showDialog = true;
  }

  save() {
    if (!this.formData.code || !this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    const request = this.isEdit
      ? this.api.put(`cash-box/boxes/\${this.selectedId}`, this.formData)
      : this.api.post('cash-box/boxes', this.formData);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: this.isEdit ? 'تم التحديث' : 'تم الإضافة' });
        this.showDialog = false;
        this.loadData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشلت العملية' }),
    });
  }

  viewDetails(box: CashBox) {
    // Navigate to details page
    console.log('View details:', box.id);
  }

  confirmDelete(box: CashBox) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف صندوق "\${box.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم',
      rejectLabel: 'لا',
      accept: () => {
        this.api.delete(`cash-box/boxes/\${box.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم الحذف' });
            this.loadData();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل الحذف' }),
        });
      },
    });
  }
}
