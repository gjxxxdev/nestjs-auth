import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationResponseDto {
  @ApiProperty({ example: true, description: '操作是否成功' })
  success: boolean;

  @ApiProperty({ example: '驗證信已重新發送', description: '操作結果訊息' })
  message: string;
}
