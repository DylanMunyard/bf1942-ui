# Authentication Integration Proposal

## Overview
This document outlines the authentication strategy for the BF1942 Servers Dashboard, enabling users to log in with social platforms while maintaining a secure, trustworthy experience.

## Authentication Strategy

### Supported Providers
1. **Discord** - Primary choice for gaming communities
2. **Google** - Widely trusted, provides email access
3. **Facebook** - Popular social platform
4. **GitHub** (Optional) - Developer-friendly for tech-savvy users

### Technical Implementation
- **OAuth 2.0** with PKCE (Proof Key for Code Exchange) for security
- **JWT tokens** for session management
- **Refresh tokens** for seamless re-authentication
- **Domain verification** to establish trust (1942.munyard.dev)

## Trust & Security Measures

### Building User Trust
1. **Custom OAuth App Registration**
   - Register application with clear branding: "BF1942 Dashboard"
   - Use recognizable app icon/logo on OAuth consent screens
   - Clear permission requests (email, basic profile only)

2. **Transparent Privacy Policy**
   - Clear data usage explanation
   - No data selling/sharing commitments
   - GDPR compliance ready

3. **Minimal Permission Requests**
   - Email address (required)
   - Basic profile info (name, avatar - optional)
   - No access to friends lists, posting permissions, etc.

## Database Schema

### Core Authentication Tables

#### `users`
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

#### `user_auth_providers`
```sql
CREATE TABLE user_auth_providers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(20) NOT NULL, -- 'discord', 'google', 'facebook', 'github'
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(100),
    access_token_hash VARCHAR(255), -- Hashed for security
    refresh_token_hash VARCHAR(255), -- Hashed for security
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_name, provider_user_id)
);
```

#### `user_sessions`
```sql
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Player Linking Tables

#### `user_player_claims`
```sql
CREATE TABLE user_player_claims (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    game_type VARCHAR(20) NOT NULL, -- 'bf1942', 'fh2', 'bfvietnam'
    claim_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verification_method VARCHAR(50), -- 'server_command', 'stats_verification', 'admin_approval'
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by BIGINT REFERENCES users(id), -- Admin who verified
    notes TEXT,
    UNIQUE(player_name, game_type)
);
```

### User Preferences Tables

#### `user_preferences`
```sql
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);
```

#### `user_favorite_servers`
```sql
CREATE TABLE user_favorite_servers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    server_name VARCHAR(255) NOT NULL,
    game_type VARCHAR(20) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, server_name, game_type)
);
```

#### `user_dashboard_layouts`
```sql
CREATE TABLE user_dashboard_layouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    layout_name VARCHAR(100) DEFAULT 'default',
    layout_config JSONB NOT NULL, -- Widget positions, sizes, etc.
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Integration

### Vue.js Auth Module Structure
```
src/
├── auth/
│   ├── AuthService.ts          # Main auth service
│   ├── OAuthProviders.ts       # Provider configurations
│   ├── TokenManager.ts         # JWT/session management
│   └── components/
│       ├── LoginModal.vue      # Login modal component
│       ├── UserProfile.vue     # User profile dropdown
│       └── PlayerClaiming.vue  # Player name claiming UI
```

### Authentication Flow
1. User clicks "Login" → Opens modal with provider options
2. Selects provider → Redirects to OAuth provider
3. User authorizes → Returns with authorization code
4. Frontend exchanges code for tokens → Stores securely
5. User is authenticated → Profile shows in header

## Backend API Endpoints

### Authentication Endpoints
- `POST /auth/login/:provider` - Initiate OAuth flow
- `POST /auth/callback/:provider` - Handle OAuth callback
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate session
- `GET /auth/me` - Get current user profile

### User Management Endpoints
- `GET /user/preferences` - Get user preferences
- `PUT /user/preferences` - Update preferences
- `GET /user/players` - Get claimed players
- `POST /user/players/claim` - Claim a player name
- `GET /user/favorites` - Get favorite servers
- `POST /user/favorites` - Add favorite server

## Security Considerations

### Token Security
- JWT tokens stored in httpOnly cookies (not localStorage)
- CSRF protection with SameSite cookie attributes
- Short-lived access tokens (15 minutes)
- Secure refresh token rotation

### Data Protection
- All sensitive tokens hashed in database
- Rate limiting on auth endpoints
- IP-based session validation
- Automatic session cleanup

## Player Verification System

### Verification Methods
1. **Server Command Verification**
   - User joins server and types verification code in chat
   - Backend monitors chat logs for verification
   - Automatic approval upon successful verification

2. **Statistics Correlation**
   - Match playing patterns with claimed player
   - Score thresholds and time-based verification
   - Semi-automatic with admin review

3. **Admin Approval**
   - Manual verification by community admins
   - For disputed or complex cases

## Enhanced Features with Authentication

### Personalized Dashboard
- Custom server favorites prominently displayed
- Personal player stats front and center
- Tailored news/updates based on game preferences

### Player Recognition
- Highlight user's player names in server lists
- Personal statistics tracking across sessions
- Achievement tracking and progress

### Community Features
- Friend lists (future enhancement)
- Player reputation system
- Custom tags/notes on players

## Implementation Phases

### Phase 1: Core Authentication
- OAuth provider integration
- Basic user registration/login
- Session management
- User preferences storage

### Phase 2: Player Linking
- Player name claiming system
- Basic verification methods
- Favorite servers functionality

### Phase 3: Enhanced Features
- Personalized dashboards
- Advanced player verification
- Community features

## Privacy & Compliance

### Data Minimization
- Only collect necessary data (email, basic profile)
- Clear retention policies
- User data export capabilities
- Account deletion functionality

### Transparency
- Clear privacy policy
- Data usage explanations
- Opt-in for optional features
- User control over data sharing

## Technical Recommendations

### OAuth Configuration
- Use environment variables for client secrets
- Implement proper redirect URI validation
- Support for multiple environments (dev/prod)

### Database Indexing
- Index on user email, session tokens
- Composite indexes for player claims
- Proper foreign key constraints

### Monitoring
- Authentication attempt logging
- Failed login tracking
- Token usage analytics
- User activity metrics

This proposal provides a comprehensive authentication system that builds trust while enabling powerful personalization features for the BF1942 gaming community.
