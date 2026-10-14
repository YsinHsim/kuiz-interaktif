<script setup>
import { ref } from 'vue'
import { QUIZZES } from '../quizzes/index.js'

const code = ref('')
function join() {
  location.hash = `#/join/${code.value.trim()}`
}
</script>

<template>
  <main class="home">
    <div class="hero">
      <p class="eyebrow">Ice breaking • Latihan • Kuiz langsung</p>
      <h1>Kuiz<br /><span>Interaktif</span></h1>
      <p class="lead">Hos paparkan soalan di skrin besar, peserta jawab di telefon. Jawab pantas, kumpul mata, rebut tempat teratas!</p>
      <a href="#/panduan" class="btn small guide-link">📖 Panduan cara bermain</a>
    </div>

    <div class="cards">
      <form class="card" @submit.prevent="join">
        <h2>Saya peserta</h2>
        <label for="code">Kod bilik</label>
        <input id="code" v-model="code" inputmode="numeric" maxlength="4" placeholder="cth. 4821" autocomplete="off" />
        <button class="btn primary" :disabled="code.trim().length !== 4">Sertai</button>
      </form>

      <div class="card">
        <h2>Saya hos</h2>
        <p class="muted">Paparkan skrin ini pada projektor. Peserta imbas kod QR untuk masuk.</p>
        <a class="btn" href="#/host">Mulakan sebagai hos</a>
      </div>
    </div>

    <section class="quizzes">
      <h2>Kuiz tersedia</h2>
      <ul>
        <li v-for="q in QUIZZES" :key="q.id">
          <span class="cat">{{ q.category }}</span>
          <b>{{ q.title }}</b>
          <small class="muted">{{ q.questions.length }} soalan • {{ q.subtitle }}</small>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: 920px;
  margin: 0 auto;
  padding: 48px 16px;
}
.hero { text-align: center; margin-bottom: 40px; }
.eyebrow { color: var(--accent); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.85rem; }
h1 { font-size: clamp(2.2rem, 7vw, 4rem); line-height: 1.05; margin: 12px 0; font-weight: 800; }
h1 span { color: var(--accent); }
.lead { color: var(--muted); max-width: 520px; margin: 0 auto; }
.guide-link { margin-top: 16px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.card { display: flex; flex-direction: column; gap: 12px; }
.card h2 { margin: 0; font-size: 1.3rem; }
.card .btn { margin-top: auto; }
label { font-size: 0.85rem; color: var(--muted); }
.quizzes { margin-top: 32px; }
.quizzes h2 { font-size: 1rem; color: var(--muted); font-weight: 600; text-align: center; margin-bottom: 12px; }
.quizzes ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.quizzes li { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 14px; border: 1px dashed var(--border); }
.cat { font-size: 0.8rem; font-weight: 600; color: var(--accent); }
input { font-size: 1.6rem; letter-spacing: 0.3em; text-align: center; }
</style>
