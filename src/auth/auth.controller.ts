// （含 refresh / logout / 第三方登入 / Email 驗證 / 忘記密碼）
// （含 refresh / logout / 第三方登入 / Email 驗證 / 忘記密碼）
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiUnauthorizedResponse, ApiResponse, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { LoginResponseDto } from './dto/login-response.dto'; // 引入新的登入回應 DTO
import { MessageResponseDto } from '../common/dto/message-response.dto'; // 引入 MessageResponseDto
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto'; // 引入 ForgotPasswordResponseDto
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto'; // 引入 ResetPasswordResponseDto
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto'; // 引入 ForgotPasswordRequestDto
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto'; // 引入 ResetPasswordRequestDto

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiUnauthorizedResponse({ description: 'Email 已註冊' })
  @ApiOperation({ summary: '使用 email 註冊帳號' })
  // 註冊成功回應，狀態碼 201 表示資源已建立，並提供 MessageResponseDto 作為回應範例
  @ApiResponse({ status: 201, description: '註冊成功，請查收驗證信件', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Email 已註冊' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
  
  @ApiUnauthorizedResponse({ description: '帳號或密碼錯誤，或尚未驗證' })
  @ApiOperation({ summary: '使用 email 登入' })
  @ApiResponse({ status: 200, description: '登入成功，回傳 accessToken', type: LoginResponseDto }) // 為登入成功回應提供範例值
  @ApiResponse({ status: 401, description: '帳號或密碼錯誤，或尚未驗證' })
  @ApiBody({ type: LoginDto }) // 為登入請求體提供範例值
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
  
  @ApiOperation({ summary: 'Google 登入，接收 id_token' })
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      idToken: { type: 'string', example: 'ya29.a0ARrdaM...' },
    },
  }})
  @Post('google-login')
  async googleLogin(@Body('idToken') idToken: string) {
    return this.authService.googleLogin(idToken);
  }
  
  @ApiOperation({ summary: 'Facebook 登入，接收 accessToken' })
  @Post('facebook-login')
  async facebookLogin(@Body('accessToken') accessToken: string) {
    return this.authService.facebookLogin(accessToken);
  }
  
  @ApiOperation({ summary: 'Apple 登入，接收 id_token' })
  @Post('apple-login')
  async appleLogin(@Body('idToken') idToken: string) {
    return this.authService.appleLogin(idToken);
  }

  @ApiOperation({ summary: 'WeChat 登入，接收授權 code' })
  @Post('wechat-login')
  async wechatLogin(@Body('code') code: string) {
    return this.authService.wechatLogin(code);
  }

  @ApiUnauthorizedResponse({ description: 'refresh token 無效或信箱未驗證' })
  @ApiOperation({ summary: '使用 refresh token 取得新的 access token' })
  @ApiOkResponse({ description: '成功取得新 accessToken', type: TokenResponseDto })
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
  
  @ApiOperation({ summary: '使用者登出並將 refresh token 加入黑名單' })
  @ApiOkResponse({ description: '範例成功回應', type: MessageResponseDto })
  @ApiOkResponse({ description: '登出成功，Refresh token 已加入黑名單' })
  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @ApiUnauthorizedResponse({ description: '驗證連結已過期或無效' })
  @ApiUnauthorizedResponse({ description: '錯誤範例', schema: { example: { statusCode: 401, message: '驗證連結已過期或無效', error: 'Unauthorized' } } })
  @ApiOperation({ summary: '驗證使用者 email' })
  @ApiOkResponse({ description: '信箱驗證成功' })
  @ApiOkResponse({ description: '範例成功回應', type: MessageResponseDto })
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiUnauthorizedResponse({ description: '找不到該 email 使用者' })
  @ApiUnauthorizedResponse({ description: '錯誤範例', schema: { example: { statusCode: 401, message: '帳號不存在', error: 'Unauthorized' } } })
  @ApiOperation({ summary: '發送忘記密碼信件' })
  // 發送忘記密碼信件成功回應，狀態碼 200，並提供 ForgotPasswordResponseDto 作為回應範例
  @ApiOkResponse({ description: '重設密碼信件已發送', type: ForgotPasswordResponseDto })
  // 為發送忘記密碼信件請求體提供範例值
  @ApiBody({ type: ForgotPasswordRequestDto })
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @ApiUnauthorizedResponse({ description: 'reset token 無效或過期' })
  @ApiUnauthorizedResponse({ description: '錯誤範例', schema: { example: { statusCode: 401, message: '重設連結已過期或無效', error: 'Unauthorized' } } })
  @ApiOperation({ summary: '重設密碼（需帶 reset token）' })
  // 重設密碼成功回應，狀態碼 200，並提供 ResetPasswordResponseDto 作為回應範例
  @ApiOkResponse({ description: '密碼重設成功', type: ResetPasswordResponseDto })
  // 為重設密碼請求體提供範例值
  @ApiBody({ type: ResetPasswordRequestDto })
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
