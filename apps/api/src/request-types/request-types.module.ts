import { Module } from '@nestjs/common';
import { RequestTypesController } from './request-types.controller';

@Module({ controllers: [RequestTypesController] })
export class RequestTypesModule {}

