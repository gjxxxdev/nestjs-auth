// src/auth/dto/reset-password-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  // success 屬性表示操作是否成功
  @ApiProperty({ example: true, description: '操作是否成功' })
  success: boolean;

  // message 屬性提供操作結果的文字描述
  @ApiProperty({ example: '密碼重設成功', description: '操作結果訊息' })
  message: string;
}
