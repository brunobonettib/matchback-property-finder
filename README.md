# Matchback Property Finder

Crie o MVP de uma aplicação web chamada MatchBack AI, destinada a identificar oportunidades comerciais em imobiliárias.

Problema: relacionar imóveis disponíveis com interessados já cadastrados, permitindo recuperar possíveis oportunidades de venda ou locação.

Nesta primeira etapa, implemente apenas:

1. Um catálogo de 6 imóveis fictícios, contendo ID, título, bairro, finalidade (compra/aluguel), preço, quartos e status.

2. Uma carteira de 15 interessados fictícios, contendo ID, nome, finalidade, bairro preferido, orçamento máximo, quartos mínimos e data do último contato.

3. Um motor de compatibilidade que compare imóveis e interessados.

4. Uma tela que permita selecionar um imóvel e visualizar seus interessados compatíveis.

5. Uma explicação legível dos critérios atendidos e não atendidos para cada combinação.

6. Um formulário para adicionar um imóvel e recalcular as combinações imediatamente.

Regras obrigatórias:

- Finalidade deve coincidir.

- Preço não pode ultrapassar o orçamento máximo.

- Quantidade de quartos precisa atender ao mínimo solicitado.

- Correspondência de bairro melhora o ranking, mas bairros diferentes não devem ser apresentados como correspondência exata.

- Recência do contato deve ser mostrada separadamente da compatibilidade.

- Não inventar taxas de conversão nem pontuações de IA.

Tecnologias: React, TypeScript e Tailwind CSS.

Use dados fictícios locais nesta primeira versão. Estruture serviços e tipos para permitir futura integração com Supabase.

Visual: aplicação SaaS profissional, com dashboard limpo e foco em oportunidades comerciais.

Não implemente login, IA generativa, WhatsApp, Supabase ou n8n nesta etapa. Não simule integrações externas como se fossem reais.

Priorize código legível, regras testáveis e uma funcionalidade completa antes de adicionar recursos.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c82ab675-c625-570a-afa4-137d6e330a2c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
