import { Controller, Get, Query } from '@nestjs/common';
import { CoinPacksService } from './coin-packs.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCoinPacksRequestDto } from './dto/get-coin-packs-request.dto';
import { GetCoinPacksResponseDto } from './dto/get-coin-packs-response.dto'; // 導入新的回應 DTO

@ApiTags('IAP - Coin Packs')
@Controller('coin-packs')
export class CoinPacksController {
  constructor(private readonly coinPacksService: CoinPacksService) {}

  @Get()
  @ApiOperation({ summary: '取得金幣商品清單' })
  @ApiResponse({
    status: 200,
    description: '成功取得金幣商品清單',
    type: GetCoinPacksResponseDto,
    schema: {
      example: {
        success: true,
        data: [
          { id: 1, name: '100 Coins', price: 1.99, platform: 'GOOGLE' },
          { id: 2, name: '500 Coins', price: 8.99, platform: 'GOOGLE' },
          { id: 3, name: '1000 Coins', price: 16.99, platform: 'APPLE' },
        ],
      },
    },
  })
  findAll(@Query() query: GetCoinPacksRequestDto): GetCoinPacksResponseDto {
    const coinPacks = this.coinPacksService.findAll(query.platform);
    return { success: true, data: coinPacks };
  }
}
