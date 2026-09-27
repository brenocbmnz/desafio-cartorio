'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';
import { OrderStatus, priorityLabels, ServiceOrder, statusLabels } from '@/lib/types';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PROTOCOLLED: ['UNDER_REVIEW', 'CANCELED'],
  UNDER_REVIEW: ['PENDING_REQUIREMENTS', 'COMPLETED', 'CANCELED'],
  PENDING_REQUIREMENTS: ['UNDER_REVIEW', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const loadOrder = useCallback(async () => {
    setError('');
    try {
      setOrder(await api<ServiceOrder>(`/orders/${id}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar pedido.');
    }
  }, [id]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  async function moveTo(status: OrderStatus) {
    setWorking(true);
    setError('');
    try {
      setOrder(await api<ServiceOrder>(`/orders/${id}/transitions`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao movimentar pedido.');
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!window.confirm('Excluir este pedido? O protocolo continuará reservado para auditoria.')) return;
    setWorking(true);
    try {
      await api(`/orders/${id}`, { method: 'DELETE' });
      router.push('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao excluir pedido.');
      setWorking(false);
    }
  }

  if (!order && !error) return <div className="shell detail-loading"><div className="skeleton" /></div>;

  if (!order) return (
    <div className="shell empty-state page-stack">
      <h1>Pedido indisponível</h1>
      <p>{error}</p>
      <Link href="/" className="button button-primary">Voltar</Link>
    </div>
  );

  return (
    <div className="shell page-stack">
      <Link href="/" className="back-link">← Voltar para pedidos</Link>
      <section className="detail-header">
        <div>
          <div className="detail-kicker"><span>{order.protocol}</span><StatusBadge status={order.status} /></div>
          <h1>{order.requestType.name}</h1>
          <p>Solicitado por <strong>{order.applicant}</strong></p>
        </div>
        <div className="detail-date">
          <span>Protocolado em</span>
          <strong>{dateTimeFormatter.format(new Date(order.createdAt))}</strong>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-layout">
        <div className="detail-main">
          <section className="content-card">
            <p className="eyebrow">Descrição do pedido</p>
            <p className="order-description">{order.description}</p>
            <dl className="facts">
              <div><dt>Prioridade</dt><dd>{priorityLabels[order.priority]}</dd></div>
              <div><dt>Última atualização</dt><dd>{dateTimeFormatter.format(new Date(order.updatedAt))}</dd></div>
            </dl>
          </section>

          <section className="content-card">
            <div className="section-title">
              <div><p className="eyebrow">Auditoria</p><h2>Histórico de movimentações</h2></div>
              <span>{order.histories?.length ?? 0} movimentações</span>
            </div>
            <ol className="timeline">
              <li>
                <span className="timeline-dot" />
                <div><strong>Pedido protocolado</strong><time>{dateTimeFormatter.format(new Date(order.createdAt))}</time></div>
              </li>
              {order.histories?.map((history) => (
                <li key={history.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{statusLabels[history.fromStatus]} → {statusLabels[history.toStatus]}</strong>
                    <time>{dateTimeFormatter.format(new Date(history.createdAt))}</time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="action-card">
          <p className="eyebrow">Próxima etapa</p>
          <h2>Movimentar pedido</h2>
          {transitions[order.status].length ? (
            <div className="transition-list">
              {transitions[order.status].map((status) => (
                <button
                  className={status === 'CANCELED' ? 'transition-danger' : ''}
                  disabled={working}
                  key={status}
                  onClick={() => void moveTo(status)}
                >
                  <span>Alterar para</span><strong>{statusLabels[status]}</strong><b aria-hidden>→</b>
                </button>
              ))}
            </div>
          ) : (
            <p className="terminal-message">Este pedido está em um estado final e não possui novas transições.</p>
          )}
          {order.status === 'PROTOCOLLED' && (
            <button className="delete-button" disabled={working} onClick={() => void remove()}>Excluir pedido</button>
          )}
        </aside>
      </div>
    </div>
  );
}
