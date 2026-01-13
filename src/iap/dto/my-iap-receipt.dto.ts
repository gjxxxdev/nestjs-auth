import { ApiProperty } from '@nestjs/swagger';

// 我的 IAP 儲值紀錄 DTO
export class MyIapReceiptDto {
  // 收據 ID，對應 transaction_id
  @ApiProperty({
    description: '收據 ID，對應 transaction_id',
    example: 'GPA.1234-5678-9012-34567',
  })
  receiptId: string;

  // 平台類型
  @ApiProperty({
    description: '平台類型',
    enum: ['GOOGLE', 'APPLE'],
    example: 'GOOGLE',
  })
  platform: 'GOOGLE' | 'APPLE';

  // 商品 ID
  @ApiProperty({
    description: '商品 ID',
    example: 'coin_pack_100',
  })
  productId: string;

  // 金幣數量
  @ApiProperty({
    description: '金幣數量',
    example: 100,
  })
  coins: number;

  // 狀態
  @ApiProperty({
    description: '狀態',
    example: 'SUCCESS',
  })
  status: string;

  // 創建時間
  @ApiProperty({
    description: '創建時間',
    example: '2026-01-03T10:12:30Z',
  })
  createdAt: Date;
}
