# Google OAuth 2.0 Setup for Local Development

## Overview

This guide walks you through creating Google OAuth credentials and configuring them for local development.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown → **New Project**
3. Name it (e.g., "Ruach Articles Dev") → **Create**
4. Select the new project

### 2. Configure OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - **App name**: `Ruach Articles Dev`
   - **User support email**: your email
   - **Developer contact email**: your email
4. **Save and Continue** through all steps
5. On **Test users** step, add your Google email
6. **Save and Continue** → **Back to Dashboard**

### 3. Create OAuth 2.0 Credentials

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Ruach Articles Local Dev`
5. **Authorized redirect URIs** → **Add URI**:
   ```
   http://localhost:3000/auth/google/callback
   ```
6. **Create**
7. **Copy Client ID and Client Secret**

### 4. Update `.env.local`

```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 5. Generate JWT Secret

```bash
openssl rand -base64 32
```

```env
JWT_SECRET=<generated-secret>
ADMIN_EMAIL=<your-google-email@gmail.com>
```

### 6. Verify

```bash
npx vitest run server/oauth-config.test.ts
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `redirect_uri_mismatch` | Check redirect URI matches exactly in Google Console |
| `invalid_client` | Verify Client ID and Secret are copied correctly |
| `access_denied` | Add your email as Test User in OAuth consent screen |
| `Invalid environment variables` | Ensure `.env.local` exists with real values (not placeholders) |

## Security

- **Never commit** `.env.local` — it's in `.gitignore`
- Use **separate credentials** for production
- `JWT_SECRET` must be **unique per environment**