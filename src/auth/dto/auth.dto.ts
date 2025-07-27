import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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
