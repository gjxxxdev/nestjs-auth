//（使用者資訊查詢 / 更新）

import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';


@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: '取得使用者自己的個人資料' })
  @ApiResponse({ status: 200, description: '成功取得使用者個人資料', type: GetUserProfileResponseDto })
  getMe(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: '更新使用者自己的個人資料' })
  updateMe(@Request() req, @Body() body: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.userId, body);  
  }
}
