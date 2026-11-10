import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthState = {
  userId: string | null;
  checking: boolean;
  error: string;
  logoutPending: boolean;
};
const initial: AuthState = { userId: null, checking: true, error: "", logoutPending: false };

export function useAuth(client: SupabaseClient) {
  const [state, setState] = useState<AuthState>(initial);
  const generation = useRef(0);
  const blocked = useRef(false);
  const mounted = useRef(false);
  const invalidate = useCallback(() => ++generation.current, []);

  useEffect(() => {
    mounted.current = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (blocked.current) return;
      const current = invalidate();
      if (!session) {
        setState({ ...initial, checking: false });
        return;
      }
      setState((previous) => (previous.userId === session.user.id ? previous : { ...initial }));
      // Never await another Auth operation inside the SDK's auth callback lock.
      setTimeout(() => {
        if (!mounted.current || current !== generation.current) return;
        void client.auth
          .getUser()
          .then(({ data, error }) => {
            if (!mounted.current || current !== generation.current) return;
            if (error || !data.user || data.user.id !== session.user.id) {
              setState({
                ...initial,
                checking: false,
                error: "Não foi possível validar a sessão. Entre novamente.",
              });
            } else {
              setState({ ...initial, checking: false, userId: data.user.id });
            }
          })
          .catch(() => {
            if (mounted.current && current === generation.current) {
              setState({
                ...initial,
                checking: false,
                error:
                  "Não foi possível validar a sessão. Verifique sua conexão e entre novamente.",
              });
            }
          });
      }, 0);
    });
    return () => {
      mounted.current = false;
      invalidate();
      subscription.unsubscribe();
    };
  }, [client, invalidate]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (blocked.current) throw new Error("Conclua a saída antes de entrar novamente.");
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Não foi possível entrar. Confira e-mail, senha e conexão.");
    },
    [client],
  );

  const logout = useCallback(async () => {
    blocked.current = true;
    invalidate();
    // Unmount all private UI before waiting for the network.
    setState({ ...initial, checking: false, logoutPending: true });
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      blocked.current = false;
      if (mounted.current) setState({ ...initial, checking: false });
    } catch {
      if (mounted.current)
        setState({
          ...initial,
          checking: false,
          logoutPending: true,
          error: "Não foi possível concluir a saída. Tente novamente antes de fechar esta página.",
        });
    }
  }, [client, invalidate]);

  return { ...state, login, logout };
}
