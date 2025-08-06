// src/auth/dto/facebook-login-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @class FacebookLoginRequestDto
 * @description Facebook 登入請求的資料傳輸物件。
 * 用於接收 Facebook 提供的 accessToken。
 */
export class FacebookLoginRequestDto {
  /**
   * @property {string} accessToken
   * @description Facebook 提供的存取令牌。
   * @example "EAACwZCZC..."
   */
  @ApiProperty({
    description: 'Facebook 提供的存取令牌',
    example: 'EAACwZCZC...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
