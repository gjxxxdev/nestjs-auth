import { ApiProperty } from '@nestjs/swagger';
import { MyCoinLedgerDto } from './my-coin-ledger.dto';

export class AdminCoinLedgerDto extends MyCoinLedgerDto {
  @ApiProperty({ description: '使用者 ID', example: 12 })
  userId: number;

  @ApiProperty({ description: '使用者名稱', example: 'John Doe' })
  username: string;

  @ApiProperty({ description: '使用者郵件', example: 'john@example.com' })
  email: string;
}
