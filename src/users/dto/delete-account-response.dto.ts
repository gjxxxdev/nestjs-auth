import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountResponseDto {
  @ApiProperty({ example: true, description: '刪除是否成功' })
  success: boolean;

  @ApiProperty({ 
    example: '帳號 (ID: 123) 及其關聯資料已徹底從系統移除。',
    description: '操作結果訊息' 
  })
  message: string;

  @ApiProperty({ 
    example: 123,
    description: '已刪除的使用者 ID' 
  })
  deletedUserId: number;
}
