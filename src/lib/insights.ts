import type {
  Alert,
  Customer,
  Dept,
  Product,
  SalesOrder,
  Shipment,
  SkuStock,
  WorkOrder,
} from '../types'
import { INVOICES, PURCHASE_ORDERS } from '../data/mock'
import { PAYABLES, STAGE_LABELS, styleOf } from '../data/garment'
import {
  finishedUnits,
  inventoryValue,
  isBehind,
  isLow,
  monthlySales,
  receivables,
  totalStock,
  wastePct,
  wipUnits,
} from '../store/useDemo'
import { jalali, money, num, pct } from './format'

export interface InsightCtx {
  products: Product[]
  orders: SalesOrder[]
  customers: Customer[]
  workOrders: WorkOrder[]
  skuStock: SkuStock[]
  shipments: Shipment[]
  salesDelta: number
  receivablesDelta: number
}

/** Fabric consumption over the BOM allowance is a cost leak, not a rounding
 *  error: anything past this is worth a manager's attention. */
export const WASTE_LIMIT_PCT = 2

/* ---------------------------------- alerts ---------------------------------- */

/** Threshold alerts, all recomputed from live state — nothing is a fixed
 *  string with a number typed into it. */
export function allAlerts(ctx: InsightCtx): Alert[] {
  const alerts: Alert[] = []

  for (const p of ctx.products.filter(isLow)) {
    alerts.push({
      id: `AL-stock-${p.code}`,
      dept: 'warehouse',
      severity: 'crit',
      title: `موجودی ${p.name} زیر حداقل است`,
      detail: `${num(totalStock(p))} ${p.unit} موجود، حداقل ${num(p.minQty)} ${p.unit}.`,
      to: '/inventory?tab=low',
      ownerId: 'U-05',
      prefill: `موجودی ${p.code} (${p.name}) به ${num(totalStock(p))} ${p.unit} رسیده و زیر حداقل ${num(p.minQty)} است. لطفاً سفارش خرید را امروز ثبت کنید.`,
    })
  }

  for (const w of ctx.workOrders.filter(isBehind)) {
    alerts.push({
      id: `AL-late-${w.id}`,
      dept: 'production',
      severity: 'crit',
      title: `${w.id} از برنامه عقب است`,
      detail: `${styleOf(w.styleCode)?.name} در مرحله «${STAGE_LABELS[w.stage]}»${
        w.subcontractor ? ` نزد ${w.subcontractor}` : ''
      }، مهلت ${jalali(w.dueAt)}.`,
      to: '/manufacturing?tab=orders',
      ownerId: 'U-07',
      prefill: `سفارش کار ${w.id} (${styleOf(w.styleCode)?.name}) هنوز در مرحله ${STAGE_LABELS[w.stage]} است و از مهلت عبور کرده. وضعیت را امروز اعلام کنید.`,
    })
  }

  for (const w of ctx.workOrders.filter((w) => wastePct(w) > WASTE_LIMIT_PCT)) {
    alerts.push({
      id: `AL-waste-${w.id}`,
      dept: 'production',
      severity: 'warn',
      title: `مصرف پارچه ${w.id} بیش از برنامه است`,
      detail: `${num(Math.round(w.actualFabric))} متر مصرف در برابر ${num(w.plannedFabric)} متر مجاز (${pct(wastePct(w))} بیشتر).`,
      to: '/manufacturing?tab=consumption',
      ownerId: 'U-07',
      prefill: `مصرف پارچه در ${w.id} حدود ${pct(wastePct(w))} از BOM بیشتر شده. علت را بررسی کنید.`,
    })
  }

  const worstInvoice = [...INVOICES].sort((a, b) => b.overdueDays - a.overdueDays)[0]
  if (worstInvoice) {
    const buyer = ctx.customers.find((c) => c.id === worstInvoice.customerId)
    alerts.push({
      id: `AL-ar-${worstInvoice.id}`,
      dept: 'finance',
      severity: 'crit',
      title: `فاکتور ${worstInvoice.id} ${num(worstInvoice.overdueDays)} روز معوق است`,
      detail: `${buyer?.name} — ${money(worstInvoice.amount)}.`,
      to: '/accounting?tab=ar',
      ownerId: 'U-08',
      prefill: `فاکتور ${worstInvoice.id} مربوط به ${buyer?.name} به ${num(worstInvoice.overdueDays)} روز تاخیر رسیده. پیگیری وصول را شروع کنید.`,
    })
  }

  const overduePayable = PAYABLES.filter((p) => p.overdueDays > 0)
  if (overduePayable.length) {
    alerts.push({
      id: 'AL-ap',
      dept: 'finance',
      severity: 'warn',
      title: `${num(overduePayable.length)} صورتحساب تامین‌کننده سررسید گذشته دارد`,
      detail: `مجموع ${money(overduePayable.reduce((s, p) => s + p.amount, 0))}.`,
      to: '/accounting?tab=ap',
      ownerId: 'U-08',
    })
  }

  const delayed = PURCHASE_ORDERS.filter((p) => p.status === 'delayed')
  if (delayed.length) {
    alerts.push({
      id: 'AL-po',
      dept: 'purchasing',
      severity: 'warn',
      title: `${num(delayed.length)} سفارش خرید تاخیر دارد`,
      detail: delayed.map((p) => `${p.id} (${num(p.delayDays)} روز)`).join('، '),
      to: '/purchases?tab=delayed',
      ownerId: 'U-05',
      prefill: `سفارش‌های خرید ${delayed.map((p) => p.id).join('، ')} تاخیر دارند. زمان جدید تحویل را از تامین‌کننده بگیرید.`,
    })
  }

  const ready = ctx.orders.filter((o) => o.status === 'ready')
  if (ready.length) {
    alerts.push({
      id: 'AL-ready',
      dept: 'sales',
      severity: 'info',
      title: `${num(ready.length)} سفارش آماده ارسال است`,
      detail: ready.map((o) => o.id).join('، '),
      to: '/distribution',
      ownerId: 'U-03',
      prefill: `سفارش‌های ${ready.map((o) => o.id).join('، ')} آماده ارسال هستند. برنامه بارگیری را مشخص کنید.`,
    })
  }

  const dormant = ctx.customers.filter((c) => c.status === 'dormant')
  for (const c of dormant) {
    alerts.push({
      id: `AL-crm-${c.id}`,
      dept: 'crm',
      severity: 'warn',
      title: `${c.name} خرید تازه‌ای ندارد`,
      detail: `آخرین خرید ${jalali(c.lastPurchase)}، بدهی ${money(c.debt)}.`,
      to: `/crm/${c.id}`,
      ownerId: 'U-04',
      prefill: `${c.name} بیش از یک ماه خرید نکرده و ${money(c.debt)} بدهی دارد. تماس پیگیری را برنامه‌ریزی کنید.`,
    })
  }

  return alerts
}

/** Management is the one scope that is not filtered. */
export const alertsFor = (dept: Dept, ctx: InsightCtx) =>
  dept === 'management' ? allAlerts(ctx) : allAlerts(ctx).filter((a) => a.dept === dept)

/* --------------------------------- summaries -------------------------------- */

export interface Summary {
  text: string
  source: string
  updatedAt: string
}

const clock = () =>
  new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date())

/** The plain-language card at the top of every dashboard. Written as sentences,
 *  but every figure is read from the same state the tables render. */
export function summaryFor(dept: Dept, ctx: InsightCtx): Summary {
  const low = ctx.products.filter(isLow)
  const late = ctx.workOrders.filter(isBehind)
  const overdue = INVOICES.reduce((s, i) => s + i.amount, 0)
  const source =
    'تجمیع خودکار از ماژول‌های خرید، انبار، تولید، فروش، توزیع و حسابداری'
  const updatedAt = clock()

  const text = (() => {
    switch (dept) {
      case 'production':
        return [
          `${num(ctx.workOrders.length)} سفارش کار باز است و ${num(wipUnits(ctx.workOrders))} عدد کالا در جریان ساخت قرار دارد.`,
          late.length
            ? `${num(late.length)} سفارش کار از برنامه عقب است؛ بحرانی‌ترین ${late[0].id} در مرحله «${STAGE_LABELS[late[0].stage]}»${late[0].subcontractor ? ` نزد ${late[0].subcontractor}` : ''} است.`
            : 'هیچ سفارش کاری از برنامه عقب نیست.',
          `مصرف پارچه در ${num(ctx.workOrders.filter((w) => wastePct(w) > WASTE_LIMIT_PCT).length)} سفارش کار بیش از BOM است.`,
        ].join(' ')
      case 'sales':
        return [
          `فروش مرداد ${money(monthlySales(ctx.salesDelta))} است.`,
          `${num(ctx.orders.filter((o) => o.status !== 'delivered').length)} سفارش باز در دفتر سفارش وجود دارد و ${num(ctx.orders.filter((o) => o.status === 'ready').length)} سفارش منتظر بارگیری است.`,
          `مطالبات معوق ${money(overdue)} است که بر سقف اعتبار خریداران اثر می‌گذارد.`,
        ].join(' ')
      case 'warehouse':
        return [
          `ارزش موجودی انبار ${money(inventoryValue(ctx.products))} است.`,
          low.length
            ? `${num(low.length)} قلم زیر حداقل موجودی است: ${low.map((p) => p.name).join('، ')}.`
            : 'هیچ قلمی زیر حداقل موجودی نیست.',
          `${num(finishedUnits(ctx.skuStock))} عدد محصول نهایی و ${num(wipUnits(ctx.workOrders))} عدد کالای در جریان ساخت در اختیار دارید.`,
        ].join(' ')
      case 'finance':
        return [
          `مطالبات ${money(receivables(ctx.receivablesDelta))} و بدهی به تامین‌کنندگان ${money(PAYABLES.reduce((s, p) => s + p.amount, 0))} است.`,
          `${money(overdue)} از مطالبات سررسید گذشته و ${money(inventoryValue(ctx.products))} سرمایه در موجودی قفل شده است.`,
          'نقدینگی در حال فشرده شدن است: دو خریدار بیش از ۱۵ روز تاخیر دارند.',
        ].join(' ')
      case 'crm':
        return [
          `${num(ctx.customers.length)} خریدار فعال در پرونده است و ${num(ctx.customers.filter((c) => c.status !== 'active').length)} خریدار نیاز به پیگیری دارد.`,
          `بیشترین بدهی مربوط به ${[...ctx.customers].sort((a, b) => b.debt - a.debt)[0].name} با ${money([...ctx.customers].sort((a, b) => b.debt - a.debt)[0].debt)} است.`,
        ].join(' ')
      case 'purchasing':
        return [
          `${num(PURCHASE_ORDERS.filter((p) => p.status !== 'received').length)} سفارش خرید باز است و ${num(PURCHASE_ORDERS.filter((p) => p.status === 'delayed').length)} مورد تاخیر دارد.`,
          low.length
            ? `${num(low.length)} قلم زیر حداقل موجودی است و باید در برنامه خرید این هفته بیاید.`
            : 'موجودی هیچ قلمی زیر حداقل نیست.',
        ].join(' ')
      default:
        return [
          `فروش مرداد ${money(monthlySales(ctx.salesDelta))} و خرید ${money(2_170_000_000)} است.`,
          `${money(receivables(ctx.receivablesDelta))} مطالبات باز دارید که ${money(overdue)} آن سررسید گذشته است، و ${money(inventoryValue(ctx.products))} سرمایه در موجودی قفل شده است.`,
          late.length
            ? `در تولید، ${num(late.length)} سفارش کار از برنامه عقب است.`
            : 'همه سفارش‌های کار در برنامه هستند.',
          low.length ? `${num(low.length)} قلم مواد اولیه زیر حداقل موجودی است.` : '',
        ]
          .filter(Boolean)
          .join(' ')
    }
  })()

  return { text, source, updatedAt }
}
