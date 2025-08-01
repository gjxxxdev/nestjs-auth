import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
    // success 屬性表示操作是否成功
    @ApiProperty({ example: true, description: '操作是否成功' })
    success: boolean;

    // message 屬性提供操作結果的文字描述
    @ApiProperty({ example: '註冊成功，請查收驗證信件' })
    message: string;
}
// 可搭配 @ApiUnauthorizedResponse, @ApiBadRequestResponse 做更完整描述
// @ApiOkResponse({ description: '登入成功', type: TokenResponseDto })
// return { accessToken };
