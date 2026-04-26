<template>
  <div class="screen login-screen">
    <div class="login-hero">
      <div class="login-logo">C</div>
      <h1>CRCC</h1>
      <p>Gestão de obras</p>
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
  background: linear-gradient(160deg, #0f1923 0%, #1a2535 100%);
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
  width: 72px; height: 72px;
  background: var(--primary);
  border-radius: 22px;
  color: #0f1923;
  font-size: 32px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(79,195,247,.3);
}
.login-hero h1 { font-size: 26px; font-weight: 800; color: #fff; }
.login-hero p  { font-size: 14px; color: var(--muted); margin-top: 4px; }
.login-form {
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  padding: 28px 24px 32px;
  border-top: 1px solid var(--border);
}
.spinner-inline {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,.2);
  border-top-color: #0f1923;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  vertical-align: middle;
}
</style>
