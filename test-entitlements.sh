#!/bin/bash

# 測試 GET /me/entitlements API 認證流程

set -e

API_URL="http://localhost:3000"
USER_EMAIL="user12@example.com"
USER_PASSWORD="password123"

echo "🚀 開始測試 /me/entitlements API 認證"
echo "========================================="
echo ""

# 第 1 步：登入並獲取 Token
echo "📝 步驟 1: 登入用戶 (user_id=12)"
echo "curl -X POST $API_URL/auth/login ..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

echo "登入響應:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# 提取 token
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null || echo "")

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
  echo "❌ 登入失敗！無法提取 JWT token"
  echo "請確保："
  echo "  1. 應用程式運行在 http://localhost:3000"
  echo "  2. 用戶 user_id=12 (email: $USER_EMAIL) 存在於數據庫"
  exit 1
fi

echo "✅ 成功取得 JWT Token"
echo "Token (前 50 字元): ${AUTH_TOKEN:0:50}..."
echo ""

# 第 2 步：測試 /me/entitlements API
echo "📝 步驟 2: 測試 /bookstore/me/entitlements API"
echo "curl -X GET '$API_URL/bookstore/me/entitlements?page=1&limit=20' -H 'Authorization: Bearer <token>'"
echo ""

API_RESPONSE=$(curl -s -X GET "$API_URL/bookstore/me/entitlements?page=1&limit=20" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/bookstore/me/entitlements?page=1&limit=20" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json")

echo "HTTP 狀態碼: $HTTP_CODE"
echo ""
echo "API 響應:"
echo "$API_RESPONSE" | jq . 2>/dev/null || echo "$API_RESPONSE"
echo ""

# 檢查結果
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 測試成功！API 返回 200 OK"
  EXIT_CODE=0
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ 認證失敗 (401 Unauthorized)"
  echo ""
  echo "可能的原因："
  echo "  1. Authorization header 格式錯誤"
  echo "  2. JWT token 過期或無效"
  echo "  3. Redis 連接失敗"
  echo ""
  echo "🔍 請查看伺服器日誌 (npm run start) 中的調試訊息"
  EXIT_CODE=1
else
  echo "❌ 服務器錯誤 ($HTTP_CODE)"
  EXIT_CODE=1
fi

echo ""
echo "📋 完整 Token 內容 (使用 jq):"
echo "$AUTH_TOKEN" | jq -R 'split(".") | .[1] | @base64d | fromjson' 2>/dev/null || echo "（無法解析）"

exit $EXIT_CODE
