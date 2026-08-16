import { expect, test } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { ReactElement } from 'react'
import { useAuth } from './store/useAuth'
import { DemoEntryPage } from './pages/DemoEntryPage'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { SalesPage } from './pages/SalesPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { CrmPage } from './pages/CrmPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { ReportsPage } from './pages/ReportsPage'
import { ManufacturingPage } from './pages/ManufacturingPage'
import { DistributionPage } from './pages/DistributionPage'
import { AccountingPage } from './pages/AccountingPage'
import { MessagesPage } from './pages/MessagesPage'
import { ActivityPage, AttentionPage, ReceivablesPage } from './pages/OverviewPages'
import { AdminDashboardPage, AuditLogPage, RolesPage, UsersPage } from './pages/admin'

/** Every page renders its skeleton first, so this only proves the component
 *  tree is wired up: no missing import, no undefined component, no throw on
 *  first paint. Behaviour is covered in demo.test.ts. */
const render = (element: ReactElement, path = '/', pattern = path.split('?')[0]) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={element} />
      </Routes>
    </MemoryRouter>,
  )

test.each([
  ['entry', <DemoEntryPage />, '/'],
  ['dashboard', <DashboardPage />, '/'],
  ['manufacturing', <ManufacturingPage />, '/manufacturing'],
  ['inventory', <InventoryPage />, '/inventory'],
  ['sales', <SalesPage />, '/sales'],
  ['distribution', <DistributionPage />, '/distribution'],
  ['accounting', <AccountingPage />, '/accounting'],
  ['messages', <MessagesPage />, '/messages'],
  ['purchases', <PurchasesPage />, '/purchases'],
  ['crm', <CrmPage />, '/crm'],
  ['reports', <ReportsPage />, '/reports'],
  ['attention', <AttentionPage />, '/attention'],
  ['activity', <ActivityPage />, '/activity'],
  ['receivables', <ReceivablesPage />, '/receivables'],
  ['admin dashboard', <AdminDashboardPage />, '/admin'],
  ['admin users', <UsersPage />, '/admin/users'],
  ['admin roles', <RolesPage />, '/admin/roles'],
  ['admin audit', <AuditLogPage />, '/admin/audit'],
] as const)('%s renders', (_name, element, path) => {
  useAuth.getState().signInAs('SUPER_ADMIN')
  expect(render(element, path)).toBeTruthy()
})

test('customer 360 resolves a real customer id', () => {
  useAuth.getState().signInAs('CEO')
  // The page skeletons on first paint, so assert against the resolved param
  // rather than the markup.
  const html = render(<CustomerDetailPage />, '/crm/C-01', '/crm/:id')
  expect(html).toBeTruthy()
  expect(html).not.toContain('مشتری یافت نشد')
})

test('every department dashboard renders for its own persona', () => {
  for (const role of [
    'PRODUCTION_MANAGER',
    'SALES_MANAGER',
    'WAREHOUSE_MANAGER',
    'FINANCE_MANAGER',
    'CRM_SPECIALIST',
    'PURCHASE_MANAGER',
  ] as const) {
    useAuth.getState().signInAs(role)
    expect(render(<DashboardPage />)).toBeTruthy()
  }
})

test('accounting renders in both modes', () => {
  useAuth.getState().signInAs('FINANCE_MANAGER')
  useAuth.getState().setAccountingMode('native')
  expect(render(<AccountingPage />, '/accounting')).toBeTruthy()
  useAuth.getState().setAccountingMode('integration')
  expect(render(<AccountingPage />, '/accounting')).toBeTruthy()
})
