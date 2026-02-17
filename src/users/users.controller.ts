//（使用者資訊查詢 / 更新）

import { Controller, Get, Patch, Delete, Body, Request, UseGuards, HttpCode, HttpStatus, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';
import { DeleteAccountResponseDto } from './dto/delete-account-response.dto';


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

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '清除帳號', 
    description: '普通使用者可刪除自己的帳號。管理員可透過 Query 參數 targetId 刪除指定帳號。此操作會硬刪除帳號及其所有交易紀錄、金幣流水、IAP 收據。此操作不可逆，請謹慎使用。' 
  })
  @ApiQuery({ name: 'targetId', required: false, type: 'string', description: '要刪除的目標帳號 ID（僅限管理員使用）' })
  @ApiResponse({ status: 200, description: '帳號已成功刪除', type: DeleteAccountResponseDto })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '您沒有權限執行此操作' })
  @ApiResponse({ status: 400, description: '請求參數無效' })
  async deleteMyAccount(
    @Request() req,
    @Query('targetId') targetId?: string,
  ): Promise<DeleteAccountResponseDto> {
    const userId = req.user.userId;
    const roleLevel = req.user.roleLevel || 1;
    const isAdmin = roleLevel >= 9;

    let accountToDelete = userId;

    // 如果指定了 targetId，檢查管理員權限
    if (targetId) {
      if (!isAdmin) {
        throw new ForbiddenException('只有管理員可以刪除其他帳號');
      }
      accountToDelete = parseInt(targetId, 10);
      if (isNaN(accountToDelete)) {
        throw new BadRequestException('無效的 targetId 格式');
      }
    }

    await this.usersService.hardDeleteUser(accountToDelete, userId, isAdmin);

    const deletedName = accountToDelete === userId ? '您的帳號' : `帳號 (ID: ${accountToDelete})`;
    const operatorInfo = accountToDelete === userId ? '' : ` [操作者 ID: ${userId}]`;

    return {
      success: true,
      message: `${deletedName}及其關聯資料已徹底從系統移除。${operatorInfo}`,
      deletedUserId: accountToDelete,
    };
  }
}
