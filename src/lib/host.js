import { reactive, ref, computed, watch } from 'vue'
import { Peer } from 'peerjs'
import { QUIZZES, getQuiz, correctIndex, answerText } from '../quizzes/index.js'
import { isMatch } from './match.js'
import { cancelFade, fadeOut, playTimeUp, unlockAudio } from './sfx.js'
import { hostPeerId, PEER_OPTIONS, pointsFor, randomCode, shuffle } from './net.js'

const STORAGE_KEY = 'kuiz-host-v1'
const RESUME_WINDOW_MS = 3 * 60 * 60 * 1000

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && Date.now() - saved.savedAt < RESUME_WINDOW_MS) return saved
  } catch {}
  return null
}

// Susunan pilihan jawapan bagi setiap soalan (dirawak jika kuiz membenarkan).
function makeOrder(quiz) {
  return quiz.questions.map((q) => {
    const idx = q.choices.map((_, i) => i)
    return quiz.shuffle ? shuffle(idx) : idx
  })
}

function freshGame(code, settings = {}) {
  const quiz = getQuiz(settings.quizId ?? QUIZZES[0].id)
  return {
    code,
    quizId: quiz.id,
    mode: quiz.modes.includes(settings.mode) ? settings.mode : 'choice', // 'choice' | 'text'
    duration: settings.duration ?? quiz.defaultDuration ?? 10,
    phase: 'lobby', // lobby | question | closed | reveal | end
    qIndex: -1,
    choiceOrder: makeOrder(quiz),
    startedAt: 0,
    deadline: 0,
    players: {}, // pid -> { pid, name, connected, joinedAt, answers: { [q]: { value, ms, auto, override } } }
  }
}

export function createHost() {
  const saved = loadSaved()
  const game = reactive(saved?.game ?? freshGame(randomCode()))
  game.quizId ??= QUIZZES[0].id
  for (const p of Object.values(game.players)) p.connected = false
  if (game.phase === 'question' && Date.now() >= game.deadline) game.phase = 'closed'

  const net = reactive({ status: 'connecting', error: '' })
  const now = ref(Date.now())
  const soundOn = ref(true)
  const conns = new Map() // pid -> DataConnection
  const audio = new Audio('/audio/timer.m4a')

  let peer = null
  let idRetries = 0

  // ---------- derived ----------
  const quiz = computed(() => getQuiz(game.quizId))
  const total = computed(() => quiz.value.questions.length)
  const question = computed(() => quiz.value.questions[game.qIndex] ?? null)
  const durationMs = computed(() => game.duration * 1000)
  const remaining = computed(() =>
    game.phase === 'question' ? Math.max(0, game.deadline - now.value) : 0,
  )

  function answerResult(a) {
    if (!a) return { correct: false, points: 0 }
    const correct = a.override ?? a.auto
    return { correct, points: correct ? pointsFor(a.ms, durationMs.value) : 0 }
  }

  const players = computed(() => Object.values(game.players))
  const connectedPlayers = computed(() => players.value.filter((p) => p.connected))

  const leaderboard = computed(() =>
    players.value
      .map((p) => ({
        pid: p.pid,
        name: p.name,
        connected: p.connected,
        score: Object.values(p.answers).reduce((sum, a) => sum + answerResult(a).points, 0),
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      // Markah sama = kedudukan sama
      .map((row, _, rows) => ({ ...row, rank: rows.findIndex((r) => r.score === row.score) + 1 })),
  )

  const currentAnswers = computed(() =>
    players.value
      .filter((p) => p.answers[game.qIndex])
      .map((p) => {
        const a = p.answers[game.qIndex]
        return { pid: p.pid, name: p.name, ...a, ...answerResult(a), label: labelFor(a.value) }
      })
      .sort((a, b) => a.ms - b.ms),
  )

  // Analisis setiap soalan yang telah dimainkan — untuk skrin keputusan akhir.
  // Peratus dikira daripada semua peserta (yang tidak menjawab dikira "tiada jawapan").
  const questionStats = computed(() => {
    const n = players.value.length
    return quiz.value.questions.slice(0, game.qIndex + 1).map((q, i) => {
      let correct = 0
      let wrong = 0
      let msSum = 0
      const wrongCounts = new Map()
      for (const p of players.value) {
        const a = p.answers[i]
        if (!a) continue
        if (answerResult(a).correct) {
          correct++
          msSum += a.ms
        } else {
          wrong++
          const label = typeof a.value === 'number' ? q.choices[a.value] : a.value
          const key = String(label).trim().toLowerCase()
          const entry = wrongCounts.get(key) ?? { label, count: 0 }
          entry.count++
          wrongCounts.set(key, entry)
        }
      }
      const pct = (x) => (n ? Math.round((x / n) * 100) : 0)
      return {
        index: i,
        prompt: q.prompt,
        word: q.word ?? null,
        answer: answerText(q),
        why: q.why ?? null,
        total: n,
        correct,
        wrong,
        none: n - correct - wrong,
        correctPct: pct(correct),
        wrongPct: pct(wrong),
        nonePct: n ? 100 - pct(correct) - pct(wrong) : 0,
        avgSec: correct ? msSum / correct / 1000 : null,
        topWrong: [...wrongCounts.values()].sort((a, b) => b.count - a.count)[0] ?? null,
      }
    })
  })

  function labelFor(value) {
    if (typeof value === 'number') return question.value?.choices[value] ?? '?'
    return value
  }

  // ---------- networking ----------
  function snapshotFor(pid) {
    const p = game.players[pid]
    const q = question.value
    const showAnswer = game.phase === 'reveal' || game.phase === 'end'
    const a = p?.answers[game.qIndex]
    const res = answerResult(a)
    const row = leaderboard.value.find((r) => r.pid === pid)
    return {
      t: 'state',
      phase: game.phase,
      mode: game.mode,
      qIndex: game.qIndex,
      quizTitle: quiz.value.title,
      total: total.value,
      duration: game.duration,
      remaining: remaining.value,
      question: q && {
        image: q.image,
        prompt: q.prompt,
        choices:
          game.mode === 'choice'
            ? game.choiceOrder[game.qIndex].map((i) => ({ id: i, label: q.choices[i] }))
            : null,
      },
      answer: showAnswer && q ? answerText(q) : null,
      why: showAnswer && q ? (q.why ?? null) : null,
      correctId: showAnswer && game.mode === 'choice' ? correctIndex(q) : null,
      you: p && {
        name: p.name,
        score: row?.score ?? 0,
        rank: row?.rank ?? null,
        answered: !!a,
        value: a ? labelFor(a.value) : null,
        valueId: typeof a?.value === 'number' ? a.value : null,
        correct: showAnswer ? res.correct : null,
        points: showAnswer ? res.points : null,
      },
      playerCount: players.value.length,
      leaderboard: showAnswer ? leaderboard.value.slice(0, 5).map(({ name, score, rank }) => ({ name, score, rank })) : null,
    }
  }

  function send(pid, msg) {
    const conn = conns.get(pid)
    if (conn?.open) {
      try {
        conn.send(msg)
      } catch {}
    }
  }

  let syncQueued = false
  function sync() {
    if (syncQueued) return
    syncQueued = true
    queueMicrotask(() => {
      syncQueued = false
      for (const pid of conns.keys()) send(pid, snapshotFor(pid))
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ game, savedAt: Date.now() }))
      } catch {}
    })
  }
  watch(game, sync, { deep: true })

  function uniqueName(name, pid) {
    const taken = (n) =>
      players.value.some((p) => p.pid !== pid && p.name.toLowerCase() === n.toLowerCase())
    if (!taken(name)) return name
    let i = 2
    while (taken(`${name} ${i}`)) i++
    return `${name} ${i}`
  }

  function handleData(conn, msg) {
    if (!msg || typeof msg !== 'object') return
    if (msg.t === 'join') {
      const pid = String(msg.pid || '').slice(0, 40)
      const name = String(msg.name || '').trim().slice(0, 20)
      if (!pid || !name) return
      const old = conns.get(pid)
      if (old && old !== conn) old.close()
      conns.set(pid, conn)
      conn.pid = pid
      const existing = game.players[pid]
      if (existing) {
        existing.connected = true
        if (existing.name.toLowerCase() !== name.toLowerCase()) existing.name = uniqueName(name, pid)
      } else {
        game.players[pid] = { pid, name: uniqueName(name, pid), connected: true, joinedAt: Date.now(), answers: {} }
      }
      send(pid, snapshotFor(pid))
      return
    }
    if (msg.t === 'answer') {
      const p = game.players[conn.pid]
      if (!p || game.phase !== 'question' || msg.q !== game.qIndex || p.answers[game.qIndex]) return
      const t = Date.now()
      if (t > game.deadline + 500) return
      const q = question.value
      let value, auto
      if (game.mode === 'choice') {
        value = Number(msg.value)
        if (!Number.isInteger(value) || value < 0 || value >= q.choices.length) return
        auto = value === correctIndex(q)
      } else {
        value = String(msg.value ?? '').trim().slice(0, 40)
        if (!value) return
        auto = isMatch(value, q.accept)
      }
      p.answers[game.qIndex] = { value, ms: Math.max(0, t - game.startedAt), auto, override: null }
      maybeAutoClose()
    }
  }

  function setupConnection(conn) {
    conn.on('data', (msg) => handleData(conn, msg))
    conn.on('close', () => {
      if (conn.pid && conns.get(conn.pid) === conn) {
        conns.delete(conn.pid)
        if (game.players[conn.pid]) game.players[conn.pid].connected = false
      }
    })
    conn.on('error', () => {})
  }

  function startPeer() {
    net.status = 'connecting'
    net.error = ''
    peer = new Peer(hostPeerId(game.code), PEER_OPTIONS)
    peer.on('open', () => {
      idRetries = 0
      net.status = 'ready'
    })
    peer.on('connection', setupConnection)
    peer.on('disconnected', () => {
      if (peer && !peer.destroyed) {
        net.status = 'connecting'
        setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1000)
      }
    })
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // ID mungkin masih dipegang oleh tab lama (cth. selepas refresh). Cuba lagi sebentar,
        // atau guna kod baharu jika permainan belum bermula.
        peer.destroy()
        idRetries++
        if (game.phase === 'lobby' && players.value.length === 0) {
          game.code = randomCode()
          startPeer()
        } else if (idRetries <= 10) {
          net.status = 'connecting'
          net.error = 'Menuntut semula kod bilik…'
          setTimeout(startPeer, 3000)
        } else {
          net.status = 'error'
          net.error = `Kod ${game.code} sedang digunakan oleh tab lain. Tutup tab tersebut atau mulakan permainan baharu.`
        }
        return
      }
      if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
        net.status = 'connecting'
        net.error = 'Sambungan ke pelayan terputus. Mencuba semula…'
        // PeerJS memusnahkan peer jika sambungan pertama gagal — cipta semula.
        if (peer.destroyed) setTimeout(startPeer, 3000)
        return
      }
      console.warn('[host] peer error', err.type, err)
    })
  }

  // ---------- timer ----------
  const tick = setInterval(() => {
    now.value = Date.now()
    if (game.phase === 'question' && now.value >= game.deadline) closeTimer()
  }, 100)

  // Hantar "ping" supaya peserta tahu hos masih hidup.
  const heartbeat = setInterval(() => {
    for (const pid of conns.keys()) send(pid, { t: 'ping', remaining: remaining.value })
  }, 3000)

  function maybeAutoClose() {
    const online = connectedPlayers.value
    if (game.phase === 'question' && online.length > 0 && online.every((p) => p.answers[game.qIndex])) {
      setTimeout(() => {
        if (game.phase === 'question') closeTimer()
      }, 600)
    }
  }

  function playSound() {
    if (!soundOn.value) return
    cancelFade(audio)
    audio.currentTime = 0
    audio.loop = game.duration > 11
    audio.play().catch(() => {})
  }
  function stopSound() {
    fadeOut(audio)
  }
  watch(soundOn, (on) => (on ? game.phase === 'question' && playSound() : stopSound()))

  // ---------- actions ----------
  function startQuestion(i) {
    for (const p of players.value) delete p.answers[i]
    game.qIndex = i
    game.startedAt = Date.now()
    game.deadline = game.startedAt + durationMs.value
    game.phase = 'question'
    now.value = Date.now()
    playSound()
  }

  function start() {
    unlockAudio()
    for (const p of players.value) p.answers = {}
    game.choiceOrder = makeOrder(quiz.value)
    startQuestion(0)
  }

  function closeTimer() {
    if (game.phase !== 'question') return
    game.phase = 'closed'
    game.deadline = Date.now()
    stopSound()
    if (soundOn.value) playTimeUp()
  }

  function reveal() {
    closeTimer()
    game.phase = 'reveal'
  }

  function next() {
    stopSound()
    if (game.qIndex + 1 < total.value) startQuestion(game.qIndex + 1)
    else end()
  }

  function end() {
    stopSound()
    game.phase = 'end'
  }

  function backToLobby() {
    stopSound()
    for (const p of players.value) p.answers = {}
    // Buang peserta yang sudah tiada
    for (const p of players.value) if (!p.connected) delete game.players[p.pid]
    game.phase = 'lobby'
    game.qIndex = -1
  }

  function newGame() {
    stopSound()
    for (const conn of conns.values()) conn.close()
    conns.clear()
    peer?.destroy()
    Object.assign(game, freshGame(randomCode(), { quizId: game.quizId, mode: game.mode, duration: game.duration }))
    startPeer()
  }

  function setQuiz(id) {
    if (game.phase !== 'lobby') return
    const next = getQuiz(id)
    game.quizId = next.id
    game.choiceOrder = makeOrder(next)
    game.duration = next.defaultDuration ?? game.duration
    if (!next.modes.includes(game.mode)) game.mode = 'choice'
  }

  function removePlayer(pid) {
    conns.get(pid)?.close()
    conns.delete(pid)
    delete game.players[pid]
  }

  function setOverride(pid, value) {
    const a = game.players[pid]?.answers[game.qIndex]
    if (a) a.override = value === a.auto ? null : value
  }

  function destroy() {
    clearInterval(tick)
    clearInterval(heartbeat)
    stopSound()
    peer?.destroy()
  }

  window.addEventListener('beforeunload', () => peer?.destroy())
  startPeer()

  return {
    game, net, now, soundOn,
    quiz, question, remaining, players, connectedPlayers, leaderboard, currentAnswers, questionStats,
    total,
    start, closeTimer, reveal, next, end, backToLobby, newGame, setQuiz, removePlayer, setOverride, destroy,
  }
}
