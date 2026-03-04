import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClaimRewardResponseDto } from './dto/claim-reward-response.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 領取活動獎勵
   * @param userId 使用者 ID
   * @param activityName 活動名稱（如 'PROFILE_COMPLETED'）
   * @returns 領取結果
   */
  async claimActivityReward(
    userId: number,
    activityName: string,
  ): Promise<ClaimRewardResponseDto> {
    // 1️⃣ 硬編碼活動規則
    const activityRules: Record<string, number> = {
      PROFILE_COMPLETED: 50, // 完善資料送 50 金幣
    };

    const rewardAmount = activityRules[activityName];
    if (!rewardAmount) {
      throw new BadRequestException(`無效的活動名稱: ${activityName}`);
    }

    // 定義流水來源標籤，用於跟蹤和防重複
    const sourceLabel = `ACTIVITY:${activityName}`;

    // 2️⃣ 使用 Transaction 確保交易安全
    const result = await this.prisma.$transaction(
      async (tx) => {
        // 防護機制：檢查是否已經領過這個活動！
        const existingClaim = await tx.activityClaim.findUnique({
          where: {
            userId_activity: {
              userId,
              activity: activityName,
            },
          },
        });

        if (existingClaim) {
          throw new BadRequestException(
            '您已經領取過此活動的獎勵，無法重複領取。',
          );
        }

        // 3️⃣ 查出使用者目前的餘額
        // 由於金幣餘額通過 CoinLedger 計算，取最後一筆記錄的 balance
        const lastLedger = await tx.coinLedger.findFirst({
          where: { userId },
          orderBy: { id: 'desc' },
        });

        let currentBalance = lastLedger ? lastLedger.balance : 0;
        const newBalance = currentBalance + rewardAmount;

        // 4️⃣ 寫入金幣流水
        await tx.coinLedger.create({
          data: {
            userId,
            changeAmount: rewardAmount,
            balance: newBalance,
            type: 'ACTIVITY_REWARD', // 標記為活動獎勵
            source: sourceLabel, // 來源標籤，便於事後查詢和對帳
          },
        });

        // 5️⃣ 記錄活動領取歷史
        // 使用 unique 索引防止二次領取
        await tx.activityClaim.create({
          data: {
            userId,
            activity: activityName,
          },
        });

        this.logger.log(
          `[ClaimReward] User: ${userId}, Activity: ${activityName}, Amount: ${rewardAmount}, NewBalance: ${newBalance}`,
        );

        return {
          success: true,
          message: '獎勵領取成功',
          rewardAmount,
          newBalance,
        };
      },
      {
        // 設定 transaction 超時時間（ms）
        timeout: 5000,
      },
    );

    return result;
  }
}
