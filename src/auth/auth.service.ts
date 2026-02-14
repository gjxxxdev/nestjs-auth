// 新增 refreshToken / logout / 寄送註冊驗證信
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid'; // 導入 uuidv4
import { MailService } from '../mail/mail.service'; // 導入 MailService
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private googleClients: OAuth2Client[];
  private googleClientIds: string[];

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: Redis, // 來自 ioredis 套件注入
    private readonly mailService: MailService, // 注入 MailService
  ) {
    // 檢查必要的環境變數
    const requiredEnvVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_ACCESS_EXPIRES_IN',
      'JWT_REFRESH_EXPIRES_IN',
      'REDIS_HOST',
      'REDIS_PORT'
    ];

    for (const envVar of requiredEnvVars) {
      if (!this.configService.get(envVar)) {
        console.warn(`警告：環境變數 ${envVar} 未設置`);
      }
    }

    // 初始化 Google OAuth2 客戶端，支援多個平台
    this.googleClientIds = [
      this.configService.get('GOOGLE_WEB_CLIENT_ID'),
      this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
      this.configService.get('GOOGLE_IOS_CLIENT_ID'),
    ].filter(Boolean); // 過濾掉 undefined 或 null 的值

    this.googleClients = this.googleClientIds.map(
      (clientId) => new OAuth2Client(clientId),
    );
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('帳號不存在');

    const resetToken = uuidv4();
    const key = `reset:${resetToken}`;
    await this.redis.set(key, user.id, 'EX', 60 * 30); // 30分鐘

    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = `請點擊下列連結重設您的密碼：<a href='${resetUrl}'>${resetUrl}</a>`;
    await this.mailService.sendMail({ to: user.email, subject: '重設密碼', html });

    return { success: true, message: '已發送重設密碼信件' };
  }

  async resetPassword(token: string, newPassword: string) {
    const key = `reset:${token}`;
    const userId = await this.redis.get(key);
    if (!userId) throw new UnauthorizedException('重設連結已過期或無效');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(+userId, hashed);
    await this.redis.del(key);

    return { success: true, message: '密碼已更新，請重新登入' };
  }

  async verifyEmail(token: string) {
    const key = `verify:${token}`;
    const userId = await this.redis.get(key);
    if (!userId) {
      // 額外提示使用者錯誤訊息，可依情境更換為 NotFoundException 或其他處理
      throw new UnauthorizedException('驗證連結已過期或無效，請重新註冊或要求新驗證信');
    }

    await this.usersService.markEmailVerified(+userId);
    await this.redis.del(key);

    return { success: true, message: '信箱驗證成功' };
  }

  /**
   * 重新發送 Email 驗證信
   * 查找使用者，如果使用者存在且未驗證，則生成新的驗證令牌並發送郵件。
   * @param email 使用者的電子郵件
   * @returns 包含成功訊息的回應
   * @throws UnauthorizedException 如果找不到使用者或信箱已驗證
   */
  async resendVerification(email: string) {
    // 根據 email 查找使用者
    const user = await this.usersService.findByEmail(email);
    // 如果找不到使用者，拋出未授權異常
    if (!user) {
      throw new UnauthorizedException('找不到該 email 使用者');
    }
    // 如果信箱已經驗證，拋出未授權異常
    if (user.emailVerified) {
      throw new UnauthorizedException('信箱已驗證，無需重新發送');
    }

    // 生成新的驗證令牌
    const verifyToken = uuidv4();
    // 將令牌存入 Redis，設定過期時間為 24 小時
    const redisKey = `verify:${verifyToken}`;
    await this.redis.set(redisKey, user.id, 'EX', 60 * 60 * 24); // 24 小時

    // 構建驗證連結
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verifyToken}`;
    // 構建郵件內容
    const content = `請點擊以下連結以驗證您的信箱：<a href='${verifyUrl}'>${verifyUrl}</a>`;
    // 發送驗證郵件
    await this.mailService.sendMail({ to: email, subject: '請驗證您的 Email', html: content });

    // 返回成功訊息
    return { success: true, message: '驗證信已重新發送' };
  }

  private getAccessTokenKey(accessToken: string): string {
    const payload = this.jwtService.decode(accessToken) as any;
    if (payload.jti) {
      return `bl:access:${payload.jti}`;
    }
    return `bl:access:${payload.sub}:${payload.iat}`;
  }

  private getRefreshKey(refreshToken: string): string {
    const payload = this.jwtService.decode(refreshToken) as any;
    if (payload.jti) {
      return `bl:refresh:${payload.jti}`;
    }
    return `bl:refresh:${payload.sub}:${payload.iat}`;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  async blacklistAccessToken(accessToken: string) {
    const key = this.getAccessTokenKey(accessToken);
    const payload = this.jwtService.decode(accessToken) as any;
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);

    console.log('將 Access Token 加入黑名單');
    console.log('Token Key:', key);
    console.log('Token JTI:', payload.jti);
    console.log('Token 剩餘時間:', expiresIn);
    console.log('設定寬限期:', 30);

    if (expiresIn > 0) {
      // 固定 30 秒寬限期
      const gracePeriod = 30; // 30 秒寬限期
      
      // 設定黑名單標記，使用 Token 的剩餘時間作為 TTL
      await this.redis.set(key, 'blacklisted', 'EX', expiresIn);
      console.log('已設定黑名單 Key:', key, 'TTL:', expiresIn);
      
      // 設定寬限期標記，只存在 30 秒
      const graceKey = `${key}:grace`;
      await this.redis.set(graceKey, '1', 'EX', gracePeriod);
      console.log('已設定寬限期 Key:', graceKey, 'TTL:', gracePeriod);
    } else {
      console.log('Token 已過期，無需加入黑名單');
    }
  }

  async logout(refreshToken: string, accessToken?: string) {
    // Blacklist Refresh Token
    const refreshKey = this.getRefreshKey(refreshToken);
    const refreshPayload = this.jwtService.decode(refreshToken) as any;
    const refreshExpiresIn = refreshPayload.exp - Math.floor(Date.now() / 1000);

    if (refreshExpiresIn > 0) {
      await this.redis.set(refreshKey, 'blacklisted', 'EX', refreshExpiresIn);
    }

    // Blacklist Access Token (如果提供)
    if (accessToken) {
      await this.blacklistAccessToken(accessToken);
    }

    return { success: true, message: '已登出' };
  }

  /**
   * 檢查 access token 的剩餘有效時間
   * @param accessToken access token
   * @returns 剩餘時間（秒）
   */
  private getTokenRemainingTime(accessToken: string): number {
    try {
      const payload = this.jwtService.decode(accessToken) as any;
      if (!payload || !payload.exp) {
        return 0;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = payload.exp - currentTime;
      
      return Math.max(0, remainingTime);
    } catch (error) {
      console.error('檢查 Token 剩餘時間失敗:', error);
      return 0;
    }
  }

  /**
   * 獲取刷新閾值時間（秒）
   * @returns 閾值時間（秒）
   */
  private getRefreshThreshold(): number {
    const thresholdMinutes = parseInt(this.configService.get('TOKEN_REFRESH_THRESHOLD_MINUTES') || '10');
    return thresholdMinutes * 60;
  }

  async refreshToken(refreshToken: string, oldAccessToken?: string) {
    console.log('=== Refresh Token 請求開始 ===');
    console.log('收到的 refresh token:', refreshToken?.substring(0, 20) + '...'); // 只顯示前20個字符

    // 檢查 token 是否存在
    if (!refreshToken) {
      console.log('錯誤：未提供 refresh token');
      throw new UnauthorizedException('未提供 refresh token');
    }

    // 檢查 token 是否在黑名單中
    const blacklisted = await this.redis.get(this.getRefreshKey(refreshToken));
    if (blacklisted) {
      console.log('錯誤：Token 已被加入黑名單');
      throw new UnauthorizedException('Refresh token 已失效');
    }

    try {
      console.log('開始驗證 refresh token...');

      // 獲取 refresh secret
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
      console.log('使用的 refresh secret:', refreshSecret ? '已設置' : '未設置');

      if (!refreshSecret) {
        console.log('錯誤：JWT_REFRESH_SECRET 未設置');
        throw new UnauthorizedException('伺服器配置錯誤：缺少 JWT_REFRESH_SECRET');
      }

      // 驗證 token
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
      console.log('驗證成功，payload:', payload);

      // 檢查 payload 結構
      if (!payload || !payload.sub) {
        console.log('錯誤：Token payload 結構無效');
        throw new UnauthorizedException('Token payload 結構無效');
      }

      // 查找使用者
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        console.log('錯誤：找不到該使用者');
        throw new UnauthorizedException('使用者不存在');
      }

      if (!user.emailVerified) {
        console.log('錯誤：使用者信箱未驗證');
        throw new UnauthorizedException('請先完成 Email 驗證');
      }

      // 智慧刷新邏輯
      let accessTokenToReturn = oldAccessToken;
      let refreshed = false;

      if (oldAccessToken) {
        const remainingTime = this.getTokenRemainingTime(oldAccessToken);
        const refreshThreshold = this.getRefreshThreshold();
        
        console.log(`Token 剩餘時間: ${remainingTime} 秒，刷新閾值: ${refreshThreshold} 秒`);

        if (remainingTime <= refreshThreshold) {
          console.log('Token 剩餘時間不足，執行刷新');
          
          // 將舊的 Access Token 加入黑名單
          console.log('將舊的 Access Token 加入黑名單');
          await this.blacklistAccessToken(oldAccessToken);

          console.log('使用者驗證成功，生成新的 access token...');

          // 生成新的 access token（包含新的 JTI）
          accessTokenToReturn = this.jwtService.sign(
            { sub: payload.sub, jti: uuidv4() },
            {
              expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '1h',
              secret: this.configService.get('JWT_SECRET')
            }
          );
          refreshed = true;

          // 檢查新生成的 Token 是否有 JTI
          const newTokenPayload = this.jwtService.decode(accessTokenToReturn) as any;
          console.log('新生成的 Access Token JTI:', newTokenPayload.jti);
        } else {
          console.log('Token 剩餘時間充足，直接返回現有 Token');
        }
      } else {
        console.log('未提供舊的 Access Token，生成新的 access token...');
        
        // 生成新的 access token（包含新的 JTI）
        accessTokenToReturn = this.jwtService.sign(
          { sub: payload.sub, jti: uuidv4() },
          {
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '1h',
            secret: this.configService.get('JWT_SECRET')
          }
        );
        refreshed = true;
      }

      const remainingTime = this.getTokenRemainingTime(accessTokenToReturn);

      console.log('=== Refresh Token 請求成功 ===');
      return { 
        success: true, 
        accessToken: accessTokenToReturn,
        expiresIn: remainingTime,
        refreshed: refreshed
      };

    } catch (err) {
      console.log('=== Refresh Token 驗證失敗 ===');
      console.log('錯誤類型:', err.constructor.name);
      console.log('錯誤訊息:', err.message);
      console.log('錯誤堆疊:', err.stack);

      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token 已過期');
      } else if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Refresh token 格式無效');
      } else {
        throw new UnauthorizedException('Refresh token 驗證失敗');
      }
    }
  }

  generateTokens(userId: number) {
    const jti = uuidv4(); // 使用現有的 uuidv4
    const payload = { sub: userId, jti };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      success: true,
      accessToken,
      refreshToken,
    };
  }

  //old
  // generateTokens(userId: number) {
  //   const accessToken = this.jwtService.sign(
  //     { userId },
  //     { secret: this.configService.get('JWT_SECRET'), expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') }
  //   );
  //   const refreshToken = this.jwtService.sign(
  //     { userId },
  //     { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') }
  //   );
  //   return { success: true, accessToken, refreshToken, };
  // }

  // 註冊流程 - 建立帳號並寄送驗證信

  async register({ 
    email, 
    password, 
    name, 
    birth_date, 
    gender, 
    role_level 
  }: { 
    email: string; 
    password: string; 
    name?: string;
    birth_date?: string;
    gender?: number;
    role_level?: number;
  }) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email 已註冊');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({ 
      email, 
      password: hashed, 
      name,
      birth_date: birth_date ? new Date(birth_date) : undefined,
      gender: gender !== undefined ? gender : 0,
      role_level: role_level !== undefined ? role_level : 1
    });

    const verifyToken = uuidv4();
    const redisKey = `verify:${verifyToken}`;
    await this.redis.set(redisKey, user.id, 'EX', 60 * 60 * 24);

    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verifyToken}`;
    const content = `請點擊以下連結以驗證您的信箱：<a href='${verifyUrl}'>${verifyUrl}</a>`;
    await this.mailService.sendMail({ to: email, subject: '請驗證您的 Email', html: content });

    return { success: true, message: '註冊成功，請查收驗證信件' };
  }

  // 調整 login / social login 統一呼叫 generateTokens()

  /**
   * 驗證 Google ID Token
   * 嘗試使用多個 Google 客戶端 ID 驗證 ID Token。
   * @param idToken Google 提供的 ID Token
   * @returns 驗證成功後的 Payload
   * @throws UnauthorizedException 如果 ID Token 無效或無法驗證
   */
  async verifyGoogleToken(idToken: string) {
    // 遍歷所有配置的 Google 客戶端，嘗試驗證 ID Token
    for (const client of this.googleClients) {
      try {
        const ticket = await client.verifyIdToken({ idToken });
        const payload = ticket.getPayload();

        // 額外驗證 aud (Audience) 和 iss (Issuer)
        // 確保 aud 包含在已配置的 Google Client ID 列表中
        if (!this.googleClientIds.includes(payload.aud)) {
          throw new UnauthorizedException('不合法的 Google client ID');
        }
        // 確保 iss 是 Google 官方的發行者
        if (
          payload.iss !== 'https://accounts.google.com' &&
          payload.iss !== 'accounts.google.com'
        ) {
          throw new UnauthorizedException('不合法的 Google Token 發行者');
        }

        return payload; // 驗證成功，返回 Payload
      } catch (e) {
        // 繼續嘗試下一個 client，如果當前 client 驗證失敗
        console.error(`Google Token 驗證失敗 (Client ID: ${client._clientId}):`, e.message);
      }
    }
    // 所有客戶端都無法驗證，拋出未授權異常
    throw new UnauthorizedException('無效的 Google Token');
  }

  /**
   * 處理 Google 登入
   * 接收 Google ID Token，驗證後處理使用者登入或註冊。
   * @param idToken Google 提供的 ID Token
   * @returns 包含 accessToken 的登入成功回應
   * @throws UnauthorizedException 如果 Google Token 無效或無法獲取 email
   */
  async googleLogin(idToken: string) {
    // 使用 verifyGoogleToken 方法驗證 ID Token
    const payload = await this.verifyGoogleToken(idToken);

    // 檢查 Payload 中是否存在 email
    if (!payload?.email) throw new UnauthorizedException('Google 回傳無 email');

    // 根據 email 查找或創建使用者
    let user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      // 如果使用者不存在，則創建新使用者
      user = await this.usersService.createSocialUser({
        email: payload.email,
        provider: 'google',
        providerId: payload.sub, // 使用 Google 提供的唯一識別碼
        name: payload.name,
      });
    }

    // 生成 JWT Token 並返回
    // Generate JWT Token and return
    return this.generateTokens(user.id);
  }

  /**
   * 處理 Facebook 登入，自動判斷是 iOS Limited Login 的 id_token 還是 Web/Android 的標準 access_token。
   * @param token Facebook 提供的令牌，可能是 id_token (JWT 格式) 或標準 access_token。
   * @returns 包含 accessToken 和 refreshToken 的登入成功回應。
   * @throws UnauthorizedException 如果 Facebook token 無效或無法獲取 email。
   */
  async facebookLogin(token: string) {
    // 從配置服務中獲取 Facebook 應用程式 ID 和密鑰
    // Get Facebook App ID and App Secret from config service
    const appId = this.configService.get('FACEBOOK_APP_ID');
    const appSecret = this.configService.get('FACEBOOK_APP_SECRET');

    let facebookData;

    try {
      // 嘗試解析 token 是否為 JWT 格式 (id_token)
      // Try to parse the token as JWT format (id_token)
      const decodedHeader = jwt.decode(token, { complete: true }) as any;

      if (decodedHeader && decodedHeader.header.alg && decodedHeader.header.kid) {
        // 如果是 JWT 格式，嘗試作為 Facebook id_token 進行驗證
        // If it's JWT format, try to verify as Facebook id_token
        const client = jwksClient({
          jwksUri: 'https://www.facebook.com/.well-known/oauth/openid/jwks/',
        });

        const key = await client.getSigningKey(decodedHeader.header.kid);
        const signingKey = key.getPublicKey();

        const payload = jwt.verify(token, signingKey, {
          algorithms: ['RS256'],
        }) as any;

        // 驗證 iss 和 aud
        // Verify iss and aud
        const validIssuers = ['https://www.facebook.com', 'https://fid.facebook.com'];
        if (!validIssuers.includes(payload.iss)) {
          throw new UnauthorizedException('Facebook id_token 來源不合法');
        }
        if (payload.aud !== appId) {
          throw new UnauthorizedException('Facebook App ID 不匹配');
        }

        facebookData = {
          id: payload.user_id,
          email: payload.email,
          name: payload.name,
        };
        console.log('Facebook id_token 驗證成功');
      } else {
        // 如果不是 JWT 格式，或缺少 JWT 相關 header，則嘗試作為標準 access_token 處理
        // If it's not JWT format, or lacks JWT headers, try to process as a standard access_token
        console.warn('Token is not a valid JWT or missing JWT headers, trying as general access token.');
        const graphApiUrl = `https://graph.facebook.com/me?fields=id,email,name&access_token=${token}`;
        const { data } = await axios.get(graphApiUrl);
        facebookData = data;
        console.log('Facebook general access token 驗證成功');
      }
    } catch (error) {
      // 捕獲所有驗證失敗的錯誤
      // Catch all verification errors
      console.error('Facebook token 驗證失敗:', error.message);
      throw new UnauthorizedException('Facebook token 驗證失敗');
    }

    // 檢查是否成功獲取到 email
    // Check if email was successfully obtained
    if (!facebookData?.email) {
      throw new UnauthorizedException('Facebook 回傳無 email');
    }

    // 根據 email 查找或創建使用者
    // Find or create user by email
    let user = await this.usersService.findByEmail(facebookData.email);
    if (!user) {
      user = await this.usersService.createSocialUser({
        email: facebookData.email,
        provider: 'facebook',
        providerId: facebookData.id, // 使用 Facebook 提供的唯一識別碼
        name: facebookData.name,
      });
    }

    // 產生 JWT token
    // Generate JWT token
    return this.generateTokens(user.id);
  }

  /**
   * 處理 Apple 登入
   * 接收 Apple ID Token，驗證後處理使用者登入或註冊。
   * @param idToken Apple 提供的 ID Token
   * @returns 包含 accessToken 和 refreshToken 的登入成功回應
   * @throws UnauthorizedException 如果 Apple ID Token 無效或驗證失敗
   */
  async appleLogin(idToken: string) {
    try {
      // 建立 JWKS Client
      // Create JWKS Client
      const client = jwksClient({
        jwksUri: 'https://appleid.apple.com/auth/keys',
      });

      // 解析 JWT header 取得 kid
      // Parse JWT header to get kid
      const decodedHeader = this.jwtService.decode(idToken, { complete: true }) as any;
      if (!decodedHeader || !decodedHeader.header.kid) {
        throw new UnauthorizedException('無效的 Apple id_token');
      }

      // 從 Apple 公開金鑰服務取得金鑰
      // Get the key from Apple's public key service
      const key = await client.getSigningKey(decodedHeader.header.kid);
      const signingKey = key.getPublicKey();

      // 驗證 JWT
      // Verify JWT
      const payload = jwt.verify(idToken, signingKey, {
        algorithms: ['RS256'],
      }) as any; // 使用 jwt 模組直接驗證，並斷言為 any 類型以方便後續操作
      // Use jwt module to verify directly, and assert as any type for easier subsequent operations

      // 檢查 iss 與 aud
      // Check iss and aud
      if (payload.iss !== 'https://appleid.apple.com') {
        throw new UnauthorizedException('Apple id_token 來源不合法');
      }
      if (payload.aud !== process.env.APPLE_CLIENT_ID) {
        throw new UnauthorizedException('Apple Client ID 不匹配');
      }

      // Apple 預設用 sub 當唯一識別碼
      // Apple uses sub as the unique identifier by default
      const email = payload.email || `${payload.sub}@apple.com`;

      // 查詢或建立使用者
      // Query or create user
      let user = await this.usersService.findByEmail(email);
      if (!user) {
        user = await this.usersService.createSocialUser({
          email,
          provider: 'apple',
          providerId: payload.sub,
        });
      }

      // 產生 JWT token
      // Generate JWT token
      return this.generateTokens(user.id);

    } catch (error) {
      console.error('Apple 登入錯誤:', error); // 記錄錯誤訊息
      // Log error message
      throw new UnauthorizedException('Apple 登入驗證失敗');
    }
  }

  // WeChat 登入
  // WeChat Login
  async wechatLogin(code: string) {
    const appId = this.configService.get('WECHAT_APP_ID');
    const appSecret = this.configService.get('WECHAT_APP_SECRET');

    try {
      const tokenRes = await axios.get(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
      );
      const { access_token, openid, unionid } = tokenRes.data;
      if (!openid) throw new UnauthorizedException('WeChat 回傳無 openid');
  
      // 若有 unionid 更佳，否則使用 openid
      // If unionid is available, use it; otherwise, use openid
      const identifier = unionid || openid;
      const email = `${identifier}@wechat.fake`; // 模擬 email 做為唯一 key
  
      let user = await this.usersService.findByEmail(email);
      if (!user) {
        user = await this.usersService.createSocialUser({
          email,
          provider: 'wechat',
          providerId: identifier, // 使用 WeChat 提供的唯一識別碼
          name: '',
        });
      }
  
      // 產生 JWT token
      // Generate JWT token
      return this.generateTokens(user.id);
    } catch (err) {
      throw new UnauthorizedException('WeChat token 驗證失敗');
    }
  }
  
  // async login({ email, password }: { email: string; password: string }) {
  //   const user = await this.usersService.findByEmail(email);
  //   if (!user) throw new UnauthorizedException('帳號不存在');
  //   if (!user.emailVerified) throw new UnauthorizedException('請先完成 Email 驗證');
  //   const valid = await bcrypt.compare(password, user.password);
  //   if (!valid) throw new UnauthorizedException('密碼錯誤');
  // }
  
  async login({ email, password }: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('帳號不存在');
    if (!user.emailVerified) throw new UnauthorizedException('請先完成 Email 驗證');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('密碼錯誤');
    // 產生 JWT token
    // Generate JWT token
    return this.generateTokens(user.id);
  }
}
