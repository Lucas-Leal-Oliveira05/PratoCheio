import { query } from './db.js';
 

export const STATUS = Object.freeze({
  DISPONIVEL: 'disponivel',
  ACEITA: 'aceita',
  COLETADA: 'coletada',
  CANCELADA: 'cancelada'
});

// Insere a doação e devolve a linha criada.
export async function inserir({ tipo, quantidade, validade, doador }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade, doador)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tipo, quantidade, validade, doador]
  );

  return rows[0];
}

export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT * FROM doacoes WHERE status = '${STATUS.DISPONIVEL}' ORDER BY criada_em DESC`
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
     SET status = '${STATUS.ACEITA}',
         ong = $1,
         aceita_em = NOW()
     WHERE id = $2
       AND status = '${STATUS.DISPONIVEL}'
     RETURNING *`,
    [ong, Number(id)]
  );

  return rows[0];
}

export async function cancelar(id) {
  const { rows } = await query(
    `UPDATE doacoes SET status = '${STATUS.CANCELADA}'
     WHERE id = ? AND status = '${STATUS.DISPONIVEL}'
     RETURNING *`,
    [Number(id)]
  );

  return rows[0];
}

export async function listarAceitas() {
  const { rows } = await query(
    `SELECT * FROM doacoes
     WHERE status = '${STATUS.ACEITA}'
     ORDER BY aceita_em DESC`
  );

  return rows;
}

export async function confirmarColeta(id, voluntario) {
  const { rows } = await query(
    `UPDATE doacoes
     SET status = '${STATUS.COLETADA}',
         voluntario = $1,
         coletada_em = NOW()
     WHERE id = $2
       AND status = '${STATUS.ACEITA}'
     RETURNING *`,
    [voluntario, Number(id)]
  );

  return rows[0];
}

// A doação volta inteira para a lista (sem ONG nem data de aceite) e quem
// devolveu, com o motivo, fica só na tabela de devoluções. As duas escritas
// vão no mesmo comando para não existir devolução sem registro.
export async function devolver(id, ong, motivo) {
  const { rows } = await query(
    `WITH devolvida AS (
       UPDATE doacoes
       SET status = '${STATUS.DISPONIVEL}',
           ong = NULL,
           aceita_em = NULL
       WHERE id = $1
         AND status = '${STATUS.ACEITA}'
         AND lower(ong) = lower($2)
       RETURNING *
     ), registro AS (
       INSERT INTO devolucoes (doacao_id, ong, motivo)
       SELECT id, $2, $3 FROM devolvida
     )
     SELECT * FROM devolvida`,
    [Number(id), ong, motivo]
  );

  return rows[0];
}

export async function listarAceitasPelaOng(ong) {
  const { rows } = await query(
    `SELECT * FROM doacoes
     WHERE status = '${STATUS.ACEITA}'
       AND lower(ong) = lower($1)
     ORDER BY aceita_em`,
    [ong]
  );

  return rows;
}

export async function listarDoDoador(doador) {
  const { rows } = await query(
    `SELECT id, tipo, quantidade, validade, status, ong, doador, criada_em, aceita_em, coletada_em
     FROM doacoes
     WHERE lower(doador) = lower($1)
     ORDER BY criada_em DESC, id DESC`,
    [doador]
  );

  return rows;
}