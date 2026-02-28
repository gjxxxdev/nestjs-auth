import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class AdminCoinLedgerQueryDto {
  @Type(() => Number)
  @IsInt({ message: 'userId 必須是整數' })
  @Min(1, { message: 'userId 必須大於 0' })
  userId: number;

  @IsOptional()
  @IsInt({ message: 'page 必須是整數' })
  @Min(1, { message: 'page 必須大於等於 1' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'limit 必須是整數' })
  @Min(1, { message: 'limit 必須大於等於 1' })
  @Max(100, { message: 'limit 最多 100' })
  @Type(() => Number)
  limit?: number = 20;
}
