<template>
  <Transition name="fade">
    <div v-if="menuStore.aberto" class="backdrop" @click="fechar" />
  </Transition>

  <Transition name="slide">
    <div v-if="menuStore.aberto" class="drawer">

      <!-- Cabeçalho do usuário -->
      <div class="drawer-header">
        <div class="avatar">{{ iniciais }}</div>
        <div class="user-info">
          <div class="user-nome">{{ auth.usuario?.nome || 'Usuário' }}</div>
          <div class="user-sub">CRCC · Zetta</div>
        </div>
        <button class="fechar-btn" @click="fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Navegação -->
      <nav class="drawer-nav">
        <!-- DIÁRIO -->
        <div class="nav-titulo">DIÁRIO</div>

        <button :class="{ ativo: rota === '/atividades' }" @click="ir('/atividades')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
          </svg>
          Atividades do dia
        </button>

        <button :class="{ ativo: rota.startsWith('/minhas-os') }" @click="ir('/minhas-os')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Minhas OS
        </button>

        <!-- RDO Dropdown -->
        <button class="dropdown-toggle" :class="{ ativo: rdoAberto || rota.startsWith('/rdo') }" @click="rdoAberto = !rdoAberto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          RDO
          <svg class="chevron" :class="{ aberto: rdoAberto }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div v-if="rdoAberto" class="dropdown-menu">
          <button :class="{ ativo: rota === '/rdo' }" @click="ir('/rdo')">
            Novo RDO
          </button>
          <button :class="{ ativo: rota.startsWith('/rdos') }" @click="ir('/rdos')">
            Meus RDOs
          </button>
        </div>

        <!-- FINANCEIRO -->
        <div class="nav-titulo">FINANCEIRO</div>

        <button :class="{ ativo: rota === '/pagamentos' }" @click="ir('/pagamentos')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Reembolsos
        </button>
      </nav>

      <!-- Rodapé -->
      <div class="drawer-footer">
        <button class="btn-logout" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair da conta
        </button>
        <div class="versao">Versão 1.0.0</div>
      </div>

    </div>
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth }      from '../stores/auth'
import { menuStore } from '../stores/menu'

const router = useRouter()
const route  = useRoute()
const rdoAberto = ref(false)

const rota = computed(() => route.path)

const iniciais = computed(() => {
  const nome = auth.usuario?.nome || ''
  return nome.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?'
})

function fechar() {
  menuStore.aberto = false
}

function ir(path) {
  fechar()
  router.push(path)
}

function logout() {
  fechar()
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--surface);
  z-index: 201;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Transições */
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform .28s cubic-bezier(.4, 0, .2, 1); }
.slide-enter-from, .slide-leave-to       { transform: translateX(-100%); }

/* Cabeçalho */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 18px;
  background: var(--primary);
  flex-shrink: 0;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info { flex: 1; min-width: 0; }
.user-nome {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-sub { font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 2px; }

.fechar-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  padding: 6px;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
}
.fechar-btn:active { background: rgba(255, 255, 255, 0.25); }

/* Navegação */
.drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-nav button {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 14px;
  background: none;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background .15s, color .15s;
}

.drawer-nav button:active { background: rgba(0, 0, 0, 0.06); }

.drawer-nav button.ativo {
  background: rgba(25, 118, 210, 0.1);
  color: var(--primary);
  font-weight: 700;
}

.drawer-nav button.ativo svg {
  stroke: var(--primary);
}

/* Rodapé */
.drawer-footer {
  padding: 12px 10px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  background: none;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--danger);
  cursor: pointer;
  text-align: left;
  transition: background .15s;
}

.btn-logout svg { stroke: var(--danger); }
.btn-logout:active { background: rgba(220, 38, 38, 0.08); }

/* Títulos de seção */
.nav-titulo {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 14px 8px;
  margin-top: 4px;
}

/* Dropdown */
.dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chevron {
  transition: transform .2s ease;
  margin-left: auto;
}

.chevron.aberto {
  transform: rotate(180deg);
}

.dropdown-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 10px 6px 24px;
}

.dropdown-menu button {
  font-size: 14px;
  font-weight: 400;
  padding: 10px 12px;
}

.versao {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  margin-top: 10px;
}
</style>
