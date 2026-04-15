import { IsNumber, IsInt, IsPositive, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 管理後台查詢用戶權益列表的查詢參數 DTO
 * - userId: 必填，目標用戶 ID
 * - page: 可選，分頁頁碼（預設 1）
 * - limit: 可選，每頁筆數（預設 20，最多 100）
 */
export class AdminEntitlementsQueryDto {
  /** 用戶 ID（必填）- 必須為大於 0 的整數 */
  @ApiProperty({
    example: 123,
    description: '用戶 ID（必填）- 必須為大於 0 的整數',
    type: Number,
  })
  @IsNumber({ allowNaN: false }, { message: 'userId 必須是有效的數字' })
  @IsInt({ message: 'userId 必須是整數' })
  @IsPositive({ message: 'userId 必須大於 0' })
  @Type(() => Number)
  userId!: number;

  /** 頁碼（可選，預設 1） */
  @ApiProperty({
    example: 1,
    description: '頁碼（可選，預設 1）',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'page 必須是整數' })
  @Min(1, { message: 'page 最小為 1' })
  @Type(() => Number)
  page?: number = 1;

  /** 每頁筆數（可選，預設 20，最多 100） */
  @ApiProperty({
    example: 20,
    description: '每頁筆數（可選，預設 20，最多 100）',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'limit 必須是整數' })
  @Min(1, { message: 'limit 最小為 1' })
  @Max(100, { message: 'limit 最多為 100' })
  @Type(() => Number)
  limit?: number = 20;
}
