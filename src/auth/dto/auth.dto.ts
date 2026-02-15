import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'test@example.com', description: '使用者 Email' })
  @IsEmail({}, { message: 'Email 格式不正確' })
  @IsNotEmpty({ message: 'Email 不可為空' })
  email: string;

  @ApiProperty({ example: 'password123', description: '使用者密碼' })
  @IsString({ message: '密碼必須是字串' })
  @MinLength(6, { message: '密碼長度不可少於 6 個字元' })
  @IsNotEmpty({ message: '密碼不可為空' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: '使用者名稱', required: false })
  @IsOptional()
  @IsString({ message: '名稱必須是字串' })
  name?: string;

  @ApiProperty({ example: '2010-01-01', description: '出生年月', required: false })
  @IsOptional()
  @IsDateString({}, { message: '出生年月格式不正確，應為 ISO 8601 日期格式' })
  birthDate?: string;

  @ApiProperty({ example: 0, description: '性別 (1:男, 2:女, 0:未指定)', required: false })
  @IsOptional()
  @IsNumber({}, { message: '性別必須是數字' })
  @Min(0, { message: '性別應在 0-2 之間' })
  @Max(2, { message: '性別應在 0-2 之間' })
  gender?: number;

  @ApiProperty({ example: 1, description: '權限級別 (1:普通, 5:小編, 9:Admin)', required: false })
  @IsOptional()
  @IsNumber({}, { message: '權限級別必須是數字' })
  roleLevel?: number;
}

export class LoginDto {
  @ApiProperty({ example: 'test@example.com', description: '使用者 Email' })
  @IsEmail({}, { message: 'Email 格式不正確' })
  @IsNotEmpty({ message: 'Email 不可為空' })
  email: string;

  @ApiProperty({ example: 'password123', description: '使用者密碼' })
  @IsString({ message: '密碼必須是字串' })
  @IsNotEmpty({ message: '密碼不可為空' })
  password: string;
}
