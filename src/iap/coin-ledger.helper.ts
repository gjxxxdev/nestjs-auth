import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 金幣帳本 helper（直接對應既有 DB 結構）
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

  // ✅ 查最後一筆 balance（使用實際 DB 欄位 user_id）
  const last = await prisma.$queryRaw<
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

  // ✅ 寫入 ledger
  await prisma.$executeRaw`
    INSERT INTO coin_ledger (user_id, change_amount, balance, type)
    VALUES (${userId}, ${changeAmount}, ${newBalance}, ${type})
  `;

  return {
    userId,
    changeAmount,
    balance: newBalance,
    type,
  };
}
