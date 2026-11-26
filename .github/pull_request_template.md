## O que este PR faz
<!-- Uma frase. Ex.: a publicação passa a exigir o doador. -->

## História e critério de origem
<!-- Qual história (H1 a H4) e quais critérios de aceite este PR atende. -->

## Fatias
<!-- Em qual fatia da história este PR está e o que fica para as próximas. -->

## Como verificar
<!-- Passos para o revisor testar. -->

## Checklist (definição de pronto do README)
- [ ] CI verde sobre PostgreSQL (aba Checks)
- [ ] Aprovado por um integrante que não é o autor (aba Reviews)
- [ ] Cada critério da fatia tem um `it` com o nome da regra, sem `it.todo`; um caso limite ou de erro na história (diff, `tests/`)
- [ ] História, critério de origem, fatias e Uso de IA preenchidos (esta descrição)
- [ ] Regra em `src/doacoes.js`, SQL só em `src/repositorio.js` com `$1, $2…` (diff)
- [ ] Decisão que muda o modelo em `## Decisões de projeto` do `docs/projeto.md` (diff)
- [ ] Se mexe em tela: 360 × 800 sem rolagem horizontal (celular ou emulação)

## Uso de IA
<!-- Usei IA neste PR? Para quê? O que eu conferi e o que alterei no que ela gerou? -->
