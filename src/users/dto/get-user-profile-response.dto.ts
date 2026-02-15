import { ApiProperty } from '@nestjs/swagger';

export class GetUserProfileResponseDto {
  @ApiProperty({ example: 1, description: '使用者 ID' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: '使用者 Email' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: '使用者名稱', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'google', description: '第三方登入提供者', nullable: true })
  provider: string | null;

  @ApiProperty({ example: true, description: '郵箱是否已驗證' })
  emailVerified: boolean;

  @ApiProperty({ example: '2010-01-01', description: '出生年月', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ example: 0, description: '性別 (1:男, 2:女, 0:未指定)' })
  gender: number;

  @ApiProperty({ example: 1, description: '權限級別 (1:普通, 5:小編, 9:Admin)' })
  roleLevel: number;

  @ApiProperty({ example: '2025-08-15T15:05:10.000Z', description: '帳號建立時間' })
  createdAt: Date;
}
