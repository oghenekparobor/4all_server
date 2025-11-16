#!/bin/bash

# Test script for consolidated API endpoints
# Usage: ./test-endpoints.sh [base_url]
# Example: ./test-endpoints.sh http://localhost:9080

BASE_URL="${1:-http://localhost:9080}"
echo "Testing endpoints at: $BASE_URL"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "  $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 201 ] || [ "$response" -eq 400 ] || [ "$response" -eq 401 ]; then
        echo -e "  ${GREEN}✓ Response: $response${NC}"
    else
        echo -e "  ${RED}✗ Response: $response${NC}"
    fi
    echo ""
}

echo "🧪 CORE ENDPOINTS"
echo "----------------"
test_endpoint "Status" "GET" "/api/status"
test_endpoint "Profile" "GET" "/api/profile"

echo ""
echo "🔐 AUTH ENDPOINTS"
echo "----------------"
test_endpoint "Login" "POST" "/api/auth?action=login" '{"email":"test@example.com","password":"test123"}'
test_endpoint "Request OTP" "POST" "/api/auth?action=request-otp" '{"email":"test@example.com","password":"test123"}'
test_endpoint "Verify OTP" "POST" "/api/auth?action=verify-otp" '{"email":"test@example.com","otp":"123456"}'

echo ""
echo "🎮 GAME ENDPOINTS"
echo "----------------"
test_endpoint "Initialize Game" "POST" "/api/games" '{"streamUrl":"https://twitch.tv/test"}'
test_endpoint "Get Game Details" "GET" "/api/games?gameId=test123"
test_endpoint "Stop Game" "POST" "/api/games?gameId=test123&action=stop"
test_endpoint "Update Stream URL" "PUT" "/api/games?gameId=test123&action=stream-url" '{"streamUrl":"https://twitch.tv/new"}'
test_endpoint "Submit Run" "POST" "/api/games?action=runs" '{"gameId":"test123","summary":{}}'
test_endpoint "Update Stats" "POST" "/api/games?action=stats" '{"stats":{}}'

echo ""
echo "⚡ BOOST ENDPOINTS"
echo "----------------"
test_endpoint "Boost Faction" "POST" "/api/boost?gameId=test123&faction=red" '{"amount":100,"username":"player1"}'
test_endpoint "Boost Player" "POST" "/api/boost?gameId=test123&playerId=player456" '{"amount":50,"username":"booster1"}'
test_endpoint "Get Boost Stats" "GET" "/api/boost?gameId=test123&action=stats"

echo ""
echo "🎯 EVENT ENDPOINTS"
echo "----------------"
test_endpoint "Acknowledge Event" "POST" "/api/events?action=ack" '{"eventId":"evt123"}'
test_endpoint "Trigger Event" "POST" "/api/events?gameId=test123&action=trigger" '{"eventId":"evt456","targetPlayer":"player789"}'

echo ""
echo "📦 ITEM ENDPOINTS"
echo "----------------"
test_endpoint "Drop Item" "POST" "/api/items?gameId=test123&action=drop" '{"itemId":"item456","targetPlayer":"player789"}'

echo ""
echo "⚙️  CONFIG ENDPOINTS"
echo "----------------"
test_endpoint "Set User Token" "POST" "/api/config?action=user-token" '{"token":"test-token-123"}'

echo ""
echo "========================================"
echo "✅ All endpoints tested!"
echo ""
echo "Note: 400/401 responses are expected for some endpoints"
echo "      without valid credentials or data."
echo "      The important thing is that endpoints are reachable."

