import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getMeta, setMeta, adjustBalance, exportAll, importAll, wipeAll } from './db.js'
import { Sheet } from './components/ui.jsx'
import { Home, Transactions, Debts, Budget, Forecast } from './components/views.jsx'
import { CATS, todayISO, fmt } from './finance.js'

const TABS = [
  ['home', '◎', 'Genel'], ['tx', '⇅', 'İşlemler'], ['debt', '▣', 'Borçlar'],
  ['budget', '◧', 'Bütçe'], ['forecast', '↗', 'Tahmin']
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [menu, setMenu] = useState(false)

  // --- canlı veri (IndexedDB) ---
  const tx = useLiveQuery(() => db.tx.toArray(), [], [])
  const debts = useLiveQuery(() => db.debts.toArray(), [], [])
  const budgetRows = useLiveQuery(() => db.budgets.toArray(), [], [])
  const balance = useLiveQuery(() => getMeta('balance', 0), [], 0)
  const started = useLiveQuery(() => getMeta('started', false), [], false)
  const budgets = Object.fromEntries((budgetRows || []).map((b) => [b.cat, b.limit]))

  const go = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ---------- işlem modalı ----------
  const [txM, setTxM] = useState({ open: false, type: 'expense' })
  const [form, setForm] = useState({ amt: '', note: '', cat: 'Market', date: todayISO(), rec: false })
  const openTx = (type) => {
    setForm({ amt: '', note: '', cat: CATS[type][0][1], date: todayISO(), rec: false })
    setTxM({ open: true, type })
  }
  const setTxType = (type) => { setForm((f) => ({ ...f, cat: CATS[type][0][1] })); setTxM((m) => ({ ...m, type })) }
  const saveTx = async () => {
    const amt = parseFloat(form.amt)
    if (!amt || amt <= 0) return
    await db.tx.add({ type: txM.type, amount: amt, cat: form.cat, note: form.note.trim(), date: form.date || todayISO(), recurring: form.rec })
    await adjustBalance(txM.type === 'income' ? amt : -amt)
    await setMeta('started', true)
    setTxM({ open: false, type: txM.type })
  }
  const delTx = async (t) => {
    await db.tx.delete(t.id)
    await adjustBalance(t.type === 'income' ? -t.amount : t.amount)
  }

  // ---------- borç modalı ----------
  const [debtM, setDebtM] = useState(false)
  const [dform, setDform] = useState({ name: '', rem: '', pay: '', rate: '', day: '' })
  const openDebt = () => { setDform({ name: '', rem: '', pay: '', rate: '', day: '' }); setDebtM(true) }
  const saveDebt = async () => {
    const rem = parseFloat(dform.rem) || 0
    if (!dform.name.trim() || rem <= 0) return
    await db.debts.add({
      name: dform.name.trim(), rem,
      pay: parseFloat(dform.pay) || 0, rate: parseFloat(dform.rate) || 0,
      day: parseInt(dform.day) || 0
    })
    await setMeta('started', true)
    setDebtM(false)
  }
  const delDebt = async (d) => { await db.debts.delete(d.id) }

  // ---------- borç ödeme modalı ----------
  const [payM, setPayM] = useState({ open: false, debt: null })
  const [payForm, setPayForm] = useState({ amt: '', fromBalance: true })
  const openPay = (d) => { setPayForm({ amt: String(d.pay || ''), fromBalance: true }); setPayM({ open: true, debt: d }) }
  const confirmPay = async () => {
    const d = payM.debt
    const amt = parseFloat(payForm.amt) || 0
    if (!d || amt <= 0) return
    const newRem = Math.max(0, d.rem - amt)
    if (newRem <= 0) await db.debts.delete(d.id)
    else await db.debts.update(d.id, { rem: newRem })
    if (payForm.fromBalance) {
      await db.tx.add({ type: 'expense', amount: amt, cat: 'Borç/Kredi', note: d.name + ' ödemesi', date: todayISO(), recurring: false })
      await adjustBalance(-amt)
    }
    setPayM({ open: false, debt: null })
  }

  // ---------- bakiye modalı ----------
  const [balM, setBalM] = useState(false)
  const [balVal, setBalVal] = useState('')
  const openBalance = () => { setBalVal(String(balance || '')); setBalM(true) }
  const saveBalance = async () => { await setMeta('balance', parseFloat(balVal) || 0); await setMeta('started', true); setBalM(false) }

  // ---------- bütçe ----------
  const setBudget = async (cat, val) => {
    const v = parseFloat(val) || 0
    if (v > 0) await db.budgets.put({ cat, limit: v })
    else await db.budgets.delete(cat)
  }

  // ---------- yedekleme ----------
  const doExport = async () => {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `para-pusulasi-yedek-${todayISO()}.json`; a.click()
    URL.revokeObjectURL(url); setMenu(false)
  }
  const doImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try { await importAll(JSON.parse(reader.result)); setMenu(false) }
      catch { alert('Yedek dosyası okunamadı.') }
    }
    reader.readAsText(file)
  }
  const doWipe = async () => {
    if (confirm('Tüm verilerin kalıcı olarak silinecek. Emin misin?')) { await wipeAll(); setMenu(false) }
  }

  return (
    <>
      <div className="wrap">
        <header className="top">
          <div className="brand">
            <div className="logo">₺</div>
            <div>
              <h1>Para Pusulası</h1>
              <p>Borçtan kurtul, geleceğini gör</p>
            </div>
          </div>
          <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Menü">⋯</button>
          {menu && (
            <div className="menu">
              <button onClick={doExport}>⬇️ Yedeği indir</button>
              <label className="menuitem">⬆️ Yedekten yükle
                <input type="file" accept="application/json" onChange={doImport} hidden />
              </label>
              <button onClick={doWipe} className="danger">🗑️ Tümünü sil</button>
            </div>
          )}
        </header>

        <div className="views">
          {tab === 'home' && <Home tx={tx} debts={debts} balance={balance} started={started} openBalance={openBalance} goAll={() => go('tx')} />}
          {tab === 'tx' && <Transactions tx={tx} openTx={openTx} onDelete={delTx} />}
          {tab === 'debt' && <Debts debts={debts} openDebt={openDebt} openPay={openPay} onDelete={delDebt} />}
          {tab === 'budget' && <Budget tx={tx} budgets={budgets} setBudget={setBudget} />}
          {tab === 'forecast' && <Forecast tx={tx} debts={debts} balance={balance} />}
        </div>

        <p className="disclaimer">Para Pusulası kişisel takip aracıdır, lisanslı finansal danışmanlık değildir. Veriler yalnızca bu cihazda saklanır. Borç stratejileri genel bilgilendirme amaçlıdır.</p>
      </div>

      <nav className="tabbar">
        <div className="inner">
          {TABS.map(([id, ic, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => go(id)}>
              <span className="ic">{ic}</span>{label}
            </button>
          ))}
        </div>
      </nav>

      {/* ---- İşlem modalı ---- */}
      <Sheet open={txM.open} title={txM.type === 'income' ? 'Gelir Ekle' : 'Harcama Ekle'} onClose={() => setTxM({ ...txM, open: false })}>
        <div className="seg">
          <button className={txM.type === 'income' ? 'on inc' : ''} onClick={() => setTxType('income')}>＋ Gelir</button>
          <button className={txM.type === 'expense' ? 'on exp' : ''} onClick={() => setTxType('expense')}>－ Harcama</button>
        </div>
        <label className="fld"><span>Tutar (₺)</span>
          <input type="number" inputMode="decimal" value={form.amt} autoFocus
            onChange={(e) => setForm({ ...form, amt: e.target.value })} placeholder="0" />
        </label>
        <label className="fld"><span>Açıklama</span>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="örn. Market, Maaş, Kira" />
        </label>
        <div className="chiprow">
          {CATS[txM.type].map(([emo, name]) => (
            <span key={name} className={'chip' + (form.cat === name ? ' on' : '')} onClick={() => setForm({ ...form, cat: name })}>{emo} {name}</span>
          ))}
        </div>
        <label className="fld"><span>Tarih</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.rec} onChange={(e) => setForm({ ...form, rec: e.target.checked })} />
          <span>Her ay tekrar eden bir ödeme (kira, abonelik, maaş gibi)</span>
        </label>
        <div className="grid g2">
          <button className="btn ghost" onClick={() => setTxM({ ...txM, open: false })}>Vazgeç</button>
          <button className="btn" onClick={saveTx}>Kaydet</button>
        </div>
      </Sheet>

      {/* ---- Borç modalı ---- */}
      <Sheet open={debtM} title="Borç / Kredi Ekle" onClose={() => setDebtM(false)}>
        <label className="fld"><span>Ad (örn. Kredi kartı, İhtiyaç kredisi)</span>
          <input value={dform.name} autoFocus onChange={(e) => setDform({ ...dform, name: e.target.value })} placeholder="Borç adı" />
        </label>
        <label className="fld"><span>Kalan tutar (₺)</span>
          <input type="number" inputMode="decimal" value={dform.rem} onChange={(e) => setDform({ ...dform, rem: e.target.value })} placeholder="0" />
        </label>
        <label className="fld"><span>Aylık ödeme (₺)</span>
          <input type="number" inputMode="decimal" value={dform.pay} onChange={(e) => setDform({ ...dform, pay: e.target.value })} placeholder="0" />
        </label>
        <label className="fld"><span>Yıllık faiz oranı (%) — bilmiyorsan 0 bırak</span>
          <input type="number" inputMode="decimal" value={dform.rate} onChange={(e) => setDform({ ...dform, rate: e.target.value })} placeholder="0" />
        </label>
        <label className="fld"><span>Ödeme günü (ayın kaçı)</span>
          <input type="number" min="1" max="31" value={dform.day} onChange={(e) => setDform({ ...dform, day: e.target.value })} placeholder="1" />
        </label>
        <div className="grid g2">
          <button className="btn ghost" onClick={() => setDebtM(false)}>Vazgeç</button>
          <button className="btn" onClick={saveDebt}>Kaydet</button>
        </div>
      </Sheet>

      {/* ---- Ödeme modalı ---- */}
      <Sheet open={payM.open} title="Borç Ödemesi Yap" onClose={() => setPayM({ open: false, debt: null })}>
        {payM.debt && <p className="lead">{payM.debt.name} — kalan {fmt(payM.debt.rem)}</p>}
        <label className="fld"><span>Ödenen tutar (₺)</span>
          <input type="number" inputMode="decimal" value={payForm.amt} autoFocus onChange={(e) => setPayForm({ ...payForm, amt: e.target.value })} placeholder="0" />
        </label>
        <label className="check">
          <input type="checkbox" checked={payForm.fromBalance} onChange={(e) => setPayForm({ ...payForm, fromBalance: e.target.checked })} />
          <span>Bakiyemden düş ve harcama olarak kaydet</span>
        </label>
        <div className="grid g2">
          <button className="btn ghost" onClick={() => setPayM({ open: false, debt: null })}>Vazgeç</button>
          <button className="btn" onClick={confirmPay}>Öde</button>
        </div>
      </Sheet>

      {/* ---- Bakiye modalı ---- */}
      <Sheet open={balM} title="Başlangıç Bakiyesi" onClose={() => setBalM(false)}>
        <p className="lead">Şu an cebinde + hesabında toplam ne kadar paran var? Bundan sonra eklediğin gelir/harcamalar buna otomatik işlenir.</p>
        <label className="fld"><span>Mevcut para (₺)</span>
          <input type="number" inputMode="decimal" value={balVal} autoFocus onChange={(e) => setBalVal(e.target.value)} placeholder="0" />
        </label>
        <div className="grid g2">
          <button className="btn ghost" onClick={() => setBalM(false)}>Vazgeç</button>
          <button className="btn" onClick={saveBalance}>Kaydet</button>
        </div>
      </Sheet>
    </>
  )
}
