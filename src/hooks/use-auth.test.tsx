import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./use-auth";

afterEach(cleanup);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fixture() {
  let listener: Parameters<SupabaseClient["auth"]["onAuthStateChange"]>[0];
  const auth = {
    onAuthStateChange: vi.fn((callback) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "a" } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const client = { auth } as unknown as SupabaseClient;
  const hook = renderHook(() => useAuth(client));
  const emit = (id: string | null) =>
    act(() => {
      void listener(id ? "SIGNED_IN" : "SIGNED_OUT", id ? ({ user: { id } } as Session) : null);
    });
  return { auth, ...hook, emit };
}

describe("authentication lifecycle", () => {
  it("restores and validates the SDK session; does not query Auth when signed out", async () => {
    const f = fixture();
    f.emit(null);
    expect(f.result.current.userId).toBeNull();
    expect(f.auth.getUser).not.toHaveBeenCalled();
    f.emit("a");
    await waitFor(() => expect(f.result.current.userId).toBe("a"));
    expect(f.auth.getUser).toHaveBeenCalledOnce();
  });

  it("rejects an invalid restored session", async () => {
    const f = fixture();
    f.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    f.emit("a");
    await waitFor(() => expect(f.result.current.checking).toBe(false));
    expect(f.result.current.userId).toBeNull();
    expect(f.result.current.error).toContain("validar");
  });

  it("ignores old validation responses after logout and account changes", async () => {
    const f = fixture();
    const old = deferred<{ data: { user: { id: string } }; error: null }>();
    f.auth.getUser.mockReturnValueOnce(old.promise);
    f.emit("a");
    await waitFor(() => expect(f.auth.getUser).toHaveBeenCalledOnce());
    f.emit(null);
    f.auth.getUser.mockResolvedValue({ data: { user: { id: "b" } }, error: null });
    f.emit("b");
    await waitFor(() => expect(f.result.current.userId).toBe("b"));
    await act(async () => old.resolve({ data: { user: { id: "a" } }, error: null }));
    expect(f.result.current.userId).toBe("b");
  });

  it("hides private data immediately and blocks restoration if logout fails", async () => {
    const f = fixture();
    f.emit("a");
    await waitFor(() => expect(f.result.current.userId).toBe("a"));
    const pending = deferred<{ error: Error | null }>();
    f.auth.signOut.mockReturnValueOnce(pending.promise);
    let logout!: Promise<void>;
    act(() => {
      logout = f.result.current.logout();
    });
    expect(f.result.current.userId).toBeNull();
    f.emit("a");
    expect(f.result.current.userId).toBeNull();
    await act(async () => {
      pending.resolve({ error: new Error("offline") });
      await logout;
    });
    expect(f.result.current.logoutPending).toBe(true);
    expect(f.result.current.error).toContain("saída");
    await act(async () => {
      await f.result.current.logout();
    });
    expect(f.result.current.logoutPending).toBe(false);
    expect(f.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("uses password login and reports failure without exposing server details", async () => {
    const f = fixture();
    f.auth.signInWithPassword.mockResolvedValue({ error: new Error("internal details") });
    await expect(f.result.current.login("demo@example.invalid", "test-only")).rejects.toThrow(
      "Não foi possível entrar",
    );
    expect(f.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "demo@example.invalid",
      password: "test-only",
    });
    expect(f.result.current.userId).toBeNull();
  });
});
