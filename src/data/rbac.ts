import type { Dept, Permission, RoleId } from '../types'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard.view': 'مشاهده داشبورد',
  'sales.view': 'مشاهده فروش',
  'sales.create': 'ثبت سفارش فروش',
  'sales.edit': 'ویرایش سفارش فروش',
  'warehouse.view': 'مشاهده انبار',
  'warehouse.transfer': 'انتقال بین انبار',
  'warehouse.adjust': 'اصلاح موجودی',
  'crm.view': 'مشاهده مشتریان',
  'crm.edit': 'ویرایش مشتریان',
  'purchases.view': 'مشاهده خرید',
  'purchases.create': 'ثبت سفارش خرید',
  'reports.view': 'مشاهده گزارش‌ها',
  'manufacturing.view': 'مشاهده تولید',
  'manufacturing.edit': 'تغییر مرحله تولید',
  'distribution.view': 'مشاهده ارسال و توزیع',
  'distribution.edit': 'ثبت تحویل بار',
  'accounting.view': 'مشاهده حسابداری',
  'accounting.edit': 'ثبت سند و پرداخت',
  'messages.use': 'گفتگوی داخلی',
  'users.manage': 'مدیریت کاربران',
  'roles.manage': 'مدیریت نقش‌ها',
  'settings.manage': 'تنظیمات سیستم',
  'audit.view': 'گزارش فعالیت کاربران',
  'ai.use': 'استفاده از دستیار',
}

export const ROLE_LABELS: Record<RoleId, string> = {
  SUPER_ADMIN: 'مدیر سیستم',
  CEO: 'مدیرعامل',
  PRODUCTION_MANAGER: 'مدیر تولید',
  SALES_MANAGER: 'مدیر فروش',
  WAREHOUSE_MANAGER: 'مدیر انبار',
  FINANCE_MANAGER: 'مدیر مالی',
  CRM_SPECIALIST: 'مدیر ارتباط با مشتری',
  PURCHASE_MANAGER: 'مدیر خرید',
}

/** Which department's alerts, activity and dashboard a role gets. Management
 *  is the one scope that is not filtered: the Owner sees the whole company. */
export const ROLE_DEPT: Record<RoleId, Dept> = {
  SUPER_ADMIN: 'management',
  CEO: 'management',
  PRODUCTION_MANAGER: 'production',
  SALES_MANAGER: 'sales',
  WAREHOUSE_MANAGER: 'warehouse',
  FINANCE_MANAGER: 'finance',
  CRM_SPECIALIST: 'crm',
  PURCHASE_MANAGER: 'purchasing',
}

export const DEPT_LABELS: Record<Dept, string> = {
  management: 'مدیریت',
  production: 'تولید',
  sales: 'فروش',
  warehouse: 'انبار',
  finance: 'مالی',
  crm: 'ارتباط با مشتری',
  purchasing: 'خرید و تامین',
}

/** Seed permission sets. The store holds a mutable copy: admins edit these
 *  live in the permission matrix and switching role must reflect the edit. */
export const SEED_ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {
  SUPER_ADMIN: Object.keys(PERMISSION_LABELS) as Permission[],
  CEO: [
    'dashboard.view',
    'sales.view',
    'warehouse.view',
    'crm.view',
    'purchases.view',
    'reports.view',
    'manufacturing.view',
    'distribution.view',
    'accounting.view',
    'messages.use',
    'ai.use',
  ],
  PRODUCTION_MANAGER: [
    'dashboard.view',
    'manufacturing.view',
    'manufacturing.edit',
    'warehouse.view',
    'purchases.view',
    'reports.view',
    'messages.use',
    'ai.use',
  ],
  SALES_MANAGER: [
    'dashboard.view',
    'sales.view',
    'sales.create',
    'sales.edit',
    'crm.view',
    'crm.edit',
    'warehouse.view',
    'distribution.view',
    'reports.view',
    'messages.use',
    'ai.use',
  ],
  WAREHOUSE_MANAGER: [
    'dashboard.view',
    'warehouse.view',
    'warehouse.transfer',
    'warehouse.adjust',
    'purchases.view',
    'manufacturing.view',
    'distribution.view',
    'distribution.edit',
    'reports.view',
    'messages.use',
  ],
  FINANCE_MANAGER: [
    'dashboard.view',
    'accounting.view',
    'accounting.edit',
    'sales.view',
    'purchases.view',
    'reports.view',
    'messages.use',
    'ai.use',
  ],
  CRM_SPECIALIST: [
    'dashboard.view',
    'crm.view',
    'crm.edit',
    'sales.view',
    'messages.use',
    'ai.use',
  ],
  PURCHASE_MANAGER: [
    'dashboard.view',
    'purchases.view',
    'purchases.create',
    'warehouse.view',
    'reports.view',
    'messages.use',
    'ai.use',
  ],
}

export interface Persona {
  role: RoleId
  user: string
  title: string
  blurb: string
}

export const PERSONAS: Persona[] = [
  {
    role: 'CEO',
    user: 'محمد احمدی',
    title: 'مدیرعامل',
    blurb: 'نمای کامل شرکت: نقدینگی، تولید، فروش و هشدارهای همه دپارتمان‌ها.',
  },
  {
    role: 'PRODUCTION_MANAGER',
    user: 'کاوه نظری',
    title: 'مدیر تولید',
    blurb: 'تابلوی سفارش کار، مراحل خط، مصرف پارچه و وضعیت پیمانکاران.',
  },
  {
    role: 'SALES_MANAGER',
    user: 'سارا رضایی',
    title: 'مدیر فروش',
    blurb: 'دفتر سفارش‌ها بر پایه خریدار و فصل، تفکیک سایزبندی، لیست قیمت.',
  },
  {
    role: 'WAREHOUSE_MANAGER',
    user: 'علی محمدی',
    title: 'مدیر انبار',
    blurb: 'مواد اولیه، کالای در جریان ساخت، محصول نهایی و ارسال بار.',
  },
  {
    role: 'FINANCE_MANAGER',
    user: 'شیما توکلی',
    title: 'مدیر مالی',
    blurb: 'دریافتنی و پرداختنی، دفتر روزنامه یا اتصال به نرم‌افزار حسابداری موجود.',
  },
  {
    role: 'CRM_SPECIALIST',
    user: 'نگار موسوی',
    title: 'مدیر ارتباط با مشتری',
    blurb: 'خریداران، نمونه‌های ارسالی، شرایط اعتباری و سرنخ‌های جدید.',
  },
  {
    role: 'PURCHASE_MANAGER',
    user: 'رضا کریمی',
    title: 'مدیر خرید',
    blurb: 'سفارش خرید پارچه و متعلقات، تامین‌کنندگان و تعهد خرید باز.',
  },
  {
    role: 'SUPER_ADMIN',
    user: 'مدیر سیستم',
    title: 'مدیر سیستم',
    blurb: 'کاربران، نقش‌ها، ماتریس دسترسی و گزارش فعالیت.',
  },
]
