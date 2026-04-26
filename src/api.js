/**
 * API Client — CRCC App
 * Todas as chamadas ao backend passam por aqui.
 */

import { auth } from './stores/auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://crcc.zetta.net.br'
const API      = `${BASE_URL}/construtora/api`

function getToken() {
  return auth.token ?? localStorage.getItem('crcc_token')
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API}${path}`, opts)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data.erro || `Erro ${res.status}`
    throw new Error(msg)
  }
  return data
}

export const api = {
  login:        (email, senha)       => request('POST',  '/login.php', { email, senha }),
  atividades:   (data, obraId)       => request('GET',   `/atividades.php?data=${data}${obraId ? '&obra_id='+obraId : ''}`),
  minhasOS:     (data, numero)       => request('GET',   `/minhas-os.php${data ? '?data='+data : ''}${numero ? (data?'&':'?')+'numero='+numero : ''}`),
  atualizarOS:  (id, status)         => request('PATCH', '/os.php', { id, status }),
  listarRDOs:   (data, obraId)       => request('GET',   `/rdo.php?data=${data}${obraId ? '&obra_id='+obraId : ''}`),
  criarRDO:     (payload)            => request('POST',  '/rdo.php', payload),
}
