import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';
 
const app = criarApp();
 
// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
 
// ---------------------------------------------------------------------------
// Backlog de testes do walking skeleton.
// Cada `it.todo` é um critério de aceite ainda não implementado — o CI não
// falha por causa deles. À medida que o grupo implementa, troque `it.todo`
// por um `it` de verdade (veja o exemplo comentado no fim do arquivo).
//
// Os testes abaixo usam o banco — que na Unidade 1 é SQLite em memória:
// nada a instalar, nada a subir.
// ---------------------------------------------------------------------------
 
beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });
 
// Data no futuro, para não esbarrar no critério de validade nos testes que
// não são sobre expiração.
const VALIDADE_FUTURA = '2099-12-31';
 
// Helper: publica uma doação e devolve a linha criada (id incluso).
async function publicarDoacao(overrides = {}) {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ tipo: 'Sopa', quantidade: '10 porções', validade: VALIDADE_FUTURA, ...overrides });
  return res.body;
}
 
describe('publicar e listar doações', () => {
  // Dado que um doador publicou uma doação
  // Quando uma ONG consulta as doações disponíveis
  // Então a doação aparece na lista
  it('mostra a doação publicada na lista de disponíveis', async () => {
    await publicarDoacao({ tipo: 'Sopa' });
 
    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });
 
  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa' });
 
    expect(res.status).toBe(400);
  });
});
 
describe('aceitar uma doação', () => {
  // Critério 1 — Aceite de uma doação disponível
  // Dado que existe uma doação disponível e dentro da validade
  // Quando o representante da ONG confirmar o aceite da doação
  // Então a doação deve ser reservada para essa ONG
  it('marca a doação como aceita pela ONG', async () => {
    const doacao = await publicarDoacao();
 
    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Mão Amiga' });
 
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Mão Amiga');
  });
 
  // Critério 3 — Doação aceita deixa de estar disponível
  // Dado que uma ONG aceitou uma doação disponível
  // Quando outra ONG acessar a lista de doações disponíveis
  // Então a doação aceita não deve aparecer como disponível para novo aceite
  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const doacao = await publicarDoacao();
 
    await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Mão Amiga' });
 
    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
 
  // Critério 2 — Exclusividade da doação
  // Dado que uma doação já foi aceita por uma ONG
  // Quando outra ONG tentar aceitar essa mesma doação
  // Então o sistema deve informar que a doação não está mais disponível
  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const doacao = await publicarDoacao();
 
    await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Mão Amiga' });
 
    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Segunda Chance' });
 
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não está mais disponível/);
  });
 
  it('recusa aceitar uma doação que não existe', async () => {
    const res = await request(app)
      .post('/api/doacoes/9999/aceitar')
      .send({ ong: 'ONG Mão Amiga' });
 
    expect(res.status).toBe(400);
  });
 
  it('recusa aceitar uma doação fora da validade', async () => {
    const doacao = await publicarDoacao({ validade: '2000-01-01' });
 
    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Mão Amiga' });
 
    expect(res.status).toBe(400);
  });
});
