# 在 Swagger UI 上使用 /me/entitlements API

## 🚀 快速開始

### 第 1 步：啟動應用程式

```bash
cd /Users/TETE/nodeProject/X-story/Nestjs-Auth
npm run build
npm run start
```

應用程式將在 `http://localhost:3000` 啟動。

### 第 2 步：打開 Swagger UI

在瀏覽器中開啟：
```
http://localhost:3000/api/docs
```

## 📝 在 Swagger UI 上執行 API

### ✅ 步驟 1：授權認證 (Authorize)

1. **點擊 Swagger UI 右上角的 <kbd>Authorize</kbd> 按鈕**

   ![Authorize Button](https://imgur.com/OGX8V7Z.png)

2. **一個授權對話框會彈出，要求輸入 Bearer token**

   ```
   Available authorizations
   
   BearerAuth (apiKey)
   [________________________________________]  Logout
   ```

3. **輸入 JWT Token**
   
   在文本框中輸入您的 JWT token（**不需要包含 "Bearer " 前綴**）：
   
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyLCJqdGkiOiI4YTQ0MDRjMS04MmVjLTQxYzctOGQ0OC05ZDc0OGNlMWI1NTIiLCJyb2xlIjoxLCJpYXQiOjE3NDAyMDI0NTMsImV4cCI6MTc0MDI4ODg1M30.9v...
   ```

4. **點擊 <kbd>Authorize</kbd> 按鈕確認**

5. **點擊 <kbd>Close</kbd> 關閉對話框**

現在 Swagger UI 會自動將 JWT token 添加到所有後續請求的 `Authorization: Bearer <token>` 標頭中。

---

### ✅ 步驟 2：取得 JWT Token

如果您還沒有 JWT token，需要先登入：

1. **在 Swagger UI 中找到 POST /auth/login 端點**

2. **點擊 <kbd>Try it out</kbd> 按鈕**

3. **在 Request body 中輸入登入資訊**

   ```json
   {
     "email": "user12@example.com",
     "password": "password123"
   }
   ```

4. **點擊 <kbd>Execute</kbd> 按鈕**

5. **複製響應中的 accessToken**

   ```json
   {
     "success": true,
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

---

### ✅ 步驟 3：執行 GET /me/entitlements API

1. **在 Swagger UI 中找到 GET /bookstore/me/entitlements 端點**

2. **確認 "Authorize" 按鈕已變綠色** ✅ 
   
   這表示您已經成功授權，JWT token 已被保存。

3. **點擊 <kbd>Try it out</kbd> 按鈕**

4. **（可選）輸入查詢參數**
   
   - `page`：頁碼（預設 1）
   - `limit`：每頁筆數（預設 20）
   
   例如：
   ```
   page = 1
   limit = 10
   ```

5. **點擊 <kbd>Execute</kbd> 按鈕**

6. **查看響應結果**

   成功時會返回 200 OK：
   
   ```json
   {
     "items": [
       {
         "storyListId": 1,
         "createdAt": "2026-02-20T10:30:00.000Z",
         "story": {
           "id": 1,
           "main_menu_name": "小鎮失蹤手冊",
           "author": "夏佩爾&烏奴奴",
           "main_menu_image": "mainMenuImage-1709644166964.jpeg"
         }
       }
     ],
     "total": 5,
     "page": 1,
     "limit": 10
   }
   ```

---

## 🔍 常見問題

### ❓ Q1：還是得到 "缺少 Authorization header" 錯誤？

**原因**：Authorize 按鈕沒有變綠色，表示 token 沒有被保存。

**解決方案**：
1. 重新點擊 Authorize 按鈕
2. 確認 token 已輸入（沒有 "Bearer " 前綴）
3. 點擊 Authorize 確認授權
4. 刷新頁面後重試

### ❓ Q2：如何刪除已保存的 token？

點擊 Authorize 按鈕，然後點擊 <kbd>Logout</kbd> 按鈕。

### ❓ Q3：Token 過期了怎麼辦？

再次執行 POST /auth/login 端點取得新的 token，然後重複授權步驟。

### ❓ Q4：為什麼我的 token 不生效？

可能的原因：
1. **Token 已過期** → 重新登入取得新 token
2. **Token 被黑名單化**（已登出） → 重新登入
3. **與 user_id 對應的帳戶不存在** → 確認帳戶是否存在
4. **Redis 連接失敗** → 檢查 Redis 是否運行
   
   ```bash
   redis-cli ping  # 應該返回 PONG
   ```

---

## 📋 完整流程示例

### 場景：測試已登入用戶 (user_id=12) 的已購書籍

```bash
# 1. 登入取得 token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user12@example.com","password":"password123"}'

# 複製返回的 accessToken

# 2. 在 Swagger UI 授權
# - 複製 token
# - 點擊 Authorize
# - 貼入 token
# - 確認授權

# 3. 執行 GET /bookstore/me/entitlements
# - 在 Swagger UI 中找到此端點
# - 點擊 Try it out
# - （可選）輸入 page=1, limit=20
# - 點擊 Execute
```

---

## 🔧 後端配置

已在下列檔案中配置了 Swagger Bearer 認證：

- **src/main.ts**：全局 Swagger 配置，添加了 `.addBearerAuth()`
- **src/bookstore/bookstore.controller.ts**：`getMyEntitlements()` 方法上添加了 `@ApiBearerAuth()` 裝飾器

這樣 Swagger UI 會自動顯示認證選項並正確傳遞 JWT token。

---

## 💡 提示

- 每次刷新頁面時，Swagger UI 會保留您的授權 token（儲存在瀏覽器的 localStorage）
- 您可以同時測試多個需要認證的 API 端點，因為 token 一旦授權就對所有端點有效
- 如遇到問題，可以打開瀏覽器開發者工具 (F12) 的 Network 標籤，查看實際發送的請求頭
