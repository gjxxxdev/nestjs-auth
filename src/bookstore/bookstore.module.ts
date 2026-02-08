import { Module } from '@nestjs/common';
import { BookstoreController } from './bookstore.controller';
import { BookstoreService } from './bookstore.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BookstoreController],
  providers: [BookstoreService, PrismaService],
})
export class BookstoreModule {}
