import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MyCoinLedgerStoryDto {
  @ApiProperty({ description: '書籍名稱', example: '小鎮失蹤手冊', type: String, nullable: true })
  main_menu_title: string | null;
}

export class MyCoinLedgerDto {
  @ApiProperty({ description: '流水 ID', example: 101 })
  id: number;

  @ApiProperty({ description: '變動金額 (正數=增加, 負數=減少)', example: 100 })
  amount: number;

  @ApiProperty({ description: '變動後餘額', example: 1500 })
  balance: number;

  @ApiProperty({ 
    description: '交易類型（IAP=內購、IAP_BONUS=內購獎勵、BOOK_PURCHASE=購書、USE=使用）',
    example: 'IAP' 
  })
  type: string;

  @ApiPropertyOptional({
    description: '來源備註，例如購書流水為 ORDER:65',
    type: String,
    nullable: true,
  })
  source: string | null;

  @ApiPropertyOptional({
    description: '購書訂單 ID，只有 BOOK_PURCHASE 回傳，找不到訂單時為 null',
    example: '65',
    type: String,
    nullable: true,
  })
  orderId?: string | null;

  @ApiPropertyOptional({
    description: '購買的書籍，只有 BOOK_PURCHASE 回傳，缺少訂單或書籍時為 null',
    type: () => MyCoinLedgerStoryDto,
    nullable: true,
  })
  story?: MyCoinLedgerStoryDto | null;

  @ApiProperty({ description: '建立時間' })
  createdAt: Date;
}
