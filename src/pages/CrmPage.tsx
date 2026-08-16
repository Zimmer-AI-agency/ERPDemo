import { Link, useSearchParams } from 'react-router'
import { LEADS } from '../data/mock'
import { useDemo } from '../store/useDemo'
import { daysBetween, jalali, money, num } from '../lib/format'
import { TODAY } from '../data/mock'
import {
  Badge,
  Card,
  CardHead,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
  useBriefLoad,
} from '../components/ui'

type Tab = 'customers' | 'leads' | 'followups'

const STAGE_LABELS = {
  new: 'جدید',
  contacted: 'تماس گرفته شده',
  quoted: 'پیش‌فاکتور',
  won: 'موفق',
  lost: 'ناموفق',
}

export function CrmPage() {
  const loading = useBriefLoad()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'customers') as Tab
  const { customers } = useDemo()

  if (loading) return <Skeleton className="h-96" />

  const needsFollowUp = customers.filter(
    (c) => c.status !== 'active' || daysBetween(c.lastPurchase, TODAY) > 30,
  )

  return (
    <>
      <PageHeader title="مدیریت ارتباط با مشتریان" subtitle="پرونده مشتری، سرنخ‌ها و پیگیری‌ها" />

      <div className="mb-4">
        <Tabs<Tab>
          active={tab}
          onChange={(id) => setParams({ tab: id })}
          tabs={[
            { id: 'customers', label: 'مشتریان', count: customers.length },
            { id: 'leads', label: 'سرنخ‌ها', count: LEADS.length },
            { id: 'followups', label: 'پیگیری‌ها', count: needsFollowUp.length },
          ]}
        />
      </div>

      {tab === 'customers' && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">مشتری</th>
                <th className="px-4 py-2.5 text-start font-medium">شهر</th>
                <th className="px-4 py-2.5 text-start font-medium">فروش کل</th>
                <th className="px-4 py-2.5 text-start font-medium">بدهی</th>
                <th className="px-4 py-2.5 text-start font-medium">آخرین خرید</th>
                <th className="px-4 py-2.5 text-start font-medium">مسئول فروش</th>
                <th className="px-4 py-2.5 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/crm/${c.id}`} className="hover:text-brand">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3 tabular-nums">{money(c.totalSales)}</td>
                  <td className="px-4 py-3 tabular-nums">{money(c.debt)}</td>
                  <td className="px-4 py-3">{jalali(c.lastPurchase)}</td>
                  <td className="px-4 py-3">{c.rep}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={c.status === 'active' ? 'ok' : c.status === 'watch' ? 'warn' : 'crit'}
                    >
                      {c.status === 'active' ? 'فعال' : c.status === 'watch' ? 'مراقبت' : 'راکد'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'leads' && (
        <Card>
          <table className="w-full text-[13px]">
            <thead className="text-ink-soft">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-start font-medium">سرنخ</th>
                <th className="px-4 py-2.5 text-start font-medium">شهر</th>
                <th className="px-4 py-2.5 text-start font-medium">منبع</th>
                <th className="px-4 py-2.5 text-start font-medium">ارزش تخمینی</th>
                <th className="px-4 py-2.5 text-start font-medium">مسئول</th>
                <th className="px-4 py-2.5 text-start font-medium">مرحله</th>
              </tr>
            </thead>
            <tbody>
              {LEADS.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3">{l.city}</td>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3 tabular-nums">{money(l.value)}</td>
                  <td className="px-4 py-3">{l.owner}</td>
                  <td className="px-4 py-3">
                    <Badge tone={l.stage === 'won' ? 'ok' : l.stage === 'lost' ? 'crit' : 'brand'}>
                      {STAGE_LABELS[l.stage]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'followups' && (
        <Card>
          <CardHead title="مشتریان نیازمند پیگیری" />
          {needsFollowUp.length ? (
            <ul className="divide-y divide-line">
              {needsFollowUp.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <Link to={`/crm/${c.id}`} className="text-sm font-medium hover:text-brand">
                    {c.name}
                  </Link>
                  <span className="text-[13px] text-ink-soft">
                    {num(daysBetween(c.lastPurchase, TODAY))} روز از آخرین خرید
                  </span>
                  <span className="ms-auto text-[13px] tabular-nums">بدهی {money(c.debt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="همه مشتریان به‌روز هستند." />
          )}
        </Card>
      )}
    </>
  )
}
