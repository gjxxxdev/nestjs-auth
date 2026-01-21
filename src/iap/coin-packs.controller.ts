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
    // 1. 從 Service 取得原始資料 (Prisma 模型)
    const rawPacks = await this.coinPacksService.findAll(query.platform);
    
    // 2. 資料轉換 (Mapping)
    // 將 Prisma 的資料結構轉換為前端需要的 DTO 結構
    const formattedPacks = rawPacks.map(pack => ({
      id: pack.id,
      platform: pack.platform,
      productId: pack.productId,     // 對應 DTO 新增欄位
      name: pack.name,
      amount: pack.amount,           // 對應 DTO 新增欄位
      bonusAmount: pack.bonusAmount, // 對應 DTO 新增欄位
      price: Number(pack.price),     // 🟢 關鍵：將 Decimal 轉為 number
      currency: pack.currency,       // 對應 DTO 新增欄位
      isActive: pack.isActive,       // 對應 DTO 新增欄位
      sortOrder: pack.sortOrder,     // 對應 DTO 新增欄位
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt,
    }));

    return { 
      success: true, 
      data: formattedPacks 
    };
  }
}