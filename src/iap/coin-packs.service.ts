import { Injectable, BadRequestException, InternalServerErrorException, Logger, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCoinPackRequestDto } from './dto/create-coin-pack-request.dto';
import { UpdateCoinPackAdminRequestDto } from './dto/update-coin-pack-admin-request.dto';

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
      // 檢查 error 是否為 HttpException
      if (error instanceof HttpException) {
        throw error;
      }

      // 確認錯誤類型，用於檢查 Prisma 特定錯誤
      const prismaError = error as Record<string, unknown>;

      // P2002 是 Prisma 的唯一約束違反錯誤代碼
      if (prismaError.code === 'P2002') {
        this.logger.warn(`Unique constraint violation: ${String(prismaError.message)}`);
        throw new BadRequestException('此 platform 與 productId 的組合已存在');
      }

      // 其他未預期的錯誤
      const errorMessage = prismaError.message ? String(prismaError.message) : '未知錯誤';
      this.logger.error(`Failed to create coin pack: ${errorMessage}`, error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('建立金幣儲值包失敗，請稍後重試');
    }
  }

  /**
   * 更新金幣儲值包 (Admin Only) - 用於上下架管理
   * @param id 金幣儲值包 ID
   * @param updateCoinPackAdminDto 更新資料 (platform, product_id, name, is_active)
   * @returns 更新後的金幣儲值包
   * @throws NotFoundException - 當指定 ID 的金幣儲值包不存在
   * @throws BadRequestException - 當參數不合法或唯一性約束違反
   * @throws InternalServerErrorException - 資料庫操作失敗
   */
  async updateCoinPackAdmin(id: number, updateCoinPackAdminDto: UpdateCoinPackAdminRequestDto) {
    try {
      // 1. 檢查金幣儲值包是否存在
      const existingPack = await this.prisma.coinPack.findUnique({
        where: { id },
      });

      if (!existingPack) {
        this.logger.warn(`Attempt to update non-existent coin pack: id=${id}`);
        throw new NotFoundException(`金幣儲值包不存在 (ID: ${id})`);
      }

      // 2. 如果更新 platform 或 product_id，檢查新組合是否已存在
      if (
        existingPack.platform !== updateCoinPackAdminDto.platform ||
        existingPack.productId !== updateCoinPackAdminDto.product_id
      ) {
        const duplicatePack = await this.prisma.coinPack.findUnique({
          where: {
            platform_productId: {
              platform: updateCoinPackAdminDto.platform,
              productId: updateCoinPackAdminDto.product_id,
            },
          },
        });

        if (duplicatePack) {
          this.logger.warn(
            `Duplicate coin pack attempt during update: platform=${updateCoinPackAdminDto.platform}, productId=${updateCoinPackAdminDto.product_id}`,
          );
          throw new BadRequestException(
            `此 platform (${updateCoinPackAdminDto.platform}) 已存在相同的 productId (${updateCoinPackAdminDto.product_id})`,
          );
        }
      }

      // 3. 執行更新操作
      const updatedPack = await this.prisma.coinPack.update({
        where: { id },
        data: {
          platform: updateCoinPackAdminDto.platform,
          productId: updateCoinPackAdminDto.product_id,
          name: updateCoinPackAdminDto.name,
          // 將 is_active (0|1) 轉換為 isActive (boolean)
          // 0 表示下架 (false), 1 表示上架 (true)
          isActive: updateCoinPackAdminDto.is_active === 0 ? false : true,
        },
      });

      this.logger.log(
        `Successfully updated coin pack: id=${updatedPack.id}, isActive=${updatedPack.isActive}`,
      );

      return updatedPack;
    } catch (error) {
      // 檢查 error 是否為 HttpException
      if (error instanceof HttpException) {
        throw error;
      }

      // 確認錯誤類型，用於檢查 Prisma 特定錯誤
      const prismaError = error as Record<string, unknown>;

      // P2002 是 Prisma 的唯一約束違反錯誤代碼
      if (prismaError.code === 'P2002') {
        this.logger.warn(`Unique constraint violation during update: ${String(prismaError.message)}`);
        throw new BadRequestException('此 platform 與 productId 的組合已存在');
      }

      // 其他未預期的錯誤
      const errorMessage = prismaError.message ? String(prismaError.message) : '未知錯誤';
      this.logger.error(`Failed to update coin pack: ${errorMessage}`, error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('更新金幣儲值包失敗，請稍後重試');
    }
  }
}