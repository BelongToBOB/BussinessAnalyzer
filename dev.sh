#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🏗  InsideBank Tools — Dev Setup${NC}\n"

# 1. Check Postgres
if ! /opt/homebrew/opt/postgresql@17/bin/pg_isready -h localhost -q 2>/dev/null; then
  echo -e "${YELLOW}Starting Postgres...${NC}"
  brew services start postgresql@17
  sleep 2
fi
echo -e "${GREEN}✓ Postgres running${NC}"

# 2. Push schema if needed
echo -e "${YELLOW}Pushing schema...${NC}"
cd "$ROOT/server"
export DATABASE_URL="postgresql://analyzer_user:devpassword123@localhost:5432/winwin_analyzer"
pnpm prisma db push --url "$DATABASE_URL" --skip-generate 2>/dev/null || true
pnpm prisma generate 2>/dev/null
echo -e "${GREEN}✓ Schema synced${NC}"

# 3. Seed if empty
ROW_COUNT=$(/opt/homebrew/opt/postgresql@17/bin/psql -d winwin_analyzer -tAc "SELECT count(*) FROM \"User\"" 2>/dev/null || echo "0")
if [ "$ROW_COUNT" = "0" ]; then
  echo -e "${YELLOW}Seeding database...${NC}"
  pnpm db:seed
else
  echo -e "${GREEN}✓ Database has data ($ROW_COUNT users)${NC}"
fi

# 4. Kill stale processes
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 5. Start backend
echo -e "\n${YELLOW}Starting backend (port 3002)...${NC}"
cd "$ROOT/server"
pnpm start:dev > /tmp/insidebank-backend.log 2>&1 &
BACKEND_PID=$!

# 6. Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd "$ROOT/web"
pnpm dev > /tmp/insidebank-frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 4

# 7. Detect frontend port
FRONTEND_PORT=$(grep -o "localhost:[0-9]*" /tmp/insidebank-frontend.log 2>/dev/null | head -1 | cut -d: -f2)
FRONTEND_PORT=${FRONTEND_PORT:-3001}

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  InsideBank Tools — Dev Ready!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e ""
echo -e "  Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:3002${NC}"
echo -e "  DB Studio: ${YELLOW}cd server && pnpm db:studio${NC}"
echo -e ""
echo -e "  Login:     กด 'ใช้อีเมลแทน' → ใส่อีเมลอะไรก็ได้"
echo -e ""
echo -e "  Logs:      tail -f /tmp/insidebank-backend.log"
echo -e "             tail -f /tmp/insidebank-frontend.log"
echo -e ""
echo -e "  Stop:      ${YELLOW}kill $BACKEND_PID $FRONTEND_PID${NC}"
echo -e "             หรือกด Ctrl+C"
echo -e ""

# Wait for either to exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'; exit 0" INT TERM
wait
