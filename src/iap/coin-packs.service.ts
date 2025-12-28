import { Injectable } from '@nestjs/common';

@Injectable()
export class CoinPacksService {
  // 模擬 DB，目前先回傳靜態資料
    private coinPacks: { id: number; name: string; price: number; platform: 'GOOGLE' | 'APPLE' }[] = [
        { id: 1, name: 'item_001', price: 1.99, platform: 'GOOGLE' },
        { id: 2, name: 'item_002', price: 8.99, platform: 'GOOGLE' },
        { id: 3, name: 'item_003', price: 16.99, platform: 'APPLE' },
    ];

    findAll(platform?: 'GOOGLE' | 'APPLE') {
        if (platform) {
        return this.coinPacks.filter((p) => p.platform === platform);
        }
        return this.coinPacks;
    }
}
