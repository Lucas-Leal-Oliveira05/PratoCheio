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

  // Critério 3 — o limite do "igual à data atual"
  // Dado que o doador está cadastrando uma doação
  // Quando informa a data de hoje como validade
  // Então o sistema recusa, porque hoje ainda não é uma data futura
  it('recusa cadastrar doação com validade igual a hoje', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '5 kg', validade: dataDaqui(0) });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('a validade precisa ser uma data futura');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Critério 3 — o outro lado do limite
  // Dado que o doador está cadastrando uma doação
  // Quando informa amanhã como validade
  // Então a doação é registrada, porque amanhã já é uma data futura
  it('aceita cadastrar doação com validade de amanhã', async () => {
    const amanha = dataDaqui(1);

    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Frutas', quantidade: '3 caixas', validade: amanha });

    // Então
    expect(res.status).toBe(201);
    expect(res.body.validade).toBe(amanha);
  });

  // Critério 1 — Cadastro com informações obrigatórias
  // Dado que o doador tem uma doação com tipo, quantidade e validade
  // Quando confirma o cadastro
  // Então a doação fica registrada com essas informações e disponível para as ONGs
  it('registra a doação com tipo, quantidade e validade informados', async () => {
    const validade = dataDaqui(3);

    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', quantidade: '20 kg', validade });

    // Então
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ tipo: 'Arroz', quantidade: '20 kg', validade, status: 'disponivel' });

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].id).toBe(res.body.id);
  });

  // Critério 2 — Tentativa de cadastro com informações incompletas
  // Dado que o doador está cadastrando uma doação
  // Quando confirma sem informar a quantidade
  // Então o sistema avisa que os dados obrigatórios precisam ser preenchidos
  // e nada é registrado
  it('recusa cadastro sem quantidade e avisa que os campos são obrigatórios', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', validade: dataDaqui(3) });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('tipo, quantidade e validade são obrigatórios');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
});

// Casos que os critérios não previam. A validade é guardada como texto e
// comparada como texto, então só funciona se vier exatamente como 'AAAA-MM-DD'.
describe('cadastrar uma doação: limites e erros', () => {
  // Dado que o doador manda a validade no formato brasileiro
  // Quando confirma o cadastro
  // Então o sistema recusa, em vez de comparar '31/12/2099' com '2026-...' como texto
  it('recusa validade fora do formato AAAA-MM-DD', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Leite', quantidade: '12 litros', validade: '31/12/2099' });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('validade inválida: use uma data real no formato AAAA-MM-DD');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Dado que o doador manda uma data que não existe no calendário
  // Quando confirma o cadastro
  // Então o sistema recusa, mesmo ela estando no formato certo
  it('recusa validade com data que não existe, como 30 de fevereiro', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Leite', quantidade: '12 litros', validade: '2099-02-30' });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('validade inválida: use uma data real no formato AAAA-MM-DD');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Dado que o doador preenche o tipo só com espaços
  // Quando confirma o cadastro
  // Então o sistema trata como campo vazio e recusa
  it('recusa tipo preenchido só com espaços como campo obrigatório vazio', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: '   ', quantidade: '12 litros', validade: dataDaqui(3) });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('tipo, quantidade e validade são obrigatórios');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Dado que a mesma doação é enviada duas vezes
  // Quando as duas chegam
  // Então as duas são registradas como doações separadas (não há deduplicação)
  // e cada uma pode ser aceita por uma ONG diferente
  it('mesma doação enviada duas vezes vira duas doações independentes', async () => {
    const dados = { tipo: 'Sopa', quantidade: '10 porções', validade: dataDaqui(2) };

    // Dado
    const primeira = await request(app).post('/api/doacoes').send(dados);
    // Quando
    const segunda = await request(app).post('/api/doacoes').send(dados);

    // Então
    expect(segunda.status).toBe(201);
    expect(segunda.body.id).not.toBe(primeira.body.id);

    await request(app).post(`/api/doacoes/${primeira.body.id}/aceitar`).send({ ong: 'ONG Mão Amiga' });
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].id).toBe(segunda.body.id);
  });
});
