import { ApiProperty } from '@nestjs/swagger';
import { CoinPackDto } from './coin-pack.dto';

/**
 * @description 獲取金幣包列表的回應 DTO
 */
export class GetCoinPacksResponseDto {
  /**
   * @description 請求是否成功
   * @example true
   */
  @ApiProperty({ description: '請求是否成功', example: true })
  success: boolean;

  /**
   * @description 金幣包列表
   */
  @ApiProperty({ type: [CoinPackDto], description: '金幣包列表' })
  data: CoinPackDto[];
}
