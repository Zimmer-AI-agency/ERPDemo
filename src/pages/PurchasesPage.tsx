import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PURCHASE_ORDERS, SUPPLIERS } from '../data/mock'
import { isLow, totalStock, useDemo } from '../store/useDemo'
import { jalali, money, num, toman } from '../lib/format'
import type { PurchaseStatus } from '../types'
import {
  Badge,
  Card,
  Drawer,
  CardHead,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
  useBriefLoad,
} from '../components/ui'

type Tab = 'orders' | 'suppliers' | 'delayed' | 'advice'

const PO_LABELS: Record<PurchaseStatus, string> = {
  pending: 'در انتظار',
  in_transit: 'در مسیر',
  received: 'دریافت شده',
  delayed: 'تاخیر',
}

const PO_TONES: Record<PurchaseStatus, 'neutral' | 'info' | 'ok' | 'crit'> = {
  pending: 'neutral',
  in_transit: 'info',
  received: 'ok',
  delayed: 'crit',
}

export function PurchasesPage() {
  const loading = useBriefLoad()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'orders') as Tab
  const [open, setOpen] = useState<string | null>(null)
  const { products } = useDemo()

  if (loading) return <Skeleton className="h-96" />

  const rows = tab === 'delayed' ? PURCHASE_ORDERS.filter((p) => p.status === 'delayed') : PURCHASE_ORDERS
  const lowProducts = products.filter(isLow)

  return (
    <>
      <PageHeader title="خرید" subtitle="سفارش‌های خرید، تامین‌کنندگان و پیشنهاد تامین" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="تعهد خرید باز"
          value={money(
            PURCHASE_ORDERS.filter((p) => p.status !== 'received').reduce((s, p) => s + p.total, 0),
          )}
          note={`${num(PURCHASE_ORDERS.filter((p) => p.status !== 'received').length)} سفارش باز`}
        />
        <Tile
          label="در مسیر"
          value={money(
            PURCHASE_ORDERS.filter((p) => p.status === 'in_transit').reduce((s, p) => s + p.total, 0),
          )}
        />
        <Tile
          label="تاخیردار"
          value={num(PURCHASE_ORDERS.filter((p) => p.status === 'delayed').length)}
          note="نیازمند پیگیری تامین‌کننده"
        />
        <Tile label="تامین‌کننده فعال" value={num(SUPPLIERS.length)} />
      </div>

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'orders', label: 'سفارش‌های خرید', count: PURCHASE_ORDERS.length },
            { id: 'suppliers', label: 'تامین‌کنندگان' },
            {
              id: 'delayed',
              label: 'تاخیرها',
              count: PURCHASE_ORDERS.filter((p) => p.status === 'delayed').length,
            },
            { id: 'advice', label: 'پیشنهاد خرید', count: lowProducts.length },
          ]}
        />
      </div>

      {(tab === 'orders' || tab === 'delayed') && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">شماره</th>
                <th className="px-4 py-2.5 text-start font-medium">تامین‌کننده</th>
                <th className="px-4 py-2.5 text-start font-medium">کالا</th>
                <th className="px-4 py-2.5 text-start font-medium">مبلغ</th>
                <th className="px-4 py-2.5 text-start font-medium">تاریخ تحویل</th>
                <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const product = products.find((x) => x.code === p.productCode)
                return (
                  <tr
                    key={p.id}
                    onClick={() => setOpen(p.id)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas"
                  >
                    <td className="px-4 py-3 font-medium">{p.id}</td>
                    <td className="px-4 py-3">{p.supplier}</td>
                    <td className="px-4 py-3">
                      {num(p.qty)} {product?.unit} {product?.name}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{money(p.total)}</td>
                    <td className="px-4 py-3">{jalali(p.expectedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PO_TONES[p.status]}>
                        {PO_LABELS[p.status]}
                        {p.delayDays > 0 && ` ${num(p.delayDays)} روز`}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <PurchaseOrderDrawer id={open} onClose={() => setOpen(null)} />

      {tab === 'suppliers' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SUPPLIERS.map((s) => (
            <Card key={s.name} className="px-5 py-5">
              <h3 className="text-sm font-semibold">{s.name}</h3>
              <p className="mt-1 text-xs text-ink-soft">{s.city}</p>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">سفارش باز</dt>
                  <dd className="tabular-nums">{num(s.openOrders)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">خرید کل</dt>
                  <dd className="tabular-nums">{money(s.totalPurchases)}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}

      {tab === 'advice' && (
        <Card>
          <CardHead
            title="پیشنهاد خرید"
            extra={
              <span className="text-xs text-ink-soft">
                بر پایه حداقل موجودی و سفارش‌های در مسیر
              </span>
            }
          />
          {lowProducts.length ? (
            <ul className="divide-y divide-line">
              {lowProducts.map((p) => {
                const stock = totalStock(p)
                const inbound = PURCHASE_ORDERS.filter(
                  (po) => po.productCode === p.code && po.status !== 'received',
                ).reduce((s, po) => s + po.qty, 0)
                // Refill to double the minimum, then subtract whatever is
                // already on its way.
                const suggested = Math.max(0, p.minQty * 2 - stock - inbound)
                return (
                  <li key={p.code} className="grid gap-3 px-5 py-4 sm:grid-cols-5 sm:items-center">
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{p.code}</p>
                    </div>
                    <Cell label="موجودی" value={`${num(stock)} ${p.unit}`} tone="crit" />
                    <Cell label="حداقل" value={`${num(p.minQty)} ${p.unit}`} />
                    <Cell
                      label="پیشنهاد سفارش"
                      value={suggested ? `${num(suggested)} ${p.unit}` : 'در مسیر است'}
                      tone="brand"
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState title="هیچ کالایی نیازمند تامین فوری نیست." />
          )}
        </Card>
      )}
    </>
  )
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'crit' | 'brand' }) {
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <p
        className={`mt-0.5 text-[13px] font-medium tabular-nums ${
          tone === 'crit' ? 'text-crit' : tone === 'brand' ? 'text-brand-ink' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function PurchaseOrderDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { products, movements } = useDemo()
  const po = PURCHASE_ORDERS.find((p) => p.id === id)
  if (!po) return null

  const product = products.find((p) => p.code === po.productCode)
  const receipts = movements.filter((m) => m.ref === po.id)

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      title={`سفارش خرید ${po.id}`}
      subtitle={po.supplier}
      width={480}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Meta label="تامین‌کننده" value={po.supplier} />
        <Meta
          label="وضعیت"
          value={`${PO_LABELS[po.status]}${po.delayDays ? ` — ${num(po.delayDays)} روز تاخیر` : ''}`}
        />
        <Meta label="قلم" value={`${po.productCode} — ${product?.name ?? ''}`} />
        <Meta label="مقدار" value={`${num(po.qty)} ${product?.unit ?? ''}`} />
        <Meta label="مبلغ" value={toman(po.total)} />
        <Meta label="قیمت واحد" value={toman(Math.round(po.total / po.qty))} />
        <Meta label="تاریخ تحویل" value={jalali(po.expectedAt)} />
        <Meta
          label="موجودی فعلی این قلم"
          value={`${num(product ? totalStock(product) : 0)} ${product?.unit ?? ''}`}
        />
      </dl>

      <h3 className="mb-3 mt-7 text-sm font-semibold">رسیدهای انبار</h3>
      {receipts.length ? (
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {receipts.map((m) => (
            <li key={m.id} className="flex justify-between px-4 py-3 text-[13px]">
              <span>{m.note}</span>
              <span className="tabular-nums">
                {num(m.qty)} {product?.unit}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="هنوز رسید انباری برای این سفارش ثبت نشده است." />
      )}
    </Drawer>
  )
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
    </Card>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}
