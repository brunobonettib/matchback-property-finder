// Domain types. Field names mirror future database columns (snake_case mapping happens in services).
export type Finalidade = "compra" | "aluguel";
export type StatusImovel = "disponivel" | "reservado" | "vendido" | "alugado";

export interface Imovel {
  id: string;
  titulo: string;
  bairro: string;
  finalidade: Finalidade;
  preco: number;
  quartos: number;
  status: StatusImovel;
  demo?: boolean; // demonstration record
}

export interface Interessado {
  id: string;
  nome: string;
  finalidade: Finalidade;
  bairroPreferido: string;
  orcamentoMaximo: number;
  quartosMinimos: number;
  ultimoContato: string; // ISO date (YYYY-MM-DD)
  contato?: string; // demo contacts use non-deliverable .invalid addresses
  demo?: boolean;
}

export type CriterioId = "finalidade" | "preco" | "quartos" | "bairro";

export interface ResultadoCriterio {
  id: CriterioId;
  label: string;
  obrigatorio: boolean;
  atendido: boolean;
  explicacao: string;
}

export interface Combinacao {
  interessado: Interessado;
  compativel: boolean; // all mandatory criteria met
  bairroCoincide: boolean;
  criterios: ResultadoCriterio[];
}
