//（使用者資訊查詢 / 更新）

import { Controller, Get, Patch, Delete, Body, Request, UseGuards, HttpCode, HttpStatus, Query, ForbiddenException, BadRequestException, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';
import { DeleteAccountResponseDto } from './dto/delete-account-response.dto';
import { GetAllUsersResponseDto } from './dto/get-all-users-response.dto';


@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  @ApiOperation({ 
    summary: '查詢所有使用者',
    description: '僅限管理員（roleLevel >= 9）查詢。返回所有使用者的會員序號、帳號、出生年月、性別、註冊方式、建立時間和更新時間。支援分頁查詢。' 
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1, description: '頁碼（預設 1，必須 > 0）' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 10, description: '每頁數量（預設 10，必須 > 0）' })
  @ApiResponse({ 
    status: 200, 
    description: '成功取得所有使用者列表',
    type: GetAllUsersResponseDto,
    example: {
      success: true,
      total: 25,
      page: 1,
      limit: 10,
      data: [
        {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          birthDate: '1990-05-15T00:00:00.000Z',
          gender: 1,
          provider: 'email',
          createdAt: '2025-08-15T15:05:10.000Z',
          updatedAt: '2025-12-20T08:30:45.000Z',
        },
        {
          id: 2,
          email: 'user@example.com',
          name: 'Regular User',
          birthDate: '1995-03-20T00:00:00.000Z',
          gender: 2,
          provider: 'google',
          createdAt: '2025-09-10T12:00:00.000Z',
          updatedAt: '2025-12-15T10:15:30.000Z',
        },
      ],
    }
  })
  @ApiResponse({ status: 403, description: '只有管理員才能執行此操作' })
  @ApiResponse({ status: 400, description: '分頁參數無效' })
  async getAllUsers(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<GetAllUsersResponseDto> {
    // 參數驗證
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(pageNum) || pageNum <= 0) {
      throw new BadRequestException('頁碼必須是大於 0 的數字');
    }

    if (isNaN(limitNum) || limitNum <= 0) {
      throw new BadRequestException('每頁數量必須是大於 0 的數字');
    }

    return this.usersService.getAllUsers(pageNum, limitNum);
  }

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
  @ApiResponse({ status: 200, description: '成功更新個人資料' })
  @ApiResponse({ status: 403, description: '普通使用者不可修改 role_level' })
  updateMe(@Request() req, @Body() body: UpdateUserDto) {
    const roleLevel = req.user.roleLevel || 1;
    return this.usersService.updateProfileWithPermissionCheck(req.user.userId, roleLevel, body);  
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':targetId')
  @ApiOperation({ summary: '管理員修改指定使用者的個人資料與權限級別' })
  @ApiResponse({ status: 200, description: '成功更新使用者資料' })
  @ApiResponse({ status: 403, description: '只有管理員才能執行此操作' })
  @ApiResponse({ status: 404, description: '使用者不存在' })
  updateUserAsAdmin(@Request() req, @Param('targetId') targetId: string, @Body() body: UpdateUserDto) {
    const adminRoleLevel = req.user.roleLevel || 1;
    const userId = parseInt(targetId, 10);
    
    if (isNaN(userId)) {
      throw new BadRequestException('無效的使用者 ID 格式');
    }

    return this.usersService.updateProfileWithPermissionCheck(userId, adminRoleLevel, body);
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
