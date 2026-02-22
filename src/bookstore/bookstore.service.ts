import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookstoreService {
  constructor(private prisma: PrismaService) {}

  async getBookStoreList() {
    try {
      const items = await this.prisma.bookStoreItem.findMany({
        where: {
          isActive: true,
        },
        include: {
          story: {
            select: {
              id: true,
              main_menu_name: true,
              author: true,
              main_menu_image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Prisma.findMany 若無資料會回傳空陣列，直接回傳給 controller
      return items;
    } catch (error) {
      // 若發生 DB 或 Prisma 錯誤，回傳 500 與一致的 message 結構
      throw new InternalServerErrorException({ success: false, message: '資料庫連線失敗' });
    }
  }

  /**
   * 取得使用者已購買的書籍清單（權益列表）
   * @param userId 使用者 ID
   * @param page 頁碼（預設 1）
   * @param limit 每頁筆數（預設 20）
   * @returns 分頁的已購買書籍列表
   */
  async getUserEntitlements(userId: number, page: number = 1, limit: number = 20) {
    try {
      // 驗證分頁參數
      const pageNum = Math.max(1, page);
      const limitNum = Math.max(1, limit);
      const skip = (pageNum - 1) * limitNum;

      // 並行查詢：取得總筆數和分頁資料
      const [entitlements, total] = await Promise.all([
        this.prisma.entitlements.findMany({
          where: {
            user_id: BigInt(userId),
          },
          select: {
            story_list_id: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc', // 按購買日期最新優先
          },
          skip,
          take: limitNum,
        }),
        this.prisma.entitlements.count({
          where: {
            user_id: BigInt(userId),
          },
        }),
      ]);

      // 獲取關聯的故事資訊
      const storyListIds = entitlements.map((e) => e.story_list_id);
      const stories = await this.prisma.storyLists.findMany({
        where: {
          id: { in: storyListIds },
        },
        select: {
          id: true,
          main_menu_name: true,
          author: true,
          main_menu_image: true,
        },
      });

      // 建立 story ID 的 Map 以加速查詢
      const storyMap = new Map(stories.map((s) => [s.id, s]));

      // 組合結果
      const items = entitlements.map((entitled) => ({
        storyListId: entitled.story_list_id,
        createdAt: entitled.created_at,
        story: storyMap.get(entitled.story_list_id),
      }));

      return {
        items,
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: '資料庫連線失敗' });
    }
  }
}
