import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator'; // 🟢 加入驗證裝飾器

export class VerifyReceiptRequestDto {
  @ApiProperty({ 
    example: 'GOOGLE', 
    enum: ['GOOGLE', 'APPLE'], 
    description: '平台 (GOOGLE | APPLE)' 
  })
  @IsEnum(['GOOGLE', 'APPLE'], { message: '平台必須是 GOOGLE 或 APPLE' })
  @IsNotEmpty({ message: '平台不可為空' })
  platform: 'GOOGLE' | 'APPLE';

  @ApiProperty({
    example: 'mphpknjpoldlfiochkojcllj.AO-J1Oy8...',
    description: '收據字串（Google Play: purchaseToken / Apple: base64 receipt）',
  })
  @IsString()
  @IsNotEmpty({ message: '收據不可為空' })
  receipt: string;

  @ApiProperty({
    example: 'item_001',
    description: '商品 ID（對應資料庫 coin_packs 表中的 product_id）',
  })
  @IsString()
  @IsNotEmpty({ message: '商品 ID 不可為空' })
  productId: string;
}