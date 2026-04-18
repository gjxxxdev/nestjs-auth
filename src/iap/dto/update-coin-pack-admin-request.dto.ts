import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @description 管理員更新金幣儲值包上下架狀態的請求 DTO
 * 用於上下架指定金幣商品
 */
export class UpdateCoinPackAdminRequestDto {
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
