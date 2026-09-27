import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStateMachine } from './order-state-machine';

const orderDetail = {
  requestType: true,
  histories: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderDto) {
    const now = new Date();
    const year = Number(
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }).format(now),
    );

    return this.prisma.$transaction(async (tx) => {
      const requestType = await tx.requestType.findUnique({ where: { id: input.requestTypeId } });
      if (!requestType) throw new BadRequestException('Tipo de pedido inexistente');

      const [counter] = await tx.$queryRaw<Array<{ last_sequence: number }>>(Prisma.sql`
        INSERT INTO "protocol_counters" ("year", "last_sequence", "updated_at")
        VALUES (${year}, 1, NOW())
        ON CONFLICT ("year") DO UPDATE
          SET "last_sequence" = "protocol_counters"."last_sequence" + 1,
              "updated_at" = NOW()
        RETURNING "last_sequence"
      `);

      if (!counter) throw new Error('Não foi possível alocar o protocolo');
      if (counter.last_sequence > 999_999) {
        throw new ConflictException(`A sequência de protocolos de ${year} foi esgotada`);
      }
      const protocol = `${year}/${String(counter.last_sequence).padStart(6, '0')}`;

      return tx.serviceOrder.create({
        data: {
          protocol,
          protocolYear: year,
          sequence: counter.last_sequence,
          requestTypeId: input.requestTypeId,
          applicant: input.applicant.trim(),
          description: input.description.trim(),
          priority: input.priority,
        },
        include: orderDetail,
      });
    });
  }

  async findAll(query: ListOrdersDto) {
    const where: Prisma.ServiceOrderWhereInput = {
      deletedAt: null,
      status: query.status,
      requestTypeId: query.requestTypeId,
      ...(query.search?.trim()
        ? {
            OR: [
              { protocol: { contains: query.search.trim(), mode: 'insensitive' } },
              { applicant: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              {
                requestType: {
                  name: { contains: query.search.trim(), mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceOrder.findMany({
        where,
        include: { requestType: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id, deletedAt: null },
      include: orderDetail,
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async update(id: string, input: UpdateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<Array<{ status: OrderStatus }>>(Prisma.sql`
        SELECT "status" FROM "service_orders"
        WHERE "id" = ${id}::uuid AND "deleted_at" IS NULL
        FOR UPDATE
      `);
      if (!locked) throw new NotFoundException('Pedido não encontrado');
      if (locked.status === OrderStatus.COMPLETED || locked.status === OrderStatus.CANCELED) {
        throw new BadRequestException('Pedidos finalizados não podem ser alterados');
      }
      if (input.requestTypeId) {
        const exists = await tx.requestType.findUnique({ where: { id: input.requestTypeId } });
        if (!exists) throw new BadRequestException('Tipo de pedido inexistente');
      }

      return tx.serviceOrder.update({
        where: { id },
        data: {
          ...input,
          applicant: input.applicant?.trim(),
          description: input.description?.trim(),
        },
        include: orderDetail,
      });
    });
  }

  async transition(id: string, toStatus: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<Array<{ status: OrderStatus }>>(Prisma.sql`
        SELECT "status" FROM "service_orders"
        WHERE "id" = ${id}::uuid AND "deleted_at" IS NULL
        FOR UPDATE
      `);
      if (!locked) throw new NotFoundException('Pedido não encontrado');

      OrderStateMachine.assertTransition(locked.status, toStatus);
      await tx.orderTransition.create({
        data: { orderId: id, fromStatus: locked.status, toStatus },
      });
      return tx.serviceOrder.update({
        where: { id },
        data: { status: toStatus },
        include: orderDetail,
      });
    });
  }

  async remove(id: string) {
    await this.prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<Array<{ status: OrderStatus }>>(Prisma.sql`
        SELECT "status" FROM "service_orders"
        WHERE "id" = ${id}::uuid AND "deleted_at" IS NULL
        FOR UPDATE
      `);
      if (!locked) throw new NotFoundException('Pedido não encontrado');
      if (locked.status !== OrderStatus.PROTOCOLLED) {
        throw new BadRequestException('Somente pedidos ainda protocolados podem ser excluídos');
      }
      await tx.serviceOrder.update({ where: { id }, data: { deletedAt: new Date() } });
    });
  }
}

