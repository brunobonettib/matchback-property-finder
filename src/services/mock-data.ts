import type { Imovel, Interessado } from "@/domain/types";

// Dados de demonstração — totalmente fictícios, ambientados em Florianópolis/SC.
// Contatos usam o domínio reservado .invalid (RFC 2606) e não são utilizáveis.
export const imoveisMock: Imovel[] = [
  { id: "IMV-001", titulo: "Apartamento no Estreito", bairro: "Estreito", finalidade: "compra", preco: 720000, quartos: 2, status: "disponivel", demo: true },
  { id: "IMV-002", titulo: "Apartamento em Coqueiros", bairro: "Coqueiros", finalidade: "compra", preco: 950000, quartos: 3, status: "disponivel", demo: true },
  { id: "IMV-003", titulo: "Casa no Campeche", bairro: "Campeche", finalidade: "compra", preco: 1250000, quartos: 3, status: "disponivel", demo: true },
  { id: "IMV-004", titulo: "Apartamento na Trindade", bairro: "Trindade", finalidade: "aluguel", preco: 3200, quartos: 2, status: "disponivel", demo: true },
  { id: "IMV-005", titulo: "Apartamento no Itacorubi", bairro: "Itacorubi", finalidade: "compra", preco: 650000, quartos: 2, status: "disponivel", demo: true },
  { id: "IMV-006", titulo: "Apartamento no Centro", bairro: "Centro", finalidade: "aluguel", preco: 4500, quartos: 2, status: "disponivel", demo: true },
];

const c = (n: number) => `demo${String(n).padStart(2, "0")}@exemplo.invalid`;

export const interessadosMock: Interessado[] = [
  // Totalmente compatíveis (bairro coincide)
  { id: "INT-001", nome: "Aurora Valentim", contato: c(1), finalidade: "compra", bairroPreferido: "Estreito", orcamentoMaximo: 780000, quartosMinimos: 2, ultimoContato: "2026-10-27", demo: true },
  { id: "INT-002", nome: "Teodoro Brandalise", contato: c(2), finalidade: "compra", bairroPreferido: "Coqueiros", orcamentoMaximo: 1000000, quartosMinimos: 3, ultimoContato: "2026-09-14", demo: true },
  { id: "INT-003", nome: "Lívia Quaresma", contato: c(3), finalidade: "aluguel", bairroPreferido: "Trindade", orcamentoMaximo: 3500, quartosMinimos: 1, ultimoContato: "2026-11-03", demo: true },
  { id: "INT-004", nome: "Caetano Furlanetto", contato: c(4), finalidade: "compra", bairroPreferido: "Campeche", orcamentoMaximo: 1400000, quartosMinimos: 3, ultimoContato: "2026-08-02", demo: true },
  // Compatíveis, bairro diferente
  { id: "INT-005", nome: "Iolanda Prestes", contato: c(5), finalidade: "compra", bairroPreferido: "Santa Mônica", orcamentoMaximo: 800000, quartosMinimos: 2, ultimoContato: "2026-10-05", demo: true },
  { id: "INT-006", nome: "Bento Arruda", contato: c(6), finalidade: "aluguel", bairroPreferido: "Córrego Grande", orcamentoMaximo: 5000, quartosMinimos: 2, ultimoContato: "2026-07-19", demo: true },
  // Orçamento insuficiente
  { id: "INT-007", nome: "Marisol Tavernari", contato: c(7), finalidade: "compra", bairroPreferido: "Coqueiros", orcamentoMaximo: 820000, quartosMinimos: 3, ultimoContato: "2026-10-21", demo: true },
  { id: "INT-008", nome: "Otávio Lenzi", contato: c(8), finalidade: "aluguel", bairroPreferido: "Centro", orcamentoMaximo: 3800, quartosMinimos: 2, ultimoContato: "2026-09-30", demo: true },
  { id: "INT-009", nome: "Celeste Bortolini", contato: c(9), finalidade: "compra", bairroPreferido: "Campeche", orcamentoMaximo: 1100000, quartosMinimos: 3, ultimoContato: "2026-06-11", demo: true },
  // Finalidade incompatível
  { id: "INT-010", nome: "Rafael Gonzaga", contato: c(10), finalidade: "aluguel", bairroPreferido: "Itacorubi", orcamentoMaximo: 4000, quartosMinimos: 2, ultimoContato: "2026-10-12", demo: true },
  { id: "INT-011", nome: "Helena Sardagna", contato: c(11), finalidade: "compra", bairroPreferido: "Trindade", orcamentoMaximo: 700000, quartosMinimos: 2, ultimoContato: "2026-08-25", demo: true },
  // Contatos antigos (oportunidades de reativação), compatíveis
  { id: "INT-012", nome: "Fausto Remor", contato: c(12), finalidade: "compra", bairroPreferido: "Itacorubi", orcamentoMaximo: 700000, quartosMinimos: 2, ultimoContato: "2025-09-08", demo: true },
  { id: "INT-013", nome: "Jussara Pinheiro Lago", contato: c(13), finalidade: "aluguel", bairroPreferido: "Centro", orcamentoMaximo: 5200, quartosMinimos: 1, ultimoContato: "2025-11-20", demo: true },
  { id: "INT-014", nome: "Vicente Albuquerque Neto", contato: c(14), finalidade: "compra", bairroPreferido: "Estreito", orcamentoMaximo: 900000, quartosMinimos: 2, ultimoContato: "2025-07-02", demo: true },
  // Quartos insuficientes no imóvel
  { id: "INT-015", nome: "Noemi Cardozo", contato: c(15), finalidade: "compra", bairroPreferido: "Itacorubi", orcamentoMaximo: 800000, quartosMinimos: 3, ultimoContato: "2026-04-16", demo: true },
];
