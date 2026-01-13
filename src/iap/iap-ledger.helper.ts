import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function handleIapSuccess(params: {
  userId: number;
  platform: 'GOOGLE' | 'APPLE';
  productId: string;
  transactionId: string;
  coins: number;
  rawResponse?: any;
}) {
  const { userId, platform, productId, transactionId, coins, rawResponse } = params;

  if (!userId || userId <= 0) {
    throw new Error('Invalid userId');
  }

  return prisma.$transaction(async (tx) => {
    /** 1️⃣ 防止重複入金（transaction_id 唯一） */
    const exists = await tx.$queryRaw<
      Array<{ id: number }>
    >`
      SELECT id
      FROM iap_receipts
      WHERE transaction_id = ${transactionId}
      LIMIT 1
    `;

    if (exists.length > 0) {
      return {
        duplicated: true,
        message: 'Receipt already processed',
      };
    }

    /** 2️⃣ 寫入 iap_receipts */
    await tx.$executeRaw`
      INSERT INTO iap_receipts
        (user_id, platform, product_id, transaction_id, coins, status, raw_response)
      VALUES
        (${userId}, ${platform}, ${productId}, ${transactionId}, ${coins}, 'SUCCESS', ${JSON.stringify(rawResponse)})
    `;

    /** 3️⃣ 寫入 coin_ledger（沿用你的邏輯） */
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
    const newBalance = prevBalance + coins;

    await tx.$executeRaw`
      INSERT INTO coin_ledger (user_id, change_amount, balance, type)
      VALUES (${userId}, ${coins}, ${newBalance}, 'IAP')
    `;

    return {
      success: true,
      userId,
      coinsAdded: coins,
      balance: newBalance,
    };
  });
}
