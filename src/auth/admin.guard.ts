import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未認證的使用者');
    }

    // roleLevel >= 9 表示 Admin
    if (!user.roleLevel || user.roleLevel < 9) {
      throw new ForbiddenException('只有管理員可存取此資源');
    }

    return true;
  }
}
