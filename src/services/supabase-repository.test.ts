import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createSupabaseRepository, mapImovel, mapInteressado } from "./supabase-repository";
import { validateSupabaseConfig } from "./supabase";
import { combinar } from "@/domain/matching";
import { imoveisMock, interessadosMock } from "./mock-data";

const row = { ...imoveisMock[0], owner_id: "owner-a" };
function fixture() {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([row]), { status: 200 }));
  const client = createClient("https://example.supabase.co", "sb_publishable_test", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetcher },
  });
  const getUser = vi.spyOn(client.auth, "getUser").mockResolvedValue({
    data: { user: { id: "owner-a" } },
    error: null,
  } as Awaited<ReturnType<typeof client.auth.getUser>>);
  return { fetcher, getUser, repository: createSupabaseRepository(client, "owner-a") };
}

describe("Supabase repository", () => {
  it("maps snake_case, numeric values and null contacts without leaking owner_id", () => {
    const mapped = mapInteressado({
      id: "INT-001",
      nome: "Aurora Valentim",
      finalidade: "compra",
      bairro_preferido: "Estreito",
      orcamento_maximo: "780000.00",
      quartos_minimos: 2,
      ultimo_contato: "2026-10-27",
      contato: null,
      demo: true,
      owner_id: "owner-a",
    });
    expect(mapped).toEqual({
      id: "INT-001",
      nome: "Aurora Valentim",
      finalidade: "compra",
      bairroPreferido: "Estreito",
      orcamentoMaximo: 780000,
      quartosMinimos: 2,
      ultimoContato: "2026-10-27",
      demo: true,
    });
    expect(mapImovel({ ...row, preco: "720000.00" })).toEqual(imoveisMock[0]);
    expect(() => mapImovel({ ...row, preco: "NaN" })).toThrow();
  });

  it("preserves the 90 pairs, counts, ranking and explanations after mapping", () => {
    const properties = imoveisMock.map(mapImovel);
    const leads = interessadosMock.map((p) =>
      mapInteressado({
        id: p.id,
        nome: p.nome,
        finalidade: p.finalidade,
        bairro_preferido: p.bairroPreferido,
        orcamento_maximo: p.orcamentoMaximo,
        quartos_minimos: p.quartosMinimos,
        ultimo_contato: p.ultimoContato,
        contato: p.contato,
        demo: p.demo,
      }),
    );
    const matrix = properties.map((p) => combinar(p, leads));
    expect(matrix.flat()).toHaveLength(90);
    expect(matrix.map((matches) => matches.filter((m) => m.compativel).length)).toEqual([
      3, 3, 1, 5, 5, 2,
    ]);
    expect(matrix.flat().filter((m) => m.compativel)).toHaveLength(19);
    expect(matrix).toEqual(imoveisMock.map((p) => combinar(p, interessadosMock)));
  });

  it("filters reads by verified owner and orders IDs", async () => {
    const { repository, fetcher } = fixture();
    expect(await repository.listarImoveis()).toEqual([imoveisMock[0]]);
    const url = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(url.searchParams.get("owner_id")).toBe("eq.owner-a");
    expect(url.searchParams.get("order")).toBe("id.asc");
  });

  it("does not access tables without a valid matching user", async () => {
    const { repository, getUser, fetcher } = fixture();
    getUser.mockResolvedValue({ data: { user: null }, error: null } as unknown as Awaited<
      ReturnType<typeof getUser>
    >);
    await expect(repository.listarImoveis()).rejects.toThrow("Sessão inválida");
    getUser.mockResolvedValue({ data: { user: { id: "owner-b" } }, error: null } as Awaited<
      ReturnType<typeof getUser>
    >);
    await expect(repository.listarInteressados()).rejects.toThrow("Sessão inválida");
    await expect(repository.criarImovel(imoveisMock[0]!)).rejects.toThrow("Sessão inválida");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("inserts only allowed fields and returns the confirmed database ID", async () => {
    const { repository, fetcher } = fixture();
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ ...row, id: "IMV-database-id" }), { status: 201 }),
    );
    const result = await repository.criarImovel({
      ...imoveisMock[0]!,
      owner_id: "owner-b",
    } as (typeof imoveisMock)[number]);
    const request = fetcher.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(request.method).toBe("POST");
    expect(body.owner_id).toBe("owner-a");
    expect(body).not.toHaveProperty("id");
    expect(result.id).toBe("IMV-database-id");
  });

  it("propagates read/write failures without mock fallback or raw backend details", async () => {
    const { repository, fetcher } = fixture();
    fetcher.mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: "private backend detail" }), { status: 403 }),
    );
    await expect(repository.listarInteressados()).rejects.toThrow("Não foi possível carregar");
    await expect(repository.criarImovel(imoveisMock[0]!)).rejects.toThrow(
      "Não foi possível confirmar",
    );
  });
});

describe("public configuration", () => {
  it("rejects missing, privileged or non-public keys and insecure URLs", () => {
    expect(() => validateSupabaseConfig("", "")).toThrow("Configure");
    expect(() =>
      validateSupabaseConfig("https://example.supabase.co", "sb_secret_invalid"),
    ).toThrow("publicável");
    expect(() =>
      validateSupabaseConfig("https://example.supabase.co", "not-a-publishable-key"),
    ).toThrow();
    expect(() =>
      validateSupabaseConfig("http://example.supabase.co", "sb_publishable_test"),
    ).toThrow("HTTPS");
    expect(() =>
      validateSupabaseConfig("https://example.supabase.co", "sb_publishable_test"),
    ).not.toThrow();
  });
});
