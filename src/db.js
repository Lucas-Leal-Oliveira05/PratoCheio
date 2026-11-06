// Conexão com o banco. Já vem pronto — não precisa mexer agora.
//
// UNIDADE 1: SQLite, embutido no Node (módulo `node:sqlite`) — nada para instalar.
// UNIDADE 3: este arquivo será refatorado para PostgreSQL. A interface abaixo
//            (`query` devolvendo `{ rows }`) foi desenhada para que a troca fique
//            contida aqui, sem espalhar mudança pelo resto do código.
// `node:sqlite` é módulo embutido do Node 22+. Carregado via createRequire porque
// algumas ferramentas (como o Vite/Vitest) ainda não o reconhecem como embutido.
import { createRequire } from 'node:module';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
 
// Banco exclusivo dos testes: SQLite em memória, que some ao fim da execução.
export const BANCO_DE_TESTE = ':memory:';

// Rodando sob o Vitest, o banco é SEMPRE o de teste: nem DATABASE_FILE, nem
// outro vitest.config, nem a máquina em que roda conseguem trocá-lo (ADR 0002).
function arquivoDoBanco() {
  if (process.env.VITEST) return BANCO_DE_TESTE;
  return process.env.DATABASE_FILE || 'dados.sqlite';
}

let db;
let arquivoEmUso;

export function conexao() {
  if (!db) {
    arquivoEmUso = arquivoDoBanco();
    db = new DatabaseSync(arquivoEmUso);
  }
  return db;
}

/** Qual banco esta conexão está usando (':memory:' nos testes). */
export function bancoEmUso() {
  conexao();
  return arquivoEmUso;
}
 
/**
 * Executa uma consulta e devolve { rows }.
 * Use `?` como marcador de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = ?', [id])
 */
export async function query(sql, valores = []) {
  const stmt = conexao().prepare(sql);
  const ehLeitura = /^\s*(select|with)/i.test(sql) || /returning/i.test(sql);
  if (ehLeitura) return { rows: stmt.all(...valores) };
  const info = stmt.run(...valores);
  return { rows: [], alteradas: info.changes };
}
 
/** Cria o schema, se ainda não existir. Rodado por `npm run db:migrar` e ao subir o servidor. */
export async function migrar() {
  const conn = conexao();
  conn.exec(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo        TEXT NOT NULL,
      quantidade  TEXT NOT NULL,
      validade    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'disponivel',
      ong         TEXT,
      criada_em   TEXT NOT NULL DEFAULT (datetime('now')),
      aceita_em   TEXT
    )
  `);
 
  const colunas = conn.prepare('PRAGMA table_info(doacoes)').all();
  if (!colunas.some((c) => c.name === 'aceita_em')) {
    conn.exec('ALTER TABLE doacoes ADD COLUMN aceita_em TEXT');
  }
}
 
/**
 * Apaga todos os dados. Usado pelos testes.
 * Recusa (lança erro, sem apagar nada) se o banco em uso não for o de teste.
 * É a segunda proteção do ADR 0002, caso a primeira (arquivoDoBanco) seja contornada.
 */
export async function limparBanco() {
  const banco = bancoEmUso();
  if (banco !== BANCO_DE_TESTE) {
    throw new Error(`limparBanco recusado: o banco em uso (${banco}) não é o banco de teste`);
  }
  conexao().exec('DELETE FROM doacoes');
}
 
export async function encerrar() {
  if (db) { db.close(); db = undefined; }
}
 