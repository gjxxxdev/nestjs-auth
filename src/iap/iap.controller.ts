import { Body, Controller, Post, HttpCode, HttpStatus, Req, UseGuards, UnauthorizedException } from '@nestjs/common'; // 導入 UseGuards, UnauthorizedException
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IapService } from './iap.service';
import { IapResponseDto } from './dto/iap-response.dto';
import { VerifyReceiptRequestDto } from './dto/verify-receipt-request.dto'; // 導入 VerifyReceiptRequestDto
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'; // 導入 OptionalJwtAuthGuard
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';


@ApiTags('IAP')
@ApiBearerAuth()
@Controller('iap')
export class IapController {
  constructor(private readonly iapService: IapService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard) // ✅ 一定要登入
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '驗證收據',
    description: `
      驗證 Google / Apple 收據是否有效並入金。

      ⚠️ 注意：
      - IAP_USE_MOCK=true → 回傳 mock 並實際入金
      - IAP_USE_MOCK=false → 串接 Google / Apple 正式驗證 API
    `,
  })
  @ApiResponse({ status: 200, type: IapResponseDto, description: '驗證成功' })
  @ApiResponse({ status: 401, description: '未登入或使用者無效' })
  async verifyReceipt(
    @Body() body: VerifyReceiptRequestDto,
    @CurrentUser() user,
  ): Promise<IapResponseDto> {
    console.log('CurrentUser =', user);
    return this.iapService.verifyReceipt(
      body.platform,
      body.receipt,
      user.userId,
    );

  }

  @Post('webhook/google')
  // @ApiOperation({
  //   summary: 'Google IAP Webhook',
  //   description: `
  //     Google Play Server Notification → 通知退款/撤銷/入金等事件。

  //     ⚠️ 注意：
  //     - dev 模式 (IAP_USE_MOCK=true) → 只記錄 log
  //     - prod 模式 (IAP_USE_MOCK=false) → TODO: 驗證並更新 coin_ledger / iap_receipts
  //   `,
  // })
  @ApiOperation({ summary: 'Google IAP Webhook' })
  @ApiResponse({ status: 200, type: IapResponseDto, description: 'Google webhook 已接收' })
  @ApiResponse({ status: 401, description: 'Webhook 驗證失敗，未授權' })
  async handleGoogleWebhook(@Body() body: any): Promise<IapResponseDto> {
    return this.iapService.handleGoogleWebhook(body);
  }

  @Post('webhook/apple')
  // @ApiOperation({
  //   summary: 'Apple IAP Webhook',
  //   description: `
  //     Apple Server Notification → 通知退款/撤銷/入金等事件。

  //     ⚠️ 注意：
  //     - dev 模式 (IAP_USE_MOCK=true) → 只記錄 log
  //     - prod 模式 (IAP_USE_MOCK=false) → TODO: 驗證並更新 coin_ledger / iap_receipts
  //   `,
  // })
  @ApiOperation({ summary: 'Apple IAP Webhook' })
  @ApiResponse({ status: 200, type: IapResponseDto, description: 'Apple webhook 已接收' })
  @ApiResponse({ status: 401, description: 'Webhook 驗證失敗，未授權' })
  async handleAppleWebhook(@Body() body: any): Promise<IapResponseDto> {
    return this.iapService.handleAppleWebhook(body);
  }
}
