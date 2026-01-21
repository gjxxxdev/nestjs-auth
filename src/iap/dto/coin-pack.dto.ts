import { ApiProperty } from '@nestjs/swagger';

/**
 * @description 金幣包 DTO (對應資料庫 CoinPack 模型)
 */
export class CoinPackDto {
  @ApiProperty({ description: '金幣包 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '平台類型 (GOOGLE 或 APPLE)', enum: ['GOOGLE', 'APPLE'], example: 'GOOGLE' })
  platform: string;

  /** 🟢 新增: 內購最重要的商品 ID */
  @ApiProperty({ description: '商品 ID (SKU)', example: 'item_001' })
  productId: string;

  @ApiProperty({ description: '金幣包名稱', example: '90 金幣 + 5 Bonus' })
  name: string;

  /** 🟢 新增: 基礎金幣 */
  @ApiProperty({ description: '基礎金幣數量', example: 90 })
  amount: number;

  /** 🟢 新增: 贈送金幣 */
  @ApiProperty({ description: '贈送金幣數量', example: 5 })
  bonusAmount: number;

  @ApiProperty({ description: '金幣包價格', example: 90.00 })
  price: number; // Controller 會負責將 Decimal 轉為 number

  /** 🟢 新增: 幣別 */
  @ApiProperty({ description: '幣別', example: 'TWD' })
  currency: string;

  /** 🟢 新增: 排序與狀態 */
  @ApiProperty({ description: '是否上架', example: true })
  isActive: boolean;

  @ApiProperty({ description: '排序權重', example: 1 })
  sortOrder: number;

  @ApiProperty({ description: '建立時間' })
  createdAt: Date;

  @ApiProperty({ description: '更新時間' })
  updatedAt: Date;
}