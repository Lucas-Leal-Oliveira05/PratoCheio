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

Proposta para revisão: os seis cenários abaixo são opções para o grupo selecionar os três da entrega. As medidas são metas propostas, ainda não verificadas. O ADR de migração deverá ser vinculado quando estiver registrado.

| Requisito | Como afeta o design |
|---|---|
| **RNF01 — Consistência sob concorrência. Quando** duas ONGs tentarem aceitar simultaneamente a mesma doação disponível e válida, **o sistema** deverá confirmar apenas um aceite e informar a indisponibilidade à outra. **Medido por:** executar 20 rodadas com duas requisições concorrentes por rodada, usando uma nova doação em cada rodada; conferir exatamente um sucesso e uma única ONG receptora no banco em todas as rodadas. | Afeta a **decisão 1**, as **RN03 e RN08** e o ADR de migração. Exige atualização atômica condicionada à disponibilidade. **Custo:** a equipe de desenvolvimento implementa o controle de concorrência e mantém o teste nos bancos utilizados. |
| **RNF02 — Usabilidade em celular. Quando** uma ONG consultar e aceitar uma doação pelo navegador em uma tela de 360 × 800 pixels, **o sistema** deverá apresentar tipo, quantidade, validade e botão de aceite sem cortes ou rolagem horizontal. **Medido por:** executar o fluxo na emulação móvel das ferramentas do navegador e observar zero campos cortados e zero etapas com rolagem horizontal. | Afeta a interface do fluxo da **decisão 1** e a apresentação dos dados mínimos da **decisão 3**; responde à necessidade de uso pelo celular em **Stakeholders**, na Análise. Exige layout responsivo. **Custo:** a equipe de interface adapta os componentes e verifica diferentes tamanhos de tela. |
| **RNF03 — Independência de integrações externas. Quando** o piloto operar sem acesso aos sistemas internos dos restaurantes, **o sistema** deverá permitir consultar e aceitar doações previamente cadastradas usando a aplicação e seu próprio banco. **Medido por:** executar o fluxo completo sem configurar acesso a sistemas de restaurantes e conferir, pela aba de rede do navegador e pelo código do servidor, zero chamadas obrigatórias a esses sistemas. | Nasce da **restrição do piloto de não integrar com sistemas dos restaurantes**, declarada em **História Zero → Por quê ficaram de fora?**, na Análise. Afeta a origem dos dados e a arquitetura do piloto: os dados são mantidos no próprio sistema. **Custo:** a equipe prepara as doações da fatia inicial; na evolução com cadastro manual, os doadores assumem o preenchimento. |
| **RNF04 — Tempo de resposta da consulta. Quando** uma ONG consultar as doações em um ambiente local com 100 doações disponíveis e um usuário ativo, **o sistema** deverá responder à consulta em até 1 segundo em pelo menos 95% das requisições. **Medido por:** preparar essa base, fazer cinco consultas de aquecimento e medir 100 consultas sequenciais à API com um script HTTP; pelo menos 95 devem durar no máximo 1 segundo. | Afeta a consulta de disponíveis da **decisão 2** e o ADR de migração. Exige avaliar as consultas e criar índices se a medição indicar necessidade. **Custo:** a equipe de desenvolvimento prepara a medição e otimiza a consulta; índices adicionais consomem armazenamento e aumentam o trabalho nas escritas. |
| **RNF05 — Persistência após reinício. Quando** o servidor for encerrado normalmente e iniciado novamente após um aceite confirmado, mantendo o mesmo banco persistente, **o sistema** deverá preservar a ONG receptora e o estado da doação. **Medido por:** realizar cinco ciclos de aceite e reinício, cada um com uma nova doação; consultar o banco e a lista após cada reinício e observar zero reservas perdidas e zero doações aceitas reaparecendo como disponíveis. | Afeta a **decisão 1** e o ADR de migração. Exige confirmar o aceite somente após a gravação e configurar armazenamento persistente, inclusive se o PostgreSQL estiver em contêiner. **Custo:** o responsável pelo ambiente mantém o arquivo ou volume de dados e a equipe de desenvolvimento verifica a persistência. |
| **RNF06 — Recuperação após falha de conexão. Quando** a conexão cair durante uma tentativa de aceite e a interface não receber a resposta do servidor, **o sistema** deverá informar que o resultado não foi confirmado e permitir consultar o estado atualizado da doação após a reconexão, sem anunciar sucesso indevidamente. **Medido por:** em cinco tentativas, interromper a resposta do aceite com uma ferramenta de interceptação HTTP, restabelecer a conexão e atualizar a consulta; observar zero mensagens de sucesso sem confirmação e, nas cinco tentativas, um estado exibido compatível com o registrado no banco. | Afeta a **decisão 1** e o tratamento de erros da interface. Considera a conexão instável mencionada em **Stakeholders**, na Análise, como condição de uso a verificar também no fluxo das ONGs. Exige distinguir falha de comunicação de recusa do aceite e consultar o estado após a reconexão. **Custo:** a equipe de desenvolvimento implementa e verifica a recuperação; o usuário precisa aguardar a conexão e consultar novamente para saber o resultado. |

## Critérios de validação do projeto

## Uso de IA
