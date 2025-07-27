import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
    @ApiProperty({ example: '操作成功' })
    message: string;
}
// 可搭配 @ApiUnauthorizedResponse, @ApiBadRequestResponse 做更完整描述
// @ApiOkResponse({ description: '登入成功', type: TokenResponseDto })
// return { accessToken };
