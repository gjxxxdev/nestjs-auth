// src/auth/dto/wechat-login-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * @class WechatLoginRequestDto
 * @description WeChat 登入請求的資料傳輸物件。
 * 用於接收 WeChat 提供的授權 code。
 */
export class WechatLoginRequestDto {
  /**
   * @property {string} code
   * @description WeChat 提供的授權碼。
   * @example "001abc..."
   */
  @ApiProperty({
    description: 'WeChat 提供的授權碼',
    example: '001abc...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
