export default {
  test: {
    // O banco dos testes NÃO depende desta configuração: src/db.js usa sempre
    // SQLite em memória quando roda sob o Vitest, e limparBanco() recusa
    // qualquer outro banco (ADR 0002). Por isso não há DATABASE_FILE aqui.
  }
};
