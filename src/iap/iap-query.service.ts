import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MyIapReceiptsResponseDto } from './dto/my-iap-receipts-response.dto';

@Injectable()
export class IapQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1️⃣ 查詢我的 IAP 儲值紀錄
   * 透過 LEFT JOIN 取得當初商品的基礎金幣與 Bonus 設定
   */
  async getMyIapReceipts(userId: number): Promise<MyIapReceiptsResponseDto> {
    /**
     * r = iap_receipts (交易紀錄表)
     * p = coin_packs (商品設定表)
     * * 我們使用 LEFT JOIN，即使商品後來被下架或刪除，
     * 交易紀錄 (r) 依然存在，只是查不到對應的 p (會變 null)。
     */
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        r.transaction_id,
        r.platform,
        r.product_id,
        r.coins as total_coins,     -- 這是當初寫入紀錄的總金幣 (Base + Bonus)
        r.status,
        r.created_at,
        p.amount as pack_base,      -- 從商品表查到的基礎金幣
        p.bonus_amount as pack_bonus -- 從商品表查到的獎勵金幣
      FROM iap_receipts r
      LEFT JOIN coin_packs p 
        ON r.platform = p.platform 
        AND r.product_id = p.product_id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
    `;

    return {
      items: rows.map((r) => {
        // 處理邏輯：
        // 如果 p.pack_base 是 null (代表商品可能被刪了)，我們就假設該筆交易沒有 Bonus，
        // 也就是 基礎金幣 = 總金幣，Bonus = 0。
        const base = r.pack_base !== null ? r.pack_base : r.total_coins;
        const bonus = r.pack_bonus !== null ? r.pack_bonus : 0;

        return {
          receiptId: r.transaction_id,
          platform: r.platform,
          productId: r.product_id,
          totalCoins: r.total_coins, // 對應 DTO 的 totalCoins
          baseCoins: base,           // 對應 DTO 的 baseCoins
          bonusCoins: bonus,         // 對應 DTO 的 bonusCoins
          status: r.status,
          createdAt: r.created_at,
        };
      }),
    };
  }

  /**
   * 2️⃣ 查詢我的金幣餘額
   * 取 coin_ledger 最新一筆的 balance
   */
  async getMyCoinBalance(userId: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT balance
      FROM coin_ledger
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 1
    `;

    return {
      balance: rows.length > 0 ? rows[0].balance : 0,
    };
  }

  /**
   * 3️⃣ 查詢我的金幣流水
   * 取最近 50 筆變動紀錄
   */
  async getMyCoinLedger(userId: number) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        change_amount,
        type,
        created_at
      FROM coin_ledger
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 50
    `;

    return {
      items: rows.map(r => ({
        change: r.change_amount,
        type: r.type,
        createdAt: r.created_at,
      })),
    };
  }
}