# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão de projeto | Alternativas consideradas | Requisito ou risco da Unidade 1 que a motiva |
|---|---|---|---|
| 1 | Reservar a doação para a primeira ONG que a aceitar, com aceite exclusivo. A prioridade automática por proximidade fica para uma iteração futura. | A) Primeira ONG que aceitar; B) prioridade para a ONG mais próxima. | **RN03 e RN08**; critérios 1 a 3 da História 4; risco de mais de uma ONG aceitar a mesma doação. A **RN04** e a hipótese sobre proximidade também motivam a comparação, mas a História Zero exclui a priorização automática por distância. |
| 2 | Impedir o aceite de doações expiradas e retirá-las da lista de disponíveis. | A) Ocultar doações expiradas da lista de disponíveis; B) mantê-las visíveis apenas para consulta, identificadas como expiradas. | **RN02, RN07 e RN14**; critério 2 da História 3 e critério 1 da História 4; risco de doações expirarem antes de serem aceitas ou coletadas. |
| 3 | Exigir tipo de alimento, quantidade e validade ou janela de retirada no cadastro inicial. | A) Exigir somente os dados mínimos; B) exigir dados adicionais para ampliar a rastreabilidade. | **RN01 e RN13**; critérios 1 a 3 da História 1; conflito de prioridade entre cadastro simples para o doador e rastreabilidade para a vigilância sanitária. A **RN12** motiva a alternativa ampliada, mas o histórico completo ficou fora da História Zero. |

## Tabela de trade-offs (uma decisão em detalhe)
Decisão escolhida: Quais informações serão obrigatórias no cadastro de doações.

| Critério | Alternativa A: Cadastro com informações essenciais | Alternativa B: Cadastro com informações adicionais |
|---|---|---|
| Rapidez no cadastro | Maior, pois exige menos informações do doador | Menor, pois exige o preenchimento de mais informações |
| Simplicidade para o doador | Maior, tornando o processo mais direto | Menor, tornando o cadastro mais detalhado |
| Rastreabilidade | Menor, pois são armazenadas apenas as informações essenciais | Maior, pois existem mais informações sobre a doação |
| Quantidade de informações disponíveis | Menor | Maior |
| Atendimento às necessidades de fiscalização | Pode fornecer menos informações para consulta | Fornece mais informações para acompanhamento da doação |

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)  


## ADRs
Ver `docs/adr/`.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|

## Critérios de validação do projeto
| # | Critério | fonte
|---| --- | ---|
|1 | Existe funcionalidade para cadastrar uma doação exigindo tipo de alimento, quantidade e validade/janela de retirada.| Código do cadastro de doação + RN01 no Documento de Análise|
| 2 | O sistema impede o cadastro de uma doação com validade igual ou anterior à data atual.| Código de validação + Critério 3 da História 1 |
| 3 | Doações reservadas ou expiradas não aparecem na lista de doações disponíveis. | Código da listagem + Critérios 1 e 2 da História 3|
|4|Duas ONGs não conseguem reservar simultaneamente a mesma doação.|Código do aceite de doação + RN03 + Critério 2 da História 4|
|5|Após uma ONG aceitar uma doação, ela deixa de aparecer como disponível para outras ONGs.|Código da reserva + Critério 3 da História 4
|6|Existe pelo menos uma migração versionada que cria as estruturas necessárias para armazenar as doações.|Pasta migrations|
|7|O repositório contém instruções suficientes para executar o projeto localmente.|README.md|
|8|Existe pelo menos um teste automatizado cobrindo as regras de aceite exclusivo da doação.|Pasta tests|
## Uso de IA
