import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Servers from '../views/Servers.vue'
import Dashboard from '../views/Dashboard.vue'
import Players from '../views/Players.vue'
import PlayerDetails from '../views/PlayerDetails.vue'
import PlayerAllAchievements from '../views/PlayerAllAchievements.vue'
import ServerDetails from '../views/ServerDetails.vue'
import ServerRankingsPage from '../components/ServerRankingsPage.vue'
import PlayerSessionsPage from '../components/PlayerSessionsPage.vue'
import RoundsPage from '../components/RoundsPage.vue'
import RoundReportPage from '../components/RoundReportPage.vue'
import WorkInProgressPlaceholder from '../components/WorkInProgressPlaceholder.vue'
import PlayerComparison from '../views/PlayerComparison.vue'
import { useAuth } from '../composables/useAuth'

const routes: RouteRecordRaw[] = [
    {
      path: '/',
      name: 'home',
      beforeEnter: (to, from, next) => {
        const { isAuthenticated } = useAuth()
        if (isAuthenticated.value) {
          next('/dashboard')
        } else {
          next('/servers/bf1942')
        }
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      beforeEnter: (to, from, next) => {
        const { isAuthenticated } = useAuth()
        if (!isAuthenticated.value) {
          next('/servers/bf1942')
        } else {
          next()
        }
      }
    },
    {
      path: '/servers',
      name: 'servers',
      redirect: '/servers/bf1942'
    },
    {
      path: '/servers/bf1942',
      name: 'servers-bf1942',
      component: Servers,
      props: { initialMode: '42' }
    },
    {
      path: '/servers/fh2',
      name: 'servers-fh2',
      component: Servers,
      props: { initialMode: 'FH2' }
    },
    {
      path: '/servers/bfv',
      name: 'servers-bfv',
      component: Servers,
      props: { initialMode: 'BFV' }
    },
    {
      path: '/servers/:serverName',
      name: 'server-details',
      component: ServerDetails,
      props: true
    },
    {
      path: '/servers/:serverName/rankings',
      name: 'server-rankings',
      component: ServerRankingsPage,
      props: true
    },
    {
      path: '/players',
      name: 'players',
      component: Players
    },
    {
      path: '/players/compare',
      name: 'player-comparison',
      component: PlayerComparison,
      props: route => ({
        player1: route.query.player1,
        player2: route.query.player2
      })
    },
    {
      path: '/players/:playerName',
      name: 'player-details',
      component: PlayerDetails,
      props: true
    },
    {
      path: '/players/:playerName/sessions',
      name: 'player-sessions',
      component: PlayerSessionsPage,
      props: true
    },
    {
      path: '/players/:playerName/achievements',
      name: 'player-achievements',
      component: PlayerAllAchievements,
      props: true
    },
    {
      path: '/rounds',
      name: 'rounds',
      component: RoundsPage
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
    },
    {
      path: '/tk-livewire',
      name: 'tk-livewire',
      component: WorkInProgressPlaceholder
    }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
