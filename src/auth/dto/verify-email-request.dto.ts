// verify-email-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @class VerifyEmailRequestDto
 * @description 電子郵件驗證請求的資料傳輸物件。
 * @property {string} token - 用於驗證電子郵件的令牌。
 */
export class VerifyEmailRequestDto {
  /**
   * @property {string} token - 用於驗證電子郵件的令牌。
   * @example 'your_email_verification_token'
   */
  @ApiProperty({ example: 'your_email_verification_token', description: '用於驗證電子郵件的令牌' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
