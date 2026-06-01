<template>
  <div class="screen">
    <div class="topbar">
      <button class="back-btn" @click="$router.back()" title="Voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 style="flex: 1; padding: 0 12px; text-align: center">Novo Reembolso</h1>
      <div style="width: 40px"></div>
    </div>

    <div class="scroll">
      <div v-if="sucesso" class="sucesso-card">
        <div class="sucesso-icon">✓</div>
        <p>Reembolso registrado com sucesso!</p>
        <button class="btn btn-outline" style="margin-top:16px" @click="novoForm">Novo reembolso</button>
        <button class="btn btn-primary" style="margin-top:10px" @click="voltarPagamentos">Voltar</button>
      </div>

      <template v-else>
        <div v-if="erro" class="erro-box">{{ erro }}</div>

        <!-- Foto -->
        <div class="field">
          <label class="label">Foto *</label>
          <div class="foto-actions">
            <label class="btn btn-secondary" style="display: flex; gap: 8px; align-items: center; justify-content: center; margin: 0; cursor: pointer;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Câmera
              <input type="file" accept="image/*" capture="environment" @change="adicionarFoto" class="input-file" style="display: none;" />
            </label>
            <label class="btn btn-secondary" style="display: flex; gap: 8px; align-items: center; justify-content: center; margin: 0; cursor: pointer;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload
              <input type="file" accept="image/*" @change="adicionarFoto" class="input-file" style="display: none;" />
            </label>
          </div>
          <div v-if="foto" class="foto-preview-container">
            <img :src="foto.preview" :alt="foto.name" class="foto-preview" />
            <button type="button" class="btn-remover-foto" @click="removerFoto">✕</button>
          </div>
          <div v-else class="foto-vazia">Nenhuma foto selecionada</div>
        </div>

        <!-- Descrição -->
        <div class="field">
          <label class="label">Descrição *</label>
          <textarea v-model="form.descricao" class="textarea"
                    placeholder="Descreva o pagamento..." required></textarea>
        </div>

        <!-- Valor -->
        <div class="field">
          <label class="label">Valor (R$) *</label>
          <input v-model.number="form.valor" type="number" class="input"
                 min="0" step="0.01" placeholder="0.00" required />
        </div>

        <button class="btn btn-primary" :disabled="salvando || !foto || !form.descricao || !form.valor" @click="salvar">
          {{ salvando ? 'Salvando...' : 'Salvar pagamento' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()

const form = reactive({
  descricao: '',
  valor: null,
})

const foto = ref(null)
const sucesso = ref(false)
const erro = ref('')
const salvando = ref(false)

function adicionarFoto(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    foto.value = {
      name: file.name,
      file: file,
      preview: e.target?.result,
      base64: e.target?.result
    }
  }
  reader.readAsDataURL(file)
}

function removerFoto() {
  foto.value = null
}

async function salvar() {
  if (!foto.value || !form.descricao || !form.valor) {
    erro.value = 'Preenchimento obrigatório: foto, descrição e valor'
    return
  }

  salvando.value = true
  erro.value = ''

  try {
    const payload = {
      descricao: form.descricao,
      valor: form.valor,
      foto_base64: foto.value.base64,
      foto_nome: foto.value.name,
    }

    await api.pagamentos.salvar(payload)
    sucesso.value = true
  } catch (e) {
    erro.value = e.message || 'Erro ao salvar pagamento'
    console.error('Erro:', e)
  } finally {
    salvando.value = false
  }
}

function novoForm() {
  form.descricao = ''
  form.valor = null
  foto.value = null
  sucesso.value = false
  erro.value = ''
}

function voltarPagamentos() {
  router.push('/pagamentos')
}
</script>

<style scoped>
.foto-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.foto-actions .btn {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.foto-preview-container {
  position: relative;
  display: inline-block;
  margin-top: 12px;
  width: 100%;
  max-width: 200px;
}

.foto-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.btn-remover-foto {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--danger);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s;
}

.btn-remover-foto:active {
  transform: scale(.95);
}

.foto-vazia {
  margin-top: 12px;
  padding: 16px;
  background: var(--bg);
  border-radius: 8px;
  color: var(--muted);
  text-align: center;
  font-size: 13px;
}
</style>
