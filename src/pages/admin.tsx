import { useState } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { PERMISSION_LABELS, ROLE_LABELS } from '../data/rbac'
import { useAuth } from '../store/useAuth'
import { useDemo } from '../store/useDemo'
import { num } from '../lib/format'
import type { Permission, RoleId } from '../types'
import {
  Badge,
  Button,
  Card,
  CardHead,
  Field,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  inputClass,
  useBriefLoad,
} from '../components/ui'

export function AdminDashboardPage() {
  const loading = useBriefLoad()
  const { users, auditLog } = useDemo()
  const rolePermissions = useAuth((s) => s.rolePermissions)

  if (loading) return <Skeleton className="h-96" />

  const active = users.filter((u) => u.active)

  return (
    <>
      <PageHeader title="داشبورد مدیر سیستم" subtitle="کاربران، دسترسی‌ها و فعالیت سامانه" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="کاربران فعال" value={num(active.length)} />
        <Stat label="نقش‌ها" value={num(Object.keys(rolePermissions).length)} />
        <Stat label="کاربران آنلاین" value={num(users.filter((u) => u.lastSeen.includes('دقیقه')).length)} />
        <Stat label="فعالیت‌های امروز" value={num(auditLog.length)} />
        <Stat label="رویدادهای امنیتی" value={num(2)} tone="warn" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead
            title="آخرین فعالیت کاربران"
            extra={
              <Link to="/admin/audit" className="text-xs text-ink-soft hover:text-brand">
                مشاهده همه
              </Link>
            }
          />
          <ol className="divide-y divide-line">
            {auditLog.slice(0, 6).map((a) => (
              <li key={a.id} className="flex gap-4 px-5 py-3.5 text-[13px]">
                <span className="shrink-0 text-ink-soft">{a.at}</span>
                <span className="flex-1">
                  <span className="font-medium">{a.user}</span> {a.detail}
                </span>
                <Badge>{a.module}</Badge>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHead title="وضعیت سامانه" />
          <ul className="divide-y divide-line">
            {[
              { label: 'دسترس‌پذیری سرویس', value: '۹۹.۴٪ در ۳۰ روز', tone: 'ok' as const },
              { label: 'آخرین پشتیبان‌گیری', value: 'امروز، ۰۳:۱۵', tone: 'ok' as const },
              { label: 'ورود ناموفق ۲۴ ساعت', value: '۲ مورد', tone: 'warn' as const },
              { label: 'نشست‌های فعال', value: `${num(4)} نشست`, tone: 'info' as const },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between px-5 py-3.5 text-[13px]">
                <span>{row.label}</span>
                <Badge tone={row.tone}>{row.value}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

export function UsersPage() {
  const loading = useBriefLoad()
  const { users, addUser } = useDemo()
  const actor = useAuth((s) => s.userName)
  const [open, setOpen] = useState(false)

  if (loading) return <Skeleton className="h-96" />

  return (
    <>
      <PageHeader
        title="کاربران"
        subtitle="همه تغییرها فقط در وضعیت محلی این دمو ثبت می‌شوند."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus size={16} strokeWidth={1.5} />
            کاربر جدید
          </Button>
        }
      />

      <Card>
        <table className="w-full text-[13px]">
          <thead className="text-ink-soft">
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 text-start font-medium">نام</th>
              <th className="px-4 py-2.5 text-start font-medium">سمت</th>
              <th className="px-4 py-2.5 text-start font-medium">نقش</th>
              <th className="px-4 py-2.5 text-start font-medium">واحد سازمانی</th>
              <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
              <th className="px-4 py-2.5 text-start font-medium">آخرین ورود</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.title}</td>
                <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                <td className="px-4 py-3">{u.unit}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.active ? 'ok' : 'neutral'}>{u.active ? 'فعال' : 'غیرفعال'}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-soft">{u.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CreateUserModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(user) => {
          addUser(user, actor)
          setOpen(false)
        }}
      />
    </>
  )
}

function CreateUserModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (u: { name: string; title: string; role: RoleId; unit: string }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [unit, setUnit] = useState('فروش')
  const [title, setTitle] = useState('')
  const [role, setRole] = useState<RoleId>('SALES_MANAGER')

  const emailError = email && !email.includes('@') ? 'قالب ایمیل معتبر نیست.' : ''
  const ready = name.trim() && title.trim() && !emailError

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="کاربر جدید"
      footer={
        <>
          <Button
            variant="primary"
            disabled={!ready}
            onClick={() => {
              onSubmit({ name: name.trim(), title: title.trim(), role, unit })
              setName('')
              setTitle('')
              setEmail('')
              setPhone('')
            }}
          >
            ثبت کاربر
          </Button>
          <Button onClick={onClose}>انصراف</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="نام و نام خانوادگی">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ایمیل" error={emailError}>
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="شماره تماس">
            <input
              className={inputClass}
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="واحد">
            <Select
              value={unit}
              options={['مدیریت', 'تولید', 'فروش', 'انبار', 'تامین', 'مالی'].map((u) => ({
                value: u,
                label: u,
              }))}
              onChange={setUnit}
            />
          </Field>
          <Field label="سمت">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="نقش" hint="دسترسی‌ها از نقش انتخاب‌شده به ارث می‌رسند.">
          <Select<RoleId>
            value={role}
            options={(Object.keys(ROLE_LABELS) as RoleId[]).map((r) => ({
              value: r,
              label: ROLE_LABELS[r],
            }))}
            onChange={setRole}
          />
        </Field>
      </div>
    </Modal>
  )
}

/** Permission codes grouped by the module they belong to, so the matrix reads
 *  as modules on one axis and actions on the other. */
const MATRIX_MODULES: { label: string; prefix: string }[] = [
  { label: 'داشبورد', prefix: 'dashboard' },
  { label: 'فروش', prefix: 'sales' },
  { label: 'انبار', prefix: 'warehouse' },
  { label: 'CRM', prefix: 'crm' },
  { label: 'خرید', prefix: 'purchases' },
  { label: 'گزارش‌ها', prefix: 'reports' },
  { label: 'تولید', prefix: 'production' },
  { label: 'کاربران', prefix: 'users' },
  { label: 'نقش‌ها', prefix: 'roles' },
  { label: 'تنظیمات', prefix: 'settings' },
  { label: 'گزارش فعالیت', prefix: 'audit' },
  { label: 'دستیار', prefix: 'ai' },
]

export function RolesPage() {
  const { rolePermissions, togglePermission } = useAuth()
  const logAudit = useDemo((s) => s.logAudit)
  const setToast = useDemo((s) => s.setToast)
  const actor = useAuth((s) => s.userName)
  const [selected, setSelected] = useState<RoleId | null>(null)

  const roles = Object.keys(rolePermissions) as RoleId[]
  const all = Object.keys(PERMISSION_LABELS) as Permission[]

  function toggle(role: RoleId, permission: Permission) {
    const adding = !rolePermissions[role].includes(permission)
    togglePermission(role, permission)
    logAudit({
      at: new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      user: actor,
      action: adding ? 'افزودن دسترسی' : 'حذف دسترسی',
      module: 'نقش‌ها',
      detail: `${PERMISSION_LABELS[permission]} برای ${ROLE_LABELS[role]}`,
    })
    setToast(
      `دسترسی «${PERMISSION_LABELS[permission]}» برای ${ROLE_LABELS[role]} ${adding ? 'فعال' : 'غیرفعال'} شد.`,
    )
  }

  return (
    <>
      <PageHeader
        title="نقش‌ها و دسترسی‌ها"
        subtitle="تغییر هر دسترسی بلافاصله روی آنچه آن نقش می‌بیند اثر می‌گذارد."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setSelected(selected === role ? null : role)}
            className={`rounded-[12px] border px-5 py-4 text-start transition-colors ${
              selected === role
                ? 'border-brand bg-brand-tint/40'
                : 'border-line bg-surface hover:border-brand'
            }`}
          >
            <p className="text-sm font-semibold">{ROLE_LABELS[role]}</p>
            <p className="mt-1 text-[13px] text-ink-soft">
              {num(rolePermissions[role].length)} دسترسی
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <Card>
          <CardHead
            title={`ماتریس دسترسی ${ROLE_LABELS[selected]}`}
            extra={<Badge tone="brand">{num(rolePermissions[selected].length)} دسترسی فعال</Badge>}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="text-ink-soft">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 text-start font-medium">ماژول</th>
                  <th className="px-4 py-2.5 text-start font-medium">دسترسی‌ها</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_MODULES.map((m) => {
                  const codes = all.filter((p) => p.startsWith(`${m.prefix}.`))
                  if (!codes.length) return null
                  return (
                    <tr key={m.prefix} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium">{m.label}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {codes.map((code) => (
                            <label key={code} className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                className="size-4 accent-[#7c3aed]"
                                checked={rolePermissions[selected].includes(code)}
                                onChange={() => toggle(selected, code)}
                              />
                              <span>{PERMISSION_LABELS[code]}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            برای دیدن اثر تغییر، از منوی پروفایل به این نقش وارد شوید.
          </p>
        </Card>
      )}
    </>
  )
}

export function AuditLogPage() {
  const { auditLog } = useDemo()
  return (
    <>
      <PageHeader title="گزارش فعالیت کاربران" subtitle="هر عملیات دمو یک رکورد اینجا ثبت می‌کند." />
      <Card>
        <table className="w-full text-[13px]">
          <thead className="text-ink-soft">
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 text-start font-medium">زمان</th>
              <th className="px-4 py-2.5 text-start font-medium">کاربر</th>
              <th className="px-4 py-2.5 text-start font-medium">عملیات</th>
              <th className="px-4 py-2.5 text-start font-medium">ماژول</th>
              <th className="px-4 py-2.5 text-start font-medium">شرح</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 tabular-nums">{a.at}</td>
                <td className="px-4 py-3 font-medium">{a.user}</td>
                <td className="px-4 py-3">{a.action}</td>
                <td className="px-4 py-3">
                  <Badge>{a.module}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-soft">{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-ink-soft">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${tone === 'warn' ? 'text-warn' : ''}`}>
        {value}
      </p>
    </Card>
  )
}
