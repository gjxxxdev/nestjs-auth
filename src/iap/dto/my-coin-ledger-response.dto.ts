import { ApiProperty } from '@nestjs/swagger';
import { MyCoinLedgerDto } from './my-coin-ledger.dto';

export class MyCoinLedgerResponseDto {
  @ApiProperty({ type: [MyCoinLedgerDto], description: '金幣流水列表' })
  items: MyCoinLedgerDto[];
}