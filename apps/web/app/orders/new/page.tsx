'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { OrderPriority, priorityLabels, RequestType, ServiceOrder } from '@/lib/types';

type OrderDraft = {
  requestTypeId: string;
  applicant: string;
  description: string;
  priority: OrderPriority;
};

type FieldErrors = Partial<Record<keyof OrderDraft, string>>;

const initialDraft: OrderDraft = {
  requestTypeId: '',
  applicant: '',
  description: '',
  priority: 'NORMAL',
};

const priorityHelp: Record<OrderPriority, string> = {
  LOW: 'Sem preferência de atendimento',
  NORMAL: 'Fluxo regular do cartório',
  HIGH: 'Deve receber atenção na fila',
  URGENT: 'Requer atenção imediata',
};

export default function NewOrderPage() {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const infoDialogRef = useRef<HTMLDivElement>(null);
  const [types, setTypes] = useState<RequestType[]>([]);
  const [draft, setDraft] = useState<OrderDraft>(initialDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    api<RequestType[]>('/request-types')
      .then(setTypes)
      .catch((cause) => setApiError(cause instanceof Error ? cause.message : 'Erro ao carregar tipos.'))
      .finally(() => setLoadingTypes(false));
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) errorSummaryRef.current?.focus();
  }, [errors]);

  useEffect(() => {
    const pageName = step === 'form' ? 'Registrar protocolo' : 'Conferir protocolo';
    document.title = `${Object.keys(errors).length > 0 ? 'Erro: ' : ''}${pageName} | Ofício Digital`;
    return () => { document.title = 'Ofício Digital | Protocolos'; };
  }, [errors, step]);

  useEffect(() => {
    if (!showInfo) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    infoDialogRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeInfo();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showInfo]);

  const selectedType = useMemo(
    () => types.find((type) => type.id === draft.requestTypeId),
    [draft.requestTypeId, types],
  );

  function updateField<K extends keyof OrderDraft>(field: K, value: OrderDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError('');

    const nextErrors: FieldErrors = {};
    const applicant = draft.applicant.trim();
    const description = draft.description.trim();

    if (!draft.requestTypeId) nextErrors.requestTypeId = 'Selecione o tipo do pedido.';
    if (applicant.length < 2) nextErrors.applicant = 'Informe o nome do solicitante com pelo menos 2 caracteres.';
    if (description.length < 5) nextErrors.description = 'Descreva o pedido com pelo menos 5 caracteres.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setDraft((current) => ({ ...current, applicant, description }));
    setErrors({});
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function edit(fieldId?: string) {
    setStep('form');
    window.setTimeout(() => document.getElementById(fieldId ?? 'requestTypeId')?.focus(), 0);
  }

  function closeInfo() {
    setShowInfo(false);
    window.setTimeout(() => infoButtonRef.current?.focus(), 0);
  }

  async function createOrder() {
    setSaving(true);
    setApiError('');
    try {
      const order = await api<ServiceOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      router.push(`/orders/${order.id}`);
    } catch (cause) {
      setApiError(cause instanceof Error ? cause.message : 'Erro ao criar pedido.');
      setSaving(false);
    }
  }

  return (
    <div className="shell registration-page page-stack">
      <Link href="/" className="back-link">← Voltar para pedidos</Link>

      <ol className="registration-progress" aria-label="Etapas do cadastro">
        <li className={step === 'form' ? 'active' : 'complete'}>
          <span>{step === 'review' ? '✓' : '1'}</span>
          <div><small>Etapa 1</small><strong>Dados do pedido</strong></div>
        </li>
        <li className={step === 'review' ? 'active' : ''}>
          <span>2</span>
          <div><small>Etapa 2</small><strong>Conferência</strong></div>
        </li>
      </ol>

      <section className="page-heading registration-heading">
        <p className="eyebrow">Novo atendimento</p>
        <div className="registration-title-line">
          <h1>{step === 'form' ? 'Registrar protocolo' : 'Conferir protocolo'}</h1>
          <button
            ref={infoButtonRef}
            className="registration-info-button"
            type="button"
            aria-label="Informações sobre o protocolo"
            aria-haspopup="dialog"
            aria-expanded={showInfo}
            onClick={() => setShowInfo(true)}
          >?</button>
        </div>
        <p>
          {step === 'form'
            ? 'Reúna as informações essenciais para iniciar o atendimento.'
            : 'Revise os dados antes de gerar o número do protocolo.'}
        </p>
      </section>

      {step === 'form' ? (
        <form className="registration-form" onSubmit={review} noValidate>
          <div className="new-order-layout">
            <div className="form-card registration-card">
              {Object.keys(errors).length > 0 && (
                <div className="form-error-summary" ref={errorSummaryRef} role="alert" tabIndex={-1}>
                  <strong>Revise os dados informados</strong>
                  <span>Corrija os campos destacados para continuar.</span>
                  <ul>
                    {(Object.entries(errors) as [keyof OrderDraft, string][]).map(([field, message]) => (
                      <li key={field}>
                        <button type="button" onClick={() => document.getElementById(field)?.focus()}>{message}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

              <section className="form-section" aria-labelledby="service-section-title">
                <div className="form-section-heading">
                  <span>01</span>
                  <div>
                    <h2 id="service-section-title">Serviço solicitado</h2>
                    <p>Escolha o tipo de atendimento que será protocolado.</p>
                  </div>
                </div>

                <label className={`field-control ${errors.requestTypeId ? 'field-error' : ''}`}>
                  <span>Tipo do pedido</span>
                  <select
                    id="requestTypeId"
                    value={draft.requestTypeId}
                    onChange={(event) => updateField('requestTypeId', event.target.value)}
                    aria-invalid={Boolean(errors.requestTypeId)}
                    aria-describedby={errors.requestTypeId ? 'requestTypeId-error' : 'requestTypeId-hint'}
                    disabled={loadingTypes}
                  >
                    <option value="">{loadingTypes ? 'Carregando serviços…' : 'Selecione um serviço'}</option>
                    {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                  {errors.requestTypeId ? (
                    <small className="field-error-message" id="requestTypeId-error">{errors.requestTypeId}</small>
                  ) : (
                    <small id="requestTypeId-hint">O tipo ajuda a direcionar o pedido para a análise correta.</small>
                  )}
                </label>
              </section>

              <section className="form-section" aria-labelledby="requester-section-title">
                <div className="form-section-heading">
                  <span>02</span>
                  <div>
                    <h2 id="requester-section-title">Identificação</h2>
                    <p>Informe quem está solicitando o serviço.</p>
                  </div>
                </div>

                <label className={`field-control ${errors.applicant ? 'field-error' : ''}`}>
                  <span>Nome do solicitante</span>
                  <input
                    id="applicant"
                    value={draft.applicant}
                    onChange={(event) => updateField('applicant', event.target.value)}
                    maxLength={150}
                    autoComplete="name"
                    placeholder="Ex.: Maria da Silva"
                    aria-invalid={Boolean(errors.applicant)}
                    aria-describedby={errors.applicant ? 'applicant-error' : 'applicant-hint'}
                  />
                  {errors.applicant ? (
                    <small className="field-error-message" id="applicant-error">{errors.applicant}</small>
                  ) : (
                    <small id="applicant-hint">Use o nome completo para facilitar a identificação.</small>
                  )}
                </label>
              </section>

              <section className="form-section" aria-labelledby="details-section-title">
                <div className="form-section-heading">
                  <span>03</span>
                  <div>
                    <h2 id="details-section-title">Detalhes do atendimento</h2>
                    <p>Registre o contexto necessário para quem fará a análise.</p>
                  </div>
                </div>

                <label className={`field-control ${errors.description ? 'field-error' : ''}`}>
                  <span>Descrição do pedido</span>
                  <textarea
                    id="description"
                    value={draft.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    maxLength={5000}
                    rows={7}
                    placeholder="Ex.: Solicita autenticação do contrato apresentado em duas vias."
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? 'description-error' : 'description-hint'}
                  />
                  <span className="field-support">
                    {errors.description ? (
                      <small className="field-error-message" id="description-error">{errors.description}</small>
                    ) : (
                      <small id="description-hint">Inclua documentos apresentados e informações relevantes.</small>
                    )}
                    <small aria-live="polite">{draft.description.length.toLocaleString('pt-BR')} / 5.000</small>
                  </span>
                </label>

                <fieldset className="priority-fieldset">
                  <legend>Prioridade</legend>
                  <p>Selecione como o pedido deve ser sinalizado para a equipe.</p>
                  <div className="priority-options">
                    {(Object.keys(priorityLabels) as OrderPriority[]).map((priority) => (
                      <label key={priority} className={draft.priority === priority ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={draft.priority === priority}
                          onChange={() => updateField('priority', priority)}
                        />
                        <span className={`priority-dot priority-dot-${priority.toLowerCase()}`} aria-hidden />
                        <span>
                          <strong>{priorityLabels[priority]}</strong>
                          <small>{priorityHelp[priority]}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>

              <div className="form-actions registration-actions">
                <Link href="/" className="button button-ghost">Cancelar</Link>
                <button className="button button-primary" type="submit" disabled={loadingTypes || types.length === 0}>
                  Revisar protocolo <span aria-hidden>→</span>
                </button>
              </div>
            </div>

          </div>
        </form>
      ) : (
        <div className="new-order-layout review-layout">
          <section className="form-card review-card">
            {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}
            <div className="review-intro">
              <span aria-hidden>✓</span>
              <div>
                <h2>Confira antes de protocolar</h2>
                <p>O pedido ainda não foi criado. Se necessário, volte e altere qualquer informação.</p>
              </div>
            </div>

            <dl className="review-summary">
              <div>
                <dt>Tipo do pedido</dt>
                <dd>{selectedType?.name}</dd>
                <button type="button" onClick={() => edit('requestTypeId')}>Alterar<span className="sr-only"> tipo do pedido</span></button>
              </div>
              <div>
                <dt>Solicitante</dt>
                <dd>{draft.applicant}</dd>
                <button type="button" onClick={() => edit('applicant')}>Alterar<span className="sr-only"> solicitante</span></button>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd><span className={`priority-pill priority-pill-${draft.priority.toLowerCase()}`}>{priorityLabels[draft.priority]}</span></dd>
                <button type="button" onClick={() => edit()}>Alterar<span className="sr-only"> prioridade</span></button>
              </div>
              <div className="review-description">
                <dt>Descrição</dt>
                <dd>{draft.description}</dd>
                <button type="button" onClick={() => edit('description')}>Alterar<span className="sr-only"> descrição</span></button>
              </div>
            </dl>

            <div className="review-confirmation">
              <strong>Pronto para criar o protocolo?</strong>
              <p>Ao confirmar, o sistema registrará o pedido e atribuirá o próximo número disponível.</p>
            </div>

            <div className="form-actions registration-actions">
              <button className="button button-ghost" type="button" onClick={() => edit()} disabled={saving}>← Voltar e editar</button>
              <button className="button button-primary" type="button" onClick={() => void createOrder()} disabled={saving}>
                {saving ? 'Protocolando…' : 'Confirmar e protocolar'}
              </button>
            </div>
          </section>

        </div>
      )}

      {showInfo && (
        <div
          className="protocol-info-backdrop"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeInfo(); }}
        >
          <div
            className="protocol-info-dialog"
            ref={infoDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="protocol-info-title"
            tabIndex={-1}
          >
            <button className="protocol-info-close" type="button" onClick={closeInfo} aria-label="Fechar informações">×</button>
            <div className="guide-symbol" aria-hidden>#</div>
            <h2 id="protocol-info-title">Protocolo automático</h2>
            <p>O número sequencial será gerado somente depois da sua confirmação.</p>
            <ul>
              <li><span aria-hidden>✓</span> Todos os campos são obrigatórios</li>
              <li><span aria-hidden>✓</span> Você poderá conferir antes de enviar</li>
              <li><span aria-hidden>✓</span> O pedido começará como Protocolado</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
