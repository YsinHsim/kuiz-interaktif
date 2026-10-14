// Kesan bunyi dijana dengan Web Audio API — tiada fail audio tambahan.
let ctx = null
let master = null

function audio() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Panggil semasa klik pengguna supaya pelayar membenarkan bunyi kemudian (cth. apabila pemasa tamat sendiri).
export function unlockAudio() {
  audio()
}

function tone({ freq, type = 'sine', start, dur, gain = 0.3, attack = 0.005 }) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g).connect(master)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

// Loceng "ding-dong" apabila masa tamat / semua sudah menjawab.
export function playTimeUp() {
  if (!audio()) return
  const t = ctx.currentTime + 0.05
  for (const [freq, at] of [[987.77, 0], [783.99, 0.32]]) {
    tone({ freq, start: t + at, dur: 1.4, gain: 0.28 })
    tone({ freq: freq * 2.76, start: t + at, dur: 0.5, gain: 0.05 }) // separa loceng
    tone({ freq: freq / 2, start: t + at, dur: 1.0, gain: 0.08 })
  }
}

function noiseBuffer() {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

// Gulungan dram (crescendo) diikuti fanfara. Pulangkan masa (ms) sehingga fanfara bermula.
export function playDrumrollFanfare(rollSeconds = 1.6) {
  if (!audio()) return 0
  const t0 = ctx.currentTime + 0.05
  const buf = noiseBuffer()

  // Gulungan dram: letupan bunyi bising pendek yang semakin kuat
  const hits = Math.floor(rollSeconds / 0.045)
  for (let i = 0; i < hits; i++) {
    const at = t0 + i * 0.045
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 0.8
    const g = ctx.createGain()
    const level = 0.05 + 0.25 * (i / hits)
    g.gain.setValueAtTime(level, at)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
    src.connect(bp).connect(g).connect(master)
    src.start(at)
    src.stop(at + 0.08)
  }

  // Fanfara: arpeggio naik + kord C major
  const f0 = t0 + rollSeconds
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    tone({ freq, type: 'triangle', start: f0 + i * 0.11, dur: 0.25, gain: 0.25 })
    tone({ freq, type: 'square', start: f0 + i * 0.11, dur: 0.18, gain: 0.04 })
  })
  const chordAt = f0 + notes.length * 0.11
  for (const freq of [523.25, 659.25, 783.99, 1046.5]) {
    tone({ freq, type: 'triangle', start: chordAt, dur: 1.8, gain: 0.18, attack: 0.02 })
    tone({ freq, type: 'sawtooth', start: chordAt, dur: 1.2, gain: 0.025, attack: 0.02 })
  }
  // Simbal
  const cym = ctx.createBufferSource()
  cym.buffer = buf
  cym.loop = true
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const cg = ctx.createGain()
  cg.gain.setValueAtTime(0.25, chordAt)
  cg.gain.exponentialRampToValueAtTime(0.0001, chordAt + 1.5)
  cym.connect(hp).connect(cg).connect(master)
  cym.start(chordAt)
  cym.stop(chordAt + 1.6)

  return (chordAt - ctx.currentTime) * 1000
}

// Kecilkan muzik secara beransur-ansur dan bukannya berhenti mengejut.
export function fadeOut(el, ms = 450) {
  if (el.paused) return
  const token = (el._fade = Symbol())
  const startAt = performance.now()
  const step = () => {
    if (el._fade !== token) return // dibatalkan oleh cancelFade()
    const k = Math.min(1, (performance.now() - startAt) / ms)
    el.volume = 1 - k
    if (k < 1) requestAnimationFrame(step)
    else {
      el.pause()
      el.volume = 1
      el._fade = null
    }
  }
  requestAnimationFrame(step)
  // rAF tidak berjalan dalam tab tersembunyi — pastikan muzik tetap berhenti.
  setTimeout(() => {
    if (el._fade !== token) return
    el.pause()
    el.volume = 1
    el._fade = null
  }, ms + 100)
}

export function cancelFade(el) {
  el._fade = null
  el.volume = 1
}
