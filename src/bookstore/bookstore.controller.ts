import { Controller, Get, Query, UseGuards, Logger, BadRequestException, ValidationPipe } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';
import { ApiTags, ApiOperation, ApiResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BookstoreItemDto } from './dto/get-bookstore-list-response.dto';
import { GetMyEntitlementsResponseDto } from './dto/get-my-entitlements-response.dto';
import { AdminEntitlementsQueryDto } from './dto/admin-entitlements-query.dto';
import { AdminEntitlementsResponseDto } from './dto/admin-entitlements-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('BookStore')
@Controller()
export class BookstoreController {
  private readonly logger = new Logger(BookstoreController.name);

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
  @ApiBearerAuth()
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
    this.logger.log('🔵 [BookstoreController] getMyEntitlements() 被呼叫');
    this.logger.log('🔵 [BookstoreController] @CurrentUser() 返回:', JSON.stringify(user, null, 2));

    if (!user) {
      this.logger.error('❌ [BookstoreController] user 為 undefined，認證失敗');
      throw new Error('認證失敗，用戶信息為 undefined');
    }

    if (!user.userId) {
      this.logger.error('❌ [BookstoreController] user.userId 為 undefined，可能是 JWT decode 錯誤');
      this.logger.error('🔴 user 物件結構:', Object.keys(user));
      throw new Error('用戶 ID 無效');
    }

    this.logger.log('✅ [BookstoreController] 已取得 userId:', user.userId);

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    this.logger.log(`🔵 [BookstoreController] 查詢分頁: page=${pageNum}, limit=${limitNum}`);

    return this.bookstoreService.getUserEntitlements(user.userId, pageNum, limitNum);
  }

  @Get('admin/entitlements')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '【後台】查詢用戶的書籍列表',
    description: '管理員可透過此 API 查詢任意用戶擁有的書籍列表（權益列表）。需驗證 JWT Token 且 roleLevel >= 9',
  })
  @ApiQuery({
    name: 'userId',
    description: '用戶 ID（必填）- 必須為整數且大於 0',
    type: Number,
    example: 123,
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: '頁碼（可選，預設 1）',
    type: Number,
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: '每頁筆數（可選，預設 20，最多 100）',
    type: Number,
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '成功取得用戶的書籍列表',
    type: AdminEntitlementsResponseDto,
    example: {
      user: {
        id: 123,
        username: 'John Doe',
        email: 'john@example.com',
      },
      entitlements: [
        {
          book: {
            id: 1,
            title: '小鎮失蹤手冊',
            author: '夏佩爾&烏奴奴',
            coverImage: 'mainMenuImage-1709644166964.jpeg',
          },
          purchasedAt: '2026-02-20T10:30:00.000Z',
        },
        {
          book: {
            id: 2,
            title: '冒險故事',
            author: '張三',
            coverImage: 'cover-image-2.jpeg',
          },
          purchasedAt: '2026-02-15T14:20:00.000Z',
        },
      ],
      pagination: {
        total: 5,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'userId 驗證失敗 - 必須為整數且大於 0',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'userId 必須是有效的數字' },
            { type: 'string', example: 'userId 必須是整數' },
            { type: 'string', example: 'userId 必須大於 0' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '無管理員權限 - roleLevel < 9 或未認證',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '只有管理員可存取此資源' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '伺服器錯誤 - 資料庫連線失敗',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'object', example: { success: false, message: '資料庫連線失敗' } },
      },
    },
  })
  async getAdminEntitlements(
    @Query(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } }))
    query: AdminEntitlementsQueryDto,
    @CurrentUser() user: any,
  ): Promise<AdminEntitlementsResponseDto> {
    this.logger.log(`🔵 [BookstoreController] getAdminEntitlements() 被呼叫`);
    this.logger.log(`🔵 [BookstoreController] 管理員 ID: ${user?.userId}, 目標用戶 ID: ${query.userId}`);

    // 執行查詢
    const page = query.page || 1;
    const limit = query.limit || 20;

    this.logger.log(
      `🔵 [BookstoreController] 查詢用戶 ${query.userId} 的權益，分頁: page=${page}, limit=${limit}`,
    );

    return this.bookstoreService.getAdminEntitlements(query.userId, page, limit);
  }
}
