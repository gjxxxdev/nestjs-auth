import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class VerifyIapDto {
  @IsEnum(['GOOGLE', 'APPLE'])
  platform: 'GOOGLE' | 'APPLE';

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  receipt: string; // Google: purchaseToken, Apple: receipt data (base64 or JSON)
}
