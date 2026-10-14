<script setup>
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { createPlayer, loadPlayerSession, lastUsedName } from '../lib/player.js'
import { useFullscreen } from '../lib/fullscreen.js'
import { celebrate } from '../lib/celebrate.js'

const props = defineProps({ code: { type: String, default: '' } })

const player = createPlayer()
const { state, remaining } = player
onUnmounted(player.destroy)
const fs = useFullscreen()

const saved = loadPlayerSession()
const codeInput = ref(props.code || saved?.code || '')
const nameInput = ref(saved?.name || lastUsedName())
const textAnswer = ref('')

const LETTERS = ['A', 'B', 'C', 'D']
const SHAPES = ['▲', '◆', '●', '■']

onMounted(() => {
  // Sambung semula secara automatik selepas refresh
  if (saved?.name && saved?.code && (!props.code || props.code === saved.code)) {
    player.join(saved.code, saved.name)
  }
})

function submitJoin() {
  if (!canJoin.value) return
  history.replaceState(null, '', `#/join/${codeInput.value.trim()}`)
  player.join(codeInput.value, nameInput.value)
}
const canJoin = computed(() => /^\d{4}$/.test(codeInput.value.trim()) && nameInput.value.trim().length > 0)

const snap = computed(() => state.snap)
const you = computed(() => snap.value?.you)
const answered = computed(() => you.value?.answered || state.pending !== null)
const seconds = computed(() => Math.ceil(remaining.value / 1000))
const timerPct = computed(() => (snap.value ? (remaining.value / (snap.value.duration * 1000)) * 100 : 0))
const myValueId = computed(() => you.value?.valueId ?? (typeof state.pending === 'number' ? state.pending : null))
const myValueLabel = computed(() => {
  if (you.value?.value) return you.value.value
  if (typeof state.pending === 'number') return snap.value?.question?.choices?.find((c) => c.id === state.pending)?.label
  return state.pending
})

// Konfeti di telefon apabila permainan tamat (selari dengan fanfara di skrin hos).
let celebrateTimer = null
watch(
  () => snap.value?.phase,
  (phase, prev) => {
    if (phase === 'end' && prev && prev !== 'end') celebrateTimer = setTimeout(() => celebrate({ scale: 0.6 }), 2000)
  },
)
onUnmounted(() => clearTimeout(celebrateTimer))

function pick(id) {
  player.answer(id)
}
function submitText() {
  const v = textAnswer.value.trim()
  if (!v) return
  player.answer(v)
  textAnswer.value = ''
}
function leave() {
  if (confirm('Keluar daripada permainan?')) {
    player.leave()
    location.hash = '#/'
  }
}
</script>

<template>
  <div class="play">
    <!-- ===== Borang sertai ===== -->
    <main v-if="state.status === 'idle' || (state.status === 'error' && !snap)" class="center">
      <form class="card join" @submit.prevent="submitJoin">
        <h1>Sertai kuiz</h1>
        <label for="code">Kod bilik</label>
        <input id="code" v-model="codeInput" inputmode="numeric" maxlength="4" placeholder="4821" class="code" autocomplete="off" />
        <label for="name">Nama anda</label>
        <input id="name" v-model="nameInput" maxlength="20" placeholder="cth. Aisyah" autocomplete="nickname" />
        <p v-if="state.error" class="error">{{ state.error }}</p>
        <button class="btn primary big" :disabled="!canJoin">Masuk ▶</button>
        <a href="#/" class="muted back">← Kembali</a>
      </form>
    </main>

    <main v-else-if="!snap" class="center">
      <div class="status-msg">
        <div class="spinner" />
        <p>Menyambung ke bilik {{ state.code }}…</p>
      </div>
    </main>

    <template v-else>
      <header class="bar">
        <span class="me">{{ you?.name }}</span>
        <span class="pill">⭐ {{ you?.score ?? 0 }}</span>
        <span v-if="snap.qIndex >= 0 && snap.phase !== 'end'" class="pill">S{{ snap.qIndex + 1 }}/{{ snap.total }}</span>
        <span class="spacer" />
        <button v-if="fs.supported" class="btn small ghost" title="Skrin penuh" @click="fs.toggle">
          {{ fs.isFullscreen.value ? '🗗' : '⛶' }}
        </button>
        <button class="btn small ghost" @click="leave">Keluar</button>
      </header>
      <p v-if="state.status === 'reconnecting'" class="reconnect"><span class="dot wait" /> Sambungan terputus — menyambung semula…</p>

      <!-- Lobi -->
      <main v-if="snap.phase === 'lobby'" class="center">
        <div class="status-msg">
          <div class="big-emoji">🎉</div>
          <h2>Anda sudah masuk!</h2>
          <p v-if="snap.quizTitle" class="quiz-title">{{ snap.quizTitle }}</p>
          <p class="muted">Tunggu hos memulakan permainan.<br />{{ snap.playerCount }} peserta dalam bilik.</p>
        </div>
      </main>

      <!-- Soalan -->
      <main v-else-if="snap.phase === 'question'" class="question">
        <img v-if="snap.question.image" :src="snap.question.image" alt="" class="qimg" />
        <div class="timer-row">
          <div class="timer-bar" :class="{ low: seconds <= 3 }"><div :style="{ width: timerPct + '%' }" /></div>
          <span class="secs" :class="{ low: seconds <= 3 }">{{ seconds }}</span>
        </div>
        <p class="prompt" :class="{ big: !snap.question.image }">{{ snap.question.prompt }}</p>

        <div v-if="answered" class="sent">
          <div class="big-emoji">✅</div>
          <p>Jawapan dihantar</p>
          <p class="muted">“{{ myValueLabel }}”</p>
        </div>

        <div v-else-if="snap.mode === 'choice'" class="choices">
          <button
            v-for="(c, i) in snap.question.choices"
            :key="c.id"
            class="choice"
            :class="`choice-${'abcd'[i]}`"
            :disabled="remaining <= 0"
            @click="pick(c.id)"
          >
            <span class="shape">{{ SHAPES[i] }}</span>
            <span>{{ c.label }}</span>
          </button>
        </div>

        <form v-else class="text-form" @submit.prevent="submitText">
          <input v-model="textAnswer" maxlength="40" placeholder="Taip jawapan anda…" autocomplete="off" enterkeyhint="send" />
          <button class="btn primary big" :disabled="!textAnswer.trim() || remaining <= 0">Hantar</button>
        </form>
      </main>

      <!-- Masa tamat -->
      <main v-else-if="snap.phase === 'closed'" class="center">
        <div class="status-msg">
          <div class="big-emoji">⏰</div>
          <h2>Masa tamat!</h2>
          <p v-if="answered" class="muted">Jawapan anda: “{{ myValueLabel }}”</p>
          <p v-else class="muted">Anda tidak sempat menjawab.</p>
          <p class="muted">Tunggu hos dedahkan jawapan…</p>
        </div>
      </main>

      <!-- Jawapan didedahkan -->
      <main v-else-if="snap.phase === 'reveal'" class="center">
        <div class="result" :class="you?.correct ? 'good' : 'bad'">
          <div class="big-emoji">{{ you?.correct ? '🎯' : answered ? '😅' : '💤' }}</div>
          <h2>{{ you?.correct ? 'Betul!' : answered ? 'Kurang tepat' : 'Tiada jawapan' }}</h2>
          <p v-if="you?.correct" class="gain">+{{ you.points }}</p>
          <p class="muted">Jawapan: <b>{{ snap.answer }}</b></p>
          <p v-if="snap.why" class="why">💡 {{ snap.why }}</p>
          <p v-if="answered && !you?.correct" class="muted">Anda jawab: “{{ myValueLabel }}”</p>
          <p class="rank">Kedudukan anda: <b>#{{ you?.rank }}</b> daripada {{ snap.playerCount }}</p>
        </div>
      </main>

      <!-- Tamat -->
      <main v-else-if="snap.phase === 'end'" class="center">
        <div class="status-msg final">
          <div class="big-emoji">{{ ['🥇', '🥈', '🥉'][you?.rank - 1] ?? '🏁' }}</div>
          <h2>Permainan tamat!</h2>
          <p>Kedudukan <b>#{{ you?.rank }}</b> • {{ you?.score }} mata</p>
          <ol class="leaderboard">
            <li v-for="(r, i) in snap.leaderboard" :key="i" :class="{ me: r.name === you?.name }">
              <span class="rank">{{ r.rank }}</span><span class="name">{{ r.name }}</span><span class="score">{{ r.score }}</span>
            </li>
          </ol>
        </div>
      </main>
    </template>
  </div>
</template>

<style scoped>
.play { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
.join { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 8px; }
.join h1 { font-size: 1.6rem; margin-bottom: 8px; }
.join label { font-size: 0.85rem; color: var(--muted); margin-top: 6px; }
.join .code { font-size: 1.8rem; letter-spacing: 0.3em; text-align: center; font-weight: 800; }
.join .btn { margin-top: 12px; }
.back { text-align: center; text-decoration: none; font-size: 0.9rem; margin-top: 4px; }
.error { color: var(--bad); margin: 6px 0 0; font-size: 0.9rem; }

.bar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
.me { font-weight: 800; max-width: 40vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.reconnect { margin: 0; padding: 8px 16px; background: rgba(246, 196, 69, 0.15); color: var(--accent); display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }

.status-msg { text-align: center; max-width: 420px; width: 100%; }
.big-emoji { font-size: 4rem; line-height: 1.2; }
.spinner { width: 44px; height: 44px; border-radius: 50%; border: 4px solid var(--border); border-top-color: var(--accent); margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.question { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 12px 16px 20px; max-width: 640px; width: 100%; margin: 0 auto; }
.timer-row { display: flex; align-items: center; gap: 12px; }
.timer-row .timer-bar { flex: 1; }
.secs { font-weight: 800; font-size: 1.5rem; width: 2ch; text-align: right; font-variant-numeric: tabular-nums; }
.secs.low { color: var(--bad); }
.prompt { font-weight: 600; font-size: 1.1rem; margin: 0; }
.prompt.big { font-size: 1.35rem; font-weight: 800; line-height: 1.35; padding: 8px 0; }
.quiz-title { color: var(--accent); font-weight: 600; }
.why { text-align: left; background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 12px 14px; font-size: 0.95rem; line-height: 1.5; }
.choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; min-height: 200px; }
.choice {
  font: inherit; font-weight: 800; font-size: 1.05rem; color: #fff; border: 0; border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 10px;
  cursor: pointer; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); transition: transform 0.08s;
}
.choice:active { transform: scale(0.96); }
.choice:disabled { opacity: 0.5; }
.choice .shape { font-size: 1.6rem; }
.choice span:last-child { font-size: clamp(0.85rem, 3.6vw, 1.05rem); line-height: 1.3; }
.text-form { display: flex; flex-direction: column; gap: 10px; }
.text-form input { font-size: 1.3rem; padding: 16px; }
.sent { text-align: center; padding: 20px 0; }
.sent p { margin: 4px 0; }

.result { text-align: center; max-width: 420px; width: 100%; padding: 28px 20px; border-radius: var(--radius); }
.result.good { background: rgba(61, 220, 132, 0.14); }
.result.bad { background: rgba(255, 107, 107, 0.12); }
.result h2 { font-size: 2rem; margin-bottom: 4px; }
.gain { font-size: 2.4rem; font-weight: 800; color: var(--good); margin: 0 0 8px; }
.rank { margin-top: 16px; font-size: 1.1rem; }
.final .leaderboard { margin-top: 20px; text-align: left; }
.leaderboard li.me { outline: 2px solid var(--accent); }
</style>
