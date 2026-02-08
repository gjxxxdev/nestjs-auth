import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CoinPurchaseDto {
  @ApiProperty({ description: '書籍 StoryLists ID' })
  @IsInt()
  storyListId: number;

  @ApiProperty({
    description: '防止重送用 key（Header: Idempotency-Key）',
  })
  @IsNotEmpty()
  idempotencyKey: string;
}
