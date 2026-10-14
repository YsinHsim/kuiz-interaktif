<script setup>
import { ref } from 'vue'

const tab = ref('host')
</script>

<template>
  <main class="guide">
    <a href="#/" class="back">← Laman utama</a>
    <h1>Panduan Permainan</h1>
    <p class="muted lead">Prosedur ringkas untuk hos (fasilitator) dan peserta.</p>

    <div class="seg" role="tablist">
      <button role="tab" :class="{ on: tab === 'host' }" @click="tab = 'host'">🎤 Hos</button>
      <button role="tab" :class="{ on: tab === 'player' }" @click="tab = 'player'">📱 Peserta</button>
    </div>

    <!-- ================= HOS ================= -->
    <section v-if="tab === 'host'">
      <div class="card">
        <h2>Sebelum sesi</h2>
        <ul class="check">
          <li>Gunakan <b>laptop</b> yang disambung ke projektor / skrin besar.</li>
          <li>Pastikan laptop ada <b>internet</b> dan <b>bunyi</b> disambung ke speaker (muzik pemasa).</li>
          <li>Matikan mod tidur / skrin padam automatik pada laptop.</li>
          <li>Tekan <b>⛶ Skrin penuh</b> (atau kekunci <b>F</b>) supaya paparan memenuhi projektor. Tekan <b>Esc</b> untuk keluar.</li>
        </ul>
      </div>

      <ol class="steps">
        <li>
          <h3>Buka skrin hos</h3>
          <p>Di laman utama, tekan <b>Mulakan sebagai hos</b>. Kod QR dan <b>kod bilik 4 digit</b> akan dipaparkan.</p>
        </li>
        <li>
          <h3>Pilih tetapan</h3>
          <p><b>Pilih kuiz:</b> cth. <i>Teka Imej Dalam Perkataan</i> (ice breaking) atau <i>Kuiz e-NORES</i> (latihan).</p>
          <p><b>Cara menjawab:</b> <i>Pilihan A–D</i> (disemak automatik, paling pantas) atau <i>Taip jawapan</i> (lebih mencabar — hanya untuk kuiz tertentu).</p>
          <p><b>Masa setiap soalan:</b> 10s untuk ice breaking; 15–20s untuk mod taip atau soalan panjang (e-NORES).</p>
        </li>
        <li>
          <h3>Jemput peserta masuk</h3>
          <p>Minta peserta imbas kod QR pada skrin. Nama mereka akan muncul di senarai <b>Peserta</b>.</p>
          <p class="muted">Tekan × pada nama untuk keluarkan peserta (cth. nama tidak sesuai atau tersalah masuk).</p>
        </li>
        <li>
          <h3>Mula permainan</h3>
          <p>Tekan <b>Mula permainan ▶</b> apabila semua sudah masuk. Peserta lewat masih boleh masuk di tengah permainan.</p>
        </li>
        <li>
          <h3>Kawal setiap soalan</h3>
          <table class="controls">
            <tbody>
              <tr><td><b>⏹ Tamatkan masa</b></td><td>Hentikan pemasa serta-merta (semua sudah jawab / mahu cepat).</td></tr>
              <tr><td><b>👀 Dedah jawapan</b></td><td>Tunjuk jawapan betul &amp; papan markah 5 teratas.</td></tr>
              <tr><td><b>Soalan seterusnya ▶</b></td><td>Pergi ke soalan berikutnya.</td></tr>
              <tr><td><b>Langkau soalan ⏭</b></td><td>Lompat soalan tanpa dedah jawapan.</td></tr>
              <tr><td><b>Tamat permainan</b></td><td>Terus ke keputusan akhir.</td></tr>
            </tbody>
          </table>
          <p class="muted">Pemasa tamat sendiri apabila semua peserta sudah menjawab.</p>
        </li>
        <li>
          <h3>Semak jawapan (mod taip sahaja)</h3>
          <p>Selepas masa tamat, senarai jawapan dipaparkan dan disemak automatik (salah ejaan kecil diterima).
            Tekan <b>✓</b> untuk terima atau <b>✗</b> untuk tolak sebelum/selepas dedah jawapan.</p>
        </li>
        <li>
          <h3>Keputusan akhir</h3>
          <p>Podium 3 teratas dipaparkan. Pilih <b>Main semula (peserta sama)</b> untuk pusingan baru,
            atau <b>Permainan baharu</b> untuk kod bilik baharu.</p>
          <p>Tekan tab <b>📊 Analisis Soalan</b> untuk melihat peratus betul / salah bagi setiap soalan. Soalan bertanda
            <b>⚠️ Perlu diterangkan</b> (kurang 50% betul) ialah topik yang wajar diulang kaji bersama peserta.
            Tekan soalan untuk lihat jawapan salah paling popular dan penerangan.</p>
        </li>
      </ol>

      <div class="card warn">
        <h2>⚠️ Penting</h2>
        <ul>
          <li><b>Jangan tutup tab hos</b> semasa permainan — tab ini ialah "pelayan" permainan.</li>
          <li>Tersilap <b>refresh</b>? Tidak mengapa: permainan disambung semula dan peserta masuk semula secara automatik (tunggu beberapa saat).</li>
        </ul>
      </div>
    </section>

    <!-- ================= PESERTA ================= -->
    <section v-else>
      <ol class="steps">
        <li>
          <h3>Imbas kod QR</h3>
          <p>Buka <b>kamera telefon</b> dan halakan ke kod QR pada skrin, kemudian tekan pautan yang muncul.</p>
          <p class="muted">Tidak boleh imbas? Buka laman ini di pelayar telefon, masukkan <b>kod bilik 4 digit</b> dan tekan <b>Sertai</b>.</p>
        </li>
        <li>
          <h3>Masukkan nama</h3>
          <p>Taip nama anda (maks. 20 aksara) dan tekan <b>Masuk ▶</b>. Tunggu skrin <i>"Anda sudah masuk!"</i>.</p>
        </li>
        <li>
          <h3>Baca soalan</h3>
          <p>Soalan (dan gambar, jika ada) dipaparkan di skrin besar dan juga di telefon anda.</p>
          <p class="muted">Kuiz <i>Teka Imej</i>: perhatikan perkataan besar — ada <b>imej tersembunyi di dalam huruf</b>.</p>
        </li>
        <li>
          <h3>Jawab sebelum masa tamat</h3>
          <p><b>Pilihan A–D:</b> tekan butang berwarna. <b>Mod taip:</b> taip jawapan dan tekan <b>Hantar</b>.</p>
          <p class="muted">Hanya <b>satu jawapan</b> setiap soalan — tidak boleh ubah selepas dihantar.</p>
        </li>
        <li>
          <h3>Lihat markah</h3>
          <p>Selepas hos dedah jawapan, anda akan nampak betul/salah, mata diperoleh dan kedudukan anda.</p>
        </li>
      </ol>

      <div class="card">
        <h2>🏅 Cara kira markah</h2>
        <ul>
          <li>Jawapan betul: <b>500 mata</b> + bonus kepantasan sehingga <b>500 mata</b>.</li>
          <li>Lebih cepat menjawab = lebih banyak mata (maksimum 1000 setiap soalan).</li>
          <li>Jawapan salah atau tiada jawapan: 0 mata.</li>
        </ul>
      </div>

      <div class="card warn">
        <h2>🛠️ Masalah biasa</h2>
        <ul>
          <li><b>"Bilik tidak dijumpai"</b> — semak kod bilik pada skrin hos.</li>
          <li><b>Lama menyambung / terputus</b> — tukar dari Wi-Fi ke <b>data mudah alih</b>, kemudian cuba lagi.</li>
          <li><b>Tersilap tutup / refresh</b> — buka semula pautan yang sama; markah anda kekal.</li>
          <li>Jangan tekan <b>Keluar</b> kecuali mahu berhenti bermain.</li>
        </ul>
      </div>
    </section>

    <div class="cta">
      <a class="btn primary" href="#/join">Sertai sebagai peserta</a>
      <a class="btn" href="#/host">Mulakan sebagai hos</a>
    </div>
  </main>
</template>

<style scoped>
.guide { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
.back { color: var(--muted); text-decoration: none; font-size: 0.9rem; }
h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); margin: 16px 0 4px; }
.lead { margin-bottom: 20px; }
h2 { font-size: 1.1rem; margin-bottom: 10px; }
h3 { font-size: 1.05rem; margin: 0 0 6px; }
p { margin: 0 0 6px; line-height: 1.55; }
.seg { display: flex; background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; padding: 4px; gap: 4px; margin-bottom: 20px; }
.seg button { flex: 1; font: inherit; font-weight: 600; border: 0; border-radius: 10px; padding: 10px; background: transparent; color: var(--muted); cursor: pointer; }
.seg button.on { background: var(--accent); color: var(--accent-ink); }
section { display: flex; flex-direction: column; gap: 16px; }
.card ul { margin: 0; padding-left: 20px; line-height: 1.6; }
.warn { border-color: rgba(246, 196, 69, 0.4); }
.steps { list-style: none; counter-reset: step; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.steps li { counter-increment: step; position: relative; padding: 16px 16px 12px 64px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); }
.steps li::before {
  content: counter(step); position: absolute; left: 16px; top: 14px; width: 34px; height: 34px; border-radius: 50%;
  background: var(--accent); color: var(--accent-ink); font-weight: 800; display: grid; place-items: center;
}
.controls { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 0.92rem; }
.controls td { padding: 8px 6px; border-top: 1px solid var(--border); vertical-align: top; }
.controls td:first-child { white-space: nowrap; padding-right: 12px; }
@media (max-width: 520px) {
  .steps li { padding-left: 56px; }
  .controls td:first-child { white-space: normal; }
}
.cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 28px; }
</style>
