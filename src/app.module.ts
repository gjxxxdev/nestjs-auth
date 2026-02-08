import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { IapModule } from './iap/iap.module';
import { BookstoreModule } from './bookstore/bookstore.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    BookstoreModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule,
    UsersModule,
    IapModule,
    OrdersModule
  ],
  providers: [PrismaService],
})
export class AppModule {}