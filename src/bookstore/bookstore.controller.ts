import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';
import { ApiTags, ApiOperation, ApiResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiQuery } from '@nestjs/swagger';
import { BookstoreItemDto } from './dto/get-bookstore-list-response.dto';
import { GetMyEntitlementsResponseDto } from './dto/get-my-entitlements-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('BookStore')
@Controller()
export class BookstoreController {
  constructor(private readonly bookstoreService: BookstoreService) {}

  @Get('bookstorelist')
  @ApiOperation({ summary: '取得書本商店清單' })
  @ApiResponse({ status: 200, description: '成功取得書本商店清單（空陣列表示沒有商品）', type: () => BookstoreItemDto, isArray: true })
  @ApiUnauthorizedResponse({
    description: '未授權（401）',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '未授權' },
      },
      example: { success: false, message: '未授權' },
    },
  })
  @ApiForbiddenResponse({
    description: '權限不足（403）',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '權限不足(403)' },
      },
      example: { success: false, message: '權限不足(403)' },
    },
  })
  @ApiInternalServerErrorResponse({
    description: '伺服器錯誤（500），例如 DB 連線失敗',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '伺服器錯誤（500），例如 DB 連線失敗' },
      },
      example: { success: false, message: '伺服器錯誤（500），例如 DB 連線失敗' },
    },
  })
  async getBookStoreList() {
    return this.bookstoreService.getBookStoreList();
  }

  @Get('me/entitlements')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '取得我已購買的書籍' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '頁碼（預設 1）', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每頁筆數（預設 20）', example: 20 })
  @ApiResponse({
    status: 200,
    description: '成功取得已購買書籍清單',
    type: GetMyEntitlementsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '未授權（401）',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '未授權' },
      },
      example: { success: false, message: '未授權' },
    },
  })
  @ApiInternalServerErrorResponse({
    description: '伺服器錯誤（500）',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '資料庫連線失敗' },
      },
      example: { success: false, message: '資料庫連線失敗' },
    },
  })
  async getMyEntitlements(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.bookstoreService.getUserEntitlements(user.userId, pageNum, limitNum);
  }
}
