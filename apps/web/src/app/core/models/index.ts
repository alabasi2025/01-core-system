// Auth Models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  businessId: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  scope: 'business' | 'station';
  stationId?: string;
  roles: Role[];
  permissions: string[];
}

// Role & Permission Models
export interface Role {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  nameEn?: string;
}

// Business & Station Models
export interface Business {
  id: string;
  name: string;
  nameEn?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  isActive: boolean;
}

export interface Station {
  id: string;
  businessId: string;
  name: string;
  nameEn?: string;
  type: 'generation_distribution' | 'solar' | 'distribution_only';
  location?: string;
  latitude?: number;
  longitude?: number;
  hasGenerators: boolean;
  hasSolar: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Account Models
export interface Account {
  id: string;
  businessId: string;
  parentId?: string;
  code: string;
  name: string;
  nameEn?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  nature: 'debit' | 'credit';
  level: number;
  isParent: boolean;
  isActive: boolean;
  systemAccount?: string;
  description?: string;
  children?: Account[];
}

export interface AccountTree {
  assets: Account[];
  liabilities: Account[];
  equity: Account[];
  revenue: Account[];
  expenses: Account[];
}

// Journal Entry Models
export interface JournalEntry {
  id: string;
  businessId: string;
  stationId?: string;
  stationName?: string;
  entryNumber: string;
  entryDate: Date;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'voided';
  createdBy: string;
  createdByName: string;
  postedBy?: string;
  postedByName?: string;
  postedAt?: Date;
  createdAt: Date;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalEntry {
  stationId?: string;
  entryDate: string;
  description?: string;
  lines: JournalEntryLine[];
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Statistics
export interface BusinessStatistics {
  totalUsers: number;
  totalStations: number;
  totalAccounts: number;
  totalJournalEntries: number;
  draftEntries: number;
  postedEntries: number;
}
