// 新增 refreshToken / logout / 寄送註冊驗證信
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid'; // 導入 uuidv4
import { MailService } from '../mail/mail.service'; // 導入 MailService

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

  private getRefreshKey(token: string) {
    return `bl:refresh:${token}`;
  }

  async logout(refreshToken: string) {
    const key = this.getRefreshKey(refreshToken);
    const ttl = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d';
    const expiresInSec = 60 * 60 * 24 * 30;
    await this.redis.set(key, 'blacklisted', 'EX', expiresInSec);
    return { success: true, message: '已登出' };
  }

  async refreshToken(refreshToken: string) {
    const blacklisted = await this.redis.get(this.getRefreshKey(refreshToken));
    if (blacklisted) throw new UnauthorizedException('Refresh token 已失效');

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.userId);
      if (!user?.emailVerified) throw new UnauthorizedException('請先完成 Email 驗證');

      const accessToken = this.jwtService.sign(
        { userId: payload.userId },
        { expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') }
      );

      return { success: true, accessToken };
    } catch (err) {
      throw new UnauthorizedException('Refresh token 驗證失敗');
    }
  }

  generateTokens(userId: number) {
    const accessToken = this.jwtService.sign(
      { userId },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') }
    );
    const refreshToken = this.jwtService.sign(
      { userId },
      { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') }
    );
    return { success: true, accessToken, refreshToken, };
  }

  // 註冊流程 - 建立帳號並寄送驗證信

  async register({ email, password, name }: { email: string; password: string; name?: string }) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email 已註冊');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({ email, password: hashed, name });

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
      user = await this.usersService.create({
        email: payload.email,
        password: '', // 社交登入通常不需要密碼
        provider: 'google', // 設定提供者為 Google
        name: payload.name, // 使用 Google 提供的名稱
      });
    }

    // 生成 JWT Token 並返回
    const { accessToken } = this.generateTokens(user.id);
    return { success: true, accessToken };
  }

  // Facebook 登入
  async facebookLogin(accessToken: string) {
    try {
      const url = `https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`;
      const { data } = await axios.get(url);
      if (!data.email) throw new UnauthorizedException('Facebook 回傳無 email');
  
      let user = await this.usersService.findByEmail(data.email);
      if (!user) {
        user = await this.usersService.create({
          email: data.email,
          password: '',
          provider: 'facebook',
          name: data.name,
        });
      }

      const jwt = this.jwtService.sign({ userId: user.id });
      return { success: true, accessToken: jwt, };
    } catch (error) {
      throw new UnauthorizedException('Facebook token 驗證失敗');
    }  
  }

  // Apple 登入
  async appleLogin(idToken: string) {
    const client = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' });
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded === 'string') throw new UnauthorizedException('無法解析 Apple idToken');

    const kid = decoded.header.kid;
    const key = await client.getSigningKey(kid);
    const signingKey = key.getPublicKey();

    let payload: any;
    try {
      payload = jwt.verify(idToken, signingKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
      });
    } catch {
      throw new UnauthorizedException('Apple token 驗證失敗');
    }

    if (!payload.email) throw new UnauthorizedException('Apple 回傳無 email');

    let user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      user = await this.usersService.create({
        email: payload.email,
        password: '',
        provider: 'apple',
        name: '',
      });
    }
    
    const jwtToken = this.jwtService.sign({ userId: user.id });
    return { success: true, accessToken: jwtToken };
  }

  // WeChat 登入
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
      const identifier = unionid || openid;
      const email = `${identifier}@wechat.fake`; // 模擬 email 做為唯一 key
  
      let user = await this.usersService.findByEmail(email);
      if (!user) {
        user = await this.usersService.create({
          email,
          password: '',
          provider: 'wechat',
          name: '',
        });
      }
  
      const jwtToken = this.jwtService.sign({ userId: user.id });
      return { success: true, accessToken: jwtToken };
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
    const token = this.jwtService.sign({ userId: user.id });
    return { success: true, accessToken: token };
  }
}
