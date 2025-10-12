import { ApiProperty } from '@nestjs/swagger';

export class GoogleWebhookDto {
  @ApiProperty({ example: 'SUBSCRIPTION_RECOVERED', description: '通知類型' })
  notificationType: string;

  @ApiProperty({ example: 'com.example.app', description: 'App 套件名稱' })
  packageName: string;

  @ApiProperty({ example: 'product_123', description: '商品 ID' })
  productId: string;

  @ApiProperty({ example: 'purchase_token_sample', description: 'Google Purchase Token' })
  purchaseToken: string;

  @ApiProperty({ example: 'user_123', description: '內部對應的用戶 ID', required: false })
  userId?: string;
}

export class AppleWebhookDto {
  @ApiProperty({ example: 'DID_RENEW', description: '通知事件類型' })
  notificationType: string;

  @ApiProperty({ example: 'com.example.app', description: 'App Bundle ID' })
  bundleId: string;

  @ApiProperty({
    example: 'base64-encoded-signedPayload',
    description: 'Apple Server Notification v2 的 signedPayload',
  })
  signedPayload: string;
}
