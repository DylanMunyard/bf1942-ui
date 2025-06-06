import { createRouter, createWebHistory } from 'vue-router'
import ServerTable from '../components/ServerTable.vue'
import PlayersPage from '../components/PlayersPage.vue'
import PlayerSessionsPage from '../components/PlayerSessionsPage.vue'
import ServerRankingsPage from '../components/ServerRankingsPage.vue'
import PlayerDetailsPage from '../components/PlayerDetailsPage.vue'
import RoundReportPage from '../components/RoundReportPage.vue'

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
      path: '/servers/:serverName/rankings',
      name: 'server-rankings',
      component: ServerRankingsPage,
      props: true
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
      path: '/players/:playerName/sessions',
      name: 'player-sessions',
      component: PlayerSessionsPage,
      props: route => ({
        playerName: route.params.playerName
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
    },
    {
      path: '/player/:playerName',
      name: 'standalone-player-details',
      component: PlayerDetailsPage,
      props: route => ({
        playerName: route.params.playerName
      })
    },
    {
      path: '/servers/round-report',
      name: 'round-report',
      component: RoundReportPage,
      props: route => ({
        serverGuid: route.query.serverGuid,
        mapName: route.query.mapName,
        startTime: route.query.startTime
      })
    }
  ]
})

export default router
