import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookstoreService {
  constructor(private prisma: PrismaService) {}

  async getBookStoreList() {
    return this.prisma.bookStoreItem.findMany({
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
  }
}

