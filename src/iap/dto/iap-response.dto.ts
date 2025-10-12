import { ApiProperty } from '@nestjs/swagger';

export class IapResponseDto {
  @ApiProperty({ example: true, description: '是否成功' })
  success: boolean;

  @ApiProperty({ example: 'GOOGLE' })
  platform: 'GOOGLE' | 'APPLE';

  @ApiProperty({ example: 'user-123' })
  userId: string;

  @ApiProperty({ example: 100 })
  coinsAdded: number;

  @ApiProperty({ example: '收據驗證成功，入金 100 金幣' })
  message: string;

  @ApiProperty({
    example: { raw: '原始回應資料' },
    description: '第三方平台原始驗證回應',
  })
  raw?: any;
}
