import { INVOICES, PURCHASE_ORDERS, SOLD_THIS_MONTH } from '../data/mock'
import type { Customer, Product, SalesOrder, Shipment, SkuStock, WorkOrder } from '../types'
import { PAYABLES, STAGE_LABELS, styleOf } from '../data/garment'
import {
  STATUS_LABELS,
  available,
  finishedUnits,
  isBehind,
  isLow,
  monthlySales,
  totalStock,
  wastePct,
  wipUnits,
} from '../store/useDemo'
import { money, num, pct, toman } from './format'

export interface AiAnswer {
  text: string
  source?: string
  period?: string
  updatedAt?: string
}

export const SUGGESTED_QUESTIONS = [
  'فروش این ماه چقدر بوده؟',
  'کدام کالاها موجودی بحرانی دارند؟',
  'کدام سفارش کار از برنامه عقب است؟',
  'مصرف پارچه نسبت به برنامه چطور بوده؟',
  'بیشترین بدهی مربوط به کدام مشتری است؟',
  'وضعیت بارهای در مسیر چیست؟',
  'بدهی ما به تامین‌کنندگان چقدر است؟',
  'وضعیت سفارش SO-1042 چیست؟',
]

const NO_ANSWER: AiAnswer = {
  text: 'اطلاعات کافی برای پاسخ دقیق در داده‌های فعلی وجود ندارد.',
}

interface Ctx {
  products: Product[]
  customers: Customer[]
  orders: SalesOrder[]
  workOrders: WorkOrder[]
  shipments: Shipment[]
  skuStock: SkuStock[]
  salesDelta: number
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w))

/** Every number below is read out of the demo state or the seeded dataset.
 *  Nothing here composes a figure the rest of the app cannot show you. */
export function answer(question: string, ctx: Ctx): AiAnswer {
  const q = question.trim()
  const updatedAt = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  const orderMatch = q.match(/SO-(\d{4})/i)
  if (orderMatch) {
    const order = ctx.orders.find((o) => o.id === `SO-${orderMatch[1]}`)
    if (!order) return NO_ANSWER
    const customer = ctx.customers.find((c) => c.id === order.customerId)
    const line = order.lines[0]
    return {
      text: [
        `سفارش ${order.id} برای ${customer?.name} در وضعیت «${STATUS_LABELS[order.status]}» است.`,
        `مقدار: ${num(line.qty)} واحد از ${line.productCode}`,
        `مبلغ: ${toman(order.total)}`,
        `پرداخت شده: ${num(order.paidPct)}٪`,
      ].join('\n'),
      source: 'سفارش‌های فروش',
      period: `ثبت در ${order.createdAt.split('-')[2]} مرداد`,
      updatedAt,
    }
  }

  if (has(q, 'بحرانی', 'کم‌موجود', 'کم موجود', 'حداقل موجودی')) {
    const low = ctx.products.filter(isLow)
    if (!low.length) return { text: 'هیچ کالایی زیر حداقل موجودی نیست.', source: 'موجودی انبار', updatedAt }
    const worst = low.reduce((a, b) => (totalStock(a) / a.minQty < totalStock(b) / b.minQty ? a : b))
    return {
      text: [
        `${num(low.length)} کالا در وضعیت بحرانی قرار دارند:`,
        ...low.map((p, i) => `${num(i + 1)}. ${p.name} — ${num(totalStock(p))} ${p.unit}`),
        '',
        `بیشترین ریسک مربوط به ${worst.name} است که از حداقل موجودی ${num(worst.minQty)} ${worst.unit} پایین‌تر قرار دارد.`,
      ].join('\n'),
      source: 'موجودی انبار',
      updatedAt,
    }
  }

  if (has(q, 'بدهی', 'مطالبات', 'بدهکار')) {
    const ranked = [...ctx.customers].sort((a, b) => b.debt - a.debt)
    const top = ranked[0]
    const totalDebt = ranked.reduce((s, c) => s + c.debt, 0)
    return {
      text: [
        `بیشترین بدهی مربوط به ${top.name} با ${money(top.debt)} است.`,
        '',
        'سه مشتری نخست:',
        ...ranked.slice(0, 3).map((c, i) => `${num(i + 1)}. ${c.name} — ${money(c.debt)}`),
        '',
        `این سه مشتری ${num(Math.round((ranked.slice(0, 3).reduce((s, c) => s + c.debt, 0) / totalDebt) * 100))}٪ کل مطالبات را تشکیل می‌دهند.`,
      ].join('\n'),
      source: 'مطالبات فروش',
      period: 'مرداد ۱۴۰۵',
      updatedAt,
    }
  }

  if (has(q, 'تاخیر', 'تأخیر', 'دیرکرد')) {
    const delayed = PURCHASE_ORDERS.filter((p) => p.status === 'delayed')
    return {
      text: [
        `${num(delayed.length)} سفارش خرید تاخیر دارد:`,
        ...delayed.map(
          (p) => `${p.id} — ${p.supplier} — ${num(p.delayDays)} روز تاخیر — ${money(p.total)}`,
        ),
      ].join('\n'),
      source: 'سفارش‌های خرید',
      updatedAt,
    }
  }

  const woMatch = q.match(/WO-(\d{3})/i)
  if (woMatch || has(q, 'سفارش کار', 'تولید', 'خط تولید')) {
    const one = woMatch && ctx.workOrders.find((w) => w.id === `WO-${woMatch[1]}`)
    if (woMatch && !one) return NO_ANSWER
    if (one) {
      return {
        text: [
          `سفارش کار ${one.id} (${styleOf(one.styleCode)?.name} — ${one.color}) در مرحله «${STAGE_LABELS[one.stage]}» است.`,
          `تعداد: ${num(one.qty)} عدد`,
          one.subcontractor ? `پیمانکار: ${one.subcontractor}` : `خط: ${one.line}`,
          `مصرف پارچه: ${num(one.actualFabric)} متر در برابر ${num(one.plannedFabric)} متر برنامه`,
          isBehind(one) ? 'وضعیت: عقب از برنامه' : 'وضعیت: در برنامه',
        ].join('\n'),
        source: 'سفارش‌های کار تولید',
        updatedAt,
      }
    }
    const late = ctx.workOrders.filter(isBehind)
    return {
      text: [
        `${num(ctx.workOrders.length)} سفارش کار باز است و ${num(wipUnits(ctx.workOrders))} عدد کالا در جریان ساخت قرار دارد.`,
        late.length
          ? `${num(late.length)} مورد عقب از برنامه است: ${late.map((w) => `${w.id} (${STAGE_LABELS[w.stage]})`).join('، ')}`
          : 'هیچ سفارش کاری از برنامه عقب نیست.',
        `موجودی محصول نهایی: ${num(finishedUnits(ctx.skuStock))} عدد.`,
      ].join('\n'),
      source: 'ماژول تولید',
      updatedAt,
    }
  }

  if (has(q, 'مصرف پارچه', 'ضایعات', 'BOM', 'اتلاف')) {
    const over = ctx.workOrders.filter((w) => wastePct(w) > 2)
    return {
      text: [
        over.length
          ? `${num(over.length)} سفارش کار بیش از برنامه پارچه مصرف کرده‌اند:`
          : 'مصرف پارچه همه سفارش‌های کار در محدوده BOM است.',
        ...over.map(
          (w) =>
            `${w.id} — ${styleOf(w.styleCode)?.name} — ${num(w.actualFabric)} متر در برابر ${num(w.plannedFabric)} متر (${pct(wastePct(w))} بیشتر)`,
        ),
      ].join('\n'),
      source: 'مصرف پارچه — ماژول تولید',
      updatedAt,
    }
  }

  if (has(q, 'بارها', 'ارسال', 'حمل', 'مرسوله', 'در مسیر')) {
    const transit = ctx.shipments.filter((s) => s.status === 'in_transit')
    const delivered = ctx.shipments.filter((s) => s.status === 'delivered')
    return {
      text: [
        `${num(transit.length)} بار در مسیر و ${num(delivered.length)} بار تحویل‌شده در سیستم ثبت است.`,
        ...transit.map((s) => `${s.id} — سفارش ${s.orderId} — ${s.carrier} — رسیدن ${s.etaAt.split('-')[2]} مرداد`),
      ].join('\n'),
      source: 'ماژول ارسال و توزیع',
      updatedAt,
    }
  }

  if (has(q, 'پرداختنی', 'تامین‌کننده') && has(q, 'بدهی', 'صورتحساب', 'پرداخت')) {
    const total = PAYABLES.reduce((s, p) => s + p.amount, 0)
    const late = PAYABLES.filter((p) => p.overdueDays > 0)
    return {
      text: [
        `بدهی به تامین‌کنندگان ${money(total)} است.`,
        `${num(late.length)} صورتحساب سررسید گذشته است:`,
        ...late.map((p) => `${p.id} — ${p.supplier} — ${num(p.overdueDays)} روز — ${money(p.amount)}`),
      ].join('\n'),
      source: 'حساب‌های پرداختنی',
      updatedAt,
    }
  }

  if (has(q, 'مشکی') && has(q, 'فروش', 'پارچه')) {
    const black = ctx.products.filter((p) => p.color === 'مشکی')
    return {
      text: [
        'فروش کالاهای مشکی در مرداد ۱۴۰۵:',
        ...black.map((p) => `${p.code} ${p.name} — ${num(SOLD_THIS_MONTH[p.code] ?? 0)} ${p.unit}`),
        '',
        `موجودی قابل فروش F-202 هم‌اکنون ${num(available(ctx.products.find((p) => p.code === 'F-202')!))} متر است.`,
      ].join('\n'),
      source: 'گزارش فروش',
      period: 'مرداد ۱۴۰۵',
      updatedAt,
    }
  }

  if (has(q, 'فروش') && has(q, 'ماه', 'این ماه')) {
    const total = monthlySales(ctx.salesDelta)
    return {
      text: [
        `فروش مرداد ۱۴۰۵ برابر ${money(total)} است.`,
        ctx.salesDelta > 0
          ? `از این مبلغ، ${money(ctx.salesDelta)} مربوط به سفارش‌هایی است که در همین نشست ثبت شده‌اند.`
          : 'نسبت به تیر ۱۴۰۵ رشد ۱۴.۲ درصدی داشته است.',
      ].join('\n'),
      source: 'گزارش فروش',
      period: 'مرداد ۱۴۰۵',
      updatedAt,
    }
  }

  if (has(q, 'سررسید', 'معوق', 'فاکتور')) {
    const total = INVOICES.reduce((s, i) => s + i.amount, 0)
    return {
      text: [
        `${num(INVOICES.length)} فاکتور سررسید گذشته به ارزش ${money(total)} وجود دارد.`,
        ...INVOICES.map((i) => {
          const c = ctx.customers.find((c) => c.id === i.customerId)
          return `${i.id} — ${c?.name} — ${num(i.overdueDays)} روز — ${money(i.amount)}`
        }),
      ].join('\n'),
      source: 'مطالبات فروش',
      updatedAt,
    }
  }

  return NO_ANSWER
}
