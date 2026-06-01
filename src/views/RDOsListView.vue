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
        <h1>Meus RDOs</h1>
        <div class="sub">{{ dataFormatada }} · {{ auth.usuario?.nome }}</div>      </div>
      <button class="btn-icon" @click="sincronizar" :disabled="sincronizando" title="Sincronizar pendentes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"
             :class="{ girando: sincronizando }">            const token = localStorage.getItem('crcc_token')
            fetch('https://crcc.zetta.net.br/construtora/api/pg.php', {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).then(d => console.log(d))
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
        </svg>
      </button>
    </div>

    <div class="scroll">
      <div v-if="rdosStore.lista.length === 0" class="vazio">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Nenhum RDO registrado.</p>
      </div>

      <div v-for="rdo in rdosStore.lista" :key="rdo._id" class="card rdo-card"
           @click="abrirRDO(rdo)">
        <div class="rdo-header">
          <span class="rdo-data">{{ formatarData(rdo.data) }}</span>
          <span class="badge" :class="rdo.status === 'sincronizado' ? 'badge-concluida' : 'badge-pendente'">
            {{ rdo.status === 'sincronizado' ? 'Sincronizado' : 'Pendente' }}
          </span>
        </div>
        <div class="rdo-descricao">{{ rdo.descricao }}</div>
        <div v-if="osIds(rdo).length > 0" class="rdo-os">
          <span v-for="id in osIds(rdo)" :key="id" class="os-tag">OS #{{ id }}</span>
        </div>
        <div class="rdo-meta">
          <span>{{ rdo.horas_trabalhadas }}h trabalhadas</span>
          <span>Efetivo: {{ rdo.efetivo }}</span>
          <span v-if="rdo.fotos?.length">📷 {{ rdo.fotos.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref }       from 'vue'
import { useRouter } from 'vue-router'
import { rdosStore } from '../stores/rdos'
import { auth }      from '../stores/auth'
import { menuStore } from '../stores/menu'

const router        = useRouter()
const sincronizando = ref(false)

function abrirMenu() {
  menuStore.aberto = true
}

function abrirRDO(rdo) {
  router.push(`/rdos/${rdo._id}`)
}

function osIds(rdo) {
  if (Array.isArray(rdo.os_ids) && rdo.os_ids.length > 0) return rdo.os_ids
  if (rdo.os_id) return [rdo.os_id]
  return []
}

function formatarData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

async function sincronizar() {
  sincronizando.value = true
  await rdosStore.sincronizar()
  sincronizando.value = false
}
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
@keyframes girar { to { transform: rotate(360deg); } }
.girando { animation: girar 1s linear infinite; }

.rdo-card    { display: flex; flex-direction: column; gap: 6px; cursor: pointer; }
.rdo-header  { display: flex; justify-content: space-between; align-items: center; }
.rdo-data    { font-size: 13px; font-weight: 700; color: var(--muted); }
.rdo-descricao {
  font-size: 14px;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rdo-os   { display: flex; flex-wrap: wrap; gap: 4px; }
.os-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  background: rgba(25,118,210,.1);
  padding: 2px 8px;
  border-radius: 20px;
}
.rdo-meta { display: flex; gap: 12px; font-size: 12px; color: var(--muted); }
</style>
