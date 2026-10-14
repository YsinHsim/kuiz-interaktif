# Kuiz Interaktif

Permainan kuiz berbilang pemain (gaya Kahoot) tanpa backend. Hos memaparkan skrin pada projektor,
peserta imbas kod QR dan jawab di telefon.

## Cara ia berfungsi
- **Peer-to-peer (PeerJS / WebRTC).** Tab hos ialah "pelayan" permainan: ia menyimpan soalan, pemasa dan markah.
  Telefon peserta bersambung terus ke tab hos. Pelayan awam `0.peerjs.com` hanya digunakan untuk
  memperkenalkan pelayar antara satu sama lain.
- **Jangan tutup tab hos** semasa permainan. Refresh tidak mengapa — keadaan disimpan dan peserta
  bersambung semula secara automatik.
- Sesuai untuk ~30–50 peserta. Rangkaian korporat yang ketat mungkin menyekat WebRTC — minta peserta guna data mudah alih.

## Pembangunan
```bash
npm install
npm run dev        # buka http://<IP-rangkaian>:5173/#/host supaya telefon boleh imbas QR
```

## Deploy ke Vercel
Import folder ini sebagai projek Vercel (Framework: **Vite**). Tiada env var diperlukan.
Hos buka `https://<projek>.vercel.app/#/host`.

## Pilihan: pelayan PeerJS sendiri
Jika pelayan awam tidak stabil, jalankan `npx peer --port 9000` di mana-mana pelayan dan tetapkan:
```
VITE_PEER_HOST=peer.contoh.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/
VITE_PEER_SECURE=true
```

## Kuiz tersedia
- **Teka Imej Dalam Perkataan** — 10 soalan bergambar (mod pilihan A–D atau taip jawapan).
- **Kuiz e-NORES** — 5 soalan Lesen Penggajian Pekerja Bukan Pemastautin, dengan penerangan & refleksi.

Hos pilih kuiz di lobi. Butang **⛶ Skrin penuh** (atau kekunci **F**) untuk projektor.

## Tambah kuiz baharu
1. Cipta fail baharu dalam `src/quizzes/` (salin `enores.js` sebagai contoh).
2. Daftarkan dalam `src/quizzes/index.js` → `QUIZZES`.
3. Gambar (jika ada) letak dalam `public/images/`.

Medan soalan diterangkan dalam `src/quizzes/index.js`.
