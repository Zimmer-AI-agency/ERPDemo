import { create } from 'zustand'
import type {
  AuditEntry,
  Conversation,
  Customer,
  DemoUser,
  Movement,
  Notification,
  OrderStatus,
  Product,
  SalesOrder,
  Shipment,
  SkuStock,
  Stage,
  WorkOrder,
} from '../types'
import {
  AUDIT_LOG,
  CUSTOMERS,
  MONTHLY,
  MOVEMENTS,
  NOTIFICATIONS,
  PRODUCTS,
  SALES_ORDERS,
  TODAY,
  USERS,
} from '../data/mock'
import {
  MANAGER_CONTACTS,
  SEED_CONVERSATIONS,
  SHIPMENTS,
  SKU_STOCK,
  STAGE_FLOW,
  STAGE_LABELS,
  WORK_ORDERS,
  fabricFor,
  styleOf,
} from '../data/garment'
import { money, num } from '../lib/format'

export type Period = '6m' | '12m' | 'year'

/** Aggregates that describe the whole company, not the tracked subset shown in
 *  the tables. Kept apart so nothing derived ever gets confused with them. */
export const COMPANY = {
  monthlyPurchases: 2_170_000_000,
  activeCustomers: 127,
  newCustomersThisMonth: 12,
  salesChangePct: 14.2,
  purchaseChangePct: -3.1,
}

export const STATUS_FLOW: OrderStatus[] = [
  'draft',
  'confirmed',
  'preparing',
  'ready',
  'shipped',
  'delivered',
]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'پیش‌نویس',
  confirmed: 'تایید شده',
  preparing: 'در حال آماده‌سازی',
  ready: 'آماده ارسال',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
}

interface NewOrderInput {
  customerId: string
  productCode: string
  qty: number
  unitPrice: number
  discountPct: number
}

interface DemoState {
  period: Period
  products: Product[]
  orders: SalesOrder[]
  customers: Customer[]
  movements: Movement[]
  notifications: Notification[]
  auditLog: AuditEntry[]
  users: DemoUser[]
  workOrders: WorkOrder[]
  skuStock: SkuStock[]
  shipments: Shipment[]
  conversations: Conversation[]
  dismissedAlerts: string[]
  /** Sales booked during this demo session, added on top of the seeded month. */
  salesDelta: number
  receivablesDelta: number
  toast: string | null

  setPeriod: (p: Period) => void
  setToast: (t: string | null) => void
  createOrder: (input: NewOrderInput, actor: string) => string
  advanceOrder: (orderId: string, actor: string) => void
  transferStock: (productCode: string, from: string, to: string, qty: number, actor: string) => void
  advanceWorkOrder: (workOrderId: string, actor: string) => void
  confirmDelivery: (shipmentId: string, signedBy: string, actor: string) => void
  sendMessage: (contactId: string, text: string) => void
  dismissAlert: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  addUser: (user: Omit<DemoUser, 'id' | 'active' | 'lastSeen'>, actor: string) => void
  logAudit: (entry: Omit<AuditEntry, 'id'>) => void
}

let sequence = 1048

const now = () =>
  new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date())

export const useDemo = create<DemoState>((set, get) => ({
  period: '12m',
  products: structuredClone(PRODUCTS),
  orders: structuredClone(SALES_ORDERS),
  customers: structuredClone(CUSTOMERS),
  movements: structuredClone(MOVEMENTS),
  notifications: structuredClone(NOTIFICATIONS),
  auditLog: structuredClone(AUDIT_LOG),
  users: structuredClone(USERS),
  workOrders: structuredClone(WORK_ORDERS),
  skuStock: structuredClone(SKU_STOCK),
  shipments: structuredClone(SHIPMENTS),
  conversations: structuredClone(SEED_CONVERSATIONS),
  dismissedAlerts: [],
  salesDelta: 0,
  receivablesDelta: 0,
  toast: null,

  setPeriod: (period) => set({ period }),
  setToast: (toast) => set({ toast }),

  logAudit: (entry) =>
    set((s) => ({ auditLog: [{ id: `A-${Date.now()}`, ...entry }, ...s.auditLog] })),

  /** One action, six consequences. This is the demo's whole argument: the
   *  modules are not separate spreadsheets. */
  createOrder: ({ customerId, productCode, qty, unitPrice, discountPct }, actor) => {
    const id = `SO-${++sequence}`
    const total = Math.round(qty * unitPrice * (1 - discountPct / 100))
    const customer = get().customers.find((c) => c.id === customerId)!

    set((s) => ({
      orders: [
        {
          id,
          customerId,
          lines: [{ productCode, qty, unitPrice, discountPct }],
          total,
          paidPct: 0,
          status: 'confirmed',
          createdAt: TODAY,
          dueAt: TODAY,
          isNew: true,
        },
        ...s.orders,
      ],

      // Confirming an order reserves stock. It only leaves the warehouse when
      // the order ships, which is what advanceOrder() handles.
      products: s.products.map((p) =>
        p.code === productCode ? { ...p, reserved: p.reserved + qty } : p,
      ),

      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              orderCount: c.orderCount + 1,
              totalSales: c.totalSales + total,
              debt: c.debt + total,
              lastPurchase: TODAY,
              timeline: [{ at: TODAY, text: `سفارش ${id} ثبت شد.` }, ...c.timeline],
            }
          : c,
      ),

      notifications: [
        {
          id: `N-${Date.now()}`,
          text: `سفارش ${id} برای ${customer.name} ثبت شد.`,
          ago: 'هم‌اکنون',
          severity: 'info',
          read: false,
        },
        ...s.notifications,
      ],

      auditLog: [
        {
          id: `A-${Date.now()}`,
          at: now(),
          user: actor,
          action: 'ایجاد سفارش',
          module: 'فروش',
          detail: `${id} به مبلغ ${money(total)} ایجاد شد`,
        },
        ...s.auditLog,
      ],

      salesDelta: s.salesDelta + total,
      receivablesDelta: s.receivablesDelta + total,
      toast: `سفارش ${id} با موفقیت ثبت شد.`,
    }))

    return id
  },

  advanceOrder: (orderId, actor) => {
    const order = get().orders.find((o) => o.id === orderId)
    if (!order) return
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
    if (!next) return

    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: next } : o)),
      auditLog: [
        {
          id: `A-${Date.now()}`,
          at: now(),
          user: actor,
          action: 'تغییر وضعیت سفارش',
          module: 'فروش',
          detail: `${orderId} به «${STATUS_LABELS[next]}» تغییر کرد`,
        },
        ...s.auditLog,
      ],
      toast: `وضعیت ${orderId} به «${STATUS_LABELS[next]}» تغییر کرد.`,
    }))

    // Shipping is the moment goods physically leave: release the reservation
    // and take the quantity out of the warehouses.
    if (next !== 'shipped') return
    const customer = get().customers.find((c) => c.id === order.customerId)

    set((s) => ({
      products: s.products.map((p) => {
        const line = order.lines.find((l) => l.productCode === p.code)
        if (!line) return p
        let remaining = line.qty
        const stock = p.stock.map((w) => {
          const take = Math.min(w.qty, remaining)
          remaining -= take
          return { ...w, qty: w.qty - take }
        })
        return { ...p, stock, reserved: Math.max(0, p.reserved - line.qty) }
      }),
      movements: [
        ...order.lines.map((line, i) => ({
          id: `MV-${Date.now()}-${i}`,
          at: `${TODAY} ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          productCode: line.productCode,
          kind: 'out' as const,
          qty: line.qty,
          ref: orderId,
          note: customer?.name ?? '',
        })),
        ...s.movements,
      ],
    }))
  },

  transferStock: (productCode, from, to, qty, actor) =>
    set((s) => ({
      products: s.products.map((p) =>
        p.code === productCode
          ? {
              ...p,
              stock: p.stock.map((w) =>
                w.warehouseId === from
                  ? { ...w, qty: w.qty - qty }
                  : w.warehouseId === to
                    ? { ...w, qty: w.qty + qty }
                    : w,
              ),
            }
          : p,
      ),
      movements: [
        {
          id: `MV-${Date.now()}`,
          at: `${TODAY} ${now()}`,
          productCode,
          kind: 'transfer',
          qty,
          ref: `TR-${Math.floor(Date.now() / 1000) % 1000}`,
          note: 'انتقال داخلی',
        },
        ...s.movements,
      ],
      auditLog: [
        {
          id: `A-${Date.now()}`,
          at: now(),
          user: actor,
          action: 'انتقال موجودی',
          module: 'انبار',
          detail: `${num(qty)} واحد ${productCode} منتقل شد`,
        },
        ...s.auditLog,
      ],
      toast: `${num(qty)} واحد ${productCode} منتقل شد.`,
    })),

  /** Production is wired to the warehouse at both ends: leaving the cutting
   *  room eats fabric, reaching packing puts finished garments on the shelf. */
  advanceWorkOrder: (workOrderId, actor) => {
    const wo = get().workOrders.find((w) => w.id === workOrderId)
    if (!wo) return
    const next = STAGE_FLOW[STAGE_FLOW.indexOf(wo.stage) + 1] as Stage | undefined
    if (!next) return
    const style = styleOf(wo.styleCode)
    const fabric = fabricFor(wo.styleCode, wo.color)
    const at = `${TODAY} ${now()}`

    set((s) => ({
      workOrders: s.workOrders.map((w) => (w.id === workOrderId ? { ...w, stage: next } : w)),

      // Cutting is where the fabric physically goes.
      products:
        wo.stage === 'cutting'
          ? s.products.map((p) => {
              if (p.code !== fabric) return p
              let remaining = wo.plannedFabric
              return {
                ...p,
                stock: p.stock.map((w) => {
                  const take = Math.min(w.qty, remaining)
                  remaining -= take
                  return { ...w, qty: w.qty - take }
                }),
              }
            })
          : s.products,

      // Packing is where finished goods appear, size by size.
      skuStock:
        next === 'packing'
          ? Object.entries(wo.sizeCurve).reduce((rows, [size, qty]) => {
              const i = rows.findIndex(
                (r) => r.styleCode === wo.styleCode && r.color === wo.color && r.size === size,
              )
              if (i === -1) return [...rows, { styleCode: wo.styleCode, color: wo.color, size, qty }]
              return rows.map((r, j) => (j === i ? { ...r, qty: r.qty + qty } : r))
            }, s.skuStock)
          : s.skuStock,

      movements:
        wo.stage === 'cutting'
          ? [
              {
                id: `MV-${Date.now()}`,
                at,
                productCode: fabric,
                kind: 'out' as const,
                qty: wo.plannedFabric,
                ref: wo.id,
                note: `برش ${style?.name ?? wo.styleCode}`,
              },
              ...s.movements,
            ]
          : s.movements,

      notifications:
        next === 'packing'
          ? [
              {
                id: `N-${Date.now()}`,
                text: `${num(wo.qty)} عدد ${style?.name ?? wo.styleCode} از ${wo.id} به موجودی محصول نهایی اضافه شد.`,
                ago: 'هم‌اکنون',
                severity: 'info' as const,
                read: false,
              },
              ...s.notifications,
            ]
          : s.notifications,

      auditLog: [
        {
          id: `A-${Date.now()}`,
          at: now(),
          user: actor,
          action: 'تغییر مرحله تولید',
          module: 'تولید',
          detail: `${wo.id} به مرحله «${STAGE_LABELS[next]}» منتقل شد`,
        },
        ...s.auditLog,
      ],
      toast: `${wo.id} به مرحله «${STAGE_LABELS[next]}» رفت.`,
    }))
  },

  /** Confirming receipt closes the sales order too — the buyer's order is not
   *  finished until the goods are signed for. */
  confirmDelivery: (shipmentId, signedBy, actor) => {
    const shipment = get().shipments.find((sh) => sh.id === shipmentId)
    if (!shipment || shipment.status === 'delivered') return

    set((s) => ({
      shipments: s.shipments.map((sh) =>
        sh.id === shipmentId
          ? { ...sh, status: 'delivered' as const, pod: { by: signedBy, at: TODAY } }
          : sh,
      ),
      orders: s.orders.map((o) =>
        o.id === shipment.orderId ? { ...o, status: 'delivered' as const } : o,
      ),
      notifications: [
        {
          id: `N-${Date.now()}`,
          text: `بار ${shipment.id} تحویل شد و سفارش ${shipment.orderId} بسته شد.`,
          ago: 'هم‌اکنون',
          severity: 'info',
          read: false,
        },
        ...s.notifications,
      ],
      auditLog: [
        {
          id: `A-${Date.now()}`,
          at: now(),
          user: actor,
          action: 'تایید تحویل بار',
          module: 'توزیع',
          detail: `${shipment.id} توسط ${signedBy} تحویل گرفته شد`,
        },
        ...s.auditLog,
      ],
      toast: `تحویل ${shipment.id} ثبت شد.`,
    }))
  },

  sendMessage: (contactId, text) =>
    set((s) => {
      const message = { id: `M-${Date.now()}`, from: 'me', text, at: now() }
      const exists = s.conversations.some((c) => c.contactId === contactId)
      return {
        conversations: exists
          ? s.conversations.map((c) =>
              c.contactId === contactId ? { ...c, messages: [...c.messages, message] } : c,
            )
          : [...s.conversations, { id: `CV-${Date.now()}`, contactId, messages: [message] }],
        toast: `پیام برای ${MANAGER_CONTACTS.find((m) => m.id === contactId)?.name ?? 'همکار'} ارسال شد.`,
      }
    }),

  dismissAlert: (id) => set((s) => ({ dismissedAlerts: [...s.dismissedAlerts, id] })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  addUser: (user, actor) =>
    set((s) => ({
      users: [
        { id: `U-${Date.now()}`, active: true, lastSeen: 'هرگز', ...user },
        ...s.users,
      ],
      auditLog: [
        {
          id: `A-${Date.now()}`,
          at: now(),
          user: actor,
          action: 'ایجاد کاربر',
          module: 'کاربران',
          detail: `${user.name} با نقش ${user.role} ایجاد شد`,
        },
        ...s.auditLog,
      ],
      toast: `کاربر ${user.name} ایجاد شد.`,
    })),
}))

/* ---------------------------------- derived --------------------------------- */

export const totalStock = (p: Product) => p.stock.reduce((sum, w) => sum + w.qty, 0)
export const available = (p: Product) => totalStock(p) - p.reserved
export const isLow = (p: Product) => totalStock(p) < p.minQty

export const inventoryValue = (products: Product[]) =>
  products.reduce((sum, p) => sum + totalStock(p) * p.unitPrice, 0)

export const monthlySales = (salesDelta: number) => MONTHLY[MONTHLY.length - 1].sales + salesDelta

export const receivables = (delta: number) => 890_000_000 + delta

/* --------------------------- derived: manufacturing -------------------------- */

/** Anything not yet packed is still work in progress. */
export const wipUnits = (workOrders: WorkOrder[]) =>
  workOrders.filter((w) => w.stage !== 'packing').reduce((sum, w) => sum + w.qty, 0)

export const wipByStage = (workOrders: WorkOrder[]) =>
  STAGE_FLOW.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    units: workOrders.filter((w) => w.stage === stage).reduce((sum, w) => sum + w.qty, 0),
    orders: workOrders.filter((w) => w.stage === stage).length,
  }))

/** Positive means the run ate more fabric than the BOM allowed. */
export const wastePct = (w: WorkOrder) =>
  ((w.actualFabric - w.plannedFabric) / w.plannedFabric) * 100

/** Jalali dates are stored as sortable strings, so a plain compare is enough. */
export const isBehind = (w: WorkOrder) => w.dueAt < TODAY && w.stage !== 'packing'

export const finishedUnits = (rows: SkuStock[], styleCode?: string, color?: string) =>
  rows
    .filter((r) => (!styleCode || r.styleCode === styleCode) && (!color || r.color === color))
    .reduce((sum, r) => sum + r.qty, 0)

export const seriesFor = (period: Period) =>
  period === '6m' ? MONTHLY.slice(-6) : period === 'year' ? MONTHLY.slice(-5) : MONTHLY
