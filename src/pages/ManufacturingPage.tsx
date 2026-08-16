import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, Factory } from 'lucide-react'

import {
  PRODUCTION_LINES,
  SEASON,
  STAGE_FLOW,
  STAGE_LABELS,
  STYLES,
  SUBCONTRACTORS,
  fabricFor,
  styleOf,
} from '../data/garment'
import { useAuth } from '../store/useAuth'
import { isBehind, useDemo, wastePct, wipByStage, wipUnits } from '../store/useDemo'
import { WASTE_LIMIT_PCT } from '../lib/insights'
import { dec, jalali, num, pct, toman } from '../lib/format'
import {
  Badge,
  Button,
  Can,
  Card,
  CardHead,
  Drawer,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
  Tabs,
  useBriefLoad,
} from '../components/ui'

type Tab = 'orders' | 'stages' | 'bom' | 'consumption' | 'subcontractors'

export function ManufacturingPage() {
  const loading = useBriefLoad()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'orders') as Tab
  const [open, setOpen] = useState<string | null>(null)
  const [styleCode, setStyleCode] = useState(STYLES[0].code)

  const { workOrders, products } = useDemo()
  const style = styleOf(styleCode)!

  if (loading) return <Skeleton className="h-96" />

  return (
    <>
      <PageHeader
        title="تولید"
        subtitle={`${SEASON} · ${num(workOrders.length)} سفارش کار باز روی ${num(PRODUCTION_LINES.length)} خط`}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="کالای در جریان ساخت" value={`${num(wipUnits(workOrders))} عدد`} />
        <Tile label="سفارش کار باز" value={num(workOrders.length)} />
        <Tile
          label="عقب از برنامه"
          value={num(workOrders.filter(isBehind).length)}
          tone={workOrders.some(isBehind) ? 'crit' : 'ok'}
        />
        <Tile
          label="مصرف پارچه بیش از BOM"
          value={num(workOrders.filter((w) => wastePct(w) > WASTE_LIMIT_PCT).length)}
          tone={workOrders.some((w) => wastePct(w) > WASTE_LIMIT_PCT) ? 'warn' : 'ok'}
        />
      </div>

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'orders', label: 'سفارش‌های کار' },
            { id: 'stages', label: 'وضعیت خط' },
            { id: 'bom', label: 'BOM مدل' },
            { id: 'consumption', label: 'مصرف پارچه' },
            { id: 'subcontractors', label: 'پیمانکاران' },
          ]}
        />
      </div>

      {tab === 'orders' && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>شماره</Th>
                <Th>مدل</Th>
                <Th>رنگ</Th>
                <Th>تعداد</Th>
                <Th>مرحله</Th>
                <Th>خط / پیمانکار</Th>
                <Th>مهلت</Th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => setOpen(w.id)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas"
                >
                  <Td>{w.id}</Td>
                  <Td>{styleOf(w.styleCode)?.name}</Td>
                  <Td>{w.color}</Td>
                  <Td>{num(w.qty)}</Td>
                  <Td>
                    <Badge tone={w.stage === 'packing' ? 'ok' : 'info'}>
                      {STAGE_LABELS[w.stage]}
                    </Badge>
                  </Td>
                  <Td>{w.subcontractor ?? w.line}</Td>
                  <Td>
                    {isBehind(w) ? (
                      <Badge tone="crit">{jalali(w.dueAt)} — عقب</Badge>
                    ) : (
                      jalali(w.dueAt)
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'stages' && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold">کالای در جریان ساخت به تفکیک مرحله</h2>
          <ul className="mt-4 space-y-3">
            {wipByStage(workOrders).map((s) => (
              <li key={s.stage}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-ink-soft">
                    {num(s.units)} عدد · {num(s.orders)} سفارش کار
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-[3px] bg-canvas">
                  <div
                    className="h-full rounded-[3px] bg-brand"
                    style={{
                      width: `${Math.round((s.units / Math.max(1, wipUnits(workOrders) + 1)) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'bom' && (
        <Card>
          <CardHead
            title={`ساختار مواد ${style.name}`}
            extra={
              <Select
                aria-label="انتخاب مدل"
                size="sm"
                className="w-56"
                value={styleCode}
                options={STYLES.map((s) => ({ value: s.code, label: `${s.code} — ${s.name}` }))}
                onChange={setStyleCode}
              />
            }
          />
          <dl className="grid gap-4 px-5 py-4 sm:grid-cols-3">
            <Meta label="فصل" value={style.season} />
            <Meta label="رنگ‌بندی" value={style.colors.join('، ')} />
            <Meta label="سایزبندی" value={style.sizes.join(' · ')} />
            <Meta label="مصرف پارچه مجاز" value={`${dec(style.fabricPerUnit)} متر در هر عدد`} />
            <Meta label="قیمت پایه" value={toman(style.unitPrice)} />
          </dl>
          <table className="w-full border-t border-line text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>قلم</Th>
                <Th>مقدار در هر عدد</Th>
                <Th>موجودی فعلی</Th>
                <Th>توضیح</Th>
              </tr>
            </thead>
            <tbody>
              {style.bom.map((line) => {
                const item = products.find((p) => p.code === line.itemCode)
                return (
                  <tr key={line.itemCode} className="border-b border-line last:border-0">
                    <Td>
                      {line.itemCode} — {item?.name}
                    </Td>
                    <Td>
                      {dec(line.qty)} {line.unit}
                    </Td>
                    <Td>
                      {num(item?.stock.reduce((s, w) => s + w.qty, 0) ?? 0)} {item?.unit}
                    </Td>
                    <Td>{line.note ?? '—'}</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'consumption' && (
        <Card>
          <CardHead title="مصرف پارچه: برنامه در برابر واقعی" />
          <table className="w-full text-[13px]">
            <thead className="border-b border-line bg-canvas text-ink-soft">
              <tr>
                <Th>سفارش کار</Th>
                <Th>پارچه</Th>
                <Th>برنامه (متر)</Th>
                <Th>واقعی (متر)</Th>
                <Th>انحراف</Th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => {
                const delta = wastePct(w)
                return (
                  <tr key={w.id} className="border-b border-line last:border-0">
                    <Td>
                      {w.id} — {styleOf(w.styleCode)?.name}
                    </Td>
                    <Td>{fabricFor(w.styleCode, w.color)}</Td>
                    <Td>{num(w.plannedFabric)}</Td>
                    <Td>{num(w.actualFabric)}</Td>
                    <Td>
                      <Badge tone={delta > WASTE_LIMIT_PCT ? 'warn' : 'ok'}>
                        {delta >= 0 ? '+' : '−'}
                        {pct(delta)}
                      </Badge>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            آستانه هشدار {pct(WASTE_LIMIT_PCT)} است. انحراف مثبت یعنی مصرف بیش از BOM.
          </p>
        </Card>
      )}

      {tab === 'subcontractors' && (
        <div className="grid gap-4 md:grid-cols-2">
          {SUBCONTRACTORS.map((s) => {
            const orders = workOrders.filter((w) => w.subcontractor === s.name)
            return (
              <Card key={s.name} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{s.name}</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                      {s.stage} · {s.city}
                    </p>
                  </div>
                  <Badge tone={s.onTimePct >= 90 ? 'ok' : 'warn'}>
                    {pct(s.onTimePct)} تحویل به‌موقع
                  </Badge>
                </div>
                <ul className="mt-4 space-y-2">
                  {orders.length ? (
                    orders.map((w) => (
                      <li
                        key={w.id}
                        className="flex items-center justify-between rounded-[8px] bg-canvas px-3 py-2 text-[13px]"
                      >
                        <span>
                          {w.id} — {styleOf(w.styleCode)?.name}
                        </span>
                        <span className={isBehind(w) ? 'text-crit' : 'text-ink-soft'}>
                          {isBehind(w) ? 'عقب از برنامه' : jalali(w.dueAt)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[13px] text-ink-soft">کاری در جریان نیست.</li>
                  )}
                </ul>
              </Card>
            )
          })}
        </div>
      )}

      <WorkOrderDrawer id={open} onClose={() => setOpen(null)} />
    </>
  )
}

function WorkOrderDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { workOrders, advanceWorkOrder } = useDemo()
  const actor = useAuth((s) => s.userName)
  const wo = workOrders.find((w) => w.id === id)
  if (!wo) return null

  const style = styleOf(wo.styleCode)
  const reached = STAGE_FLOW.indexOf(wo.stage)
  const next = STAGE_FLOW[reached + 1]
  const delta = wastePct(wo)

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      title={`سفارش کار ${wo.id}`}
      subtitle={`${style?.name} · ${wo.color}`}
      width={520}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Meta label="مدل" value={`${wo.styleCode} — ${style?.name}`} />
        <Meta label="تعداد" value={`${num(wo.qty)} عدد`} />
        <Meta label="خط تولید" value={wo.line} />
        <Meta label="پیمانکار" value={wo.subcontractor ?? 'ندارد — تولید داخلی'} />
        <Meta label="شروع" value={jalali(wo.startedAt)} />
        <Meta
          label="مهلت"
          value={isBehind(wo) ? `${jalali(wo.dueAt)} (عقب از برنامه)` : jalali(wo.dueAt)}
        />
      </dl>

      <h3 className="mb-3 mt-7 text-sm font-semibold">سایزبندی</h3>
      <div className="overflow-hidden rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead className="bg-canvas text-ink-soft">
            <tr>
              {Object.keys(wo.sizeCurve).map((s) => (
                <th key={s} className="px-3 py-2.5 text-start font-medium">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              {Object.values(wo.sizeCurve).map((q, i) => (
                <td key={i} className="px-3 py-2.5 tabular-nums">
                  {num(q)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="mb-3 mt-7 text-sm font-semibold">مصرف پارچه</h3>
      <div className="rounded-[12px] border border-line px-4 py-3.5 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">برنامه (BOM)</span>
          <span className="tabular-nums">
            {num(wo.plannedFabric)} متر {fabricFor(wo.styleCode, wo.color)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-ink-soft">مصرف واقعی</span>
          <span className="tabular-nums">{num(wo.actualFabric)} متر</span>
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <Badge tone={delta > WASTE_LIMIT_PCT ? 'warn' : 'ok'}>
            {delta >= 0 ? 'مصرف بیشتر از برنامه' : 'مصرف کمتر از برنامه'} — {pct(delta)}
          </Badge>
        </div>
      </div>

      <h3 className="mb-3 mt-7 text-sm font-semibold">مراحل تولید</h3>
      <ol className="space-y-0">
        {STAGE_FLOW.map((stage, i) => {
          const done = i <= reached
          return (
            <li key={stage} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full ${
                    done ? 'bg-brand text-white' : 'border border-line bg-surface'
                  }`}
                >
                  {done && <Check size={12} strokeWidth={2.5} />}
                </span>
                {i < STAGE_FLOW.length - 1 && (
                  <span className={`w-px flex-1 ${i < reached ? 'bg-brand' : 'bg-line'}`} />
                )}
              </div>
              <span className={`pb-5 text-[13px] ${done ? 'font-medium' : 'text-ink-soft'}`}>
                {STAGE_LABELS[stage]}
                {stage === wo.stage && wo.subcontractor && (
                  <span className="ms-2 text-xs text-ink-soft">نزد {wo.subcontractor}</span>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      {next ? (
        <Can
          permission="manufacturing.edit"
          disabled={
            <Button disabled className="w-full">
              انتقال به «{STAGE_LABELS[next]}»
            </Button>
          }
        >
          <Button
            variant="primary"
            className="w-full"
            onClick={() => advanceWorkOrder(wo.id, actor)}
          >
            <Factory size={16} strokeWidth={1.5} />
            انتقال به «{STAGE_LABELS[next]}»
          </Button>
        </Can>
      ) : (
        <EmptyState
          title="این سفارش کار بسته‌بندی شده است."
          hint="کالا به موجودی محصول نهایی اضافه شده است."
        />
      )}
    </Drawer>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'crit' }) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-xs text-ink-soft">{label}</p>
      <p
        className={`mt-1.5 text-xl font-semibold tabular-nums ${
          tone === 'crit' ? 'text-crit' : tone === 'warn' ? 'text-warn' : ''
        }`}
      >
        {value}
      </p>
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
