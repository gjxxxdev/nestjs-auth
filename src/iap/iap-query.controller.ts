import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IapQueryService } from './iap-query.service';
import { MyIapReceiptDto } from './dto/my-iap-receipt.dto';
import { MyIapReceiptsResponseDto } from './dto/my-iap-receipts-response.dto';

@ApiTags('IAP / Coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class IapQueryController {
  constructor(private readonly iapQueryService: IapQueryService) {}

  @Get('me/iap-receipts')
  @ApiOperation({ summary: '查詢我的 IAP 儲值紀錄' })
  @ApiResponse({
    status: 200,
    description: '成功獲取 IAP 儲值紀錄',
    type: MyIapReceiptsResponseDto,
  })
  getMyIapReceipts(@Req() req): Promise<MyIapReceiptsResponseDto> {
    return this.iapQueryService.getMyIapReceipts(req.user.userId);
  }

  @Get('me/coins/balance')
  @ApiOperation({ summary: '查詢我的金幣餘額' })
  getMyCoinBalance(@Req() req) {
    return this.iapQueryService.getMyCoinBalance(req.user.userId);
  }

  @Get('me/coins/ledger')
  @ApiOperation({ summary: '查詢我的金幣流水' })
  getMyCoinLedger(@Req() req) {
    return this.iapQueryService.getMyCoinLedger(req.user.userId);
  }
}
