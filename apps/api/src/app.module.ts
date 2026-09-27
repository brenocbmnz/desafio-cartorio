import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { RequestTypesModule } from './request-types/request-types.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, OrdersModule, RequestTypesModule],
  controllers: [AppController],
})
export class AppModule {}

