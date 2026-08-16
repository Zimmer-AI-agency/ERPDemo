import type {
  Conversation,
  LedgerEntry,
  ManagerContact,
  Payable,
  Shipment,
  SkuStock,
  Style,
  WorkOrder,
} from '../types'
import { ROLE_DEPT } from './rbac'
import { USERS } from './mock'

/** The seeded company. Vertically integrated: it knits and dyes its own fabric
 *  (the F-/Y-/D- items) and cuts-and-sews three styles this season from it. */
export const COMPANY_NAME = 'پوشاک مهرآذین'
export const SEASON = 'پاییز ۱۴۰۵'
export const PRODUCTION_LINES = ['خط ۱ — دوخت سنگین', 'خط ۲ — دوخت تریکو']

export const STYLES: Style[] = [
  {
    code: 'ST-204',
    name: 'مانتو اداری زنانه',
    season: SEASON,
    colors: ['مشکی', 'سرمه‌ای'],
    sizes: ['۳۶', '۳۸', '۴۰', '۴۲', '۴۴', '۴۶'],
    unitPrice: 1_450_000,
    fabricPerUnit: 2.4,
    bom: [
      { itemCode: 'F-202', qty: 2.4, unit: 'متر', note: 'رنگ مشکی؛ برای سرمه‌ای از F-203' },
      { itemCode: 'T-101', qty: 6, unit: 'عدد', note: 'دکمه جلو و سرآستین' },
      { itemCode: 'T-103', qty: 2, unit: 'عدد', note: 'لیبل برند و سایز' },
    ],
  },
  {
    code: 'ST-311',
    name: 'تی‌شرت آستین کوتاه',
    season: SEASON,
    colors: ['سفید', 'مشکی'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    unitPrice: 320_000,
    fabricPerUnit: 1.15,
    bom: [
      { itemCode: 'F-201', qty: 1.15, unit: 'متر', note: 'رنگ سفید؛ برای مشکی از F-202' },
      { itemCode: 'F-401', qty: 0.12, unit: 'متر', note: 'ریب یقه' },
      { itemCode: 'T-103', qty: 2, unit: 'عدد' },
    ],
  },
  {
    code: 'ST-408',
    name: 'هودی زیپ‌دار',
    season: SEASON,
    colors: ['مشکی', 'سفید'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    unitPrice: 780_000,
    fabricPerUnit: 2.35,
    bom: [
      { itemCode: 'F-301', qty: 2.35, unit: 'متر' },
      { itemCode: 'T-102', qty: 1, unit: 'عدد', note: 'زیپ ۶۰ سانتی' },
      { itemCode: 'T-103', qty: 2, unit: 'عدد' },
    ],
  },
]

export const styleOf = (code: string) => STYLES.find((s) => s.code === code)

/** Which fabric a run actually eats. The BOM names the default; the dark and
 *  navy colourways pull a different bolt, which is noted on the BOM line. */
export function fabricFor(styleCode: string, color: string) {
  if (styleCode === 'ST-204') return color === 'سرمه‌ای' ? 'F-203' : 'F-202'
  if (styleCode === 'ST-311') return color === 'مشکی' ? 'F-202' : 'F-201'
  return styleOf(styleCode)?.bom[0].itemCode ?? ''
}

export const STAGE_FLOW = ['cutting', 'sewing', 'embroidery', 'finishing', 'qc', 'packing'] as const

export const STAGE_LABELS: Record<(typeof STAGE_FLOW)[number], string> = {
  cutting: 'برش',
  sewing: 'دوخت',
  embroidery: 'گلدوزی',
  finishing: 'تکمیل',
  qc: 'کنترل کیفیت',
  packing: 'بسته‌بندی',
}

/** Five open work orders on two lines, one of them at a subcontractor and past
 *  its date — that one drives the "behind schedule" alert. */
export const WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-055',
    styleCode: 'ST-204',
    color: 'مشکی',
    qty: 480,
    sizeCurve: { '۳۶': 40, '۳۸': 90, '۴۰': 120, '۴۲': 120, '۴۴': 70, '۴۶': 40 },
    stage: 'sewing',
    startedAt: '1405-05-18',
    dueAt: '1405-06-05',
    line: PRODUCTION_LINES[0],
    plannedFabric: 1_152,
    actualFabric: 1_188,
    orderId: 'SO-1048',
  },
  {
    id: 'WO-054',
    styleCode: 'ST-311',
    color: 'سفید',
    qty: 1_200,
    sizeCurve: { S: 150, M: 300, L: 350, XL: 250, XXL: 150 },
    stage: 'cutting',
    startedAt: '1405-05-24',
    dueAt: '1405-06-08',
    line: PRODUCTION_LINES[1],
    plannedFabric: 1_380,
    actualFabric: 1_362,
    orderId: 'SO-1047',
  },
  {
    id: 'WO-053',
    styleCode: 'ST-408',
    color: 'مشکی',
    qty: 300,
    sizeCurve: { S: 30, M: 80, L: 90, XL: 70, XXL: 30 },
    stage: 'embroidery',
    startedAt: '1405-05-12',
    dueAt: '1405-05-22',
    line: PRODUCTION_LINES[1],
    subcontractor: 'گلدوزی صنعتی رها',
    plannedFabric: 705,
    actualFabric: 712,
  },
  {
    id: 'WO-052',
    styleCode: 'ST-204',
    color: 'سرمه‌ای',
    qty: 260,
    sizeCurve: { '۳۶': 20, '۳۸': 50, '۴۰': 65, '۴۲': 65, '۴۴': 40, '۴۶': 20 },
    stage: 'qc',
    startedAt: '1405-05-08',
    dueAt: '1405-05-26',
    line: PRODUCTION_LINES[0],
    plannedFabric: 624,
    actualFabric: 617,
  },
  {
    id: 'WO-051',
    styleCode: 'ST-311',
    color: 'مشکی',
    qty: 900,
    sizeCurve: { S: 110, M: 230, L: 260, XL: 190, XXL: 110 },
    stage: 'packing',
    startedAt: '1405-05-04',
    dueAt: '1405-05-26',
    line: PRODUCTION_LINES[1],
    subcontractor: 'شست‌وشوی صنعتی نوید',
    plannedFabric: 1_035,
    actualFabric: 1_041,
  },
]

export const SUBCONTRACTORS = [
  {
    name: 'گلدوزی صنعتی رها',
    stage: 'گلدوزی',
    city: 'تهران',
    openOrders: 1,
    onTimePct: 72,
  },
  {
    name: 'شست‌وشوی صنعتی نوید',
    stage: 'شست‌وشو',
    city: 'کرج',
    openOrders: 1,
    onTimePct: 94,
  },
]

/** Finished goods, held per style–colour–size. */
export const SKU_STOCK: SkuStock[] = [
  { styleCode: 'ST-204', color: 'مشکی', size: '۳۶', qty: 22 },
  { styleCode: 'ST-204', color: 'مشکی', size: '۳۸', qty: 48 },
  { styleCode: 'ST-204', color: 'مشکی', size: '۴۰', qty: 64 },
  { styleCode: 'ST-204', color: 'مشکی', size: '۴۲', qty: 57 },
  { styleCode: 'ST-204', color: 'مشکی', size: '۴۴', qty: 31 },
  { styleCode: 'ST-204', color: 'مشکی', size: '۴۶', qty: 18 },
  { styleCode: 'ST-204', color: 'سرمه‌ای', size: '۳۶', qty: 14 },
  { styleCode: 'ST-204', color: 'سرمه‌ای', size: '۳۸', qty: 30 },
  { styleCode: 'ST-204', color: 'سرمه‌ای', size: '۴۰', qty: 41 },
  { styleCode: 'ST-204', color: 'سرمه‌ای', size: '۴۲', qty: 38 },
  { styleCode: 'ST-204', color: 'سرمه‌ای', size: '۴۴', qty: 19 },
  { styleCode: 'ST-204', color: 'سرمه‌ای', size: '۴۶', qty: 11 },
  { styleCode: 'ST-311', color: 'سفید', size: 'S', qty: 180 },
  { styleCode: 'ST-311', color: 'سفید', size: 'M', qty: 340 },
  { styleCode: 'ST-311', color: 'سفید', size: 'L', qty: 410 },
  { styleCode: 'ST-311', color: 'سفید', size: 'XL', qty: 290 },
  { styleCode: 'ST-311', color: 'سفید', size: 'XXL', qty: 160 },
  { styleCode: 'ST-311', color: 'مشکی', size: 'S', qty: 90 },
  { styleCode: 'ST-311', color: 'مشکی', size: 'M', qty: 210 },
  { styleCode: 'ST-311', color: 'مشکی', size: 'L', qty: 260 },
  { styleCode: 'ST-311', color: 'مشکی', size: 'XL', qty: 180 },
  { styleCode: 'ST-311', color: 'مشکی', size: 'XXL', qty: 95 },
  { styleCode: 'ST-408', color: 'مشکی', size: 'S', qty: 24 },
  { styleCode: 'ST-408', color: 'مشکی', size: 'M', qty: 58 },
  { styleCode: 'ST-408', color: 'مشکی', size: 'L', qty: 66 },
  { styleCode: 'ST-408', color: 'مشکی', size: 'XL', qty: 50 },
  { styleCode: 'ST-408', color: 'مشکی', size: 'XXL', qty: 22 },
]

/** Buyer-specific pricing: wholesale is tiered, and one buyer has a negotiated
 *  rate. The sales order form reads the base column. */
export const PRICE_LIST = [
  { styleCode: 'ST-204', base: 1_450_000, volume: 1_378_000, contract: 1_305_000, minQty: 120 },
  { styleCode: 'ST-311', base: 320_000, volume: 298_000, contract: 284_000, minQty: 300 },
  { styleCode: 'ST-408', base: 780_000, volume: 741_000, contract: 702_000, minQty: 150 },
]

export const SHIPMENTS: Shipment[] = [
  {
    id: 'SH-207',
    orderId: 'SO-1047',
    customerId: 'C-05',
    carrier: 'باربری آسیا ترابر',
    destination: 'مشهد — انبار مرکزی اطلس پوشاک',
    boxes: 30,
    units: 900,
    cost: 9_600_000,
    status: 'planned',
    shippedAt: '1405-06-01',
    etaAt: '1405-06-03',
  },
  {
    id: 'SH-206',
    orderId: 'SO-1044',
    customerId: 'C-05',
    carrier: 'باربری آسیا ترابر',
    destination: 'مشهد — انبار مرکزی اطلس پوشاک',
    boxes: 14,
    units: 1_600,
    cost: 7_400_000,
    status: 'loading',
    shippedAt: '1405-05-26',
    etaAt: '1405-05-29',
  },
  {
    id: 'SH-205',
    orderId: 'SO-1043',
    customerId: 'C-03',
    carrier: 'حمل و نقل پارسیان',
    destination: 'تهران — بازار بزرگ، پارچه تهران',
    boxes: 26,
    units: 3_200,
    cost: 5_800_000,
    status: 'in_transit',
    shippedAt: '1405-05-24',
    etaAt: '1405-05-27',
  },
  {
    id: 'SH-204',
    orderId: 'SO-1046',
    customerId: 'C-01',
    carrier: 'پیک بار تهران',
    destination: 'تهران — نساجی پارس',
    boxes: 12,
    units: 300,
    cost: 4_200_000,
    status: 'delivered',
    shippedAt: '1405-05-21',
    etaAt: '1405-05-23',
    pod: { by: 'انبار مرکزی نساجی پارس — آقای صادقی', at: '1405-05-23' },
  },
  {
    id: 'SH-203',
    orderId: 'SO-1041',
    customerId: 'C-02',
    carrier: 'حمل و نقل پارسیان',
    destination: 'تهران — پوشاک آریا',
    boxes: 18,
    units: 2_050,
    cost: 5_100_000,
    status: 'delivered',
    shippedAt: '1405-05-18',
    etaAt: '1405-05-20',
    pod: { by: 'دفتر مرکزی پوشاک آریا — خانم نیک‌پور', at: '1405-05-20' },
  },
]

/* -------------------------------- accounting -------------------------------- */

/** Supplier invoices. The purchasing module raised every one of these. */
export const PAYABLES: Payable[] = [
  { id: 'AP-118', supplier: 'نخ سپید فارس', amount: 462_000_000, dueAt: '1405-06-02', overdueDays: 0 },
  { id: 'AP-115', supplier: 'الیاف کاشان', amount: 348_000_000, dueAt: '1405-05-20', overdueDays: 5 },
  { id: 'AP-112', supplier: 'شیمی رنگ البرز', amount: 176_000_000, dueAt: '1405-05-12', overdueDays: 13 },
  { id: 'AP-109', supplier: 'رنگرزی مهرگان', amount: 84_000_000, dueAt: '1405-04-28', overdueDays: 27 },
  { id: 'AP-104', supplier: 'گلدوزی صنعتی رها', amount: 46_000_000, dueAt: '1405-05-05', overdueDays: 20 },
]

/** Journal lines posted automatically by the other modules. Every entry names
 *  the module that raised it, which is the whole point of native mode. */
export const LEDGER: LedgerEntry[] = [
  {
    id: 'JV-1042',
    at: '1405-05-25',
    ref: 'SO-1047',
    account: 'حساب‌های دریافتنی / درآمد فروش',
    module: 'فروش',
    debit: 288_000_000,
    credit: 288_000_000,
  },
  {
    id: 'JV-1041',
    at: '1405-05-24',
    ref: 'SH-205',
    account: 'هزینه حمل و توزیع / بانک',
    module: 'توزیع',
    debit: 5_800_000,
    credit: 5_800_000,
  },
  {
    id: 'JV-1040',
    at: '1405-05-24',
    ref: 'WO-054',
    account: 'کالای در جریان ساخت / موجودی مواد اولیه',
    module: 'تولید',
    debit: 74_970_000,
    credit: 74_970_000,
  },
  {
    id: 'JV-1039',
    at: '1405-05-23',
    ref: 'INV-882',
    account: 'بانک / حساب‌های دریافتنی',
    module: 'مالی',
    debit: 48_000_000,
    credit: 48_000_000,
  },
  {
    id: 'JV-1038',
    at: '1405-05-22',
    ref: 'PO-312',
    account: 'موجودی مواد اولیه / حساب‌های پرداختنی',
    module: 'خرید',
    debit: 462_000_000,
    credit: 462_000_000,
  },
  {
    id: 'JV-1037',
    at: '1405-05-21',
    ref: 'SO-1046',
    account: 'بهای تمام‌شده کالای فروش‌رفته / موجودی محصول',
    module: 'فروش',
    debit: 141_000_000,
    credit: 141_000_000,
  },
  {
    id: 'JV-1036',
    at: '1405-05-20',
    ref: 'WO-051',
    account: 'موجودی محصول نهایی / کالای در جریان ساخت',
    module: 'تولید',
    debit: 96_400_000,
    credit: 96_400_000,
  },
]

/** Integration mode. Same role Almas plays for the Rezaei account. */
export const EXTERNAL_ACCOUNTING = {
  name: 'الماس',
  status: 'متصل' as const,
  lastSyncedAt: 'امروز، ۱۴:۲۲',
  mappedAccounts: 42,
  syncedDocsThisMonth: 318,
  failedDocs: 0,
  direction: 'یک‌طرفه — زیمر ارسال می‌کند، الماس مرجع باقی می‌ماند',
}

/* --------------------------------- messaging -------------------------------- */

export const MANAGER_CONTACTS: ManagerContact[] = USERS.filter((u) => u.active).map((u) => ({
  id: u.id,
  name: u.name,
  title: u.title,
  dept: ROLE_DEPT[u.role],
  role: u.role,
  online: u.lastSeen.includes('دقیقه'),
  lastActive: u.lastSeen,
}))

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'CV-01',
    contactId: 'U-03',
    messages: [
      {
        id: 'M-01',
        from: 'علی محمدی',
        text: 'پارچه مشکی F-202 برای سفارش کار WO-055 فقط تا آخر هفته کفاف می‌دهد.',
        at: '۰۹:۴۰',
      },
      {
        id: 'M-02',
        from: 'me',
        text: 'با خرید هماهنگ می‌کنم. PO-312 در راه است؟',
        at: '۰۹:۵۲',
      },
      { id: 'M-03', from: 'علی محمدی', text: 'بله، رسید ورود امروز ثبت می‌شود.', at: '۱۰:۰۵' },
    ],
  },
  {
    id: 'CV-02',
    contactId: 'U-05',
    messages: [
      {
        id: 'M-04',
        from: 'رضا کریمی',
        text: 'سفارش خرید رنگ مشکی D-101 را با تامین‌کننده دوم هم قیمت گرفتم.',
        at: 'دیروز',
      },
    ],
  },
]
