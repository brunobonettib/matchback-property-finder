import type { Combinacao, Imovel, Interessado, ResultadoCriterio } from "./types";

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const normaliza = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function avaliar(imovel: Imovel, p: Interessado): Combinacao {
  const finalidadeOk = imovel.finalidade === p.finalidade;
  const precoOk = imovel.preco <= p.orcamentoMaximo;
  const quartosOk = imovel.quartos >= p.quartosMinimos;
  const bairroOk = normaliza(imovel.bairro) === normaliza(p.bairroPreferido);

  const criterios: ResultadoCriterio[] = [
    {
      id: "finalidade", label: "Finalidade", obrigatorio: true, atendido: finalidadeOk,
      explicacao: finalidadeOk
        ? `Ambos buscam ${imovel.finalidade}.`
        : `Imóvel para ${imovel.finalidade}, interessado busca ${p.finalidade}.`,
    },
    {
      id: "preco", label: "Orçamento", obrigatorio: true, atendido: precoOk,
      explicacao: precoOk
        ? `Preço ${formatBRL(imovel.preco)} dentro do orçamento de ${formatBRL(p.orcamentoMaximo)}.`
        : `Preço ${formatBRL(imovel.preco)} ultrapassa o orçamento de ${formatBRL(p.orcamentoMaximo)} em ${formatBRL(imovel.preco - p.orcamentoMaximo)}.`,
    },
    {
      id: "quartos", label: "Quartos", obrigatorio: true, atendido: quartosOk,
      explicacao: quartosOk
        ? `${imovel.quartos} quarto(s), mínimo pedido: ${p.quartosMinimos}.`
        : `${imovel.quartos} quarto(s), abaixo do mínimo de ${p.quartosMinimos}.`,
    },
    {
      id: "bairro", label: "Bairro", obrigatorio: false, atendido: bairroOk,
      explicacao: bairroOk
        ? `Imóvel no bairro preferido (${p.bairroPreferido}).`
        : `Bairro diferente: imóvel em ${imovel.bairro}, preferência por ${p.bairroPreferido}.`,
    },
  ];

  return {
    interessado: p,
    compativel: finalidadeOk && precoOk && quartosOk,
    bairroCoincide: bairroOk,
    criterios,
  };
}

/** Compatible leads first; within them, neighborhood match ranks higher, then more recent contact. */
export function combinar(imovel: Imovel, interessados: Interessado[]): Combinacao[] {
  return interessados
    .map((p) => avaliar(imovel, p))
    .sort((a, b) => {
      if (a.compativel !== b.compativel) return a.compativel ? -1 : 1;
      if (a.bairroCoincide !== b.bairroCoincide) return a.bairroCoincide ? -1 : 1;
      return b.interessado.ultimoContato.localeCompare(a.interessado.ultimoContato);
    });
}

/** Days since last contact — shown separately, never mixed into compatibility. */
export function diasDesdeContato(iso: string, hoje: Date = new Date()): number {
  const d = new Date(iso + "T00:00:00");
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.max(0, Math.round((h.getTime() - d.getTime()) / 86400000));
}
