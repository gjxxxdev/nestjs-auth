// refresh-token-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @class RefreshTokenRequestDto
 * @description 刷新令牌請求的資料傳輸物件。
 * @property {string} refreshToken - 用於獲取新存取令牌的刷新令牌。
 */
export class RefreshTokenRequestDto {
  /**
   * @property {string} refreshToken - 用於獲取新存取令牌的刷新令牌。
   * @example 'your_refresh_token_here'
   */
  @ApiProperty({ example: 'your_refresh_token_here', description: '用於獲取新存取令牌的刷新令牌' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
