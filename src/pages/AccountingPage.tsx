import { useSearchParams } from 'react-router'
import { Link2, Lock, RefreshCw } from 'lucide-react'
import { INVOICES, RECEIVABLE_BUCKETS } from '../data/mock'
import { EXTERNAL_ACCOUNTING, LEDGER, PAYABLES } from '../data/garment'
import { useAuth } from '../store/useAuth'
import { inventoryValue, receivables, useDemo } from '../store/useDemo'
import { jalali, money, num, toman } from '../lib/format'
import {
  Badge,
  Button,
  Can,
  Card,
  CardHead,
  PageHeader,
  Skeleton,
  Tabs,
  useBriefLoad,
} from '../components/ui'

type Tab = 'summary' | 'ar' | 'ap' | 'ledger' | 'aging'

/** The financial system of record is either Zimmer's own module or the client's
 *  existing software. Neither is a fallback: the page renders whichever mode
 *  the workspace was set up with. */
export function AccountingPage() {
  const loading = useBriefLoad()
  const mode = useAuth((s) => s.accountingMode)
  const setMode = useAuth((s) => s.setAccountingMode)

  if (loading) return <Skeleton className="h-96" />

  return (
    <>
      <PageHeader
        title="حسابداری"
        subtitle={
          mode === 'integration'
            ? `مرجع مالی: ${EXTERNAL_ACCOUNTING.name} — داده‌ها در زیمر فقط خوانده می‌شوند`
            : 'مرجع مالی: ماژول حسابداری زیمر — اسناد در همین‌جا ثبت می‌شوند'
        }
        actions={
          <Can permission="accounting.edit">
            <Button
              size="sm"
              onClick={() => setMode(mode === 'native' ? 'integration' : 'native')}
            >
              <RefreshCw size={15} strokeWidth={1.5} />
              نمایش حالت {mode === 'native' ? 'اتصال به نرم‌افزار موجود' : 'حسابداری داخلی'}
            </Button>
          </Can>
        }
      />
      {mode === 'integration' ? <IntegrationMode /> : <NativeMode />}
    </>
  )
}

/* ------------------------------- native mode ------------------------------- */

function NativeMode() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'summary') as Tab
  const { products, receivablesDelta, customers } = useDemo()

  const ar = receivables(receivablesDelta)
  const overdue = INVOICES.reduce((s, i) => s + i.amount, 0)
  const ap = PAYABLES.reduce((s, p) => s + p.amount, 0)
  const blocked = inventoryValue(products)

  const apBuckets = [
    { label: 'سررسید نشده', amount: sum(PAYABLES.filter((p) => p.overdueDays === 0)) },
    { label: '۱ تا ۳۰ روز', amount: sum(PAYABLES.filter((p) => p.overdueDays > 0 && p.overdueDays <= 30)) },
    { label: 'بیش از ۳۰ روز', amount: sum(PAYABLES.filter((p) => p.overdueDays > 30)) },
  ]

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="حساب‌های دریافتنی" value={money(ar)} hint={`${money(overdue)} سررسید گذشته`} />
        <Tile label="حساب‌های پرداختنی" value={money(ap)} hint={`${num(PAYABLES.filter((p) => p.overdueDays > 0).length)} صورتحساب معوق`} />
        <Tile label="سرمایه قفل‌شده در موجودی" value={money(blocked)} hint="از ماژول انبار" />
        <Tile label="خالص وضعیت" value={money(ar - ap)} hint="دریافتنی منهای پرداختنی" />
      </div>

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'summary', label: 'خلاصه AP/AR' },
            { id: 'ar', label: 'فاکتورهای فروش' },
            { id: 'ap', label: 'صورتحساب تامین‌کننده' },
            { id: 'ledger', label: 'دفتر روزنامه' },
            { id: 'aging', label: 'سنی مطالبات و بدهی' },
          ]}
        />
      </div>

      {tab === 'summary' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead title="دریافتنی — بزرگ‌ترین بدهکاران" />
            <ul className="divide-y divide-line">
              {[...customers]
                .sort((a, b) => b.debt - a.debt)
                .slice(0, 5)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3 text-[13px]">
                    <span>{c.name}</span>
                    <span className="tabular-nums">{toman(c.debt)}</span>
                  </li>
                ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="پرداختنی — بزرگ‌ترین تامین‌کنندگان" />
            <ul className="divide-y divide-line">
              {[...PAYABLES]
                .sort((a, b) => b.amount - a.amount)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 text-[13px]">
                    <span>{p.supplier}</span>
                    <span className="tabular-nums">{toman(p.amount)}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'ar' && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>فاکتور</Th>
                <Th>خریدار</Th>
                <Th>مبلغ</Th>
                <Th>سررسید</Th>
                <Th>وضعیت</Th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((i) => (
                <tr key={i.id} className="border-b border-line last:border-0">
                  <Td>{i.id}</Td>
                  <Td>{customers.find((c) => c.id === i.customerId)?.name}</Td>
                  <Td>{toman(i.amount)}</Td>
                  <Td>{jalali(i.dueAt)}</Td>
                  <Td>
                    <Badge tone={i.overdueDays > 30 ? 'crit' : 'warn'}>
                      {num(i.overdueDays)} روز تاخیر
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'ap' && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>صورتحساب</Th>
                <Th>تامین‌کننده</Th>
                <Th>مبلغ</Th>
                <Th>سررسید</Th>
                <Th>وضعیت</Th>
              </tr>
            </thead>
            <tbody>
              {PAYABLES.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <Td>{p.id}</Td>
                  <Td>{p.supplier}</Td>
                  <Td>{toman(p.amount)}</Td>
                  <Td>{jalali(p.dueAt)}</Td>
                  <Td>
                    {p.overdueDays ? (
                      <Badge tone={p.overdueDays > 20 ? 'crit' : 'warn'}>
                        {num(p.overdueDays)} روز تاخیر
                      </Badge>
                    ) : (
                      <Badge tone="ok">در مهلت</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'ledger' && (
        <Card>
          <CardHead title="دفتر روزنامه" extra={<Badge dot={false}>اسناد خودکار ماژول‌ها</Badge>} />
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>سند</Th>
                <Th>تاریخ</Th>
                <Th>حساب</Th>
                <Th>مرجع</Th>
                <Th>ماژول</Th>
                <Th>بدهکار</Th>
                <Th>بستانکار</Th>
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <Td>{e.id}</Td>
                  <Td>{jalali(e.at)}</Td>
                  <Td>{e.account}</Td>
                  <Td>{e.ref}</Td>
                  <Td>
                    <Badge tone="brand" dot={false}>{e.module}</Badge>
                  </Td>
                  <Td>{toman(e.debit)}</Td>
                  <Td>{toman(e.credit)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            هر سند را ماژولی که رویداد را ثبت کرده تولید کرده است؛ ورود دستی لازم نیست.
          </p>
        </Card>
      )}

      {tab === 'aging' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Aging title="سنی مطالبات" rows={RECEIVABLE_BUCKETS} total={ar} />
          <Aging title="سنی بدهی به تامین‌کنندگان" rows={apBuckets} total={ap} />
        </div>
      )}
    </>
  )
}

/* ---------------------------- integration mode ----------------------------- */

function IntegrationMode() {
  const { products, receivablesDelta } = useDemo()
  const ar = receivables(receivablesDelta)
  const ap = PAYABLES.reduce((s, p) => s + p.amount, 0)

  return (
    <>
      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 place-items-center rounded-full bg-ok-bg text-ok">
              <Link2 size={18} strokeWidth={1.5} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">
                  متصل به «{EXTERNAL_ACCOUNTING.name}»
                </h2>
                <Badge tone="ok">{EXTERNAL_ACCOUNTING.status}</Badge>
              </div>
              <p className="mt-1.5 text-[13px] text-ink-soft">
                آخرین همگام‌سازی: {EXTERNAL_ACCOUNTING.lastSyncedAt} · {EXTERNAL_ACCOUNTING.direction}
              </p>
            </div>
          </div>
          <dl className="flex gap-6 text-[13px]">
            <SyncStat label="حساب نگاشت‌شده" value={num(EXTERNAL_ACCOUNTING.mappedAccounts)} />
            <SyncStat label="سند ارسالی این ماه" value={num(EXTERNAL_ACCOUNTING.syncedDocsThisMonth)} />
            <SyncStat label="خطای همگام‌سازی" value={num(EXTERNAL_ACCOUNTING.failedDocs)} />
          </dl>
        </div>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Tile label="حساب‌های دریافتنی" value={money(ar)} hint={`مرجع: ${EXTERNAL_ACCOUNTING.name}`} />
        <Tile label="حساب‌های پرداختنی" value={money(ap)} hint={`مرجع: ${EXTERNAL_ACCOUNTING.name}`} />
        <Tile
          label="سرمایه قفل‌شده در موجودی"
          value={money(inventoryValue(products))}
          hint="محاسبه در زیمر — از ماژول انبار"
        />
      </div>

      <Card>
        <CardHead
          title="اسناد ارسال‌شده به نرم‌افزار حسابداری"
          extra={
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <Lock size={13} strokeWidth={1.5} />
              فقط خواندنی در زیمر
            </span>
          }
        />
        <table className="w-full text-[13px]">
          <thead className="border-b border-line bg-canvas text-ink-soft">
            <tr>
              <Th>مرجع</Th>
              <Th>تاریخ</Th>
              <Th>ماژول مبدا</Th>
              <Th>شرح</Th>
              <Th>مبلغ</Th>
              <Th>وضعیت انتقال</Th>
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <Td>{e.ref}</Td>
                <Td>{jalali(e.at)}</Td>
                <Td>
                  <Badge tone="brand" dot={false}>{e.module}</Badge>
                </Td>
                <Td>{e.account}</Td>
                <Td>{toman(e.debit)}</Td>
                <Td>
                  <Badge tone="ok">ثبت شده در {EXTERNAL_ACCOUNTING.name}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-ink-soft">
          در این حالت دفتر کل داخل نرم‌افزار حسابداری فعلی شما باقی می‌ماند. زیمر رویدادهای
          خرید، تولید، فروش و توزیع را یک‌بار ثبت و از طریق سرویس یکپارچه‌سازی ارسال می‌کند؛
          ورود دوباره اطلاعات حذف می‌شود.
        </p>
      </Card>
    </>
  )
}

/* ---------------------------------- pieces --------------------------------- */

const sum = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0)

function Aging({
  title,
  rows,
  total,
}: {
  title: string
  rows: { label: string; amount: number }[]
  total: number
}) {
  const max = Math.max(...rows.map((r) => r.amount), 1)
  return (
    <Card>
      <CardHead title={title} extra={<span className="text-[13px] tabular-nums">{money(total)}</span>} />
      <ul className="space-y-4 px-5 py-4">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span>{r.label}</span>
              <span className="tabular-nums text-ink-soft">{money(r.amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-[3px] bg-canvas">
              <div
                className="h-full rounded-[3px] bg-brand"
                style={{ width: `${Math.round((r.amount / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </Card>
  )
}

function SyncStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-2.5 text-start font-medium">{children}</th>
)

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 tabular-nums">{children}</td>
)
