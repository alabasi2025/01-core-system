import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Account } from '../../../core/models';

interface TreeNode extends Account {
  children?: TreeNode[];
  expanded?: boolean;
  level?: number;
}

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="accounts-page">
      <div class="page-header">
        <div class="header-content">
          <h1>شجرة الحسابات</h1>
          <p>إدارة دليل الحسابات المحاسبية</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="seedAccounts()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            تهيئة الحسابات الافتراضية
          </button>
          <a routerLink="/accounts/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            إضافة حساب
          </a>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon assets">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-label">الأصول</span>
            <span class="card-value">{{ getAccountCount('ASSET') }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon liabilities">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-label">الخصوم</span>
            <span class="card-value">{{ getAccountCount('LIABILITY') }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon equity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-label">حقوق الملكية</span>
            <span class="card-value">{{ getAccountCount('EQUITY') }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon revenue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-label">الإيرادات</span>
            <span class="card-value">{{ getAccountCount('REVENUE') }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon expense">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
              <polyline points="17 18 23 18 23 12"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-label">المصروفات</span>
            <span class="card-value">{{ getAccountCount('EXPENSE') }}</span>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>جاري تحميل شجرة الحسابات...</p>
        </div>
      } @else {
        <div class="tree-container">
          <div class="tree-header">
            <div class="tree-actions">
              <button class="btn-icon" (click)="expandAll()" title="توسيع الكل">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </button>
              <button class="btn-icon" (click)="collapseAll()" title="طي الكل">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 14 10 14 10 20"/>
                  <polyline points="20 10 14 10 14 4"/>
                  <line x1="14" y1="10" x2="21" y2="3"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="tree-content">
            @for (node of treeData(); track node.id) {
              <ng-container *ngTemplateOutlet="treeNode; context: { node: node }"></ng-container>
            }
          </div>
        </div>

        @if (treeData().length === 0) {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <h3>لا توجد حسابات</h3>
            <p>اضغط على "تهيئة الحسابات الافتراضية" لإنشاء شجرة الحسابات</p>
          </div>
        }
      }
    </div>

    <ng-template #treeNode let-node="node">
      <div class="tree-node" [style.padding-right.px]="(node.level || 0) * 24">
        <div class="node-content" [class.has-children]="node.children && node.children.length > 0">
          @if (node.children && node.children.length > 0) {
            <button class="expand-btn" (click)="toggleNode(node)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.rotated]="node.expanded">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          } @else {
            <span class="expand-placeholder"></span>
          }
          
          <div class="node-icon" [class]="getAccountTypeClass(node.type)">
            <span [innerHTML]="getAccountTypeIcon(node.type)"></span>
          </div>
          
          <div class="node-info">
            <span class="node-code">{{ node.code }}</span>
            <span class="node-name">{{ node.nameAr || node.name }}</span>
          </div>
          
          <div class="node-badges">
            @if (node.isSystem) {
              <span class="badge system">نظامي</span>
            }
            <span class="badge type" [class]="getAccountTypeClass(node.type)">{{ getAccountTypeName(node.type) }}</span>
          </div>
          
          <div class="node-actions">
            <a [routerLink]="['/accounts', node.id]" class="action-btn" title="تعديل">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </a>
          </div>
        </div>
        
        @if (node.expanded && node.children && node.children.length > 0) {
          <div class="node-children">
            @for (child of node.children; track child.id) {
              <ng-container *ngTemplateOutlet="treeNode; context: { node: child }"></ng-container>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .accounts-page {
      padding: 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #1f2937;
    }

    .header-content p {
      margin: 0;
      color: #6b7280;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon.assets { background: #dbeafe; color: #2563eb; }
    .card-icon.liabilities { background: #fee2e2; color: #dc2626; }
    .card-icon.equity { background: #dcfce7; color: #16a34a; }
    .card-icon.revenue { background: #fef3c7; color: #d97706; }
    .card-icon.expense { background: #f3e8ff; color: #9333ea; }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-label {
      font-size: 13px;
      color: #6b7280;
    }

    .card-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tree-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tree-header {
      display: flex;
      justify-content: flex-end;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .tree-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: white;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .tree-content {
      padding: 16px;
    }

    .tree-node {
      margin-bottom: 4px;
    }

    .node-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      transition: background 0.2s;
    }

    .node-content:hover {
      background: #f9fafb;
    }

    .expand-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .expand-btn:hover {
      background: #e5e7eb;
    }

    .expand-btn svg {
      transition: transform 0.2s;
    }

    .expand-btn svg.rotated {
      transform: rotate(90deg);
    }

    .expand-placeholder {
      width: 24px;
      height: 24px;
    }

    .node-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .node-icon :deep(svg) {
      width: 16px;
      height: 16px;
    }

    .node-icon.ASSET { background: #dbeafe; color: #2563eb; }
    .node-icon.LIABILITY { background: #fee2e2; color: #dc2626; }
    .node-icon.EQUITY { background: #dcfce7; color: #16a34a; }
    .node-icon.REVENUE { background: #fef3c7; color: #d97706; }
    .node-icon.EXPENSE { background: #f3e8ff; color: #9333ea; }

    .node-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .node-code {
      font-family: monospace;
      font-size: 14px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .node-name {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }

    .node-badges {
      display: flex;
      gap: 8px;
    }

    .badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 600;
    }

    .badge.system {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.type {
      color: white;
    }

    .badge.type.ASSET { background: #2563eb; }
    .badge.type.LIABILITY { background: #dc2626; }
    .badge.type.EQUITY { background: #16a34a; }
    .badge.type.REVENUE { background: #d97706; }
    .badge.type.EXPENSE { background: #9333ea; }

    .node-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .node-content:hover .node-actions {
      opacity: 1;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: #f3f4f6;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      text-decoration: none;
    }

    .action-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .node-children {
      margin-top: 4px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
      color: #6b7280;
      background: white;
      border-radius: 16px;
    }

    .empty-state svg {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      max-width: 300px;
    }
  `]
})
export class AccountsListComponent implements OnInit {
  loading = signal(true);
  accounts = signal<Account[]>([]);
  treeData = signal<TreeNode[]>([]);

  accountTypeNames: Record<string, string> = {
    'ASSET': 'أصول',
    'LIABILITY': 'خصوم',
    'EQUITY': 'حقوق ملكية',
    'REVENUE': 'إيرادات',
    'EXPENSE': 'مصروفات'
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.apiService.getAccounts().subscribe({
      next: (data: any) => {
        const accounts = data.data || data || [];
        this.accounts.set(accounts);
        this.buildTree(accounts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  buildTree(accounts: Account[]): void {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Create nodes
    accounts.forEach(acc => {
      map.set(acc.id, { ...acc, children: [], expanded: true, level: 0 });
    });

    // Build hierarchy
    accounts.forEach(acc => {
      const node = map.get(acc.id)!;
      if (acc.parentId && map.has(acc.parentId)) {
        const parent = map.get(acc.parentId)!;
        node.level = (parent.level || 0) + 1;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by code
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.code.localeCompare(b.code));
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          sortNodes(n.children);
        }
      });
    };
    sortNodes(roots);

    this.treeData.set(roots);
  }

  toggleNode(node: TreeNode): void {
    node.expanded = !node.expanded;
  }

  expandAll(): void {
    const expand = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        n.expanded = true;
        if (n.children) expand(n.children);
      });
    };
    expand(this.treeData());
    this.treeData.set([...this.treeData()]);
  }

  collapseAll(): void {
    const collapse = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        n.expanded = false;
        if (n.children) collapse(n.children);
      });
    };
    collapse(this.treeData());
    this.treeData.set([...this.treeData()]);
  }

  seedAccounts(): void {
    this.loading.set(true);
    this.apiService.seedAccounts().subscribe({
      next: () => {
        this.loadAccounts();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getAccountCount(type: string): number {
    return this.accounts().filter(a => a.type === type).length;
  }

  getAccountTypeName(type: string): string {
    return this.accountTypeNames[type] || type;
  }

  getAccountTypeClass(type: string): string {
    return type;
  }

  getAccountTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'ASSET': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>',
      'LIABILITY': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      'EQUITY': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      'REVENUE': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
      'EXPENSE': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>'
    };
    return icons[type] || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }
}
