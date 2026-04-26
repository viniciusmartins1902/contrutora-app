<template>
  <div class="screen">
    <div class="topbar">
      <div>
        <h1>Meus RDOs</h1>
        <div class="sub">{{ auth.usuario?.nome }}</div>
      </div>
      <button class="btn-icon" @click="sincronizar" :disabled="sincronizando" title="Sincronizar pendentes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"
             :class="{ girando: sincronizando }">
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

      <div v-for="rdo in rdosStore.lista" :key="rdo._id" class="card rdo-card">
        <div class="rdo-header">
          <span class="rdo-data">{{ formatarData(rdo.data) }}</span>
          <span class="badge" :class="rdo.status === 'sincronizado' ? 'badge-concluida' : 'badge-pendente'">
            {{ rdo.status === 'sincronizado' ? 'Sincronizado' : 'Pendente' }}
          </span>
        </div>
        <div class="rdo-descricao">{{ rdo.descricao }}</div>
        <div class="rdo-meta">
          <span>{{ rdo.horas_trabalhadas }}h trabalhadas</span>
          <span>Efetivo: {{ rdo.efetivo }}</span>
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
      <button @click="$router.push('/minhas-os')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Minhas OS
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
      <button class="ativo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
        RDOs
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { rdosStore } from '../stores/rdos'
import { auth }      from '../stores/auth'

const sincronizando = ref(false)

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
.rdo-card { display: flex; flex-direction: column; gap: 6px; }
.rdo-header { display: flex; justify-content: space-between; align-items: center; }
.rdo-data { font-size: 13px; font-weight: 700; color: var(--muted); }
.rdo-descricao { font-size: 14px; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rdo-meta { display: flex; gap: 12px; font-size: 12px; color: var(--muted); }
</style>
