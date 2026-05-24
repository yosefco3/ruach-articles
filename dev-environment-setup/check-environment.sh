#!/bin/bash

# ═══════════════════════════════════════════════════════════
# 🔍 Development Environment Check Script
# ═══════════════════════════════════════════════════════════

set -e

echo "🔍 Checking Development Environment..."
echo ""

# ─── Colors ────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─── Helper Functions ──────────────────────────────────────
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ─── Check Docker ──────────────────────────────────────────
echo "📦 Checking Docker..."
if docker ps 2>/dev/null | grep -q ruach-mysql; then
    check_pass "Docker MySQL container is running"
else
    check_fail "Docker MySQL container is NOT running"
    echo "   Run: docker-compose up -d"
    exit 1
fi
echo ""

# ─── Check .env.local ──────────────────────────────────────
echo "📝 Checking .env.local..."
if [ -f ".env.local" ]; then
    check_pass ".env.local exists"
    
    # Check required variables
    if grep -q "DATABASE_URL=mysql://root:dev_password_2024@localhost:3306/ruach_dev" .env.local || grep -q "DATABASE_URL=mysql://root:dev_password_2024@127.0.0.1:3306/ruach_dev" .env.local; then
        check_pass "DATABASE_URL is configured for local MySQL"
    else
        check_fail "DATABASE_URL is not configured correctly"
    fi
    
    if grep -q "GOOGLE_CLIENT_ID=.*\.apps\.googleusercontent\.com" .env.local 2>/dev/null; then
        check_pass "GOOGLE_CLIENT_ID is configured"
    else
        check_warn "GOOGLE_CLIENT_ID may not be configured (OAuth won't work)"
    fi
else
    check_fail ".env.local does NOT exist"
    echo "   Copy from .env.example and configure"
    exit 1
fi
echo ""

# ─── Check uploads directory ───────────────────────────────
echo "💾 Checking uploads directory..."
if [ -d "uploads" ]; then
    check_pass "uploads/ directory exists"
else
    check_fail "uploads/ directory does NOT exist"
    echo "   Run: mkdir uploads"
    exit 1
fi
echo ""

# ─── Check Node modules ────────────────────────────────────
echo "📦 Checking Node modules..."
if [ -d "node_modules" ]; then
    check_pass "node_modules/ exists"
else
    check_fail "node_modules/ does NOT exist"
    echo "   Run: pnpm install"
    exit 1
fi
echo ""

# ─── Run Tests ─────────────────────────────────────────────
echo "🧪 Running integration tests..."
if pnpm test dev-environment-integration.test.ts --run; then
    check_pass "All integration tests passed"
else
    check_fail "Some integration tests failed"
    exit 1
fi
echo ""

# ─── Final Summary ─────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the dev server: pnpm dev"
echo "   2. Open http://localhost:3000"
echo "   3. Try logging in with Google OAuth"
echo ""