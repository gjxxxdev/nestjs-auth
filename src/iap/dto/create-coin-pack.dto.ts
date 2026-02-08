import { ApiProperty } from '@nestjs/swagger';

export class CreateCoinPackDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: ['GOOGLE', 'APPLE'] })
  platform: 'GOOGLE' | 'APPLE';
}
