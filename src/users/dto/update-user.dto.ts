import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '使用者名稱' })
  @IsOptional()
  @IsString({ message: '名稱必須是字串' })
  name?: string;

  @ApiPropertyOptional({ example: '2010-01-01', description: '出生年月' })
  @IsOptional()
  @IsDateString({}, { message: '出生年月格式不正確，應為 ISO 8601 日期格式' })
  birth_date?: string;

  @ApiPropertyOptional({ example: 0, description: '性別 (1:男, 2:女, 0:未指定)' })
  @IsOptional()
  @IsNumber({}, { message: '性別必須是數字' })
  @Min(0, { message: '性別應在 0-2 之間' })
  @Max(2, { message: '性別應在 0-2 之間' })
  gender?: number;

  @ApiPropertyOptional({ example: 1, description: '權限級別 (1:普通, 5:小編, 9:Admin)' })
  @IsOptional()
  @IsNumber({}, { message: '權限級別必須是數字' })
  role_level?: number;
}

// src/auth/dto/auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  password: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  password: string;
}