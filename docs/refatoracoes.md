# Refatorações — Prato Cheio

## Refatoração 1 — Migração de SQLite para PostgreSQL (iteração 0)

- **Motivo:** o ADR 0001 decidiu migrar o banco na Unidade 3, depois de consolidado o fluxo principal: o PostgreSQL permite uma base compartilhada e revela cedo as incompatibilidades que o SQLite esconderia. O ADR 0002 acrescentou que os testes nunca usam o banco compartilhado.
- **O que mudou:** `src/db.js` passou a usar `pg` com `Pool`, e o `query()` continua devolvendo `{ rows }`; `src/repositorio.js` usa o dialeto do PostgreSQL (`NOW()`, `$1, $2`); o CI sobe `postgres:16-alpine` com `DATABASE_URL` e `DATABASE_URL_TEST`; `package.json` e `.env.example` ganharam `pg` e as variáveis.
- **O que não mudou:** `src/doacoes.js` e os testes não aparecem no diff do PR #29.
- **Evidência:** 25 testes verdes antes (CI #31: https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions/runs/42143109920) e 25 depois (https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions/runs/42149052385).

## Refatoração 2 — Extração da transição de estado (iteração 3)

- **Cheiro:** código duplicado. `aceitar`, `cancelar`, `confirmarColeta` (H2) e `devolver` (H3) começavam igual: buscar a doação, recusar se não existe, conferir o estado com `if` próprios e escrever à mão a mensagem para quando o `UPDATE` não acha a linha. A fatia 1 da H3 entrou como a terceira cópia, com teste verde, e a regra de três mandou extrair.
- **Dor na próxima mudança:** a decisão 5 (`docs/projeto.md`) diz de qual estado cada operação parte, mas isso estava espalhado em quatro funções; na inversão de regra da H2 foi preciso mexer no `if` e no `UPDATE` sem um lugar que mostrasse as transições juntas, e o `cancelar` nem conferia o estado antes de gravar. Uma quinta operação (expirar a doação) seria a quinta cópia.
- **O que mudou** (só `src/doacoes.js` e `src/repositorio.js`; nenhum teste no diff): a tabela `TRANSICOES` diz, por operação, o estado de origem e a mensagem de recusa por estado atual; `buscarParaTransicao` faz a busca e as recusas; `transicionar` grava e, se o `UPDATE` não achar a linha (duas requisições ao mesmo tempo), lê de novo para responder com a mensagem do estado atual. As quatro operações ficaram só com o que é delas (validade, voluntário, motivo). `STATUS` passou a ser exportado e os dois literais que sobravam no SQL usam a constante.
- **Evidência:** 45 testes verdes antes ([CI do PR #42](https://github.com/Lucas-Leal-Oliveira05/PratoCheio/pull/42/checks), fatia 1 da H3) e os mesmos 45 depois ([CI do PR #43](https://github.com/Lucas-Leal-Oliveira05/PratoCheio/pull/43/checks), Refatoração 2). A fatia seguinte da H3 (CA3) já usa `transicionar`.
- Revisão: [PR #43](https://github.com/Lucas-Leal-Oliveira05/PratoCheio/pull/43)

**Ainda não refatorado** (revisão do PR #29): o SQLite que sobrou no `db.js`, o `limparBanco` sem conferir o nome do banco de teste (ADR 0002) e o SSL ligado só pelo nome "supabase" na URL.
