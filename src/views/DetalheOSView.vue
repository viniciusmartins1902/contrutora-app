<template>
  <div class="screen">
    <div class="topbar">
      <button class="back-btn" @click="$router.back()" title="Voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div style="font-size:13px;color:var(--muted);padding:0 12px">OS #{{ os?.id }}</div>
      <div style="width: 40px"></div>
    </div>

    <div class="scroll">
      <div v-if="!os" class="vazio"><p>OS não encontrada.</p></div>
      <template v-else>

        <!-- Cabeçalho da OS -->
        <div class="card">
          <div class="os-badges">
            <span class="badge" :class="'badge-' + os.prioridade">{{ prioridadeLabel[os.prioridade] }}</span>
            <span class="badge" :class="'badge-' + statusAtual">{{ statusLabel[statusAtual] }}</span>
          </div>
          <h2 class="os-titulo">{{ os.titulo }}</h2>
          <div class="os-meta">
            <div><span class="meta-label">Obra</span> {{ os.obra_nome || '—' }}</div>
            <div><span class="meta-label">Área</span> {{ os.area }}</div>
            <div v-if="os.responsavel_nome"><span class="meta-label">Responsável</span> {{ os.responsavel_nome }}</div>
            <div v-if="os.data_prevista"><span class="meta-label">Prazo</span> {{ formatarData(os.data_prevista) }}</div>
            <div v-if="os.criado_em"><span class="meta-label">Criado em</span> {{ formatarDataHora(os.criado_em) }}</div>
            <div v-if="os.atualizado_em"><span class="meta-label">Atualizado em</span> {{ formatarDataHora(os.atualizado_em) }}</div>
          </div>
          <p v-if="os.descricao" class="os-descricao">{{ os.descricao }}</p>
        </div>

        <!-- Ações -->
        <div v-if="erro" class="erro-box">{{ erro }}</div>
        <div v-if="sucesso" class="sucesso-box">Status atualizado!</div>

        <div v-if="statusAtual === 'pendente'" class="acoes">
          <button class="btn btn-primary" :disabled="salvando" @click="atualizarStatus('em_andamento')">
            {{ salvando ? 'Salvando...' : 'Executar' }}
          </button>
        </div>

        <div v-else-if="statusAtual === 'em_andamento'" class="acoes">
          <button class="btn btn-success" :disabled="salvando" @click="atualizarStatus('concluida')">Finalizar</button>
          <button class="btn btn-warning" :disabled="salvando" @click="atualizarStatus('pendente')">Adiar</button>
          <button class="btn btn-danger"  :disabled="salvando" @click="atualizarStatus('cancelada')">Cancelar</button>
        </div>

        <button class="btn btn-outline" style="margin-top:8px" @click="irParaRDO">
          + Escrever RDO para esta OS
        </button>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'

const route  = useRouter()
const $route = useRoute()
const router = useRouter()

const os          = ref(history.state?.os || null)
const statusAtual = ref(os.value?.status || '')
const salvando    = ref(false)
const erro        = ref('')
const sucesso     = ref(false)

const statusLabel     = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' }
const prioridadeLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

function formatarData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatarDataHora(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

async function atualizarStatus(novoStatus) {
  erro.value = ''
  sucesso.value = false
  salvando.value = true
  try {
    await api.atualizarOS(os.value.id, novoStatus)
    statusAtual.value = novoStatus
    os.value.status   = novoStatus
    sucesso.value = true
  } catch (e) {
    erro.value = e.message
  } finally {
    salvando.value = false
  }
}

function irParaRDO() {
  router.push({ path: '/rdo', state: { os: os.value } })
}
</script>

<style scoped>
.os-badges  { display: flex; gap: 8px; margin-bottom: 10px; }
.os-titulo  { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
.os-meta    { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--muted); margin-bottom: 12px; }
.meta-label { color: rgba(0,0,0,0.35); margin-right: 4px; }
.os-descricao { font-size: 14px; color: var(--muted); line-height: 1.5; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px; }

.acoes { display: flex; gap: 8px; flex-wrap: wrap; }
.acoes .btn { flex: 1; min-width: 80px; }
.sucesso-box {
  background: rgba(52,211,153,.12);
  border: 1px solid rgba(52,211,153,.3);
  border-radius: 10px;
  color: var(--success);
  font-size: 13px;
  padding: 10px 14px;
  margin-top: 12px;
}
.topbar-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: 0.7;
}
</style>
