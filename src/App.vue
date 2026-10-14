<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Home from './views/Home.vue'
import Host from './views/Host.vue'
import Play from './views/Play.vue'

// Penghala ringkas berasaskan hash — tiada konfigurasi pelayan diperlukan di Vercel.
const hash = ref(location.hash)
const onHash = () => (hash.value = location.hash)
onMounted(() => window.addEventListener('hashchange', onHash))
onUnmounted(() => window.removeEventListener('hashchange', onHash))

const route = computed(() => {
  const [, page, param] = hash.value.replace(/^#/, '').split('/')
  if (page === 'host') return { view: Host }
  if (page === 'join') return { view: Play, props: { code: param ?? '' } }
  return { view: Home }
})
</script>

<template>
  <component :is="route.view" v-bind="route.props" />
</template>
