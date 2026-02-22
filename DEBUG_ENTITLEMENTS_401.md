# 診斷 GET /me/entitlements API 401 錯誤

## 🔍 問題診斷流程

### 步驟 1：準備環境
```bash
cd /Users/TETE/nodeProject/X-story/Nestjs-Auth
npm run build
npm run start
```

### 步驟 2：取得有效的 JWT Token

首先，以 user_id = 12 身份登入以取得 token：
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user12@example.com","password":"password123"}'
```

響應範例：
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

複製 `accessToken`，將其保存在環境變數中：
```bash
export AUTH_TOKEN="<your_accessToken_here>"
```

### 步驟 3：測試 /me/entitlements 端點

執行 API 請求：
```bash
curl -X GET 'http://localhost:3000/bookstore/me/entitlements?page=1&limit=20' \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

### 步驟 4：檢查伺服器日誌

根據您看到的日誌輸出，檢查以下訊號：

#### 🔵 成功的認證流程會看到：
```
🔵 [JwtAuthGuard] canActivate() 被呼叫
🔵 [JwtAuthGuard] Authorization header: Bearer eyJ...
🔵 [JwtStrategy] validate() 被呼叫
🔵 [JwtStrategy] JWT payload = { sub: 12, jti: "...", role: 1 }
🔵 [JwtStrategy] Access token 不在黑名單中，正常通過
✅ [JwtStrategy] validate() 成功返回: { userId: 12, roleLevel: 1 }
🔵 [JwtAuthGuard] handleRequest() 被呼叫
✅ [JwtAuthGuard] 認證成功，user: { "userId": 12, "roleLevel": 1 }
🔵 [BookstoreController] getMyEntitlements() 被呼叫
🔵 [BookstoreController] @CurrentUser() 返回: { "userId": 12, "roleLevel": 1 }
✅ [BookstoreController] 已取得 userId: 12
```

## 常見的 401 錯誤原因

### ❌ 1. 缺少 Authorization Header
```
❌ [JwtAuthGuard] 缺少 Authorization header
```

**解決方案**：確保 curl 命令包含 `-H "Authorization: Bearer $AUTH_TOKEN"`

### ❌ 2. Token 格式錯誤
```
❌ [JwtAuthGuard] Authorization header: undefined
```

**解決方案**：Token 必須以 `Bearer ` 開頭，確保複製完整的 token

### ❌ 3. Token 已過期或無效
```
❌ [JwtStrategy] 錯誤：JWT payload 缺少 sub 欄位
```

**解決方案**：
- 檢查 JWT_SECRET 環境變數是否正確
- 確認 token 沒有被篡改
- 重新登入以取得新 token

### ❌ 4. Redis 連接失敗
```
❌ [JwtStrategy] validate() 錯誤: connect ECONNREFUSED
```

**解決方案**：
```bash
# 確認 Redis 是否執行
redis-cli ping
# 應該返回 PONG

# 檢查 .env 中的 Redis 配置
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### ❌ 5. Token 在黑名單中
```
⚠️  [JwtStrategy] Access token 在黑名單中但仍在寬限期内，允許通過
```

**這不是錯誤**，token 在寬限期內仍然有效。如果看到以下才是問題：
```
❌ [JwtStrategy] Access token 已被加入黑名單且超過寬限期
```

**解決方案**：重新登入以取得新的未被黑名單的 token

## 詳細日誌位置

- **JWT 策略驗證日誌**: `src/auth/strategy/jwt.strategy.ts` - `validate()` 方法
- **Guard 日誌**: `src/auth/jwt-auth.guard.ts` - `canActivate()` 和 `handleRequest()` 方法  
- **Controller 日誌**: `src/bookstore/bookstore.controller.ts` - `getMyEntitlements()` 方法

## 進階調試

### 檢查 Environment 設定
```bash
# 確認 .env 文件中有以下設置
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_ACCESS_EXPIRES_IN=$JWT_ACCESS_EXPIRES_IN"
echo "REDIS_HOST=$REDIS_HOST"
echo "REDIS_PORT=$REDIS_PORT"
```

### 驗證 Token 內容
```bash
# 使用線上工具 https://jwt.io 或執行以下命令
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('$AUTH_TOKEN'), null, 2))"
```

應該得到：
```json
{
  "sub": 12,
  "jti": "...",
  "role": 1,
  "iat": 1234567890,
  "exp": 1234571490
}
```

## 最可能的情況

根據典型的 NestJS JWT 認證問題，最可能是：

1. **70%** - Authorization header 格式錯誤或缺失
2. **15%** - Redis 連接成功但無法訪問
3. **10%** - JWT_SECRET 環境變數配置不正確
4. **5%** - Token 已過期

**建議先執行步驟 2 和 3，查看完整的日誌輸出。**
