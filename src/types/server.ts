export interface ServerInfo {
  guid: string;
  ip: string;
  port: number;
  queryPort: number;
  name: string;
  numPlayers: number;
  maxPlayers: number;
  mapName: string;
  password: boolean;
  gameType: string;
  gameVersion: string;
  gameMode: string;
  averageFps: number;
  contentCheck: boolean;
  dedicated: number;
  gameId: string;
  mapId: string;
  reservedSlots: number;
  roundTime: number;
  roundTimeRemain: number;
  status: number;
  anticheat: boolean;
  tickets1: number;
  tickets2: number;
  unpureMods: string;
  joinLink: string;
  joinLinkWeb: string;
  teams: ServerTeam[];
  players: ServerPlayer[];
}

export interface ServerTeam {
  index: number;
  label: string;
  tickets: number;
}

export interface ServerPlayer {
  name: string;
  score: number;
  kills: number;
  deaths: number;
  ping: number;
  team: number;
  teamLabel: string;
}

export interface PlayerWithKdr extends ServerPlayer {
  kdr: number;
  previousScore?: number;
  scoreChanged?: 'up' | 'down' | 'none';
}
