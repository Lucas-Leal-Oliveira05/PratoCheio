// H3 — "a ONG devolve uma doação aceita".
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function publicar() {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ doador: 'Padaria Pão Bom', tipo: 'Pão francês', quantidade: '40 unidades', validade: '2099-12-31' });
  return res.body;
}

async function publicarEAceitar(ong = 'Casa Esperança') {
  const doacao = await publicar();
  await request(app).post(`/api/doacoes/${doacao.id}/aceitar`).send({ ong });
  return doacao;
}

function devolver(id, ong, motivo) {
  return request(app).post(`/api/doacoes/${id}/devolver`).send({ ong, motivo });
}

describe('H3 · a ONG devolve uma doação aceita', () => {
  // CA1. Dado que a "Casa Esperança" aceitou uma doação, quando ela a devolve
  // com o motivo "sem voluntário hoje", então a doação volta para a lista de
  // disponíveis, sem ONG, e o motivo fica registrado.
  it('devolve a doação aceita: volta para a lista sem ONG e o motivo fica registrado', async () => {
    const doacao = await publicarEAceitar();

    const res = await devolver(doacao.id, 'Casa Esperança', 'sem voluntário hoje');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: doacao.id, status: 'disponivel', ong: null, aceita_em: null });

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ id: doacao.id, status: 'disponivel', ong: null });

    const { rows } = await query('SELECT ong, motivo FROM devolucoes WHERE doacao_id = $1', [doacao.id]);
    expect(rows).toEqual([{ ong: 'Casa Esperança', motivo: 'sem voluntário hoje' }]);
  });

  // CA2. Dado que a doação já foi coletada, quando a ONG tenta devolvê-la,
  // então a devolução é recusada com mensagem.
  it('recusa devolver uma doação já coletada', async () => {
    const doacao = await publicarEAceitar();
    await request(app).post(`/api/doacoes/${doacao.id}/coleta`).send({ voluntario: 'Rui' });

    const res = await devolver(doacao.id, 'Casa Esperança', 'sem voluntário hoje');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('doação já coletada não pode ser devolvida');

    const minhas = await request(app).get(`/api/doadores/${encodeURIComponent('Padaria Pão Bom')}/doacoes`);
    expect(minhas.body[0].status).toBe('coletada');
  });

  it('recusa devolver uma doação que ninguém aceitou', async () => {
    const doacao = await publicar();

    const res = await devolver(doacao.id, 'Casa Esperança', 'sem voluntário hoje');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('só é possível devolver uma doação aceita');
  });

  // Decisão 8: o motivo é obrigatório.
  it('recusa devolver sem motivo e a doação continua aceita', async () => {
    const doacao = await publicarEAceitar();

    const res = await devolver(doacao.id, 'Casa Esperança', '   ');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('informe o motivo da devolução');
    const daOng = await request(app).get(`/api/ongs/${encodeURIComponent('Casa Esperança')}/doacoes`);
    expect(daOng.body).toHaveLength(1);
  });

  it('recusa devolver uma doação que não existe', async () => {
    const res = await devolver(9999, 'Casa Esperança', 'sem voluntário hoje');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('doação não encontrada');
  });
});
