<template>
  <div class="screen">
    <div class="topbar">
      <button class="btn-icon" @click="abrirMenu" title="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div style="flex: 1; min-width: 0; padding: 0 12px">
        <h1>Minhas OS</h1>
        <div class="sub">{{ auth.usuario?.nome }}</div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <div class="filtros-linha">
        <input v-model="filtroData" type="date" class="input input-sm" @change="buscar" />
        <input v-model="filtroNumero" type="number" class="input input-sm" placeholder="OS #" @input="buscar" />
      </div>
      <select v-if="obras.length > 0" v-model="filtroObra" class="input input-sm select-obra">
        <option value="">Todas as obras</option>
        <option v-for="o in obras" :key="o.id" :value="String(o.id)">{{ o.nome }}</option>
      </select>
    </div>

    <div class="scroll">
      <div v-show="carregando" class="loading">
        <span class="spinner"></span> Carregando...
      </div>

      <div v-show="!carregando && ordensFiltradas.length === 0" class="vazio">
        <p>Nenhuma OS encontrada.</p>
      </div>

      <div v-show="!carregando && ordensFiltradas.length > 0">
        <div v-for="os in ordensFiltradas" :key="os.id" class="card os-card"
             :class="'borda-' + os.prioridade">
          <div class="os-header">
            <span class="os-id">OS #{{ os.id }}</span>
            <span class="badge" :class="'badge-' + os.prioridade">{{ prioridadeLabel[os.prioridade] }}</span>
            <span class="badge" :class="'badge-' + os.status">{{ statusLabel[os.status] }}</span>
          </div>
          <div class="os-titulo">{{ os.titulo }}</div>
          <div class="os-meta">
            <span>{{ nomeObra(os) }}</span>
            <span>{{ os.area }}</span>
            <span>{{ formatarData(os.data_prevista) }}</span>
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

const router       = useRouter()
const ordens       = shallowRef([])
const obras        = shallowRef([])
const carregando   = ref(true)
const filtroData   = ref('')
const filtroNumero = ref('')
const filtroObra   = ref('')

const statusLabel     = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' }
const prioridadeLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

function abrirMenu() {
  menuStore.aberto = true
}

const ordensFiltradas = computed(() => {
  if (!filtroObra.value) return ordens.value
  return ordens.value.filter(os => String(os.obra_id ?? os.obraId ?? '') === filtroObra.value)
})

function nomeObra(os) {
  const id = String(os.obra_id ?? os.obraId ?? '')
  const obra = obras.value.find(o => String(o.id) === id)
  return obra?.nome ?? os.obra_nome ?? (id ? `Obra #${id}` : 'Obra')
}

function formatarData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function extrairObrasDeOS(list) {
  const map = new Map()
  for (const os of list) {
    const id = String(os.obra_id ?? os.obraId ?? '')
    if (!id) continue
    const nome = os.obra_nome ?? os.obraNome ?? `Obra #${id}`
    if (!map.has(id)) map.set(id, { id, nome })
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

async function carregarObras() {
  const fromServer = await api.obras()
  if (fromServer.length > 0) {
    catalogoStore.sincronizarObras(fromServer)
    obras.value = fromServer
    return
  }
  const fromCatalog = catalogoStore.getObras()
  if (fromCatalog.length > 0) {
    obras.value = fromCatalog
  }
  // fallback: derive from OS list after buscar()
}

async function buscar() {
  carregando.value = true
  try {
    const res = await api.minhasOS(filtroData.value || null, filtroNumero.value || null)
    ordens.value = [...(res.ordens || [])]
    catalogoStore.sincronizarOrdens(ordens.value)

    if (obras.value.length === 0) {
      obras.value = extrairObrasDeOS(ordens.value)
    }
  } catch (e) {
    ordens.value = catalogoStore.getOrdensParaData(filtroData.value || new Date().toISOString().slice(0, 10))

    if (filtroNumero.value) {
      const numero = Number(filtroNumero.value)
      ordens.value = ordens.value.filter(o => Number(o.id) === numero)
    }

    if (obras.value.length === 0) {
      obras.value = catalogoStore.getObras()
    }
  } finally {
    carregando.value = false
  }
}

function abrirOS(os) {
  router.push({ path: `/os/${os.id}`, state: { os } })
}

onMounted(async () => {
  const init = async () => {
    await carregarObras()
    await buscar()
  }

  if (auth.token) {
    init()
  } else {
    const stop = watch(() => auth.token, (token) => {
      if (token) { stop(); init() }
    })
  }
})
</script>

<style scoped>
.filtros {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 12px;
  margin-top: 8px;
}
.filtros-linha {
  display: flex;
  gap: 8px;
}
.filtros-linha .input:first-child { flex: 2; }
.filtros-linha .input:last-child  { flex: 1; }
.select-obra {
  width: 100%;
  appearance: auto;
}
.input-sm { padding: 10px 12px; font-size: 14px; }
.os-header  { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.os-id      { font-size: 11px; font-weight: 700; color: var(--muted); margin-right: 2px; }
.os-titulo  { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
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
  background: rgba(0,0,0,.06);
  color: var(--text);
}
</style>
