<template>
  <div class="screen">
    <div class="topbar">
      <div>
        <h1>Minhas OS</h1>
        <div class="sub">{{ auth.usuario?.nome }}</div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <input v-model="filtroData" type="date" class="input input-sm" @change="buscar" />
      <input v-model="filtroNumero" type="number" class="input input-sm" placeholder="OS #" @input="buscar" />
    </div>

    <div class="scroll">
      <div v-show="carregando" class="loading">
        <span class="spinner"></span> Carregando...
      </div>

      <div v-show="!carregando && ordens.length === 0" class="vazio">
        <p>Nenhuma OS encontrada.</p>
      </div>

      <div v-show="!carregando && ordens.length > 0">
        <div v-for="os in ordens" :key="os.id" class="card os-card"
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
            <span>{{ formatarData(os.data_prevista) }}</span>
          </div>
          <button class="btn-ver-mais" @click="abrirOS(os)">Ver mais</button>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="bottom-bar">
      <button @click="$router.push('/atividades')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Hoje
      </button>
      <button @click="$router.push('/rdo')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Novo RDO
      </button>
      <button @click="$router.push('/rdos')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
        RDOs
      </button>
      <button class="ativo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Minhas OS
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api }  from '../api'
import { auth } from '../stores/auth'

const router      = useRouter()
const ordens      = shallowRef([])
const carregando  = ref(true)
const filtroData  = ref('')
const filtroNumero = ref('')

const statusLabel     = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' }
const prioridadeLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

function formatarData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

async function buscar() {
  carregando.value = true
  try {
    const res = await api.minhasOS(filtroData.value || null, filtroNumero.value || null)
    ordens.value = [...(res.ordens || [])]
  } catch (e) {
    ordens.value = []
  } finally {
    carregando.value = false
  }
}

function abrirOS(os) {
  router.push({ path: `/os/${os.id}`, state: { os } })
}

onMounted(() => {
  if (auth.token) {
    buscar()
  } else {
    const stop = watch(() => auth.token, (token) => {
      if (token) { stop(); buscar() }
    })
  }
})
</script>

<style scoped>
.filtros {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
}
.input-sm { padding: 10px 12px; font-size: 14px; }
.filtros .input:first-child { flex: 2; }
.filtros .input:last-child  { flex: 1; }
.os-header  { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.os-id      { font-size: 11px; font-weight: 700; color: var(--muted); margin-right: 2px; }
.os-titulo  { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 6px; }
.os-meta    { display: flex; gap: 12px; font-size: 12px; color: var(--muted); margin-bottom: 12px; }
.borda-alta  { border-left: 3px solid var(--danger);  }
.borda-media { border-left: 3px solid var(--warning); }
.borda-baixa { border-left: 3px solid var(--border);  }
.btn-ver-mais {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(255,255,255,.08);
  color: #fff;
}
</style>
