const KEY = 'crcc_catalogo'

function carregar() {
  try {
    const base = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      obras: Array.isArray(base.obras) ? base.obras : [],
      ordens: Array.isArray(base.ordens) ? base.ordens : [],
      atualizadoEm: base.atualizadoEm || null,
    }
  } catch {
    return { obras: [], ordens: [], atualizadoEm: null }
  }
}

const state = carregar()

function persistir() {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function toDateOnly(valor) {
  if (!valor) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function normalizarId(valor) {
  if (valor === null || valor === undefined) return null
  const raw = String(valor).trim()
  return raw.length > 0 ? raw : null
}

function extrairObra(ordem) {
  const id = normalizarId(
    ordem?.obra_id ??
    ordem?.obraId ??
    ordem?.obra?.id ??
    ordem?.obra?.obra_id
  )

  const nomeBruto =
    ordem?.obra_nome ??
    ordem?.obraNome ??
    ordem?.obra?.nome ??
    ordem?.obra?.razao_social ??
    (typeof ordem?.obra === 'string' ? ordem.obra : null)

  const nome = nomeBruto ? String(nomeBruto).trim() : null
  if (!id || !nome) return null
  return { id, nome }
}

function isVencida(os, dataRef) {
  const data = toDateOnly(dataRef) || new Date().toISOString().slice(0, 10)
  const fim = toDateOnly(os?.data_fim ?? os?.dataFim)
  const prevista = toDateOnly(os?.data_prevista ?? os?.dataPrevista)

  if (fim) return data > fim
  if (prevista) return data > prevista
  return false
}

function isAtiva(os) {
  const status = String(os?.status || '').toLowerCase()
  return status !== 'cancelada' && status !== 'concluida' && status !== 'encerrada'
}

function filtrarPorObra(os, obraId) {
  if (!obraId) return true
  const idOS = normalizarId(os?.obra_id ?? os?.obraId ?? os?.obra?.id ?? os?.obra?.obra_id)
  return String(idOS) === String(normalizarId(obraId))
}

function upsertObra(obra) {
  const id = normalizarId(obra?.id)
  const nome = obra?.nome ? String(obra.nome).trim() : null
  if (!id || !nome) return
  const idx = state.obras.findIndex(o => String(o.id) === String(id))
  if (idx >= 0) {
    state.obras[idx] = { ...state.obras[idx], id, nome }
    return
  }
  state.obras.push({ id, nome })
}

function upsertOrdem(ordem) {
  const id = normalizarId(ordem?.id ?? ordem?.os_id ?? ordem?.ordem_id)
  if (!id) return

  const idx = state.ordens.findIndex(o => String(o.id) === String(id))
  const normalized = { ...ordem, id }

  if (idx >= 0) {
    state.ordens[idx] = { ...state.ordens[idx], ...normalized }
  } else {
    state.ordens.push(normalized)
  }

  const obra = extrairObra(normalized)
  if (obra) upsertObra(obra)
}

export const catalogoStore = {
  sincronizarOrdens(ordens = []) {
    ordens.forEach(upsertOrdem)
    state.atualizadoEm = new Date().toISOString()
    persistir()
  },

  sincronizarObras(obras = []) {
    obras.forEach(upsertObra)
    state.atualizadoEm = new Date().toISOString()
    persistir()
  },

  getObras() {
    return [...state.obras].sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'))
  },

  getOrdensParaData(dataRef, obraId = null) {
    const data = toDateOnly(dataRef) || new Date().toISOString().slice(0, 10)
    return state.ordens.filter(os => isAtiva(os) && !isVencida(os, data) && filtrarPorObra(os, obraId))
  },

  getOrdensByIds(ids = []) {
    return ids
      .map(id => state.ordens.find(o => String(o.id) === String(id)))
      .filter(Boolean)
  },

  getOrdensDoDia(dataRef, obraId = null) {
    const data = toDateOnly(dataRef) || new Date().toISOString().slice(0, 10)
    return state.ordens.filter(os => {
      if (!isAtiva(os) || isVencida(os, data) || !filtrarPorObra(os, obraId)) return false
      const inicio = toDateOnly(os.data_inicio ?? os.dataInicio)
      const fim = toDateOnly(os.data_fim ?? os.dataFim)
      const prevista = toDateOnly(os.data_prevista ?? os.dataPrevista)

      if (inicio && fim) return data >= inicio && data <= fim
      if (inicio && !fim) return data >= inicio
      if (!inicio && fim) return data <= fim
      if (prevista) return data === prevista
      return true
    })
  },
}
