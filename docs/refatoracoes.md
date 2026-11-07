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

## Refatoração 2 — Eliminação de magic strings de status

- **Cheiro de código atacado:** os valores de status (`'disponivel'`, `'aceita'`, `'cancelada'`) apareciam como texto solto dentro do SQL de `src/repositorio.js`, repetidos em várias consultas.
- **Dor concreta:** para renomear um status ou criar um novo (por exemplo `expirada`), era preciso caçar cada ocorrência no SQL. Esquecer uma gerava consultas inconsistentes, sem nenhum erro visível.
- **O que mudou:** os status foram centralizados na constante `STATUS`, usada em `listarDisponiveis`, `aceitar` e `cancelar` (PR #26, commit "corrige consultas de status"). Ainda restam literais em `listarAceitas` e no `AND status = 'disponivel'` do `cancelar`, a concluir antes do Trabalho 3.
- **Evidência (testes verdes antes e depois):**
  - antes: 25 passando — CI #30: https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions/runs/41143273956
  - depois: 25 passando — CI #31: https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions/runs/42143109920

---

**Limitações e o que ficou de fora:** a revisão do PR #29 apontou pontos que não foram refatorados nesta entrega: restos de SQLite no `db.js`, o `limparBanco` sem conferir o nome do banco (o ADR 0002 prevê recusar se o nome não terminar em `_teste`, e a variável prevista era `TEST_DATABASE_URL`, não `DATABASE_URL_TEST`), o formato `Date` das colunas `TIMESTAMPTZ` e a configuração de SSL. Ficam registrados para o Trabalho 3.