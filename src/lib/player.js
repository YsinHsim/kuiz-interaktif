import { reactive, ref, computed } from 'vue'
import { Peer } from 'peerjs'
import { hostPeerId, PEER_OPTIONS } from './net.js'

// sessionStorage: kekal selepas refresh tetapi unik bagi setiap tab (boleh uji beberapa peserta dalam satu pelayar).
const STORAGE_KEY = 'kuiz-player-v1'
const NAME_KEY = 'kuiz-player-name'
const STALE_MS = 10000

export function loadPlayerSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function lastUsedName() {
  try {
    return localStorage.getItem(NAME_KEY) || ''
  } catch {
    return ''
  }
}

function getPid() {
  const saved = loadPlayerSession()
  if (saved?.pid) return saved.pid
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, '').slice(0, 16)
}

export function createPlayer() {
  const state = reactive({
    status: 'idle', // idle | connecting | connected | reconnecting | error
    error: '',
    code: '',
    name: '',
    pid: getPid(),
    snap: null,
    deadline: 0,
    pending: null, // jawapan dihantar tetapi belum disahkan oleh hos
  })
  const now = ref(Date.now())

  let peer = null
  let conn = null
  let everConnected = false
  let lastMsgAt = 0
  let retryTimer = null
  let stopped = false

  const remaining = computed(() =>
    state.snap?.phase === 'question' ? Math.max(0, state.deadline - now.value) : 0,
  )

  const tick = setInterval(() => {
    now.value = Date.now()
    if (state.status === 'connected' && now.value - lastMsgAt > STALE_MS) {
      state.status = 'reconnecting'
      conn?.close()
      scheduleRetry(0)
    }
  }, 250)

  function scheduleRetry(delay = 2000) {
    if (stopped) return
    clearTimeout(retryTimer)
    retryTimer = setTimeout(connect, delay)
  }

  function onMessage(msg) {
    lastMsgAt = Date.now()
    if (msg?.t === 'state') {
      const prevQ = state.snap?.qIndex
      state.snap = msg
      state.deadline = Date.now() + msg.remaining
      if (msg.qIndex !== prevQ || msg.you?.answered) state.pending = null
    } else if (msg?.t === 'ping' && state.snap?.phase === 'question') {
      state.deadline = Date.now() + msg.remaining
    }
  }

  function connect() {
    if (stopped) return
    if (!peer || peer.destroyed) {
      peer = new Peer(PEER_OPTIONS)
      peer.on('open', connect)
      peer.on('disconnected', () => !peer.destroyed && setTimeout(() => peer.reconnect(), 1000))
      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          if (!everConnected) {
            state.status = 'error'
            state.error = `Bilik ${state.code} tidak dijumpai. Semak kod dan cuba lagi.`
            return
          }
          // Hos mungkin sedang refresh — cuba lagi.
          state.status = 'reconnecting'
          scheduleRetry()
          return
        }
        if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
          state.status = everConnected ? 'reconnecting' : 'connecting'
          scheduleRetry(3000)
          return
        }
        console.warn('[player] peer error', err.type, err)
      })
      return // 'open' akan memanggil connect() semula
    }
    if (!peer.open) return
    if (conn?.open && state.status === 'connected') return

    conn?.close()
    const c = peer.connect(hostPeerId(state.code), { reliable: true })
    conn = c
    c.on('open', () => {
      everConnected = true
      lastMsgAt = Date.now()
      state.status = 'connected'
      state.error = ''
      c.send({ t: 'join', pid: state.pid, name: state.name })
    })
    c.on('data', onMessage)
    c.on('close', () => {
      if (conn !== c || stopped) return
      state.status = 'reconnecting'
      scheduleRetry()
    })
    c.on('error', () => {})
  }

  function join(code, name) {
    stopped = false
    state.code = String(code).trim()
    state.name = String(name).trim().slice(0, 20)
    state.status = 'connecting'
    state.error = ''
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code: state.code, name: state.name, pid: state.pid }))
      localStorage.setItem(NAME_KEY, state.name)
    } catch {}
    connect()
  }

  function answer(value) {
    const snap = state.snap
    if (!snap || snap.phase !== 'question' || snap.you?.answered || state.pending !== null) return
    state.pending = value
    conn?.send({ t: 'answer', q: snap.qIndex, value })
  }

  function leave() {
    stopped = true
    clearTimeout(retryTimer)
    conn?.close()
    peer?.destroy()
    peer = null
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ pid: state.pid }))
    } catch {}
    Object.assign(state, { status: 'idle', snap: null, pending: null, error: '' })
  }

  function destroy() {
    stopped = true
    clearInterval(tick)
    clearTimeout(retryTimer)
    peer?.destroy()
  }

  return { state, remaining, join, answer, leave, destroy }
}
