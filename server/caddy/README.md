# Caddy Setup for tools-api.winwinwealth.co

## Prerequisites
1. DNS: Add A record `tools-api.winwinwealth.co` → `72.60.209.157` in Cloudflare (DNS only, no proxy)
2. Caddy is already running on VPS host (not Docker)

## Steps

```bash
# 1. SSH to VPS
ssh root@72.60.209.157

# 2. Append the config block to Caddyfile
cat >> /etc/caddy/Caddyfile << 'EOF'

tools-api.winwinwealth.co {
	reverse_proxy 127.0.0.1:3002
	header {
		Access-Control-Allow-Origin https://tools.winwinwealth.co
		Access-Control-Allow-Credentials true
		Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
		Access-Control-Allow-Headers "Content-Type, Authorization"
	}
	@options method OPTIONS
	respond @options 204
	header {
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy strict-origin-when-cross-origin
	}
}
EOF

# 3. Validate config
caddy validate --config /etc/caddy/Caddyfile

# 4. Reload (zero-downtime)
sudo systemctl reload caddy

# 5. Verify
curl -I https://tools-api.winwinwealth.co/api/business
```

## Notes
- Caddy auto-provisions TLS via Let's Encrypt
- CORS is handled at Caddy level AND NestJS level (belt + suspenders)
- If NestJS CORS is sufficient, remove the `header` block from Caddy
