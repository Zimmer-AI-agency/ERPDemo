import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MessageSquare, Sparkles, X } from 'lucide-react'
import type { Alert, Dept } from '../types'
import { MANAGER_CONTACTS } from '../data/garment'
import { DEPT_LABELS, ROLE_DEPT } from '../data/rbac'
import { useAuth } from '../store/useAuth'
import { useDemo } from '../store/useDemo'
import { alertsFor, summaryFor, type InsightCtx } from '../lib/insights'
import { Badge, Button, Card, CardHead, EmptyState, Modal, inputClass } from './ui'
import { num } from '../lib/format'

/** Everything the AI layer reads. Pulled once per render from live state so a
 *  card written before an order was created cannot go stale. */
export function useInsightCtx(): InsightCtx {
  const {
    products,
    orders,
    customers,
    workOrders,
    skuStock,
    shipments,
    salesDelta,
    receivablesDelta,
  } = useDemo()
  return { products, orders, customers, workOrders, skuStock, shipments, salesDelta, receivablesDelta }
}

export const useDept = (): Dept => useAuth((s) => ROLE_DEPT[s.role])

/** The plain-language summary that opens every dashboard. */
export function AiSummaryCard() {
  const dept = useDept()
  const ctx = useInsightCtx()
  const summary = summaryFor(dept, ctx)

  return (
    <Card className="border-brand-tint bg-brand-tint p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white">
          <Sparkles size={16} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">
              خلاصه هوش مصنوعی — {DEPT_LABELS[dept]}
            </h2>
            <Badge tone="brand" dot={false}>تولید خودکار</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed">{summary.text}</p>
          <p className="mt-3 text-xs text-ink-soft">
            منبع: {summary.source} · به‌روزرسانی {summary.updatedAt}
          </p>
        </div>
      </div>
    </Card>
  )
}

const SEVERITY: Record<Alert['severity'], string> = {
  crit: 'bg-crit',
  warn: 'bg-warn',
  info: 'bg-info',
}

/** Department-scoped, dismissible, and every alert that has an owner can be
 *  handed to that manager as a pre-filled message without leaving the page. */
export function AlertsPanel() {
  const navigate = useNavigate()
  const dept = useDept()
  const ctx = useInsightCtx()
  const { dismissedAlerts, dismissAlert, sendMessage } = useDemo()
  const canMessage = useAuth((s) => s.rolePermissions[s.role].includes('messages.use'))
  const [handoff, setHandoff] = useState<Alert | null>(null)
  const [draft, setDraft] = useState('')

  const alerts = alertsFor(dept, ctx).filter((a) => !dismissedAlerts.includes(a.id))

  function openHandoff(alert: Alert) {
    setHandoff(alert)
    setDraft(alert.prefill ?? alert.title)
  }

  function send() {
    if (!handoff?.ownerId) return
    sendMessage(handoff.ownerId, draft)
    setHandoff(null)
    navigate('/messages')
  }

  const owner = MANAGER_CONTACTS.find((m) => m.id === handoff?.ownerId)

  return (
    <Card>
      <CardHead
        title={dept === 'management' ? 'هشدارهای شرکت' : `هشدارهای ${DEPT_LABELS[dept]}`}
        extra={
          <Badge tone={alerts.length ? 'crit' : 'ok'}>
            {alerts.length ? `${num(alerts.length)} هشدار باز` : 'بدون هشدار'}
          </Badge>
        }
      />
      {!alerts.length ? (
        <EmptyState title="هیچ هشدار بازی وجود ندارد." hint="آستانه‌ها لحظه‌ای از داده ماژول‌ها محاسبه می‌شوند." />
      ) : (
        <ul className="divide-y divide-line">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 size-2 shrink-0 rounded-[2px] ${SEVERITY[a.severity]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{a.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.to && (
                    <Button variant="quiet" size="sm" onClick={() => navigate(a.to!)}>
                      باز کردن
                    </Button>
                  )}
                  {a.ownerId && canMessage && (
                    <Button variant="quiet" size="sm" onClick={() => openHandoff(a)}>
                      <MessageSquare size={14} strokeWidth={1.5} />
                      اطلاع به مسئول
                    </Button>
                  )}
                </div>
              </div>
              <Button
                variant="quiet"
                size="sm"
                aria-label="بستن هشدار"
                onClick={() => dismissAlert(a.id)}
              >
                <X size={14} strokeWidth={1.5} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(handoff)}
        onClose={() => setHandoff(null)}
        title={`پیام به ${owner?.name ?? ''}`}
        footer={
          <>
            <Button variant="primary" onClick={send} disabled={!draft.trim()}>
              ارسال پیام
            </Button>
            <Button onClick={() => setHandoff(null)}>انصراف</Button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-ink-soft">
          {owner?.title} · {owner && DEPT_LABELS[owner.dept]}
        </p>
        <textarea
          className={`${inputClass} h-32 py-2.5 leading-relaxed`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <p className="mt-2 text-xs text-ink-soft">
          متن از روی هشدار پر شده است. می‌توانید پیش از ارسال ویرایش کنید.
        </p>
      </Modal>
    </Card>
  )
}

/** The one deliberate future-phase callout in the demo. */
export function AiNextCard() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">گام بعدی هوش مصنوعی</h2>
        <Badge tone="brand" dot={false}>فاز بعدی</Badge>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        خلاصه‌ها و هشدارهای بالا هم‌اکنون فعال هستند. آنچه در فازهای بعد اضافه می‌شود:
        پیش‌بینی تقاضا بر پایه فصل و سابقه خرید، سفارش خودکار مواد اولیه هنگام رسیدن به نقطه
        سفارش، و تحلیل سودآوری هر مدل به‌صورت خودکار.
      </p>
    </Card>
  )
}
