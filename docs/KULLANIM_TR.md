# Para Pusulası 💰🧭

Kişisel finans takip uygulaması. **PWA** — telefona "Ana ekrana ekle" ile kurulur, çevrimdışı çalışır, tüm veriler **yalnızca senin cihazında** (IndexedDB) saklanır. Sunucu yok, hesap yok, ücretsiz.

## Özellikler
- 💵 Cebindeki/hesabındaki parayı ve bu ayki net durumu gör
- ⇅ Gelir & harcama ekle, kategorize et, tekrar eden ödemeleri işaretle
- ▣ Borç & kredi takibi: her borcun **bitiş tarihi** ve **toplam faiz** hesabı (çığ yöntemi)
- ◧ Kategori bazlı aylık bütçe ve canlı ilerleme çubukları
- ↗ 1 hafta / 1 ay / 1 yıl bakiye tahmini ve grafik
- ⬇️⬆️ Yedeği indirme / geri yükleme (JSON)

## Teknolojiler
React + Vite • Dexie (IndexedDB) • vite-plugin-pwa (service worker + manifest). Harici grafik kütüphanesi yok.

---

## 1) Bilgisayarda çalıştırma
Node.js 18+ kurulu olmalı.
```bash
npm install
npm run dev      # http://localhost:5173 açılır
```
Üretim derlemesi:
```bash
npm run build    # dist/ klasörü üretir
npm run preview  # derlenmiş hali yerelde test eder
```

## 2) İnternete ücretsiz yayınlama (gerçek hayata çıkar)

**En kolay yol — Netlify Drop:**
1. `npm run build` çalıştır → `dist/` klasörü oluşur.
2. https://app.netlify.com/drop adresine git.
3. `dist` klasörünü sürükleyip bırak. Birkaç saniyede `https://...netlify.app` adresin hazır.

**Vercel:**
```bash
npm i -g vercel
vercel        # soruları geçtikten sonra otomatik yayınlar
```

**GitHub Pages:** depoya yükle, `vite.config.js` içine `base: '/REPO_ADI/'` ekle, `dist` içeriğini `gh-pages` dalına gönder.


## 3) Telefona kurma
Yayınladığın adresi telefonun tarayıcısında aç →
- **iPhone (Safari):** Paylaş → "Ana Ekrana Ekle"
- **Android (Chrome):** menü → "Uygulamayı yükle" / "Ana ekrana ekle"

Artık tam ekran, uygulama gibi açılır ve çevrimdışı çalışır.

---

## Veri güvenliği
Veriler **sadece** açtığın tarayıcının IndexedDB'sinde durur; hiçbir yere gönderilmez. Tarayıcı verisini temizlersen kaybolur — bu yüzden ara sıra menüden **"Yedeği indir"** ile JSON yedeği al. Yeni cihazda "Yedekten yükle" ile geri getirebilirsin.

## Not
Para Pusulası kişisel takip aracıdır, lisanslı finansal danışmanlık değildir. Borç stratejileri genel bilgilendirme amaçlıdır.
