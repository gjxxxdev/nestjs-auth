import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 根據使用者 ID 取得使用者個人資料
   * @param userId 使用者 ID
   * @returns 使用者資料，包含 id, email, name, provider, emailVerified, birthDate, gender, roleLevel, createdAt
   */
  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        provider: true, 
        emailVerified: true, 
        birthDate: true,
        gender: true,
        roleLevel: true,
        createdAt: true 
      },
    });
  }

  /**
   * 更新使用者個人資料
   * @param userId 使用者 ID
   * @param data 要更新的資料 (例如: name, birthDate, gender, roleLevel)
   * @returns 更新後的使用者資料
   */
  async updateProfile(userId: number, data: { 
    name?: string;
    birthDate?: string;
    gender?: number;
    roleLevel?: number;
  }) {
    // 轉換駝峰命名為 snake_case
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.roleLevel !== undefined) updateData.role_level = data.roleLevel;
    if (data.birthDate) updateData.birth_date = new Date(data.birthDate);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * 根據 Email 查找使用者
   * @param email 使用者 Email
   * @returns 使用者資料
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * 建立新使用者
   * @param data 使用者資料，包含 email, password, name, provider, birthDate, gender, roleLevel
   * @returns 新建立的使用者資料
   */
  async create(data: { 
    email: string; 
    password: string; 
    name?: string; 
    provider?: string;
    birthDate?: Date;
    gender?: number;
    roleLevel?: number;
  }) {
    // 轉換駝峰命名為 snake_case
    const createData: any = {
      email: data.email,
      password: data.password,
    };
    if (data.name) createData.name = data.name;
    if (data.provider) createData.provider = data.provider;
    if (data.birthDate) createData.birth_date = data.birthDate;
    if (data.gender !== undefined) createData.gender = data.gender;
    if (data.roleLevel !== undefined) createData.role_level = data.roleLevel;
    
    return this.prisma.user.create({ data: createData });
  }

  /**
   * 根據 ID 查找使用者
   * @param id 使用者 ID
   * @returns 使用者資料
   */
  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * 標記使用者 Email 為已驗證
   * @param userId 使用者 ID
   * @returns 更新後的使用者資料
   */
  async markEmailVerified(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  /**
   * 更新使用者密碼
   * @param userId 使用者 ID
   * @param newPassword 新密碼 (已雜湊)
   * @returns 更新後的使用者資料
   */
  async updatePassword(userId: number, newPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  }

  /**
   * 建立社交登入使用者
   * Create a social login user
   * @param data 社交使用者資料，包含 email, provider, providerId, name (可選)
   * Social user data, including email, provider, providerId, name (optional)
   * @returns 新建立的使用者資料
   * Newly created user data
   */
  async createSocialUser(data: { email: string; provider: string; providerId: string; name?: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: '', // 社交登入使用者通常不需要密碼
        // Social login users usually don't need a password
        provider: data.provider,
        providerId: data.providerId,
        name: data.name,
        emailVerified: true, // 社交登入通常視為已驗證
        // Social logins are usually considered verified
      },
    });
  }
}
