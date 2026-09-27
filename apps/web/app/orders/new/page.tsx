'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { OrderPriority, priorityLabels, RequestType, ServiceOrder } from '@/lib/types';

export default function NewOrderPage() {
  const router = useRouter();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<RequestType[]>('/request-types')
      .then(setTypes)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro ao carregar tipos.'));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const order = await api<ServiceOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          requestTypeId: data.get('requestTypeId'),
          applicant: data.get('applicant'),
          description: data.get('description'),
          priority: data.get('priority'),
        }),
      });
      router.push(`/orders/${order.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao criar pedido.');
      setSaving(false);
    }
  }

  return (
    <div className="shell narrow page-stack">
      <Link href="/" className="back-link">← Voltar para pedidos</Link>
      <section className="page-heading">
        <p className="eyebrow">Novo atendimento</p>
        <h1>Registrar protocolo</h1>
        <p>Preencha os dados abaixo. O número será atribuído automaticamente.</p>
      </section>

      <form className="form-card" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <label className="field-full">
            <span>Tipo do pedido</span>
            <select name="requestTypeId" required defaultValue="">
              <option value="" disabled>Selecione um serviço</option>
              {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label>
            <span>Solicitante</span>
            <input name="applicant" required minLength={2} maxLength={150} placeholder="Nome completo" />
          </label>
          <label>
            <span>Prioridade</span>
            <select name="priority" defaultValue="NORMAL">
              {(Object.keys(priorityLabels) as OrderPriority[]).map((priority) => (
                <option key={priority} value={priority}>{priorityLabels[priority]}</option>
              ))}
            </select>
          </label>
          <label className="field-full">
            <span>Descrição</span>
            <textarea name="description" required minLength={5} maxLength={5000} rows={6} placeholder="Descreva a necessidade do solicitante e os documentos apresentados." />
            <small>Inclua as informações necessárias para a análise.</small>
          </label>
        </div>
        <div className="form-actions">
          <Link href="/" className="button button-ghost">Cancelar</Link>
          <button className="button button-primary" disabled={saving || types.length === 0}>
            {saving ? 'Protocolando…' : 'Protocolar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}

