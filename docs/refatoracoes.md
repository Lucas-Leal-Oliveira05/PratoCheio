# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** o ADR 0001 (`docs/adr/0001-migração de banco-adr.md`) decidiu migrar o banco na Unidade 3, depois de consolidado o fluxo principal. O PostgreSQL permite uma base compartilhada e valida as regras de negócio num banco cliente-servidor, e o SQLite adiaria a descoberta de incompatibilidades. O ADR 0002 acrescentou uma condição: os testes nunca podem usar o banco compartilhado.
- **O que mudou:**
  - `src/db.js`: passou a usar o PostgreSQL (`pg`, com `Pool`). O `query()` continua devolvendo `{ rows }`, e o `migrar()` cria a tabela com `IDENTITY` e `TIMESTAMPTZ`.
  - `src/repositorio.js`: SQL no dialeto do PostgreSQL (`NOW()`, marcadores `$1, $2`).
  - `.github/workflows/ci.yml`: serviço `postgres:16-alpine` ativo, com `DATABASE_URL` e `DATABASE_URL_TEST`; o CI roda os testes sobre PostgreSQL.
  - `package.json` e `.env.example`: dependência `pg`, scripts lendo o `.env` e a variável `DATABASE_URL_TEST`.
- **O que NÃO mudou:** `src/doacoes.js` (as regras de negócio) e os arquivos de teste não aparecem no diff do PR #29.
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: 25 passando (4 arquivos) — CI #31: https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions/runs/42143109920
  - testes depois da mudança: 25 passando (4 arquivos)
  - link da execução do CI verde: https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions/runs/42149052385

## Refatoração 2 — Extração da transição de estado (iteração 3)

- **Cheiro de código atacado:** código duplicado. Com a H3, quatro operações de `src/doacoes.js` começavam do mesmo jeito: `aceitar`, `cancelar`, `confirmarColeta` (H2) e `devolver` (H3) buscavam a doação, recusavam se ela não existisse, conferiam o estado com `if` próprios e, se o `UPDATE` não achasse a linha, lançavam outra mensagem escrita à mão. A primeira fatia da H3 entrou como a terceira cópia desse bloco, com os testes verdes, e a regra de três mandou extrair.
- **Dor concreta na próxima mudança:** a decisão 5 (`docs/projeto.md`) diz de qual estado cada operação parte, mas essa regra estava espalhada em quatro funções. Na inversão de regra da H2, mudar "de onde se confirma a coleta" pedia mexer no `if` e no `UPDATE` sem nenhum lugar que mostrasse as transições juntas; uma quinta operação (por exemplo, expirar a doação) seria a quinta cópia. As mensagens também já divergiam: o `cancelar` nem conferia o estado antes do `UPDATE`.
- **O que mudou (só `src/doacoes.js` e `src/repositorio.js`; nenhum teste no diff):**
  - a tabela `TRANSICOES` lista, por operação, o estado de onde ela parte e as mensagens de recusa por estado atual;
  - `buscarParaTransicao(id, operacao)` busca, recusa a inexistente e confere o estado;
  - `transicionar(id, operacao, gravar)` chama a gravação e, se o `UPDATE` não achar a linha (corrida entre duas requisições), lê de novo para responder com a mensagem do estado atual;
  - `aceitar`, `cancelar`, `confirmarColeta` e `devolver` ficaram com 2 a 6 linhas cada, só com o que é delas (validade no aceite, nome do voluntário, motivo da devolução);
  - `STATUS` passou a ser exportado por `src/repositorio.js` e congelado, e os dois literais que sobravam no SQL (`cancelar` e `listarAceitas`, pendência da revisão anterior) usam a constante.
- **Evidência (testes verdes antes e depois):**
  - antes: 45 passando (7 arquivos) — CI do PR da fatia 1 da H3: `<link da execução>`
  - depois: 45 passando (7 arquivos), os mesmos testes — CI do PR da Refatoração 2: `<link da execução>`
  - as fatias seguintes da H3 (CA3, tela de devolução) já usam `transicionar`.
- Revisão: `<link do PR da Refatoração 2>`

> Antes do Trabalho 3, o PR #26 já tinha centralizado os status de `src/repositorio.js` na constante `STATUS`; a Refatoração 2 terminou esse trabalho e passou a usar a mesma constante nas regras.

---

**Limitações e o que ficou de fora:** a revisão do PR #29 apontou pontos ainda não refatorados: restos de SQLite no `db.js` (o fallback sem `DATABASE_URL_TEST` e os testes do ADR 0002 que usam `DATABASE_FILE`), o `limparBanco` sem conferir o nome do banco (o ADR 0002 prevê recusar se o nome não terminar em `_teste`, e a variável prevista era `TEST_DATABASE_URL`, não `DATABASE_URL_TEST`), as colunas `TIMESTAMPTZ` saindo da API como texto ISO em UTC e a configuração de SSL ligada só pelo nome "supabase" na URL.