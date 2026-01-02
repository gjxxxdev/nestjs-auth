import { addCoinLedger } from './coin-ledger.helper';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IapResponseDto } from './dto/iap-response.dto'; // ✅ 確保有 import
import { PrismaService } from '../prisma.service';

@Injectable()
export class IapService {
  private readonly logger = new Logger(IapService.name);
  private readonly isProd: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.isProd = this.configService.get('NODE_ENV') === 'production';
  }

  async verifyReceipt(
    platform: 'GOOGLE' | 'APPLE',
    receipt: string,
    userId: number,
  ): Promise<IapResponseDto> {
    if (!this.isProd) {
      // 🟢 開發模式：直接回 mock 結果
      this.logger.warn(`[MOCK] Verify receipt for ${platform}`);

      // ✅ 真正寫入 coin_ledger（重點）
      await addCoinLedger({
        userId,
        changeAmount: 100,
        type: 'IAP',
      });

      return {
        success: true,
        platform,
        userId,
        coinsAdded: 100,
        message: '收據驗證成功，入金 100 金幣 (mock)',
        raw: { mock: true},
      };
    }

    if (platform === 'GOOGLE') {
      return this.verifyGoogle(receipt, userId);
    } else if (platform === 'APPLE') {
      return this.verifyApple(receipt, userId);
    } else {
      throw new UnauthorizedException('Unsupported platform');
    }
  }

  private async verifyGoogle(receipt: string, userId: number): Promise<IapResponseDto> {
    try {
      const serviceAccount = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY');
      const packageName = this.configService.get<string>('GOOGLE_PACKAGE_NAME');
      const productId = 'coin_pack_100'; // TODO: 根據 receipt 解析 productId
      const token = receipt;

      const response = await axios.get(
        `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${token}`,
        { headers: { Authorization: `Bearer ${serviceAccount}` } },
      );

      return {
        success: true,
        platform: 'GOOGLE',
        userId,
        coinsAdded: 100,
        message: 'Google receipt verified successfully',
        raw: response.data,
      };
    } catch (error) {
      this.logger.error(`Google verify failed: ${error.message}`);
      throw new UnauthorizedException('Google receipt invalid');
    }
  }

  private async verifyApple(receipt: string, userId: number): Promise<IapResponseDto> {
    try {
      const sharedSecret = this.configService.get<string>('APPLE_SHARED_SECRET');
      const response = await axios.post('https://buy.itunes.apple.com/verifyReceipt', {
        'receipt-data': receipt,
        password: sharedSecret,
      });

      if (response.data.status !== 0) {
        throw new UnauthorizedException('Apple receipt invalid');
      }

      return {
        success: true,
        platform: 'APPLE',
        userId,
        coinsAdded: 100,
        message: 'Apple receipt verified successfully',
        raw: response.data,
      };
    } catch (error) {
      this.logger.error(`Apple verify failed: ${error.message}`);
      throw new UnauthorizedException('Apple receipt invalid');
    }
  }

  // ✅ Google Webhook
  /**
   * 處理 Google Webhook 通知。
   * @param body Webhook 請求的內容。
   * @param userId 使用者 ID，預設為 'system'。
   * @returns IapResponseDto 包含處理結果。
   */
  async handleGoogleWebhook(body: any, userId: number | string = 'system'): Promise<IapResponseDto> {
    this.logger.warn(`收到 Google Webhook: ${JSON.stringify(body)}`);
    return {
      success: true,
      platform: 'GOOGLE',
      userId,
      coinsAdded: 0,
      message: 'Google webhook 已接收 (mock)',
      raw: body,
    };
  }

  // ✅ Apple Webhook
  /**
   * 處理 Apple Webhook 通知。
   * @param body Webhook 請求的內容。
   * @param userId 使用者 ID，預設為 'system'。
   * @returns IapResponseDto 包含處理結果。
   */
  async handleAppleWebhook(body: any, userId: number | string = 'system'): Promise<IapResponseDto> {
    this.logger.warn(`收到 Apple Webhook: ${JSON.stringify(body)}`);
    return {
      success: true,
      platform: 'APPLE',
      userId,
      coinsAdded: 0,
      message: 'Apple webhook 已接收 (mock)',
      raw: body,
    };
  }
}
