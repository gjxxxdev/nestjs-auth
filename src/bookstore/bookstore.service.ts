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
}
