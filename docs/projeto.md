# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão de projeto | Alternativas consideradas | Requisito ou risco da Unidade 1 que a motiva |
|---|---|---|---|
| 1 | Reservar a doação para a primeira ONG que a aceitar, com aceite exclusivo. A prioridade automática por proximidade fica para uma iteração futura. | A) Primeira ONG que aceitar; B) prioridade para a ONG mais próxima. | **RN03 e RN08**; critérios 1 a 3 da História 4; risco de mais de uma ONG aceitar a mesma doação. A **RN04** e a hipótese sobre proximidade também motivam a comparação, mas a História Zero exclui a priorização automática por distância. |
| 2 | Impedir o aceite de doações expiradas e retirá-las da lista de disponíveis. | A) Ocultar doações expiradas da lista de disponíveis; B) mantê-las visíveis apenas para consulta, identificadas como expiradas. | **RN02, RN07 e RN14**; critério 2 da História 3 e critério 1 da História 4; risco de doações expirarem antes de serem aceitas ou coletadas. |
| 3 | Exigir tipo de alimento, quantidade e validade ou janela de retirada no cadastro inicial. | A) Exigir somente os dados mínimos; B) exigir dados adicionais para ampliar a rastreabilidade. | **RN01 e RN13**; critérios 1 a 3 da História 1; conflito de prioridade entre cadastro simples para o doador e rastreabilidade para a vigilância sanitária. A **RN12** motiva a alternativa ampliada, mas o histórico completo ficou fora da História Zero. |

## Tabela de trade-offs (uma decisão em detalhe)
Decisão escolhida: **Decisão 3** — quais informações serão obrigatórias no cadastro de doações. Alternativa escolhida: **A**.

| Critério | Alternativa A: Cadastro com informações essenciais | Alternativa B: Cadastro com informações adicionais |
|---|---|---|
| Rapidez no cadastro | Maior, pois exige menos informações do doador | Menor, pois exige o preenchimento de mais informações |
| Simplicidade para o doador | Maior, tornando o processo mais direto | Menor, tornando o cadastro mais detalhado |
| Rastreabilidade | Menor, pois são armazenadas apenas as informações essenciais | Maior, pois existem mais informações sobre a doação |
| Quantidade de informações disponíveis | Menor | Maior |
| Atendimento às necessidades de fiscalização | Pode fornecer menos informações para consulta | Fornece mais informações para acompanhamento da doação |

**Por que A:** A é melhor nos critérios que pesam para o doador (rapidez e simplicidade) e B só é melhor em rastreabilidade. Mesmo assim, A cumpre o mínimo que a Vigilância Sanitária exige (RN01), e o Conflito 1 da Análise decidiu que no piloto "serão obrigatórios apenas os dados definidos como necessários pelo caso". **Quem paga:** a Vigilância Sanitária, que recebe menos informações por doação.

## Diagramas
- [Diagrama de contexto](diagramas/contexto.md)
- [Modelo de dados](diagramas/dados.md)

Divergências entre o modelo de dados e o `src/db.js` (detalhadas em `dados.md`):
1. **`DOADORES` e `doador_id`:** previstos no diagrama; no código atual, a doação ainda não registra o doador.
2. **`ONGS`:** prevista no diagrama; no código atual, não há cadastro de ONGs.
3. **Referência à ONG:** no diagrama é `ong_id` (FK para `ONGS`); no código atual é `ong TEXT`, com o nome informado no aceite.

## ADRs
- [ADR 0001 — Migração de SQLite para Supabase (PostgreSQL)](adr/0001-migração%20de%20banco-adr.md): aceito, com as revisões de 08/10 (backup mensal para a Vigilância) e de 22/10/2026 (testes que apagaram as doações do piloto).
- [ADR 0002 — Testes usam sempre o próprio banco e a limpeza recusa outro banco](adr/0002-isolamento-banco-de-teste.md): aceito em 22/10/2026.

## Requisitos não-funcionais

| Requisito | Como afeta o design |
|---|---|
| **RNF01 — Consistência sob concorrência. Quando** duas ONGs tentarem aceitar simultaneamente a mesma doação disponível e válida, **o sistema** deverá confirmar apenas um aceite e informar a indisponibilidade à outra. **Medido por:** executar 20 rodadas com duas requisições concorrentes por rodada, usando uma nova doação em cada rodada; conferir exatamente um sucesso e uma única ONG receptora no banco em todas as rodadas. | Afeta a **decisão 1**, as **RN03 e RN08** e o ADR de migração. Exige atualização atômica condicionada à disponibilidade. **Custo:** a equipe de desenvolvimento implementa o controle de concorrência e mantém o teste nos bancos utilizados. |
| **RNF02 — Usabilidade em celular. Quando** uma ONG consultar e aceitar uma doação pelo navegador em uma tela de 360 × 800 pixels, **o sistema** deverá apresentar tipo, quantidade, validade e botão de aceite sem cortes ou rolagem horizontal. **Medido por:** executar o fluxo na emulação móvel das ferramentas do navegador e observar zero campos cortados e zero etapas com rolagem horizontal. | Afeta a interface do fluxo da **decisão 1** e a apresentação dos dados mínimos da **decisão 3**; responde à necessidade de uso pelo celular em **Stakeholders**, na Análise. Exige layout responsivo. **Custo:** a equipe de interface adapta os componentes e verifica diferentes tamanhos de tela. |
| **RNF03 — Independência de integrações externas. Quando** o piloto operar sem acesso aos sistemas internos dos restaurantes, **o sistema** deverá permitir consultar e aceitar doações previamente cadastradas usando a aplicação e seu próprio banco. **Medido por:** executar o fluxo completo sem configurar acesso a sistemas de restaurantes e conferir, pela aba de rede do navegador e pelo código do servidor, zero chamadas obrigatórias a esses sistemas. | Nasce da **restrição do piloto de não integrar com sistemas dos restaurantes**, declarada em **História Zero → Por quê ficaram de fora?**, na Análise. Afeta a origem dos dados e a arquitetura do piloto: os dados são mantidos no próprio sistema. **Custo:** a equipe prepara as doações da fatia inicial; na evolução com cadastro manual, os doadores assumem o preenchimento. |
| **RNF04 — Tempo de resposta da consulta. Quando** uma ONG consultar as doações em um ambiente local com 100 doações disponíveis e um usuário ativo, **o sistema** deverá responder à consulta em até 1 segundo em pelo menos 95% das requisições. **Medido por:** preparar essa base, fazer cinco consultas de aquecimento e medir 100 consultas sequenciais à API com um script HTTP; pelo menos 95 devem durar no máximo 1 segundo. | Afeta a consulta de disponíveis da **decisão 2** e o ADR de migração. Exige avaliar as consultas e criar índices se a medição indicar necessidade. **Custo:** a equipe de desenvolvimento prepara a medição e otimiza a consulta; índices adicionais consomem armazenamento e aumentam o trabalho nas escritas. |
| **RNF05 — Persistência após reinício. Quando** o servidor for encerrado normalmente e iniciado novamente após um aceite confirmado, mantendo o mesmo banco persistente, **o sistema** deverá preservar a ONG receptora e o estado da doação. **Medido por:** realizar cinco ciclos de aceite e reinício, cada um com uma nova doação; consultar o banco e a lista após cada reinício e observar zero reservas perdidas e zero doações aceitas reaparecendo como disponíveis. | Afeta a **decisão 1** e o ADR de migração. Exige confirmar o aceite somente após a gravação e configurar armazenamento persistente, inclusive se o PostgreSQL estiver em contêiner. **Custo:** o responsável pelo ambiente mantém o arquivo ou volume de dados e a equipe de desenvolvimento verifica a persistência. |
| **RNF06 — Recuperação após falha de conexão. Quando** a conexão cair durante uma tentativa de aceite e a interface não receber a resposta do servidor, **o sistema** deverá informar que o resultado não foi confirmado e permitir consultar o estado atualizado da doação após a reconexão, sem anunciar sucesso indevidamente. **Medido por:** em cinco tentativas, interromper a resposta do aceite com uma ferramenta de interceptação HTTP, restabelecer a conexão e atualizar a consulta; observar zero mensagens de sucesso sem confirmação e, nas cinco tentativas, um estado exibido compatível com o registrado no banco. | Afeta a **decisão 1** e o tratamento de erros da interface. Considera a conexão instável mencionada em **Stakeholders**, na Análise, como condição de uso a verificar também no fluxo das ONGs. Exige distinguir falha de comunicação de recusa do aceite e consultar o estado após a reconexão. **Custo:** a equipe de desenvolvimento implementa e verifica a recuperação; o usuário precisa aguardar a conexão e consultar novamente para saber o resultado. |
| **RNF07 — Proteção dos dados reais contra os testes (ajuste 4c). Quando** a suíte de testes for executada em qualquer máquina, inclusive na do piloto com a configuração apontando para o banco real, **o sistema** não deverá apagar nem alterar nenhuma doação desse banco. **Medido por:** `tests/isolamento-banco.test.js`, executado no CI a cada PR: um banco com uma doação continua com uma doação depois da tentativa de limpeza, e `limparBanco()` falha com erro. | Afeta a decisão registrada no **ADR 0002** e a **Revisão de 22/10/2026** do ADR de migração. Exige banco de teste fixo no código e uma limpeza que confere o banco em uso. **Custo:** a equipe de desenvolvimento deixa de poder rodar a suíte contra um arquivo real; na Unidade 3, o responsável pela persistência mantém um PostgreSQL só para testes. |

**Ajuste 4c:** a mudança de contexto acrescentou o RNF07 e o critério 9.

## Critérios de validação do projeto
| # | Critério | fonte
|---| --- | ---|
|1 | Existe funcionalidade para cadastrar uma doação exigindo tipo de alimento, quantidade e validade/janela de retirada.| `src/doacoes.js` (`criarDoacao`) + RN01 no Documento de Análise|
| 2 | O sistema impede o cadastro de uma doação com validade igual ou anterior à data atual.| `src/doacoes.js` (`criarDoacao`) + Critério 3 da História 1 |
| 3 | Doações reservadas ou expiradas não aparecem na lista de doações disponíveis. | `src/repositorio.js` (`listarDisponiveis`) + Critérios 1 e 2 da História 3|
|4|Duas ONGs não conseguem reservar simultaneamente a mesma doação.|`src/repositorio.js` (`aceitar`) + RN03 + Critério 2 da História 4|
|5|Após uma ONG aceitar uma doação, ela deixa de aparecer como disponível para outras ONGs.|`src/repositorio.js` (`listarDisponiveis`) + Critério 3 da História 4|
|6|**(migração)** O schema das doações é criado por código versionado no repositório, executado por `npm run db:migrar`.|`src/db.js` (`migrar`) + `package.json`|
|7|O README lista os comandos para instalar, criar o schema, subir e testar o projeto (`npm install`, `npm run db:migrar`, `npm start`, `npm test`).|`README.md`, seção "Como rodar"|
|8|Existe pelo menos um teste automatizado cobrindo as regras de aceite exclusivo da doação.|`tests/doacoes.test.js`|
|9|**(ajuste 4c)** Existe teste em que `limparBanco()`, com um banco que não é o de teste, falha sem apagar nenhuma doação.|`tests/isolamento-banco.test.js`|

## Uso de IA
A IA foi usada como apoio, com o grupo decidindo o que entrava.

- **Mudança de contexto (etapa 4):** pedimos que ela lesse `src/db.js` e `vitest.config.js` e explicasse como os testes poderiam alcançar o banco real. A explicação (a única proteção era a configuração do Vitest, e `limparBanco()` não conferia o banco) foi conferida no código antes de servir de base para o ADR 0002 e para a revisão do ADR 0001.
- **Conferência com o enunciado (etapa 8):** usamos a IA para comparar este documento com o checklist de correção. Ela apontou o que faltava: diagramas fora de `docs/diagramas/`, seções de Diagramas e ADRs vazias, critérios sem arquivo como fonte e um critério de opinião (o antigo 7).
- **Rascunhos:** ela sugeriu a redação inicial das três linhas dos diagramas, das divergências e dos ADRs. Os textos foram revisados e ajustados pelo grupo.

**O que o grupo mudou:** a IA propôs redesenhar os diagramas; mantivemos os nossos e só os movemos de pasta. Ela propôs abrir um PR por história; organizamos em menos PRs. Também pedimos um tom neutro nas divergências do modelo de dados.

**Erros da IA que corrigimos:**
1. No `dados.md`, ela escreveu que as tabelas de doadores e ONGs "entram junto com a migração da Unidade 3 (ADR 0001)". O ADR 0001 não decide isso, então trocamos a frase.
2. Na linha "Situação" do diagrama de contexto, ela deu o fluxo da Marta como implementado. Ao conferir com o `admin.html`, vimos que só existe o histórico de aceites, sem indicadores, e corrigimos.
3. Ela considerou a tabela de trade-offs pronta sem notar que não dizia a qual decisão se referia nem qual alternativa venceu. Um integrante percebeu, e acrescentamos a decisão, a alternativa escolhida e o "por que A".