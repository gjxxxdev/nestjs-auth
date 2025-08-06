// src/auth/dto/apple-login-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @class AppleLoginRequestDto
 * @description Apple 登入請求的資料傳輸物件。
 * 用於接收 Apple 提供的 idToken。
 */
export class AppleLoginRequestDto {
  /**
   * @property {string} idToken
   * @description Apple 提供的身份令牌。
   * @example "eyJraWQiOiJ..."
   */
  @ApiProperty({
    description: 'Apple 提供的身份令牌',
    example: 'eyJraWQiOiJ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
