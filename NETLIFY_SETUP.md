# Netlify Environment Variables Setup

To make your app work with real Firebase and Pollinations API on Netlify, you need to add these environment variables:

## Steps:

1. **Go to your Netlify site dashboard**
2. **Navigate to Site settings → Build & deploy → Environment**
3. **Add these environment variables:**

### Firebase Configuration:
- **VITE_FIREBASE_API_KEY**: `AIzaSyBqQCowCToCtVh30OXfUOvoHTQFG6bTfBA`
- **VITE_FIREBASE_AUTH_DOMAIN**: `vaccume-ae377.firebaseapp.com`
- **VITE_FIREBASE_PROJECT_ID**: `allchat-27105`
- **VITE_FIREBASE_STORAGE_BUCKET**: `allchat-27105.firebasestorage.app`
- **VITE_FIREBASE_MESSAGING_SENDER_ID**: `905232532866`
- **VITE_FIREBASE_APP_ID**: `1:905232532866:web:c40a8786969659d06a7b9b`

### Pollinations API:
- **VITE_POLLINATIONS_API_KEY**: `sk_pAubOe0qN3XySFHvV4l8UVFhiT7APklU`

## Important Notes:
- Make sure to set these in the **Environment** section (not Build environment variables)
- After adding variables, you'll need to trigger a new deploy for them to take effect
- Your app will then have full Firebase authentication and AI generation capabilities

## Alternative: Netlify CLI
If you prefer using CLI:
```bash
netlify env:set VITE_FIREBASE_API_KEY "AIzaSyBqQCowCToCtVh30OXfUOvoHTQFG6bTfBA"
netlify env:set VITE_FIREBASE_AUTH_DOMAIN "vaccume-ae377.firebaseapp.com"
netlify env:set VITE_FIREBASE_PROJECT_ID "allchat-27105"
netlify env:set VITE_FIREBASE_STORAGE_BUCKET "allchat-27105.firebasestorage.app"
netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "905232532866"
netlify env:set VITE_FIREBASE_APP_ID "1:905232532866:web:c40a8786969659d06a7b9b"
netlify env:set VITE_POLLINATIONS_API_KEY "sk_pAubOe0qN3XySFHvV4l8UVFhiT7APklU"
netlify deploy --prod
```
