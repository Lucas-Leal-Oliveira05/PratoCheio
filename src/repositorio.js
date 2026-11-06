import { query } from './db.js';

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [tipo, quantidade, validade]
  );

  return rows[0];
}

export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT * FROM doacoes
     WHERE status = 'disponivel'
     ORDER BY criada_em DESC`
  );

  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await query(
    'SELECT * FROM doacoes WHERE id = $1',
    [Number(id)]
  );

  return rows[0];
}

export async function aceitar(id, ong) {
  const { rows } = await query(
    `UPDATE doacoes
     SET status = 'aceita',
         ong = $1,
         aceita_em = NOW()
     WHERE id = $2
       AND status = 'disponivel'
     RETURNING *`,
    [ong, Number(id)]
  );

  return rows[0];
}

export async function cancelar(id) {
  const { rows } = await query(
    `UPDATE doacoes
     SET status = 'cancelada'
     WHERE id = $1
       AND status = 'disponivel'
     RETURNING *`,
    [Number(id)]
  );

  return rows[0];
}

export async function listarAceitas() {
  const { rows } = await query(
    `SELECT * FROM doacoes
     WHERE status = 'aceita'
     ORDER BY aceita_em DESC`
  );

  return rows;
}