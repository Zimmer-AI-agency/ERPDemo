import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { MANAGEMENT_INSIGHTS, TODAY_ACTIVITY, TODAY_SUMMARY } from '../data/mock'
import { money, num } from '../lib/format'
import { alertsFor } from '../lib/insights'
import { Badge, Button, Tabs } from './ui'
import { useDept, useInsightCtx } from './InsightCards'

type Tab = 'summary' | 'alerts' | 'activity' | 'insights'

export function InsightPanel() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<Tab>('summary')
  const dept = useDept()
  const ctx = useInsightCtx()

  if (!open)
    return (
      <aside className="hidden border-s border-line bg-surface p-2 xl:block">
        <Button variant="quiet" size="sm" onClick={() => setOpen(true)} aria-label="باز کردن پنل">
          <PanelLeftOpen size={16} strokeWidth={1.5} />
        </Button>
      </aside>
    )

  const alerts = alertsFor(dept, ctx)

  return (
    <aside className="hidden h-full flex-col overflow-y-auto border-s border-line bg-surface xl:flex">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-[13px] font-semibold">بینش لحظه‌ای</span>
        <Button variant="quiet" size="sm" onClick={() => setOpen(false)} aria-label="بستن پنل">
          <PanelLeftClose size={16} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="border-b border-line px-3 py-2.5">
        <Tabs<Tab>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'summary', label: 'خلاصه' },
            { id: 'alerts', label: 'هشدارها' },
            { id: 'activity', label: 'فعالیت‌ها' },
            { id: 'insights', label: 'بینش' },
          ]}
        />
      </div>

      <div className="flex-1 px-4 py-4">
        {tab === 'summary' && (
          <dl className="space-y-4">
            <Stat label="فروش امروز" value={money(TODAY_SUMMARY.salesToday)} />
            <Stat label="سفارش جدید" value={num(TODAY_SUMMARY.newOrders)} />
            <Stat label="ارسال امروز" value={num(TODAY_SUMMARY.shipmentsToday)} />
            <Stat label="دریافت خرید" value={num(TODAY_SUMMARY.receiptsToday)} />
          </dl>
        )}

        {tab === 'alerts' && (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-[8px] border border-line px-3 py-2.5">
                <p className="text-[13px] font-medium">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{a.detail}</p>
              </li>
            ))}
            {!alerts.length && (
              <li className="text-[13px] text-ink-soft">هشدار بازی برای این دپارتمان نیست.</li>
            )}
          </ul>
        )}

        {tab === 'activity' && (
          <ol className="space-y-4">
            {TODAY_ACTIVITY.map((a) => (
              <li key={a.at} className="flex gap-3">
                <span className="shrink-0 text-xs text-ink-soft">{a.at}</span>
                <span className="text-[13px]">{a.text}</span>
              </li>
            ))}
          </ol>
        )}

        {tab === 'insights' && (
          <ul className="space-y-3">
            {MANAGEMENT_INSIGHTS.map((text) => (
              <li key={text} className="rounded-[8px] border border-line px-3 py-3">
                <Badge tone="brand" dot={false}>بینش سیستم</Badge>
                <p className="mt-2 text-[13px] leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
