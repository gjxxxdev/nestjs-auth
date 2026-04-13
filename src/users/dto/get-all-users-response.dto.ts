import { ApiProperty } from '@nestjs/swagger';

export class UserItemDto {
  @ApiProperty({ example: 1, description: '會員序號' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: '帳號 (Email)' })
  email: string;

  @ApiProperty({ example: 'john_doe', description: '使用者名稱', nullable: true })
  name: string | null;

  @ApiProperty({ example: '1990-05-15', description: '出生年月', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ example: 1, description: '性別 (0:未指定, 1:男, 2:女)' })
  gender: number;

  @ApiProperty({ example: 'email', description: '註冊方式 (email/facebook/google/apple等)' })
  provider: string | null;

  @ApiProperty({ example: '2025-08-15T15:05:10.000Z', description: '建立時間' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-20T08:30:45.000Z', description: '最後更新時間' })
  updatedAt: Date;
}

export class GetAllUsersResponseDto {
  @ApiProperty({ example: true, description: '是否成功' })
  success: boolean;

  @ApiProperty({ example: 100, description: '總使用者數量' })
  total: number;

  @ApiProperty({ example: 1, description: '目前頁碼' })
  page: number;

  @ApiProperty({ example: 10, description: '每頁數量' })
  limit: number;

  @ApiProperty({ type: [UserItemDto], description: '使用者列表' })
  data: UserItemDto[];
}
