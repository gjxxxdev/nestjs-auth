// （JWT 驗證守衛）
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.log('🔵 [JwtAuthGuard] canActivate() 被呼叫');
    this.logger.log('🔵 [JwtAuthGuard] Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'undefined');

    if (!authHeader) {
      this.logger.error('❌ [JwtAuthGuard] 缺少 Authorization header');
      throw new UnauthorizedException('缺少 Authorization header');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    this.logger.log('🔵 [JwtAuthGuard] handleRequest() 被呼叫');
    this.logger.log('🔵 [JwtAuthGuard] err:', err ? err.message : 'null');
    this.logger.log('🔵 [JwtAuthGuard] user:', JSON.stringify(user, null, 2) || 'null');
    this.logger.log('🔵 [JwtAuthGuard] info:', info ? JSON.stringify(info) : 'null');

    if (err) {
      this.logger.error('❌ [JwtAuthGuard] 驗證過程中有錯誤:', err);
      throw err;
    }

    if (info) {
      this.logger.error('❌ [JwtAuthGuard] Passport info (错误信息):', info);
      throw new UnauthorizedException(info.message || '認證失敗');
    }

    if (!user) {
      this.logger.error('❌ [JwtAuthGuard] 驗證失敗：user 為 null 或 undefined');
      throw new UnauthorizedException('認證失敗');
    }

    this.logger.log('✅ [JwtAuthGuard] 認證成功，user:', JSON.stringify(user));
    return user;
  }
}