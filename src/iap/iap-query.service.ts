import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { MyIapReceiptsResponseDto } from './dto/my-iap-receipts-response.dto';
import { MyCoinLedgerResponseDto } from './dto/my-coin-ledger-response.dto';
import { AdminIapReceiptsResponseDto } from './dto/admin-iap-receipts-response.dto';

@Injectable()
export class IapQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

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

  // 4️⃣ 後台查帳：查詢特定使用者的 IAP 交易記錄（含分頁）
  async getAdminIapReceipts(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<AdminIapReceiptsResponseDto> {
    // 計算分頁參數
    const offset = (page - 1) * limit;

    // 1️⃣ 查詢總筆數
    const countResult = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as total
      FROM iap_receipts
      WHERE user_id = ${userId}
    `;
    // 處理 BigInt 類型轉換
    const total = Number(countResult[0]?.total || 0);

    // 2️⃣ 查詢 IAP 交易記錄（不 JOIN user，僅查 iap_receipts 和 coin_packs）
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        r.id,
        r.transaction_id,
        r.user_id,
        r.platform,
        r.product_id,
        r.coins as total_coins,
        r.status,
        r.created_at,
        p.name as product_name,
        p.price,
        p.currency,
        p.amount as pack_base,
        p.bonus_amount as pack_bonus
      FROM iap_receipts r
      LEFT JOIN coin_packs p 
        ON r.platform = p.platform 
        AND r.product_id = p.product_id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // 3️⃣ 使用 UsersService 透過 ORM 獲取用戶信息
    const userProfile = await this.usersService.getProfile(userId).catch(() => null);

    return {
      items: rows.map((r) => {
        // 計算基礎金幣和獎勵金幣
        const base = r.pack_base !== null ? r.pack_base : r.total_coins;
        const bonus = r.pack_bonus !== null ? r.pack_bonus : 0;

        return {
          receiptId: r.transaction_id,
          userId: r.user_id,
          username: userProfile?.name || '未知用戶',
          email: userProfile?.email || 'N/A',
          platform: r.platform as 'GOOGLE' | 'APPLE',
          productId: r.product_id,
          productName: r.product_name || '（已下架）',
          price: r.price ? r.price.toString() : '0',
          currency: r.currency || '',
          baseCoins: base,
          bonusCoins: bonus,
          totalCoins: r.total_coins,
          status: r.status,
          createdAt: r.created_at,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}