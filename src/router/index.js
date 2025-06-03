import { createRouter, createWebHistory } from 'vue-router'
import ServerTable from '../components/ServerTable.vue'
import PlayersPage from '../components/PlayersPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/servers'
    },
    {
      path: '/servers',
      name: 'servers',
      component: ServerTable
    },
    {
      path: '/servers/fh2',
      name: 'fh2',
      component: ServerTable,
      props: { initialMode: 'FH2' }
    },
    {
      path: '/servers/:serverName',
      name: 'server-details',
      component: ServerTable,
      props: route => ({ 
        selectedServerName: route.params.serverName,
        showChartModal: true
      })
    },
    {
      path: '/servers/:serverName/players',
      name: 'server-players',
      component: ServerTable,
      props: route => ({ 
        selectedServerName: route.params.serverName,
        showServerModal: true
      })
    },
    {
      path: '/players',
      name: 'players',
      component: PlayersPage
    },
    {
      path: '/players/:playerName',
      name: 'player-details',
      component: PlayersPage,
      props: route => ({ 
        selectedPlayerName: route.params.playerName,
        showPlayerModal: true
      })
    },
    {
      path: '/players/:playerName/sessions/:sessionId',
      name: 'session-details',
      component: PlayersPage,
      props: route => ({ 
        selectedPlayerName: route.params.playerName,
        selectedSessionId: parseInt(route.params.sessionId),
        showPlayerModal: true,
        showSessionModal: true
      })
    }
  ]
})

export default router
