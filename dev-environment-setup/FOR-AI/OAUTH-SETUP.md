# Google OAuth 2.0 Setup Guide

## Overview

This guide walks you through creating Google OAuth credentials and configuring them for local development. After completing this guide, the OAuth config tests will pass.

## Prerequisites

- A Google account
- Access to the [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **New Project**
3. Name it (e.g., "Ruach Articles Dev") → **Create**
4. Select the new project from the dropdown

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in required fields:
   - **App name**: `Ruach Articles Dev`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through all steps
5. On the **Test users** step, add your Google email
6. Click **Save and Continue** → **Back to Dashboard**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Ruach Articles Local Dev`
5. Under **Authorized redirect URIs**, click **Add URI**:
   ```
   http://localhost:3000/auth/google/callback
   ```
6. Click **Create**
7. **Copy the Client ID and Client Secret** from the dialog

### 4. Update `.env.local`

Update these lines in your `.env.local` file with the real credentials:

```env
# ─── Google OAuth ──────────────────────────────────────────
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 5. Update JWT_SECRET and ADMIN_EMAIL

Generate a proper JWT secret:

```bash
openssl rand -base64 32
```

Update `.env.local`:

```env
JWT_SECRET=<generated-secret-from-openssl>
ADMIN_EMAIL=<your-google-email@gmail.com>
```

### 6. Verify Configuration

Run the OAuth config tests:

```bash
npx vitest run server/oauth-config.test.ts
```

All tests should pass if the credentials are correctly configured.

## What the Tests Validate

| Test | What it checks |
|------|---------------|
| Credentials configured | All three OAuth vars are non-empty |
| Localhost callback URL | Uses `http://localhost` (not https) in development |
| Correct callback path | Contains `/auth/google/callback` |
| Client ID format | Ends with `.apps.googleusercontent.com` |
| Client Secret format | Starts with `GOCSPX-` |
| JWT secret | At least 16 characters |
| Admin email | Valid email format |

## Troubleshooting

### "Invalid environment variables" error
- Make sure `.env.local` exists in the project root
- Check that all three `GOOGLE_*` variables are set (not placeholder values)

### OAuth redirect mismatch
- Verify the **Authorized redirect URI** in Google Console matches exactly:
  `http://localhost:3000/auth/google/callback`
- No trailing slash!

### "Access blocked" error when logging in
- Make sure your Google email is added as a **Test user** on the OAuth consent screen
- The app is in "Testing" mode, so only test users can authenticate

## Security Notes

- **Never commit `.env.local`** — it's in `.gitignore`
- The OAuth credentials are for **local development only**
- Use separate credentials for production
- The `JWT_SECRET` should be different in every environment