import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('request-types')
@Controller('request-types')
export class RequestTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de pedido disponíveis' })
  findAll() {
    return this.prisma.requestType.findMany({ orderBy: { name: 'asc' } });
  }
}

