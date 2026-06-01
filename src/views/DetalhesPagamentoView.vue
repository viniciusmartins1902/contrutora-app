<template>
  <div class="screen">
    <!-- Topbar -->
    <div class="topbar">
      <button class="back-btn" @click="$router.back()" title="Voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div style="flex: 1; min-width: 0; padding: 0 12px">
        <h1>Reembolso</h1>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="scroll">
      <div v-if="carregando" class="loading">
        <span class="spinner"></span> Carregando...
      </div>

      <div v-else-if="erro" class="erro-msg">
        <p>{{ erro }}</p>
        <button class="btn-primary" @click="voltarList">Voltar</button>
      </div>

      <div v-else-if="pagamento" class="detalhe-pagamento">
        <!-- Imagem -->
        <div v-if="pagamento.foto_url" class="foto-container">
          <img 
            :src="'data:image/jpeg;base64,' + pagamento.foto_url" 
            alt="Foto do reembolso"
            class="foto-pagamento"
          />
        </div>
        <div v-else class="foto-vazia">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p>Sem foto</p>
        </div>

        <!-- Info -->
        <div class="info-section">
          <div class="info-item">
            <label>Descrição</label>
            <p class="info-value">{{ pagamento.descricao }}</p>
          </div>

          <div class="info-item">
            <label>Valor</label>
            <p class="info-value valor">R$ {{ formatarValor(pagamento.valor) }}</p>
          </div>

          <div class="info-item">
            <label>Status de Aprovação</label>
            <div class="badge-wrapper">
              <span class="badge" :class="'badge-' + normalizarAprovacao(pagamento.aprovacao)">
                {{ pagamento.aprovacao }}
              </span>
            </div>
          </div>

          <div class="info-item">
            <label>Status</label>
            <p class="info-value">{{ pagamento.status }}</p>
          </div>

          <div class="info-item">
            <label>Data de Criação</label>
            <p class="info-value">{{ formatarData(pagamento.data_criacao) }}</p>
          </div>
        </div>

        <!-- Ações -->
        <div class="acoes">
          <button class="btn-secondary" @click="$router.back()">Voltar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const route = useRoute()
const pagamento = ref(null)
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  await carregar()
})

async function carregar() {
  try {
    carregando.value = true
    erro.value = ''
    
    const id = route.params.id
    if (!id) {
      erro.value = 'ID do reembolso não encontrado'
      return
    }

    const result = await api.pagamentos.obter(id)
    
    if (result.data && result.data.length > 0) {
      pagamento.value = result.data[0]
    } else {
      erro.value = 'Reembolso não encontrado'
    }
  } catch (e) {
    console.error('Erro ao carregar reembolso:', e)
    erro.value = e.message || 'Erro ao carregar reembolso'
  } finally {
    carregando.value = false
  }
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

function voltarList() {
  router.push('/pagamentos')
}
</script>

<style scoped>
.detalhe-pagamento {
  padding: 12px;
}

.foto-container,
.foto-vazia {
  width: 100%;
  height: 240px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  overflow: hidden;
}

.foto-pagamento {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-vazia {
  flex-direction: column;
  color: #999;
  gap: 8px;
}

.foto-vazia svg {
  stroke-width: 1;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  color: var(--text);
  margin: 0;
  padding: 0;
}

.info-value.valor {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary);
}

.badge-wrapper {
  display: flex;
  gap: 8px;
}

.acoes {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.acoes button {
  flex: 1;
}

.erro-msg {
  padding: 16px;
  text-align: center;
  color: var(--danger);
}

.erro-msg p {
  margin-bottom: 16px;
}
</style>
