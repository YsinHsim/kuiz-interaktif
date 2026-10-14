<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({ stats: { type: Array, required: true } })

const NEEDS_REVIEW = 50 // < 50% betul → perlu diterangkan semula
const MASTERED = 80

const sortBy = ref('order') // 'order' | 'hardest'
const open = ref(null)
const grown = ref(false) // mula bar pada 0% kemudian "tumbuh"
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => (grown.value = true))))

const rows = computed(() => {
  const list = [...props.stats]
  if (sortBy.value === 'hardest') list.sort((a, b) => a.correctPct - b.correctPct || a.index - b.index)
  return list
})

const overall = computed(() => {
  const asked = props.stats.filter((s) => s.total)
  if (!asked.length) return 0
  return Math.round(asked.reduce((sum, s) => sum + s.correctPct, 0) / asked.length)
})
const easiest = computed(() => [...props.stats].sort((a, b) => b.correctPct - a.correctPct)[0])
const hardest = computed(() => [...props.stats].sort((a, b) => a.correctPct - b.correctPct)[0])
const reviewCount = computed(() => props.stats.filter((s) => s.correctPct < NEEDS_REVIEW).length)

const verdict = computed(() => {
  const v = overall.value
  if (v >= 80) return '🌟 Cemerlang! Peserta menguasai topik ini.'
  if (v >= 60) return '👍 Bagus — beberapa soalan perlu diulang kaji.'
  if (v >= 40) return '🤔 Sederhana — wajar terangkan semula soalan yang ditanda.'
  return '📚 Ramai keliru — ulang kaji soalan bersama peserta.'
})

const label = (s) => s.word ?? s.prompt
const fmtSec = (x) => (x == null ? '—' : `${x.toFixed(1)}s`)
const toggle = (i) => (open.value = open.value === i ? null : i)
</script>

<template>
  <div class="qs">
    <div class="summary">
      <div class="tile ring-tile">
        <div class="ring" :style="{ '--p': grown ? overall : 0 }">
          <span>{{ overall }}<small>%</small></span>
        </div>
        <div>
          <b>Ketepatan keseluruhan</b>
          <p class="muted">{{ verdict }}</p>
        </div>
      </div>
      <div v-if="easiest" class="tile good">
        <span class="tile-label">🌟 Paling mudah</span>
        <b>S{{ easiest.index + 1 }} — {{ easiest.correctPct }}% betul</b>
        <p class="muted clamp">{{ label(easiest) }}</p>
      </div>
      <div v-if="hardest" class="tile bad">
        <span class="tile-label">🧠 Paling mencabar</span>
        <b>S{{ hardest.index + 1 }} — {{ hardest.correctPct }}% betul</b>
        <p class="muted clamp">{{ label(hardest) }}</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="legend">
        <span><i class="sw c" />Betul</span><span><i class="sw w" />Salah</span><span><i class="sw n" />Tiada jawapan</span>
      </div>
      <span v-if="reviewCount" class="pill warn">⚠️ {{ reviewCount }} soalan perlu diterangkan</span>
      <span class="spacer" />
      <div class="seg">
        <button :class="{ on: sortBy === 'order' }" @click="sortBy = 'order'">Ikut susunan</button>
        <button :class="{ on: sortBy === 'hardest' }" @click="sortBy = 'hardest'">Paling sukar dahulu</button>
      </div>
    </div>

    <TransitionGroup name="row" tag="ul" class="rows">
      <li
        v-for="(s, i) in rows"
        :key="s.index"
        class="row"
        :class="{ review: s.correctPct < NEEDS_REVIEW, open: open === s.index }"
      >
        <button class="row-head" :aria-expanded="open === s.index" @click="toggle(s.index)">
          <span class="qno">S{{ s.index + 1 }}</span>
          <span class="qtext">
            <span class="clamp">{{ label(s) }}</span>
            <span v-if="s.correctPct < NEEDS_REVIEW" class="badge warn">⚠️ Perlu diterangkan</span>
            <span v-else-if="s.correctPct >= MASTERED" class="badge ok">✅ Dikuasai</span>
          </span>
          <span class="bar" :title="`${s.correct} betul • ${s.wrong} salah • ${s.none} tiada jawapan`">
            <span class="seg-c" :style="{ width: (grown ? s.correctPct : 0) + '%', transitionDelay: i * 90 + 'ms' }">
              <em v-if="s.correctPct >= 12">{{ s.correctPct }}%</em>
            </span>
            <span class="seg-w" :style="{ width: (grown ? s.wrongPct : 0) + '%', transitionDelay: i * 90 + 'ms' }">
              <em v-if="s.wrongPct >= 12">{{ s.wrongPct }}%</em>
            </span>
            <span class="seg-n" :style="{ width: (grown ? s.nonePct : 0) + '%', transitionDelay: i * 90 + 'ms' }" />
          </span>
          <span class="chev">{{ open === s.index ? '▴' : '▾' }}</span>
        </button>

        <div v-if="open === s.index" class="detail">
          <p v-if="s.word" class="prompt">{{ s.prompt }}</p>
          <div class="facts">
            <div><small>✅ Jawapan betul</small><b>{{ s.answer }}</b></div>
            <div v-if="s.topWrong">
              <small>❌ Jawapan salah paling popular</small>
              <b>“{{ s.topWrong.label }}”</b> <span class="muted">— {{ s.topWrong.count }} orang</span>
            </div>
            <div><small>⏱️ Purata masa (betul)</small><b>{{ fmtSec(s.avgSec) }}</b></div>
            <div>
              <small>👥 Taburan</small>
              <b>{{ s.correct }} betul • {{ s.wrong }} salah • {{ s.none }} tiada</b>
            </div>
          </div>
          <p v-if="s.why" class="why">💡 {{ s.why }}</p>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.qs { text-align: left; display: flex; flex-direction: column; gap: 16px; }
.summary { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 12px; }
@media (max-width: 760px) { .summary { grid-template-columns: 1fr; } }
.tile { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.tile p { margin: 0; }
.tile-label { font-size: 0.85rem; color: var(--muted); font-weight: 600; }
.tile.good { border-color: rgba(61, 220, 132, 0.45); }
.tile.bad { border-color: rgba(255, 107, 107, 0.45); }
.ring-tile { flex-direction: row; align-items: center; gap: 16px; }
.ring {
  --p: 0;
  flex: none; width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center;
  background: conic-gradient(var(--good) calc(var(--p) * 1%), rgba(255, 255, 255, 0.1) 0);
  transition: --p 1.2s ease-out;
  position: relative;
}
.ring::before { content: ''; position: absolute; inset: 10px; border-radius: 50%; background: var(--bg-2); }
.ring span { position: relative; font-size: 1.7rem; font-weight: 800; }
.ring small { font-size: 0.9rem; }
.clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.spacer { flex: 1; }
.legend { display: flex; gap: 14px; font-size: 0.85rem; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.sw.c, .seg-c { background: var(--good); }
.sw.w, .seg-w { background: var(--bad); }
.sw.n, .seg-n { background: rgba(255, 255, 255, 0.16); }
.pill.warn { background: rgba(246, 196, 69, 0.15); color: var(--accent); }
.seg { display: flex; background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; padding: 3px; gap: 3px; }
.seg button { font: inherit; font-size: 0.85rem; font-weight: 600; border: 0; border-radius: 9px; padding: 6px 12px; background: transparent; color: var(--muted); cursor: pointer; }
.seg button.on { background: var(--accent); color: var(--accent-ink); }

.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.row { background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.row.review { border-color: rgba(246, 196, 69, 0.5); }
.row-head {
  font: inherit; color: inherit; background: transparent; border: 0; width: 100%; cursor: pointer; text-align: left;
  display: grid; grid-template-columns: auto minmax(0, 1.1fr) minmax(0, 1.4fr) auto; align-items: center; gap: 14px; padding: 12px 16px;
}
.row-head:hover { background: rgba(255, 255, 255, 0.03); }
@media (max-width: 760px) {
  .row-head { grid-template-columns: auto minmax(0, 1fr) auto; }
  .bar { grid-column: 1 / -1; }
}
.qno { font-weight: 800; color: var(--accent); width: 3ch; }
.qtext { display: flex; flex-direction: column; gap: 4px; font-weight: 600; min-width: 0; }
.badge { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; width: fit-content; }
.badge.warn { background: rgba(246, 196, 69, 0.18); color: var(--accent); animation: pulse 1.6s 3s 3; }
.badge.ok { background: rgba(61, 220, 132, 0.15); color: var(--good); }
@keyframes pulse { 50% { transform: scale(1.08); } }
.bar { display: flex; height: 30px; border-radius: 8px; overflow: hidden; background: rgba(255, 255, 255, 0.06); }
.bar > span { display: flex; align-items: center; justify-content: center; transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); overflow: hidden; }
.bar em { font-style: normal; font-weight: 800; font-size: 0.85rem; color: #08140e; white-space: nowrap; }
.seg-w em { color: #2a0606; }
.chev { color: var(--muted); }

.detail { padding: 0 16px 16px; border-top: 1px solid var(--border); animation: drop 0.25s; }
.detail .prompt { margin: 12px 0 0; font-weight: 600; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px; }
.facts small { display: block; color: var(--muted); font-size: 0.8rem; margin-bottom: 2px; }
.why { margin: 12px 0 0; padding: 12px 14px; border-radius: 12px; background: rgba(246, 196, 69, 0.1); line-height: 1.5; }
@keyframes drop { from { opacity: 0; transform: translateY(-6px); } }
.row-move { transition: transform 0.45s; }
</style>
