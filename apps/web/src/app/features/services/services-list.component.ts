import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { services: number };
}

interface Service {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  serviceType: string;
  unit?: string;
  taxRate?: number;
  isTaxable: boolean;
  requiresMeter: boolean;
  isActive: boolean;
  category?: ServiceCategory;
  _count?: { prices: number; tiers: number };
}

interface Statistics {
  categories: number;
  services: { total: number; active: number; inactive: number };
  prices: number;
  tiers: number;
  byType: { type: string; count: number }[];
}

@Component({
  selector: 'app-services-list',
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
    InputNumberModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    CheckboxModule,
    TextareaModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">كتالوج الخدمات والتسعير</h1>
        <div class="flex gap-2">
          <p-button label="إضافة فئة" icon="pi pi-folder-plus" severity="secondary" (onClick)="openCategoryDialog()"></p-button>
          <p-button label="إضافة خدمة" icon="pi pi-plus" (onClick)="openServiceDialog()"></p-button>
        </div>
      </div>

      <!-- بطاقات الإحصائيات -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <p-card styleClass="bg-blue-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ statistics()?.categories || 0 }}</div>
            <div class="text-gray-600">فئات الخدمات</div>
          </div>
        </p-card>
        <p-card styleClass="bg-green-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ statistics()?.services?.total || 0 }}</div>
            <div class="text-gray-600">إجمالي الخدمات</div>
          </div>
        </p-card>
        <p-card styleClass="bg-purple-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ statistics()?.tiers || 0 }}</div>
            <div class="text-gray-600">شرائح التسعير</div>
          </div>
        </p-card>
        <p-card styleClass="bg-orange-50">
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ statistics()?.services?.active || 0 }}</div>
            <div class="text-gray-600">خدمات نشطة</div>
          </div>
        </p-card>
      </div>

      <!-- التبويبات -->
      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">الخدمات</p-tab>
          <p-tab value="1">الفئات</p-tab>
          <p-tab value="2">حاسبة الأسعار</p-tab>
        </p-tablist>
        <p-tabpanels>
          <!-- تبويب الخدمات -->
          <p-tabpanel value="0">
            <div class="flex gap-4 mb-4">
              <input pInputText [(ngModel)]="searchTerm" placeholder="بحث..." class="w-64" (input)="filterServices()" />
              <p-select [(ngModel)]="selectedCategory" [options]="categoryOptions()" placeholder="جميع الفئات" (onChange)="filterServices()"></p-select>
              <p-select [(ngModel)]="selectedType" [options]="typeOptions" placeholder="جميع الأنواع" (onChange)="filterServices()"></p-select>
            </div>

            <p-table [value]="filteredServices()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>الكود</th>
                  <th>اسم الخدمة</th>
                  <th>الفئة</th>
                  <th>النوع</th>
                  <th>الوحدة</th>
                  <th>الضريبة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-service>
                <tr>
                  <td class="font-mono">{{ service.code }}</td>
                  <td>
                    <div>{{ service.name }}</div>
                    @if (service.nameEn) {
                      <div class="text-xs text-gray-500">{{ service.nameEn }}</div>
                    }
                  </td>
                  <td>{{ service.category?.name || '-' }}</td>
                  <td>
                    <p-tag [value]="getTypeLabel(service.serviceType)" [severity]="getTypeSeverity(service.serviceType)"></p-tag>
                  </td>
                  <td>{{ service.unit || '-' }}</td>
                  <td>
                    @if (service.isTaxable) {
                      <span class="text-green-600">{{ service.taxRate }}%</span>
                    } @else {
                      <span class="text-gray-400">معفي</span>
                    }
                  </td>
                  <td>
                    <p-tag [value]="service.isActive ? 'نشط' : 'غير نشط'" [severity]="service.isActive ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewService(service)"></p-button>
                      <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="editService(service)"></p-button>
                      <p-button icon="pi pi-dollar" [rounded]="true" [text]="true" severity="success" (onClick)="managePricing(service)"></p-button>
                      <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDeleteService(service)"></p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="8" class="text-center py-4 text-gray-500">لا توجد خدمات</td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel>

          <!-- تبويب الفئات -->
          <p-tabpanel value="1">
            <p-table [value]="categories()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>الكود</th>
                  <th>اسم الفئة</th>
                  <th>الوصف</th>
                  <th>عدد الخدمات</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-category>
                <tr>
                  <td class="font-mono">{{ category.code }}</td>
                  <td>
                    <div>{{ category.name }}</div>
                    @if (category.nameEn) {
                      <div class="text-xs text-gray-500">{{ category.nameEn }}</div>
                    }
                  </td>
                  <td>{{ category.description || '-' }}</td>
                  <td>{{ category._count?.services || 0 }}</td>
                  <td>
                    <p-tag [value]="category.isActive ? 'نشط' : 'غير نشط'" [severity]="category.isActive ? 'success' : 'danger'"></p-tag>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="editCategory(category)"></p-button>
                      <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDeleteCategory(category)"></p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel>

          <!-- تبويب حاسبة الأسعار -->
          <p-tabpanel value="2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <p-card header="حساب السعر">
                <div class="flex flex-col gap-4">
                  <div>
                    <label class="block mb-2">الخدمة</label>
                    <p-select [(ngModel)]="calcServiceId" [options]="serviceOptions()" placeholder="اختر الخدمة" styleClass="w-full"></p-select>
                  </div>
                  <div>
                    <label class="block mb-2">الكمية</label>
                    <p-inputNumber [(ngModel)]="calcQuantity" [min]="0" styleClass="w-full"></p-inputNumber>
                  </div>
                  <div>
                    <label class="block mb-2">نوع العميل</label>
                    <p-select [(ngModel)]="calcCustomerType" [options]="customerTypeOptions" placeholder="اختياري" styleClass="w-full"></p-select>
                  </div>
                  <p-button label="احسب السعر" icon="pi pi-calculator" (onClick)="calculatePrice()" [disabled]="!calcServiceId || !calcQuantity"></p-button>
                </div>
              </p-card>

              @if (priceResult()) {
                <p-card header="نتيجة الحساب">
                  <div class="space-y-4">
                    <div class="flex justify-between border-b pb-2">
                      <span>الخدمة:</span>
                      <span class="font-bold">{{ priceResult()?.service?.name }}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                      <span>الكمية:</span>
                      <span>{{ priceResult()?.quantity }}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                      <span>المبلغ قبل الضريبة:</span>
                      <span>{{ priceResult()?.subtotal | number:'1.2-2' }}</span>
                    </div>
                    @if (priceResult()?.taxAmount > 0) {
                      <div class="flex justify-between border-b pb-2">
                        <span>الضريبة ({{ priceResult()?.taxRate }}%):</span>
                        <span>{{ priceResult()?.taxAmount | number:'1.2-2' }}</span>
                      </div>
                    }
                    <div class="flex justify-between text-lg font-bold text-green-600">
                      <span>الإجمالي:</span>
                      <span>{{ priceResult()?.total | number:'1.2-2' }}</span>
                    </div>

                    @if (priceResult()?.breakdown?.length > 0) {
                      <div class="mt-4">
                        <h4 class="font-bold mb-2">تفاصيل الحساب:</h4>
                        <table class="w-full text-sm">
                          <thead>
                            <tr class="bg-gray-100">
                              <th class="p-2 text-right">الشريحة</th>
                              <th class="p-2 text-right">الكمية</th>
                              <th class="p-2 text-right">السعر</th>
                              <th class="p-2 text-right">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (tier of priceResult()?.breakdown; track tier.tierName) {
                              <tr class="border-b">
                                <td class="p-2">{{ tier.tierName || tier.priceType }}</td>
                                <td class="p-2">{{ tier.quantity }}</td>
                                <td class="p-2">{{ tier.pricePerUnit || tier.price }}</td>
                                <td class="p-2">{{ tier.total | number:'1.2-2' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                </p-card>
              }
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>

    <!-- نافذة إضافة/تعديل الفئة -->
    <p-dialog [(visible)]="categoryDialogVisible" [header]="editingCategoryId ? 'تعديل الفئة' : 'إضافة فئة جديدة'" [modal]="true" [style]="{width: '500px'}">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block mb-2">الكود *</label>
          <input pInputText [(ngModel)]="categoryForm.code" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الاسم بالعربي *</label>
          <input pInputText [(ngModel)]="categoryForm.name" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الاسم بالإنجليزي</label>
          <input pInputText [(ngModel)]="categoryForm.nameEn" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الوصف</label>
          <textarea pTextarea [(ngModel)]="categoryForm.description" rows="3" class="w-full"></textarea>
        </div>
        <div class="flex items-center gap-2">
          <p-checkbox [(ngModel)]="categoryForm.isActive" [binary]="true" inputId="catActive"></p-checkbox>
          <label for="catActive">نشط</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" severity="secondary" (onClick)="categoryDialogVisible = false"></p-button>
        <p-button label="حفظ" (onClick)="saveCategory()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- نافذة إضافة/تعديل الخدمة -->
    <p-dialog [(visible)]="serviceDialogVisible" [header]="editingServiceId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'" [modal]="true" [style]="{width: '600px'}">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block mb-2">الكود *</label>
          <input pInputText [(ngModel)]="serviceForm.code" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الفئة</label>
          <p-select [(ngModel)]="serviceForm.categoryId" [options]="categoryOptions()" placeholder="اختر الفئة" styleClass="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-2">الاسم بالعربي *</label>
          <input pInputText [(ngModel)]="serviceForm.name" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">الاسم بالإنجليزي</label>
          <input pInputText [(ngModel)]="serviceForm.nameEn" class="w-full" />
        </div>
        <div>
          <label class="block mb-2">نوع الخدمة *</label>
          <p-select [(ngModel)]="serviceForm.serviceType" [options]="typeOptions" styleClass="w-full"></p-select>
        </div>
        <div>
          <label class="block mb-2">الوحدة</label>
          <input pInputText [(ngModel)]="serviceForm.unit" class="w-full" placeholder="مثال: kWh, شهر" />
        </div>
        <div class="col-span-2">
          <label class="block mb-2">الوصف</label>
          <textarea pTextarea [(ngModel)]="serviceForm.description" rows="2" class="w-full"></textarea>
        </div>
        <div>
          <label class="block mb-2">نسبة الضريبة %</label>
          <p-inputNumber [(ngModel)]="serviceForm.taxRate" [min]="0" [max]="100" styleClass="w-full"></p-inputNumber>
        </div>
        <div class="flex items-center gap-4 pt-6">
          <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="serviceForm.isTaxable" [binary]="true" inputId="taxable"></p-checkbox>
            <label for="taxable">خاضع للضريبة</label>
          </div>
          <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="serviceForm.requiresMeter" [binary]="true" inputId="meter"></p-checkbox>
            <label for="meter">يتطلب عداد</label>
          </div>
        </div>
        <div class="col-span-2 flex items-center gap-2">
          <p-checkbox [(ngModel)]="serviceForm.isActive" [binary]="true" inputId="svcActive"></p-checkbox>
          <label for="svcActive">نشط</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="إلغاء" severity="secondary" (onClick)="serviceDialogVisible = false"></p-button>
        <p-button label="حفظ" (onClick)="saveService()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- نافذة إدارة التسعير -->
    <p-dialog [(visible)]="pricingDialogVisible" header="إدارة التسعير" [modal]="true" [style]="{width: '800px'}">
      @if (selectedService) {
        <div class="mb-4">
          <h3 class="text-lg font-bold">{{ selectedService.name }}</h3>
          <p class="text-gray-500">{{ selectedService.code }} - {{ getTypeLabel(selectedService.serviceType) }}</p>
        </div>

        <p-tabs value="prices">
          <p-tablist>
            <p-tab value="prices">الأسعار</p-tab>
            <p-tab value="tiers">الشرائح</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="prices">
              <div class="mb-4">
                <p-button label="إضافة سعر" icon="pi pi-plus" size="small" (onClick)="addPrice()"></p-button>
              </div>
              <p-table [value]="servicePrices()" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>نوع السعر</th>
                    <th>السعر</th>
                    <th>نوع العميل</th>
                    <th>من تاريخ</th>
                    <th>إلى تاريخ</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-price>
                  <tr>
                    <td>{{ getPriceTypeLabel(price.priceType) }}</td>
                    <td>{{ price.price }}</td>
                    <td>{{ price.customerType ? getCustomerTypeLabel(price.customerType) : 'الكل' }}</td>
                    <td>{{ price.effectiveFrom | date:'yyyy-MM-dd' }}</td>
                    <td>{{ price.effectiveTo ? (price.effectiveTo | date:'yyyy-MM-dd') : '-' }}</td>
                    <td>
                      <p-tag [value]="price.isActive ? 'نشط' : 'غير نشط'" [severity]="price.isActive ? 'success' : 'danger'"></p-tag>
                    </td>
                    <td>
                      <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="deletePrice(price)"></p-button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">لا توجد أسعار</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel>
            <p-tabpanel value="tiers">
              <div class="mb-4">
                <p-button label="إضافة شريحة" icon="pi pi-plus" size="small" (onClick)="addTier()"></p-button>
              </div>
              <p-table [value]="serviceTiers()" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>اسم الشريحة</th>
                    <th>من</th>
                    <th>إلى</th>
                    <th>سعر الوحدة</th>
                    <th>رسم ثابت</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-tier>
                  <tr>
                    <td>{{ tier.tierName }}</td>
                    <td>{{ tier.fromQuantity }}</td>
                    <td>{{ tier.toQuantity || '∞' }}</td>
                    <td>{{ tier.pricePerUnit }}</td>
                    <td>{{ tier.fixedCharge || 0 }}</td>
                    <td>
                      <p-tag [value]="tier.isActive ? 'نشط' : 'غير نشط'" [severity]="tier.isActive ? 'success' : 'danger'"></p-tag>
                    </td>
                    <td>
                      <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="deleteTier(tier)"></p-button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">لا توجد شرائح</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      }
      <ng-template pTemplate="footer">
        <p-button label="إغلاق" (onClick)="pricingDialogVisible = false"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class ServicesListComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  services = signal<Service[]>([]);
  filteredServices = signal<Service[]>([]);
  categories = signal<ServiceCategory[]>([]);
  statistics = signal<Statistics | null>(null);
  servicePrices = signal<any[]>([]);
  serviceTiers = signal<any[]>([]);
  priceResult = signal<any>(null);

  searchTerm = '';
  selectedCategory: string | null = null;
  selectedType: string | null = null;

  categoryDialogVisible = false;
  serviceDialogVisible = false;
  pricingDialogVisible = false;

  editingCategoryId: string | null = null;
  editingServiceId: string | null = null;
  selectedService: Service | null = null;

  categoryForm = { code: '', name: '', nameEn: '', description: '', isActive: true };
  serviceForm = {
    code: '', name: '', nameEn: '', description: '', categoryId: null as string | null,
    serviceType: 'one_time', unit: '', taxRate: 0, isTaxable: false, requiresMeter: false, isActive: true
  };

  calcServiceId: string | null = null;
  calcQuantity = 0;
  calcCustomerType: string | null = null;

  typeOptions = [
    { label: 'لمرة واحدة', value: 'one_time' },
    { label: 'متكرر', value: 'recurring' },
    { label: 'استهلاك', value: 'consumption' },
    { label: 'دفع مسبق', value: 'prepaid' },
  ];

  customerTypeOptions = [
    { label: 'سكني', value: 'residential' },
    { label: 'تجاري', value: 'commercial' },
    { label: 'صناعي', value: 'industrial' },
    { label: 'حكومي', value: 'government' },
    { label: 'زراعي', value: 'agricultural' },
  ];

  categoryOptions = signal<{ label: string; value: string }[]>([]);
  serviceOptions = signal<{ label: string; value: string }[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.get<Service[]>('services').subscribe({
      next: (data) => {
        this.services.set(data);
        this.filteredServices.set(data);
        this.serviceOptions.set(data.map(s => ({ label: `${s.code} - ${s.name}`, value: s.id })));
      },
    });

    this.api.get<ServiceCategory[]>('services/categories').subscribe({
      next: (data) => {
        this.categories.set(data);
        this.categoryOptions.set([
          { label: 'بدون فئة', value: '' },
          ...data.map(c => ({ label: c.name, value: c.id }))
        ]);
      },
    });

    this.api.get<Statistics>('services/statistics').subscribe({
      next: (data) => this.statistics.set(data),
    });
  }

  filterServices() {
    let filtered = this.services();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.nameEn?.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(s => s.category?.id === this.selectedCategory);
    }

    if (this.selectedType) {
      filtered = filtered.filter(s => s.serviceType === this.selectedType);
    }

    this.filteredServices.set(filtered);
  }

  getTypeLabel(type: string): string {
    return this.typeOptions.find(t => t.value === type)?.label || type;
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      one_time: 'info',
      recurring: 'success',
      consumption: 'warn',
      prepaid: 'contrast',
    };
    return map[type] || 'secondary';
  }

  getPriceTypeLabel(type: string): string {
    const map: Record<string, string> = {
      fixed: 'ثابت',
      per_unit: 'لكل وحدة',
      tiered: 'متدرج',
      percentage: 'نسبة مئوية',
    };
    return map[type] || type;
  }

  getCustomerTypeLabel(type: string): string {
    return this.customerTypeOptions.find(t => t.value === type)?.label || type;
  }

  // Category operations
  openCategoryDialog() {
    this.editingCategoryId = null;
    this.categoryForm = { code: '', name: '', nameEn: '', description: '', isActive: true };
    this.categoryDialogVisible = true;
  }

  editCategory(category: ServiceCategory) {
    this.editingCategoryId = category.id;
    this.categoryForm = {
      code: category.code,
      name: category.name,
      nameEn: category.nameEn || '',
      description: category.description || '',
      isActive: category.isActive
    };
    this.categoryDialogVisible = true;
  }

  saveCategory() {
    const request = this.editingCategoryId
      ? this.api.put(`services/categories/${this.editingCategoryId}`, this.categoryForm)
      : this.api.post('services/categories', this.categoryForm);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ الفئة بنجاح' });
        this.categoryDialogVisible = false;
        this.loadData();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
      },
    });
  }

  confirmDeleteCategory(category: ServiceCategory) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف الفئة "${category.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(`services/categories/${category.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الفئة بنجاح' });
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
          },
        });
      },
    });
  }

  // Service operations
  openServiceDialog() {
    this.editingServiceId = null;
    this.serviceForm = {
      code: '', name: '', nameEn: '', description: '', categoryId: null,
      serviceType: 'one_time', unit: '', taxRate: 0, isTaxable: false, requiresMeter: false, isActive: true
    };
    this.serviceDialogVisible = true;
  }

  viewService(service: Service) {
    this.managePricing(service);
  }

  editService(service: Service) {
    this.editingServiceId = service.id;
    this.serviceForm = {
      code: service.code,
      name: service.name,
      nameEn: service.nameEn || '',
      description: service.description || '',
      categoryId: service.category?.id || null,
      serviceType: service.serviceType,
      unit: service.unit || '',
      taxRate: service.taxRate || 0,
      isTaxable: service.isTaxable,
      requiresMeter: service.requiresMeter,
      isActive: service.isActive,
    };
    this.serviceDialogVisible = true;
  }

  saveService() {
    const request = this.editingServiceId
      ? this.api.put(`services/${this.editingServiceId}`, this.serviceForm)
      : this.api.post('services', this.serviceForm);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ الخدمة بنجاح' });
        this.serviceDialogVisible = false;
        this.loadData();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
      },
    });
  }

  confirmDeleteService(service: Service) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف الخدمة "${service.name}"؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.delete(`services/${service.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الخدمة بنجاح' });
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
          },
        });
      },
    });
  }

  // Pricing operations
  managePricing(service: Service) {
    this.selectedService = service;
    this.loadPricing(service.id);
    this.pricingDialogVisible = true;
  }

  loadPricing(serviceId: string) {
    this.api.get<any[]>(`services/${serviceId}/prices`).subscribe({
      next: (data) => this.servicePrices.set(data),
    });

    this.api.get<any[]>(`services/${serviceId}/tiers`).subscribe({
      next: (data) => this.serviceTiers.set(data),
    });
  }

  addPrice() {
    // TODO: Implement add price dialog
    this.messageService.add({ severity: 'info', summary: 'قريباً', detail: 'سيتم إضافة هذه الميزة قريباً' });
  }

  deletePrice(price: any) {
    this.api.delete(`services/prices/${price.id}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف السعر بنجاح' });
        this.loadPricing(this.selectedService!.id);
      },
    });
  }

  addTier() {
    // TODO: Implement add tier dialog
    this.messageService.add({ severity: 'info', summary: 'قريباً', detail: 'سيتم إضافة هذه الميزة قريباً' });
  }

  deleteTier(tier: any) {
    this.api.delete(`services/tiers/${tier.id}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الشريحة بنجاح' });
        this.loadPricing(this.selectedService!.id);
      },
    });
  }

  // Price calculator
  calculatePrice() {
    if (!this.calcServiceId || !this.calcQuantity) return;

    const body: any = {
      serviceId: this.calcServiceId,
      quantity: this.calcQuantity,
    };

    if (this.calcCustomerType) {
      body.customerType = this.calcCustomerType;
    }

    this.api.post<any>('services/calculate-price', body).subscribe({
      next: (result) => this.priceResult.set(result),
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'حدث خطأ' });
      },
    });
  }
}
