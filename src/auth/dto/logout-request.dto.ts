// logout-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * @class LogoutRequestDto
 * @description 登出請求的資料傳輸物件。
 * @property {string} refreshToken - 用於登出的刷新令牌。
 * @property {string} [accessToken] - 可選的存取令牌，用於同時將其加入黑名單。
 */
export class LogoutRequestDto {
  /**
   * @property {string} refreshToken - 用於登出的刷新令牌。
   * @example 'your_refresh_token_here'
   */
  @ApiProperty({ example: 'your_refresh_token_here', description: '用於登出的刷新令牌' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  /**
   * @property {string} [accessToken] - 可選的存取令牌，用於同時將其加入黑名單。
   * @example 'your_access_token_here'
   */
  @ApiProperty({ example: 'your_access_token_here', description: '可選的存取令牌，用於同時將其加入黑名單', required: false })
  @IsString()
  @IsOptional()
  accessToken?: string;
}
