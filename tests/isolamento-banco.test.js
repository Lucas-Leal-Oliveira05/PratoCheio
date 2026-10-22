// História 4b — "os testes não conseguem apagar nem alterar dados de um banco
// que não seja o de teste, seja qual for a máquina ou a configuração."
//
// Contexto: no piloto, os testes rodaram com a configuração apontando para o
// banco real e limparBanco() apagou todas as doações. Estes testes reproduzem
// essa situação em um processo Node separado, com um arquivo SQLite temporário
// fazendo o papel do banco real do piloto.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bancoEmUso, BANCO_DE_TESTE } from '../src/db.js';

const URL_DB = pathToFileURL(join(import.meta.dirname, '..', 'src', 'db.js')).href;

// Roda `codigo` (ESM, com `db` = módulo src/db.js) num Node novo, só com as
// variáveis de ambiente indicadas, e devolve o JSON da última linha impressa.
function rodarNode(codigo, env) {
  const ambiente = { PATH: process.env.PATH, URL_DB, ...env };
  if (process.env.SYSTEMROOT) ambiente.SYSTEMROOT = process.env.SYSTEMROOT; // exigido no Windows
  const script = `const db = await import(process.env.URL_DB);\n${codigo}`;
  const saida = execFileSync(
    process.execPath,
    ['--no-warnings', '--input-type=module', '-e', script],
    { env: ambiente, encoding: 'utf8' }
  );
  return JSON.parse(saida.trim().split('\n').pop());
}

// Cria o "banco real do piloto" com uma doação cadastrada.
const CRIAR_BANCO_REAL = `
  await db.migrar();
  await db.query("INSERT INTO doacoes (tipo, quantidade, validade) VALUES ('Sopa', '10 porções', '2099-12-31')");
  await db.encerrar();
  console.log('{}');
`;

const CONTAR = `
  const { rows } = await db.query('SELECT COUNT(*) AS n FROM doacoes');
  console.log(JSON.stringify({ n: rows[0].n }));
`;

let pasta;
let bancoReal;

beforeEach(() => {
  pasta = mkdtempSync(join(tmpdir(), 'pratocheio-'));
  bancoReal = join(pasta, 'piloto.sqlite');
});
afterEach(() => rmSync(pasta, { recursive: true, force: true }));

describe('isolamento do banco de teste', () => {
  it('nesta execução de testes o banco em uso é o de teste', () => {
    expect(bancoEmUso()).toBe(BANCO_DE_TESTE);
  });

  // Dado que a configuração da máquina aponta DATABASE_FILE para o banco real
  // Quando os testes rodam (sob o Vitest) e limpam o banco
  // Então eles usam o banco de teste e as doações do banco real continuam lá
  it('ignora DATABASE_FILE quando roda sob o Vitest', () => {
    rodarNode(CRIAR_BANCO_REAL, { DATABASE_FILE: bancoReal });

    const r = rodarNode(`
      await db.migrar();
      await db.limparBanco();
      console.log(JSON.stringify({ banco: db.bancoEmUso() }));
    `, { DATABASE_FILE: bancoReal, VITEST: 'true' });

    expect(r.banco).toBe(BANCO_DE_TESTE);
    expect(rodarNode(CONTAR, { DATABASE_FILE: bancoReal }).n).toBe(1);
  });

  // Dado que o banco em uso não é o de teste
  // Quando a limpeza é chamada
  // Então ela falha e nenhuma doação é apagada
  it('limparBanco() recusa um banco que não é o de teste e não apaga nada', () => {
    rodarNode(CRIAR_BANCO_REAL, { DATABASE_FILE: bancoReal });

    const r = rodarNode(`
      let erro = null;
      try { await db.limparBanco(); } catch (e) { erro = e.message; }
      console.log(JSON.stringify({ erro }));
    `, { DATABASE_FILE: bancoReal });

    expect(r.erro).toMatch(/não é o banco de teste/);
    expect(rodarNode(CONTAR, { DATABASE_FILE: bancoReal }).n).toBe(1);
  });

  it('sob o Vitest, nenhum arquivo de banco é criado no caminho de DATABASE_FILE', () => {
    rodarNode(`
      await db.migrar();
      await db.query("INSERT INTO doacoes (tipo, quantidade, validade) VALUES ('Pão', '5 kg', '2099-12-31')");
      console.log('{}');
    `, { DATABASE_FILE: bancoReal, VITEST: 'true' });

    expect(existsSync(bancoReal)).toBe(false);
  });
});
