// Regras de negócio das doações.
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1.
import * as repo from './repositorio.js';
 
// Doação mockada: por hora não há CRUD completo (edição, remoção, doador
// autenticado etc.) — só o necessário para publicar e a história zero
// funcionar de ponta a ponta. CRUD completo fica para uma próxima iteração.
 
// História 1 — "um doador cadastra uma doação".
// Critério 2: tipo, quantidade e validade são obrigatórios (RN01).
// Critério 3: a validade precisa ser futura; hoje ou antes é recusado (RN13).
export async function criarDoacao({ tipo, quantidade, validade }) {
  if (!tipo || !quantidade || !validade) {
    throw new Error('tipo, quantidade e validade são obrigatórios');
  }
  if (validade <= hoje()) {
    throw new Error('a validade precisa ser uma data futura');
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

// História — "o doador cancela uma doação ainda disponível".
// Só cancela se nenhuma ONG aceitou: depois do aceite a ONG já conta com ela
// (RN09). Como no aceite, a condição fica no UPDATE do repositório, para não
// perder a corrida entre um cancelamento e um aceite simultâneos.
export async function cancelar(id) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('doação não encontrada');
  }
  const cancelada = await repo.cancelar(id);
  if (!cancelada) {
    throw new Error('só é possível cancelar uma doação ainda disponível');
  }
  return cancelada;
}

export async function listarHistorico() {
  return repo.listarAceitas();
}
 
function estaExpirada(validade) {
  return validade < hoje();
}

// 'YYYY-MM-DD' no fuso de Brasília, mesmo formato que o <input type="date"> manda.
// Antes era toISOString(), que dá a data em UTC: depois das 21h aqui já é o dia
// seguinte, e uma doação com validade para amanhã seria recusada como "hoje".
function hoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}