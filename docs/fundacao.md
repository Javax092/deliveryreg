# Fundação técnica

Esta etapa cria apenas a base segura para evolução do produto. Não implementa catálogo completo, entrega, CRM avançado nem automações.

## Multiempresa

Toda consulta de dados operacionais deve ser escopada pelo `businessId` vindo do contexto autenticado no servidor. O navegador nunca deve decidir a empresa autorizada.

Quando a operação depender de unidade física, também deve validar `branchId`. Usuários `OWNER` e `MANAGER` podem operar a empresa inteira; funções operacionais ficam restritas às unidades permitidas.

## Dinheiro e quantidades

Dinheiro usa centavos inteiros. Peso usa gramas. Um produto vendido por R$42,00/kg tem preço de `4200` centavos para base de `1000` gramas.

Exemplo:

- solicitado: 500g
- corte real: 518g
- estimado: R$21,00
- final: R$21,76

O pedido mantém as duas quantidades.

## Estoque

O estoque é calculado por movimentações:

- `PURCHASE`
- `SALE`
- `LOSS`
- `ADJUSTMENT`
- `TRANSFER`
- `RETURN`

Vendas e perdas reduzem estoque. Compras e devoluções aumentam estoque. Operações críticas devem ocorrer em transação.

## Auditoria

Operações sensíveis devem registrar ator, empresa, unidade quando aplicável, ação, entidade, data e metadados seguros. Senhas, tokens e segredos não devem ser registrados.

## Migrações

Migrações devem ser explícitas e revisáveis. Nunca resete banco real como atalho. Seeds são apenas apoio de desenvolvimento.
