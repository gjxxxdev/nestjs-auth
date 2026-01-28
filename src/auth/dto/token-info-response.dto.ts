// token-info-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class TokenInfoResponseDto
 * @description Token 資訊回應的資料傳輸物件。
 * @property {boolean} success - 表示操作是否成功。
 * @property {string} accessToken - 現有的或新的存取令牌。
 * @property {number} expiresIn - Token 剩餘有效時間（秒）。
 * @property {boolean} refreshed - 標示是否已刷新 Token。
 */
export class TokenInfoResponseDto {
  /**
   * @property {boolean} success - 表示操作是否成功。
   * @example true
   */
  @ApiProperty({ example: true, description: '操作是否成功' })
  success: boolean;

  /**
   * @property {string} accessToken - 現有的或新的存取令牌。
   * @example 'your_access_token'
   */
  @ApiProperty({ example: 'your_access_token', description: '存取令牌' })
  accessToken: string;

  /**
   * @property {number} expiresIn - Token 剩餘有效時間（秒）。
   * @example 3600
   */
  @ApiProperty({ example: 3600, description: 'Token 剩餘有效時間（秒）' })
  expiresIn: number;

  /**
   * @property {boolean} refreshed - 標示是否已刷新 Token。
   * @example false
   */
  @ApiProperty({ example: false, description: '是否已刷新 Token' })
  refreshed: boolean;
}