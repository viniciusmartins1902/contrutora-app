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
      <h1 style="flex: 1; padding: 0 12px; text-align: center">Novo RDO</h1>
      <div style="width: 40px"></div>
    </div>

    <div class="scroll">
      <div v-if="sucesso" class="sucesso-card">
        <div class="sucesso-icon">✓</div>
        <p>RDO salvo com sucesso!</p>
        <button class="btn btn-outline" style="margin-top:16px" @click="novoRDO">Novo RDO</button>
        <button class="btn btn-primary" style="margin-top:10px" @click="$router.push('/atividades')">Voltar ao início</button>
      </div>

      <template v-else>
        <div v-if="erro" class="erro-box">{{ erro }}</div>

        <!-- Data e Obra -->
        <div class="row">
          <div class="field">
            <label class="label">Data</label>
            <input v-model="form.data" type="date" class="input" />
          </div>
          <div class="field">
            <label class="label">Efetivo</label>
            <input v-model.number="form.efetivo" type="number" class="input" min="0" placeholder="0" />
          </div>
        </div>

        <div class="field">
          <label class="label">Obra</label>
          <select v-model="form.obra_id" class="select">
            <option :value="null">— Selecione —</option>
            <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.nome }}</option>
          </select>
        </div>

        <div class="field">
          <label class="label">OS vinculadas <span style="color:var(--muted)">(opcional)</span></label>
          <div v-if="!form.obra_id" class="os-vazio">Selecione uma obra primeiro</div>
          <div v-else-if="ordensDaObra.length === 0" class="os-vazio">Nenhuma OS disponível para esta obra/data</div>
          <div v-else class="os-lista">
            <label v-for="os in ordensDaObra" :key="os.id" class="os-item">
              <input type="checkbox" :value="String(os.id)" v-model="form.os_ids" />
              <span class="os-titulo">{{ os.titulo || `#${os.id}` }}</span>
            </label>
          </div>
        </div>

        <!-- Descrição -->
        <div class="field">
          <label class="label">Atividades realizadas *</label>
          <textarea v-model="form.descricao" class="textarea"
                    placeholder="Descreva o que foi executado hoje..."></textarea>
        </div>

        <!-- Horas -->
        <div class="field">
          <label class="label">Horas trabalhadas</label>
          <input v-model.number="form.horas_trabalhadas" type="number" class="input"
                 min="0" max="24" step="0.5" placeholder="8" />
        </div>

        <!-- Observações -->
        <div class="field">
          <label class="label">Observações <span style="color:var(--muted)">(opcional)</span></label>
          <textarea v-model="form.observacoes" class="textarea" style="min-height:70px"
                    placeholder="Ocorrências, impedimentos, clima..."></textarea>
        </div>

        <!-- Fotos -->
        <div class="field">
          <label class="label">Fotos <span style="color:var(--muted)">(opcional)</span></label>
          <input type="file" multiple accept="image/*" @change="adicionarFotos" class="input-file" />
          <div v-if="fotos.length > 0" class="fotos-preview">
            <div v-for="(foto, idx) in fotos" :key="idx" class="foto-item">
              <img :src="foto.preview" :alt="`Foto ${idx + 1}`" />
              <button type="button" class="btn-remover-foto" @click="removerFoto(idx)">✕</button>
            </div>
          </div>
        </div>

        <button class="btn btn-primary" :disabled="salvando" @click="salvar">
          {{ salvando ? 'Salvando...' : 'Salvar RDO' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { auth }      from '../stores/auth'
import { rdosStore } from '../stores/rdos'
import { catalogoStore } from '../stores/catalogo'
import { menuStore } from '../stores/menu'

const router    = useRouter()
const osPassada = history.state?.os || null
const hoje      = new Date().toISOString().slice(0, 10)

function abrirMenu() {
  menuStore.aberto = true
}

const form = reactive({
  data:              hoje,
  obra_id:           osPassada?.obra_id || null,
  os_ids:            osPassada?.id ? [String(osPassada.id)] : [],
  descricao:         '',
  horas_trabalhadas: 8,
  efetivo:           0,
  observacoes:       '',
})

const obras        = ref([])
const ordensDaObra = ref([])
const salvando     = ref(false)
const sucesso      = ref(false)
const erro         = ref('')
const fotos        = ref([])

function carregarObras() {
  obras.value = catalogoStore.getObras().map(o => ({ id: String(o.id), nome: o.nome }))
  if (osPassada?.obra_id && !obras.value.some(o => o.id === String(osPassada.obra_id))) {
    obras.value.unshift({ id: String(osPassada.obra_id), nome: osPassada.obra_nome || `Obra #${osPassada.obra_id}` })
  }
}

async function carregarOSDaSelecao() {
  const dataRef = form.data || hoje
  if (!form.obra_id) {
    ordensDaObra.value = []
    form.os_ids = []
    return
  }
  try {
    const res = await api.atividades(dataRef, form.obra_id)
    const itens = res?.atividades || []
    if (itens.length > 0) catalogoStore.sincronizarOrdens(itens)
  } catch {}
  ordensDaObra.value = catalogoStore.getOrdensDoDia(dataRef, form.obra_id)
  const idsValidos = new Set(ordensDaObra.value.map(os => String(os.id)))
  form.os_ids = form.os_ids.filter(id => idsValidos.has(String(id)))
}

async function salvar() {
  erro.value = ''
  if (!form.obra_id) { erro.value = 'Selecione a obra.'; return }
  if (!form.descricao.trim()) { erro.value = 'Descreva as atividades realizadas.'; return }

  salvando.value = true
  try {
    const payload = { ...form }
    if (fotos.value.length > 0) {
      payload.fotos = fotos.value.map(f => ({
        nome: f.nome,
        dados: f.base64
      }))
    }
    await rdosStore.salvar(payload)
    sucesso.value = true
  } catch (e) {
    erro.value = e.message
  } finally {
    salvando.value = false
  }
}

function novoRDO() {
  Object.assign(form, {
    data: hoje, obra_id: null, os_ids: [],
    descricao: '', horas_trabalhadas: 8, efetivo: 0, observacoes: '',
  })
  fotos.value = []
  sucesso.value = false
  erro.value = ''
  carregarObras()
}

function adicionarFotos(event) {
  const files = event.target.files
  if (!files) return

  for (let file of files) {
    if (!file.type.startsWith('image/')) continue

    const reader = new FileReader()
    reader.onload = (e) => {
      fotos.value.push({
        nome: file.name,
        base64: e.target.result,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  }

  // Limpar input
  event.target.value = ''
}

function removerFoto(idx) {
  fotos.value.splice(idx, 1)
}

onMounted(() => {
  if (auth.token) {
    carregarObras()
    carregarOSDaSelecao()
  } else {
    const stop = watch(() => auth.token, (token) => {
      if (token) { stop(); carregarObras(); carregarOSDaSelecao() }
    })
  }
})

watch(() => form.data,    () => { if (auth.token) carregarOSDaSelecao() })
watch(() => form.obra_id, () => { if (auth.token) carregarOSDaSelecao() })
</script>

<style scoped>
.sucesso-card {
  background: var(--surface);
  border: 1px solid rgba(52,211,153,.3);
  border-radius: var(--radius);
  padding: 40px 24px;
  text-align: center;
  margin-top: 16px;
}
.sucesso-icon {
  width: 56px; height: 56px;
  background: rgba(52,211,153,.15);
  border-radius: 50%;
  color: var(--success);
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.topbar-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: 0.7;
}
.input-file {
  display: block;
  padding: 24px;
  border: 2px dashed var(--primary);
  background: linear-gradient(135deg, rgba(25,118,210,.08) 0%, rgba(25,118,210,.03) 100%);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: center;
  transition: all .3s;
  font-size: 14px;
  color: var(--text);
}
.input-file:hover {
  border-color: #1565c0;
  background: rgba(25,118,210,.12);
}
.input-file::before {
  content: '📷 ';
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}
.input-file::after {
  content: 'Clique ou arraste fotos aqui';
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.fotos-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background: rgba(25,118,210,.03);
  border-radius: var(--radius);
}
.foto-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  aspect-ratio: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  transition: transform .2s, box-shadow .2s;
}
.foto-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,.12);
}
.foto-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.btn-remover-foto {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(220,38,38,.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background .2s;
  box-shadow: 0 2px 8px rgba(220,38,38,.3);
}
.btn-remover-foto:hover {
  background: #dc2626;
}
.os-lista {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.os-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background .15s;
}
.os-item:not(:last-child) { border-bottom: 1px solid var(--border); }
.os-item:hover { background: rgba(25,118,210,.06); }
.os-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
  cursor: pointer;
  flex-shrink: 0;
}
.os-titulo { font-size: 14px; color: var(--text); }
.os-vazio {
  font-size: 13px;
  color: var(--muted);
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
</style>
