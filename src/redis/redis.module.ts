import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
    providers: [
        {
        provide: Redis,
        useFactory: (config: ConfigService) => {
            return new Redis({
            host: config.get('REDIS_HOST'),
            port: config.get('REDIS_PORT'),
            });
        },
        inject: [ConfigService],
        },
    ],
    exports: [Redis],
})
export class RedisModule {}