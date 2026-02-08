import { ApiProperty } from '@nestjs/swagger';

/**
 * Bookstore 專用錯誤回應 DTO
 * - 回傳格式範例：
 *   未授權 (401)
 *   { "success": false, "message": "未授權" }
 *
 *   權限不足 (403)
 *   { "success": false, "message": "權限不足(403)" }
 *
 *   伺服器錯誤 (500)
 *   { "success": false, "message": "伺服器錯誤（500），例如 DB 連線失敗" }
 */
export class ErrorResponseDto {
  /** 表示操作是否成功（錯誤回應為 false） */
  @ApiProperty({ example: false, description: '操作是否成功（此 DTO 永遠為 false）' })
  success: boolean;

  /** 錯誤訊息文字 */
  @ApiProperty({ example: '未授權', description: '錯誤訊息說明' })
  message: string;
}
