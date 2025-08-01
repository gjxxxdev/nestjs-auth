// logout-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class LogoutResponseDto
 * @description 登出操作的回應資料傳輸物件。
 * @property {boolean} success - 表示操作是否成功。
 * @property {string} message - 提供操作結果的文字描述。
 */
export class LogoutResponseDto {
  /**
   * @property {boolean} success - 表示操作是否成功。
   * @example true
   */
  @ApiProperty({ example: true, description: '操作是否成功' })
  success: boolean;

  /**
   * @property {string} message - 提供操作結果的文字描述。
   * @example '登出成功，Refresh token 已加入黑名單'
   */
  @ApiProperty({ example: '登出成功，Refresh token 已加入黑名單', description: '操作結果的文字描述' })
  message: string;
}
