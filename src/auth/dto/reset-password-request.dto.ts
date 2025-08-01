// src/auth/dto/reset-password-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordRequestDto {
  // token 屬性用於重設密碼的驗證令牌
  @ApiProperty({ example: 'some-reset-token-string', description: '重設密碼令牌' })
  @IsString({ message: '令牌必須是字串' })
  @IsNotEmpty({ message: '令牌不可為空' })
  token: string;

  // newPassword 屬性用於設定新的密碼
  @ApiProperty({ example: 'newPassword123', description: '新密碼' })
  @IsString({ message: '新密碼必須是字串' })
  @MinLength(6, { message: '新密碼長度不可少於 6 個字元' })
  @IsNotEmpty({ message: '新密碼不可為空' })
  newPassword: string;
}
