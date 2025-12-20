import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// PrimeNG Imports
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: { row: number; message: string }[];
}

@Component({
  selector: 'app-import-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepsModule,
    ButtonModule,
    CardModule,
    FileUploadModule,
    TableModule,
    ToastModule,
    ProgressBarModule,
    RadioButtonModule,
    TagModule,
    DatePickerModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="p-4">
      <!-- العنوان -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">استيراد البيانات</h1>
        <p class="text-gray-500">استيراد الحسابات والقيود والأرصدة الافتتاحية من ملفات Excel</p>
      </div>

      <!-- خطوات الاستيراد -->
      <p-steps [model]="steps" [activeIndex]="activeStep" [readonly]="false"></p-steps>

      <div class="mt-6">
        <!-- الخطوة 1: اختيار نوع الاستيراد -->
        <p-card *ngIf="activeStep === 0" header="اختر نوع البيانات للاستيراد">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              class="border-2 rounded-lg p-6 cursor-pointer transition-all"
              [class.border-blue-500]="importType === 'accounts'"
              [class.bg-blue-50]="importType === 'accounts'"
              [class.border-gray-200]="importType !== 'accounts'"
              (click)="importType = 'accounts'"
            >
              <div class="text-center">
                <i class="pi pi-sitemap text-4xl text-blue-500 mb-3"></i>
                <h3 class="font-semibold text-lg">شجرة الحسابات</h3>
                <p class="text-gray-500 text-sm mt-2">استيراد حسابات جديدة</p>
              </div>
            </div>

            <div
              class="border-2 rounded-lg p-6 cursor-pointer transition-all"
              [class.border-green-500]="importType === 'journal-entries'"
              [class.bg-green-50]="importType === 'journal-entries'"
              [class.border-gray-200]="importType !== 'journal-entries'"
              (click)="importType = 'journal-entries'"
            >
              <div class="text-center">
                <i class="pi pi-book text-4xl text-green-500 mb-3"></i>
                <h3 class="font-semibold text-lg">القيود اليومية</h3>
                <p class="text-gray-500 text-sm mt-2">استيراد قيود محاسبية</p>
              </div>
            </div>

            <div
              class="border-2 rounded-lg p-6 cursor-pointer transition-all"
              [class.border-purple-500]="importType === 'opening-balances'"
              [class.bg-purple-50]="importType === 'opening-balances'"
              [class.border-gray-200]="importType !== 'opening-balances'"
              (click)="importType = 'opening-balances'"
            >
              <div class="text-center">
                <i class="pi pi-calculator text-4xl text-purple-500 mb-3"></i>
                <h3 class="font-semibold text-lg">الأرصدة الافتتاحية</h3>
                <p class="text-gray-500 text-sm mt-2">استيراد أرصدة بداية الفترة</p>
              </div>
            </div>
          </div>

          <!-- تاريخ الفترة للأرصدة الافتتاحية -->
          <div *ngIf="importType === 'opening-balances'" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ الأرصدة الافتتاحية</label>
            <p-datepicker
              [(ngModel)]="periodDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full md:w-1/3"
            ></p-datepicker>
          </div>

          <div class="flex justify-between mt-6">
            <button
              pButton
              label="تحميل القالب"
              icon="pi pi-download"
              class="p-button-outlined"
              (click)="downloadTemplate()"
              [disabled]="!importType"
            ></button>
            <button
              pButton
              label="التالي"
              icon="pi pi-arrow-left"
              iconPos="right"
              (click)="nextStep()"
              [disabled]="!importType"
            ></button>
          </div>
        </p-card>

        <!-- الخطوة 2: رفع الملف -->
        <p-card *ngIf="activeStep === 1" header="رفع الملف">
          <div class="text-center py-8">
            <p-fileUpload
              mode="advanced"
              name="file"
              accept=".xlsx,.xls,.csv"
              [maxFileSize]="10000000"
              (onSelect)="onFileSelect($event)"
              (onClear)="onFileClear()"
              [showUploadButton]="false"
              [showCancelButton]="false"
              chooseLabel="اختر ملف"
            >
              <ng-template pTemplate="content">
                <div class="flex flex-col items-center py-8" *ngIf="!selectedFile">
                  <i class="pi pi-cloud-upload text-6xl text-gray-300 mb-4"></i>
                  <p class="text-gray-500">اسحب الملف هنا أو اضغط لاختيار ملف</p>
                  <p class="text-gray-400 text-sm mt-2">يدعم ملفات Excel (.xlsx, .xls) و CSV</p>
                </div>
              </ng-template>
            </p-fileUpload>
          </div>

          <div class="flex justify-between mt-6">
            <button
              pButton
              label="السابق"
              icon="pi pi-arrow-right"
              class="p-button-outlined"
              (click)="prevStep()"
            ></button>
            <button
              pButton
              label="معاينة"
              icon="pi pi-eye"
              (click)="previewFile()"
              [disabled]="!selectedFile"
              [loading]="previewing"
            ></button>
          </div>
        </p-card>

        <!-- الخطوة 3: معاينة البيانات -->
        <p-card *ngIf="activeStep === 2" header="معاينة البيانات">
          <div *ngIf="previewData">
            <div class="mb-4 flex items-center gap-4">
              <span class="text-gray-600">
                إجمالي الصفوف: <strong>{{ previewData.totalRows }}</strong>
              </span>
              <span class="text-gray-600">
                الأعمدة: <strong>{{ previewData.columns.length }}</strong>
              </span>
            </div>

            <p-table
              [value]="previewData.rows"
              [scrollable]="true"
              scrollHeight="300px"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th *ngFor="let col of previewData.columns">{{ col }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td *ngFor="let col of previewData.columns">{{ row[col] }}</td>
                </tr>
              </ng-template>
            </p-table>

            <p class="text-gray-500 text-sm mt-2">
              * يتم عرض أول 10 صفوف فقط للمعاينة
            </p>
          </div>

          <div class="flex justify-between mt-6">
            <button
              pButton
              label="السابق"
              icon="pi pi-arrow-right"
              class="p-button-outlined"
              (click)="prevStep()"
            ></button>
            <button
              pButton
              label="بدء الاستيراد"
              icon="pi pi-upload"
              class="p-button-success"
              (click)="startImport()"
              [loading]="importing"
            ></button>
          </div>
        </p-card>

        <!-- الخطوة 4: النتائج -->
        <p-card *ngIf="activeStep === 3" header="نتائج الاستيراد">
          <div *ngIf="importResult" class="text-center py-6">
            <i
              class="text-6xl mb-4"
              [class.pi-check-circle]="importResult.success"
              [class.text-green-500]="importResult.success"
              [class.pi-exclamation-triangle]="!importResult.success"
              [class.text-yellow-500]="!importResult.success"
              [ngClass]="importResult.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"
            ></i>

            <h2 class="text-xl font-semibold mb-4">
              {{ importResult.success ? 'تم الاستيراد بنجاح' : 'اكتمل الاستيراد مع بعض الأخطاء' }}
            </h2>

            <div class="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{{ importResult.totalRows }}</div>
                <div class="text-sm text-gray-600">إجمالي الصفوف</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{{ importResult.importedRows }}</div>
                <div class="text-sm text-gray-600">تم استيرادها</div>
              </div>
              <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{{ importResult.failedRows }}</div>
                <div class="text-sm text-gray-600">فشلت</div>
              </div>
            </div>

            <!-- قائمة الأخطاء -->
            <div *ngIf="importResult.errors.length > 0" class="text-right">
              <h3 class="font-semibold mb-2">تفاصيل الأخطاء:</h3>
              <p-table [value]="importResult.errors" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>الصف</th>
                    <th>الخطأ</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-error>
                  <tr>
                    <td>{{ error.row }}</td>
                    <td class="text-red-600">{{ error.message }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <div class="flex justify-center mt-6">
            <button
              pButton
              label="استيراد جديد"
              icon="pi pi-refresh"
              (click)="resetWizard()"
            ></button>
          </div>
        </p-card>
      </div>
    </div>
  `,
})
export class ImportWizardComponent implements OnInit {
  steps: MenuItem[] = [];
  activeStep = 0;

  importType: 'accounts' | 'journal-entries' | 'opening-balances' | null = null;
  periodDate: Date = new Date();
  selectedFile: File | null = null;

  previewData: { columns: string[]; rows: any[]; totalRows: number } | null = null;
  importResult: ImportResult | null = null;

  previewing = false;
  importing = false;

  private apiUrl = '/api/v1/import';

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.steps = [
      { label: 'نوع البيانات' },
      { label: 'رفع الملف' },
      { label: 'المعاينة' },
      { label: 'النتائج' },
    ];
  }

  nextStep() {
    if (this.activeStep < 3) {
      this.activeStep++;
    }
  }

  prevStep() {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  downloadTemplate() {
    if (!this.importType) return;

    const templateUrls: Record<string, string> = {
      'accounts': `${this.apiUrl}/templates/accounts`,
      'journal-entries': `${this.apiUrl}/templates/journal-entries`,
      'opening-balances': `${this.apiUrl}/templates/opening-balances`,
    };

    window.open(templateUrls[this.importType], '_blank');
  }

  onFileSelect(event: any) {
    if (event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
    }
  }

  onFileClear() {
    this.selectedFile = null;
    this.previewData = null;
  }

  previewFile() {
    if (!this.selectedFile) return;

    this.previewing = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>(`${this.apiUrl}/preview`, formData).subscribe({
      next: (data) => {
        this.previewData = data;
        this.previewing = false;
        this.nextStep();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في معاينة الملف',
        });
        this.previewing = false;
      },
    });
  }

  startImport() {
    if (!this.selectedFile || !this.importType) return;

    this.importing = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    let url = `${this.apiUrl}/${this.importType}`;
    if (this.importType === 'opening-balances' && this.periodDate) {
      url += `?periodDate=${this.periodDate.toISOString()}`;
    }

    this.http.post<ImportResult>(url, formData).subscribe({
      next: (result) => {
        this.importResult = result;
        this.importing = false;
        this.nextStep();

        if (result.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: `تم استيراد ${result.importedRows} سجل بنجاح`,
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'تحذير',
            detail: `تم استيراد ${result.importedRows} سجل، فشل ${result.failedRows} سجل`,
          });
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل في الاستيراد',
        });
        this.importing = false;
      },
    });
  }

  resetWizard() {
    this.activeStep = 0;
    this.importType = null;
    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;
    this.periodDate = new Date();
  }
}
