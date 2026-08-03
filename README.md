# siapakamu — Daniel Hutajulu (@xyb3rpunk)

Personal branding site. Statis, tanpa framework, tanpa build step, tanpa tracker.

**Live:** https://xyb3rpunq.github.io/siapakamu/

---

## Isi

| File | Fungsi |
| --- | --- |
| `index.html` | Seluruh isi halaman (hero, tentang, fokus, karier, prinsip, sosmed, donasi) |
| `assets/css/style.css` | Semua styling — dark web3, responsif, reduced-motion & print aware |
| `assets/js/main.js` | Bahasa ID/EN, nav, tab donasi, copy address, reveal, canvas background |
| `assets/avatar.png` | Foto profil (background merah sudah dibersihkan, dipotong bulat) |
| `assets/favicon*` | Ikon tab browser & home screen |
| `404.html` | Halaman error |
| `robots.txt`, `sitemap.xml` | SEO dasar |
| `.nojekyll` | Matikan pemrosesan Jekyll di GitHub Pages |

## Fitur

- **Dwibahasa ID/EN** — tombol di navbar, pilihan disimpan di `localStorage`, default ikut bahasa browser.
- **Navigasi aktif otomatis** — link navbar menyorot section yang sedang dibaca (`IntersectionObserver`).
- **Menu mobile** — drawer + scrim, tutup dengan `Esc`, klik luar, atau pilih link.
- **Tab donasi** BTC / USDT-TRC20 / USDT-ERC20 dengan navigasi keyboard (panah, Home, End).
- **Copy address** ke clipboard, lengkap dengan fallback `execCommand` dan notifikasi toast.
- **Aksesibilitas** — skip link, `aria-*` lengkap, fokus terlihat, kontras aman.
- **Ringan** — nol dependensi eksternal, nol web font, animasi mati otomatis kalau `prefers-reduced-motion`.

## Ganti alamat donasi

Alamat yang ada sekarang masih **placeholder** dan tidak bisa menerima dana.
Edit satu tempat saja — bagian `WALLETS` di paling atas `assets/js/main.js`:

```js
var WALLETS = {
  'addr-btc': 'bc1...',   // Bitcoin (native segwit)
  'addr-trc': 'T...',     // USDT TRC20 (Tron)
  'addr-erc': '0x...'     // USDT ERC20 (Ethereum)
};
```

Commit, push, selesai — halaman langsung update.

## Jalanin lokal

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Deploy

GitHub Pages, sumber: branch `main`, folder `/` (root). Setiap `git push` otomatis ter-deploy.
