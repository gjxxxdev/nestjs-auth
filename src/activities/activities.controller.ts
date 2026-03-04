import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { ClaimRewardRequestDto } from './dto/claim-reward-request.dto';
import { ClaimRewardResponseDto } from './dto/claim-reward-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post('claim-reward')
  @UseGuards(JwtAuthGuard) // ✅ 強制登入驗證
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '領取活動獎勵',
    description: `
      使用者領取活動獎勵（如完善個人資料送金幣）。
      每個活動只能領取一次，重複領取會返回錯誤。
      
      - 請求需要帶上有效的 JWT Token
      - activityName 傳入指定的活動名稱
    `,
  })
  @ApiResponse({
    status: 200,
    type: ClaimRewardResponseDto,
    description: '領取成功',
  })
  @ApiResponse({
    status: 400,
    description:
      '參數格式錯誤或已領取過此活動、無效的活動名稱',
  })
  @ApiResponse({ status: 401, description: '憑證無效或未登入' })
  async claimReward(
    @Body() body: ClaimRewardRequestDto,
    @CurrentUser() user,
  ): Promise<ClaimRewardResponseDto> {
    const userId = user?.userId;

    this.logger.log(
      `[ClaimReward] User: ${userId}, Activity: ${body.activityName}`,
    );

    // 呼叫 Service 執行邏輯
    return this.activitiesService.claimActivityReward(
      userId,
      body.activityName,
    );
  }
}
