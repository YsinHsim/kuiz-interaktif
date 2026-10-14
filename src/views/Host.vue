<script setup>
import { computed, ref, watchEffect, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { createHost } from '../lib/host.js'
import { joinUrl } from '../lib/net.js'
import { QUIZZES, correctIndex, answerText } from '../quizzes/index.js'
import { useFullscreen } from '../lib/fullscreen.js'

const host = createHost()
const { game, net, soundOn, quiz, question, remaining, players, connectedPlayers, leaderboard, currentAnswers, total } = host
onUnmounted(host.destroy)
const fs = useFullscreen({ hotkey: true })

const LETTERS = ['A', 'B', 'C', 'D']
const SHAPES = ['▲', '◆', '●', '■']

const url = computed(() => joinUrl(game.code))
const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname)
const qr = ref('')
watchEffect(async () => {
  qr.value = await QRCode.toDataURL(url.value, { margin: 1, width: 480, color: { dark: '#072b20', light: '#ffffff' } })
})

const inQuestion = computed(() => ['question', 'closed', 'reveal'].includes(game.phase))
const seconds = computed(() => Math.ceil(remaining.value / 1000))
const timerPct = computed(() => (remaining.value / (game.duration * 1000)) * 100)
const answeredCount = computed(() => currentAnswers.value.length)
const isLast = computed(() => game.qIndex + 1 >= total.value)
const correctId = computed(() => (question.value ? correctIndex(question.value) : 0))
const showAnswers = computed(() => game.phase === 'closed' || game.phase === 'reveal')

const choiceStats = computed(() => {
  if (!question.value) return []
  return game.choiceOrder[game.qIndex].map((id, i) => {
    const count = currentAnswers.value.filter((a) => a.value === id).length
    return { id, label: question.value.choices[id], letter: LETTERS[i], shape: SHAPES[i], count, cls: `choice-${'abcd'[i]}` }
  })
})
const maxCount = computed(() => Math.max(1, ...choiceStats.value.map((c) => c.count)))

const podium = computed(() => leaderboard.value.slice(0, 3))

function confirmEnd() {
  if (confirm('Tamatkan permainan sekarang dan paparkan keputusan?')) host.end()
}
function confirmNewGame() {
  if (confirm('Mulakan permainan baharu? Kod bilik baharu akan dijana dan semua peserta perlu sertai semula.')) host.newGame()
}
function toggleSound() {
  soundOn.value = !soundOn.value
}
function copyLink() {
  navigator.clipboard?.writeText(url.value)
}
</script>

<template>
  <div class="host">
    <header class="bar">
      <a href="#/" class="brand">{{ quiz.title }}</a>
      <span class="pill">
        <span class="dot" :class="{ wait: net.status === 'connecting', off: net.status === 'error' }" />
        Bilik {{ game.code }}
      </span>
      <span class="pill">👥 {{ connectedPlayers.length }}<template v-if="players.length !== connectedPlayers.length"> / {{ players.length }}</template></span>
      <span class="spacer" />
      <a v-if="game.phase === 'lobby'" class="btn small ghost" href="#/panduan" target="_blank">📖 Panduan</a>
      <button v-if="fs.supported" class="btn small ghost" title="Skrin penuh (F)" @click="fs.toggle">
        {{ fs.isFullscreen.value ? '🗗 Keluar skrin penuh' : '⛶ Skrin penuh' }}
      </button>
      <button class="btn small ghost" @click="toggleSound">{{ soundOn ? '🔊 Bunyi' : '🔇 Senyap' }}</button>
      <button v-if="game.phase !== 'lobby'" class="btn small ghost" @click="confirmNewGame">Permainan baharu</button>
    </header>

    <p v-if="net.error" class="net-error">{{ net.error }}</p>

    <!-- ================= LOBI ================= -->
    <main v-if="game.phase === 'lobby'" class="lobby">
      <section class="card join">
        <p class="scan-hint">📱 Buka kamera telefon &amp; imbas kod QR untuk sertai</p>
        <img v-if="qr" :src="qr" alt="Kod QR untuk sertai" class="qr" />
        <p class="muted small">atau buka laman ini dan masukkan kod</p>
        <div class="code">{{ game.code }}</div>
        <button class="btn small ghost url" @click="copyLink" title="Salin pautan">{{ url }}</button>
        <p v-if="isLocalhost" class="warn">
          Anda sedang guna <b>localhost</b> — telefon tidak boleh membuka pautan ini. Buka laman melalui alamat IP rangkaian
          (lihat output <code>npm run dev</code>) atau URL Vercel.
        </p>
      </section>

      <section class="side">
        <div class="card settings">
          <h3>Tetapan</h3>
          <div class="field">
            <span class="muted">Pilih kuiz</span>
            <div class="quiz-list">
              <button
                v-for="qz in QUIZZES"
                :key="qz.id"
                class="quiz-opt"
                :class="{ on: game.quizId === qz.id }"
                @click="host.setQuiz(qz.id)"
              >
                <b>{{ qz.title }}</b>
                <small>{{ qz.questions.length }} soalan • {{ qz.subtitle }}</small>
              </button>
            </div>
          </div>
          <div v-if="quiz.modes.length > 1" class="field">
            <span class="muted">Cara menjawab</span>
            <div class="seg">
              <button :class="{ on: game.mode === 'choice' }" @click="game.mode = 'choice'">Pilihan A–D</button>
              <button :class="{ on: game.mode === 'text' }" @click="game.mode = 'text'">Taip jawapan</button>
            </div>
          </div>
          <div class="field">
            <span class="muted">Masa setiap soalan</span>
            <div class="seg">
              <button v-for="d in [10, 15, 20, 30]" :key="d" :class="{ on: game.duration === d }" @click="game.duration = d">
                {{ d }}s
              </button>
            </div>
          </div>
        </div>

        <div class="card players">
          <h3>Peserta ({{ players.length }})</h3>
          <p v-if="!players.length" class="muted">Menunggu peserta menyertai…</p>
          <TransitionGroup name="pop" tag="ul" class="chips">
            <li v-for="p in players" :key="p.pid" :class="{ off: !p.connected }">
              {{ p.name }}
              <button title="Keluarkan" @click="host.removePlayer(p.pid)">×</button>
            </li>
          </TransitionGroup>
        </div>

        <button class="btn primary big" :disabled="!players.length || net.status !== 'ready'" @click="host.start">
          Mula permainan ▶
        </button>
      </section>
    </main>

    <!-- ================= SOALAN ================= -->
    <main v-else-if="inQuestion" class="stage">
      <div class="q-head">
        <span class="pill">Soalan {{ game.qIndex + 1 }} / {{ total }}</span>
        <h2 v-if="question.image">{{ question.prompt }}</h2>
      </div>

      <div class="q-body">
        <div class="q-visual">
          <img v-if="question.image" :src="question.image" :alt="question.word" class="qimg" />
          <div v-else class="card q-text">{{ question.prompt }}</div>
          <Transition name="pop">
            <div v-if="game.phase === 'reveal'" class="answer-banner" :class="{ inline: !question.image }">
              JAWAPAN: {{ answerText(question) }}
            </div>
          </Transition>
          <Transition name="pop">
            <div v-if="game.phase === 'reveal' && question.why" class="card why">💡 {{ question.why }}</div>
          </Transition>
        </div>

        <aside class="q-side">
          <div class="card timer">
            <div class="secs" :class="{ low: seconds <= 3 && game.phase === 'question' }">
              {{ game.phase === 'question' ? seconds : '0' }}
            </div>
            <div class="timer-bar" :class="{ low: seconds <= 3 }"><div :style="{ width: timerPct + '%' }" /></div>
            <p class="muted">
              {{ game.phase === 'question' ? 'saat' : 'MASA TAMAT!' }} •
              {{ answeredCount }} / {{ connectedPlayers.length }} menjawab
            </p>
          </div>

          <!-- Mod pilihan: taburan jawapan -->
          <div v-if="game.mode === 'choice'" class="choices">
            <div
              v-for="c in choiceStats"
              :key="c.id"
              class="choice"
              :class="[c.cls, { dim: game.phase === 'reveal' && c.id !== correctId, right: game.phase === 'reveal' && c.id === correctId }]"
            >
              <span class="shape">{{ c.shape }}</span>
              <span class="label">{{ c.label }}</span>
              <span v-if="showAnswers" class="count">{{ c.count }}</span>
              <div v-if="showAnswers" class="fill" :style="{ width: (c.count / maxCount) * 100 + '%' }" />
            </div>
          </div>

          <!-- Mod taip: senarai jawapan + semakan manual -->
          <div v-else class="card answers">
            <h3>Jawapan peserta</h3>
            <p v-if="!currentAnswers.length" class="muted">Belum ada jawapan.</p>
            <ul v-else-if="!showAnswers" class="chips">
              <li v-for="a in currentAnswers" :key="a.pid">{{ a.name }}</li>
            </ul>
            <ul v-else class="answer-list">
              <li v-for="a in currentAnswers" :key="a.pid" :class="{ ok: a.correct }">
                <span class="who">{{ a.name }}</span>
                <span class="what">“{{ a.label }}”</span>
                <span class="toggle">
                  <button :class="{ on: a.correct }" title="Terima" @click="host.setOverride(a.pid, true)">✓</button>
                  <button :class="{ on: !a.correct }" title="Tolak" @click="host.setOverride(a.pid, false)">✗</button>
                </span>
              </li>
            </ul>
            <p v-if="showAnswers && currentAnswers.length" class="muted small">
              Disemak automatik — tekan ✓ / ✗ untuk membetulkan.
            </p>
          </div>

          <div v-if="game.phase === 'reveal'" class="card">
            <h3>Papan markah</h3>
            <ol class="leaderboard">
              <li v-for="r in leaderboard.slice(0, 5)" :key="r.pid">
                <span class="rank">{{ r.rank }}</span><span class="name">{{ r.name }}</span><span class="score">{{ r.score }}</span>
              </li>
            </ol>
          </div>
        </aside>
      </div>

      <footer class="controls">
        <template v-if="game.phase === 'question'">
          <button class="btn primary big" @click="host.closeTimer">⏹ Tamatkan masa</button>
          <button class="btn big" @click="host.next">{{ isLast ? 'Langkau ke keputusan' : 'Langkau soalan' }} ⏭</button>
        </template>
        <template v-else-if="game.phase === 'closed'">
          <button class="btn primary big" @click="host.reveal">👀 Dedah jawapan</button>
          <button class="btn big" @click="host.next">{{ isLast ? 'Langkau ke keputusan' : 'Langkau soalan' }} ⏭</button>
        </template>
        <template v-else>
          <button class="btn primary big" @click="host.next">{{ isLast ? '🏆 Keputusan akhir' : 'Soalan seterusnya ▶' }}</button>
        </template>
        <span class="spacer" />
        <button class="btn danger" @click="confirmEnd">Tamat permainan</button>
      </footer>
    </main>

    <!-- ================= KEPUTUSAN ================= -->
    <main v-else class="results">
      <h1>🏆 Keputusan Akhir</h1>
      <div class="podium">
        <div v-for="(r, i) in podium" :key="r.pid" class="step" :class="`p${i + 1}`">
          <div class="medal">{{ ['🥇', '🥈', '🥉'][i] }}</div>
          <div class="pname">{{ r.name }}</div>
          <div class="pscore">{{ r.score }}</div>
          <div class="block">{{ r.rank }}</div>
        </div>
      </div>
      <ol v-if="leaderboard.length > 3" class="leaderboard rest">
        <li v-for="r in leaderboard.slice(3)" :key="r.pid">
          <span class="rank">{{ r.rank }}</span><span class="name">{{ r.name }}</span><span class="score">{{ r.score }}</span>
        </li>
      </ol>
      <div v-if="quiz.reflection" class="card reflection">
        <span class="muted">💭 Refleksi</span>
        <p>{{ quiz.reflection }}</p>
      </div>
      <div class="controls center">
        <button class="btn primary big" @click="host.backToLobby">↺ Main semula (peserta sama)</button>
        <button class="btn big" @click="confirmNewGame">Permainan baharu</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.host { min-height: 100vh; display: flex; flex-direction: column; }
.bar { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.brand { font-weight: 800; color: var(--accent); text-decoration: none; margin-right: 8px; }
.spacer { flex: 1; }
.net-error { background: rgba(246, 196, 69, 0.15); color: var(--accent); padding: 8px 20px; margin: 0; }
.small { font-size: 0.85rem; }
h3 { margin: 0 0 12px; font-size: 1rem; }

/* Lobi */
.lobby { flex: 1; display: grid; grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr); gap: 20px; padding: 24px; max-width: 1200px; width: 100%; margin: 0 auto; }
@media (max-width: 760px) { .lobby { grid-template-columns: 1fr; padding: 16px; } }
.join { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
.scan-hint { font-weight: 600; font-size: 1.1rem; margin: 0; }
.qr { width: min(100%, 340px); border-radius: 12px; margin: 8px 0; }
.code { font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 800; letter-spacing: 0.15em; color: var(--accent); line-height: 1; }
.url { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-weight: 400; margin-top: 8px; }
.warn { background: rgba(246, 196, 69, 0.12); color: var(--accent); padding: 10px 12px; border-radius: 10px; font-size: 0.85rem; margin-top: 12px; }
.side { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.seg { display: flex; background: var(--bg); border-radius: 12px; padding: 4px; gap: 4px; }
.seg button { flex: 1; font: inherit; font-weight: 600; border: 0; border-radius: 9px; padding: 8px; background: transparent; color: var(--muted); cursor: pointer; }
.seg button.on { background: var(--accent); color: var(--accent-ink); }
.players { flex: 1; min-height: 160px; }
.chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.chips li { background: var(--surface-2); padding: 6px 8px 6px 14px; border-radius: 999px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.chips li.off { opacity: 0.45; }
.chips li button { border: 0; background: transparent; color: var(--muted); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0 4px; }
.answers .chips li { padding: 6px 14px; }

/* Soalan */
.stage { flex: 1; display: flex; flex-direction: column; gap: 16px; padding: 20px 24px; max-width: 1400px; width: 100%; margin: 0 auto; }
.q-head { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.q-head h2 { margin: 0; font-size: clamp(1.1rem, 2.4vw, 1.7rem); }
.q-body { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 20px; align-items: start; }
@media (max-width: 900px) { .q-body { grid-template-columns: 1fr; } }
.q-visual { position: relative; }
.answer-banner {
  position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%);
  background: var(--accent); color: var(--accent-ink); font-weight: 800; font-size: clamp(1rem, 2.4vw, 1.8rem);
  padding: 10px 24px; border-radius: 24px; width: max-content; max-width: 92%; text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
.q-text {
  min-height: 260px; display: flex; align-items: center; justify-content: center; text-align: center;
  font-size: clamp(1.4rem, 3.2vw, 2.6rem); font-weight: 800; line-height: 1.25; padding: 32px;
}
.answer-banner.inline { position: static; transform: none; margin: 14px auto 0; display: block; }
.why { margin-top: 14px; font-size: clamp(1rem, 1.6vw, 1.25rem); line-height: 1.5; border-color: rgba(246, 196, 69, 0.4); }
.quiz-list { display: flex; flex-direction: column; gap: 8px; }
.quiz-opt {
  font: inherit; text-align: left; color: var(--text); background: var(--bg); border: 2px solid var(--border);
  border-radius: 12px; padding: 10px 14px; cursor: pointer; display: flex; flex-direction: column; gap: 2px;
}
.quiz-opt small { color: var(--muted); }
.quiz-opt.on { border-color: var(--accent); background: rgba(246, 196, 69, 0.08); }
.reflection { max-width: 640px; margin: 0 auto 24px; text-align: left; }
.reflection p { font-size: 1.3rem; font-weight: 600; margin: 6px 0 0; }
.q-side { display: flex; flex-direction: column; gap: 14px; }
.timer { text-align: center; }
.timer p { margin: 10px 0 0; }
.secs { font-size: 4.5rem; font-weight: 800; line-height: 1; margin-bottom: 12px; font-variant-numeric: tabular-nums; }
.secs.low { color: var(--bad); animation: blink 0.5s infinite; }
.choices { display: grid; gap: 8px; }
.choice { position: relative; overflow: hidden; display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; font-weight: 600; transition: opacity 0.3s; }
.choice > * { position: relative; z-index: 1; }
.choice .fill { position: absolute; inset: 0 auto 0 0; background: rgba(0, 0, 0, 0.22); z-index: 0; transition: width 0.4s; }
.choice .label { flex: 1; }
.choice .count { font-weight: 800; font-size: 1.2rem; }
.choice.dim { opacity: 0.35; }
.choice.right { outline: 3px solid #fff; }
.answer-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; max-height: 340px; overflow: auto; }
.answer-list li { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: rgba(255, 107, 107, 0.12); }
.answer-list li.ok { background: rgba(61, 220, 132, 0.14); }
.who { font-weight: 600; min-width: 0; max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.what { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
.toggle { display: flex; gap: 4px; }
.toggle button { border: 1px solid var(--border); background: transparent; color: var(--muted); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-weight: 800; }
.toggle button.on:first-child { background: var(--good); color: #062; border-color: transparent; }
.toggle button.on:last-child { background: var(--bad); color: #400; border-color: transparent; }
.controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding-top: 8px; margin-top: auto; }
.controls.center { justify-content: center; }

/* Keputusan */
.results { flex: 1; padding: 32px 16px; max-width: 900px; width: 100%; margin: 0 auto; text-align: center; }
.results h1 { font-size: clamp(2rem, 5vw, 3rem); }
.podium { display: flex; justify-content: center; align-items: flex-end; gap: 12px; margin: 32px 0; }
.step { display: flex; flex-direction: column; align-items: center; width: min(30%, 200px); animation: rise 0.6s backwards; }
.step.p1 { order: 2; animation-delay: 0.6s; }
.step.p2 { order: 1; animation-delay: 0.3s; }
.step.p3 { order: 3; }
.medal { font-size: 2.6rem; }
.pname { font-weight: 800; font-size: 1.15rem; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pscore { color: var(--accent); font-weight: 800; margin-bottom: 8px; }
.block { width: 100%; background: var(--surface-2); border-radius: 12px 12px 0 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 10px; font-size: 2rem; font-weight: 800; color: var(--muted); }
.p1 .block { height: 160px; background: var(--accent); color: var(--accent-ink); }
.p2 .block { height: 115px; }
.p3 .block { height: 80px; }
.rest { max-width: 520px; margin: 0 auto 24px; text-align: left; }
@keyframes rise { from { opacity: 0; transform: translateY(40px); } }

.pop-enter-active, .pop-leave-active { transition: all 0.25s; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.8); }
</style>
