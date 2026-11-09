import type { Imovel, Interessado } from "@/domain/types";

// Dados fictícios.
export const imoveisMock: Imovel[] = [
  { id: "IMV-001", titulo: "Apartamento com varanda gourmet", bairro: "Pinheiros", finalidade: "compra", preco: 850000, quartos: 2, status: "disponivel" },
  { id: "IMV-002", titulo: "Casa térrea com quintal", bairro: "Vila Mariana", finalidade: "compra", preco: 1200000, quartos: 3, status: "disponivel" },
  { id: "IMV-003", titulo: "Studio mobiliado próximo ao metrô", bairro: "Pinheiros", finalidade: "aluguel", preco: 3200, quartos: 1, status: "disponivel" },
  { id: "IMV-004", titulo: "Apartamento familiar", bairro: "Moema", finalidade: "aluguel", preco: 6500, quartos: 3, status: "reservado" },
  { id: "IMV-005", titulo: "Cobertura duplex", bairro: "Moema", finalidade: "compra", preco: 2400000, quartos: 4, status: "disponivel" },
  { id: "IMV-006", titulo: "Apartamento compacto reformado", bairro: "Centro", finalidade: "aluguel", preco: 2100, quartos: 1, status: "disponivel" },
];

export const interessadosMock: Interessado[] = [
  { id: "INT-001", nome: "Ana Ribeiro", finalidade: "compra", bairroPreferido: "Pinheiros", orcamentoMaximo: 900000, quartosMinimos: 2, ultimoContato: "2026-10-28" },
  { id: "INT-002", nome: "Bruno Carvalho", finalidade: "compra", bairroPreferido: "Vila Mariana", orcamentoMaximo: 1300000, quartosMinimos: 3, ultimoContato: "2026-06-14" },
  { id: "INT-003", nome: "Carla Mendes", finalidade: "aluguel", bairroPreferido: "Pinheiros", orcamentoMaximo: 3500, quartosMinimos: 1, ultimoContato: "2026-11-02" },
  { id: "INT-004", nome: "Diego Santos", finalidade: "aluguel", bairroPreferido: "Moema", orcamentoMaximo: 7000, quartosMinimos: 3, ultimoContato: "2026-03-20" },
  { id: "INT-005", nome: "Elaine Costa", finalidade: "compra", bairroPreferido: "Moema", orcamentoMaximo: 2500000, quartosMinimos: 3, ultimoContato: "2026-09-05" },
  { id: "INT-006", nome: "Felipe Araújo", finalidade: "compra", bairroPreferido: "Perdizes", orcamentoMaximo: 950000, quartosMinimos: 2, ultimoContato: "2026-08-11" },
  { id: "INT-007", nome: "Gabriela Lima", finalidade: "aluguel", bairroPreferido: "Centro", orcamentoMaximo: 2500, quartosMinimos: 1, ultimoContato: "2025-12-01" },
  { id: "INT-008", nome: "Henrique Rocha", finalidade: "compra", bairroPreferido: "Pinheiros", orcamentoMaximo: 700000, quartosMinimos: 2, ultimoContato: "2026-10-15" },
  { id: "INT-009", nome: "Isabela Martins", finalidade: "aluguel", bairroPreferido: "Vila Mariana", orcamentoMaximo: 4000, quartosMinimos: 1, ultimoContato: "2026-07-22" },
  { id: "INT-010", nome: "João Pereira", finalidade: "compra", bairroPreferido: "Vila Mariana", orcamentoMaximo: 1500000, quartosMinimos: 2, ultimoContato: "2026-01-30" },
  { id: "INT-011", nome: "Karina Alves", finalidade: "aluguel", bairroPreferido: "Moema", orcamentoMaximo: 6000, quartosMinimos: 2, ultimoContato: "2026-10-30" },
  { id: "INT-012", nome: "Lucas Ferreira", finalidade: "compra", bairroPreferido: "Moema", orcamentoMaximo: 3000000, quartosMinimos: 4, ultimoContato: "2026-05-18" },
  { id: "INT-013", nome: "Mariana Souza", finalidade: "aluguel", bairroPreferido: "Pinheiros", orcamentoMaximo: 2800, quartosMinimos: 1, ultimoContato: "2026-09-27" },
  { id: "INT-014", nome: "Nelson Oliveira", finalidade: "compra", bairroPreferido: "Centro", orcamentoMaximo: 600000, quartosMinimos: 1, ultimoContato: "2026-02-09" },
  { id: "INT-015", nome: "Olívia Barros", finalidade: "aluguel", bairroPreferido: "Centro", orcamentoMaximo: 3000, quartosMinimos: 2, ultimoContato: "2026-11-05" },
];
