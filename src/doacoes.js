// Regras de negócio das doações.
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1.
import * as repo from './repositorio.js';
import { STATUS } from './repositorio.js';
 
// Doação mockada: por hora não há CRUD completo (edição, remoção, doador
// autenticado etc.) — só o necessário para publicar e a história zero
// funcionar de ponta a ponta. CRUD completo fica para uma próxima iteração.
 
// História 1 — "um doador cadastra uma doação".
// Critério 2: tipo, quantidade e validade são obrigatórios (RN01).
// Critério 3: a validade precisa ser futura; hoje ou antes é recusado (RN13).
export async function criarDoacao(dados) {
  const tipo = semEspacos(dados.tipo);
  const quantidade = semEspacos(dados.quantidade);
  const validade = semEspacos(dados.validade);

  if (!tipo || !quantidade || !validade) {
    throw new Error('tipo, quantidade e validade são obrigatórios');
  }
  // A validade é comparada como texto logo abaixo, então tem que ser uma data
  // de verdade em 'AAAA-MM-DD'. Sem isso, '31/12/2099' passava por futura e
  // '2099-02-30' era aceita.
  if (!ehDataValida(validade)) {
    throw new Error('validade inválida: use uma data real no formato AAAA-MM-DD');
  }
  if (validade <= hoje()) {
    throw new Error('a validade precisa ser uma data futura');
  }
  // H1 — CA3: sem doador a doação não tem a quem pertencer.
  const doador = semEspacos(dados.doador);
  if (!doador) {
    throw new Error('informe o doador (nome do estabelecimento) para publicar a doação');
  }
  return repo.inserir({ tipo, quantidade, validade, doador });
}
 
// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}
 
// Decisão 5 do docs/projeto.md: de qual estado cada operação parte e o que
// responder quando a doação está em outro. `padrao` vale para qualquer
// estado que não tenha mensagem própria.
const TRANSICOES = {
  aceitar: {
    de: STATUS.DISPONIVEL,
    recusas: { padrao: 'doação não está mais disponível' }
  },
  cancelar: {
    de: STATUS.DISPONIVEL,
    recusas: { padrao: 'só é possível cancelar uma doação ainda disponível' }
  },
  coletar: {
    de: STATUS.ACEITA,
    recusas: {
      [STATUS.COLETADA]: 'a coleta desta doação já foi confirmada',
      padrao: 'a doação ainda não foi aceita por uma ONG: não há coleta para confirmar'
    }
  },
  devolver: {
    de: STATUS.ACEITA,
    recusas: {
      [STATUS.COLETADA]: 'doação já coletada não pode ser devolvida',
      padrao: 'só é possível devolver uma doação aceita'
    }
  }
};

async function buscarParaTransicao(id, operacao) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('doação não encontrada');
  }

  const { de, recusas } = TRANSICOES[operacao];
  if (doacao.status !== de) {
    throw new Error(recusas[doacao.status] ?? recusas.padrao);
  }
  return doacao;
}

// O UPDATE de cada operação repete a condição de estado. Se ele não acha a
// linha, outra requisição mudou a doação entre a leitura e a escrita: lemos
// de novo para responder com a mensagem do estado atual.
async function transicionar(id, operacao, gravar) {
  const doacao = await buscarParaTransicao(id, operacao);
  const atualizada = await gravar(doacao);
  if (!atualizada) {
    await buscarParaTransicao(id, operacao);
    throw new Error(TRANSICOES[operacao].recusas.padrao);
  }
  return atualizada;
}

// História zero — "uma ONG aceita uma doação".
// Critério 1: a doação precisa existir, estar disponível e dentro da validade.
// Critério 2: se outra ONG já aceitou, informa que não está mais disponível,
// inclusive quando as duas chegam ao mesmo tempo (condição no UPDATE).
// Critério 3: o repositório só lista 'disponivel', então a aceita some.
export async function aceitar(id, ong) {
  return transicionar(id, 'aceitar', async doacao => {
    if (estaExpirada(doacao.validade)) {
      throw new Error('doação fora da validade');
    }
    return repo.aceitar(id, ong);
  });
}

// O doador só cancela enquanto nenhuma ONG aceitou (decisão 4, RN09).
export async function cancelar(id) {
  return transicionar(id, 'cancelar', () => repo.cancelar(id));
}

// H2 — o voluntário confirma que buscou a doação. Confirmar de novo é
// recusado, para não sobrescrever o horário da primeira coleta (decisão 7).
export async function confirmarColeta(id, voluntario) {
  const nome = semEspacos(voluntario);
  if (!nome) {
    throw new Error('informe o nome do voluntário que buscou a doação');
  }
  return transicionar(id, 'coletar', () => repo.confirmarColeta(id, nome));
}

// H3 — a ONG devolve uma doação que aceitou e não vai conseguir buscar.
// Só quem aceitou devolve (CA3); o motivo é obrigatório (decisão 8).
export async function devolver(id, ong, motivo) {
  const ongInformada = semEspacos(ong);
  if (!ongInformada) {
    throw new Error('informe a ONG que está devolvendo a doação');
  }
  const motivoInformado = semEspacos(motivo);
  if (!motivoInformado) {
    throw new Error('informe o motivo da devolução');
  }
  return transicionar(id, 'devolver', doacao => {
    if (doacao.ong.toLowerCase() !== ongInformada.toLowerCase()) {
      throw new Error('só a ONG que aceitou a doação pode devolvê-la');
    }
    return repo.devolver(id, doacao.ong, motivoInformado);
  });
}

// H4 — a Marta vê o resultado do mês (decisão 9).
export async function resultadoDoMes(mes) {
  if (typeof mes !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new Error('informe o mês no formato AAAA-MM');
  }

  const numeros = await repo.resultadoDoMes(mes);
  const horas = numeros.tempo_medio_horas;
  return {
    mes,
    ...numeros,
    tempo_medio_ate_coleta: horas === null
      ? 'sem coletas no mês'
      : `${horas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`
  };
}

export async function listarAceitasPelaOng(ong) {
  const nome = semEspacos(ong);
  if (!nome) {
    throw new Error('informe o nome da ONG');
  }
  return repo.listarAceitasPelaOng(nome);
}

// H1 — o doador vê as doações que publicou e a situação de cada uma.
export async function listarDoDoador(doador) {
  const nome = semEspacos(doador);
  if (!nome) {
    throw new Error('informe o doador (nome do estabelecimento)');
  }
  return repo.listarDoDoador(nome);
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

// '2099-02-30' tem o formato certo, mas o Date "conserta" para 2 de março;
// por isso a volta para texto tem que bater com o que chegou.
function ehDataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

function semEspacos(valor) {
  return typeof valor === 'string' ? valor.trim() : valor;
}