# Kuiz Ice Breaking — Teka Imej Dalam Perkataan

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

## Ubah soalan
Edit `src/questions.js` dan letak imej dalam `public/images/`. `choices[0]` mestilah jawapan betul
(susunan dirawakkan semasa permainan); `accept` ialah senarai jawapan yang diterima untuk mod taip.
