import { ApiProperty } from '@nestjs/swagger';
import { MyIapReceiptDto } from './my-iap-receipt.dto';

// 我的 IAP 儲值紀錄列表響應 DTO
export class MyIapReceiptsResponseDto {
  // IAP 儲值紀錄列表
  @ApiProperty({
    description: 'IAP 儲值紀錄列表',
    type: [MyIapReceiptDto],
  })
  items: MyIapReceiptDto[];
}
