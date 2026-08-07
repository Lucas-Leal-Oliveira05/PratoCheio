# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

## Incertezas

## Stakeholders
| Stakeholder | Interesse | Influência | O que espera |
|---|---|---|---|

## Objetivos de impacto
1.
2.
3.

## Regras de negócio

## Regras conhecidas (já apresentadas no caso do sistema):
-RN01: Informações mínimas de doações: cada doação deve apresentar no mínimo o tipo de alimento, a quantidade e a validade ou janela de retirada

-RN02: Prazo curto para perecíveis: Alimentos perecíveis possuem prazo curto para retirada, e após esse período é considerado indisponível

-RN03: Exclusividade de doações: Após uma ONG aceitar uma doação, ela deixa de estar disponível para as demais

-RN04: Prioridade por localização: ONGs próximas do doador possuem prioridade no aceite da doação

## Regras não conhecidas / não explícitas:

-RN05: Doadores cadastrados: Apenas estabelecimentos cadastrados poderão publicar doações

-RN06: Prazo de aceite: Toda doação publicada deve possuir um tempo máximo para a coleta

-RN07: Expiração de doação: Se o prazo de coleta de uma doação expirar, a doação deve ficar inválida para as ONGs

-RN08: Aceite da doação: Para uma doação poder ser aceita, ela deve estar disponível

-RN09: Alteração de dados em doação: Após o aceite de uma doação, essa doação não pode ter suas informações alteradas

-RN010: Cancelamento de aceite: Caso uma ONG cancele o aceite, a doação volta a estar disponível

-RN11: Confirmação de coleta: Quando o entregador realizar a coleta, esta ação deve ser confirmada

-RN12: Rastreabilidade: Toda doação feita deve manter os seguintes dados: Quem doou, quem recebeu, data de publicação, data de reserva, data da coleta e data de entrega

-RN13: Validade de alimentos: A data de vencimento do alimento deve ser futura à data de registro da doação para concluir o registro

-RN14: Retirada de doações expiradas: Após o vencimento do alimento/prazo de coleta, a doação deve ser automaticamente expirada

-RN15: Voluntário entregador: Apenas um entregador pode ficar responsável pela entrega de uma doação 

-RN16: Responsabilidade de entrega: Um entregador deve ser responsável de apenas uma entrega por vez

-RN17: Entregadores cadastrados: Apenas entregadores cadastrados podem se responsabilizar por alguma entrega

-RN18: Doações por estabelecimento: Cada estabelecimento pode ter várias doações disponpiveis ao mesmo tempo

-RN19: Doações reservadas por ONG: Uma ONG pode ter várias doações aceitas ao mesmo tempo

## Histórias de usuário
| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|

## Critérios de aceite
**História X** — Dado … Quando … Então …

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Hipótese e experimento


## Conflitos de prioridade
Conflito 1 — Simplicidade para o doador / rastreabilidade da vigilância sanitária

Conflito:
Doador quer cadastrar uma doação rapidamente, sem perder tempo preenchendo muitos dados.
Vigilância sanitária precisa que as informações da doação sejam registradas para garantir rastreabilidade mínima dos alimentos.

Trade-off:
Quantidade de informações obrigatórias no cadastro da doação.

O que cada lado perde:
O doador perde rapidez e facilidade no processo caso existam muitos campos obrigatórios.
A vigilância sanitária perde controle e capacidade de rastrear a origem e as características do alimento caso faltem informações importantes.

Critério que decide:
Na primeira versão do sistema, serão obrigatórios apenas os dados definidos como necessários pelo caso: tipo do alimento, quantidade e validade/janela de retirada. Informações adicionais não serão obrigatórias no piloto.

Saída usada:
Decidir.


## Decisão de análise
- **Problema:**
- **Alternativas:**
- **Decisão e justificativa:**
- **Riscos e limitações:**

## Uso de IA
O que geramos com IA, o que verificamos e o que alteramos.
