import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class UpdateCoinLedgerRemarkDto {
  @ApiProperty({
    description: '金幣流水紀錄的備註（最多 255 字元，允許傳入空字串以清除備註）',
    example: '禮物卡兌換 - GiftCard-2026-05-15-XYZ',
    type: String,
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'remark 必須是字串' })
  @MaxLength(255, { message: 'remark 最多 255 個字元' })
  remark?: string | null;
}
