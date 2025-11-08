#!/bin/bash

# ============================================
# TEST SCRIPT: Manual Creator Fee Claim
# ============================================
# This script manually triggers the creator fee claim function
# to test if it's working properly
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================="
echo "CREATOR FEE CLAIM TEST"
echo "========================================="
echo ""

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: SUPABASE_URL not set${NC}"
    echo "Please set: export SUPABASE_URL=https://your-project.supabase.co"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo "Please set: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Token mint address
TOKEN_MINT="4RB9s6anCqR9bwA5NBYPZdsY3pdkS43r9bGLJjBYpump"

echo -e "${YELLOW}📡 Calling claim-creator-fee function...${NC}"
echo "Token Mint: $TOKEN_MINT"
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Make the request
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/claim-creator-fee" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"mint\":\"${TOKEN_MINT}\"}")

# Check if response is empty
if [ -z "$RESPONSE" ]; then
    echo -e "${RED}❌ Error: Empty response from server${NC}"
    exit 1
fi

# Pretty print the response
echo -e "${GREEN}📥 Response:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Parse response and show status
SUCCESS=$(echo "$RESPONSE" | grep -o '"success"[[:space:]]*:[[:space:]]*true' | head -1)
ERROR=$(echo "$RESPONSE" | grep -o '"error"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1)

if [ ! -z "$SUCCESS" ]; then
    # Extract values if present
    TOTAL_SOL=$(echo "$RESPONSE" | grep -o '"totalSOL"[[:space:]]*:[[:space:]]*[0-9.]*' | grep -o '[0-9.]*$')
    DEPLOYER_SOL=$(echo "$RESPONSE" | grep -o '"deployerSOL"[[:space:]]*:[[:space:]]*[0-9.]*' | grep -o '[0-9.]*$')
    DEV_SOL=$(echo "$RESPONSE" | grep -o '"devSOL"[[:space:]]*:[[:space:]]*[0-9.]*' | grep -o '[0-9.]*$')

    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ SUCCESS - Creator fees claimed!${NC}"
    echo -e "${GREEN}=========================================${NC}"

    if [ ! -z "$TOTAL_SOL" ]; then
        echo ""
        echo "💰 Financial Summary:"
        echo "   Total claimed: ${TOTAL_SOL} SOL"
        echo "   To Deployer (pool): ${DEPLOYER_SOL} SOL"
        echo "   To Dev wallet: ${DEV_SOL} SOL"
        echo ""

        # Extract transaction signatures
        CLAIM_TX=$(echo "$RESPONSE" | grep -o '"claimTxSig"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[A-Za-z0-9]*"' | tr -d '"' | tail -1)
        DEPLOYER_TX=$(echo "$RESPONSE" | grep -o '"deployerTxSig"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[A-Za-z0-9]*"' | tr -d '"' | tail -1)
        DEV_TX=$(echo "$RESPONSE" | grep -o '"devTxSig"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[A-Za-z0-9]*"' | tr -d '"' | tail -1)

        if [ ! -z "$CLAIM_TX" ]; then
            echo "🔗 Transaction Links:"
            echo "   Claim: https://solscan.io/tx/${CLAIM_TX}"
            [ ! -z "$DEPLOYER_TX" ] && echo "   Deployer: https://solscan.io/tx/${DEPLOYER_TX}"
            [ ! -z "$DEV_TX" ] && echo "   Dev: https://solscan.io/tx/${DEV_TX}"
        fi
    fi
elif [ ! -z "$ERROR" ]; then
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}⚠️  Claim failed or no fees available${NC}"
    echo -e "${YELLOW}=========================================${NC}"
    echo ""
    echo "This is normal if:"
    echo "  • No trades have happened on Pump.fun yet"
    echo "  • All fees have already been claimed"
    echo "  • The token creator wallet doesn't match"
    echo ""
    echo "Check the error message above for details"
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}❌ Unexpected response format${NC}"
    echo -e "${RED}=========================================${NC}"
fi

echo ""
echo "To check the database status, run:"
echo "  psql YOUR_DATABASE_URL -f supabase/migrations/check_creator_rewards_status.sql"
echo ""
