<template>
  <div class="screen">
    <div class="topbar">
      <button class="back-btn" @click="$router.back()">← Voltar</button>
      <h1>Novo RDO</h1>
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
          <select v-model.number="form.obra_id" class="select">
            <option :value="null">— Selecione —</option>
            <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.nome }}</option>
          </select>
        </div>

        <div class="field">
          <label class="label">OS vinculada <span style="color:var(--muted)">(opcional)</span></label>
          <select v-model.number="form.os_id" class="select">
            <option :value="null">— Nenhuma —</option>
            <option v-for="a in atividadesDoDia" :key="a.id" :value="a.id">{{ a.titulo }}</option>
          </select>
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
import { api }       from '../api'
import { auth }      from '../stores/auth'
import { rdosStore } from '../stores/rdos'

const router = useRouter()
const osPassada = history.state?.os || null

const hoje = new Date().toISOString().slice(0, 10)

const form = reactive({
  data:             hoje,
  obra_id:          osPassada?.obra_id || null,
  os_id:            osPassada?.id     || null,
  descricao:        '',
  horas_trabalhadas: 8,
  efetivo:          0,
  observacoes:      '',
})

const obras           = ref([])
const atividadesDoDia = ref([])
const salvando        = ref(false)
const sucesso         = ref(false)
const erro            = ref('')

async function carregarDados() {
  try {
    const [resAtiv] = await Promise.all([
      api.atividades(hoje),
    ])
    atividadesDoDia.value = resAtiv.atividades || []
    // Extrai obras únicas das atividades
    const mapa = {}
    atividadesDoDia.value.forEach(a => {
      if (a.obra_id && a.obra_nome) mapa[a.obra_id] = a.obra_nome
    })
    obras.value = Object.entries(mapa).map(([id, nome]) => ({ id: Number(id), nome }))
  } catch {}
}

async function salvar() {
  erro.value = ''
  if (!form.obra_id) { erro.value = 'Selecione a obra.'; return }
  if (!form.descricao.trim()) { erro.value = 'Descreva as atividades realizadas.'; return }

  salvando.value = true
  try {
    await rdosStore.salvar({ ...form })
    sucesso.value = true
  } catch (e) {
    erro.value = e.message
  } finally {
    salvando.value = false
  }
}

function novoRDO() {
  Object.assign(form, {
    data: hoje, obra_id: null, os_id: null,
    descricao: '', horas_trabalhadas: 8, efetivo: 0, observacoes: '',
  })
  sucesso.value = false
  erro.value = ''
}

onMounted(() => {
  if (auth.token) {
    carregarDados()
  } else {
    const stop = watch(() => auth.token, (token) => {
      if (token) { stop(); carregarDados() }
    })
  }
})
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
</style>
