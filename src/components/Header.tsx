import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, ChevronDown, LogOut, MessagesSquare, Search, Sparkles } from 'lucide-react'
import { INVOICES, TODAY_LABEL } from '../data/mock'
import { COMPANY_NAME, EXTERNAL_ACCOUNTING } from '../data/garment'
import { PERSONAS, ROLE_LABELS } from '../data/rbac'
import { useAuth } from '../store/useAuth'
import { useDemo, type Period } from '../store/useDemo'
import { Badge, Button, Modal, Select, inputClass } from './ui'
import { num } from '../lib/format'

const PERIODS: { id: Period; label: string }[] = [
  { id: '6m', label: '۶ ماه اخیر' },
  { id: '12m', label: '۱۲ ماه اخیر' },
  { id: 'year', label: 'امسال' },
]

export function Header({ onAskAi }: { onAskAi: () => void }) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { userName, role, signInAs, signOut } = useAuth()
  const canUseAi = useAuth((s) => s.rolePermissions[s.role].includes('ai.use'))
  const canMessage = useAuth((s) => s.rolePermissions[s.role].includes('messages.use'))
  const accountingMode = useAuth((s) => s.accountingMode)
  const { period, setPeriod, notifications, markRead, markAllRead, products, customers, orders } =
    useDemo()

  const unread = notifications.filter((n) => !n.read).length

  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    const hits: { kind: string; label: string; to: string }[] = []
    customers
      .filter((c) => c.name.includes(q) || c.city.includes(q))
      .forEach((c) => hits.push({ kind: 'مشتری', label: c.name, to: `/crm/${c.id}` }))
    orders
      .filter((o) => o.id.includes(q.toUpperCase()))
      .forEach((o) => hits.push({ kind: 'سفارش فروش', label: o.id, to: '/sales?tab=all' }))
    products
      .filter((p) => p.name.includes(q) || p.code.includes(q.toUpperCase()))
      .forEach((p) => hits.push({ kind: 'کالا', label: `${p.code} ${p.name}`, to: '/inventory' }))
    INVOICES.filter((i) => i.id.includes(q.toUpperCase())).forEach((i) =>
      hits.push({ kind: 'فاکتور', label: i.id, to: '/receivables' }),
    )
    return hits.slice(0, 8)
  }, [query, customers, orders, products])

  return (
    <header className="flex h-16 items-center gap-3 border-b border-line bg-surface px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {COMPANY_NAME} — {new Date().getHours() < 12 ? 'صبح بخیر' : 'وقت بخیر'}، {userName}
        </p>
        <p className="truncate text-xs text-ink-soft">{TODAY_LABEL}</p>
      </div>

      {accountingMode && (
        <Badge tone={accountingMode === 'integration' ? 'ok' : 'brand'}>
          {accountingMode === 'integration'
            ? `حسابداری: متصل به ${EXTERNAL_ACCOUNTING.name}`
            : 'حسابداری: ماژول داخلی زیمر'}
        </Badge>
      )}

      {canMessage && (
        <Button size="sm" onClick={() => navigate('/messages')} aria-label="گفتگوی داخلی">
          <MessagesSquare size={15} strokeWidth={1.5} />
        </Button>
      )}

      <Button size="sm" onClick={() => setSearchOpen(true)} className="w-44 !justify-start">
        <Search size={15} strokeWidth={1.5} className="text-ink-soft" />
        <span className="text-ink-soft">جستجوی سریع...</span>
      </Button>

      {canUseAi && (
        <Button variant="primary" size="sm" onClick={onAskAi}>
          <Sparkles size={15} strokeWidth={1.5} />
          پرسش از هوش مصنوعی
        </Button>
      )}

      <Select<Period>
        aria-label="بازه زمانی"
        size="sm"
        className="w-32"
        value={period}
        options={PERIODS.map((p) => ({ value: p.id, label: p.label }))}
        onChange={setPeriod}
      />

      <div className="relative">
        <Button size="sm" onClick={() => setBellOpen((v) => !v)} aria-label="اعلان‌ها">
          <Bell size={15} strokeWidth={1.5} />
          {unread > 0 && (
            <span className="rounded-[5px] bg-crit px-1.5 py-0.5 text-[11px] font-medium text-white">
              {num(unread)}
            </span>
          )}
        </Button>
        {bellOpen && (
          <>
            <button
              className="fixed inset-0 cursor-default"
              aria-label="بستن اعلان‌ها"
              onClick={() => setBellOpen(false)}
            />
            <div className="absolute end-0 top-11 z-10 w-80 rounded-[12px] border border-line bg-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-semibold">اعلان‌ها</span>
                <Button variant="quiet" size="sm" onClick={markAllRead}>
                  خواندن همه
                </Button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => markRead(n.id)}
                      className="flex w-full flex-col items-start gap-1 border-b border-line px-4 py-3 text-start last:border-0 hover:bg-canvas"
                    >
                      <span className={`text-[13px] ${n.read ? 'text-ink-soft' : 'font-medium'}`}>
                        {n.text}
                      </span>
                      <span className="text-xs text-ink-soft">{n.ago}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <Button size="sm" onClick={() => setMenuOpen((v) => !v)}>
          <span className="grid size-6 place-items-center rounded-full bg-brand-tint text-[11px] font-semibold text-brand-ink">
            {userName.slice(0, 1)}
          </span>
          <ChevronDown size={14} strokeWidth={1.5} />
        </Button>
        {menuOpen && (
          <>
            <button
              className="fixed inset-0 cursor-default"
              aria-label="بستن منو"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute end-0 top-11 z-10 w-72 rounded-[12px] border border-line bg-surface p-2 shadow-lg">
              <p className="px-2.5 py-2 text-xs text-ink-soft">مشاهده سیستم به عنوان:</p>
              {PERSONAS.map((p) => (
                <button
                  key={p.role}
                  onClick={() => {
                    signInAs(p.role)
                    setMenuOpen(false)
                    navigate(p.role === 'SUPER_ADMIN' ? '/admin' : '/')
                  }}
                  className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] hover:bg-canvas ${
                    p.role === role ? 'bg-brand-tint text-brand-ink' : ''
                  }`}
                >
                  <span>{p.user}</span>
                  <span className="text-xs opacity-70">{ROLE_LABELS[p.role]}</span>
                </button>
              ))}
              <div className="my-1.5 border-t border-line" />
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[13px] text-ink-soft hover:bg-canvas hover:text-ink"
              >
                <LogOut size={14} strokeWidth={1.5} />
                خروج از دمو
              </button>
            </div>
          </>
        )}
      </div>

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="جستجوی سریع">
        <input
          autoFocus
          className={inputClass}
          placeholder="نام مشتری، شماره سفارش، کد کالا یا فاکتور"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="mt-4 space-y-1">
          {results.map((r) => (
            <li key={r.kind + r.label}>
              <button
                onClick={() => {
                  navigate(r.to)
                  setSearchOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-start text-sm hover:bg-canvas"
              >
                <span>{r.label}</span>
                <Badge dot={false}>{r.kind}</Badge>
              </button>
            </li>
          ))}
          {query.trim().length >= 2 && !results.length && (
            <li className="px-3 py-6 text-center text-[13px] text-ink-soft">نتیجه‌ای یافت نشد.</li>
          )}
        </ul>
      </Modal>
    </header>
  )
}
