import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { INVOICES, LEADS, PURCHASE_ORDERS, SOLD_THIS_MONTH, WAREHOUSES } from '../data/mock'
import { PAYABLES } from '../data/garment'
import { DEPT_LABELS } from '../data/rbac'
import type { Dept } from '../types'
import { WASTE_LIMIT_PCT } from '../lib/insights'
import { AiNextCard, AiSummaryCard, AlertsPanel, useDept } from '../components/InsightCards'
import {
  COMPANY,
  STATUS_LABELS,
  inventoryValue,
  isLow,
  finishedUnits,
  isBehind,
  monthlySales,
  receivables,
  seriesFor,
  useDemo,
  wastePct,
  wipUnits,
} from '../store/useDemo'
import { dec, money, num, pct } from '../lib/format'
import { Badge, Card, CardHead, Skeleton, Tabs, useBriefLoad, useCountUp } from '../components/ui'
import { SalesOrderDrawer, STATUS_TONE } from '../components/SalesOrderDrawer'

type Metric = 'amount' | 'orders' | 'volume'

/** The Owner/GM view: cross-module, company-wide, unfiltered. */
function ManagementDashboard() {
  const loading = useBriefLoad()
  const navigate = useNavigate()
  const [metric, setMetric] = useState<Metric>('amount')
  const [openOrder, setOpenOrder] = useState<string | null>(null)

  const { products, customers, orders, period, salesDelta, receivablesDelta } = useDemo()

  const sales = monthlySales(salesDelta)
  const lowCount = products.filter(isLow).length
  const overdueTotal = INVOICES.reduce((s, i) => s + i.amount, 0)
  const delayed = PURCHASE_ORDERS.filter((p) => p.status === 'delayed')
  const readyToShip = orders.filter((o) => o.status === 'ready').length
  const followUps = customers.filter((c) => c.status !== 'active').length
  const series = seriesFor(period)

  if (loading) return <DashboardSkeleton />

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">داشبورد مدیریت</h1>

      <div className="mb-4 grid gap-4 2xl:grid-cols-[1fr_360px]">
        <AiSummaryCard />
        <AiNextCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <Kpi label="فروش این ماه" value={sales} format={money} change={COMPANY.salesChangePct} />
        <Kpi
          label="خرید این ماه"
          value={COMPANY.monthlyPurchases}
          format={money}
          change={COMPANY.purchaseChangePct}
        />
        <Kpi label="ارزش موجودی" value={inventoryValue(products)} format={money} />
        <Kpi label="مطالبات فروش" value={receivables(receivablesDelta)} format={money} />
        <Kpi
          label="مشتریان فعال"
          value={COMPANY.activeCustomers}
          format={(n) => `${num(n)} مشتری`}
          note={`+${num(COMPANY.newCustomersThisMonth)} این ماه`}
        />
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHead
            title="روند فروش و خرید"
            extra={
              <Tabs<Metric>
                active={metric}
                onChange={setMetric}
                tabs={[
                  { id: 'amount', label: 'مبلغ' },
                  { id: 'orders', label: 'تعداد سفارش' },
                  { id: 'volume', label: 'حجم کالا' },
                ]}
              />
            }
          />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e7e3ed" vertical={false} />
                <XAxis
                  dataKey="month"
                  reversed
                  tick={{ fontSize: 12, fill: '#6b6478' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#6b6478' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    metric === 'amount' ? dec(v / 1_000_000_000) : num(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    direction: 'rtl',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    borderRadius: 12,
                    border: '1px solid #e7e3ed',
                  }}
                  formatter={(v) => (metric === 'amount' ? money(Number(v)) : num(Number(v)))}
                />
                <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
                {metric === 'amount' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="فروش"
                      stroke="#7c3aed"
                      fill="url(#fillSales)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      name="خرید"
                      stroke="#a78bfa"
                      fill="none"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                    />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey={metric === 'orders' ? 'orders' : 'volume'}
                    name={metric === 'orders' ? 'تعداد سفارش' : 'حجم کالا'}
                    stroke="#7c3aed"
                    fill="url(#fillSales)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="نیازمند توجه شما" />
          <ul className="divide-y divide-line">
            <Attention
              text={`${num(lowCount)} کالا زیر حداقل موجودی`}
              tone="crit"
              onClick={() => navigate('/inventory?tab=low')}
            />
            <Attention
              text={`${num(INVOICES.length)} فاکتور سررسید گذشته`}
              detail={money(overdueTotal)}
              tone="warn"
              onClick={() => navigate('/receivables')}
            />
            <Attention
              text={`${num(delayed.length)} سفارش خرید با تاخیر`}
              tone="warn"
              onClick={() => navigate('/purchases?tab=delayed')}
            />
            <Attention
              text={`${num(readyToShip)} سفارش آماده ارسال`}
              tone="info"
              onClick={() => navigate('/sales?tab=ready')}
            />
            <Attention
              text={`${num(followUps)} مشتری نیازمند پیگیری`}
              tone="info"
              onClick={() => navigate('/crm?tab=followups')}
            />
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_360px]">
        <Card>
          <CardHead title="آخرین سفارش‌های فروش" />
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">شماره</th>
                <th className="px-4 py-2.5 text-start font-medium">مشتری</th>
                <th className="px-4 py-2.5 text-start font-medium">مبلغ</th>
                <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setOpenOrder(o.id)}
                  className={`cursor-pointer border-b border-line last:border-0 hover:bg-canvas ${o.isNew ? 'row-enter' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">{customers.find((c) => c.id === o.customerId)?.name}</td>
                  <td className="px-4 py-3 tabular-nums">{money(o.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHead title="پرفروش‌ترین کالاها" extra={<span className="text-xs text-ink-soft">مرداد ۱۴۰۵</span>} />
          <ul className="space-y-4 px-5 py-5">
            {Object.entries(SOLD_THIS_MONTH)
              .sort((a, b) => b[1] - a[1])
              .map(([code, qty], _, all) => {
                const product = products.find((p) => p.code === code)
                return (
                  <li key={code}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13px]">{product?.name}</span>
                      <span className="shrink-0 text-[13px] font-medium tabular-nums">
                        {num(qty)} {product?.unit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-[3px] bg-canvas">
                      <div
                        className="h-full rounded-[3px] bg-brand"
                        style={{ width: `${(qty / all[0][1]) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
          </ul>
        </Card>

        <Card>
          <CardHead title="وضعیت انبارها" />
          <ul className="space-y-5 px-5 py-5">
            {WAREHOUSES.map((w) => (
              <li key={w.id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px]">{w.name}</span>
                  <span className="text-[13px] font-medium tabular-nums">{pct(w.capacityPct)}</span>
                </div>
                <div className="h-2 rounded-[3px] bg-canvas">
                  <div
                    className={`h-full rounded-[3px] ${w.capacityPct >= 85 ? 'bg-warn' : 'bg-brand'}`}
                    style={{ width: `${w.capacityPct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            <Link to="/inventory?tab=warehouses" className="hover:text-brand">
              مشاهده جزئیات انبارها
            </Link>
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <AlertsPanel />
      </div>

      <SalesOrderDrawer orderId={openOrder} onClose={() => setOpenOrder(null)} />
    </>
  )
}

/** Every other persona gets the same shell reshaped around their department:
 *  the AI summary, their alerts, their activity, their numbers. */
function DeptDashboard() {
  const loading = useBriefLoad()
  const dept = useDept()
  const state = useDemo()
  const tiles = DEPT_TILES[dept]?.(state) ?? []
  const links = DEPT_LINKS[dept] ?? []

  if (loading) return <DashboardSkeleton />

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">
        داشبورد {DEPT_LABELS[dept]}
      </h1>

      <AiSummaryCard />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="px-5 py-4">
            <p className="text-[13px] text-ink-soft">{t.label}</p>
            <p className={`mt-2 text-xl font-bold tabular-nums ${t.tone === 'crit' ? 'text-crit' : ''}`}>
              {t.value}
            </p>
            {t.note && <p className="mt-1 text-xs text-ink-soft">{t.note}</p>}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <AlertsPanel />
        <div className="space-y-4">
          <Card>
            <CardHead title="فعالیت‌های دپارتمان" />
            <ol className="divide-y divide-line">
              {state.auditLog.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-3 text-[13px]">
                  <span className="shrink-0 text-ink-soft">{a.at}</span>
                  <span className="flex-1">
                    <span className="font-medium">{a.user}</span> {a.detail}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <CardHead title="میان‌برها" />
            <ul className="divide-y divide-line">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="block px-5 py-3 text-[13px] hover:bg-canvas">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <AiNextCard />
      </div>
    </>
  )
}

interface Tile {
  label: string
  value: string
  note?: string
  tone?: 'crit'
}

type DemoSlice = ReturnType<typeof useDemo.getState>

/** Each department's four numbers, all derived — never a typed-in figure. */
const DEPT_TILES: Partial<Record<Dept, (s: DemoSlice) => Tile[]>> = {
  production: (s) => [
    { label: 'کالای در جریان ساخت', value: `${num(wipUnits(s.workOrders))} عدد` },
    { label: 'سفارش کار باز', value: num(s.workOrders.length) },
    {
      label: 'عقب از برنامه',
      value: num(s.workOrders.filter(isBehind).length),
      tone: s.workOrders.some(isBehind) ? 'crit' : undefined,
    },
    {
      label: 'مصرف پارچه بیش از BOM',
      value: num(s.workOrders.filter((w) => wastePct(w) > WASTE_LIMIT_PCT).length),
    },
  ],
  sales: (s) => [
    { label: 'فروش این ماه', value: money(monthlySales(s.salesDelta)) },
    { label: 'سفارش باز', value: num(s.orders.filter((o) => o.status !== 'delivered').length) },
    { label: 'آماده ارسال', value: num(s.orders.filter((o) => o.status === 'ready').length) },
    {
      label: 'مطالبات معوق',
      value: money(INVOICES.reduce((sum, i) => sum + i.amount, 0)),
      tone: 'crit',
    },
  ],
  warehouse: (s) => [
    { label: 'ارزش موجودی', value: money(inventoryValue(s.products)) },
    {
      label: 'کالای کم‌موجود',
      value: num(s.products.filter(isLow).length),
      tone: s.products.some(isLow) ? 'crit' : undefined,
    },
    { label: 'کالای در جریان ساخت', value: `${num(wipUnits(s.workOrders))} عدد` },
    { label: 'محصول نهایی', value: `${num(finishedUnits(s.skuStock))} عدد` },
  ],
  finance: (s) => [
    { label: 'حساب‌های دریافتنی', value: money(receivables(s.receivablesDelta)) },
    { label: 'حساب‌های پرداختنی', value: money(PAYABLES.reduce((sum, p) => sum + p.amount, 0)) },
    {
      label: 'سررسید گذشته',
      value: money(INVOICES.reduce((sum, i) => sum + i.amount, 0)),
      tone: 'crit',
    },
    { label: 'سرمایه قفل‌شده در موجودی', value: money(inventoryValue(s.products)) },
  ],
  crm: (s) => [
    { label: 'خریداران', value: num(s.customers.length) },
    {
      label: 'نیازمند پیگیری',
      value: num(s.customers.filter((c) => c.status !== 'active').length),
    },
    { label: 'سرنخ باز', value: num(LEADS.filter((l) => l.stage !== 'won' && l.stage !== 'lost').length) },
    {
      label: 'بیشترین بدهی',
      value: money(Math.max(...s.customers.map((c) => c.debt))),
    },
  ],
  purchasing: () => [
    { label: 'سفارش خرید باز', value: num(PURCHASE_ORDERS.filter((p) => p.status !== 'received').length) },
    {
      label: 'تاخیردار',
      value: num(PURCHASE_ORDERS.filter((p) => p.status === 'delayed').length),
      tone: 'crit',
    },
    {
      label: 'تعهد خرید باز',
      value: money(
        PURCHASE_ORDERS.filter((p) => p.status !== 'received').reduce((s, p) => s + p.total, 0),
      ),
    },
    { label: 'خرید این ماه', value: money(COMPANY.monthlyPurchases) },
  ],
}

const DEPT_LINKS: Partial<Record<Dept, { label: string; to: string }[]>> = {
  production: [
    { label: 'سفارش‌های کار', to: '/manufacturing?tab=orders' },
    { label: 'مصرف پارچه', to: '/manufacturing?tab=consumption' },
    { label: 'پیمانکاران', to: '/manufacturing?tab=subcontractors' },
  ],
  sales: [
    { label: 'دفتر سفارش‌ها', to: '/sales?tab=all' },
    { label: 'لیست قیمت', to: '/sales?tab=pricelist' },
    { label: 'بارها', to: '/distribution?tab=all' },
  ],
  warehouse: [
    { label: 'کالاهای کم‌موجود', to: '/inventory?tab=low' },
    { label: 'کالای در جریان ساخت', to: '/inventory?tab=wip' },
    { label: 'محصول نهایی', to: '/inventory?tab=finished' },
  ],
  finance: [
    { label: 'فاکتورهای فروش', to: '/accounting?tab=ar' },
    { label: 'صورتحساب تامین‌کننده', to: '/accounting?tab=ap' },
    { label: 'دفتر روزنامه', to: '/accounting?tab=ledger' },
  ],
  crm: [
    { label: 'خریداران', to: '/crm?tab=customers' },
    { label: 'سرنخ‌ها', to: '/crm?tab=leads' },
    { label: 'پیگیری‌ها', to: '/crm?tab=followups' },
  ],
  purchasing: [
    { label: 'سفارش‌های خرید', to: '/purchases?tab=orders' },
    { label: 'خریدهای تاخیردار', to: '/purchases?tab=delayed' },
    { label: 'پیشنهاد خرید', to: '/purchases?tab=advice' },
  ],
}

export function DashboardPage() {
  const dept = useDept()
  return dept === 'management' ? <ManagementDashboard /> : <DeptDashboard />
}

function Kpi({
  label,
  value,
  format,
  change,
  note,
}: {
  label: string
  value: number
  format: (n: number) => string
  change?: number
  note?: string
}) {
  const animated = useCountUp(value)
  const up = (change ?? 0) >= 0
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-ink-soft">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums">{format(animated)}</p>
      {change !== undefined && (
        <p className={`mt-2 flex items-center gap-1 text-xs ${up ? 'text-ok' : 'text-crit'}`}>
          {up ? <ArrowUpRight size={13} strokeWidth={2} /> : <ArrowDownRight size={13} strokeWidth={2} />}
          {pct(change)} نسبت به ماه قبل
        </p>
      )}
      {note && <p className="mt-2 text-xs text-ok">{note}</p>}
    </Card>
  )
}

function Attention({
  text,
  detail,
  tone,
  onClick,
}: {
  text: string
  detail?: string
  tone: 'crit' | 'warn' | 'info'
  onClick: () => void
}) {
  const dot = { crit: 'bg-crit', warn: 'bg-warn', info: 'bg-info' }[tone]
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 px-5 py-3.5 text-start hover:bg-canvas">
        <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
        <span className="flex-1 text-[13px]">{text}</span>
        {detail && <span className="text-[13px] font-medium tabular-nums">{detail}</span>}
      </button>
    </li>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="mb-5 h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 2xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-[352px]" />
        <Skeleton className="h-[352px]" />
      </div>
    </>
  )
}
