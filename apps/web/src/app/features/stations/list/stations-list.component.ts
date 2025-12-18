import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Station } from '../../../core/models';

interface StationTreeNode {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  type: string;
  level: number;
  isActive: boolean;
  usersCount: number;
  entriesCount: number;
  children: StationTreeNode[];
  expanded?: boolean;
}

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>إدارة المحطات</h1>
        <p>عرض وإدارة محطات الكهرباء والفروع</p>
      </div>
      <div class="header-actions">
        <div class="view-toggle">
          <button [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button [class.active]="viewMode() === 'tree'" (click)="loadTree()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v6m0 4v10M8 8H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4m8-6h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4"/>
            </svg>
          </button>
        </div>
        @if (hasPermission('stations:create')) {
          <a routerLink="/stations/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            محطة جديدة
          </a>
        }
      </div>
    </div>
    
    <!-- Statistics Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics()?.totalStations || 0 }}</span>
          <span class="stat-label">إجمالي المحطات</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics()?.activeStations || 0 }}</span>
          <span class="stat-label">محطات نشطة</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics()?.totalSolarCapacity || 0 }}</span>
          <span class="stat-label">سعة شمسية (كيلوواط)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics()?.totalUsers || 0 }}</span>
          <span class="stat-label">موظفي المحطات</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="بحث بالاسم أو الرمز..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        </div>
        <div class="filters">
          <select [(ngModel)]="typeFilter" (change)="loadStations()">
            <option value="">جميع الأنواع</option>
            <option value="generation_distribution">توليد وتوزيع</option>
            <option value="solar">طاقة شمسية</option>
            <option value="distribution_only">توزيع فقط</option>
          </select>
        </div>
      </div>
      
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else {
        @if (viewMode() === 'tree') {
          <div class="tree-view">
            @for (node of treeData(); track node.id) {
              <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: node, level: 0 }"></ng-container>
            }
          </div>
        } @else {
          <div class="stations-grid">
            @for (station of stations(); track station.id) {
              <div class="station-card" [class.inactive]="!station.isActive">
                <div class="station-header">
                  <div class="station-icon" [class]="station.type">
                    @if (station.type === 'generation_distribution') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                    } @else if (station.type === 'solar') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                      </svg>
                    }
                  </div>
                  <span class="station-status" [class.active]="station.isActive">
                    {{ station.isActive ? 'نشطة' : 'غير نشطة' }}
                  </span>
                </div>
                
                <h3 class="station-name">{{ station.name }}</h3>
                @if (station.code) {
                  <p class="station-code">{{ station.code }}</p>
                }
                
                @if (station.parent) {
                  <div class="parent-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2v6m0 4v10"/>
                    </svg>
                    تابعة لـ: {{ station.parent.name }}
                  </div>
                }
                
                <div class="station-type-badge" [class]="station.type">
                  {{ getStationTypeLabel(station.type) }}
                </div>
                
                @if (station.location) {
                  <div class="station-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ station.location }}
                  </div>
                }
                
                <div class="station-stats">
                  @if (station.childrenCount) {
                    <span class="stat-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v6m0 4v10"/>
                      </svg>
                      {{ station.childrenCount }} فرع
                    </span>
                  }
                  @if (station.usersCount) {
                    <span class="stat-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                      {{ station.usersCount }} موظف
                    </span>
                  }
                </div>
                
                <div class="station-actions">
                  @if (hasPermission('stations:read')) {
                    <a [routerLink]="['/stations', station.id]" class="btn-action">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      عرض
                    </a>
                  }
                  @if (hasPermission('stations:update')) {
                    <a [routerLink]="['/stations', station.id, 'edit']" class="btn-action">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      تعديل
                    </a>
                  }
                  @if (hasPermission('stations:manage-users')) {
                    <button class="btn-action" (click)="openUsersModal(station)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      الموظفين
                    </button>
                  }
                  @if (hasPermission('stations:delete')) {
                    <button class="btn-action danger" (click)="deleteStation(station)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      حذف
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <h3>لا توجد محطات</h3>
                <p>قم بإضافة محطة جديدة للبدء</p>
              </div>
            }
          </div>
        }
      }
    </div>
    
    <!-- Tree Node Template -->
    <ng-template #treeNode let-node let-level="level">
      <div class="tree-item" [style.padding-right.px]="level * 24 + 16">
        <div class="tree-item-content" (click)="toggleNode(node)">
          @if (node.children?.length) {
            <span class="expand-icon" [class.expanded]="node.expanded">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          } @else {
            <span class="expand-placeholder"></span>
          }
          <div class="tree-icon" [class]="node.type">
            @if (node.type === 'generation_distribution') {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            } @else if (node.type === 'solar') {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
            }
          </div>
          <span class="tree-name">{{ node.name }}</span>
          @if (node.code) {
            <span class="tree-code">({{ node.code }})</span>
          }
          <span class="tree-badge" [class]="node.type">{{ getStationTypeLabel(node.type) }}</span>
          <span class="tree-status" [class.active]="node.isActive">{{ node.isActive ? 'نشطة' : 'غير نشطة' }}</span>
          <span class="tree-stats">
            {{ node.usersCount }} موظف
          </span>
          <div class="tree-actions">
            <a [routerLink]="['/stations', node.id]" class="tree-action" (click)="$event.stopPropagation()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </a>
          </div>
        </div>
        @if (node.expanded && node.children?.length) {
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: child, level: level + 1 }"></ng-container>
          }
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .header-content h1 { margin: 0 0 4px; font-size: 24px; color: #1f2937; }
    .header-content p { margin: 0; color: #6b7280; font-size: 14px; }
    
    .header-actions { display: flex; gap: 12px; align-items: center; }
    
    .view-toggle {
      display: flex;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 4px;
    }
    
    .view-toggle button {
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }
    
    .view-toggle button.active {
      background: white;
      color: #f59e0b;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(30, 58, 95, 0.3);
    }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .stat-icon.orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .stat-icon.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .stat-icon.blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
    
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1f2937; }
    .stat-label { font-size: 13px; color: #6b7280; }
    
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .card-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    
    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
    }
    
    .search-box svg {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }
    
    .search-box input {
      width: 100%;
      padding: 12px 44px 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .search-box input:focus {
      outline: none;
      border-color: #f59e0b;
    }
    
    .filters select {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .stations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    
    .station-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }
    
    .station-card:hover {
      background: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .station-card.inactive { opacity: 0.7; }
    
    .station-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .station-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .station-icon.generation_distribution { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .station-icon.solar { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .station-icon.distribution_only { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    
    .station-status {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: #fef2f2;
      color: #dc2626;
    }
    
    .station-status.active { background: #f0fdf4; color: #16a34a; }
    
    .station-name { margin: 0 0 4px; font-size: 18px; color: #1f2937; }
    .station-code { margin: 0 0 12px; font-size: 13px; color: #9ca3af; }
    
    .parent-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .station-type-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .station-type-badge.generation_distribution { background: #fef3c7; color: #d97706; }
    .station-type-badge.solar { background: #d1fae5; color: #059669; }
    .station-type-badge.distribution_only { background: #dbeafe; color: #1d4ed8; }
    
    .station-location {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    
    .station-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .station-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      background: #f3f4f6;
      color: #4b5563;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-action:hover { background: #e5e7eb; }
    .btn-action.danger { color: #dc2626; }
    .btn-action.danger:hover { background: #fef2f2; }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: #9ca3af;
    }
    
    .empty-state svg { margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px; color: #6b7280; }
    .empty-state p { margin: 0; }
    
    /* Tree View Styles */
    .tree-view { padding: 16px 0; }
    
    .tree-item-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .tree-item-content:hover { background: #f9fafb; }
    
    .expand-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    
    .expand-icon.expanded { transform: rotate(90deg); }
    .expand-placeholder { width: 20px; }
    
    .tree-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .tree-icon.generation_distribution { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .tree-icon.solar { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .tree-icon.distribution_only { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    
    .tree-name { font-weight: 600; color: #1f2937; }
    .tree-code { font-size: 12px; color: #9ca3af; }
    
    .tree-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .tree-badge.generation_distribution { background: #fef3c7; color: #d97706; }
    .tree-badge.solar { background: #d1fae5; color: #059669; }
    .tree-badge.distribution_only { background: #dbeafe; color: #1d4ed8; }
    
    .tree-status {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      background: #fef2f2;
      color: #dc2626;
    }
    
    .tree-status.active { background: #f0fdf4; color: #16a34a; }
    
    .tree-stats {
      font-size: 12px;
      color: #9ca3af;
      margin-right: auto;
    }
    
    .tree-actions { display: flex; gap: 4px; }
    
    .tree-action {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: #6b7280;
      transition: all 0.2s;
    }
    
    .tree-action:hover { background: #e5e7eb; color: #1f2937; }
    
    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; gap: 16px; align-items: stretch; }
      .header-actions { justify-content: space-between; }
    }
  `]
})
export class StationsListComponent implements OnInit {
  stations = signal<any[]>([]);
  treeData = signal<StationTreeNode[]>([]);
  statistics = signal<any>(null);
  loading = signal(true);
  viewMode = signal<'grid' | 'tree'>('grid');
  searchQuery = '';
  typeFilter = '';
  
  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}
  
  ngOnInit() {
    this.loadStations();
    this.loadStatistics();
  }
  
  loadStations() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.typeFilter) params.type = this.typeFilter;
    
    this.api.get<any>('/stations', params).subscribe({
      next: (res) => {
        this.stations.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
  
  loadTree() {
    this.viewMode.set('tree');
    this.loading.set(true);
    this.api.get<StationTreeNode[]>('/stations/tree').subscribe({
      next: (data) => {
        this.treeData.set(data.map(node => ({ ...node, expanded: true })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
  
  loadStatistics() {
    this.api.get<any>('/stations/statistics').subscribe({
      next: (stats) => this.statistics.set(stats)
    });
  }
  
  onSearch() {
    this.loadStations();
  }
  
  toggleNode(node: StationTreeNode) {
    node.expanded = !node.expanded;
  }
  
  getStationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'generation_distribution': 'توليد وتوزيع',
      'solar': 'طاقة شمسية',
      'distribution_only': 'توزيع فقط'
    };
    return labels[type] || type;
  }
  
  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }
  
  openUsersModal(station: any) {
    // TODO: Implement users modal
    console.log('Open users modal for station:', station.id);
  }
  
  deleteStation(station: any) {
    if (confirm(`هل أنت متأكد من حذف محطة "${station.name}"؟`)) {
      this.api.delete(`/stations/${station.id}`).subscribe({
        next: () => this.loadStations(),
        error: (err) => alert(err.error?.message || 'حدث خطأ أثناء الحذف')
      });
    }
  }
}
