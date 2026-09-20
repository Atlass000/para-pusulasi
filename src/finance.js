// ---- Biçimlendirme ----
export const fmt = (n) => '₺' + Math.round(n || 0).toLocaleString('tr-TR')
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const monthKey = (iso) => (iso || '').slice(0, 7)
export const nowMonth = () => todayISO().slice(0, 7)

export function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}
export function monthName() {
  return new Date().toLocaleDateString('tr-TR', { month: 'long' })
}

// ---- Kategoriler ----
export const CATS = {
  income: [
    ['💼', 'Maaş'], ['🤝', 'Serbest/Freelance'], ['🎁', 'Hediye'],
    ['📈', 'Yatırım'], ['↩️', 'İade'], ['➕', 'Diğer']
  ],
  expense: [
    ['🛒', 'Market'], ['🏠', 'Kira'], ['🍔', 'Yeme-İçme'], ['🚌', 'Ulaşım'],
    ['📚', 'Eğitim'], ['💳', 'Borç/Kredi'], ['📱', 'Abonelik'], ['⚡', 'Faturalar'],
    ['🏥', 'Sağlık'], ['🥊', 'Spor'], ['🎉', 'Eğlence'], ['➖', 'Diğer']
  ]
}
export function catEmoji(type, name) {
  const found = (CATS[type] || []).find((c) => c[1] === name)
  return found ? found[0] : '💠'
}

// ---- Hesaplamalar ----
export function monthTotals(tx, mk) {
  let inc = 0, exp = 0
  for (const t of tx) {
    if (monthKey(t.date) === mk) t.type === 'income' ? (inc += t.amount) : (exp += t.amount)
  }
  return { inc, exp, net: inc - exp }
}

export function recurringMonthly(tx, debts) {
  let inc = 0, exp = 0
  for (const t of tx) {
    if (t.recurring) t.type === 'income' ? (inc += t.amount) : (exp += t.amount)
  }
  const debtPay = debts.reduce((s, d) => s + (d.pay || 0), 0)
  return { inc, exp, debtPay, net: inc - exp - debtPay }
}

export const totalDebt = (debts) => debts.reduce((s, d) => s + (d.rem || 0), 0)

// Borç kapatma simülasyonu (azalan bakiye + aylık faiz)
export function payoffSim(d) {
  let rem = d.rem
  let months = 0
  let interestTotal = 0
  const r = (d.rate || 0) / 100 / 12
  if (!d.pay || d.pay <= 0) return { months: Infinity, interestTotal: 0 }
  while (rem > 0 && months < 1200) {
    const i = rem * r
    if (d.pay <= i) return { months: Infinity, interestTotal: Infinity } // ödeme faizi karşılamıyor
    interestTotal += i
    rem = rem + i - d.pay
    months++
  }
  return { months, interestTotal }
}

export function payoffLabel(months) {
  if (!isFinite(months)) return 'Ödeme faizi karşılamıyor ⚠️'
  const dt = new Date()
  dt.setMonth(dt.getMonth() + months)
  return dt.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) + ` (${months} ay)`
}

// 12 aylık bakiye tahmini
export function forecastSeries(balance, recNet, months = 12) {
  const out = []
  let bal = balance
  const base = new Date()
  for (let m = 0; m <= months; m++) {
    if (m > 0) bal += recNet
    const d = new Date(base.getFullYear(), base.getMonth() + m, 1)
    out.push({ label: d.toLocaleDateString('tr-TR', { month: 'short' }), value: Math.round(bal) })
  }
  return out
}
