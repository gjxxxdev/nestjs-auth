import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MyIapReceiptsResponseDto } from './dto/my-iap-receipts-response.dto';
import { MyCoinLedgerResponseDto } from './dto/my-coin-ledger-response.dto';

@Injectable()
export class IapQueryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1️⃣ 我的 IAP 儲值紀錄
  async getMyIapReceipts(userId: number): Promise<MyIapReceiptsResponseDto> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        r.transaction_id,
        r.platform,
        r.product_id,
        r.coins as total_coins,       -- 對應 DTO 的 totalCoins
        r.status,
        r.created_at,
        p.amount as pack_base,        -- 用於計算 baseCoins
        p.bonus_amount as pack_bonus  -- 用於計算 bonusCoins
      FROM iap_receipts r
      LEFT JOIN coin_packs p 
        ON r.platform = p.platform 
        AND r.product_id = p.product_id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
    `;

    return {
      items: rows.map((r) => {
        // 邏輯：如果商品設定已刪除 (LEFT JOIN 為 null)，則預設 Bonus 為 0
        const base = r.pack_base !== null ? r.pack_base : r.total_coins;
        const bonus = r.pack_bonus !== null ? r.pack_bonus : 0;

        return {
          receiptId: r.transaction_id,
          
          // 🟢 修正點：加上型別斷言，解決 TS 報錯
          platform: r.platform as 'GOOGLE' | 'APPLE', 
          
          productId: r.product_id,
          
          // 對應 DTO 新增的欄位
          totalCoins: r.total_coins, 
          baseCoins: base,
          bonusCoins: bonus,

          status: r.status,
          createdAt: r.created_at,
        };
      }),
    };
  }

  // 2️⃣ 我的金幣餘額
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

  // 3️⃣ 我的金幣流水
  async getMyCoinLedger(userId: number): Promise<MyCoinLedgerResponseDto> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        id,
        change_amount,
        balance,
        type,
        source,
        created_at
      FROM coin_ledger
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 50
    `;

    return {
      items: rows.map((r) => ({
        id: r.id,
        amount: r.change_amount,
        balance: r.balance,
        type: r.type,
        source: r.source,
        createdAt: r.created_at,
      })),
    };
  }
}