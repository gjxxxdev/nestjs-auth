// refresh-token-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class RefreshTokenResponseDto
 * @description 刷新令牌的回應資料傳輸物件。
 * @property {boolean} success - 表示操作是否成功。
 * @property {string} accessToken - 新的存取令牌。
 * @property {string} refreshToken - 新的刷新令牌。
 */
export class RefreshTokenResponseDto {
  /**
   * @property {boolean} success - 表示操作是否成功。
   * @example true
   */
  @ApiProperty({ example: true, description: '表示操作是否成功' })
  success: boolean;

  /**
   * @property {string} accessToken - 新的存取令牌。
   * @example 'your_new_access_token'
   */
  @ApiProperty({ example: 'your_new_access_token', description: '新的存取令牌' })
  accessToken: string;

  /**
   * @property {string} refreshToken - 新的刷新令牌。
   * @example 'your_new_refresh_token'
   */
  @ApiProperty({ example: 'your_new_refresh_token', description: '新的刷新令牌' })
  refreshToken: string;
}
