import { ApiProperty } from '@nestjs/swagger';
import { AdminCoinLedgerDto } from './admin-coin-ledger.dto';

export class PaginationDto {
  @ApiProperty({ description: '總筆數', example: 100 })
  total: number;

  @ApiProperty({ description: '目前頁碼', example: 1 })
  page: number;

  @ApiProperty({ description: '每頁筆數', example: 20 })
  limit: number;

  @ApiProperty({ description: '總頁數', example: 5 })
  pages: number;
}

export class AdminCoinLedgerResponseDto {
  @ApiProperty({ type: [AdminCoinLedgerDto], description: '金幣流水列表' })
  items: AdminCoinLedgerDto[];

  @ApiProperty({ type: PaginationDto, description: '分頁資訊' })
  pagination: PaginationDto;
}
