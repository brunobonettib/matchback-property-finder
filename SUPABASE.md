# Ambiente Supabase

Copie `.env.example` para `.env.local` (ignorado pelo Git) e configure:

- `VITE_SUPABASE_URL`: URL HTTPS do projeto externo.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável `sb_publishable_...`.

Reinicie `npm run dev` após configurar. Na hospedagem, configure as mesmas
variáveis de build e gere/publice um novo build. Valores `VITE_*` ficam públicos;
nunca configure chave secreta, service_role, senha ou token nessas variáveis.
As credenciais de login são informadas apenas no formulário.

Sem configuração válida, a aplicação mostra uma orientação e não acessa mocks.
O repositório local permanece disponível no código para testes, sem fallback.
O cliente Supabase é criado somente no navegador. A sessão é persistida pelo SDK,
validada pelo Auth e protegida no banco por RLS. O logout encerra a sessão local.

Após configurar, validar manualmente com a conta demo: login, 6 imóveis e 15
interessados, 19 combinações (3/3/1/5/5/2), refresh, cadastro e persistência em
outro navegador. Usar um novo registro de teste; não alterar os mocks persistidos.
Testar logout durante uma consulta e isolamento com uma segunda conta pela API.
Testes locais com mocks não comprovam as políticas remotas nem a conectividade.
Se uma gravação perder a resposta, conferir o catálogo antes de reenviar: o banco
pode ter confirmado o INSERT, mesmo sem confirmação recebida pelo navegador.
