'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderCard } from '@/components/order-card';
import { api } from '@/lib/api';
import { OrderStatus, PaginatedOrders, RequestType, statusLabels } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [types, setTypes] = useState<RequestType[]>([]);
  const [status, setStatus] = useState('');
  const [requestTypeId, setRequestTypeId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ page: String(page), pageSize: '9' });
    if (status) query.set('status', status);
    if (requestTypeId) query.set('requestTypeId', requestTypeId);
    if (search) query.set('search', search);
    try {
      setOrders(await api<PaginatedOrders>(`/orders?${query}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }, [page, requestTypeId, search, status]);

  useEffect(() => {
    api<RequestType[]>('/request-types').then(setTypes).catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const lastPage = orders ? Math.max(1, Math.ceil(orders.total / orders.pageSize)) : 1;

  return (
    <div className="shell page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Central de atendimento</p>
          <h1>Pedidos do cartório</h1>
          <p>Acompanhe cada protocolo da entrada à conclusão, com histórico completo.</p>
        </div>
        <div className="hero-stat">
          <strong>{orders?.total ?? '—'}</strong>
          <span>{orders?.total === 1 ? 'pedido encontrado' : 'pedidos encontrados'}</span>
        </div>
      </section>

      <form className="filters" onSubmit={submitSearch}>
        <label className="search-field">
          <span>Buscar</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Protocolo, solicitante ou descrição"
          />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">Todos</option>
            {(Object.keys(statusLabels) as OrderStatus[]).map((value) => (
              <option key={value} value={value}>{statusLabels[value]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tipo</span>
          <select value={requestTypeId} onChange={(event) => { setRequestTypeId(event.target.value); setPage(1); }}>
            <option value="">Todos</option>
            {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </label>
        <button className="button button-dark" type="submit">Buscar</button>
      </form>

      {error && <div className="alert alert-error">{error} <button onClick={() => void loadOrders()}>Tentar novamente</button></div>}
      {loading ? (
        <div className="loading-grid" aria-label="Carregando pedidos">
          {Array.from({ length: 6 }).map((_, index) => <div className="skeleton" key={index} />)}
        </div>
      ) : orders?.items.length ? (
        <div className="orders-grid">
          {orders.items.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      ) : !error ? (
        <div className="empty-state">
          <span className="empty-icon">⌕</span>
          <h2>Nenhum pedido encontrado</h2>
          <p>Ajuste os filtros ou registre um novo protocolo.</p>
          <Link href="/orders/new" className="button button-primary">Criar pedido</Link>
        </div>
      ) : null}

      {orders && orders.total > orders.pageSize && (
        <nav className="pagination" aria-label="Paginação">
          <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Anterior</button>
          <span>Página {page} de {lastPage}</span>
          <button disabled={page === lastPage} onClick={() => setPage((value) => value + 1)}>Próxima →</button>
        </nav>
      )}
    </div>
  );
}

