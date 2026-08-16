import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { TODAY, WAREHOUSES } from '../data/mock'
import { STAGE_LABELS, STYLES, styleOf } from '../data/garment'
import {
  available,
  finishedUnits,
  inventoryValue,
  isLow,
  totalStock,
  useDemo,
  wipByStage,
  wipUnits,
} from '../store/useDemo'
import { useAuth } from '../store/useAuth'
import { clock, daysBetween, jalali, money, num, pct, toman } from '../lib/format'
import type { Product } from '../types'
import {
  Badge,
  Button,
  Can,
  Card,
  CardHead,
  Drawer,
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

type Tab = 'stock' | 'wip' | 'finished' | 'movements' | 'warehouses' | 'low' | 'lots'

export function InventoryPage() {
  const loading = useBriefLoad()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'stock') as Tab

  const [query, setQuery] = useState('')
  const [warehouse, setWarehouse] = useState('all')
  const [category, setCategory] = useState('all')
  const [openProduct, setOpenProduct] = useState<string | null>(null)

  const { products, movements } = useDemo()

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products])

  const rows = useMemo(
    () =>
      products.filter((p) => {
        if (tab === 'low' && !isLow(p)) return false
        if (query && !p.name.includes(query) && !p.code.includes(query.toUpperCase())) return false
        if (category !== 'all' && p.category !== category) return false
        if (warehouse !== 'all' && !p.stock.some((w) => w.warehouseId === warehouse && w.qty > 0))
          return false
        return true
      }),
    [products, tab, query, category, warehouse],
  )

  if (loading) return <Skeleton className="h-96" />

  return (
    <>
      <PageHeader title="انبار" subtitle="موجودی، گردش کالا و ظرفیت انبارها" />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="کالای پیگیری‌شده" value={num(products.length)} />
        <Metric
          label="کل موجودی"
          value={num(products.reduce((s, p) => s + totalStock(p), 0))}
          note="واحد ترکیبی"
        />
        <Metric label="کالای کم‌موجود" value={num(products.filter(isLow).length)} tone="crit" />
        <Metric label="ارزش موجودی" value={money(inventoryValue(products))} />
      </div>

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'stock', label: 'مواد اولیه و پارچه' },
            { id: 'wip', label: 'کالای در جریان ساخت' },
            { id: 'finished', label: 'محصول نهایی' },
            { id: 'movements', label: 'گردش موجودی' },
            { id: 'warehouses', label: 'انبارها' },
            { id: 'low', label: 'کالاهای کم‌موجود', count: products.filter(isLow).length },
            { id: 'lots', label: 'بچ / لات' },
          ]}
        />
      </div>

      {(tab === 'stock' || tab === 'low') && (
        <Card>
          <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
            <input
              className={`${inputClass} !h-9 w-56`}
              placeholder="جستجوی نام یا کد کالا"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="جستجوی کالا"
            />
            <Select
              aria-label="انبار"
              className="w-44"
              value={warehouse}
              options={[
                { value: 'all', label: 'همه انبارها' },
                ...WAREHOUSES.map((w) => ({ value: w.id, label: w.name })),
              ]}
              onChange={setWarehouse}
            />
            <Select
              aria-label="دسته‌بندی"
              className="w-40"
              value={category}
              options={[
                { value: 'all', label: 'همه دسته‌ها' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              onChange={setCategory}
            />
          </div>

          {rows.length ? (
            <table className="w-full text-[13px]">
              <thead className="text-ink-soft">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 text-start font-medium">کد</th>
                  <th className="px-4 py-2.5 text-start font-medium">نام کالا</th>
                  <th className="px-4 py-2.5 text-start font-medium">موجودی</th>
                  <th className="px-4 py-2.5 text-start font-medium">رزرو شده</th>
                  <th className="px-4 py-2.5 text-start font-medium">قابل فروش</th>
                  <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.code}
                    onClick={() => setOpenProduct(p.code)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas"
                  >
                    <td className="px-4 py-3 font-medium">{p.code}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {num(totalStock(p))} {p.unit}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{num(p.reserved)}</td>
                    <td className="px-4 py-3 tabular-nums">{num(available(p))}</td>
                    <td className="px-4 py-3">
                      {isLow(p) ? (
                        <Badge tone="crit">زیر حداقل</Badge>
                      ) : available(p) < p.minQty * 0.3 ? (
                        <Badge tone="warn">در آستانه</Badge>
                      ) : (
                        <Badge tone="ok">مناسب</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="کالایی با این فیلترها یافت نشد." hint="فیلترها را بازتر کنید." />
          )}
        </Card>
      )}

      {tab === 'movements' && (
        <Card>
          <CardHead title="گردش موجودی" />
          <ol className="divide-y divide-line">
            {movements.map((m) => {
              const product = products.find((p) => p.code === m.productCode)
              const sign = m.kind === 'in' ? '+' : m.kind === 'out' ? '-' : ''
              const tone = m.kind === 'in' ? 'text-ok' : m.kind === 'out' ? 'text-crit' : 'text-info'
              return (
                <li key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-14 shrink-0 text-xs text-ink-soft">{clock(m.at)}</span>
                  <span className={`w-28 shrink-0 text-[13px] font-medium tabular-nums ${tone}`}>
                    {sign}
                    {num(m.qty)} {product?.unit}
                  </span>
                  <span className="flex-1 text-[13px]">
                    {m.productCode} {product?.name}
                  </span>
                  <span className="text-[13px] text-ink-soft">{m.ref}</span>
                  <span className="w-44 shrink-0 text-xs text-ink-soft">{m.note}</span>
                </li>
              )
            })}
          </ol>
        </Card>
      )}

      {tab === 'wip' && <WipTab />}

      {tab === 'finished' && <FinishedGoodsTab />}

      {tab === 'warehouses' && <WarehousesTab />}

      {tab === 'lots' && (
        <Card>
          <CardHead title="بچ / لات" />
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">کد لات</th>
                <th className="px-4 py-2.5 text-start font-medium">کالا</th>
                <th className="px-4 py-2.5 text-start font-medium">مقدار</th>
                <th className="px-4 py-2.5 text-start font-medium">تاریخ ورود</th>
                <th className="px-4 py-2.5 text-start font-medium">تامین‌کننده</th>
              </tr>
            </thead>
            <tbody>
              {products.flatMap((p) =>
                p.lots.map((lot) => (
                  <tr key={lot.code} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{lot.code}</td>
                    <td className="px-4 py-3">
                      {p.code} {p.name}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {num(lot.qty)} {p.unit}
                    </td>
                    <td className="px-4 py-3">{jalali(lot.receivedAt)}</td>
                    <td className="px-4 py-3">{lot.supplier}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </Card>
      )}

      <ProductDrawer code={openProduct} onClose={() => setOpenProduct(null)} />
    </>
  )
}

function WarehousesTab() {
  const { products } = useDemo()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {WAREHOUSES.map((w) => {
        const held = products.filter((p) => p.stock.some((s) => s.warehouseId === w.id && s.qty > 0))
        const value = held.reduce(
          (sum, p) =>
            sum + (p.stock.find((s) => s.warehouseId === w.id)?.qty ?? 0) * p.unitPrice,
          0,
        )
        return (
          <Card key={w.id} className="px-5 py-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">{w.name}</h3>
              <span className="text-sm font-medium tabular-nums">{pct(w.capacityPct)}</span>
            </div>
            <div className="mt-3 h-2 rounded-[3px] bg-canvas">
              <div
                className={`h-full rounded-[3px] ${w.capacityPct >= 85 ? 'bg-warn' : 'bg-brand'}`}
                style={{ width: `${w.capacityPct}%` }}
              />
            </div>
            <dl className="mt-5 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">تعداد کالا</dt>
                <dd className="tabular-nums">{num(held.length)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">ارزش موجودی</dt>
                <dd className="tabular-nums">{money(value)}</dd>
              </div>
            </dl>
          </Card>
        )
      })}
    </div>
  )
}

function ProductDrawer({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { products, movements, transferStock } = useDemo()
  const actor = useAuth((s) => s.userName)
  const [transferOpen, setTransferOpen] = useState(false)

  const product = products.find((p) => p.code === code)
  if (!product) return null

  const history = movements.filter((m) => m.productCode === product.code)

  return (
    <>
      <Drawer
        open={Boolean(code)}
        onClose={onClose}
        title={`${product.code} ${product.name}`}
        subtitle={`${product.category} · ${product.color}`}
        width={520}
      >
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          {product.composition && <Spec label="ترکیب" value={product.composition} />}
          {product.widthCm && <Spec label="عرض" value={`${num(product.widthCm)} سانتی‌متر`} />}
          {product.gsm && <Spec label="وزن" value={`${num(product.gsm)} GSM`} />}
          <Spec label="واحد" value={product.unit} />
          <Spec label="قیمت واحد" value={toman(product.unitPrice)} />
          <Spec label="حداقل موجودی" value={`${num(product.minQty)} ${product.unit}`} />
        </dl>

        <h3 className="mb-3 mt-7 text-sm font-semibold">موجودی به تفکیک انبار</h3>
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {product.stock.map((s) => (
            <li key={s.warehouseId} className="flex justify-between px-4 py-2.5 text-[13px]">
              <span>{WAREHOUSES.find((w) => w.id === s.warehouseId)?.name}</span>
              <span className="tabular-nums">
                {num(s.qty)} {product.unit}
              </span>
            </li>
          ))}
          <li className="flex justify-between bg-canvas px-4 py-2.5 text-[13px] font-medium">
            <span>قابل فروش</span>
            <span className="tabular-nums">
              {num(available(product))} {product.unit}
            </span>
          </li>
        </ul>

        <Can permission="warehouse.transfer">
          <Button className="mt-4 w-full" onClick={() => setTransferOpen(true)}>
            انتقال بین انبار
          </Button>
        </Can>

        <h3 className="mb-3 mt-7 text-sm font-semibold">لات‌های موجود</h3>
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {product.lots.map((lot) => (
            <li key={lot.code} className="px-4 py-3 text-[13px]">
              <div className="flex justify-between font-medium">
                <span>{lot.code}</span>
                <span className="tabular-nums">
                  {num(lot.qty)} {product.unit}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                ورود {jalali(lot.receivedAt)} از {lot.supplier}
              </p>
            </li>
          ))}
        </ul>

        <h3 className="mb-3 mt-7 text-sm font-semibold">گردش این کالا</h3>
        {history.length ? (
          <ol className="space-y-3">
            {history.map((m) => (
              <li key={m.id} className="flex gap-3 text-[13px]">
                <span className="w-12 shrink-0 text-xs text-ink-soft">{clock(m.at)}</span>
                <span
                  className={`w-24 shrink-0 tabular-nums ${m.kind === 'in' ? 'text-ok' : m.kind === 'out' ? 'text-crit' : 'text-info'}`}
                >
                  {m.kind === 'in' ? '+' : m.kind === 'out' ? '-' : ''}
                  {num(m.qty)}
                </span>
                <span className="text-ink-soft">
                  {m.ref} {m.note}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[13px] text-ink-soft">گردشی برای این کالا ثبت نشده است.</p>
        )}
      </Drawer>

      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        product={product}
        onSubmit={(from, to, qty) => {
          transferStock(product.code, from, to, qty, actor)
          setTransferOpen(false)
        }}
      />
    </>
  )
}

function TransferModal({
  open,
  onClose,
  product,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  product: Product
  onSubmit: (from: string, to: string, qty: number) => void
}) {
  const [from, setFrom] = useState(product.stock[0]?.warehouseId ?? WAREHOUSES[0].id)
  const [to, setTo] = useState(WAREHOUSES.find((w) => w.id !== from)?.id ?? WAREHOUSES[1].id)
  const [qty, setQty] = useState('')

  const held = product.stock.find((s) => s.warehouseId === from)?.qty ?? 0
  const amount = Number(qty)
  const error =
    from === to
      ? 'انبار مبدا و مقصد نباید یکسان باشد.'
      : amount > held
        ? `حداکثر ${num(held)} ${product.unit} در این انبار موجود است.`
        : ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`انتقال ${product.code}`}
      footer={
        <>
          <Button
            variant="primary"
            disabled={!amount || Boolean(error)}
            onClick={() => onSubmit(from, to, amount)}
          >
            ثبت انتقال
          </Button>
          <Button onClick={onClose}>انصراف</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="از انبار">
          <Select
            value={from}
            options={product.stock.map((s) => ({
              value: s.warehouseId,
              label: WAREHOUSES.find((w) => w.id === s.warehouseId)?.name ?? s.warehouseId,
              hint: `${num(s.qty)} ${product.unit}`,
            }))}
            onChange={setFrom}
          />
        </Field>
        <Field label="به انبار">
          <Select
            value={to}
            options={WAREHOUSES.map((w) => ({ value: w.id, label: w.name }))}
            onChange={setTo}
          />
        </Field>
        <Field label="مقدار" hint={`موجودی انبار مبدا: ${num(held)} ${product.unit}`} error={error}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))}
          />
        </Field>
      </div>
    </Modal>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note?: string
  tone?: 'crit'
}) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-ink-soft">{label}</p>
      <p className={`mt-2 text-xl font-bold tabular-nums ${tone === 'crit' ? 'text-crit' : ''}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
    </Card>
  )
}

/** Garment inventory has three states, not one. This is the middle one: units
 *  that have left the fabric roll but are not yet finished goods. */
function WipTab() {
  const { workOrders } = useDemo()
  const stages = wipByStage(workOrders).filter((s) => s.orders > 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHead
          title="کالای در جریان ساخت به تفکیک مرحله"
          extra={<span className="text-[13px] tabular-nums">{num(wipUnits(workOrders))} عدد</span>}
        />
        <ul className="space-y-4 px-5 py-4">
          {stages.map((s) => (
            <li key={s.stage}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span>{s.label}</span>
                <span className="tabular-nums text-ink-soft">{num(s.units)} عدد</span>
              </div>
              <div className="h-2 overflow-hidden rounded-[3px] bg-canvas">
                <div
                  className="h-full rounded-[3px] bg-brand"
                  style={{ width: `${Math.round((s.units / Math.max(1, wipUnits(workOrders))) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHead title="روزهای درگیر در تولید" />
        <table className="w-full text-[13px]">
          <thead className="border-b border-line bg-canvas text-ink-soft">
            <tr>
              <th className="px-4 py-2.5 text-start font-medium">سفارش کار</th>
              <th className="px-4 py-2.5 text-start font-medium">مرحله</th>
              <th className="px-4 py-2.5 text-start font-medium">تعداد</th>
              <th className="px-4 py-2.5 text-start font-medium">روز در جریان</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w) => (
              <tr key={w.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {w.id} — {styleOf(w.styleCode)?.name}
                </td>
                <td className="px-4 py-3">{STAGE_LABELS[w.stage]}</td>
                <td className="px-4 py-3 tabular-nums">{num(w.qty)}</td>
                <td className="px-4 py-3 tabular-nums">{num(daysBetween(w.startedAt, TODAY))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

/** Finished goods are counted per style–colour–size, which is the only view a
 *  garment warehouse can actually pick from. */
function FinishedGoodsTab() {
  const { skuStock } = useDemo()

  return (
    <div className="space-y-4">
      {STYLES.map((style) => {
        const rows = style.colors
          .map((color) => ({
            color,
            sizes: style.sizes.map(
              (size) =>
                skuStock.find(
                  (r) => r.styleCode === style.code && r.color === color && r.size === size,
                )?.qty ?? 0,
            ),
          }))
          .filter((r) => r.sizes.some((q) => q > 0))
        if (!rows.length) return null

        return (
          <Card key={style.code}>
            <CardHead
              title={`${style.code} — ${style.name}`}
              extra={
                <span className="text-[13px] tabular-nums">
                  {num(finishedUnits(skuStock, style.code))} عدد
                </span>
              }
            />
            <table className="w-full text-[13px]">
              <thead className="border-b border-line bg-canvas text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 text-start font-medium">رنگ</th>
                  {style.sizes.map((s) => (
                    <th key={s} className="px-4 py-2.5 text-start font-medium">
                      {s}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-start font-medium">جمع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.color} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{r.color}</td>
                    {r.sizes.map((q, i) => (
                      <td key={i} className="px-4 py-3 tabular-nums">
                        {num(q)}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {num(r.sizes.reduce((s, q) => s + q, 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      })}
    </div>
  )
}
