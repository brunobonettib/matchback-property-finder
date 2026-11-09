import { describe, expect, it } from "vitest";
import { avaliar, combinar, diasDesdeContato } from "./matching";
import type { Imovel, Interessado } from "./types";

const imovel: Imovel = { id: "i", titulo: "T", bairro: "Centro", finalidade: "compra", preco: 500000, quartos: 2, status: "disponivel" };
const base: Interessado = { id: "p", nome: "N", finalidade: "compra", bairroPreferido: "Centro", orcamentoMaximo: 500000, quartosMinimos: 2, ultimoContato: "2026-01-01" };

describe("motor de compatibilidade", () => {
  it("finalidade diferente torna incompatível", () => {
    expect(avaliar(imovel, { ...base, finalidade: "aluguel" }).compativel).toBe(false);
  });
  it("preço acima do orçamento torna incompatível; igual é aceito", () => {
    expect(avaliar(imovel, { ...base, orcamentoMaximo: 499999 }).compativel).toBe(false);
    expect(avaliar(imovel, base).compativel).toBe(true);
  });
  it("quartos abaixo do mínimo torna incompatível", () => {
    expect(avaliar(imovel, { ...base, quartosMinimos: 3 }).compativel).toBe(false);
  });
  it("bairro diferente continua compatível mas não é correspondência de bairro", () => {
    const r = avaliar(imovel, { ...base, bairroPreferido: "Moema" });
    expect(r.compativel).toBe(true);
    expect(r.bairroCoincide).toBe(false);
  });
  it("bairro coincidente vem antes no ranking", () => {
    const r = combinar(imovel, [{ ...base, id: "a", bairroPreferido: "Moema", ultimoContato: "2026-12-01" }, { ...base, id: "b" }]);
    expect(r.map((c) => c.interessado.id)).toEqual(["b", "a"]);
  });
  it("recência é calculada em dias", () => {
    expect(diasDesdeContato("2026-11-01", new Date(2026, 10, 9))).toBe(8);
  });
});
