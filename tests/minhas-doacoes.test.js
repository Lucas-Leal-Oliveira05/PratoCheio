// H1 — "o doador acompanha as suas doações".
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function publicar(doador, tipo) {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ doador, tipo, quantidade: '10 unidades', validade: '2099-12-31' });
  return res.body;
}

function minhasDoacoes(doador) {
  return request(app).get(`/api/doadores/${encodeURIComponent(doador)}/doacoes`);
}

describe('H1 · o doador acompanha as suas doações', () => {
  // CA1. Dado que a "Padaria Pão Bom" publicou duas doações e a "Casa Esperança"
  // aceitou uma delas, quando a padaria consulta as suas doações, então vê as
  // duas: uma disponível e outra aceita por Casa Esperança.
  it('mostra ao doador as duas doações, uma disponível e outra aceita pela ONG', async () => {
    const paes = await publicar('Padaria Pão Bom', 'Pão francês');
    const bolos = await publicar('Padaria Pão Bom', 'Bolo de fubá');
    await request(app).post(`/api/doacoes/${bolos.id}/aceitar`).send({ ong: 'Casa Esperança' });

    const res = await minhasDoacoes('Padaria Pão Bom');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const porId = Object.fromEntries(res.body.map(d => [d.id, d]));
    expect(porId[paes.id]).toMatchObject({ tipo: 'Pão francês', status: 'disponivel', ong: null });
    expect(porId[bolos.id]).toMatchObject({ tipo: 'Bolo de fubá', status: 'aceita', ong: 'Casa Esperança' });
  });

  // CA2. Dado que outro doador publicou uma doação, quando a "Padaria Pão Bom"
  // consulta as suas, então essa doação não aparece.
  it('não mostra ao doador as doações de outro doador', async () => {
    await publicar('Mercado Bom Preço', 'Frutas');
    const minha = await publicar('Padaria Pão Bom', 'Pão francês');

    const res = await minhasDoacoes('Padaria Pão Bom');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(minha.id);
  });

  it('encontra as doações mesmo com o nome digitado em outra caixa', async () => {
    await publicar('Padaria Pão Bom', 'Pão francês');

    const res = await minhasDoacoes('padaria pão bom');

    expect(res.body).toHaveLength(1);
  });

  // Decisão 6: as doações publicadas antes do H1 ficam com um doador rótulo.
  it('doação antiga, sem doador, passa a aparecer como "Doador não identificado"', async () => {
    await query(
      `INSERT INTO doacoes (tipo, quantidade, validade) VALUES ($1, $2, $3)`,
      ['Sopa', '10 porções', '2099-12-31']
    );

    await migrar();
    const res = await minhasDoacoes('Doador não identificado');

    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  // CA3. Dado que o doador não é informado na publicação,
  // quando a doação é enviada, então ela é recusada com uma
  // mensagem clara e nada é gravado.
  it('recusa a publicação sem doador e não grava nada', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão francês', quantidade: '40 unidades', validade: '2099-12-31' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('informe o doador (nome do estabelecimento) para publicar a doação');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  it('recusa doador preenchido só com espaços', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão francês', quantidade: '40 unidades', validade: '2099-12-31', doador: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('informe o doador (nome do estabelecimento) para publicar a doação');
  });

  it('grava o doador informado na publicação', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão francês', quantidade: '40 unidades', validade: '2099-12-31', doador: ' Padaria Pão Bom ' });

    expect(res.status).toBe(201);
    expect(res.body.doador).toBe('Padaria Pão Bom');
  });
});
