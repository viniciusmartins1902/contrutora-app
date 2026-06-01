import { reactive } from 'vue'
import { Capacitor } from '@capacitor/core'
import { api } from '../api'

const KEY = 'crcc_rdos'

function carregar() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function persistir(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista))
}

async function salvarFotosNaDispositivo(fotos) {
  if (!fotos?.length) return []
  if (!Capacitor.isNativePlatform()) return fotos // browser: mantém base64

  const { Filesystem, Directory } = await import('@capacitor/filesystem')

  const resultado = await Promise.all(fotos.map(async (foto, i) => {
    try {
      const dataUrl = foto.dados ?? foto.preview
      if (!dataUrl?.startsWith('data:')) return null

      const base64 = dataUrl.split(',')[1]
      const mime   = dataUrl.split(';')[0].split(':')[1]
      const ext    = mime.split('/')[1] || 'jpg'
      const path   = `rdos/foto_${Date.now()}_${i}.${ext}`

      await Filesystem.writeFile({ path, data: base64, directory: Directory.Data, recursive: true })
      const { uri } = await Filesystem.getUri({ path, directory: Directory.Data })

      return {
        nome: foto.nome || `foto_${i + 1}.${ext}`,
        path,
        src: Capacitor.convertFileSrc(uri),
      }
    } catch {
      return null
    }
  }))

  return resultado.filter(Boolean)
}

async function lerFotosParaAPI(fotos) {
  if (!fotos?.length || !Capacitor.isNativePlatform()) return fotos

  const { Filesystem, Directory } = await import('@capacitor/filesystem')

  const resultado = await Promise.all(fotos.map(async (foto) => {
    if (!foto.path) return foto
    try {
      const { data } = await Filesystem.readFile({ path: foto.path, directory: Directory.Data })
      return { nome: foto.nome, dados: `data:image/jpeg;base64,${data}` }
    } catch { return null }
  }))

  return resultado.filter(Boolean)
}

export const rdosStore = reactive({
  lista: carregar(),

  async salvar(payload) {
    const fotosLocais = await salvarFotosNaDispositivo(payload.fotos || [])

    const local = {
      _id:       crypto.randomUUID(),
      status:    'pendente',
      criado_em: new Date().toISOString(),
      ...payload,
      fotos: fotosLocais,
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
        const { _id, status, criado_em, server_id, fotos, ...resto } = rdo
        const payload = { ...resto }

        if (fotos?.length) {
          payload.fotos = await lerFotosParaAPI(fotos)
        }

        const res = await api.criarRDO(payload)
        rdo.status    = 'sincronizado'
        rdo.server_id = res.rdo?.id
      } catch {}
    }
    persistir(this.lista)
  },
})
