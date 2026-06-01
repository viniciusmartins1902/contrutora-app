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
        <h1>Reembolsos</h1>
        <div class="sub">{{ auth.usuario?.nome }}</div>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="scroll">
      <div v-if="carregando" class="loading">
        <span class="spinner"></span> Carregando...
      </div>

      <div v-else-if="pagamentos.length === 0" class="vazio">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        <p>Nenhum reembolso registrado ainda.</p>
      </div>

      <div v-else>
        <router-link v-for="pg in pagamentos" :key="pg.id" :to="`/pagamentos/${pg.id}`" class="card pagamento-card">
          <div class="pg-header">
            <div class="pg-info">
              <div class="pg-descricao">{{ pg.descricao }}</div>
              <div class="pg-valor">R$ {{ formatarValor(pg.valor) }}</div>
            </div>
            <span class="badge" :class="'badge-' + normalizarAprovacao(pg.aprovacao)">
              {{ pg.aprovacao }}
            </span>
          </div>
          <div class="pg-data">{{ formatarData(pg.data_criacao) }}</div>
        </router-link>
      </div>
    </div>

    <!-- Botão Flutuante -->
    <button class="fab" @click="novoPagamento" title="Novo reembolso">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../stores/auth'
import { menuStore } from '../stores/menu'
import { api } from '../api'

const router = useRouter()
const pagamentos = ref([])
const carregando = ref(true)
const erro = ref('')

function abrirMenu() {
  menuStore.aberto = true
}

function novoPagamento() {
  router.push('/pagamentos/novo')
}

function formatarValor(valor) {
  return parseFloat(valor).toFixed(2).replace('.', ',')
}

function formatarData(data) {
  if (!data) return '-'
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}

function normalizarAprovacao(aprovacao) {
  const map = {
    'Em análise': 'pendente',
    'Aprovado': 'concluida',
    'Reprovado': 'cancelada'
  }
  return map[aprovacao] || 'pendente'
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    // Sem limit na primeira carga - deixar Supabase retornar tudo
    const res = await api.pagamentos.listar()
    pagamentos.value = res.data || []
    temMais.value = false
  } catch (e) {
    erro.value = e.message
    console.error('Erro ao carregar reembolsos:', e)
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  if (auth.token) {
    carregar()
  }
})
</script>

<style scoped>
.pagamento-card {
  cursor: pointer;
  transition: transform .1s, box-shadow .1s;
  text-decoration: none;
  color: inherit;
  display: block;
}
.pagamento-card:active {
  transform: scale(.98);
}
.pg-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}
.pg-info {
  flex: 1;
  min-width: 0;
}
.pg-descricao {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  word-break: break-word;
}
.pg-valor {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}
.pg-data {
  font-size: 12px;
  color: var(--muted);
}
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-pendente {
  background: rgba(249, 115, 22, 0.15);
  color: var(--warning);
}
.badge-concluida {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}
.badge-cancelada {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}
</style>
