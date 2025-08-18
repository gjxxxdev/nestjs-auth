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
   * @description Facebook 提供的存取令牌，可以是標準的 access token，也可以是 iOS Limited Login 的 user_token。
   * @example "EAACwZCZC..." // iOS 傳 JWT(id_token), web/Android 傳 access_token
   */
  @ApiProperty({
    description: 'Facebook 提供的存取令牌,iOS 傳 JWT(id_token), web/Android 傳 access_token',
    example: 'EAACwZCZC...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
