// Data access layer. Today backed by local mock data; swap implementations for a database later
// keeping the same async interface.
import type { Imovel, Interessado } from "@/domain/types";
import { imoveisMock, interessadosMock } from "./mock-data";

export interface Repositorio {
  listarImoveis(): Promise<Imovel[]>;
  listarInteressados(): Promise<Interessado[]>;
  criarImovel(dados: Omit<Imovel, "id">): Promise<Imovel>;
}

let imoveis = [...imoveisMock];

export const repositorioLocal: Repositorio = {
  async listarImoveis() { return [...imoveis]; },
  async listarInteressados() { return [...interessadosMock]; },
  async criarImovel(dados) {
    const novo: Imovel = { ...dados, id: `IMV-${String(imoveis.length + 1).padStart(3, "0")}` };
    imoveis = [...imoveis, novo];
    return novo;
  },
};
