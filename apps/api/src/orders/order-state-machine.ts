import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PROTOCOLLED]: [OrderStatus.UNDER_REVIEW, OrderStatus.CANCELED],
  [OrderStatus.UNDER_REVIEW]: [
    OrderStatus.PENDING_REQUIREMENTS,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELED,
  ],
  [OrderStatus.PENDING_REQUIREMENTS]: [OrderStatus.UNDER_REVIEW, OrderStatus.CANCELED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELED]: [],
};

export class OrderStateMachine {
  static allowedFrom(status: OrderStatus): readonly OrderStatus[] {
    return transitions[status];
  }

  static assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!transitions[from].includes(to)) {
      throw new BadRequestException(`Transição inválida: ${from} → ${to}`);
    }
  }
}

