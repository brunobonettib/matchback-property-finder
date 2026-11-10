# MatchBack AI

Aplicação para imobiliárias que cruza imóveis cadastrados com uma carteira de interessados, ajudando a recuperar oportunidades de venda e locação entre contatos antigos.

O motor usa **matching baseado em regras**, determinístico e explicável. Apesar do nome do produto, não há IA generativa nem integração com LLM implementada. Os dados demonstrativos são fictícios.

## Funcionalidades implementadas

- Login com e-mail e senha, restauração de sessão e logout via Supabase Auth.
- Catálogo de imóveis e consulta à carteira de interessados persistidos no Supabase.
- Seleção de imóvel para visualizar interessados compatíveis e, opcionalmente, incompatíveis.
- Explicação dos critérios atendidos e não atendidos em cada combinação.
- Cadastro de imóvel com validação, persistência e recálculo das combinações na interface.
- Exibição do tempo desde o último contato, separado da compatibilidade.
- Tratamento de carregamento, falhas de consulta e confirmação de gravação.

## Regras de compatibilidade

As funções puras de [src/domain/matching.ts](src/domain/matching.ts) concentram as regras; a interface consome seus resultados.

| Critério | Regra |
| --- | --- |
| Finalidade (obrigatório) | Compra ou aluguel deve coincidir. |
| Orçamento (obrigatório) | Preço do imóvel deve ser menor ou igual ao orçamento máximo. |
| Quartos (obrigatório) | Quantidade de quartos deve atender ao mínimo solicitado. |
| Bairro (preferência) | Coincidência melhora a ordenação; bairro diferente não exclui o interessado nem é apresentado como coincidência. |

A comparação de bairros ignora acentos, diferenças de maiúsculas e espaços nas extremidades. A ordenação coloca compatíveis primeiro, depois prioriza coincidência de bairro e usa o contato mais recente como desempate. A recência não altera a elegibilidade. Não há pontuação gerada por IA.

## Tecnologias e arquitetura

```text
React / TypeScript → Supabase → n8n Cloud
 interface e regras   Auth e     recebe e transforma
 de matching         PostgreSQL eventos INSERT
```

| Componente | Responsabilidade |
| --- | --- |
| React, TypeScript e Tailwind CSS | Interface, formulários e apresentação dos resultados. |
| TanStack Start / Router e Vite | Estrutura da aplicação, roteamento e build. |
| Supabase PostgreSQL e Auth | Persistência, autenticação e controle de acesso com RLS no ambiente configurado. |
| Zod | Validação e transformação dos dados no adaptador de persistência. |
| n8n Cloud | Processamento do evento enviado pelo Database Webhook do Supabase. |
| Vitest e Testing Library | Testes do domínio, adaptador, autenticação e interface. |

A interface foi iniciada no Lovable. O acesso aos dados passa pelo contrato `Repositorio`, em [src/services/repository.ts](src/services/repository.ts), implementado pelo adaptador Supabase. O repositório local e os mocks permanecem disponíveis para testes; a aplicação não usa fallback para mocks quando o Supabase está indisponível.

## Execução local

Pré-requisitos: Node.js e npm (verificações locais executadas com Node.js 24), acesso a um projeto Supabase já configurado e uma conta de autenticação existente. As tabelas `imoveis` e `interessados`, suas colunas e políticas RLS devem corresponder ao [adaptador Supabase](src/services/supabase-repository.ts). Este repositório não provisiona o banco automaticamente; alterações de schema são gerenciadas pelo Lovable.

```sh
git clone https://github.com/brunobonettib/matchback-property-finder.git
cd matchback-property-finder
npm install
```

O projeto também mantém `bun.lock`; com Bun disponível, `bun install --frozen-lockfile` usa esse lockfile. A instalação por npm resolve as versões permitidas no `package.json`.

Copie `.env.example` para `.env.local` e preencha os valores do seu projeto:

```dotenv
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUA_PELA_CHAVE_PUBLICAVEL
```

As duas variáveis são configuração pública do cliente. Nunca coloque senhas, chaves secretas, `service_role` ou o segredo de Header Auth em variáveis `VITE_*`: elas são incorporadas ao código enviado ao navegador. `.env.local` é ignorado pelo Git. Credenciais de login são informadas apenas no formulário.

```sh
npm run dev
```

Abra o endereço exibido pelo Vite e entre com a conta configurada. Reinicie o servidor após alterar o ambiente. Sem configuração válida, a aplicação exibe uma orientação. Os dados fictícios locais não são carregados automaticamente no banco. Consulte [SUPABASE.md](SUPABASE.md) para detalhes operacionais.

## Integração com n8n

O fluxo Supabase → n8n foi validado em produção: um Database Webhook envia eventos `INSERT` de imóveis ao workflow no n8n Cloud, protegido por Header Auth. O workflow recebe o evento, valida a tabela e transforma os dados do imóvel.

Essa configuração é externa ao repositório. O endpoint e o segredo do webhook são mantidos nos serviços envolvidos, sem exposição no frontend. Não há notificação automática para corretores, integração com LLM ou execução do motor de matching pelo n8n implementadas. O matching apresentado na interface é executado pelas funções TypeScript do domínio.

## Roadmap de Evolução — Visão de Produto

As três fases abaixo são **planejadas, ainda não implementadas**. Partem do MVP com matching determinístico e integração Supabase → n8n validada para receber, validar e transformar eventos. O MatchBack AI é concebido como complemento ao CRM imobiliário existente, sem exigir sua substituição. Esta visão não representa uma implantação em uma imobiliária; os benefícios esperados são hipóteses a validar, sem promessa de conversão.

### Fase 1 — Automação comercial (prioridade alta)

**Objetivo:** transformar novos cadastros em oportunidades acionáveis para a equipe comercial.

**Entregas previstas:**

- Executar o matching automaticamente no backend após novos cadastros, reutilizando as regras de elegibilidade do domínio.
- Enviar oportunidades compatíveis ao n8n, notificar corretores por canais internos e criar tarefas de acompanhamento.
- Evitar processamento e tarefas duplicados, tratar falhas e registrar eventos para acompanhamento operacional.

**Benefício comercial esperado:** reduzir a identificação manual de oportunidades e facilitar o acompanhamento dos interessados pela equipe.

### Fase 2 — IA generativa e experiência comercial

**Objetivo:** apoiar a preparação do atendimento e facilitar a consulta às oportunidades, preservando critérios objetivos de elegibilidade.

**Entregas previstas:**

- Assistente para gerar rascunhos personalizados de contato com interessados, com revisão humana antes de qualquer mensagem externa.
- Busca em linguagem natural convertida em filtros estruturados e resumos explicáveis das oportunidades, fundamentados nos dados e critérios do matching.
- Avaliar integração com LLMs via API ou modelos locais, considerando custo, privacidade e desempenho.
- Manter as regras determinísticas como fonte de verdade para elegibilidade; a IA generativa apoiará a comunicação e a consulta, sem redefinir quem é compatível.

**Benefício comercial esperado:** diminuir o esforço de preparação dos contatos e tornar as informações mais acessíveis aos corretores, mantendo supervisão humana.

### Fase 3 — Integração e escala

**Objetivo:** conectar a recuperação de oportunidades à rotina comercial e ampliar o uso conforme a necessidade das equipes.

**Entregas previstas:**

- Integrar o CRM imobiliário existente, conforme as APIs disponíveis, e sincronizar imóveis e interessados sem duplicações.
- Incorporar histórico de atendimentos e acompanhamento do funil comercial.
- Criar dashboards e indicadores de oportunidades, atendimentos e conversões, com base nos registros efetivamente disponíveis.
- Avaliar agentes de IA com ferramentas e ações sujeitas à aprovação humana.
- Evoluir perfis de acesso, auditoria e observabilidade, com requisitos de privacidade e tratamento de dados alinhados à LGPD.
- Suportar múltiplas equipes conforme a necessidade, com separação de acesso aos dados.

**Benefício comercial esperado:** dar continuidade ao atendimento entre sistemas e oferecer visibilidade da operação para orientar decisões de gestão.

## Testes e build

```sh
npm test
npm run test:watch
node node_modules/typescript/bin/tsc --noEmit
npm run build
npm run preview
```

O TypeScript usa o `tsconfig.json` existente; não há script dedicado de typecheck no `package.json`. A suíte cobre:

- Regras obrigatórias, preferência de bairro, ordenação e recência.
- Mapeamento de dados Supabase, validação de configuração pública, filtragem por usuário e tratamento de falhas.
- Ciclo de autenticação, logout e descarte de respostas de sessões anteriores.
- Roteamento, proteção da interface, falhas de consulta e submissão do formulário.

Os testes de integração da interface e do adaptador usam mocks: não comprovam conectividade, políticas RLS remotas nem execução do workflow n8n. O build usa a configuração existente do Lovable/TanStack e Nitro, com destino Cloudflare; configure as variáveis públicas no ambiente de build da hospedagem.

## Dados de demonstração

Imóveis, nomes e contatos demonstrativos são fictícios. Os contatos dos mocks usam o domínio reservado `.invalid`. O projeto demonstra recuperação de oportunidades por critérios objetivos, sem alegações de conversão ou métricas comerciais.
