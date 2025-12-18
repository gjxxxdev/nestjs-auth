import { Body, Controller, Post, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common'; // 導入 UseGuards
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IapService } from './iap.service';
import { IapResponseDto } from './dto/iap-response.dto';
import { VerifyReceiptRequestDto } from './dto/verify-receipt-request.dto'; // 導入 VerifyReceiptRequestDto
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'; // 導入 OptionalJwtAuthGuard


@ApiTags('IAP')
@Controller('iap')
export class IapController {
  constructor(private readonly iapService: IapService) {}

  @Post('verify')
  @UseGuards(OptionalJwtAuthGuard) // 添加 OptionalJwtAuthGuard
  @HttpCode(HttpStatus.OK) // ← 改成 200，而不是 201
  @ApiOperation({
    summary: '驗證收據',
    description: `
      驗證 Google / Apple 收據是否有效並入金。

      ⚠️ 注意：
      - 若 IAP_USE_MOCK=true → 回傳固定測試結果，不會驗證收據
      - 若 IAP_USE_MOCK=false → 串接 Google / Apple 正式驗證 API
    `,
  })
  @ApiResponse({ status: 200, type: IapResponseDto, description: '驗證成功' })
  @ApiResponse({ status: 401, description: '驗證失敗，收據無效' })
  async verifyReceipt(
    @Body() body: VerifyReceiptRequestDto, // 使用 DTO 處理請求體
    @Req() req,
  ): Promise<IapResponseDto> {
  const { platform, receipt } = body; // 從 DTO 中提取參數
  const userId = req.user.id;
  return this.iapService.verifyReceipt(platform, receipt, userId);
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
