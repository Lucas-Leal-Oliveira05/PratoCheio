// H2 — "o voluntário confirma a coleta".
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function publicar() {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ doador: 'Padaria Pão Bom', tipo: 'Pão francês', quantidade: '40 unidades', validade: '2099-12-31' });
  return res.body;
}

async function publicarEAceitar() {
  const doacao = await publicar();
  await request(app).post(`/api/doacoes/${doacao.id}/aceitar`).send({ ong: 'Casa Esperança' });
  return doacao;
}

function confirmarColeta(id, voluntario) {
  return request(app).post(`/api/doacoes/${id}/coleta`).send({ voluntario });
}

describe('H2 · o voluntário confirma a coleta', () => {
  // CA1. Dado que a "Casa Esperança" aceitou uma doação, quando o voluntário
  // "Rui" confirma a coleta, então ela passa a coletada, com o nome do
  // voluntário e o horário da coleta.
  it('confirma a coleta de uma doação aceita, com o voluntário e o horário', async () => {
    const doacao = await publicarEAceitar();
    const antes = Date.now();

    const res = await confirmarColeta(doacao.id, 'Rui');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: doacao.id, status: 'coletada', voluntario: 'Rui', ong: 'Casa Esperança' });
    const coletadaEm = new Date(res.body.coletada_em).getTime();
    expect(coletadaEm >= antes - 60_000 && coletadaEm <= Date.now() + 60_000).toBe(true);
  });

  // CA2. Dado que a doação ainda está disponível, quando alguém tenta
  // confirmar a coleta, então a confirmação é recusada com mensagem e a
  // doação não muda.
  it('recusa confirmar a coleta de uma doação ainda disponível e não muda a doação', async () => {
    const doacao = await publicar();

    const res = await confirmarColeta(doacao.id, 'Rui');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('a doação ainda não foi aceita por uma ONG: não há coleta para confirmar');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ id: doacao.id, status: 'disponivel', voluntario: null, coletada_em: null });
  });

  // CA3. Dado que a doação foi coletada, quando o doador consulta as suas
  // doações (H1), então ela aparece como coletada.
  it('a doação coletada aparece como coletada para o doador', async () => {
    const doacao = await publicarEAceitar();
    await confirmarColeta(doacao.id, 'Rui');

    const res = await request(app).get(`/api/doadores/${encodeURIComponent('Padaria Pão Bom')}/doacoes`);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: doacao.id, status: 'coletada', ong: 'Casa Esperança' });
    expect(res.body[0].coletada_em).toBeTruthy();
  });

  // Decisão 7: confirmar duas vezes é recusado, e a primeira confirmação vale.
  it('recusa confirmar duas vezes a mesma coleta e mantém o horário da primeira', async () => {
    const doacao = await publicarEAceitar();
    const primeira = await confirmarColeta(doacao.id, 'Rui');

    const segunda = await confirmarColeta(doacao.id, 'Ana');

    expect(segunda.status).toBe(400);
    expect(segunda.body.erro).toBe('a coleta desta doação já foi confirmada');
    const minhas = await request(app).get(`/api/doadores/${encodeURIComponent('Padaria Pão Bom')}/doacoes`);
    expect(minhas.body[0].coletada_em).toBe(primeira.body.coletada_em);
  });

  // Decisão 7: o nome do voluntário é obrigatório.
  it('recusa confirmar a coleta sem o nome do voluntário', async () => {
    const doacao = await publicarEAceitar();

    const res = await confirmarColeta(doacao.id, '  ');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('informe o nome do voluntário que buscou a doação');
  });

  // Decisão 7: o nome do voluntário é dado pessoal e não vai para o doador.
  it('não mostra ao doador o nome do voluntário', async () => {
    const doacao = await publicarEAceitar();
    await confirmarColeta(doacao.id, 'Rui');

    const res = await request(app).get(`/api/doadores/${encodeURIComponent('Padaria Pão Bom')}/doacoes`);

    expect(res.body[0].voluntario).toBeUndefined();
  });

  it('lista para o voluntário só as doações aceitas pela ONG dele e ainda não coletadas', async () => {
    const daCasa = await publicarEAceitar();
    const jaColetada = await publicarEAceitar();
    await confirmarColeta(jaColetada.id, 'Rui');
    const deOutra = await publicar();
    await request(app).post(`/api/doacoes/${deOutra.id}/aceitar`).send({ ong: 'Cozinha Solidária' });
    await publicar();

    const res = await request(app).get(`/api/ongs/${encodeURIComponent('Casa Esperança')}/doacoes`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(daCasa.id);
  });

  it('recusa confirmar a coleta de uma doação que não existe', async () => {
    const res = await confirmarColeta(9999, 'Rui');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('doação não encontrada');
  });
});
