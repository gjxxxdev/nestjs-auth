import { Controller, Get } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';
import { ApiTags, ApiOperation, ApiResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { BookstoreItemDto } from './dto/get-bookstore-list-response.dto';
import { ErrorResponseDto } from './dto/error-response.dto';

@ApiTags('BookStore')
@Controller()
export class BookstoreController {
  constructor(private readonly bookstoreService: BookstoreService) {}

  @Get('bookstorelist')
  @ApiOperation({ summary: '取得書本商店清單' })
  @ApiResponse({ status: 200, description: '成功取得書本商店清單（空陣列表示沒有商品）', type: () => BookstoreItemDto, isArray: true })
  @ApiUnauthorizedResponse({
    description: '未授權（401）',
    type: ErrorResponseDto,
    schema: { example: { success: false, message: '未授權' } },
  })
  @ApiForbiddenResponse({
    description: '權限不足（403）',
    type: ErrorResponseDto,
    schema: { example: { success: false, message: '權限不足(403)' } },
  })
  @ApiInternalServerErrorResponse({
    description: '伺服器錯誤（500），例如 DB 連線失敗',
    type: ErrorResponseDto,
    schema: { example: { success: false, message: '伺服器錯誤（500），例如 DB 連線失敗' } },
  })
  async getBookStoreList() {
    return this.bookstoreService.getBookStoreList();
  }
}
