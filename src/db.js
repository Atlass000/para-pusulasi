import Dexie from 'dexie'

// Tüm veriler kullanıcının cihazında (IndexedDB) saklanır. Sunucu yok, hesap yok.
export const db = new Dexie('ParaPusulasi')

db.version(1).stores({
  tx: '++id, date, type, cat',   // işlemler (gelir/gider)
  debts: '++id',                 // borçlar / krediler
  budgets: 'cat',                // kategori bütçe limitleri
  meta: 'key'                    // bakiye, başlangıç durumu vb.
})

// --- meta yardımcıları ---
export async function getMeta(key, fallback = null) {
  const row = await db.meta.get(key)
  return row ? row.value : fallback
}
export async function setMeta(key, value) {
  await db.meta.put({ key, value })
}

// --- bakiye ---
export async function adjustBalance(delta) {
  const cur = await getMeta('balance', 0)
  await setMeta('balance', Math.round((cur + delta) * 100) / 100)
}

// --- tüm veriyi dışa/içe aktar (yedekleme) ---
export async function exportAll() {
  const [tx, debts, budgets, meta] = await Promise.all([
    db.tx.toArray(), db.debts.toArray(), db.budgets.toArray(), db.meta.toArray()
  ])
  return { version: 1, exportedAt: new Date().toISOString(), tx, debts, budgets, meta }
}
export async function importAll(data) {
  await db.transaction('rw', db.tx, db.debts, db.budgets, db.meta, async () => {
    await Promise.all([db.tx.clear(), db.debts.clear(), db.budgets.clear(), db.meta.clear()])
    if (data.tx?.length) await db.tx.bulkAdd(data.tx)
    if (data.debts?.length) await db.debts.bulkAdd(data.debts)
    if (data.budgets?.length) await db.budgets.bulkAdd(data.budgets)
    if (data.meta?.length) await db.meta.bulkAdd(data.meta)
  })
}
export async function wipeAll() {
  await db.transaction('rw', db.tx, db.debts, db.budgets, db.meta, async () => {
    await Promise.all([db.tx.clear(), db.debts.clear(), db.budgets.clear(), db.meta.clear()])
  })
}
