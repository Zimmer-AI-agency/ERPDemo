import { create } from 'zustand'
import type { AccountingMode, ModuleId, Permission, RoleId } from '../types'
import { PERSONAS, SEED_ROLE_PERMISSIONS } from '../data/rbac'

export const ALL_MODULES: ModuleId[] = [
  'purchasing',
  'inventory',
  'manufacturing',
  'sales',
  'distribution',
  'crm',
  'accounting',
]

export const MODULE_LABELS: Record<ModuleId, string> = {
  purchasing: 'خرید و تامین',
  inventory: 'انبار و موجودی',
  manufacturing: 'تولید',
  sales: 'فروش',
  distribution: 'ارسال و توزیع',
  crm: 'ارتباط با مشتری',
  accounting: 'حسابداری',
}

export const MODULE_BLURBS: Record<ModuleId, string> = {
  purchasing: 'سفارش خرید پارچه و متعلقات، تامین‌کننده، تعهد خرید باز.',
  inventory: 'مواد اولیه، کالای در جریان ساخت و محصول نهایی به تفکیک سایز.',
  manufacturing: 'سفارش کار، مراحل خط، BOM، مصرف پارچه و پیمانکاران.',
  sales: 'دفتر سفارش بر پایه خریدار و فصل، سایزبندی، لیست قیمت.',
  distribution: 'برنامه ارسال، پیگیری بار و تایید تحویل.',
  crm: 'خریداران، نمونه‌ها، شرایط اعتباری و سرنخ‌ها.',
  accounting: 'دریافتنی و پرداختنی — با ماژول داخلی زیمر یا نرم‌افزار حسابداری موجود.',
}

interface AuthState {
  signedIn: boolean
  role: RoleId
  userName: string
  /** Modules the prospect switched on at setup. Anything unselected simply
   *  never appears in the navigation — no greyed-out upsell rows. */
  modules: ModuleId[]
  /** Null until the prospect picks one. Neither mode is the default. */
  accountingMode: AccountingMode | null
  /** Mutable copy of the seed sets. Editing a role in the admin matrix has to
   *  change what that role sees the moment you switch into it, so this cannot
   *  be a frozen module constant. */
  rolePermissions: Record<RoleId, Permission[]>

  signInAs: (role: RoleId) => void
  signOut: () => void
  toggleModule: (m: ModuleId) => void
  setAccountingMode: (m: AccountingMode | null) => void
  togglePermission: (role: RoleId, permission: Permission) => void
  can: (permission: Permission) => boolean
  hasModule: (m: ModuleId) => boolean
}

export const useAuth = create<AuthState>((set, get) => ({
  signedIn: false,
  role: 'CEO',
  userName: 'محمد احمدی',
  modules: [...ALL_MODULES],
  accountingMode: null,
  rolePermissions: structuredClone(SEED_ROLE_PERMISSIONS),

  signInAs: (role) =>
    set({
      signedIn: true,
      role,
      userName: PERSONAS.find((p) => p.role === role)?.user ?? 'کاربر مهمان',
    }),

  signOut: () => set({ signedIn: false }),

  toggleModule: (m) =>
    set((s) => ({
      modules: s.modules.includes(m) ? s.modules.filter((x) => x !== m) : [...s.modules, m],
      // Dropping accounting drops the mode with it; re-adding asks again.
      accountingMode: m === 'accounting' && s.modules.includes(m) ? null : s.accountingMode,
    })),

  setAccountingMode: (accountingMode) => set({ accountingMode }),

  togglePermission: (role, permission) =>
    set((s) => {
      const current = s.rolePermissions[role]
      const next = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission]
      return { rolePermissions: { ...s.rolePermissions, [role]: next } }
    }),

  can: (permission) => get().rolePermissions[get().role].includes(permission),
  hasModule: (m) => get().modules.includes(m),
}))

/** Admin mode is a property of the role, not a separate flag to keep in sync. */
export const useIsAdmin = () => useAuth((s) => s.role === 'SUPER_ADMIN')
