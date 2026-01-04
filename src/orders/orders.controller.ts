import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CoinPurchaseDto } from './dto/coin-purchase.dto';


@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('coin-purchase')
  @ApiOperation({ summary: '使用金幣購買書籍' })
  async coinPurchase(
    @Req() req,
    @Body() dto: CoinPurchaseDto,
  ) {
    return this.ordersService.coinPurchase(
      req.user.userId,
      dto.storyListId,
      dto.idempotencyKey,
    );
  }
}
