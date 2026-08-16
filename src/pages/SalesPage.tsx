import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import { STATUS_LABELS, available, useDemo } from '../store/useDemo'
import { useAuth } from '../store/useAuth'
import { jalali, money, num, toman } from '../lib/format'
import type { OrderStatus } from '../types'
import {
  Badge,
  Button,
  Can,
  Card,
  CardHead,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Tabs,
  inputClass,
  useBriefLoad,
} from '../components/ui'
import { SalesOrderDrawer, STATUS_TONE } from '../components/SalesOrderDrawer'
import { PRICE_LIST, SEASON, styleOf } from '../data/garment'

type Tab = 'all' | 'pricelist' | OrderStatus

export function SalesPage() {
  const loading = useBriefLoad()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'all') as Tab
  const [openOrder, setOpenOrder] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { orders, customers } = useDemo()
  const rows = tab === 'all' || tab === 'pricelist' ? orders : orders.filter((o) => o.status === tab)

  if (loading) return <Skeleton className="h-96" />

  return (
    <>
      <PageHeader
        title="سفارش‌های فروش"
        subtitle="ثبت، پیگیری و تغییر وضعیت سفارش‌ها"
        actions={
          <Can
            permission="sales.create"
            disabled={
              <Button disabled>
                <Plus size={16} strokeWidth={1.5} />
                سفارش فروش جدید
              </Button>
            }
          >
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={1.5} />
              سفارش فروش جدید
            </Button>
          </Can>
        }
      />

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'all', label: 'همه', count: orders.length },
            { id: 'confirmed', label: STATUS_LABELS.confirmed },
            { id: 'preparing', label: STATUS_LABELS.preparing },
            { id: 'ready', label: STATUS_LABELS.ready },
            { id: 'shipped', label: STATUS_LABELS.shipped },
            { id: 'delivered', label: STATUS_LABELS.delivered },
            { id: 'pricelist', label: 'لیست قیمت' },
          ]}
        />
      </div>

      {tab === 'pricelist' ? (
        <PriceListCard />
      ) : (
      <Card>
        {rows.length ? (
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">شماره</th>
                <th className="px-4 py-2.5 text-start font-medium">مشتری</th>
                <th className="px-4 py-2.5 text-start font-medium">مبلغ</th>
                <th className="px-4 py-2.5 text-start font-medium">پرداخت</th>
                <th className="px-4 py-2.5 text-start font-medium">تاریخ تحویل</th>
                <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setOpenOrder(o.id)}
                  className={`cursor-pointer border-b border-line last:border-0 hover:bg-canvas ${o.isNew ? 'row-enter' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">{customers.find((c) => c.id === o.customerId)?.name}</td>
                  <td className="px-4 py-3 tabular-nums">{money(o.total)}</td>
                  <td className="px-4 py-3 tabular-nums">{num(o.paidPct)}٪</td>
                  <td className="px-4 py-3">{jalali(o.dueAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="سفارشی در این وضعیت وجود ندارد." />
        )}
      </Card>
      )}

      <SalesOrderDrawer orderId={openOrder} onClose={() => setOpenOrder(null)} />
      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

/** Wholesale pricing is tiered and buyer-specific — the order book is not the
 *  whole sales story without it. */
function PriceListCard() {
  return (
    <Card>
      <CardHead title={`لیست قیمت عمده — ${SEASON}`} />
      <table className="w-full text-[13px]">
        <thead className="border-b border-line bg-canvas text-ink-soft">
          <tr>
            <th className="px-4 py-2.5 text-start font-medium">مدل</th>
            <th className="px-4 py-2.5 text-start font-medium">رنگ‌بندی</th>
            <th className="px-4 py-2.5 text-start font-medium">سایزبندی</th>
            <th className="px-4 py-2.5 text-start font-medium">قیمت پایه</th>
            <th className="px-4 py-2.5 text-start font-medium">تیراژ بالا</th>
            <th className="px-4 py-2.5 text-start font-medium">قرارداد سالانه</th>
            <th className="px-4 py-2.5 text-start font-medium">حداقل سفارش</th>
          </tr>
        </thead>
        <tbody>
          {PRICE_LIST.map((row) => {
            const style = styleOf(row.styleCode)
            return (
              <tr key={row.styleCode} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {row.styleCode} — {style?.name}
                </td>
                <td className="px-4 py-3">{style?.colors.join('، ')}</td>
                <td className="px-4 py-3">{style?.sizes.join(' · ')}</td>
                <td className="px-4 py-3 tabular-nums">{toman(row.base)}</td>
                <td className="px-4 py-3 tabular-nums">{toman(row.volume)}</td>
                <td className="px-4 py-3 tabular-nums">{toman(row.contract)}</td>
                <td className="px-4 py-3 tabular-nums">{num(row.minQty)} عدد</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
        قیمت تیراژ بالا از حداقل سفارش به بالا اعمال می‌شود؛ قیمت قرارداد سالانه مخصوص
        خریداران با تعهد فصلی است.
      </p>
    </Card>
  )
}

function CreateOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { customers, products, createOrder } = useDemo()
  const actor = useAuth((s) => s.userName)

  const finished = products.filter((p) => p.kind === 'finished')
  const [customerId, setCustomerId] = useState(customers[0].id)
  const [productCode, setProductCode] = useState(finished[0].code)
  const [qty, setQty] = useState('')
  const [discount, setDiscount] = useState('0')

  const product = products.find((p) => p.code === productCode)!
  const amount = Number(qty) || 0
  const discountPct = Number(discount) || 0
  const gross = amount * product.unitPrice
  const net = Math.round(gross * (1 - discountPct / 100))
  const free = available(product)

  const error = useMemo(() => {
    if (amount > free) return `فقط ${num(free)} ${product.unit} قابل فروش موجود است.`
    if (discountPct > 30) return 'تخفیف بیش از ۳۰ درصد نیاز به تایید مدیرعامل دارد.'
    return ''
  }, [amount, free, discountPct, product.unit])

  function submit() {
    createOrder({ customerId, productCode, qty: amount, unitPrice: product.unitPrice, discountPct }, actor)
    setQty('')
    setDiscount('0')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="سفارش فروش جدید"
      footer={
        <>
          <Button variant="primary" disabled={!amount || Boolean(error)} onClick={submit}>
            ثبت سفارش
          </Button>
          <Button onClick={onClose}>انصراف</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="مشتری">
          <Select
            value={customerId}
            options={customers.map((c) => ({ value: c.id, label: c.name, hint: c.city }))}
            onChange={setCustomerId}
          />
        </Field>

        <Field label="محصول">
          <Select
            value={productCode}
            options={finished.map((p) => ({
              value: p.code,
              label: `${p.code} ${p.name}`,
              hint: `${num(available(p))} ${p.unit}`,
            }))}
            onChange={setProductCode}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={`مقدار (${product.unit})`}
            hint={`قابل فروش: ${num(free)} ${product.unit}`}
            error={error}
          >
            <input
              className={inputClass}
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Field label="تخفیف (درصد)">
            <input
              className={inputClass}
              inputMode="numeric"
              value={discount}
              onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
        </div>

        <dl className="space-y-2 rounded-[12px] bg-canvas px-4 py-3.5 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">قیمت واحد</dt>
            <dd className="tabular-nums">{toman(product.unitPrice)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">جمع اولیه</dt>
            <dd className="tabular-nums">{toman(gross)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">تخفیف</dt>
            <dd className="tabular-nums">{toman(gross - net)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>مبلغ نهایی</dt>
            <dd className="tabular-nums">{toman(net)}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  )
}
