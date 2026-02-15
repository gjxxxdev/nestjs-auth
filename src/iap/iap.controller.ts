import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common'; // 🟢 修正 mport -> import
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IapService } from './iap.service';
import { IapResponseDto } from './dto/iap-response.dto';
import { VerifyReceiptRequestDto } from './dto/verify-receipt-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('IAP')
@ApiBearerAuth()
@Controller('iap')
export class IapController {
  private readonly logger = new Logger(IapController.name);

  constructor(private readonly iapService: IapService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard) // ✅ 強制登入驗證
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '驗證 Google/Apple 收據並入金',
    description: `
      前端完成內購後，將 platform, receipt 與 productId 傳送到此 API。
      後端會根據 productId 查詢對應的金幣數量 (含 Bonus) 並寫入帳本。
      
      - Google Play: receipt 欄位請傳入 purchaseToken。
      - Apple App Store: receipt 欄位請傳入 base64 編碼的收據。
    `,
  })
  @ApiResponse({ status: 200, type: IapResponseDto, description: '驗證成功並已入金' })
  @ApiResponse({ status: 400, description: '參數格式錯誤 (productId 缺失或平台不支援)' })
  @ApiResponse({ status: 401, description: '憑證無效或收據驗證失敗' })
  async verifyReceipt(
    @Body() body: VerifyReceiptRequestDto,
    @CurrentUser() user,
  ): Promise<IapResponseDto> {
    this.logger.log(`[Verify] User: ${user.userId}, Platform: ${body.platform}, Product: ${body.productId}`);

    // 呼叫 Service 執行第三方驗證與資料庫交易
    return this.iapService.verifyReceipt(
      body.platform,
      body.receipt,
      user.userId,
      body.productId,
    );
  }

  @Post('webhook/google')
  @ApiOperation({ summary: '接收 Google Play Server Notifications' })
  @ApiResponse({ status: 200, description: 'Webhook 處理完成' })
  async handleGoogleWebhook(@Body() body: any): Promise<IapResponseDto> {
    this.logger.log('收到 Google Webhook');
    // 注意：Webhook 呼叫通常不帶登入資訊，userId 傳 'system'
    return this.iapService.handleGoogleWebhook(body, 'system');
  }

  @Post('webhook/apple')
  @ApiOperation({ summary: '接收 Apple App Store Server Notifications' })
  @ApiResponse({ status: 200, description: 'Webhook 處理完成' })
  async handleAppleWebhook(@Body() body: any): Promise<IapResponseDto> {
    this.logger.log('收到 Apple Webhook');
    // 同上，userId 傳 'system'
    return this.iapService.handleAppleWebhook(body, 'system');
  }
}