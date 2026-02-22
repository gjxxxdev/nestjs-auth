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
    console.log('🔵 [JwtStrategy] validate() 被呼叫');
    console.log('🔵 [JwtStrategy] JWT payload =', JSON.stringify(payload, null, 2));

    if (!payload || !payload.sub) {
      console.error('❌ [JwtStrategy] 錯誤：JWT payload 缺少 sub 欄位');
      throw new UnauthorizedException('無效的 JWT token');
    }

    try {
      // 檢查 Access Token 是否在 Blacklist 中
      const accessTokenKey = this.getAccessTokenKeyFromPayload(payload);
      console.log('🔵 [JwtStrategy] 檢查 Access Token Key:', accessTokenKey);
      
      const blacklisted = await this.redis.get(accessTokenKey);
      console.log('🔵 [JwtStrategy] Blacklisted 狀態:', blacklisted);

      if (blacklisted) {
        // 檢查是否在寬限期内
        const graceKey = `${accessTokenKey}:grace`;
        console.log('🔵 [JwtStrategy] 檢查寬限期 Key:', graceKey);
        
        const inGracePeriod = await this.redis.get(graceKey);
        console.log('🔵 [JwtStrategy] 寬限期狀態:', inGracePeriod);
        
        if (!inGracePeriod) {
          console.error('❌ [JwtStrategy] Access token 已被加入黑名單且超過寬限期');
          throw new UnauthorizedException('Access token 已失效');
        } else {
          console.warn('⚠️  [JwtStrategy] Access token 在黑名單中但仍在寬限期内，允許通過');
        }
      } else {
        console.log('✅ [JwtStrategy] Access token 不在黑名單中，正常通過');
      }

      const result = {
        userId: payload.sub,
        roleLevel: payload.role || 1,
      };
      console.log('✅ [JwtStrategy] validate() 成功返回:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('❌ [JwtStrategy] validate() 錯誤:', error.message);
      throw error;
    }
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
