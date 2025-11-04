# Online Players API Requirements

This document outlines the API requirements for the Online Players feature implementation.

## API Endpoint

### GET /api/players/online

Returns a list of currently online players with their session information.

#### Query Parameters (All Optional)

- `gameId` (string): Filter by specific game server type
- `playerName` (string): Filter by player name (partial match, case-insensitive)
- `serverName` (string): Filter by server name (partial match, case-insensitive)

#### Response Format

```json
{
  "players": [
    {
      "playerName": "string",
      "sessionDurationMinutes": "number",
      "joinedAt": "ISO_DATE_STRING",
      "currentServer": {
        "serverGuid": "string",
        "serverName": "string",
        "gameId": "string",
        "mapName": "string",
        "sessionKills": "number",
        "sessionDeaths": "number",
        "currentScore": "number",
        "ping": "number",
        "teamName": "string"
      }
    }
  ],
  "totalOnline": "number",
  "lastUpdated": "ISO_DATE_STRING",
  "gameBreakdown": {
    "bf1942": "number",
    "fh2": "number",
    "bfv": "number"
  }
}
```

#### Field Descriptions

**Player Fields:**
- `playerName`: Unique identifier for the player
- `sessionDurationMinutes`: How long the player has been in their current session
- `joinedAt`: ISO timestamp when the player joined their current session

**Server Fields:**
- `serverGuid`: Unique server identifier
- `serverName`: Human-readable server name
- `gameId`: Game type identifier ("42", "FH2", "BFV")
- `mapName`: Current map being played (optional)
- `sessionKills`: Player's kills in current session (optional)
- `sessionDeaths`: Player's deaths in current session (optional)
- `currentScore`: Player's current score in session (optional)
- `ping`: Player's network latency in milliseconds (optional)
- `teamName`: Player's current team/faction (optional)

**Summary Fields:**
- `totalOnline`: Total number of online players
- `lastUpdated`: ISO timestamp when the data was last refreshed
- `gameBreakdown`: Count of players by game type

## Alternative Simplified Endpoint

If the full response is too complex, you can implement a simpler version:

### GET /api/players/online/simple

Returns just the essential online player data:

```json
[
  {
    "playerName": "string",
    "sessionDurationMinutes": "number",
    "gameId": "string",
    "serverName": "string",
    "mapName": "string",
    "sessionKills": "number",
    "sessionDeaths": "number"
  }
]
```

## Real-time Updates

For optimal user experience, consider implementing:

1. **WebSocket updates**: Push real-time player status changes
2. **Polling interval**: Update data every 30-60 seconds
3. **Change detection**: Only send updates when player status actually changes

## Data Sources

The API should aggregate data from:

1. **Active game servers**: Current player sessions and statistics
2. **Game server monitoring**: Server status, map rotations, player counts
3. **Player database**: Historical player data for enrichment

## Performance Considerations

- **Caching**: Cache results for 15-30 seconds to reduce server load
- **Pagination**: Consider adding pagination for very high player counts (>100 players)
- **Filtering**: Implement server-side filtering to reduce response size
- **CDN**: Consider CDN caching for frequently accessed data

## Security & Privacy

- **Rate limiting**: Prevent API abuse with reasonable rate limits
- **Player privacy**: Only expose public gaming statistics
- **Data retention**: Follow appropriate data retention policies

## Error Handling

Standard HTTP status codes:
- `200 OK`: Successful response
- `400 Bad Request`: Invalid query parameters
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Temporary service unavailability

Error response format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

## Implementation Notes

1. **Game ID Mapping**: The current frontend expects these specific gameId values:
   - `"42"` for Battlefield 1942
   - `"FH2"` for Forgotten Hope 2
   - `"BFV"` for Battlefield Vietnam

2. **Navigation Integration**: Players can click on:
   - Player names → Navigate to `/players/{playerName}`
   - Server names → Navigate to `/servers/{encodedServerName}`

3. **Auto-refresh**: The frontend automatically refreshes every 30 seconds when enabled

4. **Responsive Design**: The UI adapts to mobile devices with collapsible filters and grid layout
