# DeliveryReg

Fundação técnica para operação comercial com catálogo, pedidos, unidades físicas, pesagem, estoque e auditoria.

## Requisitos

- Node.js 20+
- PostgreSQL
- `DATABASE_URL`
- `AUTH_SECRET` com pelo menos 32 caracteres
- `BUSINESS_TIMEZONE=America/Manaus`

## Comandos

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run lint
npm run typecheck
npm test
npm run build
```

## Princípios da fundação

- Valores monetários são armazenados em centavos.
- Quantidades operacionais usam unidades base normalizadas, como gramas para peso.
- Pedidos preservam quantidade solicitada e quantidade real.
- Preços aplicados são copiados para o item do pedido para preservar histórico.
- Estoque é ledger-based, por movimentações imutáveis.
- Toda entidade de negócio é escopada por `businessId`.
- Entidades operacionais de unidade usam `branchId`.
- Autorização é resolvida no servidor a partir da sessão autenticada.
- Datas são persistidas em `DateTime` e exibidas para `America/Manaus`.

## Seed de desenvolvimento

O seed cria uma empresa, duas unidades iniciais configuráveis no arquivo de seed e um usuário administrador local:

- email: `admin@deliveryreg.local`
- senha inicial: `Adminreg123`

Troque a senha antes de qualquer uso fora do desenvolvimento.
