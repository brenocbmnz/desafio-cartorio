'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderCard } from '@/components/order-card';
import { OrderList } from '@/components/order-list';
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
  const [view, setView] = useState<'list' | 'cards'>('list');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ page: String(page), pageSize: '12' });
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

  function clearFilters() {
    setStatus('');
    setRequestTypeId('');
    setSearchInput('');
    setSearch('');
    setPage(1);
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

      {error && <div className="alert alert-error">{error} <button onClick={() => void loadOrders()}>Tentar novamente</button></div>}

      <section className="orders-panel">
        <div className="orders-toolbar">
          <form className="inline-filters" onSubmit={submitSearch}>
            <label className="inline-search">
              <span className="sr-only">Buscar pedidos</span>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 4 4" />
              </svg>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar protocolo, solicitante ou descrição"
              />
            </label>

            <label className="inline-select">
              <span>Status</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                <option value="">Todos</option>
                {(Object.keys(statusLabels) as OrderStatus[]).map((value) => (
                  <option key={value} value={value}>{statusLabels[value]}</option>
                ))}
              </select>
            </label>

            <label className="inline-select inline-type">
              <span>Tipo</span>
              <select value={requestTypeId} onChange={(event) => { setRequestTypeId(event.target.value); setPage(1); }}>
                <option value="">Todos</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </label>

            <button className="filter-submit" type="submit">Buscar</button>
            {(status || requestTypeId || search) && (
              <button className="clear-filters" type="button" onClick={clearFilters}>Limpar</button>
            )}
          </form>

          <div className="view-toggle" role="group" aria-label="Modo de visualização">
            <button
              className={view === 'list' ? 'active' : ''}
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="Visualização em lista"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M8 6h13M8 12h13M8 18h13" />
                <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
              </svg>
              <span className="sr-only">Lista</span>
            </button>
            <button
              className={view === 'cards' ? 'active' : ''}
              type="button"
              onClick={() => setView('cards')}
              aria-pressed={view === 'cards'}
              title="Visualização em cards"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="sr-only">Cards</span>
            </button>
          </div>
        </div>

        <div className="orders-panel-heading">
          <div>
            <strong>Todos os pedidos</strong>
            <span>{orders?.total ?? 0} registros</span>
          </div>
          <span>Mais recentes primeiro</span>
        </div>

        <div className={`orders-content orders-content-${view}`}>
          {loading ? (
            view === 'list' ? (
              <div className="list-loading" aria-label="Carregando pedidos">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index}><span /><span /><span /><span /></div>
                ))}
              </div>
            ) : (
              <div className="loading-grid" aria-label="Carregando pedidos">
                {Array.from({ length: 6 }).map((_, index) => <div className="skeleton" key={index} />)}
              </div>
            )
          ) : orders?.items.length ? (
            view === 'list' ? (
              <OrderList orders={orders.items} />
            ) : (
              <div className="orders-grid">
                {orders.items.map((order) => <OrderCard key={order.id} order={order} />)}
              </div>
            )
          ) : !error ? (
            <div className="empty-state">
              <span className="empty-icon">⌕</span>
              <h2>Nenhum pedido encontrado</h2>
              <p>Ajuste os filtros ou registre um novo protocolo.</p>
              <Link href="/orders/new" className="button button-primary">Criar pedido</Link>
            </div>
          ) : null}
        </div>

        {orders && orders.total > orders.pageSize && (
          <nav className="pagination" aria-label="Paginação">
            <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Anterior</button>
            <span>Página {page} de {lastPage}</span>
            <button disabled={page === lastPage} onClick={() => setPage((value) => value + 1)}>Próxima →</button>
          </nav>
        )}
      </section>
    </div>
  );
}
