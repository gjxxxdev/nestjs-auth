import { ApiProperty } from '@nestjs/swagger';

// 我的 IAP 儲值紀錄 DTO (單筆)
export class MyIapReceiptDto {
  // 收據 ID，對應 transaction_id
  @ApiProperty({
    description: '收據 ID (Transaction ID)',
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
    description: '商品 ID (Product ID)',
    example: 'coin_pack_100',
  })
  productId: string;

  // 🟢 [修改] 總金幣數量 (改名為 totalCoins 以示區別)
  @ApiProperty({
    description: '總獲得金幣 (基礎 + Bonus)',
    example: 95,
  })
  totalCoins: number;

  // 🟢 [新增] 基礎金幣 (實際購買量)
  @ApiProperty({
    description: '基礎金幣 (Base)',
    example: 90,
  })
  baseCoins: number;

  // 🟢 [新增] 獎勵金幣 (Bonus)
  @ApiProperty({
    description: '獎勵金幣 (Bonus)',
    example: 5,
  })
  bonusCoins: number;

  // 狀態
  @ApiProperty({
    description: '交易狀態',
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