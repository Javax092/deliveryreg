import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-soft)] bg-[var(--surface-card)]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 no-underline"
            aria-label="DeliveryReg - Página inicial"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--accent-400)] text-sm font-bold text-[var(--brand-950)]">
              DR
            </div>

            <div className="leading-tight">
              <strong className="block text-sm font-bold text-[var(--text-primary)]">
                DeliveryReg
              </strong>

              <span className="block text-[11px] text-[var(--text-muted)]">
                Gestão comercial
              </span>
            </div>
          </Link>

          <nav
            className="flex items-center gap-2"
            aria-label="Acesso principal"
          >
            <Link
              href="/catalogo"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] no-underline transition hover:bg-[var(--surface-soft)]"
            >
              Ver catálogo
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-900)] px-4 text-sm font-semibold text-white no-underline shadow-[var(--shadow-xs)] transition hover:bg-[var(--brand-800)]"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[var(--success)]"
            />
            Operação integrada
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl sm:leading-[1.08]">
            Pedidos, estoque e operação em um só lugar.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            O DeliveryReg centraliza a rotina comercial das unidades para
            facilitar vendas, atendimento, controle de estoque, caixa e
            entregas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-900)] px-5 text-sm font-semibold text-white no-underline shadow-[var(--shadow-xs)] transition hover:bg-[var(--brand-800)]"
            >
              Acessar catálogo
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 text-sm font-semibold text-[var(--text-primary)] no-underline shadow-[var(--shadow-xs)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)]"
            >
              Acessar gestão
            </Link>
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Plataforma
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                Gestão da operação
              </h2>
            </div>

            <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--success-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--success)]"
              />
              Online
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Feature
              title="Pedidos"
              description="Acompanhe o fluxo da venda até a conclusão."
            />

            <Feature
              title="PDV e caixa"
              description="Centralize vendas presenciais e movimentações."
            />

            <Feature
              title="Estoque"
              description="Controle disponibilidade e movimentação de produtos."
            />

            <Feature
              title="Entregas"
              description="Acompanhe os pedidos destinados ao delivery."
            />
          </div>

          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Alvorada 1 e Alvorada 2
            </p>

            <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
              Operação organizada por unidade com visão centralizada da gestão.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border-soft)] bg-[var(--surface-card)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3 sm:px-6">
          <Benefit
            number="01"
            title="Operação centralizada"
            description="Menos telas desconectadas e mais clareza sobre o que está acontecendo."
          />

          <Benefit
            number="02"
            title="Controle por unidade"
            description="Acompanhe a operação de cada ponto sem perder a visão geral."
          />

          <Benefit
            number="03"
            title="Gestão orientada por dados"
            description="Pedidos, vendas e estoque transformados em informação útil para a gestão."
          />
        </div>
      </section>

      <footer>
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-7 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>DeliveryReg</span>
          <span>Operação e gestão comercial</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-[var(--surface-card)] p-4">
      <div
        aria-hidden="true"
        className="mb-3 h-2 w-2 rounded-full bg-[var(--accent-500)]"
      />

      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function Benefit({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="text-xs font-bold text-[var(--accent-700)]">
        {number}
      </span>

      <h2 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
