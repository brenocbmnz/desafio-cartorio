import Link from 'next/link';
import { priorityLabels, ServiceOrder } from '@/lib/types';
import { StatusBadge } from './status-badge';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function OrderList({ orders }: { orders: ServiceOrder[] }) {
  return (
    <div className="orders-table-scroll">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Solicitante</th>
            <th className="col-service">Serviço</th>
            <th className="col-priority">Prioridade</th>
            <th>Status</th>
            <th className="col-date">Entrada</th>
            <th><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link href={`/orders/${order.id}`} className="table-protocol">
                  {order.protocol}
                </Link>
              </td>
              <td>
                <div className="requester-cell">
                  <span className="requester-avatar" aria-hidden>{initials(order.applicant)}</span>
                  <span className="requester-copy">
                    <Link href={`/orders/${order.id}`}>{order.applicant}</Link>
                    <small>{order.description}</small>
                  </span>
                </div>
              </td>
              <td className="col-service"><span className="service-name">{order.requestType.name}</span></td>
              <td className="col-priority">
                <span className={`priority-pill priority-pill-${order.priority.toLowerCase()}`}>
                  {priorityLabels[order.priority]}
                </span>
              </td>
              <td><StatusBadge status={order.status} /></td>
              <td className="col-date">
                <time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time>
              </td>
              <td>
                <Link href={`/orders/${order.id}`} className="row-action" aria-label={`Abrir pedido ${order.protocol}`}>
                  <span aria-hidden>→</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
