// （JWT 驗證策略）
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT payload =', payload); // ⭐ 必加

    // 檢查 Access Token 是否在 Blacklist 中
    const accessTokenKey = this.getAccessTokenKeyFromPayload(payload);
    console.log('檢查 Access Token Key:', accessTokenKey);
    
    const blacklisted = await this.redis.get(accessTokenKey);
    console.log('Blacklisted 狀態:', blacklisted);

    if (blacklisted) {
      // 檢查是否在寬限期内
      const graceKey = `${accessTokenKey}:grace`;
      console.log('檢查寬限期 Key:', graceKey);
      
      const inGracePeriod = await this.redis.get(graceKey);
      console.log('寬限期狀態:', inGracePeriod);
      
      if (!inGracePeriod) {
        console.log('錯誤：Access token 已被加入黑名單且超過寬限期');
        throw new UnauthorizedException('Access token 已失效');
      } else {
        console.log('警告：Access token 在黑名單中但仍在寬限期内，允許通過');
      }
    } else {
      console.log('Access token 不在黑名單中，正常通過');
    }

    return {
      userId: payload.sub,
    };
  }

  private getAccessTokenKeyFromPayload(payload: any): string {
    // 使用 JTI 或 Hash 作為 Key
    if (payload.jti) {
      return `bl:access:${payload.jti}`;
    }
    // 如果沒有 JTI，使用 sub 和 iat 的組合來生成唯一 Key
    return `bl:access:${payload.sub}:${payload.iat}`;
  }
}
