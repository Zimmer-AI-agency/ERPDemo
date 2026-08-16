import {
  Boxes,
  ClipboardList,
  Factory,
  LayoutDashboard,
  MessagesSquare,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  FileBarChart,
} from 'lucide-react'
import type { ModuleId, Permission } from '../types'

export interface NavChild {
  label: string
  to: string
}

export interface NavGroup {
  label: string
  icon: typeof Boxes
  permission: Permission
  /** Groups without a module are always on: messaging, the activity log, the
   *  AI/reporting layer and system administration wrap any module selection. */
  module?: ModuleId
  badge?: string
  children: NavChild[]
}

/** Sub-items point at a tab inside the page rather than a separate route, so
 *  the navigation stays two-level without multiplying page files. */
export const NAV: NavGroup[] = [
  {
    label: 'نمای کلی',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
    children: [
      { label: 'داشبورد', to: '/' },
      { label: 'مرکز توجه', to: '/attention' },
      { label: 'فعالیت‌های امروز', to: '/activity' },
    ],
  },
  {
    label: 'تولید',
    icon: Factory,
    permission: 'manufacturing.view',
    module: 'manufacturing',
    children: [
      { label: 'سفارش‌های کار', to: '/manufacturing?tab=orders' },
      { label: 'وضعیت خط', to: '/manufacturing?tab=stages' },
      { label: 'BOM مدل‌ها', to: '/manufacturing?tab=bom' },
      { label: 'مصرف پارچه', to: '/manufacturing?tab=consumption' },
      { label: 'پیمانکاران', to: '/manufacturing?tab=subcontractors' },
    ],
  },
  {
    label: 'انبار',
    icon: Boxes,
    permission: 'warehouse.view',
    module: 'inventory',
    children: [
      { label: 'مواد اولیه و پارچه', to: '/inventory?tab=stock' },
      { label: 'کالای در جریان ساخت', to: '/inventory?tab=wip' },
      { label: 'محصول نهایی', to: '/inventory?tab=finished' },
      { label: 'گردش موجودی', to: '/inventory?tab=movements' },
      { label: 'انبارها', to: '/inventory?tab=warehouses' },
      { label: 'کالاهای کم‌موجود', to: '/inventory?tab=low' },
      { label: 'بچ / لات', to: '/inventory?tab=lots' },
    ],
  },
  {
    label: 'فروش',
    icon: ShoppingCart,
    permission: 'sales.view',
    module: 'sales',
    children: [
      { label: 'دفتر سفارش‌ها', to: '/sales?tab=all' },
      { label: 'لیست قیمت', to: '/sales?tab=pricelist' },
      { label: 'مطالبات مشتریان', to: '/receivables' },
    ],
  },
  {
    label: 'ارسال و توزیع',
    icon: Truck,
    permission: 'distribution.view',
    module: 'distribution',
    children: [
      { label: 'بارها', to: '/distribution?tab=all' },
      { label: 'در مسیر', to: '/distribution?tab=in_transit' },
      { label: 'تحویل شده', to: '/distribution?tab=delivered' },
    ],
  },
  {
    label: 'خرید',
    icon: ClipboardList,
    permission: 'purchases.view',
    module: 'purchasing',
    children: [
      { label: 'سفارش‌های خرید', to: '/purchases?tab=orders' },
      { label: 'تامین‌کنندگان', to: '/purchases?tab=suppliers' },
      { label: 'خریدهای تاخیردار', to: '/purchases?tab=delayed' },
      { label: 'پیشنهاد خرید', to: '/purchases?tab=advice' },
    ],
  },
  {
    label: 'ارتباط با مشتری',
    icon: Users,
    permission: 'crm.view',
    module: 'crm',
    children: [
      { label: 'خریداران', to: '/crm?tab=customers' },
      { label: 'سرنخ‌ها', to: '/crm?tab=leads' },
      { label: 'پیگیری‌ها', to: '/crm?tab=followups' },
    ],
  },
  {
    label: 'حسابداری',
    icon: Wallet,
    permission: 'accounting.view',
    module: 'accounting',
    children: [
      { label: 'خلاصه مالی', to: '/accounting?tab=summary' },
      { label: 'فاکتورهای فروش', to: '/accounting?tab=ar' },
      { label: 'صورتحساب تامین‌کننده', to: '/accounting?tab=ap' },
      { label: 'دفتر روزنامه', to: '/accounting?tab=ledger' },
      { label: 'سنی مطالبات', to: '/accounting?tab=aging' },
    ],
  },
  {
    label: 'گزارش‌ها',
    icon: FileBarChart,
    permission: 'reports.view',
    children: [
      { label: 'گزارش فروش', to: '/reports?tab=sales' },
      { label: 'گزارش موجودی', to: '/reports?tab=inventory' },
      { label: 'گزارش خرید', to: '/reports?tab=purchases' },
      { label: 'گزارش مشتریان', to: '/reports?tab=customers' },
    ],
  },
  {
    label: 'گفتگوی داخلی',
    icon: MessagesSquare,
    permission: 'messages.use',
    children: [{ label: 'پیام‌ها', to: '/messages' }],
  },
  {
    label: 'مدیریت سیستم',
    icon: ShieldCheck,
    permission: 'users.manage',
    children: [
      { label: 'داشبورد مدیر', to: '/admin' },
      { label: 'کاربران', to: '/admin/users' },
      { label: 'نقش‌ها و دسترسی‌ها', to: '/admin/roles' },
      { label: 'گزارش فعالیت کاربران', to: '/admin/audit' },
    ],
  },
]
