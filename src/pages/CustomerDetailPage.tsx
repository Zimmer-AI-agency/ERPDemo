import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { INVOICES, TODAY } from '../data/mock'
import { STATUS_LABELS, useDemo } from '../store/useDemo'
import { daysBetween, jalali, money, num, toman } from '../lib/format'
import {
  Badge,
  Card,
  CardHead,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
  useBriefLoad,
} from '../components/ui'
import { STATUS_TONE } from '../components/SalesOrderDrawer'
import { styleOf } from '../data/garment'

type Tab = 'overview' | 'orders' | 'payments' | 'activity' | 'notes'

export function CustomerDetailPage() {
  const { id } = useParams()
  const loading = useBriefLoad()
  const [tab, setTab] = useState<Tab>('overview')
  const { customers, orders, products } = useDemo()

  const customer = customers.find((c) => c.id === id)
  if (loading) return <Skeleton className="h-96" />
  if (!customer) return <EmptyState title="مشتری یافت نشد." />

  const theirOrders = orders.filter((o) => o.customerId === customer.id)
  const theirInvoices = INVOICES.filter((i) => i.customerId === customer.id)

  return (
    <>
      <Link
        to="/crm?tab=customers"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-brand"
      >
        <ArrowRight size={15} strokeWidth={1.5} />
        بازگشت به فهرست مشتریان
      </Link>

      <PageHeader
        title={customer.name}
        subtitle={`${customer.city} · مسئول فروش: ${customer.rep}`}
        actions={
          <Badge tone={customer.status === 'active' ? 'ok' : customer.status === 'watch' ? 'warn' : 'crit'}>
            {customer.status === 'active' ? 'مشتری فعال' : customer.status === 'watch' ? 'نیازمند مراقبت' : 'راکد'}
          </Badge>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="فروش کل" value={money(customer.totalSales)} />
        <Kpi label="مطالبات" value={money(customer.debt)} />
        <Kpi label="تعداد سفارش" value={num(customer.orderCount)} />
        <Kpi
          label="آخرین خرید"
          value={`${num(daysBetween(customer.lastPurchase, TODAY))} روز پیش`}
        />
      </div>

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'overview', label: 'نمای کلی' },
            { id: 'orders', label: 'سفارش‌ها', count: theirOrders.length },
            { id: 'payments', label: 'پرداخت‌ها', count: theirInvoices.length },
            { id: 'activity', label: 'فعالیت‌ها' },
            { id: 'notes', label: 'یادداشت‌ها', count: customer.notes.length },
          ]}
        />
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead title="خلاصه خرید" />
            <ul className="divide-y divide-line">
              {theirOrders.slice(0, 4).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3.5 text-[13px]">
                  <span className="font-medium">{o.id}</span>
                  <span className="text-ink-soft">{jalali(o.createdAt)}</span>
                  <span className="ms-auto tabular-nums">{money(o.total)}</span>
                  <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="شرایط اعتباری" />
            <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-[13px]">
              <div>
                <dt className="text-xs text-ink-soft">سقف اعتبار</dt>
                <dd className="mt-1 font-medium tabular-nums">{toman(customer.credit.limit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">شرایط پرداخت</dt>
                <dd className="mt-1 font-medium">{customer.credit.terms}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">مانده بدهی</dt>
                <dd className="mt-1 font-medium tabular-nums">{toman(customer.debt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">اعتبار باقی‌مانده</dt>
                <dd
                  className={`mt-1 font-medium tabular-nums ${
                    customer.credit.limit - customer.debt < 0 ? 'text-crit' : ''
                  }`}
                >
                  {toman(customer.credit.limit - customer.debt)}
                </dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardHead title="نمونه‌های ارسالی" />
            {customer.samples.length ? (
              <ul className="divide-y divide-line">
                {customer.samples.map((sample) => (
                  <li key={sample.styleCode + sample.sentAt} className="px-5 py-3.5 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {sample.styleCode} — {styleOf(sample.styleCode)?.name} · {sample.color}
                      </span>
                      <span className="text-xs text-ink-soft">{jalali(sample.sentAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">{sample.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="نمونه‌ای برای این خریدار ارسال نشده است." />
            )}
          </Card>
          <Card>
            <CardHead title="آخرین فعالیت‌ها" />
            <ol className="divide-y divide-line">
              {customer.timeline.slice(0, 4).map((t, i) => (
                <li key={i} className="flex gap-4 px-5 py-3.5 text-[13px]">
                  <span className="shrink-0 text-ink-soft">{jalali(t.at)}</span>
                  <span>{t.text}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      {tab === 'orders' && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">شماره</th>
                <th className="px-4 py-2.5 text-start font-medium">کالا</th>
                <th className="px-4 py-2.5 text-start font-medium">مبلغ</th>
                <th className="px-4 py-2.5 text-start font-medium">تاریخ</th>
                <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {theirOrders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">
                    {o.lines
                      .map(
                        (l) =>
                          `${num(l.qty)} ${products.find((p) => p.code === l.productCode)?.unit} ${l.productCode}`,
                      )
                      .join('، ')}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{toman(o.total)}</td>
                  <td className="px-4 py-3">{jalali(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <CardHead title="فاکتورهای باز" />
          {theirInvoices.length ? (
            <ul className="divide-y divide-line">
              {theirInvoices.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-4 text-[13px]">
                  <span className="font-medium">{i.id}</span>
                  <span className="text-ink-soft">سررسید {jalali(i.dueAt)}</span>
                  <Badge tone={i.overdueDays > 30 ? 'crit' : 'warn'}>
                    {num(i.overdueDays)} روز گذشته
                  </Badge>
                  <span className="ms-auto tabular-nums">{toman(i.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="فاکتور سررسید گذشته‌ای ثبت نشده است." />
          )}
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHead title="خط زمانی ارتباط" />
          <ol className="px-5 py-5">
            {customer.timeline.map((t, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                  {i < customer.timeline.length - 1 && <span className="w-px flex-1 bg-line" />}
                </div>
                <div className="pb-6">
                  <p className="text-xs text-ink-soft">{jalali(t.at)}</p>
                  <p className="mt-1 text-[13px]">{t.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          <CardHead title="یادداشت‌ها" />
          {customer.notes.length ? (
            <ul className="divide-y divide-line">
              {customer.notes.map((n, i) => (
                <li key={i} className="px-5 py-4 text-[13px]">
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="یادداشتی ثبت نشده است." hint="کارشناس CRM می‌تواند یادداشت اضافه کند." />
          )}
        </Card>
      )}
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-ink-soft">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
    </Card>
  )
}
