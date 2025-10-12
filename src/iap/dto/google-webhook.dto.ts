import { ApiProperty } from '@nestjs/swagger';

export class GoogleWebhookDto {
  @ApiProperty({ example: 'TEST_NOTIFICATION', description: '通知類型' })
  notificationType: string;

  @ApiProperty({ example: 'com.example.app', description: 'App 套件名稱' })
  packageName: string;

  @ApiProperty({ example: 'coin_pack_100', description: '商品 ID' })
  productId: string;

  @ApiProperty({ example: 'purchase-token-123', description: '購買憑證 token' })
  purchaseToken: string;
}
