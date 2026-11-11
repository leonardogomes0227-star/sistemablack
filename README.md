# Sistema de Gestão para Barbearia (demonstração)

Sistema de **gerenciamento**: o dono vê tudo que entra e sai e quanto cada barbeiro produziu. Versão de apresentação, 100% no navegador, **sem banco de dados e sem servidor**: os dados são de exemplo, gerados ao abrir (e guardados só no navegador).

Abra `index.html` ou publique a pasta em qualquer hospedagem estática.

## Visão do dono
- **Painel**: entrou hoje, entradas/saídas/lucro do mês, **quanto cada barbeiro fez** (hoje, 7 dias, mês, ticket, comissão, meta), para onde vai o dinheiro, últimas movimentações e alertas.
- **Extrato**: todas as entradas e saídas (atendimentos, despesas, vales, comissões pagas) com saldo, filtros por período, tipo e barbeiro, e exportação em CSV.
- **Financeiro**: resultado do mês, lucro líquido, formas de pagamento, despesas por categoria, contas a pagar.
- **Relatórios**: mais vendidos, horários de pico, retorno de clientes, descontos, desempenho por barbeiro.

## Operação
- **Caixa**: lançar cada atendimento/venda (serviços + produtos, desconto, gorjeta, forma de pagamento), estorno, fechamento do dia e gaveta de dinheiro (troco, sangria, suprimento, conferência).
- **Clientes**: histórico, preferências, cartão fidelidade, aniversariantes, sumidos.
- **Serviços e produtos**: preços, margem, estoque mínimo, entrada de estoque.

## Equipe
- **Barbeiros e Comissões**: % por serviço/produto ou aluguel de cadeira, vales, gorjetas, fechamento mensal, pagamento e recibo.

Perfis de acesso: Dono (tudo), Recepção (caixa, clientes, catálogo) e Barbeiro (só o próprio extrato de comissão).
