import { Module } from '@nestjs/common';
import { CoinPacksController } from './coin-packs.controller';
import { CoinPacksService } from './coin-packs.service';
import { IapController } from './iap.controller'; // 導入 IapController
import { IapService } from './iap.service'; // 導入 IapService

@Module({
    controllers: [CoinPacksController, IapController], // 將 IapController 添加到 controllers 陣列
    providers: [CoinPacksService, IapService], // 將 IapService 添加到 providers 陣列
})
export class IapModule {}
