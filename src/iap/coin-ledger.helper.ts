import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 金幣帳本 helper（正式建議版）
 * - 使用 Raw SQL，完全對齊既有 DB
 * - 使用 transaction，避免併發問題
 */
export async function addCoinLedger(params: {
  userId: number;
  changeAmount: number;
  type: string;
}) {
  const { userId, changeAmount, type } = params;

  if (!userId || userId <= 0) {
    throw new Error(`Invalid userId: ${userId}`);
  }

  return prisma.$transaction(async (tx) => {
    // 1️⃣ 取得最後一筆 balance
    const last = await tx.$queryRaw<
      Array<{ balance: number }>
    >`
      SELECT balance
      FROM coin_ledger
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 1
    `;

    const prevBalance = last.length > 0 ? last[0].balance : 0;
    const newBalance = prevBalance + changeAmount;

    if (newBalance < 0) {
      throw new Error('金幣不足');
    }

    // 2️⃣ 寫入帳本
    await tx.$executeRaw`
      INSERT INTO coin_ledger (user_id, change_amount, balance, type)
      VALUES (${userId}, ${changeAmount}, ${newBalance}, ${type})
    `;

    return {
      userId,
      changeAmount,
      balance: newBalance,
      type,
    };
  });
}
