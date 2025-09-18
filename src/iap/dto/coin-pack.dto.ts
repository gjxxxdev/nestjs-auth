import { ApiProperty } from '@nestjs/swagger';

/**
 * @description 金幣包 DTO
 */
export class CoinPackDto {
  /**
   * @description 金幣包 ID
   * @example 1
   */
  @ApiProperty({ description: '金幣包 ID', example: 1 })
  id: number;

  /**
   * @description 金幣包名稱
   * @example 100 Coins
   */
  @ApiProperty({ description: '金幣包名稱', example: '100 Coins' })
  name: string;

  /**
   * @description 金幣包價格
   * @example 1.99
   */
  @ApiProperty({ description: '金幣包價格', example: 1.99 })
  price: number;

  /**
   * @description 平台類型 (GOOGLE 或 APPLE)
   * @example GOOGLE
   */
  @ApiProperty({ description: '平台類型 (GOOGLE 或 APPLE)', enum: ['GOOGLE', 'APPLE'], example: 'GOOGLE' })
  platform: 'GOOGLE' | 'APPLE';
}
