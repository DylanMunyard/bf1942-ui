/**
 * AI Chat Service for streaming chat responses via SSE.
 */

export interface PageContext {
  pageType?: 'player' | 'server' | 'round' | 'home';
  playerName?: string;
  serverGuid?: string;
  /** Display name for the server (e.g. for AI chat hint); API still uses serverGuid. */
  serverName?: string;
  game?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  context?: PageContext;
  conversationHistory?: ChatMessage[];
}

export interface MentionResult {
  id: string;
  name: string;
  detail?: string;
}

/**
 * Streams a chat response from the AI endpoint.
 * Returns an AsyncGenerator that yields response chunks.
 */
export async function* streamChat(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/stats/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
    }
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              yield parsed.content;
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Checks if the AI chat service is available.
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await fetch('/stats/ai/health');
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Search for players for @ mentions.
 */
export async function searchPlayersForMention(query: string): Promise<MentionResult[]> {
  try {
    const response = await fetch(`/stats/ai/search/players?query=${encodeURIComponent(query)}&game=bf1942`);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.players || []).slice(0, 8).map((p: { playerName: string; totalScore: number; kdRatio: number }) => ({
      id: p.playerName,
      name: p.playerName,
      detail: `Score: ${p.totalScore.toLocaleString()} | K/D: ${p.kdRatio.toFixed(2)}`
    }));
  } catch (err) {
    console.error('Player search error:', err);
    return [];
  }
}

/**
 * Search for servers for # mentions.
 */
export async function searchServersForMention(query: string): Promise<MentionResult[]> {
  try {
    const response = await fetch(`/stats/ai/search/servers?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.servers || []).slice(0, 8).map((s: { serverName: string; serverGuid: string; gameId: string }) => ({
      id: s.serverGuid,
      name: s.serverName,
      detail: s.gameId
    }));
  } catch (err) {
    console.error('Server search error:', err);
    return [];
  }
}
