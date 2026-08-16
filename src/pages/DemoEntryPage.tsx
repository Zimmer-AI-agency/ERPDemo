import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Check } from 'lucide-react'
import type { AccountingMode, ModuleId } from '../types'
import { PERSONAS, ROLE_LABELS } from '../data/rbac'
import { COMPANY_NAME, PRODUCTION_LINES, SEASON, STYLES, WORK_ORDERS } from '../data/garment'
import { ALL_MODULES, MODULE_BLURBS, MODULE_LABELS, useAuth } from '../store/useAuth'
import { Button } from '../components/ui'
import { num } from '../lib/format'

/** Two steps, one screen: pick the modules this prospect actually runs, then
 *  pick whose eyes you want to see the workspace through. */
export function DemoEntryPage() {
  const navigate = useNavigate()
  const { modules, accountingMode, toggleModule, setAccountingMode, signInAs } = useAuth()
  const [step, setStep] = useState<'setup' | 'persona'>('setup')

  const needsMode = modules.includes('accounting') && !accountingMode
  const ready = modules.length > 0 && !needsMode

  function enter(role: (typeof PERSONAS)[number]['role']) {
    signInAs(role)
    navigate(role === 'SUPER_ADMIN' ? '/admin' : '/')
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1fr_38%]">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-[8px] bg-brand text-sm font-bold text-white">
              Z
            </span>
            <span className="text-base font-bold tracking-tight">زیمر</span>
            <span className="ms-1 text-[13px] text-ink-soft">نسخه نمایشی</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold leading-[1.2] tracking-tight md:text-4xl">
            سامانه یکپارچه تولید پوشاک
          </h1>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-soft">
            خرید، انبار، تولید، فروش، توزیع، ارتباط با مشتری و حسابداری — ماژول‌هایی مستقل
            که همگی به یک لایه گزارش‌گیری و هوش مصنوعی می‌ریزند. شرکت نمونه: {COMPANY_NAME}،
            فصل {SEASON}.
          </p>

          <ol className="mt-8 flex items-center gap-3 text-[13px]">
            <Step
              index="۱"
              label="انتخاب ماژول‌ها"
              active={step === 'setup'}
              done={step === 'persona'}
            />
            <span className="h-px w-6 bg-line" />
            <Step index="۲" label="انتخاب نقش" active={step === 'persona'} done={false} />
          </ol>

          {step === 'setup' ? (
            <>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {ALL_MODULES.map((m) => (
                  <li key={m}>
                    <ModuleCard
                      id={m}
                      selected={modules.includes(m)}
                      onToggle={() => toggleModule(m)}
                    />
                  </li>
                ))}
              </ul>

              {modules.includes('accounting') && (
                <div className="mt-4 rounded-[12px] border border-line bg-surface p-4">
                  <p className="text-[13px] font-semibold">حالت حسابداری را انتخاب کنید</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    هیچ‌کدام پیش‌فرض نیست. هر دو کامل ساخته شده‌اند؛ انتخاب با شماست.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <ModeCard
                      id="native"
                      title="حسابداری داخلی زیمر"
                      blurb="دفتر کل، اسناد و مغایرت‌گیری داخل زیمر. بدون وابستگی بیرونی."
                      selected={accountingMode === 'native'}
                      onSelect={setAccountingMode}
                    />
                    <ModeCard
                      id="integration"
                      title="اتصال به نرم‌افزار موجود"
                      blurb="مرجع مالی نرم‌افزار فعلی شما می‌ماند؛ زیمر رویدادها را ارسال می‌کند."
                      selected={accountingMode === 'integration'}
                      onSelect={setAccountingMode}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="primary" disabled={!ready} onClick={() => setStep('persona')}>
                  ساخت فضای کاری
                  <ArrowLeft size={16} strokeWidth={1.5} />
                </Button>
                <p className="text-xs text-ink-soft">
                  {needsMode
                    ? 'برای ادامه، حالت حسابداری را انتخاب کنید.'
                    : 'گفتگوی داخلی، خوراک فعالیت و لایه هوش مصنوعی همیشه فعال‌اند.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm font-semibold">با کدام نقش وارد می‌شوید؟</p>
              <p className="mt-1 text-[13px] text-ink-soft">
                همان داده، بازچینش‌شده برای دپارتمان هر مدیر.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {PERSONAS.map((p) => (
                  <li key={p.role}>
                    <button
                      onClick={() => enter(p.role)}
                      className="h-full w-full rounded-[12px] border border-line bg-surface p-4 text-start transition-colors hover:border-brand hover:bg-brand-tint"
                    >
                      <span className="block text-sm font-medium">{p.user}</span>
                      <span className="mt-0.5 block text-xs text-brand-ink">
                        {ROLE_LABELS[p.role]}
                      </span>
                      <span className="mt-2 block text-xs leading-relaxed text-ink-soft">
                        {p.blurb}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button onClick={() => setStep('setup')}>بازگشت به انتخاب ماژول‌ها</Button>
              </div>
            </>
          )}
        </div>
      </section>

      <BrandPanel />
    </div>
  )
}

/** Drawn, not fetched. A demo that opens on a broken image is a dead demo, and
 *  a client machine on a locked-down network cannot be assumed to reach a photo
 *  host. Swap this whole aside for an <img> once real factory photography
 *  exists — bundle it under public/, never hotlink it. */
function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden lg:block" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(155deg, #5b2cc0 0%, #7f5af0 52%, #a379ff 100%)',
        }}
      />
      {/* Bolts of fabric stacked on the shelf, read as diagonal bands. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(115deg, rgb(255 255 255 / 0.09) 0 18px, transparent 18px 34px, rgb(255 255 255 / 0.05) 34px 58px, transparent 58px 96px)',
        }}
      />
      {/* A stitch line running the length of the panel. */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M-20 210 C 120 150, 260 300, 420 235"
          stroke="rgb(255 255 255 / 0.5)"
          strokeWidth="2"
          strokeDasharray="10 9"
        />
        <path
          d="M-20 250 C 120 190, 260 340, 420 275"
          stroke="rgb(255 255 255 / 0.22)"
          strokeWidth="2"
          strokeDasharray="10 9"
        />
        <path
          d="M-20 590 C 130 520, 250 660, 420 585"
          stroke="rgb(255 255 255 / 0.35)"
          strokeWidth="2"
          strokeDasharray="10 9"
        />
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgb(31 27 45 / 0.55), transparent 55%)' }}
      />

      <div className="absolute inset-x-0 bottom-0 p-10 text-white">
        <p className="text-xs tracking-wide text-white/70">شرکت نمونه این دمو</p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{COMPANY_NAME}</p>
        <p className="mt-1 text-[13px] text-white/80">{SEASON}</p>
        <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-white/20 pt-5 text-[13px]">
          <Fact label="مدل فعال" value={num(STYLES.length)} />
          <Fact label="سفارش کار باز" value={num(WORK_ORDERS.length)} />
          <Fact label="خط تولید" value={num(PRODUCTION_LINES.length)} />
        </dl>
      </div>
    </aside>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-white/70">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function Step({
  index,
  label,
  active,
  done,
}: {
  index: string
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid size-6 place-items-center rounded-[6px] text-xs font-semibold ${
          active || done ? 'bg-brand text-white' : 'border border-line text-ink-soft'
        }`}
      >
        {done ? <Check size={13} strokeWidth={2.5} /> : index}
      </span>
      <span className={active ? 'font-medium' : 'text-ink-soft'}>{label}</span>
    </li>
  )
}

function ModuleCard({
  id,
  selected,
  onToggle,
}: {
  id: ModuleId
  selected: boolean
  onToggle: () => void
}) {
  return (
    <label
      className={`flex h-full cursor-pointer gap-3 rounded-[12px] border p-3.5 transition-colors ${
        selected ? 'border-brand bg-brand-tint' : 'border-line bg-surface hover:border-brand/40'
      }`}
    >
      <input type="checkbox" className="sr-only" checked={selected} onChange={onToggle} />
      <span
        className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${
          selected ? 'border-brand bg-brand text-white' : 'border-line bg-surface'
        }`}
        aria-hidden
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-[13px] font-medium">{MODULE_LABELS[id]}</span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
          {MODULE_BLURBS[id]}
        </span>
      </span>
    </label>
  )
}

function ModeCard({
  id,
  title,
  blurb,
  selected,
  onSelect,
}: {
  id: AccountingMode
  title: string
  blurb: string
  selected: boolean
  onSelect: (m: AccountingMode) => void
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-[8px] border p-3 transition-colors ${
        selected ? 'border-brand bg-brand-tint' : 'border-line hover:border-brand/40'
      }`}
    >
      <input
        type="radio"
        name="accounting-mode"
        className="sr-only"
        checked={selected}
        onChange={() => onSelect(id)}
      />
      <span
        className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${
          selected ? 'border-brand bg-brand text-white' : 'border-line bg-surface'
        }`}
        aria-hidden
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{blurb}</span>
      </span>
    </label>
  )
}
