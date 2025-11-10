import { useRouter } from 'vue-router'

export const usePlayerComparison = () => {
  const router = useRouter()

  const comparePlayers = (players: string[]) => {
    console.log('comparePlayers called with:', players)
    if (players.length !== 2) {
      console.log('Not enough players selected')
      return
    }

    console.log('Navigating to player comparison with:', players[0], 'vs', players[1])

    // Navigate to PlayerComparison page with player names as query parameters
    router.push({
      name: 'player-comparison',
      query: {
        player1: players[0],
        player2: players[1]
      }
    }).catch(err => {
      console.error('Router navigation error:', err)
    })
  }

  return { comparePlayers }
}
