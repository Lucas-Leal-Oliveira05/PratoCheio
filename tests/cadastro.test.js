// História 1 — "um doador cadastra uma doação informando tipo, quantidade e validade".
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

// Data a `dias` de hoje, no fuso de Brasília (o mesmo que o src/doacoes.js usa).
function dataDaqui(dias) {
  const momento = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(momento);
}

describe('cadastrar uma doação', () => {
  // Critério 3 — Validade inválida (RN13)
  // Dado que o doador está cadastrando uma doação
  // Quando informa uma validade anterior à data de hoje
  // Então o sistema recusa, avisa que a validade precisa ser futura
  // e a doação não aparece para as ONGs
  it('recusa cadastrar doação com validade anterior a hoje', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '5 kg', validade: dataDaqui(-1) });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('a validade precisa ser uma data futura');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
});
