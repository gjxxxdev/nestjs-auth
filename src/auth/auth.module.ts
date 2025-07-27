// 註冊策略與守衛
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthController } from './auth.controller'; // 導入 AuthController
import { AuthService } from './auth.service'; // 導入 AuthService
import { UsersModule } from '../users/users.module'; // 導入 UsersModule
import { MailModule } from '../mail/mail.module'; // 導入 MailModule
import { RedisModule } from '../redis/redis.module'; // 導入 RedisModule

@Module({
    imports: [PassportModule, UsersModule, MailModule, RedisModule], // 確保導入相關模組
    controllers: [AuthController], // 將 AuthController 添加到 controllers 陣列
    providers: [AuthService, JwtStrategy, JwtAuthGuard], // 將 AuthService 添加到 providers 陣列
    exports: [AuthService, JwtAuthGuard], // 確保 AuthService 和 JwtAuthGuard 可以被其他模組使用
})
export class AuthModule {}
