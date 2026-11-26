// H4 — "a Marta vê o resultado do mês".
//
// Datas controladas: as doações entram direto no banco de teste com horários
// fixos de 2025 e a consulta recebe o mês por parâmetro. Nada aqui depende do
// dia em que o teste roda.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function doacao({ publicada, aceita = null, coletada = null, status }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade, doador, status, ong, voluntario, criada_em, aceita_em, coletada_em)
     VALUES ('Pão francês', '40 unidades', '2025-12-31', 'Padaria Pão Bom', $1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [status, aceita ? 'Casa Esperança' : null, coletada ? 'Rui' : null, publicada, aceita, coletada]
  );
  return rows[0].id;
}

function resultado(mes) {
  return request(app).get(`/api/resultado?mes=${mes}`);
}

describe('H4 · a Marta vê o resultado do mês', () => {
  // CA1. Dado que, em novembro, 3 doações foram publicadas, 2 aceitas e 1
  // coletada 5 horas depois de publicada, quando a Marta consulta o resultado
  // de novembro, então vê 3 publicadas, 2 aceitas, 1 coletada e tempo médio
  // até a coleta: 5 h.
  it('mostra 3 publicadas, 2 aceitas, 1 coletada e tempo médio de 5 h em novembro', async () => {
    await doacao({ status: 'coletada', publicada: '2025-11-10T08:00:00-03:00', aceita: '2025-11-10T09:00:00-03:00', coletada: '2025-11-10T13:00:00-03:00' });
    await doacao({ status: 'aceita', publicada: '2025-11-12T10:00:00-03:00', aceita: '2025-11-12T11:00:00-03:00' });
    await doacao({ status: 'disponivel', publicada: '2025-11-20T15:00:00-03:00' });
    await doacao({ status: 'disponivel', publicada: '2025-10-15T10:00:00-03:00' });
    await doacao({ status: 'disponivel', publicada: '2025-12-01T10:00:00-03:00' });

    const res = await resultado('2025-11');

    expect(res.status).toBe(200);
    expect(res.body.publicadas).toBe(3);
    expect(res.body.aceitas).toBe(2);
    expect(res.body.coletadas).toBe(1);
    expect(res.body.tempo_medio_horas).toBe(5);
    expect(res.body.tempo_medio_ate_coleta).toBe('5 h');
  });

  // CA2. Dado um mês sem nenhuma coleta, quando a Marta consulta o resultado,
  // então o tempo médio aparece como "sem coletas no mês" — não como zero,
  // nem como erro.
  it('mostra "sem coletas no mês" no tempo médio quando nada foi coletado', async () => {
    await doacao({ status: 'aceita', publicada: '2025-12-05T10:00:00-03:00', aceita: '2025-12-05T11:00:00-03:00' });

    const res = await resultado('2025-12');

    expect(res.status).toBe(200);
    expect(res.body.publicadas).toBe(1);
    expect(res.body.coletadas).toBe(0);
    expect(res.body.tempo_medio_horas).toBeNull();
    expect(res.body.tempo_medio_ate_coleta).toBe('sem coletas no mês');
  });

  it('mês sem nenhuma doação mostra zeros e "sem coletas no mês"', async () => {
    const res = await resultado('2025-08');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ publicadas: 0, aceitas: 0, coletadas: 0, devolvidas: 0, tempo_medio_ate_coleta: 'sem coletas no mês' });
  });

  // CA3. Dado uma doação publicada em 31/10 e coletada em 01/11, quando a
  // Marta consulta novembro, então o grupo decide em que mês ela conta.
  // Decisão 9: conta no mês da publicação (outubro), no fuso de Brasília.
  it('doação publicada em 31/10 e coletada em 01/11 conta em outubro, o mês da publicação', async () => {
    await doacao({ status: 'coletada', publicada: '2025-10-31T22:00:00-03:00', aceita: '2025-10-31T22:30:00-03:00', coletada: '2025-11-01T03:00:00-03:00' });

    const novembro = await resultado('2025-11');
    const outubro = await resultado('2025-10');

    expect(novembro.body).toMatchObject({ publicadas: 0, coletadas: 0, tempo_medio_ate_coleta: 'sem coletas no mês' });
    expect(outubro.body).toMatchObject({ publicadas: 1, coletadas: 1, tempo_medio_horas: 5, tempo_medio_ate_coleta: '5 h' });
  });

  // Decisão 9: horas com uma casa decimal, arredondando a metade para cima.
  it('arredonda o tempo médio para uma casa decimal: 5 h e 6 h20 dão 5,7 h', async () => {
    await doacao({ status: 'coletada', publicada: '2025-11-03T08:00:00-03:00', aceita: '2025-11-03T08:30:00-03:00', coletada: '2025-11-03T13:00:00-03:00' });
    await doacao({ status: 'coletada', publicada: '2025-11-04T08:00:00-03:00', aceita: '2025-11-04T08:30:00-03:00', coletada: '2025-11-04T14:20:00-03:00' });

    const res = await resultado('2025-11');

    expect(res.body.tempo_medio_horas).toBe(5.7);
    expect(res.body.tempo_medio_ate_coleta).toBe('5,7 h');
  });

  // Decisão 9: a devolvida que voltou para a lista conta como publicada e
  // como devolvida, mas não como aceita.
  it('conta a doação devolvida à parte e não como aceita', async () => {
    const id = await doacao({ status: 'disponivel', publicada: '2025-11-06T09:00:00-03:00' });
    await query(
      `INSERT INTO devolucoes (doacao_id, ong, motivo, devolvida_em) VALUES ($1, $2, $3, $4)`,
      [id, 'Casa Esperança', 'sem voluntário hoje', '2025-11-06T12:00:00-03:00']
    );

    const res = await resultado('2025-11');

    expect(res.body).toMatchObject({ publicadas: 1, aceitas: 0, devolvidas: 1 });
  });

  it('a doação coletada continua no histórico de aceites da coordenação', async () => {
    await doacao({ status: 'coletada', publicada: '2025-11-10T08:00:00-03:00', aceita: '2025-11-10T09:00:00-03:00', coletada: '2025-11-10T13:00:00-03:00' });

    const res = await request(app).get('/api/doacoes/historico');

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ status: 'coletada', ong: 'Casa Esperança' });
  });

  it('recusa um mês fora do formato AAAA-MM', async () => {
    const res = await resultado('11-2025');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('informe o mês no formato AAAA-MM');
  });
});
