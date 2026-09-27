import { OrderPriority, OrderStatus, PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';

describe('OrdersService integration', () => {
  const prisma = new PrismaClient();
  const service = new OrdersService(prisma as PrismaService);
  let requestTypeId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const type = await prisma.requestType.upsert({
      where: { slug: 'tipo-teste-integracao' },
      update: {},
      create: { name: 'Tipo teste integração', slug: 'tipo-teste-integracao' },
    });
    requestTypeId = type.id;
  });

  afterAll(async () => {
    await prisma.serviceOrder.deleteMany({ where: { requestTypeId } });
    await prisma.requestType.delete({ where: { id: requestTypeId } });
    await prisma.$disconnect();
  });

  it('allocates unique contiguous protocols under concurrent creation', async () => {
    const created = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        service.create({
          requestTypeId,
          applicant: `Solicitante ${index}`,
          description: 'Pedido usado para validar concorrência.',
          priority: OrderPriority.NORMAL,
        }),
      ),
    );

    const sequences = created.map((order) => order.sequence).sort((a, b) => a - b);
    expect(new Set(sequences)).toHaveSize(10);
    for (let index = 1; index < sequences.length; index += 1) {
      expect(sequences[index] - sequences[index - 1]).toBe(1);
    }
  });

  it('persists an allowed transition and rejects a jump from requirement to completed', async () => {
    const order = await service.create({
      requestTypeId,
      applicant: 'Teste de fluxo',
      description: 'Pedido usado para testar a máquina de estados.',
      priority: OrderPriority.HIGH,
    });

    await service.transition(order.id, OrderStatus.UNDER_REVIEW);
    await service.transition(order.id, OrderStatus.PENDING_REQUIREMENTS);
    await expect(service.transition(order.id, OrderStatus.COMPLETED)).rejects.toThrow(
      'Transição inválida',
    );

    const persisted = await service.findOne(order.id);
    expect(persisted.status).toBe(OrderStatus.PENDING_REQUIREMENTS);
    expect(persisted.histories).toHaveLength(2);
  });
});
