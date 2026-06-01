<template>
  <div class="screen">
    <!-- Topbar -->
    <div class="topbar">
      <button class="btn-icon" @click="abrirMenu" title="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div style="flex: 1; min-width: 0; padding: 0 12px">
        <h1>Atividades do dia</h1>
        <div class="sub">{{ dataFormatada }} · {{ auth.usuario?.nome }}</div>
      </div>
      <button class="btn-icon" @click="logout" title="Sair">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- Lista -->
    <div class="scroll">
      <div v-show="carregando" class="loading">
        <span class="spinner"></span> Carregando...
      </div>

      <div v-show="!carregando && atividades.length === 0" class="vazio">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>Nenhuma atividade para hoje.</p>
      </div>

      <div v-show="!carregando && atividades.length > 0">
        <div v-for="os in atividades" :key="os.id" class="card os-card"
             :class="'borda-' + os.prioridade">
          <div class="os-header">
            <span class="os-id">OS #{{ os.id }}</span>
            <span class="badge" :class="'badge-' + os.prioridade">{{ prioridadeLabel[os.prioridade] }}</span>
            <span class="badge" :class="'badge-' + os.status">{{ statusLabel[os.status] }}</span>
          </div>
          <div class="os-titulo">{{ os.titulo }}</div>
          <div class="os-meta">
            <span>{{ os.obra_nome || 'Obra' }}</span>
            <span>{{ os.area }}</span>
          </div>
          <button class="btn-ver-mais" @click="abrirOS(os)">Ver mais</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api }  from '../api'
import { auth } from '../stores/auth'
import { catalogoStore } from '../stores/catalogo'
import { menuStore } from '../stores/menu'

const router     = useRouter()
const atividades = shallowRef([])
const carregando = ref(true)
const erro       = ref('')

const hoje = new Date().toISOString().slice(0, 10)

const dataFormatada = computed(() => {
  const [y, m, d] = hoje.split('-')
  return `${d}/${m}/${y}`
})

const statusLabel    = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' }
const prioridadeLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

function abrirMenu() {
  menuStore.aberto = true
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const res = await api.atividades(hoje)
    atividades.value = [...(res.atividades || [])]
    catalogoStore.sincronizarOrdens(atividades.value)
  } catch (e) {
    erro.value = e.message
    atividades.value = catalogoStore.getOrdensDoDia(hoje)
  } finally {
    carregando.value = false
  }

  // Popula obras em background via todas as OS (sem filtro de data)
  api.minhasOS().then(res => {
    const itens = res?.ordens || []
    if (itens.length > 0) catalogoStore.sincronizarOrdens(itens)
  }).catch(() => {})
}

function abrirOS(os) {
  router.push({ path: `/os/${os.id}`, state: { os } })
}



function logout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (auth.token) {
    carregar()
  } else {
    const stop = watch(() => auth.token, (token) => {
      if (token) { stop(); carregar() }
    })
  }
})
</script>

<style scoped>
.btn-icon {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
}
.btn-icon svg { width: 20px; height: 20px; }
.os-card { cursor: pointer; transition: transform .1s, box-shadow .1s; }
.os-card:active { transform: scale(.98); }
.borda-alta  { border-left: 3px solid var(--danger);  }
.borda-media { border-left: 3px solid var(--warning); }
.borda-baixa { border-left: 3px solid var(--border);  }
.os-header   { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.os-id       { font-size: 11px; font-weight: 700; color: var(--muted); margin-right: 2px; }
.os-titulo   { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.os-meta     { display: flex; gap: 12px; font-size: 12px; color: var(--muted); margin-bottom: 12px; }
.btn-ver-mais {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(0,0,0,.06);
  color: var(--text);
}
.topbar-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: 0.7;
}
</style>
