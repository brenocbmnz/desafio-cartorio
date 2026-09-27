import Link from 'next/link';

export function Header() {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand" aria-label="Ofício Digital — início">
          <span className="brand-mark">OD</span>
          <span>
            <strong>Ofício Digital</strong>
            <small>Gestão de protocolos</small>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          <Link href="/">Pedidos</Link>
          <Link href="/orders/new" className="button button-primary button-small">
            Novo protocolo
          </Link>
        </nav>
      </div>
    </header>
  );
}

