import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Body,
  Param,
  HttpCode,
  UseGuards,
  HttpException,
  ParseIntPipe,
} from '@nestjs/common';
import { CoinPacksService } from './coin-packs.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetCoinPacksRequestDto } from './dto/get-coin-packs-request.dto';
import { GetCoinPacksResponseDto } from './dto/get-coin-packs-response.dto';
import { CreateCoinPackRequestDto } from './dto/create-coin-pack-request.dto';
import { CreateCoinPackResponseDto } from './dto/create-coin-pack-response.dto';
import { UpdateCoinPackAdminRequestDto } from './dto/update-coin-pack-admin-request.dto';
import { UpdateCoinPackAdminResponseDto } from './dto/update-coin-pack-admin-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('IAP - Coin Packs')
@Controller('coin-packs')
export class CoinPacksController {
  constructor(private readonly coinPacksService: CoinPacksService) {}

  @Get()
  @ApiOperation({ 
    summary: '取得金幣商品清單', 
    description: '取得目前資料庫中「上架中」且依序排列的金幣商品。' 
  })
  @ApiResponse({
    status: 200,
    description: '成功取得金幣商品清單',
    type: GetCoinPacksResponseDto,
  })
  async findAll(@Query() query: GetCoinPacksRequestDto): Promise<GetCoinPacksResponseDto> {
    // 🟢 修正 1：加上 await 等待資料庫查詢完成
    // 如果不加 await，這裡拿到的 rawPacks 就會是 Promise，導致後面報錯
    const rawPacks = await this.coinPacksService.findAll(query.platform);
    
    // 2. 資料轉換 (Mapping)
    const formattedPacks = rawPacks.map(pack => ({
      id: pack.id,
      
      // 🟢 修正 2：加上型別斷言 (Type Assertion)
      // 資料庫回傳的是 string，但 DTO 嚴格要求 'GOOGLE' | 'APPLE'
      platform: pack.platform as 'GOOGLE' | 'APPLE',
      
      productId: pack.productId,
      name: pack.name,
      amount: pack.amount,
      bonusAmount: pack.bonusAmount,
      
      // 🟢 修正 3：將 Decimal 轉為 JavaScript Number
      // 這是因為 DTO 定義 price 為 number，但 Prisma 回傳 Decimal 物件
      price: Number(pack.price),
      
      currency: pack.currency,
      isActive: pack.isActive,
      sortOrder: pack.sortOrder,
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt,
    }));

    // 3. 回傳轉換後的陣列
    return { 
      success: true, 
      data: formattedPacks 
    };
  }

  /**
   * 建立金幣儲值包 (Admin Only)
   * @description 僅限管理員使用，用於建立新的金幣儲值包商品
   * @requires JWT Token + Admin 權限 (roleLevel >= 9)
   */
  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '建立金幣儲值包 (管理員專用)',
    description: '建立新的金幣儲值包商品。需要 JWT Token 且用戶 roleLevel >= 9 (Admin)。',
  })
  @ApiCreatedResponse({
    description: '成功建立金幣儲值包',
    type: CreateCoinPackResponseDto,
  })
  @ApiBadRequestResponse({
    description: '參數驗證失敗或重複的 platform + productId 組合',
    schema: {
      example: {
        statusCode: 400,
        message: 'validation failed: ...',
        error: 'Bad Request',
      },
    },
  })
  @ApiForbiddenResponse({
    description: '權限不足 (需要 Admin 權限)',
    schema: {
      example: {
        message: '只有管理員可存取此資源',
        error: 'Forbidden',
        statusCode: 403,
      },
    },
  })
  async create(
    @Body() createCoinPackDto: CreateCoinPackRequestDto,
    @CurrentUser() user: any,
  ): Promise<CreateCoinPackResponseDto> {
    try {
      // 權限檢查：AdminGuard 已確保 user.roleLevel >= 9
      // (此檢查邏輯由 AdminGuard 執行，這裡作為註釋說明)
      // if (!user || user.roleLevel < 9) {
      //   throw new ForbiddenException('只有管理員可存取此資源');
      // }

      // 調用 Service 建立金幣儲值包
      const coinPack = await this.coinPacksService.create(createCoinPackDto);

      // 資料轉換 (Decimal → Number)
      const response: CreateCoinPackResponseDto = {
        success: true,
        message: 'Created successfully',
        data: {
          id: coinPack.id,
          platform: coinPack.platform as 'GOOGLE' | 'APPLE',
          productId: coinPack.productId,
          name: coinPack.name,
          amount: coinPack.amount,
          bonusAmount: coinPack.bonusAmount,
          price: Number(coinPack.price),
          currency: coinPack.currency,
          isActive: coinPack.isActive,
          sortOrder: coinPack.sortOrder,
          createdAt: coinPack.createdAt,
          updatedAt: coinPack.updatedAt,
        },
      };

      return response;
    } catch (error) {
      // HttpException 已由 Service 層或 Guard 拋出，直接拋出
      if (error instanceof HttpException) {
        throw error;
      }

      // 其他未預期的錯誤
      throw new HttpException('建立金幣儲值包失敗', 500);
    }
  }

  /**
   * 更新金幣儲值包 (Admin Only) - 用於上下架管理
   * @description 管理員可透過此端點更新金幣商品的 platform、product_id、name 和 is_active（上下架狀態）
   * @requires JWT Token + Admin 權限 (roleLevel >= 9)
   */
  @Patch(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: '金幣儲值包 ID',
    example: 1,
  })
  @ApiOperation({
    summary: '更新金幣儲值包 (管理員專用)',
    description: '更新既有的金幣儲值包商品，支援更改 platform、product_id、name 和上下架狀態 (is_active)。需要 JWT Token 且用戶 roleLevel >= 9 (Admin)。',
  })
  @ApiOkResponse({
    description: '成功更新金幣儲值包',
    type: UpdateCoinPackAdminResponseDto,
  })
  @ApiBadRequestResponse({
    description: '參數驗證失敗或重複的 platform + productId 組合',
    schema: {
      example: {
        statusCode: 400,
        message: '此 platform 與 productId 的組合已存在',
        error: 'Bad Request',
      },
    },
  })
  @ApiForbiddenResponse({
    description: '權限不足 (需要 Admin 權限，roleLevel >= 9)',
    schema: {
      example: {
        message: '只有管理員可存取此資源',
        error: 'Forbidden',
        statusCode: 403,
      },
    },
  })
  @ApiNotFoundResponse({
    description: '指定 ID 的金幣儲值包不存在',
    schema: {
      example: {
        statusCode: 404,
        message: '金幣儲值包不存在 (ID: 999)',
        error: 'Not Found',
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoinPackAdminDto: UpdateCoinPackAdminRequestDto,
    @CurrentUser() user: any,
  ): Promise<UpdateCoinPackAdminResponseDto> {
    try {
      // 權限檢查：AdminGuard 已確保 user.roleLevel >= 9
      // 此檢查邏輯由 AdminGuard 執行，以下作為註釋說明
      // if (!user || user.roleLevel < 9) {
      //   throw new ForbiddenException('只有管理員可存取此資源');
      // }

      // 調用 Service 更新金幣儲值包
      const coinPack = await this.coinPacksService.updateCoinPackAdmin(
        id,
        updateCoinPackAdminDto,
      );

      // 資料轉換 (Decimal → Number)
      const response: UpdateCoinPackAdminResponseDto = {
        success: true,
        message: 'Updated successfully',
        data: {
          id: coinPack.id,
          platform: coinPack.platform as 'GOOGLE' | 'APPLE',
          productId: coinPack.productId,
          name: coinPack.name,
          amount: coinPack.amount,
          bonusAmount: coinPack.bonusAmount,
          price: Number(coinPack.price),
          currency: coinPack.currency,
          isActive: coinPack.isActive,
          sortOrder: coinPack.sortOrder,
          createdAt: coinPack.createdAt,
          updatedAt: coinPack.updatedAt,
        },
      };

      return response;
    } catch (error) {
      // HttpException 已由 Service 層或 Guard 拋出，直接拋出
      if (error instanceof HttpException) {
        throw error;
      }

      // 其他未預期的錯誤
      throw new HttpException('更新金幣儲值包失敗', 500);
    }
  }
}