# 🎵 Spotify Premium Setup Guide

## 🔧 **Fix the "INVALID_CLIENT: Invalid redirect URI" Error**

The error occurs because the redirect URI isn't properly configured in your Spotify app settings.

## 📋 **Step 1: Configure Your Spotify App**

1. **Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**
2. **Log in with your Spotify account**
3. **Click on your app** (or create a new one)
4. **Click "Edit Settings"**

## 🔗 **Step 2: Set the Redirect URI**

In the app settings, under **"Redirect URIs"**, add:

```
http://localhost:4000/callback
```

**Important:** Make sure this URI is **exactly** as shown above.

## ⚙️ **Step 3: Update Environment Variables (Optional)**

Create a `.env` file in your project root:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:4000/callback
FRONTEND_URL=http://localhost:3000
```

## 🚀 **Step 4: Test the Authentication**

1. **Restart your server** to apply changes
2. **Click "Connect Spotify Premium"** in the app
3. **You should now be redirected to Spotify** without errors
4. **Log in with your Premium account**
5. **Grant permissions** to the app

## 🔍 **Alternative Solution: Use Frontend Redirect**

If the backend redirect still doesn't work, you can use a frontend-only approach:

1. **Change the redirect URI in Spotify Dashboard to:**
   ```
   http://localhost:3000
   ```

2. **Update the server redirect URI:**
   ```javascript
   const SPOTIFY_REDIRECT_URI = 'http://localhost:3000'
   ```

## 📱 **What Happens After Authentication:**

1. **Spotify redirects you back** to the app
2. **Your personal music library loads** automatically
3. **You can create real DJ mixes** from your actual songs
4. **Full track streaming** (not just 30-second previews)

## 🎯 **Expected Result:**

- ✅ **No more "INVALID_CLIENT" errors**
- ✅ **Successful Spotify authentication**
- ✅ **Access to your personal music library**
- ✅ **Real DJ mixing from your actual songs**

## 🆘 **Still Having Issues?**

1. **Check that the redirect URI is exactly correct** (no extra spaces, correct port)
2. **Make sure your Spotify app is active** in the dashboard
3. **Verify your client ID and secret** are correct
4. **Clear browser cache** and try again

## 🔐 **Security Note:**

The redirect URI must match **exactly** what's in your Spotify app settings. Even a single character difference will cause this error.

---

**Need help?** Check the Spotify Developer documentation or let me know what specific error you're seeing!