// src/auth/dto/wechat-login-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { LoginResponseDto } from './login-response.dto';

/**
 * @class WechatLoginResponseDto
 * @description WeChat 登入成功後的回應資料傳輸物件。
 * 繼承自 LoginResponseDto，並新增 success 參數。
 */
export class WechatLoginResponseDto extends LoginResponseDto {
  /**
   * @property {boolean} success
   * @description 指示 WeChat 登入操作是否成功。
   * @example true
   */
  @ApiProperty({
    description: '指示 WeChat 登入操作是否成功',
    example: true,
  })
  success: boolean;
}
