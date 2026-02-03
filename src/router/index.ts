import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router'
import { useAuth } from '../composables/useAuth'

// Lazy load all route components for optimal code splitting
const Dashboard = () => import('../views/Dashboard.vue')
const LandingPageV2 = () => import('../views/LandingPageV2.vue')
const Players = () => import('../views/Players.vue')
const PlayerDetails = () => import('../views/PlayerDetails.vue')
const PlayerAllAchievements = () => import('../views/PlayerAllAchievements.vue')
const ServerDetails = () => import('../views/ServerDetails.vue')
const PlayerSessionsPage = () => import('../components/PlayerSessionsPage.vue')
const ServerSessionsPage = () => import('../components/ServerSessionsPage.vue')
const RoundReportPageV2 = () => import('../components/RoundReportPageV2.vue')
const PlayerComparison = () => import('../views/PlayerComparison.vue')
const SystemStats = () => import('../views/SystemStats.vue')
const DiscordCallback = () => import('../views/DiscordCallback.vue')
const TournamentDetails = () => import('../views/TournamentDetails.vue')
const PublicTournament = () => import('../views/PublicTournament.vue')
const PublicTournamentRankings = () => import('../views/PublicTournamentRankings.vue')
const PublicTournamentRules = () => import('../views/PublicTournamentRules.vue')
const PublicTournamentTeams = () => import('../views/PublicTournamentTeams.vue')
const PublicTournamentMatches = () => import('../views/PublicTournamentMatches.vue')
const PublicTournamentStats = () => import('../views/PublicTournamentStats.vue')
const PublicTournamentFiles = () => import('../views/PublicTournamentFiles.vue')
const DataExplorer = () => import('../views/DataExplorer.vue')
const AdminDataManagement = () => import('../views/AdminDataManagement.vue')

const routes: RouteRecordRaw[] = [
    {
      path: '/',
      name: 'home',
      meta: {
        title: 'BF Stats - Battlefield 1942, FH2 & BF Vietnam Server Statistics',
        description: 'Real-time Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam server monitoring. Track player statistics, server rankings, and game analytics.'
      },
      beforeEnter: (_to, _from, next) => {
        // Check for stored auth token synchronously first to avoid slow auth validation
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          // Only do expensive auth validation if we have a stored token
          const { isAuthenticated } = useAuth()
          if (isAuthenticated.value) {
            next('/dashboard')
          } else {
            next('/servers/bf1942')
          }
        } else {
          // No stored token - skip auth validation and go straight to servers
          next('/servers/bf1942')
        }
      }
    },
    {
      path: '/landing',
      name: 'landing',
      component: LandingPageV2,
      meta: {
        title: 'BF Stats - Battlefield Game Server Browser & Statistics',
        description: 'Browse active Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam servers. Real-time player counts, maps, and server information.'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: {
        title: 'My Dashboard - BF Stats Personal Command Center',
        description: 'Your personal Battlefield statistics dashboard. View favorite servers, player profiles, and custom battlefield analytics.'
      },
      beforeEnter: (_to, _from, next) => {
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
      redirect: '/servers/bf1942',
      meta: {
        title: 'Game Servers - BF Stats Server Browser',
        description: 'Browse all Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam servers. Find active servers with real-time player counts and statistics.'
      }
    },
    {
      path: '/servers/bf1942',
      name: 'servers-bf1942',
      component: LandingPageV2,
      props: { initialMode: '42' },
      meta: {
        title: 'Battlefield 1942 Servers - Live Server Browser & Stats',
        description: 'Find active Battlefield 1942 servers worldwide. Real-time player counts, maps, ping, and detailed server statistics. Join the classic WWII battlefield action.'
      }
    },
    {
      path: '/servers/fh2',
      name: 'servers-fh2',
      component: LandingPageV2,
      props: { initialMode: 'FH2' },
      meta: {
        title: 'Forgotten Hope 2 Servers - FH2 Server Browser & Statistics',
        description: 'Discover active Forgotten Hope 2 servers with realistic WWII gameplay. Live server stats, player counts, and detailed FH2 server information.'
      }
    },
    {
      path: '/servers/bfv',
      name: 'servers-bfv',
      component: LandingPageV2,
      props: { initialMode: 'BFV' },
      meta: {
        title: 'Battlefield Vietnam Servers - BF Vietnam Server Browser',
        description: 'Find active Battlefield Vietnam servers with jungle warfare action. Live server statistics, player counts, and Vietnam War era battlefield servers.'
      }
    },
    {
      path: '/servers/:serverName',
      name: 'server-details',
      component: ServerDetails,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `${route.params.serverName} Server Stats - BF Stats`,
        description: (route: RouteLocationNormalized) => `Detailed statistics for ${route.params.serverName} server. View player rankings, server history, performance metrics, and join information.`
      }
    },
    {
      path: '/servers/:serverName/sessions',
      name: 'server-sessions',
      component: ServerSessionsPage,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `${route.params.serverName} Session History - BF Stats`,
        description: (route: RouteLocationNormalized) => `Gaming session history and analytics for ${route.params.serverName}. Track server activity, player trends, and performance over time.`
      }
    },
    {
      path: '/players',
      name: 'players',
      component: Players,
      meta: {
        title: 'Player Search & Leaderboard - BF Stats Player Database',
        description: 'Search Battlefield players and view global leaderboards. Find detailed player statistics, rankings, and performance across BF1942, FH2, and BF Vietnam.'
      }
    },
    {
      path: '/players/compare',
      name: 'player-comparison',
      component: PlayerComparison,
      props: route => ({
        player1: route.query.player1,
        player2: route.query.player2
      }),
      meta: {
        title: (route: RouteLocationNormalized) => {
          const player1 = route.query.player1 || 'Player 1'
          const player2 = route.query.player2 || 'Player 2'
          return `${player1} vs ${player2} - BF Stats Player Comparison`
        },
        description: (route: RouteLocationNormalized) => {
          const player1 = route.query.player1 || 'players'
          const player2 = route.query.player2 || ''
          return `Compare Battlefield player statistics between ${player1}${player2 ? ` and ${player2}` : ' and other players'}. Side-by-side performance analysis and rankings.`
        }
      }
    },
    {
      path: '/players/:playerName',
      name: 'player-details',
      component: PlayerDetails,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `${route.params.playerName} - BF Stats Player Profile & Statistics`,
        description: (route: RouteLocationNormalized) => `Detailed Battlefield statistics for ${route.params.playerName}. View kills, deaths, score, accuracy, favorite servers, and complete gaming history.`
      }
    },
    {
      path: '/players/:playerName/sessions',
      name: 'player-sessions',
      component: PlayerSessionsPage,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `${route.params.playerName} Session History - BF Stats`,
        description: (route: RouteLocationNormalized) => `Gaming session history and analytics for ${route.params.playerName}. Track playtime, server activity, and performance trends over time.`
      }
    },
    {
      path: '/players/:playerName/achievements',
      name: 'player-achievements',
      component: PlayerAllAchievements,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `${route.params.playerName} Achievements & Awards - BF Stats`,
        description: (route: RouteLocationNormalized) => `All achievements, badges, and awards earned by ${route.params.playerName}. View unlocked content, milestones, and battlefield accomplishments.`
      }
    },
    {
      path: '/explore',
      name: 'explore',
      component: DataExplorer,
      redirect: '/explore/servers',
      meta: {
        title: 'Data Explorer - Browse Servers & Maps | BF Stats',
        description: 'Explore Battlefield 1942, FH2, and Battlefield Vietnam servers and maps. View win statistics, activity patterns, and detailed game analytics.'
      },
      children: [
        {
          path: 'servers',
          name: 'explore-servers',
          component: DataExplorer,
          meta: {
            title: 'Server Explorer - BF Stats',
            description: 'Browse all Battlefield servers with detailed statistics, win rates, and activity patterns.'
          }
        },
        {
          path: 'servers/:serverGuid',
          name: 'explore-server-detail',
          component: DataExplorer,
          props: true,
          meta: {
            title: (route: RouteLocationNormalized) => `Server ${route.params.serverGuid} - Data Explorer | BF Stats`,
            description: 'Detailed server analytics including map rotation, win statistics, and activity heatmap.'
          }
        },
        {
          path: 'servers/:serverGuid/maps/:mapName',
          name: 'explore-server-map-detail',
          component: DataExplorer,
          props: true,
          meta: {
            title: (route: RouteLocationNormalized) => `${decodeURIComponent(route.params.mapName as string)} on Server - Data Explorer | BF Stats`,
            description: (route: RouteLocationNormalized) => `Detailed statistics for ${decodeURIComponent(route.params.mapName as string)} played on this server, including player leaderboards and win rates.`
          }
        },
        {
          path: 'maps',
          name: 'explore-maps',
          component: DataExplorer,
          meta: {
            title: 'Map Explorer - BF Stats',
            description: 'Browse all Battlefield maps with server counts, play statistics, and win rates.'
          }
        },
        {
          path: 'maps/:mapName',
          name: 'explore-map-detail',
          component: DataExplorer,
          props: true,
          meta: {
            title: (route: RouteLocationNormalized) => `${decodeURIComponent(route.params.mapName as string)} - Map Explorer | BF Stats`,
            description: (route: RouteLocationNormalized) => `Detailed statistics for ${decodeURIComponent(route.params.mapName as string)} including servers playing this map and win rates.`
          }
        },
        {
          path: 'players',
          name: 'explore-players',
          component: DataExplorer,
          meta: {
            title: 'Player Explorer - BF Stats',
            description: 'Search for Battlefield players and view their rankings across maps and servers.'
          }
        },
        {
          path: 'players/:playerName',
          name: 'explore-player-detail',
          component: DataExplorer,
          props: true,
          meta: {
            title: (route: RouteLocationNormalized) => `${route.params.playerName as string} - Player Explorer | BF Stats`,
            description: (route: RouteLocationNormalized) => `Map rankings and server statistics for ${route.params.playerName as string}. See where they rank #1 across servers.`
          }
        }
      ]
    },
    {
      path: '/rounds/:roundId/report',
      name: 'round-report',
      component: RoundReportPageV2,
      props: route => ({
        roundId: route.params.roundId,
        players: route.query.players // Optional parameter for pinning specific players
      }),
      meta: {
        title: (route: RouteLocationNormalized) => `Round ${route.params.roundId} Report - BF Stats Match Analysis`,
        description: (route: RouteLocationNormalized) => `Detailed round report and match analysis for round ${route.params.roundId}. View player performance, team statistics, and battlefield events.`
      }
    },
    {
      path: '/t/:id',
      name: 'public-tournament',
      component: PublicTournament,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Tournament ${route.params.id} - BF Stats`,
        description: 'View tournament schedule, matches, and results for Battlefield competitions.'
      }
    },
    {
      path: '/t/:id/rankings',
      name: 'public-tournament-rankings',
      component: PublicTournamentRankings,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Rankings - Tournament ${route.params.id} - BF Stats`,
        description: 'Tournament team rankings and leaderboard.'
      }
    },
    {
      path: '/t/:id/rules',
      name: 'public-tournament-rules',
      component: PublicTournamentRules,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Tournament Rules - ${route.params.id} - BF Stats`,
        description: 'Tournament rules and guidelines.'
      }
    },
    {
      path: '/t/:id/teams',
      name: 'public-tournament-teams',
      component: PublicTournamentTeams,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Teams - Tournament ${route.params.id} - BF Stats`,
        description: 'Registered teams and rosters.'
      }
    },
    {
      path: '/t/:id/matches',
      name: 'public-tournament-matches',
      component: PublicTournamentMatches,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Matches - Tournament ${route.params.id} - BF Stats`,
        description: 'Tournament matches and results.'
      }
    },
    {
      path: '/t/:id/stats',
      name: 'public-tournament-stats',
      component: PublicTournamentStats,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Player Stats - Tournament ${route.params.id} - BF Stats`,
        description: 'Player statistics for the tournament.'
      }
    },
    {
      path: '/t/:id/files',
      name: 'public-tournament-files',
      component: PublicTournamentFiles,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Files - Tournament ${route.params.id} - BF Stats`,
        description: 'Tournament files, maps, and resources.'
      }
    },
    // Legacy route redirects for backwards compatibility
    {
      path: '/tournaments/:id',
      redirect: to => `/t/${to.params.id}`
    },
    {
      path: '/tournaments/:id/:subpage',
      redirect: to => `/t/${to.params.id}/${to.params.subpage}`
    },
    {
      path: '/admin/tournaments/:id',
      name: 'admin-tournament-details',
      redirect: to => `/admin/tournaments/${to.params.id}/matches`,
      beforeEnter: (_to, _from, next) => {
        const { isAuthenticated } = useAuth()
        if (!isAuthenticated.value) {
          next('/servers/bf1942')
        } else {
          next()
        }
      }
    },
    {
      path: '/admin/tournaments/:id/:tab',
      name: 'admin-tournament-details-tab',
      component: TournamentDetails,
      props: true,
      meta: {
        title: (route: RouteLocationNormalized) => `Tournament ${route.params.id} - BF Stats Tournament Manager`,
        description: 'Manage your Battlefield tournament rounds, track results, and view the overall winner.'
      },
      beforeEnter: (to, _from, next) => {
        const { isAuthenticated } = useAuth()
        if (!isAuthenticated.value) {
          next('/servers/bf1942')
        } else {
          // Validate tab parameter
          const validTabs = ['matches', 'teams', 'weeks', 'files', 'posts', 'settings']
          const tab = to.params.tab as string
          if (!validTabs.includes(tab)) {
            next(`/admin/tournaments/${to.params.id}/matches`)
          } else {
            next()
          }
        }
      }
    },
    {
      path: '/admin/data',
      name: 'admin-data',
      component: AdminDataManagement,
      meta: {
        title: 'Admin Data Management - BF Stats',
        description: 'Investigate and delete suspicious player sessions.'
      },
      beforeEnter: (_to, _from, next) => {
        const { isAuthenticated, isSupport } = useAuth()
        if (!isAuthenticated.value || !isSupport.value) {
          next('/dashboard')
        } else {
          next()
        }
      }
    },
    {
      path: '/system-stats',
      name: 'system-stats',
      component: SystemStats,
      meta: {
        title: 'System Statistics - BF Stats Infrastructure Metrics',
        description: 'Real-time data volume metrics across the platform. View the scale of data being processed in SQLite.'
      }
    },
    {
      path: '/auth/discord/callback',
      name: 'discord-callback',
      component: DiscordCallback,
      meta: {
        title: 'Discord Authentication - BF Stats',
        description: 'Completing Discord authentication...'
      }
    }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// SEO meta tag handler
router.afterEach((to) => {
  const meta = to.meta
  let title = 'BF Stats - Battlefield Server Statistics'
  let description = 'Real-time Battlefield server monitoring and player statistics for BF1942, FH2, and BF Vietnam.'

  if (meta?.title) {
    title = typeof meta.title === 'function' ? meta.title(to) : meta.title
    document.title = title

    // Update notification service's stored original title
    import('../services/notificationService').then(({ notificationService }) => {
      notificationService.updateOriginalTitle()
    })
  }

  if (meta?.description) {
    description = typeof meta.description === 'function' ? meta.description(to) : meta.description
  }

  // Helper function to update or create meta tags
  const updateMetaTag = (selector: string, attribute: string, content: string) => {
    let tag = document.querySelector(selector)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(attribute.includes('property') ? 'property' : 'name', attribute.replace('property=', '').replace('name=', ''))
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }

  // Standard meta tags
  updateMetaTag('meta[name="description"]', 'name=description', description)

  // Open Graph tags for social media
  updateMetaTag('meta[property="og:title"]', 'property=og:title', title)
  updateMetaTag('meta[property="og:description"]', 'property=og:description', description)
  updateMetaTag('meta[property="og:type"]', 'property=og:type', 'website')
  updateMetaTag('meta[property="og:url"]', 'property=og:url', window.location.href)
  updateMetaTag('meta[property="og:site_name"]', 'property=og:site_name', 'BF Stats')

  // Twitter Card tags
  updateMetaTag('meta[name="twitter:card"]', 'name=twitter:card', 'summary_large_image')
  updateMetaTag('meta[name="twitter:title"]', 'name=twitter:title', title)
  updateMetaTag('meta[name="twitter:description"]', 'name=twitter:description', description)
})

export default router
