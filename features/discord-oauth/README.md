# Discord OAuth Setup Guide

This guide will help you set up Discord OAuth authentication for your BF1942 Stats Dashboard.

## Prerequisites

- A Discord account
- Access to the [Discord Developer Portal](https://discord.com/developers/applications)

## Step 1: Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application" in the top right
3. Give your application a name (e.g., "BF1942 Stats Dashboard")
4. Click "Create"

## Step 2: Configure OAuth2 Settings

1. In your application, click on "OAuth2" in the left sidebar
2. Under "Redirects", click "Add Redirect"
3. Add your callback URLs:
   - **Development**: `http://localhost:5173/auth/discord/callback`
   - **Production**: `https://1942.munyard.dev/auth/discord/callback` (or your production URL)
4. Click "Save Changes"

## Step 3: Get Your Credentials

1. Still in the OAuth2 section, find your **Client ID** at the top
2. Click "Reset Secret" to generate a new **Client Secret** (or view existing one)
3. Copy both values - you'll need them for the next step

⚠️ **Important**: Keep your Client Secret private! Never commit it to version control.

## Step 4: Configure Frontend Environment Variables

1. Open `.env.development` (for local development) or `.env.production` (for production)
2. Replace the placeholder Client ID with your actual Discord Client ID:

```env
# Discord OAuth Configuration (Frontend)
VITE_DISCORD_CLIENT_ID=your_actual_client_id_here
```

For production:
```env
# Discord OAuth Configuration (Frontend)
VITE_DISCORD_CLIENT_ID=your_actual_client_id_here
```

⚠️ **Important**: The Client Secret should ONLY be configured on the backend, never in the frontend environment variables!

## Step 5: Backend Configuration

The backend (`/stats/auth/login` endpoint) needs to be updated to handle Discord authorization codes:

### Backend Environment Variables

Add these to your backend environment configuration:

```env
DISCORD_CLIENT_ID=your_actual_client_id_here
DISCORD_CLIENT_SECRET=your_actual_client_secret_here
```

### Backend Implementation

The backend should accept a `discordCode` parameter in addition to `googleIdToken`:

1. When a `discordCode` and `redirectUri` are received:
   - Exchange the authorization code for an access token using Discord's OAuth2 endpoint
   - Fetch the user's profile from Discord
   - Create or update the user in your database
   - Issue a long-lived JWT token (same as Google auth)

2. Expected request format:
   ```json
   {
     "discordCode": "authorization_code_from_discord",
     "redirectUri": "http://localhost:5173/auth/discord/callback"
   }
   ```

3. Return the same response format as Google auth:
   ```json
   {
     "accessToken": "your_long_lived_jwt",
     "expiresAt": "2024-01-01T00:00:00Z",
     "user": {
       "id": 123,
       "name": "Discord User",
       "email": "user@example.com"
     }
   }
   ```

### Discord OAuth2 Token Exchange (Backend)

Here's how to exchange the authorization code for an access token:

```typescript
// Exchange authorization code for access token
const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: discordCode,
    redirect_uri: redirectUri,
  }).toString(),
});

const tokenData = await tokenResponse.json();
const accessToken = tokenData.access_token;

// Get user info from Discord
const userResponse = await fetch('https://discord.com/api/users/@me', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

const discordUser = await userResponse.json();
// discordUser contains: id, username, discriminator, email, avatar, etc.
```

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to your app
3. Click the login button
4. Select "Sign in with Discord"
5. You should be redirected to Discord's authorization page
6. After authorizing, you'll be redirected back to your app and logged in

## Troubleshooting

### "Discord Client ID not configured" error
- Make sure you've set `VITE_DISCORD_CLIENT_ID` in your `.env.development` file
- Restart your dev server after changing environment variables

### Redirect URI mismatch error
- Ensure the redirect URI in Discord Developer Portal exactly matches the one in your environment variables
- Check for trailing slashes - they must match exactly

### Backend authentication fails
- Verify the backend is properly handling the `discordToken` parameter
- Check backend logs for detailed error messages
- Ensure the Discord token is being validated correctly

### Token expired errors
- Discord access tokens expire - the backend should handle this by issuing its own long-lived JWT
- The frontend only uses Discord tokens for initial authentication, then relies on the backend JWT

## Security Best Practices

1. **Never commit secrets**: Add `.env.development` and `.env.production` to `.gitignore`
2. **Use HTTPS in production**: Discord requires HTTPS for production redirect URIs
3. **Validate tokens server-side**: Always verify Discord tokens on the backend
4. **Implement rate limiting**: Protect your auth endpoints from abuse
5. **Store minimal user data**: Only request and store necessary Discord user information

## OAuth Scopes

The current implementation requests these Discord scopes:
- `identify`: Access to user's ID, username, and avatar
- `email`: Access to user's email address

If you need additional permissions, update the scope in `src/services/authService.ts`:
```typescript
scope: 'identify email guilds', // Example: adding guilds scope
```

## Further Reading

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Discord API Reference](https://discord.com/developers/docs/intro)
