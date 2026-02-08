import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CoinPacksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 取得金幣商品清單
   * @param platform 平台 (GOOGLE | APPLE)
   */
  async findAll(platform?: 'GOOGLE' | 'APPLE') {
    return this.prisma.coinPack.findMany({
      where: {
        // 1. 只撈取 "上架中" 的商品
        isActive: true,
        // 2. 如果有指定平台則過濾，否則撈取全部
        ...(platform && { platform }),
      },
      orderBy: {
        // 3. 依照資料庫設定的 sortOrder 進行排序 (由小到大)
        sortOrder: 'asc',
      },
      // 4. (選填) 如果不想回傳 created_at 等欄位，可以用 select 過濾
      // select: {
      //   id: true,
      //   productId: true,
      //   name: true,
      //   price: true,
      //   currency: true,
      //   amount: true,
      //   bonusAmount: true,
      //   platform: true,
      // }
    });
  }
}