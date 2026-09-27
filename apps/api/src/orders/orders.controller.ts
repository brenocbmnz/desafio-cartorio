import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { TransitionOrderDto } from './dto/transition-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Protocolar um pedido' })
  create(@Body() input: CreateOrderDto) {
    return this.ordersService.create(input);
  }

  @Get()
  @ApiOperation({ summary: 'Listar e filtrar pedidos' })
  findAll(@Query() query: ListOrdersDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar pedido e histórico' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar os dados de um pedido ativo' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateOrderDto) {
    return this.ordersService.update(id, input);
  }

  @Post(':id/transitions')
  @ApiOperation({ summary: 'Movimentar um pedido' })
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() input: TransitionOrderDto) {
    return this.ordersService.transition(id, input.status);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Excluir logicamente um pedido ainda protocolado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}

