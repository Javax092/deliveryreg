# Segmentação inicial de clientes

As regras são determinísticas e não usam IA.

- `NEW`: cliente sem compra concluída.
- `ACTIVE`: cliente com compra concluída nos últimos 30 dias e menos de 2 compras concluídas.
- `RECURRING`: cliente com 2 ou mais compras concluídas e última compra há até 45 dias.
- `AT_RISK`: última compra entre 46 e 90 dias.
- `INACTIVE`: última compra há mais de 90 dias.

Frequência média de compra só é exibida quando há pelo menos 3 compras concluídas. Caso contrário, a interface mostra `dados insuficientes`.

Essas janelas devem ser revisadas quando houver histórico comercial real suficiente.
