import axios from 'axios';
import {
  OnlinePlayerItem,
  OnlinePlayersResponse,
  OnlinePlayersFilters
} from '../types/onlinePlayersTypes';

/**
 * Mock data generator for online players
 * This simulates what the real API would return
 */
const generateMockOnlinePlayersData = (): OnlinePlayerItem[] => {
  const mockPlayers: OnlinePlayerItem[] = [
    {
      playerName: "BattleMaster_42",
      sessionDurationMinutes: 47,
      joinedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-001",
        serverName: "=101st= Aberdeen Proving Grounds",
        gameId: "42",
        mapName: "Aberdeen",
        sessionKills: 12,
        sessionDeaths: 8,
        currentScore: 450,
        ping: 32,
        teamName: "Axis"
      }
    },
    {
      playerName: "TankCommander",
      sessionDurationMinutes: 23,
      joinedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-002",
        serverName: "FH2 - Forgotten Honor Server",
        gameId: "FH2",
        mapName: "Sidi Bou Zid",
        sessionKills: 6,
        sessionDeaths: 4,
        currentScore: 280,
        ping: 45,
        teamName: "Allied"
      }
    },
    {
      playerName: "VietnameseVet",
      sessionDurationMinutes: 156,
      joinedAt: new Date(Date.now() - 156 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-003",
        serverName: "Vietnam Warriors - 24/7 Jungle",
        gameId: "BFV",
        mapName: "Operation Flaming Dart",
        sessionKills: 34,
        sessionDeaths: 21,
        currentScore: 1250,
        ping: 28,
        teamName: "US Army"
      }
    },
    {
      playerName: "SniperElite_1943",
      sessionDurationMinutes: 8,
      joinedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-001",
        serverName: "=101st= Aberdeen Proving Grounds",
        gameId: "42",
        mapName: "Aberdeen",
        sessionKills: 3,
        sessionDeaths: 1,
        currentScore: 120,
        ping: 67,
        teamName: "Allied"
      }
    },
    {
      playerName: "PanzerKing",
      sessionDurationMinutes: 91,
      joinedAt: new Date(Date.now() - 91 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-004",
        serverName: "FH2 Europe - Combined Arms",
        gameId: "FH2",
        mapName: "Normandy",
        sessionKills: 18,
        sessionDeaths: 12,
        currentScore: 680,
        ping: 41,
        teamName: "German"
      }
    },
    {
      playerName: "JungleFighter",
      sessionDurationMinutes: 35,
      joinedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-005",
        serverName: "BFV Hardcore - No Respawn Limit",
        gameId: "BFV",
        mapName: "Ho Chi Minh Trail",
        sessionKills: 9,
        sessionDeaths: 7,
        currentScore: 310,
        ping: 52,
        teamName: "NVA"
      }
    },
    {
      playerName: "DesertFox_88",
      sessionDurationMinutes: 12,
      joinedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-006",
        serverName: "BF1942 Classic - El Alamein 24/7",
        gameId: "42",
        mapName: "El Alamein",
        sessionKills: 4,
        sessionDeaths: 2,
        currentScore: 180,
        ping: 39,
        teamName: "British"
      }
    },
    {
      playerName: "Luftwaffe_Ace",
      sessionDurationMinutes: 67,
      joinedAt: new Date(Date.now() - 67 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-007",
        serverName: "FH2 Pacific Theater",
        gameId: "FH2",
        mapName: "Iwo Jima",
        sessionKills: 15,
        sessionDeaths: 9,
        currentScore: 520,
        ping: 33,
        teamName: "Japanese"
      }
    },
    {
      playerName: "NavySeals_Charlie",
      sessionDurationMinutes: 29,
      joinedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-003",
        serverName: "Vietnam Warriors - 24/7 Jungle",
        gameId: "BFV",
        mapName: "Operation Flaming Dart",
        sessionKills: 8,
        sessionDeaths: 5,
        currentScore: 290,
        ping: 44,
        teamName: "US Army"
      }
    },
    {
      playerName: "SturmPioneer",
      sessionDurationMinutes: 143,
      joinedAt: new Date(Date.now() - 143 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-008",
        serverName: "FH2 Eastern Front - Stalingrad",
        gameId: "FH2",
        mapName: "Stalingrad",
        sessionKills: 28,
        sessionDeaths: 19,
        currentScore: 950,
        ping: 37,
        teamName: "German"
      }
    },
    {
      playerName: "RedBaron_2024",
      sessionDurationMinutes: 5,
      joinedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-009",
        serverName: "BF1942 Air Combat - Battle of Britain",
        gameId: "42",
        mapName: "Battle of Britain",
        sessionKills: 2,
        sessionDeaths: 0,
        currentScore: 80,
        ping: 25,
        teamName: "German"
      }
    },
    {
      playerName: "SpitfirePilot",
      sessionDurationMinutes: 78,
      joinedAt: new Date(Date.now() - 78 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-009",
        serverName: "BF1942 Air Combat - Battle of Britain",
        gameId: "42",
        mapName: "Battle of Britain",
        sessionKills: 16,
        sessionDeaths: 11,
        currentScore: 620,
        ping: 29,
        teamName: "British"
      }
    },
    {
      playerName: "VietCong_Sniper",
      sessionDurationMinutes: 52,
      joinedAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-010",
        serverName: "BFV Realism Mod - Authentic Vietnam",
        gameId: "BFV",
        mapName: "Mekong Delta",
        sessionKills: 13,
        sessionDeaths: 6,
        currentScore: 475,
        ping: 48,
        teamName: "NVA"
      }
    },
    {
      playerName: "MarineCorps_Alpha",
      sessionDurationMinutes: 17,
      joinedAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-010",
        serverName: "BFV Realism Mod - Authentic Vietnam",
        gameId: "BFV",
        mapName: "Mekong Delta",
        sessionKills: 5,
        sessionDeaths: 3,
        currentScore: 205,
        ping: 35,
        teamName: "US Marines"
      }
    },
    {
      playerName: "Rommel_Afrika",
      sessionDurationMinutes: 189,
      joinedAt: new Date(Date.now() - 189 * 60 * 1000).toISOString(),
      currentServer: {
        serverGuid: "server-011",
        serverName: "FH2 North Africa Campaign",
        gameId: "FH2",
        mapName: "El Alamein",
        sessionKills: 41,
        sessionDeaths: 23,
        currentScore: 1380,
        ping: 31,
        teamName: "German"
      }
    }
  ];

  return mockPlayers;
};

/**
 * Fetches the list of currently online players
 * In a real implementation, this would make an API call to get live data
 * For now, this returns mock data that simulates a real online players API
 * 
 * @param filters Optional filters to apply to the results
 * @returns Promise<OnlinePlayerItem[]> List of currently online players
 */
export async function fetchOnlinePlayersList(filters?: OnlinePlayersFilters): Promise<OnlinePlayerItem[]> {
  try {
    // In a real implementation, this would be:
    // const response = await axios.get<OnlinePlayersResponse>('/api/players/online', { params: filters });
    // return response.data.players;

    // For now, simulate API delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let players = generateMockOnlinePlayersData();

    // Apply filters if provided
    if (filters) {
      if (filters.gameId) {
        players = players.filter(player => 
          player.currentServer?.gameId === filters.gameId
        );
      }
      
      if (filters.playerName) {
        const searchTerm = filters.playerName.toLowerCase();
        players = players.filter(player =>
          player.playerName.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.serverName) {
        const searchTerm = filters.serverName.toLowerCase();
        players = players.filter(player =>
          player.currentServer?.serverName.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.minSessionTime !== undefined) {
        players = players.filter(player =>
          player.sessionDurationMinutes >= filters.minSessionTime!
        );
      }
      
      if (filters.maxSessionTime !== undefined) {
        players = players.filter(player =>
          player.sessionDurationMinutes <= filters.maxSessionTime!
        );
      }
    }

    return players;
  } catch (err) {
    console.error('Error fetching online players list:', err);
    throw new Error('Failed to get online players list');
  }
}

/**
 * Fetches comprehensive online players data with statistics
 * This would be used for dashboard widgets or analytics
 * 
 * @param filters Optional filters to apply to the results
 * @returns Promise<OnlinePlayersResponse> Comprehensive online players data
 */
export async function fetchOnlinePlayersData(filters?: OnlinePlayersFilters): Promise<OnlinePlayersResponse> {
  try {
    // In a real implementation, this would be:
    // const response = await axios.get<OnlinePlayersResponse>('/api/players/online/summary', { params: filters });
    // return response.data;

    // For now, simulate API delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const players = await fetchOnlinePlayersList(filters);
    
    // Calculate game breakdown
    const gameBreakdown = {
      bf1942: players.filter(p => p.currentServer?.gameId === '42').length,
      fh2: players.filter(p => p.currentServer?.gameId === 'FH2').length,
      bfv: players.filter(p => p.currentServer?.gameId === 'BFV').length,
    };

    const response: OnlinePlayersResponse = {
      players,
      totalOnline: players.length,
      lastUpdated: new Date().toISOString(),
      gameBreakdown
    };

    return response;
  } catch (err) {
    console.error('Error fetching online players data:', err);
    throw new Error('Failed to get online players data');
  }
}

// Re-export types for convenience
export type { OnlinePlayerItem, OnlinePlayersResponse, OnlinePlayersFilters } from '../types/onlinePlayersTypes';