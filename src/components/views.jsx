import React from 'react'
import { Insight, Bar, LineChart } from './ui.jsx'
import {
  fmt, fmtDate, monthName, nowMonth, CATS, catEmoji,
  monthTotals, recurringMonthly, totalDebt, payoffSim, payoffLabel, forecastSeries, monthKey
} from '../finance.js'

function TxRow({ t, onDelete }) {
  return (
    <div className="tx">
      <div className="icon">{catEmoji(t.type, t.cat)}</div>
      <div className="info">
        <div className="t">{t.note || t.cat} {t.recurring && <span className="rec">↻</span>}</div>
        <div className="d">{t.cat} • {fmtDate(t.date)}</div>
      </div>
      <div className={'amt num ' + (t.type === 'income' ? 'in' : 'out')}>
        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
      </div>
      <button className="del" onClick={() => onDelete(t)} aria-label="Sil">✕</button>
    </div>
  )
}

export function Home({ tx, debts, balance, started, openBalance, goAll }) {
  const { inc, exp, net } = monthTotals(tx, nowMonth())
  const rec = recurringMonthly(tx, debts)
  const td = totalDebt(debts)
  const recent = [...tx].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5)

  const today = new Date().getDate()
  const week = []
  debts.forEach((d) => { if (d.day) week.push({ day: d.day, name: d.name + ' ödemesi', amt: d.pay, out: true }) })
  tx.filter((t) => t.recurring).forEach((t) => {
    week.push({ day: new Date(t.date).getDate(), name: t.note || (t.type === 'income' ? 'Gelir' : 'Gider'), amt: t.amount, out: t.type === 'expense' })
  })
  const within = week.filter((i) => i.day >= today && i.day <= today + 7).sort((a, b) => a.day - b.day)

  let insight = null
  if (!started && tx.length === 0) {
    insight = <Insight emoji="👋"><b>Hoş geldin.</b> 3 adımda başla: 1) sağ üstten mevcut paranı gir, 2) tekrar eden gelir/giderini ekle (maaş, kira), 3) varsa borçlarını gir. Gerisini uygulama hesaplar.</Insight>
  } else if (exp > inc && inc > 0) {
    insight = <Insight emoji="⚠️">Bu ay harcaman gelirinden <b>{fmt(exp - inc)}</b> fazla. Tahmin sekmesinde bunun bakiyeni nasıl etkilediğini gör.</Insight>
  } else if (td > 0) {
    const big = [...debts].sort((a, b) => (b.rate || 0) - (a.rate || 0))[0]
    insight = <Insight emoji="🎯">En yüksek faizli borcun <b>{big.name}</b> (%{big.rate || 0}). Önce buna fazladan ödeme yaparsan toplamda en az faiz ödersin (çığ yöntemi).</Insight>
  } else if (rec.net > 0) {
    insight = <Insight emoji="📈">Tekrar eden işlemlere göre her ay <b>+{fmt(rec.net)}</b> biriktiriyorsun. Bir yılda ~<b>{fmt(rec.net * 12)}</b> eder.</Insight>
  }

  return (
    <section>
      <div className="hero">
        <button className="editbtn" onClick={openBalance}>Düzenle</button>
        <div className="label">Cebimdeki / Hesaptaki Para</div>
        <div className="balance num">{fmt(balance)}</div>
        <div className="sub">
          {started
            ? `Bu ay: ${net >= 0 ? '+' : ''}${fmt(net)} net • ${fmt(inc)} gelir, ${fmt(exp)} harcama`
            : 'Başlamak için sağ üstten paranı gir ve işlem ekle'}
        </div>
      </div>

      <div className="grid g3">
        <div className="card stat"><div className="k">Bu Ay Gelir</div><div className="v green num">{fmt(inc)}</div><div className="meta">{monthName()}</div></div>
        <div className="card stat"><div className="k">Bu Ay Harcama</div><div className="v red num">{fmt(exp)}</div><div className="meta">{exp > inc ? 'Gelirden fazla ⚠️' : 'Gelir içinde ✓'}</div></div>
        <div className="card stat"><div className="k">Toplam Borç</div><div className="v gold num">{fmt(td)}</div><div className="meta">{debts.length ? debts.length + ' kalem' : 'Borç yok 🎉'}</div></div>
      </div>

      {insight}

      <div className="section-title">Bu Hafta Seni Bekleyenler <span className="hint">tekrar eden ödemeler</span></div>
      <div className="card">
        {within.length === 0
          ? <div className="empty"><span className="big">🗓️</span>Bu hafta planlı tekrar eden ödeme yok</div>
          : within.map((i, k) => (
            <div className="tx" key={k}>
              <div className="icon">{i.out ? '📤' : '📥'}</div>
              <div className="info"><div className="t">{i.name}</div><div className="d">Ayın {i.day}'i</div></div>
              <div className={'amt num ' + (i.out ? 'out' : 'in')}>{i.out ? '-' : '+'}{fmt(i.amt)}</div>
            </div>
          ))}
      </div>

      <div className="section-title">Son İşlemler <span className="hint click" onClick={goAll}>tümünü gör →</span></div>
      <div className="card">
        {recent.length
          ? recent.map((t) => <TxRow key={t.id} t={t} onDelete={() => {}} />)
          : <div className="empty"><span className="big">💸</span>Henüz işlem yok. İşlemler sekmesinden ekle.</div>}
      </div>
    </section>
  )
}

export function Transactions({ tx, openTx, onDelete }) {
  const list = [...tx].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  return (
    <section>
      <div className="section-title">İşlemler <span className="hint">{list.length ? list.length + ' kayıt' : ''}</span></div>
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <button className="btn" onClick={() => openTx('income')}>＋ Gelir Ekle</button>
        <button className="btn ghost" onClick={() => openTx('expense')}>－ Harcama Ekle</button>
      </div>
      <div className="card">
        {list.length
          ? list.map((t) => <TxRow key={t.id} t={t} onDelete={onDelete} />)
          : <div className="empty"><span className="big">💸</span>Henüz işlem yok</div>}
      </div>
    </section>
  )
}

export function Debts({ debts, openDebt, openPay, onDelete }) {
  const td = totalDebt(debts)
  let totalInterest = 0, maxMonths = 0
  debts.forEach((d) => {
    const s = payoffSim(d)
    if (isFinite(s.interestTotal)) totalInterest += s.interestTotal
    if (isFinite(s.months)) maxMonths = Math.max(maxMonths, s.months)
  })
  return (
    <section>
      <div className="section-title">Borçlar & Krediler</div>
      {debts.length > 0 && (
        <Insight emoji="🧭">
          Toplam borcun <b>{fmt(td)}</b>. Mevcut ödeme planıyla en geç <b>{maxMonths ? payoffLabel(maxMonths) : '—'}</b> biter ve yaklaşık <b>{fmt(totalInterest)}</b> faiz ödersin. Aylık ödemeyi artırınca ikisi de küçülür.
        </Insight>
      )}
      <button className="btn" style={{ marginBottom: 16 }} onClick={openDebt}>＋ Borç / Kredi Ekle</button>
      {debts.length === 0
        ? <div className="card"><div className="empty"><span className="big">🎉</span>Hiç borcun yok. Harika!</div></div>
        : [...debts].sort((a, b) => (b.rate || 0) - (a.rate || 0)).map((d) => {
          const sim = payoffSim(d)
          return (
            <div className="debt" key={d.id}>
              <div className="row">
                <div>
                  <div className="name">{d.name}</div>
                  <div className="meta">
                    <span>Aylık: {fmt(d.pay)}</span><span>Faiz: %{d.rate || 0}</span>{d.day ? <span>Gün: {d.day}</span> : null}
                  </div>
                </div>
                <div className="rem num">{fmt(d.rem)}</div>
              </div>
              <div className="meta" style={{ marginTop: 8 }}>
                📅 Tahmini bitiş: <b style={{ color: 'var(--ink)' }}>{payoffLabel(sim.months)}</b> • toplam faiz ~{isFinite(sim.interestTotal) ? fmt(sim.interestTotal) : '∞'}
              </div>
              <div className="acts">
                <button className="btn sm" onClick={() => openPay(d)}>Ödeme Yap</button>
                <button className="btn sm danger" onClick={() => onDelete(d)}>Sil</button>
              </div>
            </div>
          )
        })}
    </section>
  )
}

export function Budget({ tx, budgets, setBudget }) {
  const mk = nowMonth()
  const spent = {}
  tx.forEach((t) => { if (t.type === 'expense' && monthKey(t.date) === mk) spent[t.cat] = (spent[t.cat] || 0) + t.amount })
  return (
    <section>
      <div className="section-title">Aylık Bütçe <span className="hint">kategori limitleri</span></div>
      <p className="lead">Her kategori için aylık limit belirle; bu ay ne kadar harcadığını canlı takip et.</p>
      <div className="card">
        {CATS.expense.map(([emo, cat]) => {
          const lim = budgets[cat] || 0
          const sp = spent[cat] || 0
          const pct = lim > 0 ? (sp / lim) * 100 : 0
          const st = lim > 0 ? (sp > lim ? 'over' : sp > lim * 0.8 ? 'warn' : '') : ''
          return (
            <div className="budrow" key={cat}>
              <div className="budhead">
                <span className="budname">{emo} {cat}</span>
                <span className="num budval">
                  {fmt(sp)} /{' '}
                  <input type="number" inputMode="decimal" defaultValue={lim || ''} placeholder="limit"
                    onBlur={(e) => setBudget(cat, e.target.value)} />
                </span>
              </div>
              {lim > 0 && (
                <>
                  <Bar pct={pct} state={st} />
                  <div className="budnote">{sp > lim ? `Limiti ${fmt(sp - lim)} aştın ⚠️` : `Kalan ${fmt(lim - sp)}`}</div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function Forecast({ tx, debts, balance }) {
  const rec = recurringMonthly(tx, debts)
  const series = forecastSeries(balance, rec.net, 12)

  let insight
  if (rec.inc === 0 && rec.exp === 0 && rec.debtPay === 0) {
    insight = <Insight emoji="💡">Tahmin için <b>tekrar eden</b> gelir/giderini ekle (işlem eklerken "her ay tekrar eden" kutusunu işaretle) ve borçlarını gir. Sonra geleceğin burada belirir.</Insight>
  } else if (rec.net < 0) {
    const m = balance > 0 ? Math.floor(balance / Math.abs(rec.net)) : 0
    insight = <Insight emoji="⚠️">Her ay <b>{fmt(Math.abs(rec.net))}</b> açık veriyorsun. Bu hızla paran ~<b>{m} ay</b> içinde biter. Harcamadan kısmak ya da geliri artırmak gerekiyor.</Insight>
  } else {
    insight = <Insight emoji="🌱">Her ay <b>+{fmt(rec.net)}</b> artıda. Bu tempoyla 1 yıl sonra bakiyen ~<b>{fmt(series[12].value)}</b> olur. Bunu borç kapatmaya yönlendirirsen faizden kurtulursun.</Insight>
  }

  const periods = [
    ['1 Hafta', rec.net / 4.345], ['1 Ay', rec.net], ['3 Ay', rec.net * 3],
    ['6 Ay', rec.net * 6], ['1 Yıl', rec.net * 12]
  ]

  return (
    <section>
      <div className="section-title">Geleceğini Gör <span className="hint">tekrar edenlere göre</span></div>
      {insight}
      <div className="card">
        <strong className="card-title">12 Aylık Bakiye Tahmini</strong>
        <LineChart data={series} />
        <div className="legend">
          <span><i style={{ background: 'var(--gold)' }} /> Tahmini bakiye</span>
          <span><i style={{ background: 'var(--red)' }} /> Sıfır çizgisi</span>
        </div>
      </div>
      <div className="section-title" style={{ marginTop: 20 }}>Dönem Dönem</div>
      <div className="card">
        <table className="fc-table">
          <thead><tr><th>Dönem</th><th className="num">Net Akış</th><th className="num">Tahmini Bakiye</th></tr></thead>
          <tbody>
            {periods.map(([label, flow]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className={'num ' + (flow >= 0 ? 'pos' : 'neg')}>{flow >= 0 ? '+' : ''}{fmt(flow)}</td>
                <td className={'num ' + (balance + flow < 0 ? 'neg' : '')}>{fmt(balance + flow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
