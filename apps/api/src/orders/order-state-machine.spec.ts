import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrderStateMachine } from './order-state-machine';

describe('OrderStateMachine', () => {
  it.each([
    [OrderStatus.PROTOCOLLED, OrderStatus.UNDER_REVIEW],
    [OrderStatus.PROTOCOLLED, OrderStatus.CANCELED],
    [OrderStatus.UNDER_REVIEW, OrderStatus.PENDING_REQUIREMENTS],
    [OrderStatus.UNDER_REVIEW, OrderStatus.COMPLETED],
    [OrderStatus.PENDING_REQUIREMENTS, OrderStatus.UNDER_REVIEW],
  ])('accepts %s → %s', (from, to) => {
    expect(() => OrderStateMachine.assertTransition(from, to)).not.toThrow();
  });

  it.each([
    [OrderStatus.PROTOCOLLED, OrderStatus.COMPLETED],
    [OrderStatus.PENDING_REQUIREMENTS, OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED, OrderStatus.UNDER_REVIEW],
    [OrderStatus.CANCELED, OrderStatus.PROTOCOLLED],
  ])('rejects %s → %s', (from, to) => {
    expect(() => OrderStateMachine.assertTransition(from, to)).toThrow(BadRequestException);
  });
});
