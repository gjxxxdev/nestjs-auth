// logout-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @class LogoutRequestDto
 * @description 登出請求的資料傳輸物件。
 * @property {string} refreshToken - 用於登出的刷新令牌。
 */
export class LogoutRequestDto {
  /**
   * @property {string} refreshToken - 用於登出的刷新令牌。
   * @example 'your_refresh_token_to_blacklist'
   */
  @ApiProperty({ example: 'your_refresh_token_to_blacklist', description: '用於登出的刷新令牌' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
