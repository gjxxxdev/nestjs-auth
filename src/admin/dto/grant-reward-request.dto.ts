import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class GrantRewardRequestDto {
  @ApiProperty({
    description: '目標使用者 ID（必須大於 0）',
    example: 123,
    type: Number,
  })
  @IsInt({ message: 'targetUserId 必須是整數' })
  @Min(1, { message: 'targetUserId 必須大於 0' })
  targetUserId: number;

  @ApiProperty({
    description: '發放的金幣額度（必須是大於 0 的整數）',
    example: 100,
    type: Number,
  })
  @IsInt({ message: 'amount 必須是整數' })
  @Min(1, { message: 'amount 必須大於 0' })
  amount: number;

  @ApiProperty({
    description: '管理員填寫的自由原因（將寫入 CoinLedger 的 source 欄位進行審計）',
    example: '禮物卡兌換',
    type: String,
  })
  @IsString({ message: 'reason 必須是字串' })
  @IsNotEmpty({ message: 'reason 不能為空' })
  @MinLength(1, { message: 'reason 至少需要 1 個字元' })
  @MaxLength(255, { message: 'reason 最多 255 個字元' })
  reason: string;
}
