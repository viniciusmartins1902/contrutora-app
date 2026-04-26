import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from '../stores/auth'

import LoginView      from '../views/LoginView.vue'
import AtividadesView from '../views/AtividadesView.vue'
import DetalheOSView  from '../views/DetalheOSView.vue'
import RDOView        from '../views/RDOView.vue'
import MinhasOSView   from '../views/MinhasOSView.vue'
import RDOsListView   from '../views/RDOsListView.vue'

const routes = [
  { path: '/',           redirect: '/atividades' },
  { path: '/login',      component: LoginView,      meta: { publico: true } },
  { path: '/atividades', component: AtividadesView  },
  { path: '/os/:id',     component: DetalheOSView   },
  { path: '/rdo',        component: RDOView         },
  { path: '/minhas-os',  component: MinhasOSView    },
  { path: '/rdos',       component: RDOsListView    },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  if (!to.meta.publico && !auth.logado) return '/login'
})

export default router
