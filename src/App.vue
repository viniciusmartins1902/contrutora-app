<template>
  <div class="app-layout">
    <SideMenu v-if="auth.logado" />
    <main class="main-content">
      <router-view />
      <BottomBar v-if="mostrarBottomBar" :active="rotaAtiva" />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SideMenu from './components/SideMenu.vue'
import BottomBar from './components/BottomBar.vue'
import { auth } from './stores/auth'

const route = useRoute()

const rotaAtiva = computed(() => {
  const path = route.path
  if (path === '/atividades') return 'atividades'
  if (path.startsWith('/minhas-os')) return 'minhas-os'
  if (path === '/rdo') return 'rdo'
  if (path.startsWith('/rdos')) return 'rdos'
  return null
})

const mostrarBottomBar = computed(() => {
  // Não mostrar bottom bar se não estiver logado
  if (!auth.logado) return false
  // Não mostrar bottom bar em rotas de detalhes
  const path = route.path
  return !path.startsWith('/rdos/') && !path.startsWith('/os/')
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
