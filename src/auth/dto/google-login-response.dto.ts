// 定義 Google 登入成功回應的資料傳輸物件
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginResponseDto {
    @ApiProperty({ example: true, description: '操作是否成功' })
    success: boolean;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...', description: '使用者存取令牌' })
    accessToken: string;
}
