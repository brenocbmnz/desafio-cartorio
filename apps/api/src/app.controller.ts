import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Verificar disponibilidade da API' })
  health() {
    return {
      name: 'API do Cartório',
      status: 'ok',
      documentation: '/api/docs',
    };
  }
}
