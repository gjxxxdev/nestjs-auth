import { ApiProperty } from '@nestjs/swagger';

export class VerifyReceiptResponseDto {
  @ApiProperty({ example: true, description: '驗證是否成功' })
  success: boolean;

  @ApiProperty({ example: 'GOOGLE', description: '平台 (GOOGLE | APPLE)' })
  platform: string;

  @ApiProperty({ example: 'user_123', description: '用戶 ID' })
  userId: string;

  @ApiProperty({ example: 100, description: '此次入金的金幣數量' })
  coinsAdded: number;

  @ApiProperty({ example: 'Mock receipt verified (dev mode)', description: '提示訊息' })
  message?: string;

  @ApiProperty({ example: { orderId: 'GPA.1234-5678-9012-34567' }, description: '原始驗證 API 回傳資料' })
  raw?: any;
}
