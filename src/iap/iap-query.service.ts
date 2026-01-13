import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MyIapReceiptsResponseDto } from './dto/my-iap-receipts-response.dto';

@Injectable()
export class IapQueryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1️⃣ 我的 IAP 儲值紀錄
  async getMyIapReceipts(userId: number): Promise<MyIapReceiptsResponseDto> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        transaction_id,
        platform,
        product_id,
        coins,
        status,
        created_at
      FROM iap_receipts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return {
      items: rows.map(r => ({
        receiptId: r.transaction_id,
        platform: r.platform,
        productId: r.product_id,
        coins: r.coins,
        status: r.status,
        createdAt: r.created_at,
      })),
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
