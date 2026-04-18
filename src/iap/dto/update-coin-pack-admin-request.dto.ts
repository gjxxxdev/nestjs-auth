import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @description 管理員更新金幣儲值包的請求 DTO
 * 用於上下架金幣商品，支援更新 platform, product_id, name, is_active 等欄位
 */
export class UpdateCoinPackAdminRequestDto {
  /**
   * @description 平台類型 (GOOGLE 或 APPLE)
   * @example GOOGLE
   */
  @ApiProperty({
    description: '平台類型',
    enum: ['GOOGLE', 'APPLE'],
    example: 'GOOGLE',
  })
  @IsNotEmpty({ message: '平台類型不能為空' })
  @IsEnum(['GOOGLE', 'APPLE'], { message: '平台類型只能為 GOOGLE 或 APPLE' })
  @IsString({ message: '平台類型必須為字串' })
  @MinLength(2, { message: '平台類型長度不能少於 2 個字元' })
  @MaxLength(20, { message: '平台類型長度不能超過 20 個字元' })
  platform: 'GOOGLE' | 'APPLE';

  /**
   * @description 商品 ID (SKU)
   * @example test_item_001
   */
  @ApiProperty({
    description: '商品 ID (SKU)，用於區分不同商品',
    example: 'test_item_001',
  })
  @IsNotEmpty({ message: '商品 ID 不能為空' })
  @IsString({ message: '商品 ID 必須為字串' })
  @MinLength(2, { message: '商品 ID 長度不能少於 2 個字元' })
  @MaxLength(100, { message: '商品 ID 長度不能超過 100 個字元' })
  product_id: string;

  /**
   * @description 商品名稱
   * @example 90 金幣 + 5 Bonus
   */
  @ApiProperty({
    description: '商品名稱，用於顯示給用戶',
    example: '90 金幣 + 5 Bonus',
  })
  @IsNotEmpty({ message: '商品名稱不能為空' })
  @IsString({ message: '商品名稱必須為字串' })
  @MinLength(2, { message: '商品名稱長度不能少於 2 個字元' })
  @MaxLength(100, { message: '商品名稱長度不能超過 100 個字元' })
  name: string;

  /**
   * @description 是否上架 (必填，1 = 上架, 0 = 下架)
   * @example 1
   */
  @ApiProperty({
    description: '是否上架 (1: 上架, 0: 下架)',
    example: 1,
    enum: [0, 1],
  })
  @IsNotEmpty({ message: 'is_active 不能為空' })
  @Type(() => Number)
  @IsInt({ message: 'is_active 必須為整數' })
  @IsEnum([0, 1], { message: 'is_active 只能為 0 或 1' })
  is_active: number;
}
