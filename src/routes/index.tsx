import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Finalidade, Imovel, Interessado, StatusImovel } from "@/domain/types";
import { combinar, diasDesdeContato, formatBRL } from "@/domain/matching";
import type { Repositorio } from "@/services/repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseRepository } from "@/services/supabase-repository";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MatchBack AI — Oportunidades por imóvel" },
      { name: "description", content: "Selecione um imóvel e veja os interessados compatíveis, com critérios explicados." },
      { property: "og:title", content: "MatchBack AI — Oportunidades por imóvel" },
      { property: "og:description", content: "Relacione imóveis disponíveis a interessados já cadastrados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Application,
});

const statusLabel: Record<StatusImovel, string> = {
  disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido", alugado: "Alugado",
};

function Application() {
  return <AuthGate>{(client, userId, logout) =>
    <ConnectedDashboard key={userId} client={client} userId={userId} logout={logout} />
  }</AuthGate>;
}

function ConnectedDashboard({ client, userId, logout }: { client: SupabaseClient; userId: string; logout: () => Promise<void> }) {
  const repository = useMemo(() => createSupabaseRepository(client, userId), [client, userId]);
  return <Dashboard repository={repository} logout={logout} />;
}

function Dashboard({ repository, logout }: { repository: Repositorio; logout: () => Promise<void> }) {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [interessados, setInteressados] = useState<Interessado[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [mostrarIncompat, setMostrarIncompat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError("");
    Promise.all([repository.listarImoveis(), repository.listarInteressados()]).then(([i, p]) => {
      if (cancelled) return;
      setImoveis(i); setInteressados(p);
      setSelId((previous) => i.some((item) => item.id === previous) ? previous : i[0]?.id ?? null);
    }).catch(() => {
      if (cancelled) return;
      setImoveis([]); setInteressados([]); setSelId(null);
      setLoadError("Não foi possível carregar os dados. Verifique sua conexão e sessão.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [repository, attempt]);

  const contagens = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of imoveis) m[i.id] = combinar(i, interessados).filter((c) => c.compativel).length;
    return m;
  }, [imoveis, interessados]);

  const sel = imoveis.find((i) => i.id === selId);
  const combinacoes = sel ? combinar(sel, interessados) : [];
  const compat = combinacoes.filter((c) => c.compativel);
  const visiveis = mostrarIncompat ? combinacoes : compat;
  const totalCompat = Object.values(contagens).reduce((a, b) => a + b, 0);

  async function adicionar(dados: Omit<Imovel, "id">) {
    const novo = await repository.criarImovel(dados);
    if (!mounted.current) return;
    setImoveis((xs) => [...xs, novo]);
    setSelId(novo.id);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">MB</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">MatchBack AI</h1>
              <p className="text-xs text-muted-foreground">Recuperação de oportunidades · demonstração · Florianópolis/SC · dados persistidos</p>
            </div>
          </div>
          <button className="rounded border px-3 py-2 text-sm" onClick={() => void logout()}>Sair</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {loading ? <p role="status">Carregando imóveis e interessados…</p> : loadError ?
          <div role="alert"><p>{loadError}</p><button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div> : <>
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi label="Imóveis no catálogo" valor={imoveis.length} />
          <Kpi label="Interessados na carteira" valor={interessados.length} />
          <Kpi label="Combinações compatíveis" valor={totalCompat} />
          <Kpi label="Compatíveis com o imóvel" valor={compat.length} destaque />
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-lg border bg-card">
              <h2 className="border-b px-4 py-3 text-sm font-semibold">Catálogo de imóveis</h2>
              <ul className="divide-y">
                {imoveis.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => setSelId(i.id)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted ${i.id === selId ? "bg-accent" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{i.titulo}{i.demo && <DemoTag />}</span>
                        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{contagens[i.id] ?? 0}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {i.id} · {i.bairro} · {i.finalidade === "compra" ? "Venda" : "Aluguel"} · {i.quartos}q · {formatBRL(i.preco)}{i.finalidade === "aluguel" ? "/mês" : ""}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <NovoImovelForm onSubmit={adicionar} onReload={() => setAttempt((value) => value + 1)} />
          </aside>

          <section className="space-y-4">
            {sel && (
              <div className="rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{sel.id}</p>
                    <h2 className="text-xl font-bold">{sel.titulo}{sel.demo && <DemoTag />}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sel.bairro} · {sel.finalidade === "compra" ? "Venda" : "Aluguel"} · {sel.quartos} quarto(s) · {formatBRL(sel.preco)}
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{statusLabel[sel.status]}</span>
                </div>
                {sel.status !== "disponivel" && (
                  <p className="mt-3 rounded-md bg-warning-soft px-3 py-2 text-xs text-foreground">Atenção: este imóvel não está disponível no momento.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{compat.length} interessado(s) compatível(is)</h3>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={mostrarIncompat} onChange={(e) => setMostrarIncompat(e.target.checked)} />
                Mostrar também não compatíveis
              </label>
            </div>

            {visiveis.length === 0 && (
              <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum interessado atende aos critérios obrigatórios deste imóvel.
              </div>
            )}

            <div className="space-y-3">
              {visiveis.map((c) => {
                const dias = diasDesdeContato(c.interessado.ultimoContato);
                return (
                  <article key={c.interessado.id} className={`rounded-lg border bg-card p-4 ${c.compativel ? "" : "opacity-70"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{c.interessado.nome}</h4>
                          <span className="text-xs text-muted-foreground">{c.interessado.id}{c.interessado.contato ? ` · ${c.interessado.contato}` : ""}</span>
                          {c.interessado.demo && <DemoTag />}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {c.compativel
                            ? <Tag tom="success">Compatível</Tag>
                            : <Tag tom="destructive">Não compatível</Tag>}
                          {c.compativel && (c.bairroCoincide
                            ? <Tag tom="success">Bairro preferido</Tag>
                            : <Tag tom="neutral">Bairro diferente</Tag>)}
                        </div>
                      </div>
                      <div className="rounded-md border bg-muted px-3 py-1.5 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Último contato</p>
                        <p className="text-sm font-semibold">
                          {new Date(c.interessado.ultimoContato + "T00:00:00").toLocaleDateString("pt-BR")}
                          <span className={`ml-1.5 text-xs font-medium ${dias > 90 ? "text-warning" : "text-muted-foreground"}`}>há {dias} dia(s)</span>
                        </p>
                      </div>
                    </div>
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {c.criterios.map((cr) => (
                        <li key={cr.id} className="flex gap-2 text-sm">
                          <span className={`mt-0.5 font-bold ${cr.atendido ? "text-success" : cr.obrigatorio ? "text-destructive" : "text-muted-foreground"}`}>
                            {cr.atendido ? "✓" : "✗"}
                          </span>
                          <span>
                            <span className="font-medium">{cr.label}{cr.obrigatorio ? "" : " (preferência)"}:</span>{" "}
                            <span className="text-muted-foreground">{cr.explicacao}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Ordenação: compatíveis primeiro; entre eles, bairro preferido antes, depois contato mais recente. A recência não altera a compatibilidade.
            </p>
          </section>
        </div>
        </>}
      </main>
    </div>
  );
}

function Kpi({ label, valor, destaque }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${destaque ? "bg-primary text-primary-foreground" : "bg-card"}`}>
      <p className={`text-xs font-medium ${destaque ? "opacity-80" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{valor}</p>
    </div>
  );
}

function Tag({ tom, children }: { tom: "success" | "destructive" | "neutral"; children: React.ReactNode }) {
  const cls = tom === "success" ? "bg-success-soft text-success" : tom === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

function NovoImovelForm({ onSubmit, onReload }: { onSubmit: (d: Omit<Imovel, "id">) => Promise<void>; onReload: () => void }) {
  const vazio = { titulo: "", bairro: "", finalidade: "compra" as Finalidade, preco: "", quartos: "", status: "disponivel" as StatusImovel };
  const [f, setF] = useState(vazio);
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    const preco = Number(f.preco), quartos = Number(f.quartos);
    if (!f.titulo.trim() || !f.bairro.trim()) return setErro("Informe título e bairro.");
    if (!Number.isFinite(preco) || !(preco > 0)) return setErro("Preço deve ser maior que zero.");
    if (!f.quartos.trim() || !Number.isInteger(quartos) || quartos < 0) return setErro("Quartos deve ser um número inteiro.");
    setErro("");
    pending.current = true; setSaving(true);
    try {
      await onSubmit({ titulo: f.titulo.trim(), bairro: f.bairro.trim(), finalidade: f.finalidade, preco, quartos, status: f.status });
      setF(vazio);
    } catch {
      setErro("Não foi possível confirmar a gravação. Os campos foram preservados. Confira o catálogo antes de reenviar.");
    } finally {
      pending.current = false; setSaving(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-lg border bg-card p-4">
      <fieldset disabled={saving} className="space-y-3">
      <h2 className="text-sm font-semibold">Adicionar imóvel</h2>
      <input className={input} placeholder="Título" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
      <input className={input} placeholder="Bairro" value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <select className={input} value={f.finalidade} onChange={(e) => setF({ ...f, finalidade: e.target.value as Finalidade })}>
          <option value="compra">Compra</option>
          <option value="aluguel">Aluguel</option>
        </select>
        <select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as StatusImovel })}>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className={input} type="number" min="0.01" step="0.01" placeholder="Preço (R$)" value={f.preco} onChange={(e) => setF({ ...f, preco: e.target.value })} />
        <input className={input} type="number" min="0" placeholder="Quartos" value={f.quartos} onChange={(e) => setF({ ...f, quartos: e.target.value })} />
      </div>
      {erro && <div role="alert" className="text-xs text-destructive"><p>{erro}</p><button type="button" onClick={onReload}>Recarregar catálogo</button></div>}
      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        {saving ? "Salvando…" : "Adicionar e recalcular"}
      </button>
      </fieldset>
    </form>
  );
}

function DemoTag() {
  return <span className="ml-2 rounded border border-dashed px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Demo</span>;
}
