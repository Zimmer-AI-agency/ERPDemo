/** Formatting helpers. Intl does the Persian digits, so no digit-mapping table. */

const fa = new Intl.NumberFormat('fa-IR')
const fa1 = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 })
const fa2 = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 })

/** ۱٬۸۶۰ */
export const num = (n: number) => fa.format(Math.round(n))

/** ۱۴.۲ */
export const dec = (n: number) => fa1.format(n)

export const pct = (n: number) => `${fa1.format(Math.abs(n))}٪`

/** Card scale: ۴.۸۲ میلیارد تومان. Rounded on purpose, see toman() for detail views. */
export function money(amount: number): string {
  if (amount >= 1_000_000_000) return `${fa2.format(amount / 1_000_000_000)} میلیارد تومان`
  if (amount >= 1_000_000) return `${fa1.format(amount / 1_000_000)} میلیون تومان`
  return `${fa.format(amount)} تومان`
}

/** Detail scale: ۱۲۸٬۰۴۰٬۰۰۰ تومان */
export const toman = (amount: number) => `${fa.format(Math.round(amount))} تومان`

const MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

/** '1405-05-22' becomes '۲۲ مرداد ۱۴۰۵'. Dates are stored Jalali, so there is
 *  no calendar conversion to get wrong. */
export function jalali(date: string): string {
  const [y, m, d] = date.split(' ')[0].split('-').map(Number)
  return `${fa.format(d)} ${MONTHS[m - 1]} ${fa.format(y)}`
}

/** '1405-05-25 14:05' becomes '۱۴:۰۵'. */
export function clock(stamp: string): string {
  const time = stamp.split(' ')[1]
  if (!time) return ''
  return time.replace(/\d/g, (d) => fa.format(Number(d)))
}

/** Whole days between two Jalali dates. Good enough at 31-day months, which is
 *  all the demo spans. */
export function daysBetween(from: string, to: string): number {
  const toDays = (s: string) => {
    const [y, m, d] = s.split(' ')[0].split('-').map(Number)
    return y * 372 + m * 31 + d
  }
  return toDays(to) - toDays(from)
}
