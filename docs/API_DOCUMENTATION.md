# توثيق API - النظام الأم
## نظام إدارة الكهرباء

## نظرة عامة

نظام متكامل لإدارة محطات الكهرباء مبني باستخدام:
- **Backend**: NestJS 11
- **Frontend**: Angular 19
- **Database**: PostgreSQL 14
- **ORM**: Prisma 5

## التثبيت والتشغيل

```bash
# تثبيت الحزم
pnpm install

# إعداد قاعدة البيانات
npx prisma migrate deploy
npx prisma generate

# تشغيل API
npx nx serve api
# أو
npx nx build api && node dist/apps/api/main.js
```

## الوحدات المُنجزة

### 1. وحدة المصادقة (Authentication)

| الميزة | الوصف |
|--------|-------|
| تسجيل مستخدم جديد | إنشاء مجموعة جديدة مع مستخدم مالك |
| تسجيل الدخول | JWT Access Token + Refresh Token |
| تجديد التوكن | استخدام Refresh Token للحصول على Access Token جديد |
| تسجيل الخروج | إلغاء Refresh Token |
| تغيير كلمة المرور | مع التحقق من كلمة المرور القديمة |

**مدة صلاحية التوكنات:**
- Access Token: 15 دقيقة
- Refresh Token: 7 أيام

### 2. وحدة المستخدمين والصلاحيات (RBAC)

**إدارة المستخدمين:**
- إنشاء مستخدمين جدد
- تعيين نطاق الصلاحية (Business/Station)
- تعيين أدوار متعددة للمستخدم

**إدارة الأدوار:**
- أدوار نظامية (لا يمكن تعديلها)
- أدوار مخصصة لكل مجموعة
- تعيين صلاحيات للأدوار

**الصلاحيات المتاحة:**

| الوحدة | الصلاحيات |
|--------|----------|
| users | create, read, update, delete, assign-roles |
| roles | create, read, update, delete, assign-permissions |
| businesses | read, update |
| stations | create, read, update, delete |
| accounts | create, read, update, delete |
| journal-entries | create, read, update, delete, post, void |
| reports | financial, operational |
| settings | read, update |

### 3. وحدة الهيكل التنظيمي

**المجموعات (Businesses):**
- بيانات الشركة (الاسم، الشعار، العنوان، الرقم الضريبي)
- إحصائيات المجموعة

**المحطات (Stations):**
- أنواع المحطات:
  - `generation_distribution`: توليد وتوزيع
  - `solar`: طاقة شمسية
  - `distribution_only`: توزيع فقط
- الموقع الجغرافي (خط العرض والطول)
- خصائص المحطة (مولدات، ألواح شمسية)

### 4. النظام المالي

**شجرة الحسابات:**
- حسابات هرمية متعددة المستويات
- أنواع الحسابات:
  - `asset`: أصول
  - `liability`: خصوم
  - `equity`: حقوق الملكية
  - `revenue`: إيرادات
  - `expense`: مصروفات
- طبيعة الحساب (مدين/دائن)
- حسابات نظامية للربط التلقائي

**القيود اليومية:**
- قيود متوازنة (المدين = الدائن)
- حالات القيد:
  - `draft`: مسودة (قابل للتعديل والحذف)
  - `posted`: مرحّل (غير قابل للتعديل)
  - `voided`: ملغي
- ربط بالمحطات
- ترقيم تلقائي (JE-YYYY-NNNNNN)

## API Endpoints

### المصادقة `/api/v1/auth`

```
POST /register     - تسجيل مستخدم جديد
POST /login        - تسجيل الدخول
POST /logout       - تسجيل الخروج
POST /refresh      - تجديد التوكن
GET  /me           - بيانات المستخدم الحالي
PUT  /profile      - تحديث الملف الشخصي
PUT  /change-password - تغيير كلمة المرور
```

### المستخدمين `/api/v1/users`

```
GET    /           - قائمة المستخدمين (مع pagination)
POST   /           - إنشاء مستخدم
GET    /:id        - بيانات مستخدم
PUT    /:id        - تحديث مستخدم
DELETE /:id        - حذف مستخدم
POST   /:id/roles  - تعيين أدوار
```

### الأدوار `/api/v1/roles`

```
GET    /              - قائمة الأدوار
POST   /              - إنشاء دور
GET    /:id           - بيانات دور
PUT    /:id           - تحديث دور
DELETE /:id           - حذف دور
POST   /:id/permissions - تعيين صلاحيات
```

### الصلاحيات `/api/v1/permissions`

```
GET  /              - قائمة الصلاحيات
GET  /modules       - قائمة الوحدات
GET  /module/:name  - صلاحيات وحدة معينة
POST /seed          - إنشاء الصلاحيات الأساسية
```

### المجموعات `/api/v1/business`

```
GET  /           - بيانات المجموعة الحالية
PUT  /           - تحديث بيانات المجموعة
GET  /statistics - إحصائيات المجموعة
```

### المحطات `/api/v1/stations`

```
GET    /            - قائمة المحطات (مع pagination)
POST   /            - إنشاء محطة
GET    /my-stations - المحطات المتاحة للمستخدم
GET    /:id         - بيانات محطة
PUT    /:id         - تحديث محطة
DELETE /:id         - حذف محطة
```

### شجرة الحسابات `/api/v1/accounts`

```
GET    /       - قائمة الحسابات
POST   /       - إنشاء حساب
GET    /tree   - شجرة الحسابات
POST   /seed   - إنشاء الحسابات الافتراضية
GET    /:id    - بيانات حساب
PUT    /:id    - تحديث حساب
DELETE /:id    - حذف حساب
```

### القيود اليومية `/api/v1/journal-entries`

```
GET    /           - قائمة القيود (مع pagination)
POST   /           - إنشاء قيد
GET    /:id        - بيانات قيد
PUT    /:id        - تحديث قيد (مسودة فقط)
DELETE /:id        - حذف قيد (مسودة فقط)
POST   /:id/post   - ترحيل قيد
POST   /:id/void   - إلغاء قيد
```

## أمثلة الاستخدام

### تسجيل الدخول

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@electricity.com",
    "password": "Admin@123"
  }'
```

### إنشاء محطة

```bash
curl -X POST http://localhost:3001/api/v1/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "محطة الصناعية",
    "type": "generation_distribution",
    "hasGenerators": true
  }'
```

### إنشاء قيد يومي

```bash
curl -X POST http://localhost:3001/api/v1/journal-entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "entryDate": "2025-01-15",
    "description": "تحصيل إيرادات كهرباء",
    "lines": [
      {"accountId": "<CASH_ID>", "debit": 10000, "credit": 0},
      {"accountId": "<REVENUE_ID>", "debit": 0, "credit": 10000}
    ]
  }'
```

## Swagger Documentation

متاح على: `http://localhost:3001/docs`

## القواعد الصارمة المُتبعة

1. **TypeScript فقط** - لا JavaScript
2. **UUID** للمفاتيح الأساسية
3. **بادئة `core_`** لجميع جداول النظام الأم
4. **لا شاشات بدون Backend** متصل بقاعدة البيانات
5. **لا بيانات وهمية** - كل البيانات حقيقية من قاعدة البيانات
6. **القيود المتوازنة** - المدين = الدائن دائماً
