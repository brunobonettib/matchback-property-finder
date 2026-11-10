import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Imovel } from "@/domain/types";
import { imoveisMock, interessadosMock } from "@/services/mock-data";

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  repository: { listarImoveis: vi.fn(), listarInteressados: vi.fn(), criarImovel: vi.fn() },
}));
vi.mock("@/services/supabase", () => ({ getSupabase: mocks.getClient }));
vi.mock("@/services/supabase-repository", () => ({
  createSupabaseRepository: () => mocks.repository,
}));
import { Route } from "@/routes/index";

const Page = Route.options.component!;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup(initialUser: string | null = "a") {
  let current = initialUser;
  let listener: Parameters<SupabaseClient["auth"]["onAuthStateChange"]>[0];
  const session = () => (current ? ({ user: { id: current } } as Session) : null);
  const client = {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        listener = callback;
        void listener("INITIAL_SESSION", session());
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getUser: vi.fn(async () => ({
        data: { user: current ? { id: current } : null },
        error: null,
      })),
      signInWithPassword: vi.fn(async () => {
        current = "a";
        void listener("SIGNED_IN", session());
        return { error: null };
      }),
      signOut: vi.fn(async () => {
        current = null;
        void listener("SIGNED_OUT", null);
        return { error: null };
      }),
    },
  };
  mocks.getClient.mockReturnValue(client);
  render(<Page />);
  return client;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.repository.listarImoveis.mockResolvedValue(imoveisMock);
  mocks.repository.listarInteressados.mockResolvedValue(interessadosMock);
});
afterEach(cleanup);

describe("Supabase UI", () => {
  it("requires login before loading private data", async () => {
    const client = setup(null);
    await screen.findByRole("button", { name: "Entrar" });
    expect(mocks.repository.listarImoveis).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "demo@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "test-only" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByRole("heading", { name: /Catálogo de imóveis/ });
    expect(client.auth.signInWithPassword).toHaveBeenCalledOnce();
    expect(mocks.repository.listarImoveis).toHaveBeenCalledOnce();
  });

  it("preserves input after failed save, prevents duplicate submissions and clears only on success", async () => {
    setup();
    await screen.findByPlaceholderText("Título");
    fireEvent.change(screen.getByPlaceholderText("Título"), { target: { value: "Novo teste" } });
    fireEvent.change(screen.getByPlaceholderText("Bairro"), { target: { value: "Estreito" } });
    fireEvent.change(screen.getByPlaceholderText("Preço (R$)"), { target: { value: "700000" } });
    fireEvent.change(screen.getByPlaceholderText("Quartos"), { target: { value: "2" } });
    const pending = deferred<Imovel>();
    mocks.repository.criarImovel.mockReturnValueOnce(pending.promise);
    const form = screen.getByPlaceholderText("Título").closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mocks.repository.criarImovel).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    await act(async () => pending.reject(new Error("offline")));
    expect(screen.getByRole("alert")).toHaveTextContent("campos foram preservados");
    expect(screen.getByPlaceholderText("Título")).toHaveValue("Novo teste");
    expect(screen.getByPlaceholderText("Preço (R$)")).toHaveValue(700000);
    mocks.repository.criarImovel.mockResolvedValue({
      ...imoveisMock[0],
      id: "IMV-new",
      titulo: "Novo teste",
    });
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByPlaceholderText("Título")).toHaveValue(""));
    expect(screen.getByRole("heading", { name: /Novo teste/ })).toBeInTheDocument();
  });

  it("shows a load failure instead of an empty catalogue and can retry", async () => {
    mocks.repository.listarInteressados.mockRejectedValueOnce(new Error("offline"));
    setup();
    await screen.findByRole("alert");
    expect(screen.queryByText(/Nenhum interessado atende/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByPlaceholderText("Título");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("discards pending reads after logout, even when the same account logs in again", async () => {
    const old = deferred<Imovel[]>();
    mocks.repository.listarImoveis.mockReturnValueOnce(old.promise);
    setup();
    await screen.findByText("Carregando imóveis e interessados…");
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await screen.findByRole("button", { name: "Entrar" });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "demo@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "test-only" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByPlaceholderText("Título");
    await act(async () => old.resolve([{ ...imoveisMock[0]!, titulo: "Resposta antiga" }]));
    expect(screen.queryByText(/Resposta antiga/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Apartamento no Estreito/ })).toBeInTheDocument();
  });

  it("shows missing configuration without accessing repositories", async () => {
    mocks.getClient.mockImplementation(() => {
      throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY");
    });
    render(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent("VITE_SUPABASE_URL");
    expect(mocks.repository.listarImoveis).not.toHaveBeenCalled();
  });
});
