import Link from 'next/link';
import { priorityLabels, ServiceOrder } from '@/lib/types';
import { StatusBadge } from './status-badge';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function OrderCard({ order }: { order: ServiceOrder }) {
  return (
    <Link href={`/orders/${order.id}`} className="order-card">
      <div className="order-card-top">
        <span className="protocol">{order.protocol}</span>
        <StatusBadge status={order.status} />
      </div>
      <h2>{order.requestType.name}</h2>
      <p className="applicant">{order.applicant}</p>
      <p className="description-clamp">{order.description}</p>
      <div className="order-meta">
        <span className={`priority priority-${order.priority.toLowerCase()}`}>
          {priorityLabels[order.priority]}
        </span>
        <time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time>
        <span className="open-order">Ver pedido <span aria-hidden>→</span></span>
      </div>
    </Link>
  );
}

