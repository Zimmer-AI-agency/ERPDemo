import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Truck } from 'lucide-react'
import type { ShipmentStatus } from '../types'
import { useAuth } from '../store/useAuth'
import { useDemo } from '../store/useDemo'
import { jalali, num, toman } from '../lib/format'
import {
  Badge,
  Button,
  Can,
  Card,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Skeleton,
  Tabs,
  inputClass,
  useBriefLoad,
} from '../components/ui'

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  planned: 'برنامه‌ریزی شده',
  loading: 'در حال بارگیری',
  in_transit: 'در مسیر',
  delivered: 'تحویل شده',
}

const STATUS_TONE: Record<ShipmentStatus, 'neutral' | 'warn' | 'info' | 'ok'> = {
  planned: 'neutral',
  loading: 'warn',
  in_transit: 'info',
  delivered: 'ok',
}

type Tab = 'all' | ShipmentStatus

export function DistributionPage() {
  const loading = useBriefLoad()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'all') as Tab
  const [open, setOpen] = useState<string | null>(null)

  const { shipments, customers } = useDemo()
  const rows = tab === 'all' ? shipments : shipments.filter((s) => s.status === tab)

  if (loading) return <Skeleton className="h-96" />

  return (
    <>
      <PageHeader
        title="ارسال و توزیع"
        subtitle="برنامه بارگیری، پیگیری مسیر و تایید تحویل"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="در مسیر"
          value={num(shipments.filter((s) => s.status === 'in_transit').length)}
        />
        <Tile
          label="آماده بارگیری"
          value={num(shipments.filter((s) => s.status === 'loading').length)}
        />
        <Tile
          label="تحویل شده"
          value={num(shipments.filter((s) => s.status === 'delivered').length)}
        />
        <Tile
          label="هزینه حمل ماه"
          value={toman(shipments.reduce((sum, s) => sum + s.cost, 0))}
        />
      </div>

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'all', label: 'همه', count: shipments.length },
            { id: 'planned', label: STATUS_LABELS.planned },
            { id: 'loading', label: STATUS_LABELS.loading },
            { id: 'in_transit', label: STATUS_LABELS.in_transit },
            { id: 'delivered', label: STATUS_LABELS.delivered },
          ]}
        />
      </div>

      <Card>
        {rows.length ? (
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>شماره بار</Th>
                <Th>سفارش</Th>
                <Th>خریدار</Th>
                <Th>حمل‌کننده</Th>
                <Th>کارتن / تعداد</Th>
                <Th>وضعیت</Th>
                <Th>تاریخ تحویل</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setOpen(s.id)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas"
                >
                  <Td>{s.id}</Td>
                  <Td>{s.orderId}</Td>
                  <Td>{customers.find((c) => c.id === s.customerId)?.name}</Td>
                  <Td>{s.carrier}</Td>
                  <Td>
                    {num(s.boxes)} / {num(s.units)}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                  </Td>
                  <Td>{s.pod ? jalali(s.pod.at) : jalali(s.etaAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="باری در این وضعیت نیست." />
        )}
      </Card>

      <ShipmentDrawer id={open} onClose={() => setOpen(null)} />
    </>
  )
}

function ShipmentDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { shipments, customers, orders, confirmDelivery } = useDemo()
  const actor = useAuth((s) => s.userName)
  const [signedBy, setSignedBy] = useState('')

  const shipment = shipments.find((s) => s.id === id)
  if (!shipment) return null

  const customer = customers.find((c) => c.id === shipment.customerId)
  const order = orders.find((o) => o.id === shipment.orderId)

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      title={`بار ${shipment.id}`}
      subtitle={customer?.name}
      width={520}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Meta label="سفارش فروش" value={shipment.orderId} />
        <Meta label="مبلغ سفارش" value={order ? toman(order.total) : '—'} />
        <Meta label="حمل‌کننده" value={shipment.carrier} />
        <Meta label="هزینه حمل" value={toman(shipment.cost)} />
        <Meta label="تعداد کارتن" value={`${num(shipment.boxes)} کارتن`} />
        <Meta label="تعداد کالا" value={`${num(shipment.units)} عدد`} />
        <Meta label="تاریخ بارگیری" value={jalali(shipment.shippedAt)} />
        <Meta label="زمان تخمینی رسیدن" value={jalali(shipment.etaAt)} />
      </dl>

      <h3 className="mb-2 mt-7 text-sm font-semibold">مقصد</h3>
      <p className="text-[13px] text-ink-soft">{shipment.destination}</p>

      <h3 className="mb-3 mt-7 text-sm font-semibold">رسید تحویل</h3>
      {shipment.pod ? (
        <div className="rounded-[12px] border border-line bg-ok-bg px-4 py-3.5">
          <Badge tone="ok">تحویل شده</Badge>
          <p className="mt-2 text-[13px]">تحویل‌گیرنده: {shipment.pod.by}</p>
          <p className="mt-1 text-xs text-ink-soft">تاریخ: {jalali(shipment.pod.at)}</p>
        </div>
      ) : (
        <div className="rounded-[12px] border border-line px-4 py-4">
          <Field label="نام تحویل‌گیرنده" hint="با ثبت تحویل، سفارش فروش هم بسته می‌شود.">
            <input
              className={inputClass}
              placeholder="مثلاً انبار مرکزی — آقای صادقی"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
            />
          </Field>
          <div className="mt-4">
            <Can
              permission="distribution.edit"
              disabled={
                <Button disabled className="w-full">
                  ثبت تحویل
                </Button>
              }
            >
              <Button
                variant="primary"
                className="w-full"
                disabled={!signedBy.trim()}
                onClick={() => {
                  confirmDelivery(shipment.id, signedBy.trim(), actor)
                  setSignedBy('')
                  onClose()
                }}
              >
                <Truck size={16} strokeWidth={1.5} />
                ثبت تحویل
              </Button>
            </Can>
          </div>
        </div>
      )}
    </Drawer>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
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

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-2.5 text-start font-medium">{children}</th>
)

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 tabular-nums">{children}</td>
)
