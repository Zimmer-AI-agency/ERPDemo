import { useNavigate } from 'react-router'
import { INVOICES, MANAGEMENT_INSIGHTS, PURCHASE_ORDERS, RECEIVABLE_BUCKETS, TODAY_ACTIVITY } from '../data/mock'
import { isLow, receivables, totalStock, useDemo } from '../store/useDemo'
import { jalali, money, num } from '../lib/format'
import { Badge, Card, CardHead, PageHeader } from '../components/ui'
import { useDept } from '../components/InsightCards'
import { DEPT_LABELS } from '../data/rbac'
import type { Dept } from '../types'

export function AttentionPage() {
  const navigate = useNavigate()
  const { products, orders, customers } = useDemo()
  const low = products.filter(isLow)
  const delayed = PURCHASE_ORDERS.filter((p) => p.status === 'delayed')
  const ready = orders.filter((o) => o.status === 'ready')
  const overdueTotal = INVOICES.reduce((s, i) => s + i.amount, 0)

  return (
    <>
      <PageHeader title="مرکز توجه" subtitle="مواردی که امروز نیازمند تصمیم شما هستند" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="موجودی بحرانی" extra={<Badge tone="crit">{num(low.length)} کالا</Badge>} />
          <ul className="divide-y divide-line">
            {low.map((p) => (
              <li
                key={p.code}
                onClick={() => navigate('/inventory?tab=low')}
                className="cursor-pointer px-5 py-3.5 text-[13px] hover:bg-canvas"
              >
                <div className="flex justify-between font-medium">
                  <span>{p.name}</span>
                  <span className="tabular-nums text-crit">
                    {num(totalStock(p))} {p.unit}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">حداقل موجودی {num(p.minQty)} {p.unit}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHead
            title="فاکتورهای سررسید گذشته"
            extra={<Badge tone="warn">{money(overdueTotal)}</Badge>}
          />
          <ul className="divide-y divide-line">
            {INVOICES.map((i) => (
              <li
                key={i.id}
                onClick={() => navigate('/receivables')}
                className="flex cursor-pointer items-center gap-3 px-5 py-3.5 text-[13px] hover:bg-canvas"
              >
                <span className="font-medium">{i.id}</span>
                <span>{customers.find((c) => c.id === i.customerId)?.name}</span>
                <Badge tone={i.overdueDays > 30 ? 'crit' : 'warn'}>{num(i.overdueDays)} روز</Badge>
                <span className="ms-auto tabular-nums">{money(i.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHead title="سفارش‌های خرید با تاخیر" extra={<Badge tone="crit">{num(delayed.length)}</Badge>} />
          <ul className="divide-y divide-line">
            {delayed.map((p) => (
              <li
                key={p.id}
                onClick={() => navigate('/purchases?tab=delayed')}
                className="flex cursor-pointer items-center gap-3 px-5 py-3.5 text-[13px] hover:bg-canvas"
              >
                <span className="font-medium">{p.id}</span>
                <span>{p.supplier}</span>
                <span className="ms-auto text-ink-soft">
                  انتظار {jalali(p.expectedAt)} · {num(p.delayDays)} روز تاخیر
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHead title="سفارش‌های آماده ارسال" extra={<Badge tone="brand">{num(ready.length)}</Badge>} />
          <ul className="divide-y divide-line">
            {ready.map((o) => (
              <li
                key={o.id}
                onClick={() => navigate('/sales?tab=ready')}
                className="flex cursor-pointer items-center gap-3 px-5 py-3.5 text-[13px] hover:bg-canvas"
              >
                <span className="font-medium">{o.id}</span>
                <span>{customers.find((c) => c.id === o.customerId)?.name}</span>
                <span className="ms-auto tabular-nums">{money(o.total)}</span>
              </li>
            ))}
            {!ready.length && (
              <li className="px-5 py-6 text-center text-[13px] text-ink-soft">
                سفارشی در انتظار ارسال نیست.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  )
}

/** Which audit modules belong to which department. The Owner/GM is the one
 *  scope that stays unfiltered. */
const DEPT_MODULES: Partial<Record<Dept, string[]>> = {
  production: ['تولید'],
  sales: ['فروش', 'توزیع'],
  warehouse: ['انبار', 'توزیع', 'تولید'],
  finance: ['مالی', 'فروش'],
  crm: ['CRM', 'فروش'],
  purchasing: ['خرید'],
}

export function ActivityPage() {
  const { auditLog } = useDemo()
  const dept = useDept()
  const scoped =
    dept === 'management'
      ? auditLog
      : auditLog.filter((a) => DEPT_MODULES[dept]?.includes(a.module))

  return (
    <>
      <PageHeader
        title="فعالیت‌ها"
        subtitle={
          dept === 'management'
            ? 'خوراک فعالیت کل شرکت — همه ماژول‌ها'
            : `فعالیت‌های دپارتمان ${DEPT_LABELS[dept]}`
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="رویدادهای عملیاتی" />
          <ol className="divide-y divide-line">
            {TODAY_ACTIVITY.map((a) => (
              <li key={a.at} className="flex gap-4 px-5 py-3.5 text-[13px]">
                <span className="shrink-0 text-ink-soft">{a.at}</span>
                <span>{a.text}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardHead title="ثبت‌های کاربران" extra={<Badge dot={false}>{DEPT_LABELS[dept]}</Badge>} />
          <ol className="divide-y divide-line">
            {scoped.slice(0, 8).map((a) => (
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
        <Card className="lg:col-span-2">
          <CardHead title="بینش مدیریتی" />
          <ul className="grid gap-3 px-5 py-5 md:grid-cols-2">
            {MANAGEMENT_INSIGHTS.map((text) => (
              <li key={text} className="rounded-[12px] border border-line px-4 py-3.5">
                <Badge tone="brand" dot={false}>بینش سیستم</Badge>
                <p className="mt-2 text-[13px] leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

export function ReceivablesPage() {
  const { customers, receivablesDelta } = useDemo()
  const total = receivables(receivablesDelta)

  return (
    <>
      <PageHeader
        title="مطالبات فروش"
        subtitle="نمای مطالبات مشتریان. این بخش جایگزین سیستم حسابداری نیست."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-soft">کل مطالبات</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{money(total)}</p>
          <ul className="mt-5 space-y-3">
            {RECEIVABLE_BUCKETS.map((b) => (
              <li key={b.label}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="text-ink-soft">{b.label}</span>
                  <span className="tabular-nums">{money(b.amount)}</span>
                </div>
                <div className="h-1.5 rounded-[3px] bg-canvas">
                  <div
                    className="h-full rounded-[3px] bg-brand"
                    style={{ width: `${(b.amount / 890_000_000) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHead title="فاکتورهای سررسید گذشته" />
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">فاکتور</th>
                <th className="px-4 py-2.5 text-start font-medium">مشتری</th>
                <th className="px-4 py-2.5 text-start font-medium">سررسید</th>
                <th className="px-4 py-2.5 text-start font-medium">تاخیر</th>
                <th className="px-4 py-2.5 text-start font-medium">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((i) => (
                <tr key={i.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{i.id}</td>
                  <td className="px-4 py-3">{customers.find((c) => c.id === i.customerId)?.name}</td>
                  <td className="px-4 py-3">{jalali(i.dueAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={i.overdueDays > 30 ? 'crit' : 'warn'}>
                      {num(i.overdueDays)} روز
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{money(i.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  )
}

