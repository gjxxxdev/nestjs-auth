import { ApiProperty } from '@nestjs/swagger';

/**
 * EntitlementStoryDto
 * - 使用者已購買書籍的基本資訊
 */
export class EntitlementStoryDto {
  /** 故事 ID */
  @ApiProperty({ example: 1, description: '故事 ID' })
  id: number;

  /** 書籍名稱 */
  @ApiProperty({ example: '小鎮失蹤手冊', description: '書籍名稱' })
  main_menu_name: string;

  /** 作者名稱 */
  @ApiProperty({ example: '夏佩爾&烏奴奴', description: '作者名稱' })
  author: string;

  /** 封面圖片 */
  @ApiProperty({ example: 'mainMenuImage-1709644166964.jpeg', description: '封面圖片' })
  main_menu_image: string;
}

/**
 * EntitlementItemDto
 * - 對應單個 entitlements 權益記錄
 */
export class EntitlementItemDto {
  /** 故事 ID */
  @ApiProperty({ example: 1, description: '故事 ID' })
  storyListId: number;

  /** 購買日期 */
  @ApiProperty({ example: '2026-02-20T10:30:00.000Z', description: '購買日期' })
  createdAt: Date;

  /** 關聯的書籍資料 */
  @ApiProperty({ type: () => EntitlementStoryDto, description: '關聯的書籍資料' })
  story: EntitlementStoryDto;
}

/**
 * GetMyEntitlementsResponseDto
 * - 分頁包裝的已購買書籍列表
 */
export class GetMyEntitlementsResponseDto {
  /** 已購買書籍列表 */
  @ApiProperty({
    type: () => [EntitlementItemDto],
    description: '已購買書籍列表',
    isArray: true,
  })
  items: EntitlementItemDto[];

  /** 內容總筆數 */
  @ApiProperty({ example: 5, description: '內容總筆數' })
  total: number;

  /** 當前頁碼 */
  @ApiProperty({ example: 1, description: '當前頁碼' })
  page: number;

  /** 每頁筆數 */
  @ApiProperty({ example: 20, description: '每頁筆數' })
  limit: number;
}
