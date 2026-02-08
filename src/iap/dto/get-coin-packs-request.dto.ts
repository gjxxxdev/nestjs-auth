import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

/**
 * @description 獲取金幣包請求的 DTO
 */
export class GetCoinPacksRequestDto {
  /**
   * @description 平台類型 (GOOGLE 或 APPLE)
   * @example GOOGLE
   */
  @ApiPropertyOptional({ enum: ['GOOGLE', 'APPLE'], description: '平台類型 (GOOGLE 或 APPLE)' })
  @IsEnum(['GOOGLE', 'APPLE'], { message: '平台類型必須是 GOOGLE 或 APPLE' })
  @IsOptional()
  platform?: 'GOOGLE' | 'APPLE';
}
