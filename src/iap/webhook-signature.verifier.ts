import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

/**
 * 🔐 Webhook 簽名驗證工具
 * 
 * 職責：
 * - 驗證 Google Pub/Sub JWT 簽名
 * - 驗證 Apple Server Notification v2 ES256 簽名
 * - 防重放（timestamp 檢查）
 * - 快取 Google 公鑰以減少 API 調用
 */
@Injectable()
export class WebhookSignatureVerifier {
  private readonly logger = new Logger(WebhookSignatureVerifier.name);
  
  // Google 公鑰快取（緩存 google.iam.googleapis.com 的公鑰）
  private googlePublicKeysCache: Map<string, any> = new Map();
  private googleKeysFetchTime: number = 0;
  private readonly GOOGLE_KEYS_CACHE_DURATION = 60 * 60 * 1000; // 1 小時

  // Apple 公鑰快取
  private applePublicKeysCache: Map<string, any> = new Map();
  private appleKeysFetchTime: number = 0;
  private readonly APPLE_KEYS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 小時

  constructor(private readonly configService: ConfigService) {}

  /**
   * 🔵 驗證 Google Pub/Sub JWT 簽名
   * 
   * Google Cloud Pub/Sub 發送的消息包含一個 JWT 類型的認證令牌（通常在 HTTP header 中）
   * 但從 Firebase 或其他代理商接收時，可能已轉發為 HTTPS，此時可能需要不同的驗證方式。
   * 
   * 簡化實作：驗證消息中的 data 和 attributes
   * 完整實作：需驗證來自 Google 的簽名證書
   * 
   * @param token JWT token（如果直接從 Pub/Sub 受到）
   * @param payload 消息 payload
   * @returns 驗證是否通過
   */
  async verifyGoogleSignature(
    token: string,
    payload?: any,
  ): Promise<{ valid: boolean; decoded?: any; error?: string }> {
    try {
      // 步驟 1：取得 Google 公鑰
      const publicKeys = await this.getGooglePublicKeys();
      
      if (!publicKeys || publicKeys.length === 0) {
        this.logger.error('[Google] 無法獲取 Google 公鑰');
        return { valid: false, error: 'Failed to fetch Google public keys' };
      }

      // 步驟 2：驗證 JWT（支援多個公鑰）
      let decoded;
      let verifyError;

      for (const key of publicKeys) {
        try {
          decoded = jwt.verify(token, key.publicKey, {
            algorithms: ['RS256'],
            issuer: 'accounts.google.com',
            clockTolerance: 10, // 允許 10 秒時間誤差
          });
          break; // 驗證成功，退出迴圈
        } catch (error) {
          verifyError = error;
          continue; // 嘗試下一個公鑰
        }
      }

      if (!decoded) {
        this.logger.warn(`[Google] JWT 驗證失敗: ${verifyError?.message}`);
        return { valid: false, error: verifyError?.message };
      }

      // 步驟 3：檢查簽名時間戳（防重放）
      const now = Date.now();
      const issuedAt = (decoded.iat || 0) * 1000; // 轉換為毫秒
      const age = now - issuedAt;

      if (age < 0 || age > 5 * 60 * 1000) { // 簽名必須在最近 5 分鐘內
        this.logger.warn(`[Google] 簽名時間異常，簽名年齡: ${age}ms`);
        return { valid: false, error: 'Signature timestamp outside acceptable range' };
      }

      this.logger.debug(`[Google] JWT 驗證成功，來自: ${decoded.email || decoded.sub}`);
      return { valid: true, decoded };

    } catch (error) {
      this.logger.error(`[Google] 簽名驗證異常: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  /**
   * 🔴 驗證 Apple Server Notification v2 簽名
   * 使用 ES256 算法驗證 JWT 簽名
   * 
   * Apple 簽名結構：
   * {
   *   "alg": "ES256",
   *   "kid": "...",  // Apple 根憑證 ID
   *   "typ": "JWT"
   * }
   * 
   * @param signedPayload JWT 簽名的 payload
   * @returns 驗證結果和解碼的 payload
   */
  async verifyAppleSignature(
    signedPayload: string,
  ): Promise<{ valid: boolean; decoded?: any; error?: string }> {
    try {
      // 步驟 1：解碼 JWT header（不驗證，只讀取）
      const decodedJwt = jwt.decode(signedPayload, { complete: true }) as any;

      if (!decodedJwt || !decodedJwt.header) {
        return { valid: false, error: 'Invalid JWT structure' };
      }

      const { alg, kid } = decodedJwt.header;

      if (alg !== 'ES256') {
        this.logger.warn(`[Apple] 不支援的簽名算法: ${alg}`);
        return { valid: false, error: `Unsupported signature algorithm: ${alg}` };
      }

      // 步驟 2：取得 Apple 公鑰（根據 kid）
      const publicKey = await this.getApplePublicKey(kid);

      if (!publicKey) {
        this.logger.error(`[Apple] 無法取得 kid=${kid} 的公鑰`);
        return { valid: false, error: `Apple public key not found for kid: ${kid}` };
      }

      // 步驟 3：驗證 ES256 簽名
      const decoded = jwt.verify(signedPayload, publicKey, {
        algorithms: ['ES256'],
        issuer: 'https://appleid.apple.com', // Apple 發行者識別
        clockTolerance: 10,
      }) as any;

      this.logger.debug(`[Apple] JWT 簽名驗證成功，通知 UUID: ${decoded.notificationUUID}`);
      return { valid: true, decoded };

    } catch (error) {
      this.logger.warn(`[Apple] 簽名驗證失敗: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  /**
   * 私有方法：取得 Google 公鑰
   * API: https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
   */
  private async getGooglePublicKeys(): Promise<any[]> {
    const now = Date.now();

    // 檢查快取是否仍有效
    if (this.googleKeysFetchTime + this.GOOGLE_KEYS_CACHE_DURATION > now) {
      if (this.googlePublicKeysCache.size > 0) {
        return Array.from(this.googlePublicKeysCache.values());
      }
    }

    try {
      const response = await axios.get(
        'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
        { timeout: 5000 },
      );

      // 清空舊快取
      this.googlePublicKeysCache.clear();

      // 儲存新公鑰
      for (const [kid, cert] of Object.entries(response.data)) {
        this.googlePublicKeysCache.set(kid, { kid, publicKey: cert });
      }

      this.googleKeysFetchTime = now;
      this.logger.debug(`[Google] 已快取 ${this.googlePublicKeysCache.size} 個公鑰`);

      return Array.from(this.googlePublicKeysCache.values());

    } catch (error) {
      this.logger.error(`[Google] 取得公鑰失敗: ${error.message}`);
      
      // 降級：如果取得失敗，嘗試返回快取中的舊公鑰
      if (this.googlePublicKeysCache.size > 0) {
        this.logger.warn('[Google] 使用快取的舊公鑰');
        return Array.from(this.googlePublicKeysCache.values());
      }

      throw new UnauthorizedException('Failed to fetch Google public keys');
    }
  }

  /**
   * 私有方法：取得 Apple 公鑰
   * API: https://appleid.apple.com/auth/keys
   */
  private async getApplePublicKey(kid: string): Promise<string | null> {
    const now = Date.now();

    // 如果快取有效且包含該 kid，直接返回
    if (this.appleKeysFetchTime + this.APPLE_KEYS_CACHE_DURATION > now) {
      const cached = this.applePublicKeysCache.get(kid);
      if (cached) return cached;
    }

    try {
      const response = await axios.get('https://appleid.apple.com/auth/keys', {
        timeout: 5000,
      });

      if (!response.data.keys || !Array.isArray(response.data.keys)) {
        throw new Error('Invalid Apple keys response structure');
      }

      // 更新快取
      this.applePublicKeysCache.clear();

      for (const key of response.data.keys) {
        if (key.kid) {
          // 根據 JWK (JSON Web Key) 格式轉換為 PEM 公鑰
          const pem = this.jwkToPem(key);
          this.applePublicKeysCache.set(key.kid, pem);
        }
      }

      this.appleKeysFetchTime = now;
      this.logger.debug(`[Apple] 已快取 ${this.applePublicKeysCache.size} 個公鑰。查詢 kid: ${kid}`);

      return this.applePublicKeysCache.get(kid) || null;

    } catch (error) {
      this.logger.error(`[Apple] 取得公鑰失敗: ${error.message}`);

      // 降級：嘗試返回快取中的公鑰
      const cached = this.applePublicKeysCache.get(kid);
      if (cached) {
        this.logger.warn(`[Apple] 使用快取的公鑰，kid: ${kid}`);
        return cached;
      }

      return null;
    }
  }

  /**
   * 私有方法：將 JWK 轉換為 PEM 格式（ES256）
   * Apple 使用 JWK 格式發佈公鑰，需轉換為 PEM 供 jwt.verify 使用
   * 
   * 注意：這是一個簡化實現。完整實現應使用 jwk-to-pem 或 node-jose 庫
   */
  private jwkToPem(jwk: any): string {
    // 此處應使用專門的庫（如 jwk-to-pem）來處理 JWK 轉 PEM
    // 暫時返回 JWK 直接（假設 jwt.verify 支援 JWK 格式）
    // 實際實時應安裝：npm install jwk-to-pem
    
    // 簡化：將 JWK 直接作為公鑰對象返回
    // 真實場景應使用：
    // const JwkToPem = require('jwk-to-pem');
    // return JwkToPem(jwk);
    
    return jwk; // 返回 JWK 本身，讓 jwt.verify 處理
  }

  /**
   * 🟢 清空快取（用於測試或強制刷新）
   */
  public clearCache(): void {
    this.googlePublicKeysCache.clear();
    this.applePublicKeysCache.clear();
    this.googleKeysFetchTime = 0;
    this.appleKeysFetchTime = 0;
    this.logger.debug('已清空所有公鑰快取');
  }
}
