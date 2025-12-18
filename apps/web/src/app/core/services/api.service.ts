import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User, Role, Permission, Station, Business, BusinessStatistics,
  Account, AccountTree, JournalEntry, CreateJournalEntry,
  PaginatedResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============ Users ============
  getUsers(params?: any): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params: this.buildParams(params) });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(data: Partial<User> & { password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  assignUserRoles(userId: string, roleIds: string[]): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/${userId}/roles`, { roleIds });
  }

  // ============ Roles ============
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/roles/${id}`);
  }

  createRole(data: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, data);
  }

  updateRole(id: string, data: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/roles/${id}`, data);
  }

  deleteRole(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/roles/${id}`);
  }

  assignRolePermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles/${roleId}/permissions`, { permissionIds });
  }

  // ============ Permissions ============
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
  }

  getPermissionModules(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/permissions/modules`);
  }

  initializePermissions(): Observable<any> {
    return this.http.post(`${this.apiUrl}/permissions/seed`, {});
  }

  // ============ Business ============
  getBusiness(): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/business`);
  }

  updateBusiness(data: Partial<Business>): Observable<Business> {
    return this.http.put<Business>(`${this.apiUrl}/business`, data);
  }

  getBusinessStatistics(): Observable<BusinessStatistics> {
    return this.http.get<BusinessStatistics>(`${this.apiUrl}/business/statistics`);
  }

  // ============ Stations ============
  getStations(params?: any): Observable<PaginatedResponse<Station>> {
    return this.http.get<PaginatedResponse<Station>>(`${this.apiUrl}/stations`, { params: this.buildParams(params) });
  }

  getMyStations(): Observable<Station[]> {
    return this.http.get<Station[]>(`${this.apiUrl}/stations/my-stations`);
  }

  getStation(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/stations/${id}`);
  }

  createStation(data: Partial<Station>): Observable<Station> {
    return this.http.post<Station>(`${this.apiUrl}/stations`, data);
  }

  updateStation(id: string, data: Partial<Station>): Observable<Station> {
    return this.http.put<Station>(`${this.apiUrl}/stations/${id}`, data);
  }

  deleteStation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stations/${id}`);
  }

  // ============ Accounts ============
  getAccounts(params?: any): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/accounts`, { params: this.buildParams(params) });
  }

  getAccountTree(): Observable<AccountTree> {
    return this.http.get<AccountTree>(`${this.apiUrl}/accounts/tree`);
  }

  getAccount(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/accounts/${id}`);
  }

  createAccount(data: Partial<Account>): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/accounts`, data);
  }

  updateAccount(id: string, data: Partial<Account>): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/accounts/${id}`, data);
  }

  deleteAccount(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/accounts/${id}`);
  }

  seedAccounts(): Observable<{ created: number }> {
    return this.http.post<{ created: number }>(`${this.apiUrl}/accounts/seed`, {});
  }

  // ============ Journal Entries ============
  getJournalEntries(params?: any): Observable<PaginatedResponse<JournalEntry>> {
    return this.http.get<PaginatedResponse<JournalEntry>>(`${this.apiUrl}/journal-entries`, { params: this.buildParams(params) });
  }

  getJournalEntry(id: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiUrl}/journal-entries/${id}`);
  }

  createJournalEntry(data: CreateJournalEntry): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries`, data);
  }

  updateJournalEntry(id: string, data: Partial<CreateJournalEntry>): Observable<JournalEntry> {
    return this.http.put<JournalEntry>(`${this.apiUrl}/journal-entries/${id}`, data);
  }

  deleteJournalEntry(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/journal-entries/${id}`);
  }

  postJournalEntry(id: string): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/${id}/post`, {});
  }

  voidJournalEntry(id: string): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/${id}/void`, {});
  }

  // ============ Helper ============
  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return httpParams;
  }
}
