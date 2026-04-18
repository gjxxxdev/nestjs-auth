import { ApiProperty } from '@nestjs/swagger';

/**
 * @description 管理員更新金幣儲值包的回應 DTO
 */
export class UpdateCoinPackAdminResponseDto {
  /**
   * @description 請求是否成功
   * @example true
   */
  @ApiProperty({
    description: '請求是否成功',
    example: true,
  })
  success: boolean;

  /**
   * @description 操作訊息
   * @example Updated successfully
   */
  @ApiProperty({
    description: '操作訊息',
    example: 'Updated successfully',
  })
  message: string;

  /**
   * @description 更新後的金幣儲值包資料
   */
  @ApiProperty({
    description: '更新後的金幣儲值包資料',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      platform: { type: 'string', enum: ['GOOGLE', 'APPLE'], example: 'GOOGLE' },
      productId: { type: 'string', example: 'com.example.coins.100' },
      name: { type: 'string', example: '90 金幣 + 5 Bonus' },
      amount: { type: 'number', example: 90 },
      bonusAmount: { type: 'number', example: 5 },
      price: { type: 'number', example: 90.99 },
      currency: { type: 'string', example: 'TWD' },
      isActive: { type: 'boolean', example: true },
      sortOrder: { type: 'number', example: 999 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  })
  data: {
    id: number;
    platform: 'GOOGLE' | 'APPLE';
    productId: string;
    name: string;
    amount: number;
    bonusAmount: number;
    price: number;
    currency: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  };
}
