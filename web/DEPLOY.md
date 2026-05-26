# Deploy — tools.winwinwealth.co (Cloudflare Pages)

## Prerequisites
1. Cloudflare account with `winwinwealth.co` domain
2. `wrangler` CLI authenticated: `pnpm wrangler login`
3. DNS: CNAME `tools.winwinwealth.co` → CF Pages project

## First-time setup

```bash
# Create CF Pages project
pnpm wrangler pages project create insidebank-tools-web

# Set env vars (in CF dashboard or via wrangler)
pnpm wrangler pages secret put AUTH_SECRET
pnpm wrangler pages secret put LINE_CHANNEL_ID
pnpm wrangler pages secret put LINE_CHANNEL_SECRET
pnpm wrangler pages secret put RESEND_API_KEY

# Set non-secret vars in CF Pages dashboard:
# NEXT_PUBLIC_API_URL = https://tools-api.winwinwealth.co
# EMAIL_FROM = noreply@winwinwealth.co
```

## Deploy

```bash
pnpm deploy
# This runs: opennextjs-cloudflare build && wrangler pages deploy
```

## Custom domain
In CF Pages dashboard → Custom domains → Add `tools.winwinwealth.co`
