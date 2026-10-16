import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Cloudflare Web Analytics — hanya dimuatkan dalam build produksi jika token ditetapkan.
const cfToken = import.meta.env.VITE_CF_BEACON_TOKEN
if (import.meta.env.PROD && cfToken) {
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  s.dataset.cfBeacon = JSON.stringify({ token: cfToken })
  document.head.appendChild(s)
}

createApp(App).mount('#app')
