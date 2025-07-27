// 匯出一個統一的回傳型別
import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' })
    accessToken: string;
}
