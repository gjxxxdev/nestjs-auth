import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async coinPurchase(
    userId: number,
    storyListId: number,
    idemKey: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ 防重送（Idempotency）
      const existed = await tx.$queryRaw<any[]>`
        SELECT id FROM book_orders
        WHERE user_id = ${userId}
          AND idempotency_key = ${idemKey}
        LIMIT 1
      `;
      if (existed.length > 0) {
        return { message: '訂單已處理', orderId: existed[0].id };
      }

      // 2️⃣ 取得商品價格
      const items = await tx.$queryRaw<any[]>`
        SELECT priceCoins
        FROM book_store_items
        WHERE storyListId = ${storyListId}
          AND isActive = true
        LIMIT 1
      `;
      if (items.length === 0) {
        throw new BadRequestException('商品不存在或未上架');
      }
      const price = items[0].priceCoins;

      // 3️⃣ 取得目前餘額
      const balanceRows = await tx.$queryRaw<any[]>`
        SELECT balance
        FROM coin_ledger
        WHERE user_id = ${userId}
        ORDER BY id DESC
        LIMIT 1
      `;
      const balance = balanceRows.length ? balanceRows[0].balance : 0;

      if (balance < price) {
        throw new ForbiddenException('金幣不足');
      }

      const newBalance = balance - price;

      // 4️⃣ 建立訂單
      const order: any = await tx.$queryRaw`
        INSERT INTO book_orders
          (user_id, story_list_id, price_coins, status, idempotency_key, created_at)
        VALUES
          (${userId}, ${storyListId}, ${price}, 'SUCCESS', ${idemKey}, NOW())
      `;

      // $queryRaw 的回傳在不同驅動或版本可能為 OkPacket 或陣列，處理兩種情況以取得 insertId
      const orderId =
        (Array.isArray(order) ? (order[0] && (order[0] as any).insertId) : (order && (order as any).insertId)) ?? null;
      if (!orderId) {
        throw new BadRequestException('無法取得訂單 ID');
      }

      // 5️⃣ 扣幣流水
      await tx.$queryRaw`
        INSERT INTO coin_ledger
          (user_id, change_amount, balance, type, ref_id, created_at)
        VALUES
          (${userId}, ${-price}, ${newBalance}, 'BOOK_PURCHASE', ${orderId}, NOW())
      `;

      // 6️⃣ 建立權益
      await tx.$queryRaw`
        INSERT INTO entitlements
          (user_id, story_list_id, created_at)
        VALUES
          (${userId}, ${storyListId}, NOW())
      `;

      return {
        success: true,
        orderId,
        priceCoins: price,
        balance: newBalance,
      };
    });
  }
}
