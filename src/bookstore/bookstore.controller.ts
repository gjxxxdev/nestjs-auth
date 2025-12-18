import { Controller, Get } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('BookStore')
@Controller()
export class BookstoreController {
  constructor(private readonly bookstoreService: BookstoreService) {}

  @Get('bookstorelist')
  @ApiOperation({ summary: '取得書本商店清單' })
  @ApiResponse({ status: 200, description: '成功取得書本商店清單' })
  async getBookStoreList() {
    return this.bookstoreService.getBookStoreList();
  }
}
