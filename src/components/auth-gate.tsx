import { useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/services/supabase";
import { useAuth } from "@/hooks/use-auth";

type Props = {
  children: (client: SupabaseClient, userId: string, logout: () => Promise<void>) => ReactNode;
};

export function AuthGate({ children }: Props) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      setClient(getSupabase());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Configuração indisponível.");
    }
  }, []);
  if (!client)
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <h1>MatchBack AI</h1>
        <p role={error ? "alert" : "status"}>{error || "Iniciando…"}</p>
      </div>
    );
  return <Authenticated client={client}>{children}</Authenticated>;
}

function Authenticated({ client, children }: Props & { client: SupabaseClient }) {
  const auth = useAuth(client);
  if (auth.checking)
    return (
      <p role="status" className="p-8">
        Validando sessão…
      </p>
    );
  if (auth.userId) return <div key={auth.userId}>{children(client, auth.userId, auth.logout)}</div>;
  if (auth.logoutPending)
    return (
      <div className="p-8">
        <p role={auth.error ? "alert" : "status"}>{auth.error || "Saindo…"}</p>
        {auth.error && <button onClick={() => void auth.logout()}>Tentar sair novamente</button>}
      </div>
    );
  return <LoginForm login={auth.login} sessionError={auth.error} />;
}

function LoginForm({
  login,
  sessionError,
}: {
  login: (email: string, password: string) => Promise<void>;
  sessionError: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <form
        className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            await login(email.trim(), password);
          } catch {
            setError("Não foi possível entrar. Confira e-mail, senha e conexão.");
          } finally {
            setPassword("");
            setBusy(false);
          }
        }}
      >
        <h1 className="text-xl font-bold">Entrar no MatchBack AI</h1>
        <label className="block">
          E-mail
          <input
            className="mt-1 w-full rounded border p-2"
            type="email"
            autoComplete="username"
            required
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          Senha
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {(error || sessionError) && <p role="alert">{error || sessionError}</p>}
        <button
          className="w-full rounded bg-primary p-2 text-primary-foreground disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
