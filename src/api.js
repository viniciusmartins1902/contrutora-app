/**
 * API Client — CRCC App
 * Usa XMLHttpRequest interceptado pelo CapacitorHttp (embutido no @capacitor/core v5+)
 * No Android, o CapacitorHttp roteia via código nativo, eliminando CORS.
 * No browser (dev), usa XHR padrão.
 */

import { auth } from './stores/auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://crcc.zetta.net.br'
const API      = `${BASE_URL}/construtora/api`


function getToken() {
  return auth.token ?? localStorage.getItem('crcc_token')
}

function decodeJWT(token) {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch (e) {
    return null
  }
}

export function isTokenExpired(token = null) {
  const t = token || getToken()
  if (!t) return true
  const payload = decodeJWT(t)
  if (!payload || !payload.exp) return true
  return payload.exp * 1000 < Date.now()
}

export function getTokenInfo() {
  const token = getToken()
  if (!token) return { valid: false, message: 'Nenhum token encontrado' }
  
  const payload = decodeJWT(token)
  if (!payload) return { valid: false, message: 'Token inválido' }
  
  const isExpired = payload.exp * 1000 < Date.now()
  if (isExpired) {
    const expDate = new Date(payload.exp * 1000)
    return { 
      valid: false, 
      message: `Token expirado em ${expDate.toLocaleString()}`
    }
  }
  
  return { 
    valid: true, 
    message: `Token válido até ${new Date(payload.exp * 1000).toLocaleString()}`,
    userId: payload.id
  }
}

async function request(method, path, body = null) {
  const token = getToken()
  const url = `${API}${path}`

  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body)  headers['Content-Type']  = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch {}

  if (res.status < 200 || res.status >= 300) {
    throw new Error(data.erro || `Erro ${res.status}`)
  }

  return data
}

async function requestFirstSuccess(method, paths, body = null) {
  let lastError = null
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    try {
      console.log(`🔄 Tentativa ${i + 1}/${paths.length}: ${method} ${path}`)
      return await request(method, path, body)
    } catch (e) {
      console.warn(`  ❌ Falhou: ${e.message}`)
      lastError = e
    }
  }
  const msg = `Nenhum endpoint disponível. Todos falharam:\n${paths.join('\n')}`
  console.error(msg)
  throw lastError || new Error(msg)
}

function looksLikeOS(item) {
  if (!item || typeof item !== 'object') return false
  return !!(
    item.id ||
    item.os_id ||
    item.ordem_id ||
    item.obra_id ||
    item.obraId ||
    item.titulo ||
    item.status
  )
}

function collectArraysDeep(value, out = []) {
  if (Array.isArray(value)) {
    out.push(value)
    for (const item of value) collectArraysDeep(item, out)
    return out
  }
  if (!value || typeof value !== 'object') return out
  for (const v of Object.values(value)) collectArraysDeep(v, out)
  return out
}

function findBestOrdersArray(data) {
  const arrays = collectArraysDeep(data)
  if (arrays.length === 0) return []

  // Prefer arrays that contain objects resembling OS entries.
  const scored = arrays.map((arr) => {
    let score = 0
    for (const item of arr) {
      if (looksLikeOS(item)) score += 2
      else if (item && typeof item === 'object') score += 1
    }
    return { arr, score }
  })

  scored.sort((a, b) => b.score - a.score || b.arr.length - a.arr.length)
  return scored[0]?.arr || []
}

function normalizeObrasResponse(data) {
  const arr = Array.isArray(data) ? data
    : data?.obras ?? data?.lista ?? data?.dados ?? data?.resultado ?? data?.data ?? []
  return Array.isArray(arr) ? arr : []
}

function normalizeOrdensResponse(data) {
  if (Array.isArray(data)) return { ordens: data }
  if (!data || typeof data !== 'object') return { ordens: [] }

  const ordens =
    data.ordens ??
    data.os ??
    data.lista ??
    data.resultado ??
    data.dados?.ordens ??
    data.dados?.os ??
    data.data?.ordens ??
    data.data?.os ??
    findBestOrdersArray(data) ??
    []

  return {
    ...data,
    ordens: Array.isArray(ordens) ? ordens : [],
  }
}

function qs(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  return parts.length ? '?' + parts.join('&') : ''
}

export const api = {
  login:      (email, senha)              => request('POST', '/login.php', { email, senha }),
  atividades: (data, obraId)             => request('GET',  `/atividades.php${qs({ data, obra_id: obraId })}`),

  obras: async () => {
    try {
      const data = await request('GET', '/obras.php?status=em_andamento')
      return normalizeObrasResponse(data)
    } catch {
      return []
    }
  },

  minhasOS: async (data, numero, obraId) => normalizeOrdensResponse(
    await requestFirstSuccess('GET', [
      `/ordens_servico.php${qs({ data, numero, obra_id: obraId })}`,
      `/os.php${qs({ data, numero, obra_id: obraId })}`,
      `/minhas-os.php${qs({ data, numero, obra_id: obraId })}`,
      `/minhas_os.php${qs({ data, numero, obra_id: obraId })}`,
      `/ordens.php${qs({ data, numero, obra_id: obraId })}`,
    ])
  ),

  atualizarOS: (id, status)              => request('PATCH', '/os.php', { id, status }),
  listarRDOs:  (data, obraId)            => request('GET',   `/rdo.php${qs({ data, obra_id: obraId })}`),
  criarRDO:    (payload)                 => request('POST',  '/rdo.php', payload),
  
  pagamentos: {
    listar: (limit = 50, offset = 0, status = null, aprovacao = null) =>
      request('GET', `/pg.php${qs({ limit, offset, status, aprovacao })}`),
    
    salvar: (payload) =>
      request('POST', '/pg.php', payload),
    
    obter: (id) =>
      request('GET', `/pg.php${qs({ id })}`),
    
    atualizar: (id, aprovacao) =>
      request('PATCH', '/pg.php', { id, aprovacao }),
  },
}
