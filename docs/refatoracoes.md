# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** (o que a decidiu — ver o ADR da Unidade 2)
- **O que mudou:** (arquivos e o que neles)
- **O que NÃO mudou:** (as regras de negócio? as rotas? os testes?)
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: ___ passando
  - testes depois da mudança: ___ passando
  - link da execução do CI verde:

## Refatoração 2 — Eliminação de Magic Strings.

- **Cheiro de código atacado:** Valores de status ("disponivel", "aceita" e "cancelada") apareciam repetidos em diversas consultas no banco.
- **Qual dor concreta isso resolvia:** Caso fosse necessário alterar um status, seria preciso procurar todas as ocorrências no código, aumentando a chance de erros e inconsistências.
- **O que mudou:** Os status foram centralizados em constantes reutilizáveis.
- **Evidência (testes verdes antes e depois):** Todos os testes permaneceram verdes antes e depois da alteração.

---

**Limitações e o que ficou de fora:** (o que vocês viram e decidiram não refatorar, e por quê)
