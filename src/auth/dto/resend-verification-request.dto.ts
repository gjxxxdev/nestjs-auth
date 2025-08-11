import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationRequestDto {
  @ApiProperty({ example: 'user@example.com', description: '使用者電子郵件' })
  @IsEmail({}, { message: '請輸入有效的電子郵件地址' })
  @IsNotEmpty({ message: '電子郵件不能為空' })
  email: string;
}
