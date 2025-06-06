import axios from 'axios';
import {ServerInfo} from "@/types/server.ts";

/**
 * Fetches live server list from BFList API
 * @param game The game name used by the API
 * @returns Live server list
 */
export async function fetchLiveServersList(
    game: 'bf1942' | 'fh2'
): Promise<ServerInfo[]> {
    let cursor: string | undefined;
    let after: string | undefined;
    let hasMore: boolean;
    const servers: ServerInfo[] = [];
    do {
        const url = new URL(
            `/v2/${game}/servers`,
            'https://api.bflist.io'
        );
        url.searchParams.set('perPage', '100');

        // Set pagination parameters if present
        if (cursor && after) {
            url.searchParams.set('cursor', cursor);
            url.searchParams.set('after', after);
        }

        const response = await axios.get<{
            servers: ServerInfo[]
            cursor: string
            hasMore: boolean
        }>(url.toString());

        for (const server of response.data.servers) {
            servers.push(server);
            // Update `after` marker on the fly (avoids having to pop() later)
            after = server.ip + ':' + server.port;
        }

        cursor = response.data.cursor;
        hasMore = response.data.hasMore;
    } while (hasMore);

    return servers
}
