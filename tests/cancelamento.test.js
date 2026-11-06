// História — "o doador cancela uma doação ainda disponível".
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function publicarDoacao() {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2099-12-31' });
  return res.body;
}

describe('doador cancela uma doação', () => {
  // Dado que o doador publicou uma doação que ainda está disponível
  // Quando ele cancela a doação
  // Então ela fica cancelada e deixa de aparecer para as ONGs
  it('cancela doação disponível e a tira da lista', async () => {
    const doacao = await publicarDoacao();

    const res = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelada');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Dado que uma ONG já aceitou a doação
  // Quando o doador tenta cancelá-la
  // Então o sistema recusa e a doação continua aceita pela ONG
  it('recusa cancelar doação já aceita por uma ONG', async () => {
    const doacao = await publicarDoacao();
    await request(app).post(`/api/doacoes/${doacao.id}/aceitar`).send({ ong: 'ONG Mão Amiga' });

    const res = await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/ainda disponível/);

    const historico = await request(app).get('/api/doacoes/historico');
    expect(historico.body[0].ong).toBe('ONG Mão Amiga');
  });

  // Dado que o doador cancelou uma doação
  // Quando uma ONG tenta aceitá-la
  // Então o sistema recusa o aceite
  it('ONG não consegue aceitar uma doação cancelada', async () => {
    const doacao = await publicarDoacao();
    await request(app).post(`/api/doacoes/${doacao.id}/cancelar`);

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Mão Amiga' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não está mais disponível/);
  });

  it('recusa cancelar doação que não existe', async () => {
    const res = await request(app).post('/api/doacoes/9999/cancelar');
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada/);
  });
});
