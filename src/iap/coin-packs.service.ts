import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCoinPackRequestDto } from './dto/create-coin-pack-request.dto';

@Injectable()
export class CoinPacksService {
  private readonly logger = new Logger(CoinPacksService.name);

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

  /**
   * 建立金幣儲值包 (Admin Only)
   * @param createCoinPackDto 金幣儲值包資料
   * @returns 建立的金幣儲值包
   * @throws BadRequestException - 當 platform + productId 已存在或參數不合法
   * @throws InternalServerErrorException - 資料庫操作失敗
   */
  async create(createCoinPackDto: CreateCoinPackRequestDto) {
    try {
      // 檢查 platform + productId 的組合是否已存在
      const existingPack = await this.prisma.coinPack.findUnique({
        where: {
          platform_productId: {
            platform: createCoinPackDto.platform,
            productId: createCoinPackDto.product_id,
          },
        },
      });

      if (existingPack) {
        this.logger.warn(
          `Duplicate coin pack attempt: platform=${createCoinPackDto.platform}, productId=${createCoinPackDto.product_id}`,
        );
        throw new BadRequestException(
          `此 platform (${createCoinPackDto.platform}) 已存在相同的 productId (${createCoinPackDto.product_id})`,
        );
      }

      // 建立新的金幣儲值包
      const coinPack = await this.prisma.coinPack.create({
        data: {
          platform: createCoinPackDto.platform,
          productId: createCoinPackDto.product_id,
          name: createCoinPackDto.name,
          amount: createCoinPackDto.amount,
          bonusAmount: createCoinPackDto.bonusAmount || 0,
          price: createCoinPackDto.price,
          currency: createCoinPackDto.currency || 'TWD',
          isActive: createCoinPackDto.is_active === 0 ? false : true,
          sortOrder: 999, // 預設排序權重，管理員可後續調整
        },
      });

      this.logger.log(
        `Successfully created coin pack: id=${coinPack.id}, platform=${coinPack.platform}, productId=${coinPack.productId}`,
      );

      return coinPack;
    } catch (error) {
      // P2002 是 Prisma 的唯一約束違反錯誤代碼
      if (error.code === 'P2002') {
        this.logger.warn(`Unique constraint violation: ${error.message}`);
        throw new BadRequestException('此 platform 與 productId 的組合已存在');
      }

      // 如果已經是 HttpException，直接拋出
      if (error.status) {
        throw error;
      }

      // 其他未預期的錯誤
      this.logger.error(`Failed to create coin pack: ${error.message}`, error.stack);
      throw new InternalServerErrorException('建立金幣儲值包失敗，請稍後重試');
    }
  }
}