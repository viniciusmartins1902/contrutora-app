import { reactive } from 'vue'

const KEY_TOKEN   = 'crcc_token'
const KEY_USUARIO = 'crcc_usuario'

export const auth = reactive({
  token:   localStorage.getItem(KEY_TOKEN)   || null,
  usuario: JSON.parse(localStorage.getItem(KEY_USUARIO) || 'null'),

  login(token, usuario) {
    this.token   = token
    this.usuario = usuario
    localStorage.setItem(KEY_TOKEN,   token)
    localStorage.setItem(KEY_USUARIO, JSON.stringify(usuario))
  },

  logout() {
    this.token   = null
    this.usuario = null
    localStorage.removeItem(KEY_TOKEN)
    localStorage.removeItem(KEY_USUARIO)
  },

  get logado() {
    return !!this.token
  },
})
