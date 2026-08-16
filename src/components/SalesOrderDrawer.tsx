import { Check } from 'lucide-react'
import { STATUS_FLOW, STATUS_LABELS, useDemo } from '../store/useDemo'
import { useAuth } from '../store/useAuth'
import { jalali, num, toman } from '../lib/format'
import { Badge, Button, Can, Drawer } from './ui'
import { styleOf } from '../data/garment'
import type { OrderStatus } from '../types'

export const STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'warn' | 'brand' | 'ok'> = {
  draft: 'neutral',
  confirmed: 'info',
  preparing: 'warn',
  ready: 'brand',
  shipped: 'info',
  delivered: 'ok',
}

export function SalesOrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { orders, customers, products, advanceOrder } = useDemo()
  const actor = useAuth((s) => s.userName)

  const order = orders.find((o) => o.id === orderId)
  if (!order) return null

  const customer = customers.find((c) => c.id === order.customerId)
  const reachedIndex = STATUS_FLOW.indexOf(order.status)
  const next = STATUS_FLOW[reachedIndex + 1]

  return (
    <Drawer
      open={Boolean(orderId)}
      onClose={onClose}
      title={`سفارش فروش ${order.id}`}
      subtitle={customer?.name}
      width={520}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Row label="مشتری" value={customer?.name ?? ''} />
        <Row label="وضعیت" value={<Badge tone={STATUS_TONE[order.status]}>{STATUS_LABELS[order.status]}</Badge>} />
        <Row label="مبلغ" value={toman(order.total)} />
        <Row label="پرداخت" value={`${num(order.paidPct)}٪ پرداخت شده`} />
        <Row label="تاریخ ثبت" value={jalali(order.createdAt)} />
        <Row label="تاریخ تحویل" value={jalali(order.dueAt)} />
      </dl>

      <h3 className="mb-3 mt-7 text-sm font-semibold">اقلام سفارش</h3>
      <div className="overflow-hidden rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead className="bg-canvas text-ink-soft">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">کالا</th>
              <th className="px-3 py-2.5 text-start font-medium">مقدار</th>
              <th className="px-3 py-2.5 text-start font-medium">قیمت واحد</th>
              <th className="px-3 py-2.5 text-start font-medium">تخفیف</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => {
              const product = products.find((p) => p.code === line.productCode)
              return (
                <tr key={line.productCode} className="border-t border-line">
                  <td className="px-3 py-2.5">
                    {line.productCode} {product?.name ?? styleOf(line.productCode)?.name}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {num(line.qty)} {product?.unit ?? 'عدد'}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{toman(line.unitPrice)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{num(line.discountPct)}٪</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {order.lines
        .filter((line) => line.sizeCurve)
        .map((line) => (
          <div key={`curve-${line.productCode}`}>
            <h3 className="mb-3 mt-7 text-sm font-semibold">
              سایزبندی {styleOf(line.styleCode ?? '')?.name} — {line.color}
            </h3>
            <div className="overflow-hidden rounded-[12px] border border-line">
              <table className="w-full text-[13px]">
                <thead className="bg-canvas text-ink-soft">
                  <tr>
                    {Object.keys(line.sizeCurve!).map((s) => (
                      <th key={s} className="px-3 py-2.5 text-start font-medium">
                        {s}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-start font-medium">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-line">
                    {Object.values(line.sizeCurve!).map((q, i) => (
                      <td key={i} className="px-3 py-2.5 tabular-nums">
                        {num(q)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 font-medium tabular-nums">{num(line.qty)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

      <h3 className="mb-3 mt-7 text-sm font-semibold">مسیر سفارش</h3>
      <ol className="space-y-0">
        {STATUS_FLOW.map((status, i) => {
          const done = i <= reachedIndex
          return (
            <li key={status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full ${
                    done ? 'bg-brand text-white' : 'border border-line bg-surface'
                  }`}
                >
                  {done && <Check size={12} strokeWidth={2.5} />}
                </span>
                {i < STATUS_FLOW.length - 1 && (
                  <span className={`w-px flex-1 ${i < reachedIndex ? 'bg-brand' : 'bg-line'}`} />
                )}
              </div>
              <span className={`pb-5 text-[13px] ${done ? 'font-medium' : 'text-ink-soft'}`}>
                {STATUS_LABELS[status]}
              </span>
            </li>
          )
        })}
      </ol>

      {next && (
        <Can
          permission="sales.edit"
          disabled={
            <Button disabled className="w-full">
              انتقال به «{STATUS_LABELS[next]}»
            </Button>
          }
        >
          <Button
            variant="primary"
            className="w-full"
            onClick={() => advanceOrder(order.id, actor)}
          >
            انتقال به «{STATUS_LABELS[next]}»
          </Button>
        </Can>
      )}
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}
