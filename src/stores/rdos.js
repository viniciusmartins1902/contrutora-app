import { reactive } from 'vue'
import { api } from '../api'

const KEY = 'crcc_rdos'

function carregar() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function persistir(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista))
}

export const rdosStore = reactive({
  lista: carregar(),

  async salvar(payload) {
    const local = {
      _id:       crypto.randomUUID(),
      status:    'pendente',
      criado_em: new Date().toISOString(),
      ...payload,
    }
    this.lista.unshift(local)
    persistir(this.lista)

    try {
      const res = await api.criarRDO(payload)
      local.status    = 'sincronizado'
      local.server_id = res.rdo?.id
    } catch {
      local.status = 'pendente'
    }
    persistir(this.lista)
    return local
  },

  async sincronizar() {
    const pendentes = this.lista.filter(r => r.status === 'pendente')
    for (const rdo of pendentes) {
      try {
        const { _id, status, criado_em, server_id, ...payload } = rdo
        const res = await api.criarRDO(payload)
        rdo.status    = 'sincronizado'
        rdo.server_id = res.rdo?.id
      } catch {}
    }
    persistir(this.lista)
  },
})
