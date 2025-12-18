# 📋 خطة بناء النظام الأم - مراحل كاملة ودقيقة

> **تاريخ الإنشاء:** 18 ديسمبر 2025
> **المصدر:** ملف 01_النظام_الأم.md (6,407 سطر)

---

## 📊 ملخص المتطلبات

بناءً على تحليل ملف النظام الأم، يتكون النظام من **16 وحدة رئيسية** تحتاج إلى بناء:

| الوحدة | الحالة الحالية | الأولوية |
|--------|---------------|----------|
| 1. الهيكل التنظيمي | ✅ مكتمل جزئياً | عالية |
| 2. المستخدمين والصلاحيات | ✅ مكتمل جزئياً | عالية |
| 3. النظام المالي الأساسي | ✅ مكتمل جزئياً | عالية |
| 4. النظام المالي المتقدم | ❌ غير مبدوء | عالية |
| 5. مركز التسوية المرن | ❌ غير مبدوء | عالية |
| 6. إدارة صندوق التحصيل | ❌ غير مبدوء | متوسطة |
| 7. استيراد البيانات التاريخية | ❌ غير مبدوء | متوسطة |
| 8. شجرة الحسابات المفصلة (40+ حساب) | ⏳ جزئي | عالية |
| 9. القيود المحاسبية الهجينة | ❌ غير مبدوء | عالية |
| 10. كتالوج الخدمات والتسعير | ❌ غير مبدوء | متوسطة |
| 11. نظام أوامر الدفع المركزي | ❌ غير مبدوء | عالية |
| 12. نظام العهد المالية | ❌ غير مبدوء | متوسطة |
| 13. القيود الافتتاحية | ❌ غير مبدوء | عالية |
| 14. إدارة المجموعة متعددة المستويات | ⏳ جزئي | عالية |
| 15. ترحيل البيانات التاريخية | ❌ غير مبدوء | متوسطة |
| 16. التكامل مع نظام المطور | ❌ غير مبدوء | منخفضة |

---

# 🚀 المراحل التفصيلية

---

## المرحلة 1: استكمال الأساسيات (الأسبوع 1-2)

### 1.1 استكمال الهيكل التنظيمي

#### Backend (NestJS)
- [ ] إضافة حقول إضافية للمحطات (coordinates, contact_info)
- [ ] إضافة جدول الإعدادات العامة (core_settings)
- [ ] API للإعدادات (GET, PUT)

#### Frontend (Angular)
- [ ] شاشة إعدادات المجموعة
- [ ] شاشة تفاصيل المحطة مع الخريطة
- [ ] شاشة إحصائيات المحطة

#### الجداول المطلوبة:
```sql
core_settings (
    id UUID PRIMARY KEY,
    business_id UUID,
    key VARCHAR(100),
    value TEXT,
    type VARCHAR(20), -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(50),
    created_at, updated_at
)
```

---

### 1.2 استكمال المستخدمين والصلاحيات (RBAC)

#### Backend (NestJS)
- [ ] إضافة صلاحيات تفصيلية (60+ صلاحية)
- [ ] Guard للتحقق من الصلاحيات على مستوى الحقول
- [ ] API لتعيين صلاحيات متعددة دفعة واحدة
- [ ] API لنسخ صلاحيات دور لدور آخر

#### Frontend (Angular)
- [ ] شاشة إدارة الأدوار مع PrimeNG TreeTable
- [ ] شاشة تعيين الصلاحيات (مصفوفة تفاعلية)
- [ ] شاشة سجل نشاط المستخدمين

#### الصلاحيات المطلوبة (60+):
```
users.view, users.create, users.edit, users.delete, users.assign_roles
roles.view, roles.create, roles.edit, roles.delete, roles.assign_permissions
stations.view, stations.create, stations.edit, stations.delete
accounts.view, accounts.create, accounts.edit, accounts.delete
journal_entries.view, journal_entries.create, journal_entries.post, journal_entries.void
reports.trial_balance, reports.income_statement, reports.balance_sheet
reconciliation.view, reconciliation.create, reconciliation.approve
payment_orders.view, payment_orders.create, payment_orders.approve, payment_orders.pay
custodies.view, custodies.create, custodies.approve, custodies.settle
...
```

---

### 1.3 استكمال النظام المالي الأساسي

#### Backend (NestJS)
- [ ] إضافة حقل `level` للحسابات (تلقائي)
- [ ] إضافة حقل `full_code` للحسابات (مثل: 1000.1001.1002)
- [ ] API لحساب الرصيد الحالي لكل حساب
- [ ] API لميزان المراجعة
- [ ] API لكشف حساب

#### Frontend (Angular)
- [ ] شاشة شجرة الحسابات (PrimeNG Tree)
- [ ] شاشة إضافة حساب فرعي
- [ ] شاشة ميزان المراجعة
- [ ] شاشة كشف حساب
- [ ] شاشة تفاصيل القيد اليومي

#### الجداول المطلوبة:
```sql
-- تحديث جدول الحسابات
ALTER TABLE core_accounts ADD COLUMN level INT DEFAULT 1;
ALTER TABLE core_accounts ADD COLUMN full_code VARCHAR(50);
ALTER TABLE core_accounts ADD COLUMN opening_balance DECIMAL(15,2) DEFAULT 0;
ALTER TABLE core_accounts ADD COLUMN current_balance DECIMAL(15,2) DEFAULT 0;
```

---

## المرحلة 2: النظام المالي المتقدم (الأسبوع 3-4)

### 2.1 شجرة الحسابات المفصلة (40+ حساب)

#### الحسابات المطلوبة:

**الأصول (1000-1700):**
```
1000 - النقدية والبنوك
  1001 - النقدية بالصندوق
  1002 - حساب البنك A
  1003 - حساب البنك B
  1004 - حسابات أخرى

1100 - العملاء (الذمم المدينة)
  1101 - العملاء (عدادات تقليدية)
  1102 - العملاء (عدادات STS)
  1103 - العملاء (صندوق الدعم)

1200 - المخزون
  1201 - عدادات جديدة
  1202 - شاشات STS جديدة
  1203 - أختام جديدة
  1204 - قواطع جديدة
  1205 - أسلاك ومواد

1300 - التأمينات والودائع
  1301 - تأمينات لدى الموردين
  1302 - ودائع بنكية

1400 - الأصول الثابتة
  1401 - المباني
  1402 - السيارات
  1403 - الأثاث والمعدات
  1404 - أجهزة الحاسوب
  1405 - مجمع الإهلاك (سالب)

1700 - العهد والسلف
  1701 - عهد الموظفين
  1702 - سلف الموظفين
```

**الخصوم (2000-2400):**
```
2000 - الموردين (الذمم الدائنة)
  2001 - موردين محليين
  2002 - موردين خارجيين

2100 - تأمينات من العملاء
  2101 - تأمينات عدادات تقليدية
  2102 - تأمينات عدادات STS

2200 - الإيرادات المؤجلة
  2201 - إيرادات مؤجلة (دفع مسبق)
  2202 - إيرادات مؤجلة (دعم حكومي)

2300 - حسابات وسيطة (Clearing Accounts)
  2301 - وسيط صندوق التحصيل
  2302 - وسيط بنك A
  2303 - وسيط بنك B
  2304 - وسيط إيرادات الفوترة
  2305 - وسيط إيرادات الدفع المسبق
  2306 - وسيط صندوق الدعم

2400 - مستحقات الموظفين
  2401 - رواتب مستحقة
  2402 - حوافز مستحقة
```

**الإيرادات (4000-4200):**
```
4000 - إيرادات الكهرباء
  4001 - إيرادات كهرباء (عدادات تقليدية)
  4002 - إيرادات كهرباء (دفع مسبق)
  4003 - إيرادات كهرباء (دعم حكومي)

4100 - إيرادات الاشتراكات
  4101 - رسوم الاشتراك (عدادات تقليدية)
  4102 - رسوم الاشتراك (عدادات STS)

4200 - إيرادات أخرى
  4201 - إيرادات بيع عدادات
  4202 - إيرادات رسوم ترقية
  4203 - إيرادات رسوم استبدال
```

**المصروفات (5000-5500):**
```
5000 - تكلفة البضاعة المباعة
  5001 - تكلفة العدادات المباعة
  5002 - تكلفة المكونات المستخدمة

5100 - مصروفات الصيانة والتشغيل
  5101 - مصروفات صيانة العدادات
  5102 - مصروفات استبدال المكونات

5200 - مصروفات أخرى
  5201 - مصروفات إدارية
  5202 - مصروفات تسويق

5300 - مصروفات الرواتب
  5301 - رواتب الموظفين
  5302 - حوافز الموظفين
  5303 - مصروفات العمالة الميدانية

5400 - مصروفات الإهلاك
  5401 - إهلاك المباني
  5402 - إهلاك السيارات
  5403 - إهلاك الأثاث والمعدات

5500 - مصروفات التشغيل
  5501 - إيجارات
  5502 - كهرباء ومياه
  5503 - اتصالات
```

---

### 2.2 الحسابات الوسيطة (Clearing Accounts)

#### Backend (NestJS)
- [ ] إنشاء وحدة clearing-accounts
- [ ] جدول core_clearing_accounts
- [ ] جدول core_clearing_transactions
- [ ] API لإضافة حركة للحساب الوسيط
- [ ] API لعرض الحركات غير المسواة

#### Frontend (Angular)
- [ ] شاشة قائمة الحسابات الوسيطة
- [ ] شاشة حركات الحساب الوسيط
- [ ] شاشة إضافة حركة يدوية

#### الجداول المطلوبة:
```sql
core_clearing_accounts (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    account_id UUID REFERENCES core_accounts(id),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    source_system VARCHAR(50), -- 'billing', 'prepaid', 'collection', 'bank'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
)

core_clearing_transactions (
    id UUID PRIMARY KEY,
    clearing_account_id UUID REFERENCES core_clearing_accounts(id),
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'debit', 'credit'
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(100),
    description TEXT,
    is_reconciled BOOLEAN DEFAULT false,
    reconciliation_id UUID,
    reconciled_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 2.3 التقارير المالية

#### Backend (NestJS)
- [ ] API ميزان المراجعة (Trial Balance)
- [ ] API قائمة الدخل (Income Statement)
- [ ] API الميزانية العمومية (Balance Sheet)
- [ ] API كشف حساب (Account Statement)
- [ ] API تقرير المقارنة الشهرية

#### Frontend (Angular)
- [ ] شاشة ميزان المراجعة (مع تصدير Excel/PDF)
- [ ] شاشة قائمة الدخل
- [ ] شاشة الميزانية العمومية
- [ ] شاشة كشف حساب (مع فلترة بالتاريخ)
- [ ] شاشة تقرير المقارنة

---

## المرحلة 3: مركز التسوية المرن (الأسبوع 5-6)

### 3.1 محرك التسوية

#### Backend (NestJS)
- [ ] إنشاء وحدة reconciliation
- [ ] جدول core_reconciliation_sessions
- [ ] جدول core_reconciliation_items
- [ ] جدول core_reconciliation_rules
- [ ] API لإنشاء جلسة تسوية
- [ ] API للمطابقة التلقائية
- [ ] API للمطابقة اليدوية
- [ ] API لإتمام التسوية

#### الجداول المطلوبة:
```sql
core_reconciliation_sessions (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    session_number VARCHAR(20) UNIQUE,
    session_date DATE NOT NULL,
    clearing_account_id UUID,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'in_progress', 'completed'
    total_items INT DEFAULT 0,
    matched_items INT DEFAULT 0,
    unmatched_items INT DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    matched_amount DECIMAL(15,2) DEFAULT 0,
    difference DECIMAL(15,2) DEFAULT 0,
    created_by UUID,
    completed_by UUID,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
)

core_reconciliation_items (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES core_reconciliation_sessions(id),
    source_type VARCHAR(50), -- 'clearing', 'bank', 'invoice', 'payment'
    source_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    direction VARCHAR(10), -- 'debit', 'credit'
    reference_number VARCHAR(100),
    transaction_date DATE,
    description TEXT,
    is_matched BOOLEAN DEFAULT false,
    matched_with_id UUID,
    match_type VARCHAR(20), -- 'auto', 'manual', 'partial'
    created_at TIMESTAMP DEFAULT NOW()
)

core_reconciliation_rules (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    name VARCHAR(100),
    description TEXT,
    source_account_id UUID,
    target_account_id UUID,
    match_criteria JSONB, -- {"field": "reference", "operator": "equals"}
    tolerance_amount DECIMAL(15,2) DEFAULT 0,
    tolerance_days INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
)
```

### 3.2 واجهة التسوية متعددة الألواح

#### Frontend (Angular)
- [ ] شاشة مركز التسوية الرئيسية
- [ ] مكون اللوح (Panel Component) قابل للتخصيص
- [ ] مكون سلة التسوية (Reconciliation Basket)
- [ ] شاشة إعدادات قواعد المطابقة
- [ ] شاشة تقرير التسويات

---

## المرحلة 4: نظام أوامر الدفع (الأسبوع 7-8)

### 4.1 أوامر الدفع المركزي

#### Backend (NestJS)
- [ ] إنشاء وحدة payment-orders
- [ ] جدول core_payment_orders
- [ ] API لإنشاء أمر دفع
- [ ] API لاعتماد أمر الدفع
- [ ] API لصرف أمر الدفع
- [ ] API لإلغاء أمر الدفع
- [ ] Trigger لإنشاء القيد المحاسبي عند الصرف

#### الجداول المطلوبة:
```sql
core_payment_orders (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    station_id UUID,
    payment_order_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- مصدر أمر الدفع
    source_system VARCHAR(30) NOT NULL, -- 'field_operations', 'inventory', 'hr', 'customers', 'manual'
    source_type VARCHAR(30) NOT NULL, -- 'work_package', 'supplier_invoice', 'salary', 'incentive', 'deposit_refund'
    source_id UUID,
    source_reference VARCHAR(50),
    
    -- المستفيد
    beneficiary_type VARCHAR(20) NOT NULL, -- 'employee', 'team', 'contractor', 'supplier', 'customer'
    beneficiary_id UUID,
    beneficiary_name VARCHAR(100) NOT NULL,
    beneficiary_account VARCHAR(50),
    
    -- المبلغ
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'YER',
    description TEXT,
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
    
    -- الموافقات
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- الصرف
    paid_by UUID,
    paid_at TIMESTAMP,
    payment_method VARCHAR(20), -- 'cash', 'bank_transfer', 'check'
    payment_reference VARCHAR(100),
    
    -- القيد المحاسبي
    journal_entry_id UUID,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Frontend (Angular)
- [ ] شاشة قائمة أوامر الدفع
- [ ] شاشة إنشاء أمر دفع
- [ ] شاشة اعتماد أمر الدفع
- [ ] شاشة صرف أمر الدفع
- [ ] شاشة تفاصيل أمر الدفع

---

### 4.2 نظام العهد المالية

#### Backend (NestJS)
- [ ] إنشاء وحدة financial-custodies
- [ ] جدول core_financial_custodies
- [ ] جدول core_custody_settlement_documents
- [ ] API لطلب عهدة
- [ ] API لاعتماد العهدة
- [ ] API لصرف العهدة
- [ ] API لتصفية العهدة
- [ ] Triggers للقيود المحاسبية

#### الجداول المطلوبة:
```sql
core_financial_custodies (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    custody_number VARCHAR(20) UNIQUE NOT NULL,
    custody_type VARCHAR(30) NOT NULL, -- 'travel', 'petty_cash', 'purchase', 'project', 'salary_advance'
    
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),
    department_id UUID,
    
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'YER',
    
    spent_amount DECIMAL(15,2) DEFAULT 0,
    returned_amount DECIMAL(15,2) DEFAULT 0,
    deducted_amount DECIMAL(15,2) DEFAULT 0,
    
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'disbursed', 'settlement_pending', 'settled', 'cancelled'
    
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    disbursed_by UUID,
    disbursed_at TIMESTAMP,
    settled_by UUID,
    settled_at TIMESTAMP,
    
    disbursement_journal_entry_id UUID,
    settlement_journal_entry_id UUID,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

core_custody_settlement_documents (
    id UUID PRIMARY KEY,
    custody_id UUID REFERENCES core_financial_custodies(id),
    document_type VARCHAR(30), -- 'invoice', 'receipt', 'voucher'
    document_number VARCHAR(50),
    document_date DATE,
    vendor_name VARCHAR(200),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
```

#### Frontend (Angular)
- [ ] شاشة قائمة العهد المالية
- [ ] شاشة طلب عهدة جديدة
- [ ] شاشة اعتماد العهدة
- [ ] شاشة تصفية العهدة (مع رفع المستندات)
- [ ] تقرير العهد المفتوحة

---

## المرحلة 5: القيود الافتتاحية والترحيل (الأسبوع 9-10)

### 5.1 القيود الافتتاحية

#### Backend (NestJS)
- [ ] إنشاء وحدة opening-balances
- [ ] جدول core_opening_balances
- [ ] API لإدخال الأرصدة الافتتاحية
- [ ] API لإنشاء قيد الافتتاح
- [ ] API للتحقق من توازن الأرصدة

#### الجداول المطلوبة:
```sql
core_opening_balances (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    fiscal_year INT NOT NULL,
    account_id UUID REFERENCES core_accounts(id),
    debit_balance DECIMAL(15,2) DEFAULT 0,
    credit_balance DECIMAL(15,2) DEFAULT 0,
    is_posted BOOLEAN DEFAULT false,
    journal_entry_id UUID,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
)
```

#### Frontend (Angular)
- [ ] شاشة إدخال الأرصدة الافتتاحية
- [ ] شاشة مراجعة الأرصدة
- [ ] شاشة ترحيل الأرصدة

---

### 5.2 ترحيل البيانات التاريخية

#### Backend (NestJS)
- [ ] إنشاء وحدة data-migration
- [ ] جدول core_migration_projects
- [ ] جدول core_imported_historical_data
- [ ] API لرفع ملف Excel
- [ ] API لمعاينة البيانات
- [ ] API لتنفيذ الترحيل
- [ ] API للتحقق والمطابقة

#### الجداول المطلوبة:
```sql
core_migration_projects (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    source_file_url TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'validated', 'in_progress', 'completed', 'failed'
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
)

core_imported_historical_data (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    migration_project_id UUID REFERENCES core_migration_projects(id),
    import_batch_id UUID NOT NULL,
    import_date TIMESTAMP DEFAULT NOW(),
    original_date DATE NOT NULL,
    clearing_account_id UUID,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    reference VARCHAR(100),
    description TEXT,
    is_reconciled BOOLEAN DEFAULT false,
    reconciliation_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
)
```

#### Frontend (Angular)
- [ ] شاشة إدارة مشاريع الترحيل
- [ ] شاشة رفع ملف البيانات
- [ ] شاشة معاينة البيانات
- [ ] شاشة تنفيذ الترحيل
- [ ] شاشة تقرير نتائج الترحيل

---

## المرحلة 6: كتالوج الخدمات والتسعير (الأسبوع 11)

### 6.1 كتالوج الخدمات

#### Backend (NestJS)
- [ ] إنشاء وحدة service-catalog
- [ ] جدول core_service_catalog
- [ ] جدول core_station_service_pricing
- [ ] API لإدارة الخدمات
- [ ] API للتسعير حسب المحطة

#### الجداول المطلوبة:
```sql
core_service_catalog (
    id UUID PRIMARY KEY,
    business_id UUID,
    service_code VARCHAR(30) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_name_ar VARCHAR(100),
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'installation', 'maintenance', 'migration', 'survey', 'other'
    default_cost DECIMAL(12,2) NOT NULL,
    cost_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'per_unit', 'per_hour', 'per_meter'
    unit_of_measure VARCHAR(20),
    technician_fee DECIMAL(12,2) DEFAULT 0,
    fee_type VARCHAR(20) DEFAULT 'fixed',
    fee_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    is_billable_to_customer BOOLEAN DEFAULT true,
    revenue_account_id UUID,
    expense_account_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)

core_station_service_pricing (
    id UUID PRIMARY KEY,
    station_id UUID REFERENCES core_stations(id),
    service_id UUID REFERENCES core_service_catalog(id),
    custom_cost DECIMAL(12,2),
    custom_technician_fee DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, service_id)
)
```

#### Frontend (Angular)
- [ ] شاشة قائمة الخدمات
- [ ] شاشة إضافة/تعديل خدمة
- [ ] شاشة تسعير الخدمات حسب المحطة

---

## المرحلة 7: إدارة صندوق التحصيل (الأسبوع 12)

### 7.1 صندوق التحصيل

#### Backend (NestJS)
- [ ] إنشاء وحدة collection-box
- [ ] جدول core_collectors
- [ ] جدول core_collector_submissions
- [ ] جدول core_cash_deposits
- [ ] API لإدارة المتحصلين
- [ ] API لتسليم التحصيل
- [ ] API لتوريد الصندوق للبنك

#### الجداول المطلوبة:
```sql
core_collectors (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    user_id UUID REFERENCES core_users(id),
    collector_code VARCHAR(20) UNIQUE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    assigned_area TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)

core_collector_submissions (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    collector_id UUID REFERENCES core_collectors(id),
    submission_date DATE NOT NULL,
    submission_number VARCHAR(20) UNIQUE,
    total_amount DECIMAL(15,2) NOT NULL,
    invoices_count INT DEFAULT 0,
    received_by UUID,
    received_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'received', 'deposited'
    journal_entry_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)

core_cash_deposits (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    deposit_date DATE NOT NULL,
    bank_account_id UUID NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    deposit_slip_number VARCHAR(50),
    deposited_by UUID,
    confirmed BOOLEAN DEFAULT false,
    confirmed_by UUID,
    confirmed_at TIMESTAMP,
    journal_entry_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
```

#### Frontend (Angular)
- [ ] شاشة إدارة المتحصلين
- [ ] شاشة تسليم التحصيل اليومي
- [ ] شاشة توريد الصندوق للبنك
- [ ] تقرير حركة صندوق التحصيل

---

## المرحلة 8: التكامل والاختبار (الأسبوع 13-14)

### 8.1 التكامل مع نظام المطور

#### Backend (NestJS)
- [ ] تسجيل APIs في نظام المطور
- [ ] نشر الأحداث (Events) للأنظمة الأخرى
- [ ] استقبال الأحداث من الأنظمة الأخرى
- [ ] إرسال مقاييس الأداء

### 8.2 الاختبارات

- [ ] Unit Tests لجميع Services
- [ ] Integration Tests للـ APIs
- [ ] E2E Tests للشاشات الرئيسية

### 8.3 التوثيق

- [ ] تحديث Swagger Documentation
- [ ] كتابة دليل المستخدم
- [ ] كتابة دليل المطور

---

## 📊 ملخص المراحل

| المرحلة | الوصف | المدة | الأولوية |
|---------|-------|-------|----------|
| 1 | استكمال الأساسيات | أسبوعان | عالية |
| 2 | النظام المالي المتقدم | أسبوعان | عالية |
| 3 | مركز التسوية المرن | أسبوعان | عالية |
| 4 | نظام أوامر الدفع والعهد | أسبوعان | عالية |
| 5 | القيود الافتتاحية والترحيل | أسبوعان | متوسطة |
| 6 | كتالوج الخدمات | أسبوع | متوسطة |
| 7 | إدارة صندوق التحصيل | أسبوع | متوسطة |
| 8 | التكامل والاختبار | أسبوعان | عالية |

**المدة الإجمالية المتوقعة:** 14 أسبوع (3.5 شهر)

---

## 📝 ملاحظات مهمة

1. **القاعدة الذهبية:** لا شاشة بدون Backend متصل بقاعدة البيانات
2. **لا بيانات وهمية:** جميع البيانات من قاعدة البيانات
3. **الالتزام بالقواعد الصارمة:** TypeScript, NestJS, Angular, Prisma, PostgreSQL
4. **بادئة الجداول:** `core_` لجميع جداول النظام الأم
5. **UUID:** لجميع المفاتيح الأساسية
6. **Audit Trail:** تسجيل جميع العمليات الحساسة
7. **Soft Delete:** للسجلات المالية

---

## 🎯 الخطوة التالية

ابدأ بـ **المرحلة 1.2: استكمال المستخدمين والصلاحيات (RBAC)** حيث أنها الأساس لجميع الوحدات الأخرى.
