import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function handleIapSuccess(params: {
  userId: number;
  platform: 'GOOGLE' | 'APPLE';
  productId: string;
  transactionId: string;
  amount: number;       // 基礎金幣
  bonusAmount: number;  // 獎勵金幣
  rawResponse?: any;
}) {
  const { userId, platform, productId, transactionId, amount, bonusAmount, rawResponse } = params;
  const totalCoins = amount + bonusAmount;

  if (!userId || userId <= 0) {
    throw new Error('Invalid userId');
  }

  // 使用 Prisma Transaction 確保原子性：要麼全部成功，要麼全部失敗
  return prisma.$transaction(async (tx) => {
    
    /** 1️⃣ 防重放檢查 (Idempotency Check) */
    // 利用資料庫的唯一索引 (platform + transactionId) 來防止重複入金
    const existingReceipt = await tx.iapReceipt.findUnique({
      where: {
        platform_transactionId: { platform, transactionId },
      },
    });

    if (existingReceipt) {
      console.warn(`[IAP Helper] 偵測到重複交易: ${transactionId}，已攔截。`);
      return {
        duplicated: true,
        message: 'Receipt already processed',
        transactionId,
      };
    }

    /** 2️⃣ 記錄詳細收據 (IapReceipt) */
    // 這張表是你的「原始憑證」，絕對不能出錯
    const savedReceipt = await tx.iapReceipt.create({
      data: {
        userId,
        platform,
        productId,
        transactionId,
        coins: totalCoins,
        status: 'SUCCESS',
        rawResponse: rawResponse || {},
      },
    });

    /** 3️⃣ 更新帳本 (CoinLedger) - 拆帳記錄 */
    // 先取得該使用者目前的最後一筆餘額
    const lastLedger = await tx.coinLedger.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
    });

    let currentBalance = lastLedger ? lastLedger.balance : 0;

    // A. 基礎金幣入帳
    currentBalance += amount;
    await tx.coinLedger.create({
      data: {
        userId,
        changeAmount: amount,
        balance: currentBalance,
        type: 'IAP', // 類型標記為正式內購
        source: `ORDER:${transactionId}|PROD:${productId}`, // 記錄來源方便對帳
      },
    });

    // B. 獎勵金幣入帳 (如果有贈送才寫入)
    if (bonusAmount > 0) {
      currentBalance += bonusAmount;
      await tx.coinLedger.create({
        data: {
          userId,
          changeAmount: bonusAmount,
          balance: currentBalance,
          type: 'IAP_BONUS', // 類型標記為獎勵金幣
          source: `ORDER:${transactionId}|PROD:${productId}_BONUS`,
        },
      });
    }

    console.log(`[IAP Success] User: ${userId} 儲值成功。總計: ${totalCoins} (含 Bonus: ${bonusAmount})。`);

    return {
      success: true,
      userId,
      receiptId: savedReceipt.id,
      coinsAdded: totalCoins,
      balance: currentBalance,
    };
  }, {
    // 設定超時時間，避免大型交易卡住資料庫 (預設 5s)
    timeout: 10000, 
  });
}