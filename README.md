# whoami — Daniel Hutajulu (@xyb3rpunk)

Personal branding site. Statis, tanpa framework, tanpa build step, tanpa tracker.

**Live:** https://xyb3rpunq.github.io/whoami/

---

## Isi halaman

`hero` → `01 tentang` → `02 fokus` → `03 karier` → `04 proyek` → `05 podcast`
→ `06 prinsip` → `07 terhubung` → `08 dukung`

## Struktur file

| File | Fungsi |
| --- | --- |
| `index.html` | Seluruh isi halaman, dua bahasa lewat atribut `data-id` / `data-en` |
| `assets/css/style.css` | Semua styling — dark web3, responsif, reduced-motion & print aware |
| `assets/js/main.js` | Bahasa ID/EN, nav, rail, terminal, podcast, tab donasi, copy, reveal, canvas |
| `assets/avatar.webp` | Foto profil dipakai halaman (27 KB) |
| `assets/avatar.png` | Versi PNG kualitas penuh untuk JSON-LD dan crawler |
| `assets/cv/*.pdf` | CV yang bisa diunduh pengunjung |
| `assets/favicon*` | Ikon tab browser & home screen |
| `404.html` | Halaman error — CSS dan foto di-inline, jadi tetap rapi di path sedalam apa pun |
| `robots.txt`, `sitemap.xml` | SEO dasar |
| `.nojekyll` | Matikan pemrosesan Jekyll di GitHub Pages |

## Fitur

- **Dwibahasa ID/EN** — 116 elemen teks, tombol di navbar, pilihan disimpan di `localStorage`, default ikut bahasa browser.
- **Navigasi aktif otomatis** — navbar dan rail titik di kanan menyorot section yang sedang dibaca.
- **Menu mobile** — drawer + scrim, tutup dengan `Esc`, klik luar, atau pilih link; scroll body ikut terkunci.
- **Baris terminal** di hero — mengetik `whoami`, `cat manifesto.md`, `ls ~/focus`, `git log --oneline` bergantian.
- **Pemutar podcast** — otomatis mengenali link Spotify, YouTube, atau file audio dari daftar `EPISODES`.
- **Tab donasi** BTC / USDT-TRC20 / USDT-ERC20 dengan navigasi keyboard (panah, Home, End).
- **Copy address** ke clipboard, dengan fallback `execCommand`, lalu fallback seleksi teks + toast.
- **Unduh CV** langsung dari hero dan dari section karier.
- **Aksesibilitas** — satu `h1`, skip link, semua link & tombol punya nama, fokus terlihat.
- **Ringan** — nol dependensi eksternal, nol web font, animasi mati otomatis kalau `prefers-reduced-motion`.

## Ganti alamat donasi

Alamat yang ada sekarang masih **placeholder** dan tidak bisa menerima dana.
Edit satu tempat saja — `WALLETS` di paling atas `assets/js/main.js`:

```js
var WALLETS = {
  'addr-btc': 'bc1...',   // Bitcoin (native segwit)
  'addr-trc': 'T...',     // USDT TRC20 (Tron)
  'addr-erc': '0x...'     // USDT ERC20 (Ethereum)
};
```

Setelah diganti, hapus juga badge `pill-warn` dan `.donate-note` di `index.html`.

## Tambah episode podcast

Section podcast otomatis menampilkan state "segera hadir" selama daftarnya kosong.
Isi satu objek saja di `EPISODES` (`assets/js/main.js`) dan pemutarnya langsung nyala:

```js
var EPISODES = [
  { title: 'Ep 01 — Gagal 7 kali', url: 'https://open.spotify.com/episode/XXXXXXXX' }
];
```

Didukung: Spotify (`episode`/`show`), YouTube (`watch`/`youtu.be`), dan file audio
langsung (`.mp3`, `.m4a`, `.ogg`, `.wav`, `.aac`).

## Ganti CV

Timpa `assets/cv/Daniel-Hutajulu-CV.pdf` dengan berkas baru bernama sama, lalu push.
Jangan pakai berkas yang memuat alamat rumah, nomor telepon, tanggal lahir, atau nama
orang lain — halaman ini publik dan terindeks mesin pencari.

## Jalanin lokal

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Deploy

GitHub Pages, sumber: branch `main`, folder `/` (root). Setiap `git push` otomatis ter-deploy.
