import { ApiProperty } from '@nestjs/swagger';

export class AppleWebhookDto {
  @ApiProperty({ example: 'D7F2F9F2-ABCD-4E8D-BD2A-1234567890AB', description: '通知 UUID' })
  notificationUUID: string;

  @ApiProperty({ example: 'D7F2F9F2-ABCD-4E8D-BD2A-1234567890AB', description: '原始交易 ID' })
  originalTransactionId: string;

  @ApiProperty({ example: 'CANCEL', description: '通知類型，例如 CANCEL/REFUND/RENEWAL' })
  notificationType: string;

  @ApiProperty({ example: 'signedPayloadData', description: 'Apple 傳來的 signedPayload (JWT)' })
  signedPayload: string;
}
