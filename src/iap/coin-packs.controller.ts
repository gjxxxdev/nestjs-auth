import { Controller, Get, Query } from '@nestjs/common';
import { CoinPacksService } from './coin-packs.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCoinPacksRequestDto } from './dto/get-coin-packs-request.dto';
import { GetCoinPacksResponseDto } from './dto/get-coin-packs-response.dto';

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
}