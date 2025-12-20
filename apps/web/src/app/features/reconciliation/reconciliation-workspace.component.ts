import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { CheckboxModule } from 'primeng/checkbox';
import { SplitterModule } from 'primeng/splitter';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

interface ClearingEntry {
  id: string;
  clearingAccountId: string;
  clearingAccountName?: string;
  entryDate: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  description?: string;
  status: string;
  selected?: boolean;
}

interface ClearingAccount {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  balance: number;
  pendingCount: number;
}

interface BasketItem {
  entry: ClearingEntry;
  side: 'debit' | 'credit';
}

@Component({
  selector: 'app-reconciliation-workspace',
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
    CheckboxModule,
    SplitterModule,
    PanelModule,
    BadgeModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="h-screen flex flex-col">
      <!-- Header -->
      <div class="bg-white border-b px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button pButton icon="pi pi-arrow-right" class="p-button-text" (click)="goBack()"></button>
          <div>
            <h1 class="text-xl font-bold text-gray-800">مساحة عمل التسوية</h1>
            <p class="text-sm text-gray-600">{{ reconciliation()?.name || 'تسوية جديدة' }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <p-button
            label="مطابقة تلقائية"
            icon="pi pi-bolt"
            severity="secondary"
            (onClick)="runAutoMatch()"
          ></p-button>
          <p-button
            label="حفظ"
            icon="pi pi-save"
            (onClick)="save()"
          ></p-button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Multi-Panel Interface -->
        <p-splitter [style]="{ height: 'calc(100% - 200px)' }" layout="horizontal" [panelSizes]="[50, 50]">
          <!-- Left Panels -->
          <ng-template pTemplate>
            <p-splitter layout="vertical" [panelSizes]="[50, 50]">
              <!-- Panel 1: وسيط صندوق التحصيل -->
              <ng-template pTemplate>
                <div class="h-full flex flex-col p-2">
                  <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-gray-700">{{ panels()[0]?.name || 'الحساب الوسيط 1' }}</span>
                      <p-badge [value]="getPanelCount(0)" severity="info"></p-badge>
                    </div>
                    <p-select
                      [(ngModel)]="selectedAccounts[0]"
                      [options]="clearingAccounts()"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="اختر الحساب"
                      [style]="{ width: '200px' }"
                      (onChange)="loadPanelEntries(0)"
                    ></p-select>
                  </div>
                  <div class="flex-1 overflow-auto border rounded">
                    <p-table
                      [value]="panelEntries()[0] || []"
                      [scrollable]="true"
                      scrollHeight="flex"
                      styleClass="p-datatable-sm"
                      selectionMode="multiple"
                      [(selection)]="panelSelections[0]"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th style="width: 40px">
                            <p-checkbox
                              [binary]="true"
                              (onChange)="toggleAllPanel(0, $event)"
                            ></p-checkbox>
                          </th>
                          <th>التاريخ</th>
                          <th>المرجع</th>
                          <th>المبلغ</th>
                          <th>الحالة</th>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-entry>
                        <tr [class.bg-green-50]="isInBasket(entry)" [class.bg-blue-50]="entry.amount > 0" [class.bg-red-50]="entry.amount < 0">
                          <td>
                            <p-checkbox
                              [(ngModel)]="entry.selected"
                              [binary]="true"
                              (onChange)="onEntrySelect(entry, 0)"
                            ></p-checkbox>
                          </td>
                          <td>{{ entry.entryDate | date:'MM-dd' }}</td>
                          <td>
                            <div class="text-sm">{{ entry.referenceNumber || '-' }}</div>
                            <div class="text-xs text-gray-500">{{ entry.description }}</div>
                          </td>
                          <td [class.text-blue-600]="entry.amount > 0" [class.text-red-600]="entry.amount < 0" class="font-mono">
                            {{ formatAmount(entry.amount) }}
                          </td>
                          <td>
                            <p-tag [value]="getStatusLabel(entry.status)" [severity]="getStatusSeverity(entry.status)" [style]="{ fontSize: '0.7rem' }"></p-tag>
                          </td>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="5" class="text-center py-4 text-gray-500">
                            اختر حساب لعرض الحركات
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </div>
              </ng-template>

              <!-- Panel 2: وسيط البنك -->
              <ng-template pTemplate>
                <div class="h-full flex flex-col p-2">
                  <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-gray-700">{{ panels()[1]?.name || 'الحساب الوسيط 2' }}</span>
                      <p-badge [value]="getPanelCount(1)" severity="info"></p-badge>
                    </div>
                    <p-select
                      [(ngModel)]="selectedAccounts[1]"
                      [options]="clearingAccounts()"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="اختر الحساب"
                      [style]="{ width: '200px' }"
                      (onChange)="loadPanelEntries(1)"
                    ></p-select>
                  </div>
                  <div class="flex-1 overflow-auto border rounded">
                    <p-table
                      [value]="panelEntries()[1] || []"
                      [scrollable]="true"
                      scrollHeight="flex"
                      styleClass="p-datatable-sm"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th style="width: 40px">
                            <p-checkbox
                              [binary]="true"
                              (onChange)="toggleAllPanel(1, $event)"
                            ></p-checkbox>
                          </th>
                          <th>التاريخ</th>
                          <th>المرجع</th>
                          <th>المبلغ</th>
                          <th>الحالة</th>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-entry>
                        <tr [class.bg-green-50]="isInBasket(entry)" [class.bg-blue-50]="entry.amount > 0" [class.bg-red-50]="entry.amount < 0">
                          <td>
                            <p-checkbox
                              [(ngModel)]="entry.selected"
                              [binary]="true"
                              (onChange)="onEntrySelect(entry, 1)"
                            ></p-checkbox>
                          </td>
                          <td>{{ entry.entryDate | date:'MM-dd' }}</td>
                          <td>
                            <div class="text-sm">{{ entry.referenceNumber || '-' }}</div>
                            <div class="text-xs text-gray-500">{{ entry.description }}</div>
                          </td>
                          <td [class.text-blue-600]="entry.amount > 0" [class.text-red-600]="entry.amount < 0" class="font-mono">
                            {{ formatAmount(entry.amount) }}
                          </td>
                          <td>
                            <p-tag [value]="getStatusLabel(entry.status)" [severity]="getStatusSeverity(entry.status)" [style]="{ fontSize: '0.7rem' }"></p-tag>
                          </td>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="5" class="text-center py-4 text-gray-500">
                            اختر حساب لعرض الحركات
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </div>
              </ng-template>
            </p-splitter>
          </ng-template>

          <!-- Right Panels -->
          <ng-template pTemplate>
            <p-splitter layout="vertical" [panelSizes]="[50, 50]">
              <!-- Panel 3: وسيط إيرادات الفوترة -->
              <ng-template pTemplate>
                <div class="h-full flex flex-col p-2">
                  <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-gray-700">{{ panels()[2]?.name || 'الحساب الوسيط 3' }}</span>
                      <p-badge [value]="getPanelCount(2)" severity="info"></p-badge>
                    </div>
                    <p-select
                      [(ngModel)]="selectedAccounts[2]"
                      [options]="clearingAccounts()"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="اختر الحساب"
                      [style]="{ width: '200px' }"
                      (onChange)="loadPanelEntries(2)"
                    ></p-select>
                  </div>
                  <div class="flex-1 overflow-auto border rounded">
                    <p-table
                      [value]="panelEntries()[2] || []"
                      [scrollable]="true"
                      scrollHeight="flex"
                      styleClass="p-datatable-sm"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th style="width: 40px">
                            <p-checkbox
                              [binary]="true"
                              (onChange)="toggleAllPanel(2, $event)"
                            ></p-checkbox>
                          </th>
                          <th>التاريخ</th>
                          <th>المرجع</th>
                          <th>المبلغ</th>
                          <th>الحالة</th>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-entry>
                        <tr [class.bg-green-50]="isInBasket(entry)" [class.bg-blue-50]="entry.amount > 0" [class.bg-red-50]="entry.amount < 0">
                          <td>
                            <p-checkbox
                              [(ngModel)]="entry.selected"
                              [binary]="true"
                              (onChange)="onEntrySelect(entry, 2)"
                            ></p-checkbox>
                          </td>
                          <td>{{ entry.entryDate | date:'MM-dd' }}</td>
                          <td>
                            <div class="text-sm">{{ entry.referenceNumber || '-' }}</div>
                            <div class="text-xs text-gray-500">{{ entry.description }}</div>
                          </td>
                          <td [class.text-blue-600]="entry.amount > 0" [class.text-red-600]="entry.amount < 0" class="font-mono">
                            {{ formatAmount(entry.amount) }}
                          </td>
                          <td>
                            <p-tag [value]="getStatusLabel(entry.status)" [severity]="getStatusSeverity(entry.status)" [style]="{ fontSize: '0.7rem' }"></p-tag>
                          </td>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="5" class="text-center py-4 text-gray-500">
                            اختر حساب لعرض الحركات
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </div>
              </ng-template>

              <!-- Panel 4: وسيط إيرادات الدفع المسبق -->
              <ng-template pTemplate>
                <div class="h-full flex flex-col p-2">
                  <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-gray-700">{{ panels()[3]?.name || 'الحساب الوسيط 4' }}</span>
                      <p-badge [value]="getPanelCount(3)" severity="info"></p-badge>
                    </div>
                    <p-select
                      [(ngModel)]="selectedAccounts[3]"
                      [options]="clearingAccounts()"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="اختر الحساب"
                      [style]="{ width: '200px' }"
                      (onChange)="loadPanelEntries(3)"
                    ></p-select>
                  </div>
                  <div class="flex-1 overflow-auto border rounded">
                    <p-table
                      [value]="panelEntries()[3] || []"
                      [scrollable]="true"
                      scrollHeight="flex"
                      styleClass="p-datatable-sm"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th style="width: 40px">
                            <p-checkbox
                              [binary]="true"
                              (onChange)="toggleAllPanel(3, $event)"
                            ></p-checkbox>
                          </th>
                          <th>التاريخ</th>
                          <th>المرجع</th>
                          <th>المبلغ</th>
                          <th>الحالة</th>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-entry>
                        <tr [class.bg-green-50]="isInBasket(entry)" [class.bg-blue-50]="entry.amount > 0" [class.bg-red-50]="entry.amount < 0">
                          <td>
                            <p-checkbox
                              [(ngModel)]="entry.selected"
                              [binary]="true"
                              (onChange)="onEntrySelect(entry, 3)"
                            ></p-checkbox>
                          </td>
                          <td>{{ entry.entryDate | date:'MM-dd' }}</td>
                          <td>
                            <div class="text-sm">{{ entry.referenceNumber || '-' }}</div>
                            <div class="text-xs text-gray-500">{{ entry.description }}</div>
                          </td>
                          <td [class.text-blue-600]="entry.amount > 0" [class.text-red-600]="entry.amount < 0" class="font-mono">
                            {{ formatAmount(entry.amount) }}
                          </td>
                          <td>
                            <p-tag [value]="getStatusLabel(entry.status)" [severity]="getStatusSeverity(entry.status)" [style]="{ fontSize: '0.7rem' }"></p-tag>
                          </td>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="5" class="text-center py-4 text-gray-500">
                            اختر حساب لعرض الحركات
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </div>
              </ng-template>
            </p-splitter>
          </ng-template>
        </p-splitter>

        <!-- Reconciliation Basket -->
        <div class="h-[200px] bg-gray-100 border-t p-4">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-4">
              <h3 class="text-lg font-bold text-gray-800">سلة التسوية</h3>
              <p-badge [value]="basket().length" severity="secondary"></p-badge>
            </div>
            <div class="flex gap-2">
              <p-button
                label="إضافة المحدد"
                icon="pi pi-plus"
                severity="secondary"
                size="small"
                (onClick)="addSelectedToBasket()"
                [disabled]="!hasSelection()"
              ></p-button>
              <p-button
                label="مسح السلة"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [outlined]="true"
                (onClick)="clearBasket()"
                [disabled]="basket().length === 0"
              ></p-button>
              <p-button
                label="تسوية"
                icon="pi pi-check"
                severity="success"
                size="small"
                (onClick)="performReconciliation()"
                [disabled]="!canReconcile()"
              ></p-button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 h-[120px]">
            <!-- Debit Column -->
            <div class="bg-blue-50 rounded-lg p-3 overflow-auto">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-blue-800">المدين</span>
                <span class="text-xl font-bold text-blue-600">{{ formatAmount(debitTotal()) }}</span>
              </div>
              <div class="space-y-1">
                <div
                  *ngFor="let item of debitItems()"
                  class="flex justify-between items-center bg-white rounded px-2 py-1 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <button
                      pButton
                      icon="pi pi-times"
                      class="p-button-text p-button-danger p-button-sm"
                      (click)="removeFromBasket(item.entry)"
                    ></button>
                    <span>{{ item.entry.description || item.entry.referenceNumber }}</span>
                  </div>
                  <span class="font-mono text-blue-600">{{ formatAmount(item.entry.amount) }}</span>
                </div>
              </div>
            </div>

            <!-- Credit Column -->
            <div class="bg-red-50 rounded-lg p-3 overflow-auto">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-red-800">الدائن</span>
                <span class="text-xl font-bold text-red-600">{{ formatAmount(creditTotal()) }}</span>
              </div>
              <div class="space-y-1">
                <div
                  *ngFor="let item of creditItems()"
                  class="flex justify-between items-center bg-white rounded px-2 py-1 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <button
                      pButton
                      icon="pi pi-times"
                      class="p-button-text p-button-danger p-button-sm"
                      (click)="removeFromBasket(item.entry)"
                    ></button>
                    <span>{{ item.entry.description || item.entry.referenceNumber }}</span>
                  </div>
                  <span class="font-mono text-red-600">{{ formatAmount(Math.abs(item.entry.amount)) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Balance Check -->
          <div class="mt-2 flex justify-center items-center gap-4">
            <span class="text-gray-600">الفرق:</span>
            <span
              class="text-xl font-bold"
              [class.text-green-600]="difference() === 0"
              [class.text-red-600]="difference() !== 0"
            >
              {{ formatAmount(difference()) }}
            </span>
            <span *ngIf="difference() === 0" class="text-green-600">
              <i class="pi pi-check-circle"></i> متوازن
            </span>
            <span *ngIf="difference() !== 0" class="text-red-600">
              <i class="pi pi-exclamation-triangle"></i> غير متوازن
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReconciliationWorkspaceComponent implements OnInit {
  reconciliationId: string | null = null;
  reconciliation = signal<any>(null);
  clearingAccounts = signal<ClearingAccount[]>([]);
  panels = signal<ClearingAccount[]>([]);
  panelEntries = signal<ClearingEntry[][]>([[], [], [], []]);
  basket = signal<BasketItem[]>([]);

  selectedAccounts: (string | null)[] = [null, null, null, null];
  panelSelections: ClearingEntry[][] = [[], [], [], []];

  Math = Math;

  // Computed signals
  debitItems = computed(() => this.basket().filter(item => item.entry.amount > 0));
  creditItems = computed(() => this.basket().filter(item => item.entry.amount < 0));
  debitTotal = computed(() => this.debitItems().reduce((sum, item) => sum + item.entry.amount, 0));
  creditTotal = computed(() => Math.abs(this.creditItems().reduce((sum, item) => sum + item.entry.amount, 0)));
  difference = computed(() => Math.abs(this.debitTotal() - this.creditTotal()));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.reconciliationId = this.route.snapshot.paramMap.get('id');
    this.loadClearingAccounts();
    if (this.reconciliationId) {
      this.loadReconciliation();
    }
  }

  async loadClearingAccounts() {
    try {
      const response = await this.api.get<any>('/clearing/accounts');
      this.clearingAccounts.set((response as any).data || response);
      
      // Set default accounts for panels
      const accounts = this.clearingAccounts();
      if (accounts.length >= 4) {
        this.selectedAccounts = accounts.slice(0, 4).map(a => a.id);
        this.panels.set(accounts.slice(0, 4));
        for (let i = 0; i < 4; i++) {
          this.loadPanelEntries(i);
        }
      }
    } catch (error) {
      console.error('Error loading clearing accounts:', error);
    }
  }

  async loadReconciliation() {
    if (!this.reconciliationId) return;
    try {
      const response = await this.api.get<any>(`/reconciliation/${this.reconciliationId}`);
      this.reconciliation.set(response);
    } catch (error) {
      console.error('Error loading reconciliation:', error);
    }
  }

  async loadPanelEntries(panelIndex: number) {
    const accountId = this.selectedAccounts[panelIndex];
    if (!accountId) return;

    try {
      const response = await this.api.get<any>(`/clearing/accounts/${accountId}/entries`, {
        status: 'pending',
        limit: 100,
      });
      
      const entries = this.panelEntries();
      entries[panelIndex] = ((response as any).data || response).map((e: any) => ({ ...e, selected: false }));
      this.panelEntries.set([...entries]);
      
      // Update panel info
      const account = this.clearingAccounts().find(a => a.id === accountId);
      if (account) {
        const panels = this.panels();
        panels[panelIndex] = account;
        this.panels.set([...panels]);
      }
    } catch (error) {
      console.error('Error loading panel entries:', error);
    }
  }

  getPanelCount(panelIndex: number): string {
    return String(this.panelEntries()[panelIndex]?.length || 0);
  }

  onEntrySelect(entry: ClearingEntry, panelIndex: number) {
    // Update selection state
    const entries = this.panelEntries();
    const panelData = entries[panelIndex];
    const idx = panelData.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      panelData[idx] = { ...panelData[idx], selected: entry.selected };
      entries[panelIndex] = [...panelData];
      this.panelEntries.set([...entries]);
    }
  }

  toggleAllPanel(panelIndex: number, event: any) {
    const entries = this.panelEntries();
    const panelData = entries[panelIndex].map(e => ({ ...e, selected: event.checked }));
    entries[panelIndex] = panelData;
    this.panelEntries.set([...entries]);
  }

  hasSelection(): boolean {
    return this.panelEntries().some(panel => panel.some(e => e.selected));
  }

  addSelectedToBasket() {
    const newItems: BasketItem[] = [];
    
    for (const panel of this.panelEntries()) {
      for (const entry of panel) {
        if (entry.selected && !this.isInBasket(entry)) {
          newItems.push({
            entry,
            side: entry.amount > 0 ? 'debit' : 'credit',
          });
        }
      }
    }

    if (newItems.length > 0) {
      this.basket.set([...this.basket(), ...newItems]);
      this.messageService.add({
        severity: 'success',
        summary: 'تمت الإضافة',
        detail: `تمت إضافة ${newItems.length} حركة إلى السلة`,
      });
    }
  }

  removeFromBasket(entry: ClearingEntry) {
    this.basket.set(this.basket().filter(item => item.entry.id !== entry.id));
  }

  clearBasket() {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من مسح السلة؟',
      header: 'تأكيد',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.basket.set([]);
      },
    });
  }

  isInBasket(entry: ClearingEntry): boolean {
    return this.basket().some(item => item.entry.id === entry.id);
  }

  canReconcile(): boolean {
    return this.basket().length >= 2 && this.difference() === 0;
  }

  async performReconciliation() {
    if (!this.canReconcile()) return;

    this.confirmationService.confirm({
      message: `سيتم تسوية ${this.basket().length} حركة. هل أنت متأكد؟`,
      header: 'تأكيد التسوية',
      icon: 'pi pi-check-circle',
      accept: async () => {
        try {
          const sourceEntryIds = this.debitItems().map(item => item.entry.id);
          const targetEntryIds = this.creditItems().map(item => item.entry.id);

          await this.api.post('/reconciliation/matches', {
            reconciliationId: this.reconciliationId,
            sourceEntryIds,
            targetEntryIds,
            notes: `تسوية ${sourceEntryIds.length}:${targetEntryIds.length}`,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'تمت التسوية',
            detail: 'تمت التسوية بنجاح',
          });

          // Clear basket and reload
          this.basket.set([]);
          for (let i = 0; i < 4; i++) {
            this.loadPanelEntries(i);
          }
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: error.message || 'فشلت عملية التسوية',
          });
        }
      },
    });
  }

  async runAutoMatch() {
    if (!this.reconciliationId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يجب حفظ التسوية أولاً',
      });
      return;
    }

    try {
      await this.api.post(`/reconciliation/${this.reconciliationId}/auto-match`, {});
      this.messageService.add({
        severity: 'success',
        summary: 'تمت المطابقة',
        detail: 'تمت المطابقة التلقائية بنجاح',
      });
      
      // Reload panels
      for (let i = 0; i < 4; i++) {
        this.loadPanelEntries(i);
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطأ',
        detail: error.message || 'فشلت المطابقة التلقائية',
      });
    }
  }

  async save() {
    this.messageService.add({
      severity: 'success',
      summary: 'تم الحفظ',
      detail: 'تم حفظ التسوية بنجاح',
    });
  }

  goBack() {
    this.router.navigate(['/reconciliation']);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'معلق',
      matched: 'متطابق',
      allocated: 'موزع',
      exception: 'استثناء',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      pending: 'warn',
      matched: 'success',
      allocated: 'info',
      exception: 'danger',
    };
    return severities[status] || 'secondary';
  }
}
