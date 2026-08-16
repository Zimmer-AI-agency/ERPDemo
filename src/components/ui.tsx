import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import type { Permission } from '../types'
import { useAuth } from '../store/useAuth'
import { num } from '../lib/format'

/* --------------------------------- surfaces -------------------------------- */

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <Tag
      className={`rounded-[12px] border border-line bg-surface ${className}`}
      style={{ boxShadow: '0 1px 2px rgb(31 27 45 / 0.04)' }}
    >
      {children}
    </Tag>
  )
}

export function CardHead({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {extra}
    </header>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1.5 text-[13px] text-ink-soft">{hint}</p>}
    </div>
  )
}

/* --------------------------------- controls -------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'quiet'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium whitespace-nowrap transition-[background-color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0'
  const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm' }
  const variants = {
    // brand on white passes AA at 5.6:1
    primary: 'bg-brand text-white hover:bg-brand-dark',
    ghost: 'border border-line bg-surface text-ink hover:bg-canvas',
    quiet: 'text-ink-soft hover:bg-canvas hover:text-ink',
  }
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && <span className="text-xs text-crit">{error}</span>}
    </label>
  )
}

/* ---------------------------------- select --------------------------------- */

export interface SelectOption<T extends string> {
  value: T
  label: string
  /** Secondary text on the right of the row: a count, a code, a price. */
  hint?: string
}

/** A listbox, not a native <select>. The browser renders a native dropdown with
 *  the OS chrome, which cannot be styled and looks foreign next to the rest of
 *  the app. Keyboard and ARIA behaviour is reimplemented here because that is
 *  what a native select was paying for. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className = '',
  placeholder = 'انتخاب کنید',
  'aria-label': ariaLabel,
}: {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  placeholder?: string
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [up, setUp] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.findIndex((o) => o.value === value)
  const current = options[selected]

  function show() {
    const box = buttonRef.current?.getBoundingClientRect()
    // Flip upwards near the bottom of the viewport, or inside a scrolling modal
    // body the list would just get clipped.
    setUp(Boolean(box && window.innerHeight - box.bottom < 240))
    setActive(selected === -1 ? 0 : selected)
    setOpen(true)
  }

  function commit(index: number) {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        show()
      }
      return
    }
    if (e.key === 'Escape') return setOpen(false)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      return commit(active)
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? active + 1 : active - 1
      setActive((next + options.length) % options.length)
    }
    if (e.key === 'Home') setActive(0)
    if (e.key === 'End') setActive(options.length - 1)
  }

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const heights = { sm: 'h-8 text-[13px]', md: 'h-10 text-sm' }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-2 rounded-[8px] border bg-surface px-3 text-start transition-colors ${heights[size]} ${
          open ? 'border-brand' : 'border-line hover:border-brand/40'
        }`}
      >
        <span className={`flex-1 truncate ${current ? '' : 'text-ink-soft'}`}>
          {current?.label ?? placeholder}
        </span>
        {current?.hint && <span className="shrink-0 text-xs text-ink-soft">{current.hint}</span>}
        <ChevronDown
          size={15}
          strokeWidth={1.5}
          className={`shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-20 cursor-default"
            // Field wraps its children in a <label>; without stopping the click
            // here it forwards to the combobox and re-opens what just closed.
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
          />
          <ul
            ref={listRef}
            role="listbox"
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-x-0 z-30 max-h-60 overflow-y-auto rounded-[12px] border border-line bg-surface p-1 shadow-lg ${
              up ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(i)}
                    className={`flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-start text-[13px] transition-colors ${
                      i === active ? 'bg-brand-tint' : ''
                    } ${isSelected ? 'font-medium text-brand-ink' : ''}`}
                  >
                    <Check
                      size={14}
                      strokeWidth={2}
                      className={`shrink-0 ${isSelected ? 'text-brand' : 'invisible'}`}
                    />
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="shrink-0 text-xs text-ink-soft">{o.hint}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

export const inputClass =
  'h-10 w-full rounded-[8px] border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/70 focus:border-brand focus:outline-none'

/* ---------------------------------- status --------------------------------- */

export type Tone = 'ok' | 'warn' | 'crit' | 'info' | 'neutral' | 'brand'

/** Status is shown as a hairline chip with a colour dot — no filled capsules.
 *  The colour carries the meaning; the surface stays quiet. */
const TONES: Record<Tone, { chip: string; dot: string }> = {
  ok: { chip: 'border-ok/30 text-ok', dot: 'bg-ok' },
  warn: { chip: 'border-warn/30 text-warn', dot: 'bg-warn' },
  crit: { chip: 'border-crit/30 text-crit', dot: 'bg-crit' },
  info: { chip: 'border-info/30 text-info', dot: 'bg-info' },
  neutral: { chip: 'border-line text-ink-soft', dot: 'bg-ink-soft/50' },
  brand: { chip: 'border-brand/30 text-brand-ink', dot: 'bg-brand' },
}

export function Badge({
  tone = 'neutral',
  dot = true,
  children,
}: {
  tone?: Tone
  /** Drop the dot for chips that label a thing rather than a state. */
  dot?: boolean
  children: ReactNode
}) {
  const t = TONES[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border bg-surface px-2 py-1 text-xs font-medium whitespace-nowrap ${t.chip}`}
    >
      {dot && <span className={`size-1.5 shrink-0 rounded-[2px] ${t.dot}`} aria-hidden />}
      {children}
    </span>
  )
}

/* ----------------------------------- tabs ---------------------------------- */

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={`h-8 rounded-[8px] px-3 text-[13px] font-medium transition-colors ${
            t.id === active
              ? 'bg-brand-tint text-brand-ink'
              : 'text-ink-soft hover:bg-canvas hover:text-ink'
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ms-1.5 opacity-70">{num(t.count)}</span>}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------- overlays --------------------------------- */

/** Both modal and drawer sit on <dialog>: focus trapping, Escape and the top
 *  layer come from the platform instead of a hand-rolled portal. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handle = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    el.addEventListener('cancel', handle)
    return () => el.removeEventListener('cancel', handle)
  }, [onClose])
  return ref
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  side = 'end',
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number
  /** 'end' is the left edge in RTL, where detail panels belong. 'start' is the
   *  right edge, reserved for the mobile navigation — it replaces the sidebar,
   *  so it has to come from where the sidebar lives. */
  side?: 'start' | 'end'
  children: ReactNode
}) {
  const ref = useDialog(open, onClose)
  return (
    <dialog
      ref={ref}
      data-side={side}
      className={`fixed inset-y-0 m-0 h-full max-h-none w-full ${
        side === 'start' ? 'start-0' : 'end-0'
      }`}
      style={{ maxWidth: width }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full flex-col bg-surface">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-ink-soft">{subtitle}</p>}
          </div>
          <Button variant="quiet" size="sm" onClick={onClose} aria-label="بستن">
            <X size={16} strokeWidth={1.5} />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useDialog(open, onClose)
  return (
    <dialog
      ref={ref}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rounded-[12px] bg-surface">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="quiet" size="sm" onClick={onClose} aria-label="بستن">
            <X size={16} strokeWidth={1.5} />
          </Button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex justify-start gap-2 border-t border-line px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}

/* ------------------------------- permissions ------------------------------- */

/** Hides the action, or renders it disabled with the reason attached. */
export function Can({
  permission,
  fallback = null,
  disabled,
  children,
}: {
  permission: Permission
  fallback?: ReactNode
  /** Show a disabled version instead of hiding it outright. */
  disabled?: ReactNode
  children: ReactNode
}) {
  const allowed = useAuth((s) => s.rolePermissions[s.role].includes(permission))
  if (allowed) return <>{children}</>
  if (disabled)
    return (
      <span title="شما دسترسی لازم برای انجام این عملیات را ندارید." className="inline-flex">
        {disabled}
      </span>
    )
  return <>{fallback}</>
}

/* --------------------------------- loading --------------------------------- */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-canvas ${className}`} />
}

/** Short, deliberate delay so skeletons are visible without feeling slow. */
export function useBriefLoad(ms = 420) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}

/** Counts up once on mount. Collapses to the final value under reduced motion. */
export function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(target)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setValue(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}
