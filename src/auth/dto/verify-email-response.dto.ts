// verify-email-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class VerifyEmailResponseDto
 * @description 電子郵件驗證操作的回應資料傳輸物件。
 * @property {boolean} success - 表示操作是否成功。
 * @property {string} message - 提供操作結果的文字描述。
 */
export class VerifyEmailResponseDto {
  /**
   * @property {boolean} success - 表示操作是否成功。
   * @example true
   */
  @ApiProperty({ example: true, description: '操作是否成功' })
  success: boolean;

  /**
   * @property {string} message - 提供操作結果的文字描述。
   * @example '信箱驗證成功'
   */
  @ApiProperty({ example: '信箱驗證成功', description: '操作結果的文字描述' })
  message: string;
}
