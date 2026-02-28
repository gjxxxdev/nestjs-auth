import { ApiProperty } from '@nestjs/swagger';

export class AdminCoinLedgerDto {
  @ApiProperty({ description: '流水 ID', example: 101 })
  id: number;

  @ApiProperty({ description: '變動金額 (正數=增加, 負數=減少)', example: 100 })
  amount: number;

  @ApiProperty({ description: '變動後餘額', example: 1500 })
  balance: number;

  @ApiProperty({
    description: '交易類型 (IAP=內購, IAP_BONUS=內購獎勵, USE=使用)',
    example: 'IAP',
  })
  type: string;

  @ApiProperty({
    description: '來源備註 (例如: ORDER:GPA.1234|PROD:item_001)',
    required: false,
  })
  source: string;

  @ApiProperty({ description: '建立時間' })
  createdAt: Date;

  @ApiProperty({ description: '使用者 ID', example: 12 })
  userId: number;

  @ApiProperty({ description: '使用者名稱', example: 'John Doe' })
  username: string;

  @ApiProperty({ description: '使用者郵件', example: 'john@example.com' })
  email: string;
}
