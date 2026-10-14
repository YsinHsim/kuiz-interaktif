import confetti from 'canvas-confetti'

const COLORS = ['#f6c445', '#3ddc84', '#e5484d', '#2f7ee8', '#ffffff']

// Letupan konfeti besar di tengah, diikuti "pancutan" dari kedua-dua sisi skrin.
export function celebrate({ durationMs = 3500, scale = 1 } = {}) {
  const base = { colors: COLORS, disableForReducedMotion: true, zIndex: 1000 }
  confetti({ ...base, particleCount: Math.round(160 * scale), spread: 100, startVelocity: 55, origin: { y: 0.6 } })

  const end = Date.now() + durationMs
  ;(function frame() {
    confetti({ ...base, particleCount: Math.round(4 * scale), angle: 60, spread: 60, origin: { x: 0, y: 0.75 } })
    confetti({ ...base, particleCount: Math.round(4 * scale), angle: 120, spread: 60, origin: { x: 1, y: 0.75 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
