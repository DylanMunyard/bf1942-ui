// Feed item data types
export interface FeedPostData {
  id: number;
  title: string;
  content: string;
  publishAt: string | null;
  createdAt: string;
}

export interface FeedMatchResultData {
  matchId: number;
  resultId: number;
  team1Name: string;
  team2Name: string;
  team1Tickets: number;
  team2Tickets: number;
  winningTeamName: string | null;
  mapName: string;
  createdAt: string;
}

export interface FeedTeamCreatedData {
  teamId: number;
  teamName: string;
  createdAt: string;
}

export interface FeedMatchScheduledData {
  matchId: number;
  team1Name: string;
  team2Name: string;
  scheduledDate: string;
  week: string | null;
  maps: string[];
  createdAt: string;
}

export type FeedItemData = FeedPostData | FeedMatchResultData | FeedTeamCreatedData | FeedMatchScheduledData;

export interface FeedItem {
  type: 'post' | 'match_result' | 'team_created' | 'match_scheduled';
  timestamp: string;
  data: FeedItemData;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Type guards for feed item data
export function isPostData(data: FeedItemData): data is FeedPostData {
  return 'title' in data && 'content' in data;
}

export function isMatchResultData(data: FeedItemData): data is FeedMatchResultData {
  return 'resultId' in data && 'team1Tickets' in data;
}

export function isTeamCreatedData(data: FeedItemData): data is FeedTeamCreatedData {
  return 'teamId' in data && 'teamName' in data && !('team2Name' in data);
}

export function isMatchScheduledData(data: FeedItemData): data is FeedMatchScheduledData {
  return 'scheduledDate' in data && 'maps' in data;
}

class TournamentFeedService {
  private baseUrl = '/stats/tournaments';

  async getFeed(
    tournamentId: number | string,
    cursor?: string,
    limit = 10
  ): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (cursor) {
      params.set('cursor', cursor);
    }
    params.set('limit', limit.toString());

    const url = `${this.baseUrl}/${encodeURIComponent(tournamentId)}/feed?${params.toString()}`;
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

    return response.json();
  }
}

export const tournamentFeedService = new TournamentFeedService();
