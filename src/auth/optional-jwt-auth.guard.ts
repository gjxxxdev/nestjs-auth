import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

/**
 * @class OptionalJwtAuthGuard
 * @description
 * 根據環境變數決定是否執行 JWT 身份驗證。
 * 在開發環境 (NODE_ENV !== 'production') 中，此守衛會直接允許請求通過，不進行 JWT 驗證。
 * 在生產環境 (NODE_ENV === 'production') 中，此守衛會執行標準的 JWT 身份驗證。
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private configService: ConfigService) {
    super();
  }

  /**
   * @method canActivate
   * @description
   * 判斷請求是否可以被激活。
   * 如果當前環境不是生產環境，則直接返回 true，跳過 JWT 驗證，並設置 mock user。
   * 否則，調用父類的 canActivate 方法執行標準 JWT 驗證。
   * @param context 執行上下文
   * @returns {Promise<boolean>} 如果允許請求則為 true，否則為 false
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const request = context.switchToHttp().getRequest();

    // 在開發環境中，跳過 JWT 驗證並設置 mock user
    if (!isProduction) {
      request.user = { id: 'mock-user-id' }; // 設置 mock user
      return true;
    }

    // 在生產環境中，執行標準 JWT 驗證
    return (await super.canActivate(context)) as boolean;
  }
}
