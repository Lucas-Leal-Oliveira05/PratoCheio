// Regras de negócio das doações.
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1.
import * as repo from './repositorio.js';
 
// Doação mockada: por hora não há CRUD completo (edição, remoção, doador
// autenticado etc.) — só o necessário para publicar e a história zero
// funcionar de ponta a ponta. CRUD completo fica para uma próxima iteração.
 
// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade }) {
  if (!tipo || !quantidade || !validade) {
    throw new Error('tipo, quantidade e validade são obrigatórios');
  }
  return repo.inserir({ tipo, quantidade, validade });
}
 
// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}
 
// História zero — "uma ONG aceita uma doação".
//
// Critério 1 (aceite): a doação precisa existir, estar disponível e dentro
// da validade/janela de retirada.
// Critério 2 (exclusividade): se outra ONG já aceitou, o sistema informa
// que a doação não está mais disponível.
// Critério 3 (some da lista): decorre do repositório só listar status
// 'disponivel' — uma vez aceita, ela para de aparecer.
export async function aceitar(id, ong) {
  const doacao = await repo.buscarPorId(id);
 
  if (!doacao) {
    throw new Error('doação não encontrada');
  }
  if (doacao.status !== 'disponivel') {
    throw new Error('doação não está mais disponível');
  }
  if (estaExpirada(doacao.validade)) {
    throw new Error('doação fora da validade');
  }
 
  // Aceite atômico no banco: se, entre a leitura acima e este UPDATE, outra
  // ONG aceitou primeiro, a condição `status = 'disponivel'` do repositório
  // não encontra a linha e devolve undefined — é o mesmo critério 2, só que
  // cobrindo a corrida entre duas requisições simultâneas.
  const atualizada = await repo.aceitar(id, ong);
  if (!atualizada) {
    throw new Error('doação não está mais disponível');
  }
  return atualizada;
}
 
export async function listarHistorico() {
  return repo.listarAceitas();
}
 
function estaExpirada(validade) {
  const hoje = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return validade < hoje;
}