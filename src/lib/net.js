// ID bilik di pelayan PeerJS awam. Awalan unik supaya tidak bertembung dengan aplikasi lain.
export const PEER_PREFIX = 'kuiz-ib-7f3a-'
export const hostPeerId = (code) => `${PEER_PREFIX}${code}`

// Secara lalai guna pelayan awam 0.peerjs.com. Boleh tukar ke pelayan PeerJS sendiri melalui .env:
// VITE_PEER_HOST=localhost VITE_PEER_PORT=9000 VITE_PEER_PATH=/ VITE_PEER_SECURE=false
const env = import.meta.env
export const PEER_OPTIONS = {
  debug: 1,
  ...(env.VITE_PEER_HOST && {
    host: env.VITE_PEER_HOST,
    port: Number(env.VITE_PEER_PORT || 443),
    path: env.VITE_PEER_PATH || '/',
    secure: env.VITE_PEER_SECURE !== 'false',
  }),
}

export const POINTS_BASE = 500
export const POINTS_SPEED = 500

export function pointsFor(ms, durationMs) {
  const speed = Math.max(0, Math.min(1, 1 - ms / durationMs))
  return Math.round(POINTS_BASE + POINTS_SPEED * speed)
}

export const randomCode = () => String(Math.floor(1000 + Math.random() * 9000))

export function joinUrl(code) {
  return `${location.origin}${location.pathname}#/join/${code}`
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
