import { ApiProperty } from '@nestjs/swagger';

export class VerifyReceiptRequestDto {
  @ApiProperty({ example: 'GOOGLE', description: '平台 (GOOGLE | APPLE)' })
  platform: 'GOOGLE' | 'APPLE';

  @ApiProperty({
    example: 'sample-receipt-data',
    description: '收據字串（Google Play: purchaseToken / Apple: base64 receipt）',
  })
  receipt: string;

}
