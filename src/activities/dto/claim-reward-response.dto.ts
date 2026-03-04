import { ApiProperty } from '@nestjs/swagger';

export class ClaimRewardResponseDto {
  @ApiProperty({ example: true, description: '是否成功' })
  success: boolean;

  @ApiProperty({ example: '獎勵領取成功' })
  message: string;

  @ApiProperty({ example: 50, description: '本次領取的金幣數' })
  rewardAmount: number;

  @ApiProperty({ example: 150, description: '領取後的新餘額' })
  newBalance: number;
}
