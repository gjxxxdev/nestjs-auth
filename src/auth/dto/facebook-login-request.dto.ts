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
   * @property {string} token
   * @description Facebook 提供的令牌。對於 iOS Limited Login，這是一個 id_token (JWT 格式)；對於 Web/Android，這是一個標準的 access_token。
   * @example "eyJhbGciOiJSUzI1NiI..." (id_token 範例) 或 "EAACwZCZC..." (access_token 範例)
   */
  @ApiProperty({
    description: 'Facebook 提供的令牌。對於 iOS Limited Login，這是一個 id_token (JWT 格式)；對於 Web/Android，這是一個標準的 access_token。',
    example: 'eyJhbGciOiJSUzI1NiI...', // 這裡提供一個 id_token 的範例，實際可能為 access_token
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
