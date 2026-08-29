# Guia de implantação

## Variáveis de ambiente

- `DATABASE_URL`: conexão PostgreSQL de produção.
- `AUTH_SECRET`: segredo forte com pelo menos 32 caracteres.
- `BUSINESS_TIMEZONE`: usar `America/Manaus`.
- `NODE_ENV`: `production` em produção.

Nunca use valores do `.env.example` em produção.

## Migrações

1. Revisar todos os arquivos em `prisma/migrations`.
2. Fazer backup do banco antes da primeira aplicação em produção.
3. Executar `npx prisma migrate deploy`.
4. Executar `npm run prisma:generate` no build.

Não rode reset de banco em produção.

## Seed

`npm run db:seed` é apenas para desenvolvimento ou bootstrap controlado inicial.

O seed cria usuário local com senha inicial documentada no README. Troque a senha antes de qualquer operação real.

## Bootstrap de produção

1. Criar banco PostgreSQL.
2. Configurar variáveis de ambiente.
3. Rodar migrações.
4. Criar empresa, unidades, usuários e permissões iniciais.
5. Cadastrar produtos, preços, disponibilidade e zonas de entrega reais.
6. Criar fontes de QR Code por unidade.
7. Validar fluxo completo em uma unidade antes de liberar a segunda.

## Checklist de deploy

- `npm audit --audit-level=high`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Revisar `prisma/migrations`
- Revisar permissões de usuários
- Revisar variáveis de ambiente
- Confirmar backup recente

## Backup

- Backup automático diário do PostgreSQL.
- Backup manual antes de migrações.
- Teste periódico de restauração em ambiente separado.

## Rollback

- Preferir rollback de aplicação mantendo banco compatível.
- Migrações destrutivas exigem plano específico e backup testado.
- Nunca apagar dados comerciais para corrigir deploy.

## Guia rápido do operador

1. Abra `/produtos` para conferir catálogo e preços.
2. Abra `/estoque` para registrar entradas e ajustes iniciais.
3. Use `/operacao` para pedidos digitais.
4. Use `/pdv` para vendas presenciais.
5. Use `/gestao` para acompanhar vendas e funil.
6. Use `/clientes` para histórico e recompra.
7. Use `/entregas` para operação de courier quando houver entrega atribuída.

## Checklist das duas unidades

- QR Code testado em cada unidade.
- Fonte do QR cadastrada.
- Produtos disponíveis por unidade.
- Estoque inicial registrado por unidade.
- Usuários operacionais com acesso à unidade correta.
- PDV testado com venda de baixo valor.
- Pedido digital testado com retirada.
- Se delivery estiver ativo, zona, taxa e mínimo conferidos.
