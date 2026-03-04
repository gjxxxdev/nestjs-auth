import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ClaimRewardRequestDto {
  @ApiProperty({
    description: '活動名稱',
    example: 'PROFILE_COMPLETED',
    enum: ['PROFILE_COMPLETED'],
  })
  @IsEnum(['PROFILE_COMPLETED'])
  @IsNotEmpty()
  activityName: string;
}
