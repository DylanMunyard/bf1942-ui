import { normalizeHex, isValidHex, getContrastingTextColor, generateComplementaryColor } from '@/utils/colorUtils';

export interface PublicTournamentTeam {
  id: number;
  name: string;
  createdAt: string;
  players: { playerName: string }[];
}

export interface TournamentFile {
  id: number;
  name: string;
  url: string;
  category: string | null;
  uploadedAt: string;
}

export interface PublicTournamentRoundPlayer {
  playerName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  team: number;
  teamLabel: string;
}

export interface PublicTournamentRound {
  roundId: string;
  serverGuid: string;
  serverName: string;
  mapName: string;
  startTime: string;
  endTime?: string;
  tickets1?: number;
  tickets2?: number;
  team1Label?: string;
  team2Label?: string;
  winningTeamName?: string;
  winningTeamPlayers?: { playerName: string }[];
  players?: PublicTournamentRoundPlayer[];
}

export interface PublicTournamentMatchResult {
  id: number;
  team1Id?: number;
  team1Name?: string;
  team2Id?: number;
  team2Name?: string;
  winningTeamId?: number;
  winningTeamName?: string;
  team1Tickets: number;
  team2Tickets: number;
}

export interface PublicTournamentMatchMap {
  id: number;
  mapName: string;
  mapOrder: number;
  teamId?: number;
  teamName?: string;
  matchResults: PublicTournamentMatchResult[];
}

export interface PublicTournamentMatch {
  id: number;
  scheduledDate: string;
  team1Name: string;
  team2Name: string;
  serverGuid?: string;
  serverName?: string;
  createdAt: string;
  maps: PublicTournamentMatchMap[];
  week?: string | null;
}

export interface PublicTournamentMatchesByWeek {
  week: string | null;
  matches: PublicTournamentMatch[];
}

export interface TournamentWeekDate {
  id?: number;
  week: string;
  startDate: string;
  endDate: string;
}

export interface TournamentTheme {
  backgroundColour?: string;
  textColour?: string;
  primaryColour?: string;
  secondaryColour?: string;
  accentColour?: string;
  radius?: string;
  borderWidth?: string;
}

export interface PublicTeamRanking {
  rank: number;
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  victories: number;
  ties: number;
  losses: number;
  roundsWon: number;
  roundsTied: number;
  roundsLost: number;
  ticketsFor: number;
  ticketsAgainst: number;
  ticketDifferential: number;
  points: number;
  totalRounds: number;
}

export interface PublicTournamentLeaderboard {
  tournamentId: number;
  tournamentName: string;
  week: string | null;
  rankings: PublicTeamRanking[];
}

export interface PublicTournamentDetail {
  id: number;
  name: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  status?: 'registration' | 'open' | 'closed';
  gameMode?: string;
  teams: PublicTournamentTeam[];
  matches: PublicTournamentMatch[];
  matchesByWeek?: PublicTournamentMatchesByWeek[];
  weekDates?: TournamentWeekDate[];
  latestMatches?: PublicTournamentMatch[];
  files?: TournamentFile[];
  hasHeroImage?: boolean;
  hasCommunityLogo?: boolean;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  serverGuid?: string;
  serverName?: string;
  discordUrl?: string;
  forumUrl?: string;
  rules?: string;
  theme: TournamentTheme;
}

class PublicTournamentService {
  private baseUrl = '/stats/tournaments';

  async getTournamentDetail(id: number): Promise<PublicTournamentDetail> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    const data: PublicTournamentDetail = await response.json();
    return data;
  }

  // Get tournament hero image URL
  getTournamentImageUrl(id: number): string {
    return `${this.baseUrl}/${id}/image`;
  }

  // Get tournament community logo URL
  getTournamentLogoUrl(id: number): string {
    return `${this.baseUrl}/${id}/logo`;
  }

  async getLeaderboard(idOrName: string | number, week?: string): Promise<PublicTournamentLeaderboard> {
    let url = `${this.baseUrl}/${idOrName}/leaderboard`;
    if (week) {
      url += `?week=${encodeURIComponent(week)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    const data: PublicTournamentLeaderboard = await response.json();
    return data;
  }
}

export const publicTournamentService = new PublicTournamentService();
