# Prontidão operacional para piloto controlado

## Configuração obrigatória

- `DATABASE_URL`: URL PostgreSQL de produção ou homologação.
- `AUTH_SECRET`: segredo aleatório com no mínimo 32 caracteres. Não expor no cliente.
- `BUSINESS_TIMEZONE`: deve ser `America/Manaus`.
- `NODE_ENV`: `production` em produção.

O deploy deve falhar se qualquer variável obrigatória estiver ausente.

## Matriz de autorização

| Capacidade | OWNER | MANAGER | ATTENDANT | DELIVERY |
| --- | --- | --- | --- | --- |
| Admin | permitido | limitado | negado | negado |
| Produtos | permitido | permitido conforme operação | leitura operacional | negado |
| Preços | permitido | permitido conforme operação | negado | negado |
| PDV | permitido | permitido | permitido | negado |
| Pedidos | permitido | permitido | operacional | somente entregas atribuídas |
| Estoque | permitido | permitido | leitura limitada | negado |
| Ajustar estoque | permitido | permitido | negado | negado |
| Clientes | permitido | permitido | mínimo necessário para pedido | negado |
| Gestão de delivery | permitido | permitido | limitado | somente atribuídas |
| Relatórios | permitido | permitido | limitado | negado |

`OWNER` e `MANAGER` são papéis de escopo empresarial. `ATTENDANT` e `DELIVERY` devem respeitar as filiais em `UserBranchAccess`.

## Autenticação

- Senhas são armazenadas com bcrypt.
- Sessões usam token aleatório, cookie `httpOnly`, `sameSite=lax`, `secure` em produção e expiração.
- Logout revoga a sessão no banco e expira o cookie.
- Usuários desativados não autenticam e sessões existentes deixam de ser aceitas.
- Não registrar senhas, cookies, tokens ou segredos em logs.
- Formulários internos dependem de cookie `sameSite=lax` e server actions. Para exposição pública maior, adicionar token CSRF por formulário antes de ampliar o piloto.

## Migrations

Procedimento:

1. Fazer backup do banco.
2. Aplicar `npx prisma migrate deploy`.
3. Executar verificação de saúde.
4. Validar login interno e catálogo público.

Nunca usar `prisma db push` em produção.

## Backup e restauração

Recomendação mínima para piloto:

- backup diário com `pg_dump`;
- backup manual antes de cada migration;
- retenção de pelo menos 7 dias;
- teste de restauração em banco separado antes de depender do procedimento.

Exemplo de backup:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backup-deliveryreg.dump
```

Exemplo de restore em banco novo:

```bash
pg_restore --dbname "$DATABASE_URL_RESTORE" --clean --if-exists backup-deliveryreg.dump
```

Rollback:

- erro antes de migration: abortar deploy;
- erro depois de migration sem escrita comercial relevante: restaurar backup;
- erro depois de vendas reais: pausar operação, exportar pedidos/movimentos recentes, decidir correção forward ou restore assistido.

## Bootstrap de produção

Não usar credenciais do seed em produção.

Procedimento seguro:

1. Criar empresa.
2. Criar Filial 1.
3. Criar Filial 2.
4. Criar OWNER inicial com senha gerada de forma segura no momento da implantação.
5. Exigir troca de senha operacional conforme política da empresa.
6. Criar MANAGER, ATTENDANT e DELIVERY necessários com acesso explícito por filial.

## QR por filial

Convenção:

- Filial Centro: `/catalogo?source=qr-centro-01`
- Filial Ponta Negra: `/catalogo?source=qr-ponta-negra-01`

Cada unidade física deve ter códigos independentes. Quando o domínio final existir, gerar QR apontando para:

```text
https://DOMINIO/catalogo?source=CODIGO_DA_UNIDADE
```

## Observabilidade do piloto

Monitorar diariamente:

- falhas de login;
- falhas de criação/conclusão de pedido;
- conflitos de estoque;
- falhas de delivery;
- exceções inesperadas.

Guia rápido para operador:

- Sessão expirada: entrar novamente.
- Pedido já finalizado: atualizar tela antes de tentar de novo.
- Estoque insuficiente: conferir saldo e registrar ajuste apenas se autorizado.
- Entrega sem entregador: gestor deve atribuir entregador ativo da filial.
- Erro persistente: anotar horário, usuário, pedido e ação realizada; acionar suporte técnico sem compartilhar senha.

## Sprint 9 — E2E Production Gate

Ambiente utilizado:

- Next.js em build de produção via `next build` e `next start`.
- Playwright `1.62.1`.
- Navegador: Chromium `151.0.7922.34`.
- PostgreSQL real em banco isolado `deliveryreg_e2e`.
- Banco preparado por `npm run test:e2e:setup`, com `prisma migrate deploy` e seed E2E determinístico.
- Não houve CI configurado no repositório; execução documentada para ambiente local/homologação.

Comandos para reproduzir:

```bash
npm run test:e2e:setup
npm run test:e2e
npm run lint
npm run typecheck
npm test
npm run test:postgres
npx prisma validate
npm run build
```

Testes Playwright:

- Total: 13.
- Aprovados: 13.
- Falhos: 0.
- Browser artifacts configurados: trace, screenshot e vídeo retidos em falha.

Jornadas validadas:

- Catálogo público por QR E2E usando `origem=qr-e2e-a1`.
- Produto por unidade, carrinho, checkout e criação de pedido.
- Produto por peso com preço de R$ 42/kg, solicitado 500 g, peso real 518 g, estimado R$ 21,00 e final R$ 21,76.
- Login válido, login inválido, logout, sessão revogada e usuário inativo.
- RBAC para OWNER, MANAGER, ATTENDANT e DELIVERY.
- Isolamento de filial para usuário operacional restrito à A1.
- Isolamento multiempresa contra recurso da Business B.
- PDV com pagamento PIX e baixa de estoque.
- Estoque insuficiente no PDV.
- Proteção contra duplicidade por refresh após conclusão.
- Delivery com atribuição, reatribuição, visibilidade por courier e auditoria `DELIVERY_ASSIGNED`/`DELIVERY_REASSIGNED`.
- Mobile público em 360px, 390px e 430px sem overflow horizontal.

Bugs encontrados e corrigidos:

- Páginas operacionais exibiam opções/dados de filiais fora do escopo para usuários restritos; corrigido filtro por `branchIds` em operação, PDV e estoque.
- Acesso administrativo sem sessão/revogado não tinha redirecionamento comum antes das páginas internas; adicionado layout do grupo administrativo para redirecionar autenticação ausente/revogada para `/login`.

Pendências:

- Criar workflow de CI para executar Playwright e publicar artifacts de falha.
- Melhorar UX de erro em Server Actions administrativas negativas; hoje o bloqueio ocorre no servidor, mas a apresentação visual ainda depende do erro padrão do Next.js em algumas tentativas não autorizadas.

Resultado final:

- `lint`: PASS.
- `typecheck`: PASS.
- unit/contrato: 34/34 PASS.
- PostgreSQL integração/concorrência: 9/9 PASS.
- Prisma validate: PASS.
- build de produção: PASS.
- E2E Playwright: 13/13 PASS.

Classificação Sprint 9: GREEN.

## Sprint 10 — Compatibilidade de QR público

Retomada aplicada:

- Catálogo público aceita `?source=CODIGO_DA_UNIDADE` e `?origem=CODIGO_DA_UNIDADE`.
- `origem` permanece como parâmetro canônico nas navegações internas entre catálogo, busca e produto.
- Quando os dois parâmetros são enviados, `origem` tem precedência.
- E2E público principal entra pelo formato documentado `source`.

Validações executadas:

- `npm test`: PASS, 35/35 testes unitários/contrato ativos.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS com variáveis obrigatórias definidas para ambiente local.

Pendências remanescentes:

- Criar workflow de CI para executar Playwright e publicar artifacts de falha.
- Melhorar UX de erro em Server Actions administrativas negativas.

## Sprint 11A — Cardápio digital e Central de Pedidos

Funcionalidades implementadas:

- `/catalogo` virou uma vitrine pública mobile-first com nome da empresa, unidade resolvida pelo QR, busca, categorias horizontais, cards comerciais, preço por unidade/base e CTA de carrinho.
- `/produto/[slug]` passou a exibir imagem quando cadastrada, empresa, unidade, categoria, descrição, preço, unidade de medida, mínimo de pedido e aviso para produtos por peso.
- `/carrinho` preserva `origem`, mantém a unidade do QR quando a fonte aponta para uma filial e continua criando pedido pela API pública existente.
- `/operacao` virou uma central operacional com colunas por status real (`CREATED`, `ACCEPTED`, `PREPARING`, `READY`), prioridade visual para novos pedidos, tempo aguardando, itens, totais, cliente, telefone, delivery, endereço, histórico e ações server-side.
- A Central usa polling simples por `router.refresh()` a cada 15 segundos, pausado quando a aba não está visível.
- Produtos por peso agora não podem avançar para `READY` sem confirmação de peso real no domínio (`transitionOperationalOrder`).

Decisões arquiteturais:

- Não houve alteração de schema.
- A origem pública continua usando `src/modules/leads/source.ts`; `origem` permanece canônico e tem precedência sobre `source`.
- O catálogo manteve Server Components; apenas CTAs de carrinho e resumo sticky usam Client Components pequenos.
- O checkout continua reprecificando no servidor por `createPickupOrder`/`priceOrderItem`; estimativas no cliente são apenas UX.
- A Central lê dados por `src/modules/orders/operation-board.ts`, com `businessId` e `branchId` vindos do contexto autenticado.
- Transições continuam passando por `transitionOperationalOrder`, `confirmActualWeight` e `completeOrder`; nenhuma atualização direta de status foi adicionada na UI.
- Atribuição e fluxo detalhado de entregadores permanecem em `/entregas`; `/operacao` mostra dados e direciona para a tela autorizada.

Validações executadas:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 35/35 testes unitários/contrato ativos.
- `npm run test:postgres`: PASS, 9/9 testes PostgreSQL.
- `DATABASE_URL=... npx prisma validate`: PASS.
- `npm run build`: PASS.
- `npm run test:e2e`: PASS, 14/14 testes Playwright.

Testes atualizados:

- `tests/postgres-commercial.test.ts` passou a confirmar peso real antes de marcar pedidos ponderados como prontos.
- `e2e/specs/public-order.spec.ts` adicionou jornada completa: admin confirma produto, cliente entra por QR/source, vê produto, adiciona ao carrinho, faz checkout, pedido aparece em `/operacao`, atendente executa transições e conclui.
- `e2e/specs/operation-weighing.spec.ts` foi escopado ao card do pedido criado para evitar interferência entre pedidos pendentes da suíte.

Limitações conhecidas:

- Server Actions administrativas ainda usam o tratamento padrão do Next.js para erros não autorizados em alguns fluxos negativos.
- Polling de 15 segundos é suficiente para piloto; realtime externo não foi introduzido.
- Imagens dependem de `imageUrl` já cadastrado; o sistema não inventa assets quando o banco não possui imagem.

## Sprint 11B — Operational UX Hardening

Funcionalidades implementadas:

- Server Actions administrativas passaram a retornar resultado seguro `{ ok, message, code }` para fluxos operacionais.
- Erros esperados de domínio (`AppError`) são convertidos em mensagens compreensíveis por operação.
- Erros inesperados continuam registrados no servidor via `console.error`, mas a interface recebe mensagem genérica segura.
- `/operacao`, `/estoque`, `/entregas` e `/pdv` passaram a exibir pending, sucesso e erro inline próximos da ação.
- Polling da Central continua em 15 segundos, mas evita refresh durante submissão (`aria-busy="true"`) e refresca ao voltar para a aba.
- Pesagem pendente ficou explícita e bloqueia visualmente a ação de pronto, com texto orientando o operador.
- Estoque ganhou estado vazio e layout responsivo sem grid de 7 colunas comprimido no mobile.
- Entregas ganharam estado vazio orientado e feedback inline em atribuição/transições.
- PDV passou a usar idempotency key estável por montagem do formulário cliente.
- Produtos sem imagem usam fallback visual local, responsivo e acessível.

Decisões arquiteturais:

- Nenhuma regra de domínio foi movida para frontend.
- Nenhum schema/migration foi adicionado.
- As proteções server-side de RBAC, tenant, filial, idempotência, estoque ledger, delivery e state machine foram preservadas.
- O wrapper administrativo de form é client-side localizado e recebe Server Actions existentes; páginas continuam majoritariamente server-rendered.

Testes atualizados:

- `e2e/specs/operation-weighing.spec.ts` adicionou cenário negativo: pedido por peso em preparo não permite avançar sem pesagem e mostra mensagem compreensível.
- `e2e/specs/pos-delivery.spec.ts` atualizou o contrato do estado vazio de entregas.

Validações executadas:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 35/35 testes unitários/contrato ativos.
- `npm run test:postgres`: PASS, 9/9 testes PostgreSQL.
- `DATABASE_URL=... npx prisma validate`: PASS.
- `npm run build`: PASS.
- `npm run test:e2e`: PASS, 15/15 testes Playwright.

Limitações conhecidas:

- Logs de testes negativos ainda mostram `AppError` no servidor, o que preserva observabilidade; a UI operacional agora recebe feedback seguro nos fluxos cobertos por Server Actions administrativas.
- O feedback inline permanece local ao formulário; não foi introduzido sistema global de toast nesta sprint.

## Sprint 12 — CI Production Gate

Funcionalidades implementadas:

- Adicionado workflow GitHub Actions em `.github/workflows/production-gate.yml`.
- O gate roda em `push` para `main`/`master` e em `pull_request`.
- O job sobe PostgreSQL 16 com o mesmo `E2E_DATABASE_URL` usado pelos scripts locais.
- O banco E2E é preparado com migrations Prisma e seed determinístico via `npm run test:e2e:setup`.
- O pipeline executa lint, typecheck, testes unitários/contrato, testes PostgreSQL, `prisma validate`, build de produção e Playwright E2E.
- Relatório HTML do Playwright e artifacts de falha em `test-results` são publicados sempre, com retenção de 7 dias.

Decisões arquiteturais:

- Os scripts locais existentes foram preservados.
- O workflow declara variáveis obrigatórias de produção em valores de teste, sem depender de segredos reais.
- A instalação do cliente PostgreSQL é explícita porque o setup E2E usa `psql` e `createdb`.
- O Playwright é executado depois do build para reutilizar o `webServer` já configurado em `playwright.config.ts`.

Validações locais executadas:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 37/37 testes unitários/contrato ativos e 10 PostgreSQL pulados nesse comando.
- `npm run test:e2e:setup`: PASS com PostgreSQL 16 local em `localhost:55438`.
- `npm run test:postgres`: PASS, 10/10 testes PostgreSQL.
- `DATABASE_URL=... npx prisma validate`: PASS.
- `npm run build`: PASS.
- `npx playwright test`: PASS, 16/16 testes Playwright.

Pendências remanescentes:

- Melhorar UX de erro em Server Actions administrativas negativas que ainda não passam pelo wrapper inline.

## Sprint 13 — Dashboard gerencial e resumo operacional

Funcionalidades implementadas:

- `/painel` passou a ser cockpit gerencial do dia, focado em vendas reconhecidas, pedidos concluídos, ticket médio, operação agora, deliveries em andamento e exceções de estoque sem saldo.
- `/gestao` passou a permitir análise por período (`Hoje`, `Ontem`, `7 dias`, `30 dias`, `Personalizado`) e por filial autorizada.
- A página de gestão apresenta comparação com período anterior de mesma duração, evolução diária simples, ranking de produtos, pagamentos registrados, vendas por filial, canais, clientes e resumo operacional do período.
- Login direciona `OWNER`/`MANAGER` para `/painel`, `ATTENDANT` para `/operacao` e `DELIVERY` para `/entregas`, preservando a separação entre cockpit gerencial e operação.

Semântica gerencial adotada:

- Venda reconhecida: `Order.status = COMPLETED` dentro do período pelo campo `completedAt`.
- Receita/faturamento operacional: soma de `Order.totalCents` apenas de pedidos `COMPLETED`; a interface usa “vendas reconhecidas” para não prometer fechamento contábil.
- Pedido válido para ticket médio: pedido `COMPLETED` no período e escopo de filial autorizado.
- Ticket médio: `vendas reconhecidas / pedidos concluídos`, com resultado ausente quando não há pedido concluído.
- Pedido cancelado: `Order.status = CANCELLED` com `cancelledAt` dentro do período; não entra em venda nem ticket.
- Pagamento: registro em `Payment`, agregado por `createdAt`, `method` e `amountCents`; mostrado como “pagamentos registrados”, sem assumir equivalência contábil com receita.
- Diferença entre vendas reconhecidas e pagamentos registrados é exibida como observação operacional e nunca corrigida automaticamente.

Períodos e timezone:

- Todas as janelas temporais são semiabertas (`gte from`, `lt to`).
- Limites de dia são calculados para `BUSINESS_TIMEZONE=America/Manaus`, não pelo timezone local do servidor.
- Período anterior sempre tem a mesma duração do período atual.
- Quando o período anterior tem zero vendas, a comparação mostra “Sem base anterior” em vez de percentual enganoso.

Métricas disponíveis:

- Vendas reconhecidas.
- Pedidos concluídos.
- Ticket médio.
- Pedidos cancelados e taxa operacional de cancelamento.
- Pedidos em andamento por status operacional.
- Deliveries em andamento.
- Evolução diária de vendas.
- Produtos mais vendidos com quantidade e receita.
- Pagamentos registrados por forma existente no enum `PaymentMethod`.
- Vendas por filial autorizada.
- Canais confiáveis pelo enum `SalesChannel`.
- Clientes que compraram no período, novos/recorrentes no período e segmentos CRM existentes.
- Estoque sem saldo para produtos ativos e disponíveis.

Limitações documentadas:

- Não há entidade de abertura/fechamento de caixa; o recurso é resumo operacional do período, não fechamento contábil.
- Não há estoque mínimo estruturado; por isso o dashboard não inventa estoque crítico e mostra somente produtos disponíveis sem saldo.
- Não há CMV/margem; ranking de produtos não afirma lucratividade.
- Não há motivo estruturado de cancelamento para análise causal confiável.
- Analytics/source não foi usado para atribuição de receita porque o vínculo comercial confiável deve ser tratado em sprint futura.

Arquitetura e performance:

- Agregações gerenciais ficam centralizadas em `src/modules/management/dashboard.ts`.
- `/painel` e `/gestao` usam a mesma fonte de verdade para receita, ticket, produtos, pagamentos, filiais, clientes e operação.
- Queries sempre incluem `businessId` e `branchId in allowedBranchIds` no banco.
- Receita, contagens, pagamentos, filiais e canais usam agregações Prisma no PostgreSQL.
- Ranking de produtos e estoque sem saldo usam SQL agregado controlado, evitando carregar todos os pedidos para reduzir em JavaScript.
- Nenhuma migration foi necessária.

Testes adicionados/atualizados:

- Unitários para ticket médio, comparação com base zero, período timezone Manaus e unidade/peso.
- PostgreSQL para venda reconhecida, cancelamento fora da receita, ticket médio, pagamentos, ranking por peso, tenant isolation e branch isolation.
- Playwright gerencial para OWNER em `/painel` e `/gestao`, período personalizado, ranking, pagamentos, filiais e filtro de filial.

Resultado do gate local da Sprint 13:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 42/42 testes unitários/contrato ativos e PostgreSQL pulado nesse comando.
- `npm run test:e2e:setup`: PASS.
- `npm run test:postgres`: PASS, 11/11 testes PostgreSQL.
- `DATABASE_URL=... npx prisma validate`: PASS.
- `npm run build`: PASS.
- `npm run test:e2e`: PASS, 17/17 testes Playwright.
- `npm run test:production-gate`: PASS.
