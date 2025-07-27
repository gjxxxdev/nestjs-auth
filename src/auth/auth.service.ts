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
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: Redis, // 來自 ioredis 套件注入
    private readonly mailService: MailService, // 注入 MailService
  ) {}

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('帳號不存在');

    const resetToken = uuidv4();
    const key = `reset:${resetToken}`;
    await this.redis.set(key, user.id, 'EX', 60 * 30); // 30分鐘

    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = `請點擊下列連結重設您的密碼：<a href='${resetUrl}'>${resetUrl}</a>`;
    await this.mailService.sendMail({ to: user.email, subject: '重設密碼', html });

    return { message: '已發送重設密碼信件' };
  }

  async resetPassword(token: string, newPassword: string) {
    const key = `reset:${token}`;
    const userId = await this.redis.get(key);
    if (!userId) throw new UnauthorizedException('重設連結已過期或無效');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(+userId, hashed);
    await this.redis.del(key);

    return { message: '密碼已更新，請重新登入' };
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

    return { message: '信箱驗證成功' };
  }

  private getRefreshKey(token: string) {
    return `bl:refresh:${token}`;
  }

  async logout(refreshToken: string) {
    const key = this.getRefreshKey(refreshToken);
    const ttl = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d';
    const expiresInSec = 60 * 60 * 24 * 30;
    await this.redis.set(key, 'blacklisted', 'EX', expiresInSec);
    return { message: '已登出' };
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

      return { accessToken };
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
    return { accessToken, refreshToken };
  }

  // ✅ 註冊流程 - 建立帳號並寄送驗證信

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

    return { message: '註冊成功，請查收驗證信件' };
  }

  // 調整 login / social login 統一呼叫 generateTokens()

  // ✅ Google 登入
  async googleLogin(idToken: string) {
    const client = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
    const ticket = await client.verifyIdToken({
      idToken,
      audience: this.configService.get('GOOGLE_CLIENT_ID'),
    });
    
    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException('Google 回傳無 email');

    let user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      user = await this.usersService.create({
        email: payload.email,
        password: '',
        provider: 'google',
        name: payload.name,
      });
    }

    const jwt = this.jwtService.sign({ userId: user.id });
    return { accessToken: jwt };
  }

  // ✅ Facebook 登入
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
      return { accessToken: jwt };
    } catch (error) {
      throw new UnauthorizedException('Facebook token 驗證失敗');
    }  
  }

  // ✅ Apple 登入
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
    return { accessToken: jwtToken };
  }

  // ✅ WeChat 登入
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
      return { accessToken: jwtToken };
    } catch (err) {
      throw new UnauthorizedException('WeChat token 驗證失敗');
    }
  }
  
  async login({ email, password }: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('帳號不存在');
    if (!user.emailVerified) throw new UnauthorizedException('請先完成 Email 驗證');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('密碼錯誤');
    const token = this.jwtService.sign({ userId: user.id });
    return { accessToken: token };
  }
}
