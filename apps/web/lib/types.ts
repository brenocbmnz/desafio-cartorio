export type OrderStatus =
  | 'PROTOCOLLED'
  | 'UNDER_REVIEW'
  | 'PENDING_REQUIREMENTS'
  | 'COMPLETED'
  | 'CANCELED';

export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type RequestType = {
  id: string;
  name: string;
  slug: string;
};

export type OrderTransition = {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  createdAt: string;
};

export type ServiceOrder = {
  id: string;
  protocol: string;
  applicant: string;
  description: string;
  priority: OrderPriority;
  status: OrderStatus;
  requestTypeId: string;
  requestType: RequestType;
  histories?: OrderTransition[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedOrders = {
  items: ServiceOrder[];
  total: number;
  page: number;
  pageSize: number;
};

export const statusLabels: Record<OrderStatus, string> = {
  PROTOCOLLED: 'Protocolado',
  UNDER_REVIEW: 'Em análise',
  PENDING_REQUIREMENTS: 'Em exigência',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

export const priorityLabels: Record<OrderPriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

