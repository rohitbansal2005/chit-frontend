# 🔐 Security Guide for ChitZ

This project now uses a custom backend API. Keep secrets out of the repo and lock down your deployments.

## Environment Variables

1. Copy `.env.example` to `.env.local`.
2. Store secrets here only (API base URLs, Cloudinary keys, analytics IDs, AdSense IDs).
3. Ensure `.env.local` stays in `.gitignore`.

## Best Practices

- Rotate credentials regularly and per-environment (dev/staging/prod).
- Avoid hardcoding tokens or URLs in source; prefer env vars.
- Enable HTTPS for API and CDN endpoints.
- Limit CORS to trusted origins defined by `VITE_APP_URL` and `VITE_APP_URL_DEVELOPMENT`.
- Apply rate limiting and authentication on backend routes.

## Deployment Tips

- Add env vars in your hosting dashboard (e.g., Vercel/Netlify) instead of committing them.
- If you disable Cloudinary, leave related vars empty to avoid leaking dummy keys.

## Incident Response

1. Rotate affected keys and update hosting env vars.
2. Redeploy frontend and backend.
3. Review access logs for suspicious requests.
4. Force logout/credential refresh if tokens were exposed.
