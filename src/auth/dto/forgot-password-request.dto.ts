// src/auth/dto/forgot-password-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordRequestDto {
  // email 屬性用於指定要重設密碼的使用者電子郵件
  @ApiProperty({ example: 'user@example.com', description: '使用者 Email' })
  @IsEmail({}, { message: 'Email 格式不正確' })
  @IsNotEmpty({ message: 'Email 不可為空' })
  email: string;
}
