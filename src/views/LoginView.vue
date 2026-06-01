<template>
  <div class="screen login-screen">
    <div class="login-hero">
      <div class="login-logo">
        <img src="/logo.jpeg" alt="Logo" class="login-logo-img" />
      </div>
      <p class="login-subtitle">Zetta a serviço da CRCC</p>
    </div>

    <div class="login-form">
      <div v-if="erro" class="erro-box">{{ erro }}</div>

      <div class="field">
        <label class="label">E-mail</label>
        <input v-model="email" type="email" class="input"
               placeholder="seu@email.com"
               autocomplete="email" autocapitalize="none"
               @keyup.enter="login" />
      </div>

      <div class="field">
        <label class="label">Senha</label>
        <input v-model="senha" type="password" class="input"
               placeholder="••••••••"
               @keyup.enter="login" />
      </div>

      <button class="btn btn-primary" :disabled="carregando" @click="login">
        <span v-if="carregando" class="spinner-inline"></span>
        <span v-else>Entrar</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api }  from '../api'
import { auth } from '../stores/auth'

const router    = useRouter()
const email     = ref('')
const senha     = ref('')
const erro      = ref('')
const carregando = ref(false)

async function login() {
  erro.value = ''
  if (!email.value || !senha.value) {
    erro.value = 'Preencha e-mail e senha.'
    return
  }
  carregando.value = true
  try {
    const res = await api.login(email.value.trim(), senha.value)
    auth.login(res.token, res.usuario)
    router.push('/atividades')
  } catch (e) {
    erro.value = e.message || 'Erro ao fazer login.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login-screen {
  background: #f5f7fa;
  justify-content: flex-end;
}
.login-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.login-logo {
  width: 160px; height: 160px;
  border-radius: 32px;
  overflow: hidden;
  margin-bottom: 20px;
  background: transparent;
}
.login-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}
.login-hero h1 { font-size: 26px; font-weight: 800; color: var(--text); }
.login-hero p  { font-size: 14px; color: var(--muted); margin-top: 4px; }
.login-subtitle { font-size: 13px; color: var(--muted); margin-top: 8px; font-weight: 500; }
.login-form {
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  padding: 28px 24px 32px;
  border-top: 1px solid var(--border);
}
.spinner-inline {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,.15);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  vertical-align: middle;
}
</style>
