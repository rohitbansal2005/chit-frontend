# ChitZ Setup Guide (API + Cloudinary)

The frontend talks to the Node/Express API in `backend/` and can optionally use Cloudinary for media uploads.

## 🚀 Backend API

1. Install dependencies and run the API in `backend/` (see backend README if present).
2. Expose the API base URL over HTTPS (local or deployed).
3. Ensure CORS allows the frontend origin set in `VITE_APP_URL` / `VITE_APP_URL_DEVELOPMENT`.

## ☁️ Cloudinary (optional)

1. Create a Cloudinary account and copy Cloud Name, API Key, and Upload Preset.
2. Add them to your environment file (see below). If you skip Cloudinary, leave the values empty to disable uploads.

## 🔐 Environment Variables

1. Copy `.env.example` to `.env.local`.
2. Fill in values for:
   - `VITE_APP_URL`, `VITE_APP_URL_DEVELOPMENT`
   - `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_API_KEY`, `VITE_CLOUDINARY_UPLOAD_PRESET` (optional)
   - Any analytics/AdSense IDs you plan to use

## 🧭 Development

```bash
npm install
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## ✅ Smoke Test Checklist

- Sign up / login via the backend API
- Send/receive messages
- Create a group and invite users
- Upload an avatar (Cloudinary) if configured

## 📞 Support

- Verify API base URL and CORS settings
- Confirm environment variables are loaded
- Check browser/network console for 4xx/5xx responses
