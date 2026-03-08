# Google OAuth Setup Guide

This guide walks you through configuring Google OAuth for the Gmail monitoring feature.

## Current Error

If you're seeing `Error 403: access_denied`, it means the redirect URI is not configured in Google Cloud Console.

## Setup Steps

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**

### 2. Create OAuth 2.0 Credentials (if not done)

If you already have OAuth credentials, skip to step 3.

Otherwise:
1. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
2. Select **Web application**
3. Give it a name (e.g., "Child Safety Monitor")
4. Configure as shown in step 3

### 3. Configure Authorized Redirect URIs

**This is the critical step to fix the 403 error:**

1. Find your OAuth 2.0 Client ID in the credentials list
2. Click on it to edit
3. Scroll to **Authorized redirect URIs**
4. Click **+ ADD URI** and add these URIs:
   ```
   http://localhost:3000/auth/google/callback
   http://127.0.0.1:3000/auth/google/callback
   ```
5. Click **SAVE** at the bottom

### 4. Enable Required APIs

Make sure these APIs are enabled:

1. Go to **APIs & Services** > **Library**
2. Search for and enable:
   - **Gmail API**
   - **Google People API** (or deprecated Google+ API)

### 5. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (for testing) or **Internal** (if you have a workspace)
3. Fill in the app information:
   - App name: Child Safety Monitor
   - User support email: your email
   - Developer contact: your email
4. Add required scopes:
   - `.../auth/gmail.readonly`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. **Important for Testing:** Add test users if your app is in testing mode:
   - Go to **Test users** section
   - Click **+ ADD USERS**
   - Add the Gmail addresses you want to test with

### 6. Update Backend Configuration

Your credentials should be configured in `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

**⚠️ Security Note:** Never commit `.env` files with real credentials to version control!

### 7. Restart Backend Server

After making these changes, restart your backend server:

```powershell
cd backend
npm start
```

## Testing the Integration

1. Start both backend and frontend servers:
   ```powershell
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Log in as a child user
3. Go to Settings (in Child Dashboard)
4. Click "Connect Gmail"
5. You should be redirected to Google's OAuth consent screen
6. After authorizing, you'll be redirected back to the app

## Common Issues

### Issue: Still getting 403 after configuration

**Solution:** 
- Wait 5-10 minutes for Google's changes to propagate
- Clear your browser cache and cookies
- Make sure the redirect URI matches exactly (including http vs https)

### Issue: "This app isn't verified"

**Solution:**
- This is normal for apps in development
- Click "Advanced" > "Go to [App Name] (unsafe)" to proceed
- For production, you need to submit your app for verification

### Issue: "Access blocked: This app's request is invalid"

**Solution:**
- Make sure all required scopes are added in OAuth consent screen
- Verify that the test user's email is added if app is in testing mode
- Check that Gmail API and People API are enabled

## Production Considerations

Before deploying to production:

1. **Update Redirect URI:**
   - Add your production domain: `https://yourdomain.com/auth/google/callback`
   - Update `GOOGLE_REDIRECT_URI` in production environment variables

2. **App Verification:**
   - Submit your app for Google verification
   - This process can take several days

3. **Security:**
   - Use environment variables for all credentials
   - Never expose credentials in client-side code
   - Implement proper token refresh logic
   - Store tokens encrypted in database

4. **OAuth Consent Screen:**
   - Change from "Testing" to "In production"
   - Add privacy policy and terms of service URLs
   - Verify your domain

## Architecture Flow

```
Child Dashboard (Frontend)
    ↓
1. User clicks "Connect Gmail"
    ↓
2. POST /api/gmail/connect { childId }
    ↓
Backend (gmailService.js)
    ↓
3. Generates OAuth URL with scopes
    ↓
4. Returns URL to frontend
    ↓
5. Frontend redirects to Google OAuth
    ↓
Google Authorization Server
    ↓
6. User authorizes app
    ↓
7. Google redirects to: http://localhost:3000/auth/google/callback?code=XXX&state=childId
    ↓
Frontend (GoogleCallback.jsx)
    ↓
8. Extracts code and state from URL
    ↓
9. POST /api/gmail/callback { code, state }
    ↓
Backend (gmailController.js)
    ↓
10. Exchanges code for tokens
    ↓
11. Saves tokens to Child model
    ↓
12. Returns success
    ↓
Frontend
    ↓
13. Redirects user back to dashboard
```

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) - For testing scopes
