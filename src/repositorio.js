// Camada de dados do Prato Cheio — acesso ao banco.
// TODO (grupo): implementar as quatro funções abaixo usando query().
// A conexão e o schema já estão prontos em src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';
 
// Insere a doação e devolve a linha criada.
export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *`,
    [tipo, quantidade, validade]
  );
  return rows[0];
}
 
// Devolve apenas as doações com status 'disponivel'.
export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY criada_em DESC`
  );
  return rows;
}
 
// Busca uma doação pelo id. Devolve undefined se não existir.
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [Number(id)]);
  return rows[0];
}
 
// Marca a doação como aceita pela ONG e devolve a linha atualizada.
// A condição `AND status = 'disponivel'` no WHERE garante a exclusividade:
// o UPDATE só afeta linha nenhuma se a doação já tiver sido aceita por outra
// ONG entre o momento em que ela foi lida e o momento do aceite — sem essa
// condição, duas requisições concorrentes poderiam "ganhar" a mesma doação.
export async function aceitar(id, ong) {
  const { rows } = await query(
    `UPDATE doacoes SET status = 'aceita', ong = ?, aceita_em = datetime('now')
     WHERE id = ? AND status = 'disponivel'
     RETURNING *`,
    [ong, Number(id)]
  );
  return rows[0];
}
 
export async function listarAceitas() {
  const { rows } = await query(
    `SELECT * FROM doacoes WHERE status = 'aceita' ORDER BY aceita_em DESC`
  );
  return rows;
}