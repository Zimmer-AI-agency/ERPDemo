import { HashRouter, Navigate, Route, Routes } from 'react-router'
import type { ModuleId, Permission } from './types'
import { useAuth } from './store/useAuth'
import { AppShell } from './components/AppShell'
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
import { EmptyState, PageHeader } from './components/ui'

/** Routes are guarded by the same permission list the navigation reads and the
 *  same module selection, so a pasted URL cannot reach a module the current
 *  role has lost or the workspace never switched on. */
function Guard({
  permission,
  module,
  children,
}: {
  permission: Permission
  module?: ModuleId
  children: React.ReactNode
}) {
  const allowed = useAuth((s) => s.rolePermissions[s.role].includes(permission))
  const enabled = useAuth((s) => !module || s.modules.includes(module))

  if (allowed && enabled) return <>{children}</>
  return (
    <>
      <PageHeader title={enabled ? 'دسترسی ندارید' : 'این ماژول فعال نیست'} />
      <EmptyState
        title={
          enabled
            ? 'شما دسترسی لازم برای مشاهده این بخش را ندارید.'
            : 'این ماژول در راه‌اندازی این فضای کاری انتخاب نشده است.'
        }
        hint={
          enabled
            ? 'برای مشاهده این ماژول، از منوی پروفایل نقش دیگری را انتخاب کنید.'
            : 'برای فعال کردن آن، از دمو خارج شوید و در صفحه راه‌اندازی ماژول را انتخاب کنید.'
        }
      />
    </>
  )
}

export function App() {
  const signedIn = useAuth((s) => s.signedIn)

  return (
    <HashRouter>
      <Routes>
        {!signedIn ? (
          <>
            <Route path="/entry" element={<DemoEntryPage />} />
            <Route path="*" element={<Navigate to="/entry" replace />} />
          </>
        ) : (
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/attention" element={<AttentionPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route
              path="/manufacturing"
              element={
                <Guard permission="manufacturing.view" module="manufacturing">
                  <ManufacturingPage />
                </Guard>
              }
            />
            <Route
              path="/inventory"
              element={
                <Guard permission="warehouse.view" module="inventory">
                  <InventoryPage />
                </Guard>
              }
            />
            <Route
              path="/sales"
              element={
                <Guard permission="sales.view" module="sales">
                  <SalesPage />
                </Guard>
              }
            />
            <Route
              path="/distribution"
              element={
                <Guard permission="distribution.view" module="distribution">
                  <DistributionPage />
                </Guard>
              }
            />
            <Route
              path="/accounting"
              element={
                <Guard permission="accounting.view" module="accounting">
                  <AccountingPage />
                </Guard>
              }
            />
            <Route
              path="/receivables"
              element={
                <Guard permission="sales.view" module="sales">
                  <ReceivablesPage />
                </Guard>
              }
            />
            <Route
              path="/purchases"
              element={
                <Guard permission="purchases.view" module="purchasing">
                  <PurchasesPage />
                </Guard>
              }
            />
            <Route
              path="/crm"
              element={
                <Guard permission="crm.view" module="crm">
                  <CrmPage />
                </Guard>
              }
            />
            <Route
              path="/crm/:id"
              element={
                <Guard permission="crm.view" module="crm">
                  <CustomerDetailPage />
                </Guard>
              }
            />
            <Route
              path="/reports"
              element={
                <Guard permission="reports.view">
                  <ReportsPage />
                </Guard>
              }
            />
            <Route
              path="/messages"
              element={
                <Guard permission="messages.use">
                  <MessagesPage />
                </Guard>
              }
            />
            <Route
              path="/admin"
              element={
                <Guard permission="users.manage">
                  <AdminDashboardPage />
                </Guard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <Guard permission="users.manage">
                  <UsersPage />
                </Guard>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <Guard permission="roles.manage">
                  <RolesPage />
                </Guard>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <Guard permission="audit.view">
                  <AuditLogPage />
                </Guard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  )
}
