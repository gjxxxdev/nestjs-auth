// refresh-token-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * @class RefreshTokenRequestDto
 * @description 刷新令牌請求的資料傳輸物件。
 * @property {string} refreshToken - 用於刷新的刷新令牌。
 * @property {string} [accessToken] - 可選的舊 access token，用於將其加入黑名單。
 */
export class RefreshTokenRequestDto {
  /**
   * @property {string} refreshToken - 用於刷新的刷新令牌。
   * @example 'your_refresh_token_here'
   */
  @ApiProperty({ example: 'your_refresh_token_here', description: '用於刷新的 refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  /**
   * @property {string} [accessToken] - 可選的舊 access token，用於將其加入黑名單。
   * @example 'your_old_access_token_here'
   */
  @ApiProperty({ 
    example: 'your_old_access_token_here', 
    description: '可選的舊 access token，用於將其加入黑名單', 
    required: false 
  })
  @IsString()
  @IsOptional()
  accessToken?: string;
}
