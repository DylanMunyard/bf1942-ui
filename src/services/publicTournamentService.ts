import { normalizeHex, isValidHex, getContrastingTextColor, generateComplementaryColor } from '@/utils/colorUtils';

export interface PublicTournamentTeam {
  id: number;
  name: string;
  createdAt: string;
  players: { playerName: string }[];
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
  roundId?: string;
  teamId?: number;
  teamName?: string;
  round?: PublicTournamentRound | null;
  matchResult?: PublicTournamentMatchResult;
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

export interface TournamentTheme {
  backgroundColour?: string;
  textColour?: string;
  primaryColour?: string;
  secondaryColour?: string;
  accentColour?: string;
  radius?: string;
  borderWidth?: string;
}

export interface PublicTournamentDetail {
  id: number;
  name: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  teams: PublicTournamentTeam[];
  matches: PublicTournamentMatch[];
  matchesByWeek?: PublicTournamentMatchesByWeek[];
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
}

export const publicTournamentService = new PublicTournamentService();
