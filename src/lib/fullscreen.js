import { ref, onMounted, onUnmounted } from 'vue'

// Safari lama guna awalan webkit; iPhone tidak menyokong Fullscreen API langsung (butang disembunyikan).
const doc = document
const el = document.documentElement

export const fullscreenSupported = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)

export function useFullscreen({ hotkey = false } = {}) {
  const isFullscreen = ref(false)
  const sync = () => (isFullscreen.value = !!(doc.fullscreenElement || doc.webkitFullscreenElement))

  function toggle() {
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      ;(doc.exitFullscreen || doc.webkitExitFullscreen).call(doc)
    } else {
      const req = el.requestFullscreen || el.webkitRequestFullscreen
      req?.call(el)?.catch?.(() => {})
    }
  }

  // Kekunci "F" untuk togol (diabaikan semasa menaip dalam medan teks).
  function onKey(e) {
    if (e.key.toLowerCase() !== 'f' || e.ctrlKey || e.metaKey || e.altKey) return
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
    toggle()
  }

  onMounted(() => {
    sync()
    doc.addEventListener('fullscreenchange', sync)
    doc.addEventListener('webkitfullscreenchange', sync)
    if (hotkey) window.addEventListener('keydown', onKey)
  })
  onUnmounted(() => {
    doc.removeEventListener('fullscreenchange', sync)
    doc.removeEventListener('webkitfullscreenchange', sync)
    window.removeEventListener('keydown', onKey)
  })

  return { isFullscreen, toggle, supported: fullscreenSupported }
}
